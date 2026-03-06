import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import type { TracerConfig } from '../types';
import { DEFAULT_SVG } from '../utils/constants';

interface TracerState {
    // UI State
    activeTab: 'animation' | 'tracer';
    setActiveTab: (tab: 'animation' | 'tracer') => void;

    // Content State
    svgContent: string;
    setSvgContent: (svg: string) => void;
    overlayImage: string | null;
    setOverlayImage: (image: string | null) => void;
    animationKey: number;
    restartAnimation: () => void;

    // Configuration State
    config: TracerConfig;
    setConfig: (config: TracerConfig) => void;
    updateConfig: <T extends keyof TracerConfig>(key: T, value: TracerConfig[T]) => void;

    // Playback State
    isPlaying: boolean;
    setIsPlaying: (playing: boolean) => void;
    isStopped: boolean;
    setIsStopped: (stopped: boolean) => void;
    isRecording: boolean;
    setIsRecording: (recording: boolean) => void;
    recordingProgress: number;
    setRecordingProgress: (progress: number) => void;
    currentTime: number;
    setCurrentTime: (time: number) => void;
    totalDuration: number;
    setTotalDuration: (duration: number) => void;

    // Overlay Interaction State
    overlayPos: { x: number; y: number };
    setOverlayPos: (pos: { x: number; y: number }) => void;
    isDragging: boolean;
    setIsDragging: (dragging: boolean) => void;
    isResizing: boolean;
    setIsResizing: (resizing: boolean) => void;
    dragStart: { x: number; y: number };
    setDragStart: (pos: { x: number; y: number }) => void;
    resizeStart: { x: number; y: number; scale: number };
    setResizeStart: (start: { x: number; y: number; scale: number }) => void;
    handleOnApplyTracedSvg: (newSvg: string) => void;
}

const initialConfig: TracerConfig = {
    duration: 1.8,
    stagger: 2,
    delay: 2,
    easing: 'linear',
    direction: 'normal',
    forceOutline: true,
    useOriginalColor: true,
    strokeColor: '#3b82f6',
    strokeWidth: 0.5,
    showOverlay: true,
    overlayOpacity: 0.3,
    isOverlayDraggable: false,
    overlayScale: 1,
    svgScale: 1,
    backgroundColor: '#ffffffcc',
    limitDuration: 10,
    limitStagger: 5,
    limitDelay: 5,
    limitStrokeWidth: 20,
    limitSvgScale: 5,
    limitOverlayOpacity: 1,
    limitOverlayScale: 3
};

export const useTracerStore = create<TracerState>()(subscribeWithSelector((set) => ({
    // UI State
    activeTab: 'animation',
    setActiveTab: (tab) => set({ activeTab: tab }),

    // Content State
    svgContent: DEFAULT_SVG,
    setSvgContent: (svg) => set((state) => ({
        svgContent: svg,
        animationKey: state.animationKey + 1,
        currentTime: 0,
        isPlaying: true,
        isStopped: false
    })),
    overlayImage: null,
    setOverlayImage: (image) => set({ overlayImage: image }),
    animationKey: 0,
    restartAnimation: () => set((state) => ({
        animationKey: state.animationKey + 1,
        currentTime: 0,
        isPlaying: true,
        isStopped: false
    })),

    // Configuration State
    config: initialConfig,
    setConfig: (config) => set({ config }),
    updateConfig: (key, value) => set((state) => ({
        config: { ...state.config, [key]: value },
        animationKey: state.animationKey + 1,
        isPlaying: true,
        isStopped: false,
        currentTime: 0
    })),

    // Playback State
    isPlaying: true,
    setIsPlaying: (playing) => set({ isPlaying: playing }),
    isStopped: false,
    setIsStopped: (stopped) => set({ isStopped: stopped }),
    isRecording: false,
    setIsRecording: (recording) => set({ isRecording: recording }),
    recordingProgress: 0,
    setRecordingProgress: (progress) => set({ recordingProgress: progress }),
    currentTime: 0,
    setCurrentTime: (time) => set({ currentTime: time }),
    totalDuration: 0,
    setTotalDuration: (duration) => set({ totalDuration: duration }),

    // Overlay Interaction State
    overlayPos: { x: 0, y: 0 },
    setOverlayPos: (pos) => set({ overlayPos: pos }),
    isDragging: false,
    setIsDragging: (dragging) => set({ isDragging: dragging }),
    isResizing: false,
    setIsResizing: (resizing) => set({ isResizing: resizing }),
    dragStart: { x: 0, y: 0 },
    setDragStart: (pos) => set({ dragStart: pos }),
    resizeStart: { x: 0, y: 0, scale: 1 },
    setResizeStart: (start) => set({ resizeStart: start }),
    handleOnApplyTracedSvg: (newSvg) => set((state) => ({
        svgContent: newSvg,
        animationKey: state.animationKey + 1,
        activeTab: 'animation',
        currentTime: 0,
        isPlaying: true,
        isStopped: false
    })),
})));
