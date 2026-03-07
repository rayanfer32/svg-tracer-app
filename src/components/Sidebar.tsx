
import React from 'react';
import { ToolkitLink } from './ToolkitLink';
import { ImageTracer } from '../pages/ImageTracer';

import { useTracerStore } from '../store/useTracerStore';
import { AnimationControls } from './AnimationControls';

interface SidebarProps {
    vTracerCanvasRef: React.RefObject<HTMLCanvasElement | null>;
    vTracerSvgRef: React.RefObject<SVGSVGElement | null>;
}

export function Sidebar({
    vTracerCanvasRef,
    vTracerSvgRef
}: SidebarProps) {

    const { activeTab, handleOnApplyTracedSvg, setActiveTab } = useTracerStore();

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
                    className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-all ${activeTab === 'animation' ? 'bg-slate-700 shadow-sm text-indigo-400 border border-slate-600/50' : 'text-slate-400 hover:text-slate-200'}`}
                >
                    Animation
                </button>
                <button
                    onClick={() => setActiveTab('tracer')}
                    className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-all ${activeTab === 'tracer' ? 'bg-slate-700 shadow-sm text-indigo-400 border border-slate-600/50' : 'text-slate-400 hover:text-slate-200'}`}
                >
                    Tracer
                </button>
            </div>

            {activeTab === 'animation' ? (
                <AnimationControls />
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
