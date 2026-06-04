
// CanvasContext (Phase 3.3) — framework-agnostic wrapper around a 2D context
// that draws overlay layers behind a per-overlay error boundary.
//
// Replaces the band-aid try/catch in grid-renderer.js (which logged every
// frame and could leave a dangling path after a throw). Guarantees:
//   - state isolation: save()/restore() around each overlay,
//   - corruption recovery: on a throw, the current path is reset so the bad
//     overlay cannot bleed into the next one,
//   - quiet failures: each overlay's error is reported ONCE (typed diagnostic),
//     not spammed at 60fps; it clears when the overlay recovers,
//   - optional draw-call metrics (RenderMetrics) for the Phase 5 budget.
//
// The happy path is byte-identical to the old loop (save → pre/draw/post →
// restore); the extra beginPath() only runs in the error branch.

import { error } from '../helpers/schema/diagnostics.js'

export class CanvasContext {

    /**
     * @param {CanvasRenderingContext2D} ctx
     * @param {object} [opts]
     * @param {(d:object, e:Error)=>void} [opts.onError] - diagnostic sink
     * @param {{drawCall:(n?:number)=>void}} [opts.metrics] - RenderMetrics shim
     */
    constructor(ctx, opts = {}) {
        this.ctx = ctx
        this.onError = opts.onError || null
        this.metrics = opts.metrics || null
        this._errs = new Map() // layer id -> last reported error message (dedup)
    }

    /** Point the wrapper at the current canvas context (it can change on resize). */
    use(ctx) { this.ctx = ctx; return this }

    /**
     * Draw one overlay layer inside an isolated boundary.
     * @returns {boolean} true if it drew without throwing
     */
    drawOverlay(layer) {
        // Match the original loop's skip semantics exactly (`!l.display`).
        if (!layer || !layer.display) return false
        const ctx = this.ctx
        let ok = true
        ctx.save()
        try {
            const r = layer.renderer
            if (r.pre_draw) r.pre_draw(ctx)
            r.draw(ctx)
            if (r.post_draw) r.post_draw(ctx)
            if (this._errs.has(layer.id)) this._errs.delete(layer.id) // recovered
        } catch (e) {
            ok = false
            this._report(layer, e)
        } finally {
            ctx.restore()
            // Recovery only: clear any dangling path the failed overlay left so
            // it cannot corrupt subsequent draws. Not run on the happy path.
            if (!ok) ctx.beginPath()
            if (this.metrics) this.metrics.drawCall()
        }
        return ok
    }

    /** Draw a list of (already z-sorted) layers. Returns count drawn ok. */
    drawOverlays(layers) {
        let ok = 0
        for (let i = 0; i < layers.length; i++) {
            if (this.drawOverlay(layers[i])) ok++
        }
        return ok
    }

    _report(layer, e) {
        const id = layer.id
        const msg = (e && e.message) || String(e)
        if (this._errs.get(id) === msg) return // already reported this exact error
        this._errs.set(id, msg)
        const diag = error(
            'overlay.draw.throw',
            `overlay "${layer.name || id}" draw() threw: ${msg}`,
            String(id)
        )
        if (this.onError) this.onError(diag, e)
        else if (typeof console !== 'undefined') {
            console.error(`[trading-vue] ${diag.message}`, e)
        }
    }
}
