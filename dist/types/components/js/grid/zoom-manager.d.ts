export default class ZoomManager {
    constructor(grid: any);
    grid: any;
    get range(): any;
    get data(): any;
    get layout(): any;
    get interval(): any;
    get canvas(): any;
    get comp(): any;
    get $p(): any;
    get id(): any;
    mousezoom(delta: any, event: any): void;
    pinchzoom(scale: any): void;
    trackpad_scroll(event: any): void;
}
