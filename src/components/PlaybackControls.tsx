import React from 'react';
import { Play, Pause, RotateCcw, Video, Square } from 'lucide-react';

interface PlaybackControlsProps {
    isPlaying: boolean;
    setIsPlaying: (playing: boolean) => void;
    isRecording: boolean;
    recordingProgress: number;
    restartAnimation: () => void;
    handleRecord: () => void;
    stopRecording: () => void;
}

export function PlaybackControls({
    isPlaying,
    setIsPlaying,
    isRecording,
    recordingProgress,
    restartAnimation,
    handleRecord,
    stopRecording
}: PlaybackControlsProps) {
    return (
        <div className="absolute top-6 right-6 z-20 flex items-center gap-3 bg-white/60 backdrop-blur-md p-2 rounded-2xl shadow-sm border border-white/50" >
            <button
                onClick={() => setIsPlaying(!isPlaying)}
                className="flex items-center justify-center gap-2 py-2 px-4 rounded-xl bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 active:scale-[0.98] transition-all"
            >
                {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                {isPlaying ? 'Pause' : 'Play'}
            </button>
            <button
                onClick={restartAnimation}
                className="flex items-center justify-center p-2 rounded-xl bg-slate-100/80 text-slate-600 hover:bg-white active:scale-[0.98] transition-all shadow-sm"
                title="Restart Animation"
            >
                <RotateCcw className="w-4 h-4" />
            </button>
            <button
                onClick={isRecording ? stopRecording : handleRecord}
                className={`flex items-center justify-center gap-2 py-2 px-4 rounded-xl text-sm font-medium transition-all active:scale-[0.98] ${isRecording
                    ? 'bg-rose-500 text-white hover:bg-rose-600 shadow-md'
                    : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm'
                    }`}
                title={isRecording ? "Stop Recording" : "Record as WebM"}
            >
                {isRecording ? <Square className="w-4 h-4 fill-current" /> : <Video className="w-4 h-4" />}
                {isRecording ? `Stop (${Math.round(recordingProgress * 100)}%)` : 'Record'}
            </button>
        </div>
    );
}
