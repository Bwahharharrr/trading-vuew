
// Minimal render-metrics collector (Phase 1 shim).
//
// Gives the Phase 3 store/renderer refactor a concrete, machine-checkable
// budget to assert against (p99 frame time, draw-calls-per-tick) instead of a
// vague "no thrash" gate. Phase 5 expands this into per-layer instrumentation +
// an on-screen HUD; the public shape (`snapshot()`) is intended to stay stable.
//
// SSR/worker-safe: no DOM access, uses `performance.now()` when available.

const now = () =>
    (typeof performance !== 'undefined' && performance.now)
        ? performance.now()
        : Date.now()

const DEFAULT_CAP = 600 // ~10s of frames at 60fps

export default class RenderMetrics {

    constructor(cap = DEFAULT_CAP) {
        this.cap = cap
        this.reset()
    }

    reset() {
        this._durations = []   // frame durations (ms), ring-buffered
        this._stamps = []      // frame end timestamps (ms), ring-buffered
        this._drawCalls = 0    // draw calls in the current frame
        this._frameDrawCalls = [] // draw calls per completed frame
        this._open = null      // start time of the in-flight frame
    }

    // Time a single frame. Either wrap a function:
    //   metrics.frame(() => render())
    // or bracket manually with begin()/end().
    frame(fn) {
        this.begin()
        try {
            return fn && fn()
        } finally {
            this.end()
        }
    }

    begin() {
        this._open = now()
        this._drawCalls = 0
    }

    end() {
        if (this._open == null) return
        const dur = now() - this._open
        push(this._durations, dur, this.cap)
        push(this._stamps, now(), this.cap)
        push(this._frameDrawCalls, this._drawCalls, this.cap)
        this._open = null
    }

    // Count one draw operation in the current frame (e.g. a layer redraw).
    drawCall(n = 1) {
        this._drawCalls += n
    }

    // Aggregate view of recent frames.
    snapshot() {
        const d = this._durations
        const frames = d.length
        if (!frames) {
            return {
                frames: 0, fps: 0,
                p50: 0, p95: 0, p99: 0, max: 0,
                avgDrawCalls: 0,
            }
        }
        const sorted = d.slice().sort((a, b) => a - b)
        const span = this._stamps.length > 1
            ? this._stamps[this._stamps.length - 1] - this._stamps[0]
            : 0
        const fps = span > 0 ? ((frames - 1) / span) * 1000 : 0
        const totalDraws = this._frameDrawCalls.reduce((a, b) => a + b, 0)
        return {
            frames,
            fps: round(fps),
            p50: round(percentile(sorted, 0.50)),
            p95: round(percentile(sorted, 0.95)),
            p99: round(percentile(sorted, 0.99)),
            max: round(sorted[sorted.length - 1]),
            avgDrawCalls: round(totalDraws / frames),
        }
    }
}

function push(arr, v, cap) {
    arr.push(v)
    if (arr.length > cap) arr.shift()
}

function percentile(sorted, q) {
    if (!sorted.length) return 0
    const i = Math.min(sorted.length - 1, Math.floor(q * (sorted.length - 1)))
    return sorted[i]
}

function round(v) {
    return Math.round(v * 1000) / 1000
}
