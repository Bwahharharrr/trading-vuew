// RenderScheduler — the single rAF spine (DEEP change #1, plan §1#1 / §3 Phase 2).
//
// Replaces the four independent invalidation timers (two grid.js rafThrottles,
// the unthrottled pinch, the per-watcher nextTick/rAF paints) with ONE mask + ONE
// rafId per chart. Every render source calls `invalidate(level)`; the drain runs
// exactly once per frame, coalescing the burst into a single rebuild+paint.
//
// PHASE 2 is orchestration ONLY: the drain still runs the EXISTING
// subset+update_layout+paint (no Reposition fast path yet). Levels are merged by
// max — a pending Full is never downgraded by a later Cursor — so a
// pan→pan→tick burst in one frame drains as Full, and a Cursor never swallows a
// pending static repaint (plan §3 Phase 2 risk note).
//
// Rollback: gate creation behind RENDER_SCHEDULER (below). Falsy ⇒ callers fall
// back to their CURRENT per-source rafThrottle/nextTick paths (kept intact).

// Build/config const. Flip to false to fall back to the legacy per-source
// rafThrottle/nextTick scheduling (Chart skips creating the scheduler, and every
// routed call site takes its legacy branch). Default on.
export const RENDER_SCHEDULER = true

// ROLLBACK SWITCH for the Phase-3 Reposition fast path (plan §3 Phase 3 rollback).
// When false, the drain ALWAYS escalates Reposition → Full: candles_n_vol skips
// its geometry-reuse branch and rebuilds every candle from scratch, reverting to
// verified Phase-2 behaviour with ZERO visual risk while keeping the scaffolding
// (scales, version seam, repositionPass decision) in place. Default on.
export const REPOSITION_FAST = true

// Invalidation levels — ordered, merged by max.
//   Cursor     : dynamic (crosshair) layer only — no scale/layout touch.
//   Reposition : range moved (pan/zoom/fade) — static rebuild+paint.
//   Full       : data/colour/theme/shader/transform/resize — static rebuild+paint.
// In Phase 2 Reposition and Full drain identically (both → full rebuild+paint);
// the distinction is seeded now for the Phase-3 Reposition fast path.
export const LEVEL = Object.freeze({
    NONE: -1,
    CURSOR: 0,
    REPOSITION: 1,
    FULL: 2,
})

// Resolve the global rAF/cAF lazily (at call time) so test harnesses that swap
// globalThis.requestAnimationFrame after module load are honoured — exactly how
// FrameAnimation / Utils.rafThrottle behave.
function defaultRaf(cb) {
    return (typeof requestAnimationFrame !== 'undefined')
        ? requestAnimationFrame(cb)
        : setTimeout(() => cb(typeof performance !== 'undefined' ? performance.now() : Date.now()), 16)
}
function defaultCaf(id) {
    if (id == null) return
    if (typeof cancelAnimationFrame !== 'undefined') cancelAnimationFrame(id)
    else clearTimeout(id)
}

export class RenderScheduler {

    // onDrain(level): invoked once per frame with the merged (max) pending level.
    // opts.raf / opts.caf override the frame primitives (tests).
    constructor(onDrain, opts = {}) {
        this._onDrain = onDrain
        this._mask = LEVEL.NONE
        this._rafId = null
        this._raf = opts.raf || defaultRaf
        this._caf = opts.caf || defaultCaf
        this._drainBound = () => this._drain()
    }

    // Merge a new invalidation into the mask and ensure a frame is scheduled.
    // merge = max: a higher level wins, a lower one never demotes a pending one.
    invalidate(level = LEVEL.FULL) {
        if (level > this._mask) this._mask = level
        if (this._rafId == null) this._rafId = this._raf(this._drainBound)
    }

    _drain() {
        this._rafId = null
        const lvl = this._mask
        this._mask = LEVEL.NONE
        if (lvl === LEVEL.NONE) return
        const fn = this._onDrain
        if (fn) fn(lvl)
    }

    // Run any pending drain synchronously (teardown / deterministic tests).
    flush() {
        if (this._rafId != null) { this._caf(this._rafId); this._rafId = null }
        const lvl = this._mask
        this._mask = LEVEL.NONE
        if (lvl === LEVEL.NONE) return
        const fn = this._onDrain
        if (fn) fn(lvl)
    }

    // Currently-pending level (LEVEL.NONE when idle). For tests/introspection.
    get pending() { return this._mask }
    get scheduled() { return this._rafId != null }

    destroy() {
        if (this._rafId != null) { this._caf(this._rafId); this._rafId = null }
        this._mask = LEVEL.NONE
        this._onDrain = null
    }
}

export default RenderScheduler
