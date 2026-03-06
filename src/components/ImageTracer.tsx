import { ImageIcon, Upload, Sparkles, Palette, Copy, Square, Ruler, Scissors, CircleDot } from 'lucide-react';
import React, { useRef, useState, useEffect } from 'react';
import { NumberInput } from './NumberInput';

interface VTracerConfig {
    mode: 'none' | 'polygon' | 'spline';
    clusteringMode: 'binary' | 'color';
    hierarchical: 'cutout' | 'stacked';
    cornerThreshold: number;
    lengthThreshold: number;
    spliceThreshold: number;
    filterSpeckle: number;
    colorPrecision: number;
    layerDifference: number;
    pathPrecision: number;
    // Slider Limits
    limitFilterSpeckle: number;
    limitColorPrecision: number;
    limitLayerDifference: number;
    limitCornerThreshold: number;
    limitLengthThreshold: number;
    limitSpliceThreshold: number;
    limitPathPrecision: number;
}

interface ImageTracerProps {
    onApplySvg: (svgContent: string) => void;
    vTracerCanvasRef: React.RefObject<HTMLCanvasElement | null>;
    vTracerSvgRef: React.RefObject<SVGSVGElement | null>;
}

export const ImageTracer: React.FC<ImageTracerProps> = ({
    onApplySvg,
    vTracerCanvasRef,
    vTracerSvgRef
}) => {
    const [sourceImage, setSourceImage] = useState<string | null>(null);
    const [isTracing, setIsTracing] = useState(false);
    const [traceProgress, setTraceProgress] = useState(0);
    const [tracedSvgContent, setTracedSvgContent] = useState<string | null>(null);
    const [autoTrace, setAutoTrace] = useState(true);
    const [autoApply, setAutoApply] = useState(false);

    const handleInternalImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file && file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const content = e.target?.result;
                if (typeof content === 'string') {
                    setSourceImage(content);
                }
            };
            reader.readAsDataURL(file);
        }
    };

    const [vTracerConfig, setVTracerConfig] = useState<VTracerConfig>({
        mode: 'spline',
        clusteringMode: 'color',
        hierarchical: 'stacked',
        cornerThreshold: 60,
        lengthThreshold: 4,
        spliceThreshold: 45,
        filterSpeckle: 4,
        colorPrecision: 6,
        layerDifference: 16,
        pathPrecision: 8,
        limitFilterSpeckle: 16,
        limitColorPrecision: 8,
        limitLayerDifference: 255,
        limitCornerThreshold: 180,
        limitLengthThreshold: 10,
        limitSpliceThreshold: 180,
        limitPathPrecision: 16,
    });

    const handleVTracerConfigChange = <T extends keyof VTracerConfig>(key: T, value: VTracerConfig[T]) => {
        setVTracerConfig(prev => ({ ...prev, [key]: value }));
    };

    const handleTrace = async () => {
        if (!sourceImage || !vTracerCanvasRef.current || !vTracerSvgRef.current || !(window as any).vtracer) {
            if (!(window as any).vtracer) alert("VTracer library not loaded.");
            if (!sourceImage) alert("Please upload a reference image first.");
            return;
        }

        setIsTracing(true);
        setTraceProgress(0);

        const canvas = vTracerCanvasRef.current;
        const svg = vTracerSvgRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Clear previous SVG content
        while (svg.firstChild) {
            svg.removeChild(svg.firstChild);
        }

        const img = new Image();
        img.src = sourceImage;
        await new Promise((resolve) => { img.onload = resolve; });

        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        svg.setAttribute('viewBox', `0 0 ${img.naturalWidth} ${img.naturalHeight}`);

        ctx.drawImage(img, 0, 0);

        const deg2rad = (deg: number) => deg / 180 * Math.PI;

        const params = JSON.stringify({
            'canvas_id': 'vtracer-canvas-internal',
            'svg_id': 'vtracer-svg-internal',
            'mode': vTracerConfig.mode,
            'clustering_mode': vTracerConfig.clusteringMode,
            'hierarchical': vTracerConfig.hierarchical,
            'corner_threshold': deg2rad(vTracerConfig.cornerThreshold),
            'length_threshold': vTracerConfig.lengthThreshold,
            'max_iterations': 10,
            'splice_threshold': deg2rad(vTracerConfig.spliceThreshold),
            'filter_speckle': vTracerConfig.filterSpeckle * vTracerConfig.filterSpeckle,
            'color_precision': 8 - vTracerConfig.colorPrecision,
            'layer_difference': vTracerConfig.layerDifference,
            'path_precision': vTracerConfig.pathPrecision,
        });

        const vtracer = (window as any).vtracer;
        const converter = vTracerConfig.clusteringMode === 'color'
            ? vtracer.ColorImageConverter.new_with_string(params)
            : vtracer.BinaryImageConverter.new_with_string(params);

        converter.init();

        const tick = () => {
            let done = false;
            const startTick = performance.now();
            while (!(done = converter.tick()) && performance.now() - startTick < 25) {
                // background processing
            }

            const progress = converter.progress();
            setTraceProgress(progress);

            if (done || progress >= 100) {
                const serialized = new XMLSerializer().serializeToString(vTracerSvgRef.current!);
                setTracedSvgContent(serialized);
                setIsTracing(false);
                converter.free();
            } else {
                requestAnimationFrame(tick);
            }
        };

        requestAnimationFrame(tick);
    };

    // Auto-trace effect
    useEffect(() => {
        if (!autoTrace || !sourceImage || isTracing) return;

        const timer = setTimeout(() => {
            handleTrace();
        }, 300);

        return () => clearTimeout(timer);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [vTracerConfig, sourceImage, autoTrace]);

    // Handle auto-apply when tracedSvgContent changes
    useEffect(() => {
        if (autoApply && tracedSvgContent) {
            onApplySvg(tracedSvgContent);
        }
    }, [tracedSvgContent, autoApply, onApplySvg]);

    const applyTracedSvg = () => {
        if (tracedSvgContent) {
            onApplySvg(tracedSvgContent);
            setTracedSvgContent(null);
        }
    };

    return (
        <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300 text-slate-300">
            <div className="flex items-center gap-2 text-slate-200 font-semibold border-b border-slate-800 pb-1.5" >
                <ImageIcon className="w-4 h-4 text-emerald-400" />
                Image Tracer
            </div>

            {/* Reference Image Preview/Upload */}
            {!sourceImage ? (
                <label
                    className="flex items-center justify-center gap-2 w-full p-4 border-2 border-dashed border-slate-700 rounded-lg cursor-pointer hover:border-emerald-500 hover:bg-slate-800/50 transition-colors group"
                >
                    <ImageIcon className="w-6 h-6 text-slate-500 group-hover:text-emerald-400" />
                    <div className="text-center">
                        <span className="block text-sm font-medium text-slate-400 group-hover:text-emerald-400">Load Image</span>
                        <span className="block text-[10px] text-slate-500">JPG, PNG, WebP</span>
                    </div>
                    <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleInternalImageUpload}
                    />
                </label>
            ) : (
                <div className="relative group rounded-lg overflow-hidden border border-slate-700 bg-slate-800/50 aspect-video flex items-center justify-center">
                    <img src={sourceImage} alt="Preview" className="max-w-full max-h-full object-contain" />
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <label className="flex items-center gap-2 px-3 py-1.5 bg-slate-700 rounded-md text-slate-200 text-xs font-medium cursor-pointer shadow-sm hover:bg-slate-600">
                            <Upload className="w-3 h-3" />
                            Change Image
                            <input type="file" accept="image/*" className="hidden" onChange={handleInternalImageUpload} />
                        </label>
                    </div>
                </div>
            )}

            <div className="space-y-4">
                {/* Clustering Options */}
                <div className="space-y-2">
                    <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">Clustering</label>
                    <div className="grid grid-cols-2 gap-2">
                        <button
                            onClick={() => handleVTracerConfigChange('clusteringMode', 'binary')}
                            className={`py-1.5 text-xs font-medium rounded-md border transition-all ${vTracerConfig.clusteringMode === 'binary' ? 'bg-indigo-900/40 border-indigo-500/50 text-indigo-400' : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600'}`}
                        >
                            B/W
                        </button>
                        <button
                            onClick={() => handleVTracerConfigChange('clusteringMode', 'color')}
                            className={`py-1.5 text-xs font-medium rounded-md border transition-all ${vTracerConfig.clusteringMode === 'color' ? 'bg-indigo-900/40 border-indigo-500/50 text-indigo-400' : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600'}`}
                        >
                            Color
                        </button>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                        <button
                            onClick={() => handleVTracerConfigChange('hierarchical', 'cutout')}
                            className={`py-1.5 text-xs font-medium rounded-md border transition-all ${vTracerConfig.hierarchical === 'cutout' ? 'bg-indigo-900/40 border-indigo-500/50 text-indigo-400' : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600'}`}
                        >
                            Cutout
                        </button>
                        <button
                            onClick={() => handleVTracerConfigChange('hierarchical', 'stacked')}
                            className={`py-1.5 text-xs font-medium rounded-md border transition-all ${vTracerConfig.hierarchical === 'stacked' ? 'bg-indigo-900/40 border-indigo-500/50 text-indigo-400' : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600'}`}
                        >
                            Stacked
                        </button>
                    </div>
                </div>

                {/* Curve Fitting Options */}
                <div className="space-y-2">
                    <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">Curve Fitting</label>
                    <div className="grid grid-cols-3 gap-1">
                        <button
                            onClick={() => handleVTracerConfigChange('mode', 'none')}
                            className={`py-1.5 text-[10px] font-medium rounded-md border transition-all ${vTracerConfig.mode === 'none' ? 'bg-indigo-900/40 border-indigo-500/50 text-indigo-400' : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600'}`}
                        >
                            Pixel
                        </button>
                        <button
                            onClick={() => handleVTracerConfigChange('mode', 'polygon')}
                            className={`py-1.5 text-[10px] font-medium rounded-md border transition-all ${vTracerConfig.mode === 'polygon' ? 'bg-indigo-900/40 border-indigo-500/50 text-indigo-400' : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600'}`}
                        >
                            Polygon
                        </button>
                        <button
                            onClick={() => handleVTracerConfigChange('mode', 'spline')}
                            className={`py-1.5 text-[10px] font-medium rounded-md border transition-all ${vTracerConfig.mode === 'spline' ? 'bg-indigo-900/40 border-indigo-500/50 text-indigo-400' : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600'}`}
                        >
                            Spline
                        </button>
                    </div>
                </div>

                <div className="flex flex-col gap-1">
                    <NumberInput
                        label="Filter Speckle"
                        icon={Sparkles}
                        value={vTracerConfig.filterSpeckle}
                        min={0}
                        max={vTracerConfig.limitFilterSpeckle}
                        step={1}
                        onChange={(val) => handleVTracerConfigChange('filterSpeckle', val)}
                        onMaxChange={(val) => handleVTracerConfigChange('limitFilterSpeckle', val)}
                    />
                    {vTracerConfig.clusteringMode === 'color' && (
                        <>
                            <NumberInput
                                label="Color Precision"
                                icon={Palette}
                                value={vTracerConfig.colorPrecision}
                                min={1}
                                max={vTracerConfig.limitColorPrecision}
                                step={1}
                                onChange={(val) => handleVTracerConfigChange('colorPrecision', val)}
                                onMaxChange={(val) => handleVTracerConfigChange('limitColorPrecision', val)}
                            />
                            <NumberInput
                                label="Layer Difference"
                                icon={Copy}
                                value={vTracerConfig.layerDifference}
                                min={0}
                                max={vTracerConfig.limitLayerDifference}
                                step={1}
                                onChange={(val) => handleVTracerConfigChange('layerDifference', val)}
                                onMaxChange={(val) => handleVTracerConfigChange('limitLayerDifference', val)}
                            />
                        </>
                    )}
                    {vTracerConfig.mode === 'spline' && (
                        <>
                            <NumberInput
                                label="Corner Threshold"
                                icon={Square}
                                value={vTracerConfig.cornerThreshold}
                                min={0}
                                max={vTracerConfig.limitCornerThreshold}
                                step={1}
                                onChange={(val) => handleVTracerConfigChange('cornerThreshold', val)}
                                onMaxChange={(val) => handleVTracerConfigChange('limitCornerThreshold', val)}
                            />
                            <NumberInput
                                label="Segment Length"
                                icon={Ruler}
                                value={vTracerConfig.lengthThreshold}
                                min={3.5}
                                max={vTracerConfig.limitLengthThreshold}
                                step={0.5}
                                onChange={(val) => handleVTracerConfigChange('lengthThreshold', val)}
                                onMaxChange={(val) => handleVTracerConfigChange('limitLengthThreshold', val)}
                            />
                            <NumberInput
                                label="Splice Threshold"
                                icon={Scissors}
                                value={vTracerConfig.spliceThreshold}
                                min={0}
                                max={vTracerConfig.limitSpliceThreshold}
                                step={1}
                                onChange={(val) => handleVTracerConfigChange('spliceThreshold', val)}
                                onMaxChange={(val) => handleVTracerConfigChange('limitSpliceThreshold', val)}
                            />
                        </>
                    )}
                    <NumberInput
                        label="Path Precision"
                        icon={CircleDot}
                        value={vTracerConfig.pathPrecision}
                        min={0}
                        max={vTracerConfig.limitPathPrecision}
                        step={1}
                        onChange={(val) => handleVTracerConfigChange('pathPrecision', val)}
                        onMaxChange={(val) => handleVTracerConfigChange('limitPathPrecision', val)}
                    />
                </div>

                <div className="pt-4 border-t border-slate-800 space-y-3">
                    <div className="flex flex-col gap-2 bg-slate-800/50 p-2 rounded-lg border border-slate-700">
                        <label className="flex items-center justify-between cursor-pointer group">
                            <div className="flex items-center gap-2">
                                <Sparkles className={`w-3.5 h-3.5 ${autoTrace ? 'text-indigo-400' : 'text-slate-500'}`} />
                                <span className="text-xs font-medium text-slate-400">Auto Trace Change</span>
                            </div>
                            <div className="relative">
                                <input
                                    type="checkbox"
                                    className="sr-only"
                                    checked={autoTrace}
                                    onChange={(e) => setAutoTrace(e.target.checked)}
                                />
                                <div className={`block w-8 h-4.5 rounded-full transition-colors ${autoTrace ? 'bg-indigo-500' : 'bg-slate-700'}`}></div>
                                <div className={`absolute left-0.75 top-0.75 bg-white w-3 h-3 rounded-full transition-transform ${autoTrace ? 'transform translate-x-3.5' : ''}`}></div>
                            </div>
                        </label>

                        <label className="flex items-center justify-between cursor-pointer group">
                            <div className="flex items-center gap-2">
                                <Upload className={`w-3.5 h-3.5 ${autoApply ? 'text-emerald-400' : 'text-slate-500'}`} />
                                <span className="text-xs font-medium text-slate-400">Auto Apply to Main</span>
                            </div>
                            <div className="relative">
                                <input
                                    type="checkbox"
                                    className="sr-only"
                                    checked={autoApply}
                                    onChange={(e) => setAutoApply(e.target.checked)}
                                />
                                <div className={`block w-8 h-4.5 rounded-full transition-colors ${autoApply ? 'bg-emerald-500' : 'bg-slate-700'}`}></div>
                                <div className={`absolute left-0.75 top-0.75 bg-white w-3 h-3 rounded-full transition-transform ${autoApply ? 'transform translate-x-3.5' : ''}`}></div>
                            </div>
                        </label>
                    </div>

                    <button
                        onClick={handleTrace}
                        disabled={isTracing || !sourceImage}
                        className={`w-full py-2 px-4 rounded-lg font-bold text-white shadow-lg transition-all transform active:scale-95 flex items-center justify-center gap-2 ${isTracing ? 'bg-slate-400 cursor-not-allowed' : 'bg-linear-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 shadow-zinc-800'}`}
                    >
                        {isTracing ? (
                            <>
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                Tracing {traceProgress}%
                            </>
                        ) : (
                            <>
                                <ImageIcon className="w-4 h-4" />
                                Trace Image
                            </>
                        )}
                    </button>

                    {tracedSvgContent && (
                        <button
                            onClick={applyTracedSvg}
                            className="w-full py-2 px-4 rounded-lg font-bold text-white bg-linear-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700  transition-all transform active:scale-95 flex items-center justify-center gap-2"
                        >
                            <Upload className="w-4 h-4" />
                            Apply to Main SVG
                        </button>
                    )}
                </div>
            </div>

        </div>
    );
};
