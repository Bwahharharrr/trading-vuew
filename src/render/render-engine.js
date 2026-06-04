
// RenderEngine (Phase 3.3b) — the framework-agnostic core of static-canvas
// rendering, extracted from the Vue-coupled grid-renderer / Grid.vue lifecycle.
//
// It owns the PURE drawing pipeline: clear -> shaders -> grid -> overlays
// (behind the CanvasContext per-overlay error boundary) -> crosshair. It takes
// an explicit, immutable `frame` ({ canvas, layout, colors, overlays, ... })
// and a 2D context — no `this.grid`, no props, no Vue. grid-renderer keeps the
// dirty-flag detection, dual-canvas decision, layout resolution and lifecycle,
// and simply builds a frame and delegates here. The draw sequence is identical
// to the old inline code, so the component render + visual baselines stay green.

import { CanvasContext } from './canvas-context.js'

export class RenderEngine {

    /**
     * @param {object} [opts] forwarded to the CanvasContext (onError, metrics).
     */
    constructor(opts = {}) {
        // The per-overlay error boundary (Phase 3.3a) lives inside the engine.
        this.cc = new CanvasContext(null, opts)
    }

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
    renderStatic(ctx, frame) {
        const { canvas, layout } = frame
        if (!layout) return

        ctx.clearRect(0, 0, canvas.width, canvas.height)

        if (frame.shaders && frame.shaders.length) {
            this.drawShaders(ctx, frame.shaders, frame.shaderProps)
        }

        this.drawGrid(ctx, layout, frame.colors, frame.upperBorder)

        this.cc.use(ctx).drawOverlays(frame.overlays || [])

        if (frame.drawCrosshairHere && frame.crosshair) {
            frame.crosshair.renderer.draw(ctx)
        }
    }

    /** Render only the dynamic canvas (crosshair). */
    renderDynamic(ctx, canvas, crosshair) {
        if (!crosshair) return
        ctx.clearRect(0, 0, canvas.width, canvas.height)
        crosshair.renderer.draw(ctx)
    }

    /** Grid lines (+ optional top scale border). */
    drawGrid(ctx, layout, colors, upperBorder) {
        ctx.strokeStyle = colors.grid
        ctx.beginPath()

        const ymax = layout.height
        for (let [x] of layout.xs) {
            ctx.moveTo(x - 0.5, 0)
            ctx.lineTo(x - 0.5, ymax)
        }
        for (let [y] of layout.ys) {
            ctx.moveTo(0, y - 0.5)
            ctx.lineTo(layout.width, y - 0.5)
        }
        ctx.stroke()

        if (upperBorder) {
            ctx.strokeStyle = colors.scale
            ctx.beginPath()
            ctx.moveTo(0, 0.5)
            ctx.lineTo(layout.width, 0.5)
            ctx.stroke()
        }
    }

    /** Run grid shaders, each in its own save/restore scope. */
    drawShaders(ctx, shaders, props) {
        for (let s of shaders) {
            ctx.save()
            s.draw(ctx, props)
            ctx.restore()
        }
    }
}
