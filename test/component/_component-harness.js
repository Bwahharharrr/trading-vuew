
// Component-test harness (Phase 3 gate for 3.1b-final & 3.3b).
//
// Mounts the real TradingVue / Grid components in jsdom with:
//   - a RECORDING 2D canvas context (no real pixels — we assert that draws
//     HAPPEN, i.e. the render path fires; the visual baseline owns pixels),
//   - a controllable requestAnimationFrame (flushRaf() runs pending frames),
//     so render-trigger behaviour is deterministic.
//
// This lets us pin "a data update triggers a redraw" — the contract 3.1b-final
// (deleting touchData/dataVersion) must preserve — and assert grid/overlay/
// crosshair orchestration for the 3.3b RenderEngine extraction.

import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'

// Every mock context created this test, so we can total draw activity.
let contexts = []
// Monotonic op counter (global across all canvases) for ordering ops in a frame.
let OP_SEQ = 0

function makeMockCtx(canvas) {
    // `ops` (additive, like the prior allContexts helper) records the ARGUMENTS
    // of geometry/text calls so a test can correlate a fillText at some Y with
    // whether a clearRect covered that Y *this frame*. Each entry also carries a
    // monotonic `seq` so ordering across canvases is recoverable.
    const log = { calls: 0, clearRect: 0, byMethod: {}, ops: [] }
    const rec = (name) => (...args) => {
        log.calls++
        log.byMethod[name] = (log.byMethod[name] || 0) + 1
        if (name === 'clearRect') log.clearRect++
        if (name === 'clearRect' || name === 'fillRect' || name === 'strokeRect') {
            log.ops.push({ op: name, seq: ++OP_SEQ, x: args[0], y: args[1], w: args[2], h: args[3] })
        } else if (name === 'fillText' || name === 'strokeText') {
            log.ops.push({ op: name, seq: ++OP_SEQ, text: args[0], x: args[1], y: args[2] })
        }
        return undefined
    }
    const ctx = {
        canvas,
        _log: log,
        // void drawing methods (recorded)
        save: rec('save'), restore: rec('restore'), beginPath: rec('beginPath'),
        closePath: rec('closePath'), moveTo: rec('moveTo'), lineTo: rec('lineTo'),
        stroke: rec('stroke'), fill: rec('fill'), fillRect: rec('fillRect'),
        strokeRect: rec('strokeRect'), clearRect: rec('clearRect'),
        fillText: rec('fillText'), strokeText: rec('strokeText'),
        arc: rec('arc'), arcTo: rec('arcTo'), rect: rec('rect'),
        roundRect: rec('roundRect'), ellipse: rec('ellipse'),
        bezierCurveTo: rec('bezierCurveTo'), quadraticCurveTo: rec('quadraticCurveTo'),
        setTransform: rec('setTransform'), resetTransform: rec('resetTransform'),
        transform: rec('transform'), scale: rec('scale'), translate: rec('translate'),
        rotate: rec('rotate'), setLineDash: rec('setLineDash'), getLineDash: () => [],
        clip: rec('clip'), drawImage: rec('drawImage'), putImageData: rec('putImageData'),
        // value-returning methods
        measureText: (t) => { rec('measureText')(); return { width: (t ? String(t).length : 0) * 6 } },
        getImageData: (x, y, w, h) => {
            rec('getImageData')()
            const ww = Math.max(1, w | 0), hh = Math.max(1, h | 0)
            return { data: new Uint8ClampedArray(ww * hh * 4), width: ww, height: hh }
        },
        createLinearGradient: () => { rec('createLinearGradient')(); return { addColorStop() {} } },
        createRadialGradient: () => { rec('createRadialGradient')(); return { addColorStop() {} } },
        createPattern: () => null,
    }
    contexts.push(ctx)
    return ctx
}

// Install the recording context + controllable RAF. Returns a teardown fn.
let rafQueue = []
let prevGetContext, prevRaf, prevCaf, installed = false

export function installCanvasEnv() {
    if (installed) return
    installed = true
    contexts = []
    rafQueue = []

    prevGetContext = HTMLCanvasElement.prototype.getContext
    // eslint-disable-next-line no-undef
    HTMLCanvasElement.prototype.getContext = function (type) {
        if (type !== '2d') return null
        if (!this._mockCtx) this._mockCtx = makeMockCtx(this)
        return this._mockCtx
    }

    prevRaf = globalThis.requestAnimationFrame
    prevCaf = globalThis.cancelAnimationFrame
    globalThis.requestAnimationFrame = (cb) => { rafQueue.push(cb); return rafQueue.length }
    globalThis.cancelAnimationFrame = (id) => { if (id) rafQueue[id - 1] = null }
}

export function uninstallCanvasEnv() {
    if (!installed) return
    installed = false
    // eslint-disable-next-line no-undef
    HTMLCanvasElement.prototype.getContext = prevGetContext
    globalThis.requestAnimationFrame = prevRaf
    globalThis.cancelAnimationFrame = prevCaf
    contexts = []
    rafQueue = []
}

// Run pending RAF callbacks (one generation). Returns how many ran.
export function flushRaf() {
    const q = rafQueue
    rafQueue = []
    let n = 0
    for (const cb of q) if (cb) { cb(performance.now()); n++ }
    return n
}

// Let mounted lifecycles settle: a few nextTick + RAF flushes.
export async function settle(times = 4) {
    for (let i = 0; i < times; i++) {
        await nextTick()
        flushRaf()
    }
}

// Total draw-call activity across every canvas (a redraw proxy).
export function totalDrawCalls() {
    return contexts.reduce((a, c) => a + c._log.calls, 0)
}
export function totalClearRects() {
    return contexts.reduce((a, c) => a + c._log.clearRect, 0)
}
export function methodTotal(name) {
    return contexts.reduce((a, c) => a + (c._log.byMethod[name] || 0), 0)
}
export function resetCounters() {
    OP_SEQ = 0
    for (const c of contexts) { c._log.calls = 0; c._log.clearRect = 0; c._log.byMethod = {}; c._log.ops = [] }
}

// Recorded geometry/text ops (clearRect/fillRect/strokeRect/fillText/strokeText
// with their args + a monotonic seq) for the first canvas whose id matches pred.
// Used by the bold-labels repro to detect text overdraw without a covering clear.
export function opsForCanvas(pred) {
    const c = contexts.find(c => c.canvas && pred(c.canvas.id))
    return c ? c._log.ops : []
}
export function contextCount() { return contexts.length }

// Per-canvas introspection: return every recorded context paired with its
// canvas DOM id, so a test can tell WHICH canvas (main grid static vs dynamic
// crosshair vs sidebar) actually drew on a given tick.
export function allContexts() {
    return contexts.map(c => ({
        id: (c.canvas && c.canvas.id) || '',
        log: c._log,
        ctx: c,
    }))
}

// Find the recording context whose canvas id matches a predicate.
export function ctxByIdMatch(pred) {
    return contexts.filter(c => c.canvas && pred(c.canvas.id))
}

export { mount }
