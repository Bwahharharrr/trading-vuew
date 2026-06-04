export default class FrameAnimation {
    constructor(cb: any);
    t0: number;
    t: number;
    cb: any;
    running: boolean;
    rafId: number | null;
    _loop(): void;
    stop(): void;
}
