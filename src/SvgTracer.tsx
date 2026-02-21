import {
    Play, Pause, RotateCcw, Upload, Settings2,
    Image as ImageIcon, MousePointerClick, ExternalLink, Wrench
} from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';

interface TracerConfig {
    duration: number;
    stagger: number;
    delay: number;
    easing: string;
    direction: string;
    forceOutline: boolean;
    useOriginalColor: boolean;
    strokeColor: string;
    strokeWidth: number;
    showOverlay: boolean;
    overlayOpacity: number;
    isOverlayDraggable: boolean;
    overlayScale: number;
}

// A default complex SVG to demonstrate the effect immediately
const DEFAULT_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="100%" height="100%">
  <g stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round">
    <path d="M200 50 L350 150 L350 300 L200 350 L50 300 L50 150 Z" fill="#6366f1" />
    <path d="M200 50 L200 200" stroke="#f43f5e" />
    <path d="M50 150 L200 200" stroke="#f59e0b" />
    <path d="M350 150 L200 200" stroke="#10b981" />
    <path d="M200 200 L200 350" stroke="#3b82f6" />
    <path d="M50 300 L200 200" stroke="#8b5cf6" />
    <path d="M350 300 L200 200" stroke="#ec4899" />
    <circle cx="200" cy="200" r="80" stroke="#64748b" />
    <circle cx="200" cy="200" r="40" stroke="#94a3b8" />
    <path d="M160 160 L240 240 M240 160 L160 240" stroke="#facc15" />
  </g>
</svg>
`;

export default function SvgTracer() {
    const [svgContent, setSvgContent] = useState<string>(DEFAULT_SVG);
    const [overlayImage, setOverlayImage] = useState<string | null>(null);
    const [overlayPos, setOverlayPos] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    const [isPlaying, setIsPlaying] = useState<boolean>(true);
    const [animationKey, setAnimationKey] = useState<number>(0); // Used to force re-render and restart animation
    const svgContainerRef = useRef<HTMLDivElement>(null);

    // Configuration state
    const [config, setConfig] = useState<TracerConfig>({
        duration: 2,
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

    const handleConfigChange = <T extends keyof TracerConfig>(key: T, value: TracerConfig[T]) => {
        setConfig(prev => ({ ...prev, [key]: value }));
        // Auto-restart animation when config changes for better UX
        setAnimationKey(prev => prev + 1);
        setIsPlaying(true);
    };

    const restartAnimation = () => {
        setAnimationKey(prev => prev + 1);
        setIsPlaying(true);
    };

    const handleMouseDown = (e: React.MouseEvent) => {
        if (!config.isOverlayDraggable || !overlayImage) return;
        setIsDragging(true);
        setDragStart({ x: e.clientX - overlayPos.x, y: e.clientY - overlayPos.y });
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!isDragging) return;
        setOverlayPos({
            x: e.clientX - dragStart.x,
            y: e.clientY - dragStart.y
        });
    };

    const handleMouseUp = () => {
        setIsDragging(false);
    };

    const resetOverlayPosition = () => {
        setOverlayPos({ x: 0, y: 0 });
        handleConfigChange('overlayScale', 1);
    };

    useEffect(() => {
        if (!svgContainerRef.current) return;

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
    }, [svgContent, config, animationKey, isPlaying]);
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
            <aside className="w-full md:w-80 bg-white border-r border-slate-200 p-6 flex flex-col gap-6 shadow-sm z-10 overflow-y-auto" >
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2 text-indigo-600 mb-1" >
                        <MousePointerClick className="w-6 h-6" />
                        SVG Tracer
                    </h1>
                    < p className="text-sm text-slate-500" > Animate paths sequentially.</p>
                </div>

                {/* Upload Section */}
                <div className="space-y-3 border-b border-slate-100 pb-6" >
                    <label className="flex items-center justify-center gap-2 w-full p-4 border-2 border-dashed border-slate-300 rounded-xl cursor-pointer hover:border-indigo-400 hover:bg-indigo-50/50 transition-colors group" >
                        <Upload className="w-5 h-5 text-slate-400 group-hover:text-indigo-500" />
                        <span className="text-sm font-medium text-slate-600 group-hover:text-indigo-600" >
                            Load Custom SVG
                        </span>
                        < input
                            type="file"
                            accept=".svg"
                            className="hidden"
                            onChange={handleFileUpload}
                        />
                    </label>

                    < label className="flex items-center justify-center gap-2 w-full p-4 border-2 border-dashed border-slate-300 rounded-xl cursor-pointer hover:border-emerald-400 hover:bg-emerald-50/50 transition-colors group" >
                        <ImageIcon className="w-5 h-5 text-slate-400 group-hover:text-emerald-500" />
                        <span className="text-sm font-medium text-slate-600 group-hover:text-emerald-600" >
                            {overlayImage ? 'Change Reference Image' : 'Load Reference Image'}
                        </span>
                        < input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handleImageUpload}
                        />
                    </label>

                    {/* Toolkit Section */}
                    <div className="pt-2">
                        <div className="flex items-center gap-2 text-slate-800 font-semibold mb-3 px-1" >
                            <Wrench className="w-4 h-4 text-indigo-500" />
                            Toolkit
                        </div>
                        <div className="flex flex-col gap-1.5">
                            <ToolkitLink href="https://mixboard.google.com/" label="Mixboard" />
                            <ToolkitLink href="https://www.visioncortex.org/vtracer/" label="Image VTracer" />
                            <ToolkitLink href="https://editor.graphite.art/" label="Graphite Editor" />
                            {/* <ToolkitLink href="https://svgartista.net/" label="SVG Animator" /> */}
                            {/* <ToolkitLink href="https://svglogos.dev/" label="Test SVGs" /> */}
                        </div>
                    </div>
                </div>

                {/* Playback Controls */}
                <div className="flex items-center gap-3" >
                    <button
                        onClick={() => setIsPlaying(!isPlaying)}
                        className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-indigo-600 text-white font-medium hover:bg-indigo-700 active:scale-[0.98] transition-all"
                    >
                        {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                        {isPlaying ? 'Pause' : 'Play'}
                    </button>
                    < button
                        onClick={restartAnimation}
                        className="flex items-center justify-center p-2.5 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 active:scale-[0.98] transition-all"
                        title="Restart Animation"
                    >
                        <RotateCcw className="w-5 h-5" />
                    </button>
                </div>

                {/* Configuration */}
                <div className="space-y-5" >
                    <div className="flex items-center gap-2 text-slate-800 font-semibold border-b border-slate-100 pb-2" >
                        <Settings2 className="w-4 h-4" />
                        Animation Properties
                    </div>

                    < ControlGroup label="Duration (per path)" value={`${config.duration}s`}>
                        <input
                            type="range" min="0.1" max="10" step="0.1"
                            value={config.duration}
                            onChange={(e) => handleConfigChange('duration', parseFloat(e.target.value))}
                            className="w-full accent-indigo-600"
                        />
                    </ControlGroup>

                    < ControlGroup label="Stagger Step" value={`${config.stagger}s`}>
                        <input
                            type="range" min="0" max="5" step="0.1"
                            value={config.stagger}
                            onChange={(e) => handleConfigChange('stagger', parseFloat(e.target.value))}
                            className="w-full accent-indigo-600"
                        />
                    </ControlGroup>

                    < ControlGroup label="Initial Delay" value={`${config.delay}s`}>
                        <input
                            type="range" min="0" max="5" step="0.1"
                            value={config.delay}
                            onChange={(e) => handleConfigChange('delay', parseFloat(e.target.value))}
                            className="w-full accent-indigo-600"
                        />
                    </ControlGroup>

                    < ControlGroup label="Stroke Width" value={`${config.strokeWidth}px`}>
                        <input
                            type="range" min="0.1" max="20" step="0.1"
                            value={config.strokeWidth}
                            onChange={(e) => handleConfigChange('strokeWidth', parseFloat(e.target.value))}
                            className="w-full accent-indigo-600"
                        />
                    </ControlGroup>

                    < div className="grid grid-cols-2 gap-4" >
                        <div className="space-y-1.5" >
                            <label className="text-xs font-medium text-slate-500 uppercase tracking-wider" > Easing </label>
                            < select
                                value={config.easing}
                                onChange={(e) => handleConfigChange('easing', e.target.value)}
                                className="w-full text-sm p-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
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
                                className="w-full text-sm p-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                            >
                                <option value="normal" > Normal </option>
                                < option value="reverse" > Reverse </option>
                                < option value="alternate" > Alternate </option>
                                < option value="alternate-reverse" > Alt Reverse </option>
                            </select>
                        </div>
                    </div>

                    < div className="pt-4 border-t border-slate-100 space-y-4" >
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

                        < div className="pt-4 border-t border-slate-100 space-y-4" >
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
                                        <ControlGroup label="Overlay Opacity" value={`${Math.round(config.overlayOpacity * 100)}%`}>
                                            <input
                                                type="range" min="0" max="1" step="0.01"
                                                value={config.overlayOpacity}
                                                onChange={(e) => handleConfigChange('overlayOpacity', parseFloat(e.target.value))}
                                                className="w-full accent-indigo-600"
                                            />
                                        </ControlGroup>

                                        <ControlGroup label="Overlay Scale" value={`${Math.round(config.overlayScale * 100)}%`}>
                                            <input
                                                type="range" min="0.1" max="3" step="0.05"
                                                value={config.overlayScale}
                                                onChange={(e) => handleConfigChange('overlayScale', parseFloat(e.target.value))}
                                                className="w-full accent-emerald-600"
                                            />
                                        </ControlGroup>

                                        <div className="space-y-3 pt-2">
                                            <label className="flex items-center justify-between cursor-pointer" >
                                                <span className="text-sm font-medium text-slate-700" > Drag to Position image </span>
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
            <main className="flex-1 flex flex-col bg-slate-100 overflow-hidden relative" >
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
                                className={`absolute inset-0 flex items-center justify-center p-8 transition-opacity duration-300 ${config.isOverlayDraggable ? 'cursor-move pointer-events-auto z-20' : 'pointer-events-none z-0'}`}
                                style={{
                                    opacity: config.overlayOpacity,
                                    transform: `translate(${overlayPos.x}px, ${overlayPos.y}px) scale(${config.overlayScale})`
                                }}
                                onMouseDown={handleMouseDown}
                            >
                                <img
                                    src={overlayImage}
                                    alt="Reference"
                                    className="max-w-full max-h-full object-contain select-none"
                                />
                            </div>
                        )}

                        {/* We use dangerouslySetInnerHTML to inject the raw SVG.
                The key prop forces React to completely destroy and recreate this DOM node 
                when animationKey changes, ensuring CSS animations restart cleanly.
             */}
                        < div
                            key={animationKey}
                            ref={svgContainerRef}
                            className={`w-full h-full flex items-center justify-center z-10 [&>svg]:w-full [&>svg]:h-full [&>svg]:max-w-full [&>svg]:max-h-full ${config.forceOutline ? 'force-outline' : ''}`}
                            dangerouslySetInnerHTML={{ __html: svgContent }}
                        />
                    </div>
                </div>

                {/* Status bar */}
                <div className="h-12 bg-white border-t border-slate-200 flex items-center px-4 justify-between z-10 text-xs text-slate-500 relative" >
                    <div className="flex items-center gap-2" >
                        <span className="relative flex h-2 w-2" >
                            {isPlaying && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" > </span>}
                            <span className={`relative inline-flex rounded-full h-2 w-2 ${isPlaying ? 'bg-emerald-500' : 'bg-slate-400'}`}> </span>
                        </span>
                        {isPlaying ? 'Animation Running' : 'Paused'}
                    </div>
                    < div > SVG Tracer preview environment </div>
                </div>
            </main>
        </div>
    );
}

// Helper component for uniform slider groups
interface ControlGroupProps {
    label: string;
    value: string;
    children: React.ReactNode;
}

function ControlGroup({ label, value, children }: ControlGroupProps) {
    return (
        <div className="space-y-2" >
            <div className="flex justify-between items-center text-sm" >
                <label className="font-medium text-slate-700" > {label} </label>
                < span className="text-slate-500 font-mono text-xs bg-slate-100 px-2 py-0.5 rounded" > {value} </span>
            </div>
            {children}
        </div>
    );
}

// Helper component for Tookit links
function ToolkitLink({ href, label }: { href: string; label: string }) {
    return (
        <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between group p-2 rounded-lg border border-slate-100 hover:border-indigo-200 hover:bg-indigo-50/30 transition-all"
        >
            <span className="text-xs font-medium text-slate-600 group-hover:text-indigo-600 truncate">{label}</span>
            <ExternalLink className="w-3 h-3 text-slate-300 group-hover:text-indigo-400 flex-shrink-0" />
        </a>
    );
}