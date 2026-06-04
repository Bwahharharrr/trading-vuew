export class RenderEngine {
    /**
     * @param {object} [opts] forwarded to the CanvasContext (onError, metrics).
     */
    constructor(opts?: object);
    cc: CanvasContext;
    /**
     * Render the full static canvas.
     * @param {CanvasRenderingContext2D} ctx
     * @param {object} frame
     * @param {{width:number,height:number}} frame.canvas
     * @param {object} frame.layout - resolved grid layout (xs/ys/width/height/ti_map)
     * @param {object} frame.colors - theme colours ({grid, scale, ...})
     * @param {Array}  frame.overlays - PRE-SORTED layer list
     * @param {Array}  [frame.shaders] - shader list
     * @param {object} [frame.shaderProps] - props passed to each shader.draw
     * @param {object} [frame.crosshair] - crosshair layer
     * @param {boolean} [frame.drawCrosshairHere] - draw crosshair on this (static) ctx
     * @param {boolean} [frame.upperBorder] - draw the top scale border
     */
    renderStatic(ctx: CanvasRenderingContext2D, frame: {
        canvas: {
            width: number;
            height: number;
        };
        layout: object;
        colors: object;
        overlays: any[];
        shaders?: any[] | undefined;
        shaderProps?: object | undefined;
        crosshair?: object | undefined;
        drawCrosshairHere?: boolean | undefined;
        upperBorder?: boolean | undefined;
    }): void;
    /** Render only the dynamic canvas (crosshair). */
    renderDynamic(ctx: any, canvas: any, crosshair: any): void;
    /** Grid lines (+ optional top scale border). */
    drawGrid(ctx: any, layout: any, colors: any, upperBorder: any): void;
    /** Run grid shaders, each in its own save/restore scope. */
    drawShaders(ctx: any, shaders: any, props: any): void;
}
import { CanvasContext } from './canvas-context.js';
