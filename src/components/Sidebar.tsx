import {
    Upload, Settings2,
    Image as ImageIcon, MousePointerClick, Wrench,
    Timer, Layers, Watch, PenTool, Maximize, Contrast,
    Undo2,
    Move
} from 'lucide-react';
import React from 'react';
import { NumberInput } from './NumberInput';
import { ToolkitLink } from './ToolkitLink';
import { PlaybackControls } from './PlaybackControls';
import { ImageTracer } from './ImageTracer';

import { useTracerStore } from '../store/useTracerStore';

interface SidebarProps {
    handleRecord: () => Promise<void>;
    stopRecording: () => void;
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
        restartAnimation,
        currentTime, setCurrentTime,
        totalDuration,
        setSvgContent,
        setOverlayImage,
        setTracerSourceImage,
        setOverlayPos,
        handleOnApplyTracedSvg,
        svgPos, setSvgPos,
        isEditingMode, setIsEditingMode
    } = useTracerStore();

    const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        if (file.type === 'image/svg+xml') {
            const reader = new FileReader();
            reader.onload = (e) => {
                const content = e.target?.result;
                if (typeof content === 'string') {
                    setSvgContent(content);
                }
            };
            reader.readAsText(file);
        } else if (file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const content = e.target?.result;
                if (typeof content === 'string') {
                    setTracerSourceImage(content);
                    setActiveTab('tracer');
                }
            };
            reader.readAsDataURL(file);
        } else {
            alert("Please upload a valid SVG or image file.");
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
        if (!file) return;

        if (file.type === 'image/svg+xml') {
            const reader = new FileReader();
            reader.onload = (ev) => {
                const content = ev.target?.result;
                if (typeof content === 'string') {
                    setSvgContent(content);
                }
            };
            reader.readAsText(file);
        } else if (file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = (ev) => {
                const content = ev.target?.result;
                if (typeof content === 'string') {
                    setTracerSourceImage(content);
                    setActiveTab('tracer');
                }
            };
            reader.readAsDataURL(file);
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
        if (isStopped || currentTime >= totalDuration - 0.01) {
            restartAnimation();
        } else {
            setIsPlaying(!isPlaying);
        }
    };
    return (
        <aside className="w-full md:w-80 bg-slate-900 border-r border-slate-800 p-4 flex flex-col gap-4 shadow-xl z-10 overflow-y-auto text-sm shrink-0 text-slate-300" >

            <div className="flex flex-row flex-wrap gap-1">
                <ToolkitLink href="https://mixboard.google.com/" label="Mixboard" />
                <ToolkitLink href="https://www.visioncortex.org/vtracer/" label="VTracer" />
                <ToolkitLink href="https://editor.graphite.art/" label="Graphite" />
                <ToolkitLink href="https://in.pinterest.com/search/pins/?q=creative%20logo&rs=typed" label="Pinterest" />
                <ToolkitLink href="https://docs.google.com/document/d/1xnezyU3p-TQlPdfR1kUeJykmh0OPkIlanVkQCjbpPgk" label="Notes" />
                <ToolkitLink href="https://svgco.de/" label="Svgco.de" />
                <ToolkitLink href="https://svgomg.net/" label="SVGOMG" />
            </div>


            {/* Tab Switcher */}
            <div className="flex bg-slate-800 p-1 rounded-lg">
                <button
                    onClick={() => setActiveTab('animation')}
                    className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all ${activeTab === 'animation' ? 'bg-slate-700 shadow-sm text-indigo-400 border border-slate-600/50' : 'text-slate-400 hover:text-slate-200'}`}
                >
                    Animation
                </button>
                <button
                    onClick={() => setActiveTab('tracer')}
                    className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all ${activeTab === 'tracer' ? 'bg-slate-700 shadow-sm text-indigo-400 border border-slate-600/50' : 'text-slate-400 hover:text-slate-200'}`}
                >
                    Tracer
                </button>
            </div>

            {activeTab === 'animation' ? (
                <>
                    {/* Playback Controls */}
                    <div className="border-b border-slate-800 pb-4 space-y-4">

                        {/* Upload Section */}
                        <div className="space-y-2 border-b border-slate-800 pb-4" >
                            <div className='flex gap-2' onDragOver={(e) => e.preventDefault()}>
                                <label
                                    className="flex items-center justify-center gap-1.5 w-full p-2 border-2 border-dashed border-slate-700 rounded-lg cursor-pointer hover:border-indigo-500 hover:bg-slate-800/50 transition-colors group"
                                    onDragOver={(e) => e.preventDefault()}
                                    onDrop={handleSvgDrop}
                                >
                                    <Upload className="w-5 h-5 text-slate-500 group-hover:text-indigo-400" />
                                    <span className="text-sm font-medium text-slate-400 group-hover:text-indigo-400" >
                                        Load Image/SVG
                                    </span>
                                    < input
                                        type="file"
                                        accept=".svg,image/*"
                                        className="hidden"
                                        onChange={handleFileUpload}
                                    />
                                </label>


                            </div>


                        </div>
                        <PlaybackControls
                            isPlaying={isPlaying}
                            togglePlay={togglePlay}

                            restartAnimation={restartAnimation}
                            stopAnimation={stopAnimation}

                        />

                        <div className="space-y-1.5 px-1">
                            <div className="flex justify-between text-[12px] font-medium text-slate-500 uppercase tracking-wider">
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
                                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                            />
                        </div>
                    </div>



                    {/* Workspace Transform */}
                    <div className="space-y-3 pb-4 border-b border-slate-800">
                        <div className="flex items-center justify-between">


                            <span className="flex gap-2 text-sm font-medium text-slate-400 group-hover:text-slate-300">
                                <Move size={16} />
                                Position Svg</span>

                            <button
                                onClick={() => {
                                    setSvgPos({ x: 0, y: 0 });
                                    updateConfig('svgScale', 1);
                                }}
                                className="text-[10px] text-slate-500 hover:text-indigo-400 flex items-center gap-1 transition-colors"
                            >
                                <Undo2 className="w-3 h-3" />
                                Reset
                            </button>
                            <label className="flex items-center justify-between cursor-pointer gap-2">
                                <div className="relative">
                                    <input
                                        type="checkbox"
                                        className="sr-only"
                                        checked={isEditingMode}
                                        onChange={(e) => setIsEditingMode(e.target.checked)}
                                    />
                                    <div className={`block w-10 h-6 rounded-full transition-colors ${isEditingMode ? 'bg-indigo-500' : 'bg-slate-700'}`}></div>
                                    <div className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${isEditingMode ? 'transform translate-x-4' : ''}`}></div>
                                </div>
                            </label>
                        </div>


                    </div>

                    {/* Configuration */}
                    <div className="space-y-3" >
                        <div className="flex items-center gap-2 text-slate-200 font-semibold border-b border-slate-800 pb-1.5" >
                            <Settings2 className="w-4 h-4 text-indigo-400" />
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
                                    className="w-full text-sm p-1 bg-slate-800 border border-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-300"
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
                                    className="w-full text-sm p-1 bg-slate-800 border border-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-300"
                                >
                                    <option value="normal" > Normal </option>
                                    < option value="reverse" > Reverse </option>
                                    < option value="alternate" > Alternate </option>
                                    < option value="alternate-reverse" > Alt Reverse </option>
                                </select>
                            </div>
                        </div>

                        < div className="pt-2 border-t border-slate-800 space-y-2.5" >
                            <label className="flex items-center justify-between cursor-pointer" >
                                <span className="text-sm font-medium text-slate-400" > Force Outline Mode </span>
                                < div className="relative" >
                                    <input
                                        type="checkbox"
                                        className="sr-only"
                                        checked={config.forceOutline}
                                        onChange={(e) => updateConfig('forceOutline', e.target.checked)}
                                    />
                                    < div className={`block w-10 h-6 rounded-full transition-colors ${config.forceOutline ? 'bg-indigo-500' : 'bg-slate-700'}`}> </div>
                                    < div className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${config.forceOutline ? 'transform translate-x-4' : ''}`}> </div>
                                </div>
                            </label>

                            <label className="flex items-center justify-between cursor-pointer" >
                                <span className="text-sm font-medium text-slate-400" > Use Original Fill Colors </span>
                                < div className="relative" >
                                    <input
                                        type="checkbox"
                                        className="sr-only"
                                        checked={config.useOriginalColor}
                                        onChange={(e) => updateConfig('useOriginalColor', e.target.checked)}
                                    />
                                    < div className={`block w-10 h-6 rounded-full transition-colors ${config.useOriginalColor ? 'bg-indigo-500' : 'bg-slate-700'}`}> </div>
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
                                            className="w-8 h-8 rounded border border-slate-700 bg-slate-800 cursor-pointer p-0.5"
                                        />
                                    </div>
                                )}

                            < div className="pt-2 border-t border-slate-800 space-y-2.5" >



                                <label className="flex items-center justify-between cursor-pointer" >
                                    <span className="text-sm font-medium text-slate-400" > Show Reference Image </span>
                                    < div className="relative" >
                                        <input
                                            type="checkbox"
                                            className="sr-only"
                                            checked={config.showOverlay}
                                            onChange={(e) => updateConfig('showOverlay', e.target.checked)}
                                        />
                                        < div className={`block w-10 h-6 rounded-full transition-colors ${config.showOverlay ? 'bg-indigo-500' : 'bg-slate-700'}`}> </div>
                                        < div className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${config.showOverlay ? 'transform translate-x-4' : ''}`}> </div>
                                    </div>
                                </label>

                                {
                                    config.showOverlay && (
                                        <>

                                            < label
                                                className="flex items-center justify-center gap-1.5 w-full p-2 border-2 border-dashed border-slate-700 rounded-lg cursor-pointer hover:border-emerald-500 hover:bg-slate-800/50 transition-colors group"
                                                onDragOver={(e) => e.preventDefault()}
                                                onDrop={handleImageDrop}
                                            >
                                                <ImageIcon className="w-4 h-4 text-slate-500 group-hover:text-emerald-400" />
                                                <span className="text-xs font-medium text-slate-400 group-hover:text-emerald-400" >
                                                    Ref Image
                                                </span>
                                                < input
                                                    type="file"
                                                    accept="image/*"
                                                    className="hidden"
                                                    onChange={handleImageUpload}
                                                />
                                            </label>

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
                                                <div className="flex items-center justify-between" >
                                                    <span className="text-sm font-medium text-slate-400 flex items-center gap-2" >
                                                        <Move size={16} /> Position Ref image
                                                    </span>

                                                    <div className="flex items-center gap-4">
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                resetOverlayPosition();
                                                            }}
                                                            className='flex items-center gap-1 text-slate-500 hover:text-indigo-400 transition-colors text-xs'
                                                        >
                                                            <span>Reset</span>
                                                            <Undo2 size={14} />
                                                        </button>

                                                        <label className="relative inline-flex items-center cursor-pointer">
                                                            <input
                                                                type="checkbox"
                                                                className="sr-only peer"
                                                                checked={config.isOverlayDraggable}
                                                                onChange={(e) => updateConfig('isOverlayDraggable', e.target.checked)}
                                                            />
                                                            <div className={`w-10 h-6 rounded-full transition-colors ${config.isOverlayDraggable ? 'bg-indigo-500' : 'bg-slate-700'}`}></div>
                                                            <div className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${config.isOverlayDraggable ? 'transform translate-x-4' : ''}`}></div>
                                                        </label>
                                                    </div>
                                                </div>
                                            </div>
                                        </>
                                    )}
                            </div>
                        </div>

                        <div className="flex flex-col gap-2 pt-2 border-t border-slate-800 space-y-2.5">
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium text-slate-400">Background</span>
                                <input
                                    type="color"
                                    value={config.backgroundColor.slice(0, 7)}
                                    onChange={(e) => {
                                        const hex = e.target.value;
                                        updateConfig('backgroundColor', hex + (config.backgroundColor.slice(7, 9) || 'cc'));
                                    }}
                                    className="w-8 h-8 rounded border border-slate-700 bg-slate-800 cursor-pointer p-0.5"
                                />
                            </div>
                            <div className="space-y-1 w-full">
                                <div className="flex justify-between text-[12px] font-medium text-slate-500 uppercase tracking-wider">
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
                                    className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
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
