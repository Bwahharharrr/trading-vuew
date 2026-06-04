
// defineOverlay (Phase 4.1) — config-based overlay authoring.
//
// Lets you write an overlay as a plain config object instead of a Vue Options
// component + the Overlay mixin + 14 positional props:
//
//   const MyEMA = defineOverlay({
//     name: 'MyEMA',
//     useFor: ['EMA'],
//     meta: { author: 'you', version: '1.0.0' },
//     draw(ctx, $) {                 // $ = a curated RenderContext
//       $.setupStroke(ctx, 1, $.colors.colorCandleUp)
//       ctx.beginPath()
//       $.drawDataLine(ctx, $.data, 1)
//       ctx.stroke()
//     },
//   })
//   <trading-vue :overlays="[MyEMA]" :data="dc" />
//
// It returns a registry-compatible component (Overlay + CanvasDrawing mixins),
// so it slots into the existing overlays prop and the Phase 2 registration
// validator. Additive and non-breaking — the legacy mixin authoring still works.
// The config is validated at DEFINITION time for the earliest, clearest error.

import Overlay from '../mixins/overlay.js'
import CanvasDrawing from '../mixins/canvas-drawing.js'

function assert(cond, msg) {
    if (!cond) {
        const e = new Error(`[trading-vue] defineOverlay: ${msg}`)
        e.code = 'overlay.define'
        throw e
    }
}

/**
 * @param {object} def
 * @param {string[]} def.useFor  - chart-data `type`s this overlay renders (required, non-empty)
 * @param {(ctx:CanvasRenderingContext2D, $:object)=>void} def.draw - required
 * @param {string} [def.name]
 * @param {object} [def.meta]    - { author, version, ... }
 * @param {object} [def.settings]- default settings merged under the overlay
 * @param {(()=>string[])} [def.dataColors]
 * @param {(()=>[number,number])} [def.yRange]
 * @param {Function} [def.calc]  - engine script object factory (computed overlays)
 * @param {object} [def.tool]    - drawing-tool descriptor (see defineTool)
 * @param {Function} [def.init] @param {Function} [def.destroy]
 * @param {object} [def.computed]@param {object} [def.methods]
 * @param {Array} [def.mixins]   - extra mixins (e.g. Tool)
 * @returns a Vue overlay component
 */
export function defineOverlay(def) {
    assert(def && typeof def === 'object', 'expects a config object')
    assert(Array.isArray(def.useFor) && def.useFor.length > 0 &&
        def.useFor.every(t => typeof t === 'string' && t.length > 0),
        '`useFor` must be a non-empty string[]')
    assert(typeof def.draw === 'function', '`draw(ctx, $)` is required')

    // Every CanvasDrawing helper, surfaced on the curated context so authors
    // can build real overlays without falling back to `this.X`.
    const HELPERS = [
        'drawDataLine', 'drawStepLine', 'drawBandFill', 'drawMultiLines',
        'setupStroke', 'setupFillAndStroke', 'iterateData', 'pointToScreen',
    ]

    // Curated RenderContext handed to draw/dataColors/yRange as the 2nd arg, so
    // authors don't reach into `this.$props.*`. `this` is still the component
    // (full power: computed, helper mixins) for advanced cases.
    function context() {
        const p = this.$props
        const ctx = {
            layout: p.layout,
            data: p.data,
            sub: p.sub,
            // def.settings provides DEFAULTS, overridden by live prop settings.
            settings: Object.assign({}, def.settings, this.sett),
            colors: p.colors,
            cursor: p.cursor,
            num: p.num,
            interval: p.interval,
            tf: p.tf,
            font: p.font,
            id: p.id,
            grid_id: p.grid_id,
        }
        for (const h of HELPERS) {
            if (typeof this[h] === 'function') ctx[h] = this[h].bind(this)
        }
        return ctx
    }

    // def.methods spread FIRST so the factory-wired use_for/draw/meta_info/$ctx
    // always win (a stray methods.draw can't strip the RenderContext injection).
    const methods = {
        ...(def.methods || {}),
        use_for() { return def.useFor.slice() },
        meta_info() { return def.meta || {} },
        $ctx: context,
        draw(ctx) { return def.draw.call(this, ctx, this.$ctx()) },
    }
    if (def.dataColors) methods.data_colors = function () { return def.dataColors.call(this, this.$ctx()) }
    if (def.yRange) methods.y_range = function () { return def.yRange.call(this, this.$ctx()) }
    if (def.calc) methods.calc = def.calc
    if (def.tool) methods.tool = function () { return def.tool }
    if (def.init) methods.init = def.init
    if (def.destroy) methods.destroy = def.destroy

    return {
        name: def.name || 'CustomOverlay',
        mixins: [Overlay, CanvasDrawing, ...(def.mixins || [])],
        methods,
        computed: { ...(def.computed || {}) },
    }
}

export default defineOverlay
