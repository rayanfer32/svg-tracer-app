import {
    Upload, Settings2,
    Image as ImageIcon, MousePointerClick, Wrench,
    Timer, Layers, Watch, PenTool, Maximize, Contrast
} from 'lucide-react';
import React from 'react';
import type { TracerConfig } from '../types';
import { NumberInput } from './NumberInput';
import { ToolkitLink } from './ToolkitLink';
import { PlaybackControls } from './PlaybackControls';
import { ImageTracer } from './ImageTracer';

import { useTracerStore } from '../store/useTracerStore';

interface SidebarProps {
    vTracerCanvasRef: React.RefObject<HTMLCanvasElement | null>;
    vTracerSvgRef: React.RefObject<SVGSVGElement | null>;
}

export function Sidebar({
    vTracerCanvasRef,
    vTracerSvgRef
}: SidebarProps) {
    const {
        activeTab, setActiveTab,
        config, updateConfig,
        isPlaying, setIsPlaying,
        isStopped, setIsStopped,
        isRecording,
        recordingProgress,
        restartAnimation,
        currentTime, setCurrentTime,
        totalDuration,
        setSvgContent,
        setOverlayImage,
        setOverlayPos,
        setIsDragging,
        setIsResizing,
        handleOnApplyTracedSvg
    } = useTracerStore();

    const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file && file.type === 'image/svg+xml') {
            const reader = new FileReader();
            reader.onload = (e) => {
                const content = e.target?.result;
                if (typeof content === 'string') {
                    setSvgContent(content);
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
                }
            };
            reader.readAsText(file);
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

    const resetOverlayPosition = () => {
        setOverlayPos({ x: 0, y: 0 });
        updateConfig('overlayScale', 1);
    };

    const stopAnimation = () => {
        setIsStopped(true);
        setIsPlaying(false);
        // We'll let SvgTracer handle the currentTime update if needed, 
        // but for now we set it to duration roughly
        setCurrentTime(totalDuration);
    };

    const togglePlay = () => {
        if (isStopped) {
            restartAnimation();
        } else {
            setIsPlaying(!isPlaying);
        }
    };
    return (
        <aside className="w-full md:w-80 bg-white border-r border-slate-200 p-4 flex flex-col gap-4 shadow-sm z-10 overflow-y-auto text-sm shrink-0" >
            <div>
                <h1 className="text-xl font-bold flex items-center gap-2 text-indigo-600" >
                    <MousePointerClick className="w-5 h-5" />
                    SVG Tracer
                </h1>
            </div>

            {/* Tab Switcher */}
            <div className="flex bg-slate-100 p-1 rounded-lg">
                <button
                    onClick={() => setActiveTab('animation')}
                    className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all ${activeTab === 'animation' ? 'bg-white shadow-sm text-indigo-600 border border-slate-200/50' : 'text-slate-500 hover:text-slate-700'}`}
                >
                    Animation
                </button>
                <button
                    onClick={() => setActiveTab('tracer')}
                    className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all ${activeTab === 'tracer' ? 'bg-white shadow-sm text-indigo-600 border border-slate-200/50' : 'text-slate-500 hover:text-slate-700'}`}
                >
                    Tracer
                </button>
            </div>

            {activeTab === 'animation' ? (
                <>
                    {/* Playback Controls */}
                    <div className="border-b border-slate-100 pb-4 space-y-4">
                        <PlaybackControls
                            isPlaying={isPlaying}
                            togglePlay={togglePlay}

                            restartAnimation={restartAnimation}
                            stopAnimation={stopAnimation}

                        />

                        <div className="space-y-1.5 px-1">
                            <div className="flex justify-between text-[10px] font-medium text-slate-400 uppercase tracking-wider">
                                <span>Progress</span>
                                <span>{currentTime.toFixed(1)}s / {totalDuration.toFixed(1)}s</span>
                            </div>
                            <input
                                type="range"
                                min={0}
                                max={totalDuration || 1}
                                step={0.01}
                                value={currentTime}
                                onChange={(e) => {
                                    setIsPlaying(false);
                                    setIsStopped(false);
                                    setCurrentTime(parseFloat(e.target.value));
                                }}
                                className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                            />
                        </div>
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
                                <ToolkitLink href="https://www.visioncortex.org/vtracer/" label="VTracer" />
                                <ToolkitLink href="https://editor.graphite.art/" label="Graphite" />
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
                            <NumberInput
                                label="Duration (s)"
                                icon={Timer}
                                value={config.duration}
                                min={0.1}
                                max={config.limitDuration}
                                step={0.1}
                                unit="s"
                                onChange={(val) => updateConfig('duration', val)}
                                onMaxChange={(val) => updateConfig('limitDuration', val)}
                            />
                            <NumberInput
                                label="Stagger Step (s)"
                                icon={Layers}
                                value={config.stagger}
                                min={0}
                                max={config.limitStagger}
                                step={0.1}
                                unit="s"
                                onChange={(val) => updateConfig('stagger', val)}
                                onMaxChange={(val) => updateConfig('limitStagger', val)}
                            />
                            <NumberInput
                                label="Initial Delay (s)"
                                icon={Watch}
                                value={config.delay}
                                min={0}
                                max={config.limitDelay}
                                step={0.1}
                                unit="s"
                                onChange={(val) => updateConfig('delay', val)}
                                onMaxChange={(val) => updateConfig('limitDelay', val)}
                            />
                            <NumberInput
                                label="Stroke Width (px)"
                                icon={PenTool}
                                value={config.strokeWidth}
                                min={0.1}
                                max={config.limitStrokeWidth}
                                step={0.1}
                                unit="px"
                                onChange={(val) => updateConfig('strokeWidth', val)}
                                onMaxChange={(val) => updateConfig('limitStrokeWidth', val)}
                            />
                            <NumberInput
                                label="SVG Scale"
                                icon={Maximize}
                                value={config.svgScale}
                                min={0.1}
                                max={config.limitSvgScale}
                                step={0.1}
                                unit={'x'}
                                onChange={(val) => updateConfig('svgScale', val)}
                                onMaxChange={(val) => updateConfig('limitSvgScale', val)}
                            />
                        </div>

                        < div className="grid grid-cols-2 gap-4" >
                            <div className="space-y-1.5" >
                                <label className="text-xs font-medium text-slate-500 uppercase tracking-wider" > Easing </label>
                                <select
                                    value={config.easing}
                                    onChange={(e) => updateConfig('easing', e.target.value)}
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
                                    onChange={(e) => updateConfig('direction', e.target.value)}
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
                                        onChange={(e) => updateConfig('forceOutline', e.target.checked)}
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
                                        onChange={(e) => updateConfig('useOriginalColor', e.target.checked)}
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
                                            onChange={(e) => updateConfig('strokeColor', e.target.value)
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
                                            onChange={(e) => updateConfig('showOverlay', e.target.checked)}
                                        />
                                        < div className={`block w-10 h-6 rounded-full transition-colors ${config.showOverlay ? 'bg-indigo-500' : 'bg-slate-300'}`}> </div>
                                        < div className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${config.showOverlay ? 'transform translate-x-4' : ''}`}> </div>
                                    </div>
                                </label>

                                {
                                    config.showOverlay && (
                                        <>
                                            <div className="space-y-1">
                                                <NumberInput
                                                    label="Overlay Opacity"
                                                    icon={Contrast}
                                                    value={config.overlayOpacity}
                                                    min={0}
                                                    max={config.limitOverlayOpacity}
                                                    step={0.01}
                                                    onChange={(val) => updateConfig('overlayOpacity', val)}
                                                    onMaxChange={(val) => updateConfig('limitOverlayOpacity', val)}
                                                />
                                                <NumberInput
                                                    label="Overlay Scale"
                                                    icon={ImageIcon}
                                                    value={config.overlayScale}
                                                    min={0.1}
                                                    max={config.limitOverlayScale}
                                                    step={0.05}
                                                    onChange={(val) => updateConfig('overlayScale', val)}
                                                    onMaxChange={(val) => updateConfig('limitOverlayScale', val)}
                                                />
                                            </div>

                                            <div className="space-y-2 pt-1">
                                                <label className="flex items-center justify-between cursor-pointer" >
                                                    <span className="text-sm font-medium text-slate-700" > Position & Resize Image </span>
                                                    < div className="relative" >
                                                        <input
                                                            type="checkbox"
                                                            className="sr-only"
                                                            checked={config.isOverlayDraggable}
                                                            onChange={(e) => updateConfig('isOverlayDraggable', e.target.checked)}
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

                        <div className="pt-2 border-t border-slate-100 space-y-2.5">
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium text-slate-700">Container Background</span>
                                <input
                                    type="color"
                                    value={config.backgroundColor.slice(0, 7)}
                                    onChange={(e) => {
                                        const hex = e.target.value;
                                        updateConfig('backgroundColor', hex + (config.backgroundColor.slice(7, 9) || 'cc'));
                                    }}
                                    className="w-8 h-8 rounded border border-slate-200 cursor-pointer p-0.5"
                                />
                            </div>
                            <div className="space-y-1">
                                <div className="flex justify-between text-[10px] font-medium text-slate-400 uppercase tracking-wider">
                                    <span>Opacity</span>
                                    <span>{Math.round((parseInt(config.backgroundColor.slice(7, 9) || 'cc', 16) / 255) * 100)}%</span>
                                </div>
                                <input
                                    type="range"
                                    min="0"
                                    max="255"
                                    step="1"
                                    value={parseInt(config.backgroundColor.slice(7, 9) || 'cc', 16)}
                                    onChange={(e) => {
                                        const opacity = parseInt(e.target.value).toString(16).padStart(2, '0');
                                        const color = config.backgroundColor.slice(0, 7);
                                        updateConfig('backgroundColor', color + opacity);
                                    }}
                                    className="w-full h-1 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                                />
                            </div>
                        </div>
                    </div>
                </>
            ) : (
                <ImageTracer
                    onApplySvg={handleOnApplyTracedSvg}
                    vTracerCanvasRef={vTracerCanvasRef}
                    vTracerSvgRef={vTracerSvgRef}
                />
            )}
        </aside>
    );
}
