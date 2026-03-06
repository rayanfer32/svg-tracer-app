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
