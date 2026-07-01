export const RENDER_SCHEDULER: true;
export const REPOSITION_FAST: true;
export const LEVEL: Readonly<{
    NONE: -1;
    CURSOR: 0;
    REPOSITION: 1;
    FULL: 2;
}>;
export class RenderScheduler {
    constructor(onDrain: any, opts?: {});
    _onDrain: any;
    _mask: -1;
    _rafId: any;
    _raf: any;
    _caf: any;
    _drainBound: () => void;
    invalidate(level?: 2): void;
    _drain(): void;
    flush(): void;
    get pending(): -1;
    get scheduled(): boolean;
    destroy(): void;
}
export default RenderScheduler;
