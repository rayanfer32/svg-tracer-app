export interface TracerConfig {
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
    svgScale: number;
    backgroundColor: string;
    // Slider Limits
    limitDuration: number;
    limitStagger: number;
    limitDelay: number;
    limitStrokeWidth: number;
    limitSvgScale: number;
    limitOverlayOpacity: number;
    limitOverlayScale: number;
}

export interface VTracerConfig {
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
