// TimeScale — first-class index/time ↔ x mapping (the "scale engine" spine, #3).
//
// Promotes the loose `spacex / px_step / startx` fields and the
// `t2screen / screen2t / t_magnet / c_magnet / c_magnet_i` closures (formerly
// reborn inside every `new layout_fn()` instance) into a STABLE object with a
// monotonic `version`. The math is byte-identical to the old closures — this is
// a pure extraction (Phase 1 of tasks/render-architecture-plan.md). One TimeScale
// is shared across a layout's grids (offcharts borrow the master x), so the
// t2screen memo and the magnet-timestamp cache are shared too — identical output
// (every grid has the same range/spacex), with one cache instead of N.
//
// version: bumped ONLY when barSpacing (px_step) | i0 (range[0]) | spacex change
//          — i.e. when the affine x-map x = floor((i - i0)*barSpacing) - 0.5
//          actually moves. A version bump LAZILY clears the t2screen memo, exactly
//          reproducing today's "new instance per layout ⇒ fresh caches" behaviour
//          (a stale coord cache would serve wrong pixels — see plan §1 Phase 1).

import Utils from '../../stuff/utils.js'

// Mirrors the old layout_fn cap (prevents unbounded memo growth).
const MAX_CACHE_SIZE = 2000

export function createTimeScale(params) {

    let ti_map = params.ti_map
    let ib = ti_map ? ti_map.ib : false
    let range = params.range
    let spacex = params.spacex
    let px_step = params.px_step          // == barSpacing
    let startx = params.startx
    // px / time(or index) ratio — the same `r` layout_fn derived once per build.
    let r = spacex / (range[1] - range[0])
    let version = 0

    // Memoization cache (version-keyed). t2screen is a pure function of
    // (t, range[0], r, ib, ti_map), all of which are pinned by `version`.
    const t2sCache = new Map()
    let cacheVer = -1

    // Candle-timestamp cache for the magnets, tied to candle-array identity —
    // rebuilt only when the underlying candles reference changes.
    let magnetCn = null
    let magnetTs = null

    function ensureFresh() {
        if (cacheVer !== version) {
            t2sCache.clear()
            cacheVer = version
        }
    }

    function magnet_ts(cn) {
        if (cn !== magnetCn) {
            magnetCn = cn
            magnetTs = cn.map(x => x.raw[0])
        }
        return magnetTs
    }

    const ts = {
        get version() { return version },
        get range() { return range },
        get spacex() { return spacex },
        get px_step() { return px_step },
        get startx() { return startx },
        get r() { return r },
        get ib() { return ib },
        get ti_map() { return ti_map },

        // Re-point the scale at new params, bumping `version` ONLY when the
        // x-map actually moves (barSpacing | i0 | spacex). Used by the later
        // Reposition fast path; a no-op write keeps the memo warm.
        set(p) {
            let changed = false
            if (p.range && (p.range[0] !== range[0] || p.range[1] !== range[1])) {
                range = p.range; changed = true
            }
            if (p.spacex !== undefined && p.spacex !== spacex) {
                spacex = p.spacex; changed = true
            }
            if (p.px_step !== undefined && p.px_step !== px_step) {
                px_step = p.px_step; changed = true
            }
            if (p.startx !== undefined) startx = p.startx   // does not affect t2screen → no version bump
            // Re-pointing the index-map moves the time↔x mapping → must bump
            // version so ensureFresh() clears the t2screen memo (else stale pixels).
            if (p.ti_map && p.ti_map !== ti_map) { ti_map = p.ti_map; ib = ti_map.ib; changed = true }
            if (changed) {
                r = spacex / (range[1] - range[0])
                version++
            }
            return changed
        },

        // Time → screen-x (memoized). Byte-identical to layout_fn.t2screen.
        t2screen(t) {
            ensureFresh()
            const cached = t2sCache.get(t)
            if (cached !== undefined) return cached
            let tVal = t
            if (ib) tVal = ti_map.smth2i(t)
            const result = Math.floor((tVal - range[0]) * r) - 0.5
            if (t2sCache.size < MAX_CACHE_SIZE) t2sCache.set(t, result)
            return result
        },

        // Screen-x → time. Byte-identical to layout_fn.screen2t.
        screen2t(x) {
            return range[0] + x / r
        },

        // Time-axis magnet → nearest candle's snapped x. `cn` is the grid's
        // candle array (master candles for offcharts), passed by the adapter.
        t_magnet(t, cn) {
            if (ib) t = ti_map.smth2i(t)
            const arr = magnet_ts(cn)
            const i = Utils.nearest_a(t, arr)[0]
            if (!cn[i]) return
            return Math.floor(cn[i].x) - 0.5
        },

        // Nearest candlestick object.
        c_magnet(t, cn) {
            const arr = magnet_ts(cn)
            const i = Utils.nearest_a(t, arr)[0]
            return cn[i]
        },

        // Index of the nearest candlestick (avoids O(n) indexOf at call site).
        c_magnet_i(t, cn) {
            const arr = magnet_ts(cn)
            return Utils.nearest_a(t, arr)[0]
        },

        clearCache() {
            t2sCache.clear()
            cacheVer = version
        }
    }

    return ts
}

export default createTimeScale
