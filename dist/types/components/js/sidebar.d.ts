export default class Sidebar {
    constructor(canvas: any, comp: any, side?: string, canvasDynamic?: null);
    canvas: any;
    canvasDynamic: any;
    ctx: any;
    comp: any;
    $p: any;
    data: any;
    range: any;
    id: any;
    layout: any;
    side: string;
    _destroyed: boolean;
    listeners(): Promise<void>;
    hm: any;
    _throttledWheel: {
        (...args: any[]): void;
        cancel(): void;
    } | undefined;
    mc: any;
    zoom: any;
    y_range: any[] | undefined;
    drug: any;
    _throttledPanmove: {
        (...args: any[]): void;
        cancel(): void;
    } | undefined;
    update(): void;
    _lastPanelY: any;
    updatePanelOnly(): void;
    _clearPanel(panelY: any): void;
    apply_shaders(): void;
    upper_border(): void;
    panel(): void;
    _lastY$: any;
    _lastPrec: any;
    _lastLbl: any;
    calc_zoom(event: any): any;
    calc_range(diff1?: number, diff2?: number): any[];
    mousezoom(delta: any, event: any): void;
    rezoom_range(delta: any, diff1: any, diff2: any): void;
    destroy(): void;
    mousemove(): void;
    mouseout(): void;
    mouseup(): void;
    mousedown(): void;
}
