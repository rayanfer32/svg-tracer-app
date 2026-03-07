import React, { useEffect, useRef } from 'react';
import { toCanvas } from 'html-to-image';
import { Sidebar } from '../components/Sidebar';
import { useTracerStore } from '../store/useTracerStore';
import { easeFunctions } from '../utils/constants';

export default function SvgTracer() {
    // Use selectors to avoid re-rendering on every store update (especially currentTime)
    const activeTab = useTracerStore(s => s.activeTab);
    const svgContent = useTracerStore(s => s.svgContent);
    const overlayImage = useTracerStore(s => s.overlayImage);
    const overlayPos = useTracerStore(s => s.overlayPos);
    const setOverlayPos = useTracerStore(s => s.setOverlayPos);
    const isDragging = useTracerStore(s => s.isDragging);
    const setIsDragging = useTracerStore(s => s.setIsDragging);
    const isResizing = useTracerStore(s => s.isResizing);
    const setIsResizing = useTracerStore(s => s.setIsResizing);
    const dragStart = useTracerStore(s => s.dragStart);
    const setDragStart = useTracerStore(s => s.setDragStart);
    const resizeStart = useTracerStore(s => s.resizeStart);
    const setResizeStart = useTracerStore(s => s.setResizeStart);
    const isPlaying = useTracerStore(s => s.isPlaying);
    const setIsPlaying = useTracerStore(s => s.setIsPlaying);
    const isStopped = useTracerStore(s => s.isStopped);
    const setIsStopped = useTracerStore(s => s.setIsStopped);
    const isRecording = useTracerStore(s => s.isRecording);
    const setIsRecording = useTracerStore(s => s.setIsRecording);
    const setRecordingProgress = useTracerStore(s => s.setRecordingProgress);
    const animationKey = useTracerStore(s => s.animationKey);
    const setCurrentTime = useTracerStore(s => s.setCurrentTime);
    const totalDuration = useTracerStore(s => s.totalDuration);
    const setTotalDuration = useTracerStore(s => s.setTotalDuration);
    const config = useTracerStore(s => s.config);
    const updateConfig = useTracerStore(s => s.updateConfig);

    const isRecordingRef = useRef<boolean>(false);
    const svgContainerRef = useRef<HTMLDivElement>(null);
    const previewAreaRef = useRef<HTMLDivElement>(null);
    const vTracerCanvasRef = useRef<HTMLCanvasElement>(null);
    const vTracerSvgRef = useRef<SVGSVGElement>(null);

    // Ref to track state for the stable animation loop without causing re-renders
    const loopStateRef = useRef({
        isPlaying,
        isStopped,
        totalDuration,
        config,
        isRecording
    });

    // Update ref whenever state changes
    useEffect(() => {
        loopStateRef.current = {
            isPlaying,
            isStopped,
            totalDuration,
            config,
            isRecording
        };
    }, [isPlaying, isStopped, totalDuration, config, isRecording]);

    // Update total duration when SVG or timing config changes
    useEffect(() => {
        const parser = new DOMParser();
        const doc = parser.parseFromString(svgContent, 'image/svg+xml');
        const elements = doc.querySelectorAll(
            'path, circle, rect, line, polyline, polygon, ellipse'
        );
        const duration = config.delay + (elements.length * config.stagger) + config.duration;
        setTotalDuration(duration);
    }, [svgContent, config.delay, config.stagger, config.duration, setTotalDuration]);

    const getEventPoint = (e: React.MouseEvent | React.TouchEvent) => {
        if ('touches' in e) {
            return {
                x: e.touches[0]?.clientX || 0,
                y: e.touches[0]?.clientY || 0
            };
        }
        return { x: e.clientX, y: e.clientY };
    };

    const handleDragStart = (e: React.MouseEvent | React.TouchEvent) => {
        if (!config.isOverlayDraggable || !overlayImage) return;
        setIsDragging(true);
        const p = getEventPoint(e);
        setDragStart({ x: p.x - overlayPos.x, y: p.y - overlayPos.y });
    };

    const handleResizeStart = (e: React.MouseEvent | React.TouchEvent) => {
        e.stopPropagation(); // prevent drag from starting
        if (!config.isOverlayDraggable || !overlayImage) return;
        setIsResizing(true);
        const p = getEventPoint(e);
        setResizeStart({ x: p.x, y: p.y, scale: config.overlayScale });
    };

    const handleMove = (e: React.MouseEvent | React.TouchEvent) => {
        if (!isDragging && !isResizing) return;
        const p = getEventPoint(e);
        if (isDragging) {
            setOverlayPos({
                x: p.x - dragStart.x,
                y: p.y - dragStart.y
            });
        } else if (isResizing) {
            const dx = p.x - resizeStart.x;
            const newScale = Math.max(0.1, resizeStart.scale + dx * 0.005);
            updateConfig('overlayScale', newScale);
        }
    };

    const handleEnd = () => {
        setIsDragging(false);
        setIsResizing(false);
    };


    const handleRecord = async () => {
        if (!previewAreaRef.current || isRecording) return;

        try {
            isRecordingRef.current = true;
            setIsRecording(true);
            setIsPlaying(false);
            setRecordingProgress(0);
            (window as any).__stopRecording = false;

            const totalDurationSec = totalDuration;
            const fps = 30;
            const totalFrames = Math.ceil(totalDurationSec * fps);

            const element = previewAreaRef.current;
            const captureCanvas = document.createElement('canvas');
            const stream = captureCanvas.captureStream(fps);
            const recorder = new MediaRecorder(stream, {
                mimeType: 'video/webm;codecs=vp9',
                videoBitsPerSecond: 8000000
            });

            const chunks: Blob[] = [];
            recorder.ondataavailable = (e) => chunks.push(e.data);
            recorder.onstop = () => {
                const blob = new Blob(chunks, { type: 'video/webm' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `svg-animation-${Date.now()}.webm`;
                a.click();
                URL.revokeObjectURL(url);
                isRecordingRef.current = false;
                setIsRecording(false);
                setIsPlaying(true);
            };

            recorder.start();

            const ease = (t: number) => {
                const fn = easeFunctions[config.easing] || easeFunctions['linear'];
                return fn ? fn(t) : t;
            };

            for (let frame = 0; frame <= totalFrames; frame++) {
                if ((window as any).__stopRecording) break;
                const frameTime = frame / fps;
                setRecordingProgress(frame / totalFrames);

                const currentElements = svgContainerRef.current?.querySelectorAll(
                    'path, circle, rect, line, polyline, polygon, ellipse'
                ) || [];

                Array.from(currentElements).forEach((el, index) => {
                    const geometryEl = el as unknown as SVGGeometryElement;
                    const length = geometryEl.getTotalLength?.() || 0;
                    if (length <= 0) return;

                    const svgEl = el as SVGElement;
                    const startTime = config.delay + (index * config.stagger);
                    const elapsed = frameTime - startTime;
                    const progress = Math.max(0, Math.min(elapsed / config.duration, 1));
                    const easedProgress = ease(progress);
                    const offset = (length * (1 - easedProgress)).toString();

                    svgEl.style.transition = 'none';
                    svgEl.style.animation = 'none';
                    svgEl.style.strokeDasharray = length.toString();
                    svgEl.setAttribute('stroke-dasharray', length.toString());
                    svgEl.style.strokeDashoffset = offset;
                    svgEl.setAttribute('stroke-dashoffset', offset);
                });

                await new Promise(r => requestAnimationFrame(r));

                const frameCanvas = await toCanvas(element, {
                    backgroundColor: config.backgroundColor,
                    pixelRatio: 1,
                });

                captureCanvas.width = frameCanvas.width;
                captureCanvas.height = frameCanvas.height;
                const ctx = captureCanvas.getContext('2d');
                if (ctx) ctx.drawImage(frameCanvas, 0, 0);
            }

            recorder.stop();
        } catch (error) {
            console.error('Recording failed:', error);
            isRecordingRef.current = false;
            setIsRecording(false);
            setIsPlaying(true);
            alert('Failed to record animation.');
        }
    };

    const stopRecording = () => {
        (window as any).__stopRecording = true;
    };

    const renderFrame = React.useCallback((time: number) => {
        if (!svgContainerRef.current) return;

        const elements = svgContainerRef.current.querySelectorAll(
            'path, circle, rect, line, polyline, polygon, ellipse'
        );

        const ease = (t: number) => {
            const fn = easeFunctions[config.easing] || easeFunctions['linear'];
            return fn ? fn(t) : t;
        };

        elements.forEach((el, index) => {
            const geometryEl = el as unknown as SVGGeometryElement;
            const length = geometryEl.getTotalLength ? geometryEl.getTotalLength() : 0;
            if (length <= 0) return;

            const svgEl = el as SVGElement;
            svgEl.style.animation = 'none';
            svgEl.style.transition = 'none';

            const startTime = config.delay + (index * config.stagger);
            const elapsed = time - startTime;
            const progress = Math.max(0, Math.min(elapsed / config.duration, 1));
            const easedProgress = ease(progress);
            const offset = length * (1 - easedProgress);

            svgEl.style.strokeDasharray = length.toString();
            svgEl.style.strokeDashoffset = offset.toString();

            if (config.useOriginalColor) {
                let color = el.getAttribute('fill') || el.getAttribute('stroke') || svgEl.style.fill || svgEl.style.stroke;
                let parent = el.parentElement;
                while (!color && parent && parent.tagName.toLowerCase() !== 'div') {
                    color = parent.getAttribute('fill') || parent.getAttribute('stroke') || 'black';
                    parent = parent.parentElement;
                }
                if (color && typeof color === 'string' && color !== 'none' && color !== 'transparent' && !color.includes('rgba(0, 0, 0, 0)')) {
                    svgEl.style.setProperty('--item-stroke', color);
                }
            }
        });
    }, [config.delay, config.stagger, config.duration, config.easing, config.useOriginalColor]);

    // Effect for manual scrubbing / initial render
    // We subscribe manually to currentTime here to avoid re-rendering the whole component
    useEffect(() => {
        // Render initial frame
        renderFrame(useTracerStore.getState().currentTime);

        const unsub = useTracerStore.subscribe(
            (state) => state.currentTime,
            (time) => {
                const s = useTracerStore.getState();
                if (!s.isPlaying || s.isStopped) {
                    renderFrame(time);
                }
            }
        );
        return unsub;
    }, [renderFrame, animationKey, svgContent]);

    useEffect(() => {
        if (isRecording || !isPlaying || isStopped) return;
        let rafId: number;
        let lastTime = performance.now();
        const currentStartTime = useTracerStore.getState().currentTime;
        let loopTime = currentStartTime;
        let lastStoreUpdateTime = 0;

        const update = (now: number) => {
            // Check ref for latest play state without restarting effect
            if (!loopStateRef.current.isPlaying || loopStateRef.current.isStopped) return;

            const delta = (now - lastTime) / 1000;
            lastTime = now;
            loopTime += delta;

            const duration = loopStateRef.current.totalDuration;

            if (loopTime >= duration && duration > 0) {
                setCurrentTime(duration);
                renderFrame(duration);
                setIsPlaying(false);
                return;
            }

            // Render to DOM every frame for smoothness
            renderFrame(loopTime);

            setCurrentTime(loopTime);
            rafId = requestAnimationFrame(update);
        };

        rafId = requestAnimationFrame(update);
        return () => {
            cancelAnimationFrame(rafId);
            // Ensure store is final when stopping
            setCurrentTime(loopTime);
        };
    }, [isPlaying, isStopped, animationKey, svgContent, config, renderFrame]);

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col md:flex-row font-mono" >
            < style > {`
                @keyframes svg-trace {
                    to { stroke-dashoffset: 0; }
                }
                .force-outline * {
                    fill: transparent !important;
                    stroke: ${config.useOriginalColor ? `var(--item-stroke, ${config.strokeColor})` : config.strokeColor} !important;
                    stroke-width: ${config.strokeWidth}px !important;
                }
            `} </style>

            <Sidebar
                handleRecord={handleRecord}
                stopRecording={stopRecording}
                vTracerCanvasRef={vTracerCanvasRef}
                vTracerSvgRef={vTracerSvgRef}
            />

            <main ref={previewAreaRef} className="flex flex-col h-screen md:h-auto md:flex-1 bg-slate-200 relative" >
                <h1 className="sr-only">SVG Tracer & Animator - Convert Images to Vector Art Online</h1>
                < div
                    className="absolute inset-0 opacity-40 pointer-events-none"
                    style={{
                        backgroundImage: `repeating-linear-gradient(45deg, #e2e8f0 25%, transparent 25%, transparent 75%, #e2e8f0 75%, #e2e8f0), repeating-linear-gradient(45deg, #e2e8f0 25%, #f8fafc 25%, #f8fafc 75%, #e2e8f0 75%, #e2e8f0)`,
                        backgroundPosition: `0 0, 10px 10px`,
                        backgroundSize: `20px 20px`
                    }}
                />

                < div
                    className="flex-1 flex items-center justify-center p-8 relative z-10 overflow-auto"
                    onMouseMove={handleMove}
                    onTouchMove={handleMove}
                    onMouseUp={handleEnd}
                    onTouchEnd={handleEnd}
                    onMouseLeave={handleEnd}
                    onTouchCancel={handleEnd}
                >
                    <div
                        className="w-full max-w-2xl aspect-square flex  border border-white/50 p-8 transition-all relative"
                        style={{ backgroundColor: config.backgroundColor }}
                    >
                        {overlayImage && config.showOverlay && (
                            <div
                                className={`absolute inset-0 flex items-center justify-center p-8 transition-opacity duration-300 z-0 ${config.isOverlayDraggable ? 'pointer-events-auto' : 'pointer-events-none'}`}
                                style={{
                                    opacity: config.overlayOpacity,
                                    transform: `translate(${overlayPos.x}px, ${overlayPos.y}px) scale(${config.overlayScale})`
                                }}
                            >
                                <div
                                    className={`relative flex items-center justify-center transition-all ${config.isOverlayDraggable ? 'cursor-move ring-1 ring-indigo-200 shadow-2xl bg-indigo-500/10 touch-none' : ''}`}
                                    onMouseDown={handleDragStart}
                                    onTouchStart={handleDragStart}
                                >
                                    <img
                                        src={overlayImage}
                                        alt="Reference"
                                        className="max-w-full max-h-full object-contain select-none pointer-events-none"
                                        draggable={false}
                                    />
                                    {config.isOverlayDraggable && (
                                        <div
                                            className="absolute -bottom-1 -right-1 w-2 h-2 bg-white border border-indigo-100 rounded-full cursor-se-resize shadow-md hover:scale-110 active:scale-95 transition-transform"
                                            onMouseDown={handleResizeStart}
                                            onTouchStart={handleResizeStart}
                                            title="Drag to resize"
                                        />
                                    )}
                                </div>
                            </div>
                        )}

                        {activeTab === 'animation' ? (
                            < div
                                key={animationKey}
                                ref={svgContainerRef}
                                className={`w-full h-full flex items-center justify-center z-10 [&>svg]:w-full [&>svg]:h-full [&>svg]:max-w-full [&>svg]:max-h-full ${config.forceOutline ? 'force-outline' : ''} ${config.isOverlayDraggable ? 'pointer-events-none' : ''}`}
                                style={{ transform: `scale(${config.svgScale})` }}
                                dangerouslySetInnerHTML={{ __html: svgContent }}
                            />
                        ) : (
                            <div id="vtracer-container" className="">
                                <canvas id="vtracer-canvas-internal" ref={vTracerCanvasRef} />
                                <svg
                                    id="vtracer-svg-internal"
                                    ref={vTracerSvgRef}
                                    xmlns="http://www.w3.org/2000/svg"
                                    style={{ display: 'block' }}
                                    // viewBox='0 0 1024 1024'
                                    className=""
                                />

                                <style>
                                    {`#vtracer-svg-internal, #vtracer-canvas-internal {
                                            position: absolute;
                                            width: 100%;
                                            margin-bottom: 50px;
                                    }
                                    #vtracer-container {
                                           position: relative;
                                            height: max-content;
                                            box-sizing: border-box;
                                            width: 100%;
                                            max-width: 100%;
                                    }
                                    #vtracer-svg-internal > path:hover {
                                        stroke: #ff0;
                                    }
                                    `}
                                </style>
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}
