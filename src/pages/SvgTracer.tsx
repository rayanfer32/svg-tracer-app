import {
    Upload, Settings2,
    Image as ImageIcon, MousePointerClick, Wrench
} from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';
import { toCanvas } from 'html-to-image';
import type { TracerConfig } from '../types';
import { DEFAULT_SVG, easeFunctions } from '../utils/constants';
import { NumberInput } from '../components/NumberInput';
import { ToolkitLink } from '../components/ToolkitLink';
import { PlaybackControls } from '../components/PlaybackControls';

export default function SvgTracer() {
    const [svgContent, setSvgContent] = useState<string>(DEFAULT_SVG);
    const [overlayImage, setOverlayImage] = useState<string | null>(null);
    const [overlayPos, setOverlayPos] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const [isResizing, setIsResizing] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    const [resizeStart, setResizeStart] = useState({ x: 0, y: 0, scale: 1 });
    const [isPlaying, setIsPlaying] = useState<boolean>(true);
    const [isStopped, setIsStopped] = useState<boolean>(false);
    const [isRecording, setIsRecording] = useState<boolean>(false);
    const isRecordingRef = useRef<boolean>(false);
    const [shouldStopRecording, setShouldStopRecording] = useState<boolean>(false);
    const [recordingProgress, setRecordingProgress] = useState<number>(0);
    const [animationKey, setAnimationKey] = useState<number>(0); // Used to force re-render and restart animation
    const svgContainerRef = useRef<HTMLDivElement>(null);
    const previewAreaRef = useRef<HTMLDivElement>(null);

    // Configuration state
    const [config, setConfig] = useState<TracerConfig>({
        duration: 1.8,
        stagger: 2,
        delay: 1,
        easing: 'linear',
        direction: 'normal',
        forceOutline: true,
        useOriginalColor: true,
        strokeColor: '#3b82f6', // blue-500
        strokeWidth: 4,
        showOverlay: true,
        overlayOpacity: 0.3,
        isOverlayDraggable: false,
        overlayScale: 1
    });

    const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file && file.type === 'image/svg+xml') {
            const reader = new FileReader();
            reader.onload = (e) => {
                const content = e.target?.result;
                if (typeof content === 'string') {
                    setSvgContent(content);
                    setAnimationKey(prev => prev + 1); // Restart animation on new file
                }
            };
            reader.readAsText(file);
        } else {
            alert("Please upload a valid SVG file.");
        }
    };

    const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file && file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const content = e.target?.result;
                if (typeof content === 'string') {
                    setOverlayImage(content);
                }
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSvgDrop = (e: React.DragEvent) => {
        e.preventDefault();
        const file = e.dataTransfer.files?.[0];
        if (file && file.type === 'image/svg+xml') {
            const reader = new FileReader();
            reader.onload = (ev) => {
                const content = ev.target?.result;
                if (typeof content === 'string') {
                    setSvgContent(content);
                    setAnimationKey(prev => prev + 1);
                }
            };
            reader.readAsText(file);
        } else {
            alert("Please drop a valid SVG file.");
        }
    };

    const handleImageDrop = (e: React.DragEvent) => {
        e.preventDefault();
        const file = e.dataTransfer.files?.[0];
        if (file && file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = (ev) => {
                const content = ev.target?.result;
                if (typeof content === 'string') {
                    setOverlayImage(content);
                }
            };
            reader.readAsDataURL(file);
        }
    };

    const handleConfigChange = <T extends keyof TracerConfig>(key: T, value: TracerConfig[T]) => {
        setConfig(prev => ({ ...prev, [key]: value }));
        // Auto-restart animation when config changes for better UX
        setIsStopped(false);
        setAnimationKey(prev => prev + 1);
        setIsPlaying(true);
    };

    const restartAnimation = () => {
        setIsStopped(false);
        setAnimationKey(prev => prev + 1);
        setIsPlaying(true);
    };

    const stopAnimation = () => {
        setIsStopped(true);
        setIsPlaying(false);
    };

    const togglePlay = () => {
        if (isStopped) {
            setIsStopped(false);
            setAnimationKey(prev => prev + 1);
            setIsPlaying(true);
        } else {
            setIsPlaying(!isPlaying);
        }
    };

    const handleMouseDown = (e: React.MouseEvent) => {
        if (!config.isOverlayDraggable || !overlayImage) return;
        setIsDragging(true);
        setDragStart({ x: e.clientX - overlayPos.x, y: e.clientY - overlayPos.y });
    };

    const handleResizeMouseDown = (e: React.MouseEvent) => {
        e.stopPropagation(); // prevent drag from starting
        if (!config.isOverlayDraggable || !overlayImage) return;
        setIsResizing(true);
        setResizeStart({ x: e.clientX, y: e.clientY, scale: config.overlayScale });
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (isDragging) {
            setOverlayPos({
                x: e.clientX - dragStart.x,
                y: e.clientY - dragStart.y
            });
        } else if (isResizing) {
            const dx = e.clientX - resizeStart.x;
            // Scale dynamically (dx moves right to scale up, left to scale down)
            const newScale = Math.max(0.1, resizeStart.scale + dx * 0.005);
            handleConfigChange('overlayScale', newScale);
        }
    };

    const handleMouseUp = () => {
        setIsDragging(false);
        setIsResizing(false);
    };

    const resetOverlayPosition = () => {
        setOverlayPos({ x: 0, y: 0 });
        handleConfigChange('overlayScale', 1);
    };

    const handleRecord = async () => {
        if (!previewAreaRef.current || isRecording) return;

        try {
            isRecordingRef.current = true;
            setIsRecording(true);
            setIsPlaying(false); // Stop real-time playback
            setRecordingProgress(0);
            (window as any).__stopRecording = false;

            const elements = svgContainerRef.current?.querySelectorAll(
                'path, circle, rect, line, polyline, polygon, ellipse'
            ) || [];

            // Pre-calculate lengths
            const elementData = Array.from(elements).map(el => ({
                el: el as SVGElement,
                length: (el as unknown as SVGGeometryElement).getTotalLength?.() || 0
            }));

            const totalDurationSec = config.delay + (elements.length * config.stagger) + config.duration;
            const fps = 30;
            const totalFrames = Math.ceil(totalDurationSec * fps);

            // Setup recording canvas
            const element = previewAreaRef.current;
            const captureCanvas = document.createElement('canvas');
            const stream = captureCanvas.captureStream(fps);
            const recorder = new MediaRecorder(stream, {
                mimeType: 'video/webm;codecs=vp9',
                videoBitsPerSecond: 8000000 // 8Mbps
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
                setIsPlaying(true); // Resume normal UI
            };

            recorder.start();

            const ease = (t: number) => {
                const fn = easeFunctions[config.easing] || easeFunctions['linear'];
                return fn ? fn(t) : t;
            };

            // Frame-perfect render loop
            for (let frame = 0; frame <= totalFrames; frame++) {
                if ((window as any).__stopRecording) break;
                const currentTime = frame / fps;
                setRecordingProgress(frame / totalFrames);

                // Re-query elements in case React detached/re-rendered them
                const currentElements = svgContainerRef.current?.querySelectorAll(
                    'path, circle, rect, line, polyline, polygon, ellipse'
                ) || [];

                // Manually position all paths for this specific point in time
                Array.from(currentElements).forEach((el, index) => {
                    const geometryEl = el as unknown as SVGGeometryElement;
                    const length = geometryEl.getTotalLength?.() || 0;
                    if (length <= 0) return;

                    const svgEl = el as SVGElement;
                    const startTime = config.delay + (index * config.stagger);
                    const elapsed = currentTime - startTime;
                    const progress = Math.max(0, Math.min(elapsed / config.duration, 1));
                    const easedProgress = ease(progress);

                    const offset = (length * (1 - easedProgress)).toString();

                    // Force the exact offset and kill transitions
                    svgEl.style.transition = 'none';
                    svgEl.style.animation = 'none';

                    // Ensure dash array is present
                    svgEl.style.strokeDasharray = length.toString();
                    svgEl.setAttribute('stroke-dasharray', length.toString());

                    svgEl.style.strokeDashoffset = offset;
                    svgEl.setAttribute('stroke-dashoffset', offset);
                });

                // Force a browser paint so the user can see the scrubbing
                await new Promise(r => requestAnimationFrame(r));

                // Wait for library to convert to canvas
                const frameCanvas = await toCanvas(element, {
                    backgroundColor: '#f1f5f9',
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

    useEffect(() => {
        if (!svgContainerRef.current) return;
        if (isRecordingRef.current) return;

        // Select all animatable geometry elements
        const elements = svgContainerRef.current.querySelectorAll(
            'path, circle, rect, line, polyline, polygon, ellipse'
        );

        elements.forEach((el, index) => {
            const geometryEl = el as unknown as SVGGeometryElement;
            // Calculate length for dashed drawing effect
            const length = geometryEl.getTotalLength ? geometryEl.getTotalLength() : 0;

            // If it's a point or invalid, skip
            if (length <= 0) return;

            const svgEl = el as SVGElement;

            // Set CSS variables and initial styles directly on the element
            svgEl.style.setProperty('--path-length', length.toString());
            svgEl.style.strokeDasharray = length.toString();

            if (isStopped) {
                svgEl.style.animation = 'none';
                svgEl.style.strokeDashoffset = '0';
            } else {
                svgEl.style.strokeDashoffset = length.toString();

                // Apply the animation properties
                svgEl.style.animationName = 'svg-trace';
                svgEl.style.animationDuration = `${config.duration}s`;
                svgEl.style.animationTimingFunction = config.easing;
                svgEl.style.animationDelay = `${config.delay + (index * config.stagger)}s`;
                svgEl.style.animationDirection = config.direction;
                svgEl.style.animationFillMode = 'forwards';

                // Apply play state based on React state
                svgEl.style.animationPlayState = isPlaying ? 'running' : 'paused';
            }

            // Extract fill for original color mode
            if (config.useOriginalColor) {
                // We check attributes and inline styles directly to avoid getting "transparent" from forced CSS
                let color = el.getAttribute('fill') || el.getAttribute('stroke') || svgEl.style.fill || svgEl.style.stroke;

                // If not found, try to climb up the SVG tree to find inherited attributes (like on a <g>)
                let parent = el.parentElement;
                while (!color && parent && parent.tagName.toLowerCase() !== 'div') {
                    color = parent.getAttribute('fill') || parent.getAttribute('stroke') || 'black';
                    parent = parent.parentElement;
                }

                if (color && typeof color === 'string' && color !== 'none' && color !== 'transparent' && !color.includes('rgba(0, 0, 0, 0)')) {
                    svgEl.style.setProperty('--item-stroke', color);
                } else {
                    svgEl.style.removeProperty('--item-stroke');
                }
            } else {
                svgEl.style.removeProperty('--item-stroke');
            }
        });
    }, [svgContent, config, animationKey, isPlaying, isStopped]);
    // We include isPlaying here to update the animationPlayState without fully remounting

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col md:flex-row font-sans" >
            {/* Global styles for the keyframes and optional overrides */}
            < style > {`
        @keyframes svg-trace {
          to {
            stroke-dashoffset: 0;
          }
        }
        
        .force-outline * {
          fill: transparent !important;
          stroke: ${config.useOriginalColor ? `var(--item-stroke, ${config.strokeColor})` : config.strokeColor} !important;
          stroke-width: ${config.strokeWidth}px !important;
        }
      `} </style>

            {/* Sidebar Controls */}
            <aside className="w-full md:w-72 bg-white border-r border-slate-200 p-4 flex flex-col gap-4 shadow-sm z-10 overflow-y-auto text-sm shrink-0" >
                <div>
                    <h1 className="text-xl font-bold flex items-center gap-2 text-indigo-600" >
                        <MousePointerClick className="w-5 h-5" />
                        SVG Tracer
                    </h1>
                </div>

                {/* Upload Section */}
                <div className="space-y-2 border-b border-slate-100 pb-4" >
                    <div className='flex gap-2' onDragOver={(e) => e.preventDefault()}>
                        <label
                            className="flex items-center justify-center gap-1.5 w-full p-2 border-2 border-dashed border-slate-300 rounded-lg cursor-pointer hover:border-indigo-400 hover:bg-indigo-50/50 transition-colors group"
                            onDragOver={(e) => e.preventDefault()}
                            onDrop={handleSvgDrop}
                        >
                            <Upload className="w-5 h-5 text-slate-400 group-hover:text-indigo-500" />
                            <span className="text-sm font-medium text-slate-600 group-hover:text-indigo-600" >
                                Load SVG
                            </span>
                            < input
                                type="file"
                                accept=".svg"
                                className="hidden"
                                onChange={handleFileUpload}
                            />
                        </label>

                        < label
                            className="flex items-center justify-center gap-1.5 w-full p-2 border-2 border-dashed border-slate-300 rounded-lg cursor-pointer hover:border-emerald-400 hover:bg-emerald-50/50 transition-colors group"
                            onDragOver={(e) => e.preventDefault()}
                            onDrop={handleImageDrop}
                        >
                            <ImageIcon className="w-4 h-4 text-slate-400 group-hover:text-emerald-500" />
                            <span className="text-xs font-medium text-slate-600 group-hover:text-emerald-600" >
                                Ref Image
                            </span>
                            < input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={handleImageUpload}
                            />
                        </label>
                    </div>

                    {/* Toolkit Section */}
                    <div className="pt-2">
                        <div className="flex items-center gap-2 text-slate-800 font-semibold mb-3 px-1" >
                            <Wrench className="w-4 h-4 text-indigo-500" />
                            Toolkit
                        </div>
                        <div className="flex flex-row flex-wrap gap-1.5">
                            <ToolkitLink href="https://mixboard.google.com/" label="Mixboard" />
                            <ToolkitLink href="https://www.visioncortex.org/vtracer/" label="Image VTracer" />
                            <ToolkitLink href="https://editor.graphite.art/" label="Graphite Editor" />
                            {/* <ToolkitLink href="https://svgartista.net/" label="Svg Artista" />
                            <ToolkitLink href="https://svglogos.dev/" label="Svglogos.dev" /> */}
                        </div>
                    </div>
                </div>

                {/* Configuration */}
                <div className="space-y-3" >
                    <div className="flex items-center gap-2 text-slate-800 font-semibold border-b border-slate-100 pb-1.5" >
                        <Settings2 className="w-4 h-4" />
                        Animation
                    </div>

                    <div className="flex flex-col gap-1">
                        <NumberInput label="Duration" value={config.duration} min={0.1} max={10} step={0.1} unit="s" onChange={(val) => handleConfigChange('duration', val)} />
                        <NumberInput label="Stagger Step" value={config.stagger} min={0} max={5} step={0.1} unit="s" onChange={(val) => handleConfigChange('stagger', val)} />
                        <NumberInput label="Initial Delay" value={config.delay} min={0} max={5} step={0.1} unit="s" onChange={(val) => handleConfigChange('delay', val)} />
                        <NumberInput label="Stroke Width" value={config.strokeWidth} min={0.1} max={20} step={0.1} unit="px" onChange={(val) => handleConfigChange('strokeWidth', val)} />
                    </div>

                    < div className="grid grid-cols-2 gap-4" >
                        <div className="space-y-1.5" >
                            <label className="text-xs font-medium text-slate-500 uppercase tracking-wider" > Easing </label>
                            <select
                                value={config.easing}
                                onChange={(e) => handleConfigChange('easing', e.target.value)}
                                className="w-full text-sm p-1 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                            >
                                <option value="linear" > Linear </option>
                                < option value="ease" > Ease </option>
                                < option value="ease-in" > Ease In </option>
                                < option value="ease-out" > Ease Out </option>
                                < option value="ease-in-out" > Ease In Out </option>
                            </select>
                        </div>

                        < div className="space-y-1.5" >
                            <label className="text-xs font-medium text-slate-500 uppercase tracking-wider" > Direction </label>
                            < select
                                value={config.direction}
                                onChange={(e) => handleConfigChange('direction', e.target.value)}
                                className="w-full text-sm p-1 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                            >
                                <option value="normal" > Normal </option>
                                < option value="reverse" > Reverse </option>
                                < option value="alternate" > Alternate </option>
                                < option value="alternate-reverse" > Alt Reverse </option>
                            </select>
                        </div>
                    </div>

                    < div className="pt-2 border-t border-slate-100 space-y-2.5" >
                        <label className="flex items-center justify-between cursor-pointer" >
                            <span className="text-sm font-medium text-slate-700" > Force Outline Mode </span>
                            < div className="relative" >
                                <input
                                    type="checkbox"
                                    className="sr-only"
                                    checked={config.forceOutline}
                                    onChange={(e) => handleConfigChange('forceOutline', e.target.checked)}
                                />
                                < div className={`block w-10 h-6 rounded-full transition-colors ${config.forceOutline ? 'bg-indigo-500' : 'bg-slate-300'}`}> </div>
                                < div className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${config.forceOutline ? 'transform translate-x-4' : ''}`}> </div>
                            </div>
                        </label>

                        <label className="flex items-center justify-between cursor-pointer" >
                            <span className="text-sm font-medium text-slate-700" > Use Original Fill Colors </span>
                            < div className="relative" >
                                <input
                                    type="checkbox"
                                    className="sr-only"
                                    checked={config.useOriginalColor}
                                    onChange={(e) => handleConfigChange('useOriginalColor', e.target.checked)}
                                />
                                < div className={`block w-10 h-6 rounded-full transition-colors ${config.useOriginalColor ? 'bg-indigo-500' : 'bg-slate-300'}`}> </div>
                                < div className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${config.useOriginalColor ? 'transform translate-x-4' : ''}`}> </div>
                            </div>
                        </label>

                        {
                            config.forceOutline && !config.useOriginalColor && (
                                <div className="flex items-center justify-between animate-in fade-in slide-in-from-top-2" >
                                    <span className="text-sm text-slate-500" > Stroke Color </span>
                                    < input
                                        type="color"
                                        value={config.strokeColor}
                                        onChange={(e) => handleConfigChange('strokeColor', e.target.value)
                                        }
                                        className="w-8 h-8 rounded border border-slate-200 cursor-pointer p-0.5"
                                    />
                                </div>
                            )}

                        < div className="pt-2 border-t border-slate-100 space-y-2.5" >
                            <label className="flex items-center justify-between cursor-pointer" >
                                <span className="text-sm font-medium text-slate-700" > Show Reference Image </span>
                                < div className="relative" >
                                    <input
                                        type="checkbox"
                                        className="sr-only"
                                        checked={config.showOverlay}
                                        onChange={(e) => handleConfigChange('showOverlay', e.target.checked)}
                                    />
                                    < div className={`block w-10 h-6 rounded-full transition-colors ${config.showOverlay ? 'bg-indigo-500' : 'bg-slate-300'}`}> </div>
                                    < div className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${config.showOverlay ? 'transform translate-x-4' : ''}`}> </div>
                                </div>
                            </label>

                            {
                                config.showOverlay && (
                                    <>
                                        <div className="space-y-2">
                                            <NumberInput label="Overlay Opacity" value={config.overlayOpacity} min={0} max={1} step={0.01} onChange={(val) => handleConfigChange('overlayOpacity', val)} />
                                            <NumberInput label="Overlay Scale" value={config.overlayScale} min={0.1} max={3} step={0.05} onChange={(val) => handleConfigChange('overlayScale', val)} />
                                        </div>

                                        <div className="space-y-2 pt-1">
                                            <label className="flex items-center justify-between cursor-pointer" >
                                                <span className="text-sm font-medium text-slate-700" > Position & Resize Image </span>
                                                < div className="relative" >
                                                    <input
                                                        type="checkbox"
                                                        className="sr-only"
                                                        checked={config.isOverlayDraggable}
                                                        onChange={(e) => handleConfigChange('isOverlayDraggable', e.target.checked)}
                                                    />
                                                    < div className={`block w-10 h-6 rounded-full transition-colors ${config.isOverlayDraggable ? 'bg-indigo-500' : 'bg-slate-300'}`}> </div>
                                                    < div className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${config.isOverlayDraggable ? 'transform translate-x-4' : ''}`}> </div>
                                                </div>
                                            </label>

                                            <button
                                                onClick={resetOverlayPosition}
                                                className="w-full py-1.5 px-3 rounded-md bg-slate-100 text-slate-600 text-xs font-medium hover:bg-slate-200 transition-colors"
                                            >
                                                Reset Position
                                            </button>
                                        </div>
                                    </>
                                )}
                        </div>
                    </div>
                </div>
            </aside>

            {/* Main Preview Area */}
            <main ref={previewAreaRef} className="flex-1 flex flex-col bg-slate-100 overflow-hidden relative" >
                {/* Playback Controls Float */}
                <PlaybackControls
                    isPlaying={isPlaying}
                    togglePlay={togglePlay}
                    isRecording={isRecording}
                    recordingProgress={recordingProgress}
                    restartAnimation={restartAnimation}
                    stopAnimation={stopAnimation}
                    handleRecord={handleRecord}
                    stopRecording={stopRecording}
                />

                {/* Checkerboard background pattern for transparency visualization */}
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
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={handleMouseUp}
                >
                    <div
                        className="w-full max-w-2xl aspect-square flex items-center justify-center bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/50 p-8 transition-all relative"
                    >
                        {/* Reference Image Overlay */}
                        {overlayImage && config.showOverlay && (
                            <div
                                className={`absolute inset-0 flex items-center justify-center p-8 transition-opacity duration-300 z-0 ${config.isOverlayDraggable ? 'pointer-events-auto' : 'pointer-events-none'}`}
                                style={{
                                    opacity: config.overlayOpacity,
                                    transform: `translate(${overlayPos.x}px, ${overlayPos.y}px) scale(${config.overlayScale})`
                                }}
                            >
                                <div
                                    className={`relative flex items-center justify-center transition-all ${config.isOverlayDraggable ? 'cursor-move ring-2 ring-indigo-500 ring-dashed shadow-2xl bg-indigo-500/10' : ''}`}
                                    onMouseDown={handleMouseDown}
                                >
                                    <img
                                        src={overlayImage}
                                        alt="Reference"
                                        className="max-w-full max-h-full object-contain select-none pointer-events-none"
                                        draggable={false}
                                    />
                                    {config.isOverlayDraggable && (
                                        <div
                                            className="absolute -bottom-3 -right-3 w-6 h-6 bg-white border-2 border-indigo-500 rounded-full cursor-se-resize shadow-md hover:scale-110 active:scale-95 transition-transform"
                                            onMouseDown={handleResizeMouseDown}
                                            title="Drag to resize"
                                        />
                                    )}
                                </div>
                            </div>
                        )}

                        < div
                            key={animationKey}
                            ref={svgContainerRef}
                            className={`w-full h-full flex items-center justify-center z-10 [&>svg]:w-full [&>svg]:h-full [&>svg]:max-w-full [&>svg]:max-h-full ${config.forceOutline ? 'force-outline' : ''} ${config.isOverlayDraggable ? 'pointer-events-none' : ''}`}
                            // We use dangerouslySetInnerHTML to inject the raw SVG. The key prop forces React to completely destroy and recreate this DOM node when animationKey changes, ensuring CSS animations restart cleanly.
                            dangerouslySetInnerHTML={{ __html: svgContent }}
                        />

                    </div>
                </div>
            </main>
        </div>
    );
}

