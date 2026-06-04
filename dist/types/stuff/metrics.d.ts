export default class RenderMetrics {
    constructor(cap?: number);
    cap: number;
    reset(): void;
    _durations: any[] | undefined;
    _stamps: any[] | undefined;
    _drawCalls: number | undefined;
    _frameDrawCalls: any[] | undefined;
    _open: number | null | undefined;
    frame(fn: any): any;
    begin(): void;
    end(): void;
    drawCall(n?: number): void;
    snapshot(): {
        frames: number;
        fps: number;
        p50: number;
        p95: number;
        p99: number;
        max: number;
        avgDrawCalls: number;
    };
}
