import React from 'react';
import { Play, Pause, RotateCcw, Video, Square, SkipForward } from 'lucide-react';

interface PlaybackControlsProps {
    isPlaying: boolean;
    togglePlay: () => void;

    restartAnimation: () => void;
    stopAnimation: () => void;

}

export function PlaybackControls({
    isPlaying,
    togglePlay,

    restartAnimation,
    stopAnimation,

}: PlaybackControlsProps) {
    return (
        <div className="flex flex-col gap-2 w-full" >
            <div className="flex gap-2 w-full">
                <button
                    onClick={togglePlay}
                    className="flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-xl bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 active:scale-[0.98] transition-all"
                >
                    {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                    {isPlaying ? 'Pause' : 'Play'}
                </button>
                <button
                    onClick={stopAnimation}
                    className="flex items-center justify-center p-2 rounded-xl bg-slate-100 text-slate-600 hover:bg-slate-200 active:scale-[0.98] transition-all shadow-sm border border-slate-200"
                    title="Finish Animation"
                >
                    <SkipForward className="w-4 h-4" />
                </button>
                <button
                    onClick={restartAnimation}
                    className="flex items-center justify-center p-2 rounded-xl bg-slate-100 text-slate-600 hover:bg-slate-200 active:scale-[0.98] transition-all shadow-sm border border-slate-200"
                    title="Restart Animation"
                >
                    <RotateCcw className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
}
