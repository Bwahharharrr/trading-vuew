export default class Botbar {
    constructor(canvas: any, comp: any, canvasDynamic?: null);
    canvas: any;
    canvasDynamic: any;
    ctx: any;
    comp: any;
    $p: any;
    data: any;
    range: any;
    layout: any;
    MIN_ZOOM: any;
    MAX_ZOOM: any;
    _destroyed: boolean;
    measureTextCached(text: any): any;
    listeners(): Promise<void>;
    hm: any;
    _throttledWheel: {
        (...args: any[]): void;
        cancel(): void;
    } | undefined;
    mousezoom(delta: any, event: any): void;
    destroy(): void;
    update(): void;
    grid_0: any;
    apply_shaders(): void;
    panel(): void;
    format_date(p: any): any;
    format_cursor_x(): any;
    lbl_highlight(t: any): boolean;
    mousemove(): void;
    mouseout(): void;
    mouseup(): void;
    mousedown(): void;
}
