export default class PanManager {
    constructor(grid: any);
    grid: any;
    fade: FrameAnimation | null;
    get range(): any;
    get layout(): any;
    get comp(): any;
    get $p(): any;
    get id(): any;
    mousedrag(x: any, y: any): void;
    pan_fade(event: any): void;
    stopFade(): void;
    destroy(): void;
}
import FrameAnimation from '../../../stuff/frame.js';
