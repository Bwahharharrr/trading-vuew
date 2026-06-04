export class CanvasContext {
    /**
     * @param {CanvasRenderingContext2D} ctx
     * @param {object} [opts]
     * @param {(d:object, e:Error)=>void} [opts.onError] - diagnostic sink
     * @param {{drawCall:(n?:number)=>void}} [opts.metrics] - RenderMetrics shim
     */
    constructor(ctx: CanvasRenderingContext2D, opts?: {
        onError?: ((d: object, e: Error) => void) | undefined;
        metrics?: {
            drawCall: (n?: number) => void;
        } | undefined;
    });
    ctx: CanvasRenderingContext2D;
    onError: ((d: object, e: Error) => void) | null;
    metrics: {
        drawCall: (n?: number) => void;
    } | null;
    _errs: Map<any, any>;
    /** Point the wrapper at the current canvas context (it can change on resize). */
    use(ctx: any): this;
    /**
     * Draw one overlay layer inside an isolated boundary.
     * @returns {boolean} true if it drew without throwing
     */
    drawOverlay(layer: any): boolean;
    /** Draw a list of (already z-sorted) layers. Returns count drawn ok. */
    drawOverlays(layers: any): number;
    _report(layer: any, e: any): void;
}
