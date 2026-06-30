// PriceScale — first-class price ↔ y mapping (the "scale engine" spine, #3).
//
// Promotes the loose `A / B / $_hi / $_lo` fields and the `$2screen / screen2$`
// closures (formerly reborn inside every `new layout_fn()` instance) into a
// STABLE object with a monotonic `version`. The math is byte-identical to the old
// closures — a pure extraction (Phase 1 of tasks/render-architecture-plan.md).
// One PriceScale exists PER grid (main + each offchart), since each grid has its
// own A/B; so the $2screen / screen2$ memos are per-grid, exactly as before.
//
// version: bumped ONLY when A | B change — i.e. when the affine y-map
//          y = floor(price*A + B) - 0.5 actually moves (a manual y-lock pins
//          A/B ⇒ version stable across a pan). A version bump LAZILY clears the
//          $2screen / screen2$ memos, exactly reproducing today's "new instance
//          per layout ⇒ fresh caches" behaviour (plan §1 Phase 1).

import math from '../../stuff/math.js'

// Mirrors the old layout_fn cap (prevents unbounded memo growth).
const MAX_CACHE_SIZE = 2000

export function createPriceScale(params) {

    let A = params.A
    let B = params.B
    let hi = params.hi
    let lo = params.lo
    let height = params.height
    let logScale = params.logScale || false
    let version = 0

    // Memoization caches (version-keyed). Both maps are pure functions of
    // (y, A, B, logScale), all pinned by `version`.
    const $2sCache = new Map()
    const s2$Cache = new Map()
    let cacheVer = -1

    function ensureFresh() {
        if (cacheVer !== version) {
            $2sCache.clear()
            s2$Cache.clear()
            cacheVer = version
        }
    }

    const ps = {
        get version() { return version },
        get A() { return A },
        get B() { return B },
        get hi() { return hi },
        get lo() { return lo },
        get height() { return height },
        get logScale() { return logScale },

        // Re-point the scale at new params, bumping `version` ONLY when the
        // y-map actually moves (A | B). Used by the later Reposition fast path;
        // a price-range that stays in-band leaves A/B (and version) untouched.
        set(p) {
            let changed = false
            if (p.A !== undefined && p.A !== A) { A = p.A; changed = true }
            if (p.B !== undefined && p.B !== B) { B = p.B; changed = true }
            if (p.hi !== undefined) hi = p.hi
            if (p.lo !== undefined) lo = p.lo
            if (p.height !== undefined) height = p.height
            // log↔linear flips the y-map → must bump version so the $2screen/
            // screen2$ memos clear (else stale pixels on a scale-mode switch).
            if (p.logScale !== undefined && p.logScale !== logScale) { logScale = p.logScale; changed = true }
            if (changed) version++
            return changed
        },

        // Recompute A/B from a visible candle slice — the price↔y half of the
        // Reposition decision (plan §1#2: "recompute(visible): minmax → hi/lo →
        // A,B"). Mirrors GridMaker.calc_$range (main grid, linear, auto) +
        // calc_positions BYTE-FOR-BYTE: hi = max(high col 2), lo = min(low col 3),
        // padded by EXPAND, then A = -height/($_hi-$_lo), B = -$_hi*A. Does NOT
        // mutate this scale — returns a candidate {A,B,hi,lo,changed} so the caller
        // can gate the fast path on `!changed` (A/B identical ⇒ kept-bar y is
        // reusable). Returns null for the cases this linear-auto path does NOT
        // reproduce (log scale, manual y-lock, overlay y_range, offcharts) so the
        // caller escalates to a Full rebuild. `changed` is EXACT equality — the
        // authoritative reuse guard lives in candles_n_vol; this is the heuristic.
        recompute(visible, expand) {
            if (logScale || !visible || visible.length < 2) return null
            let h = -Infinity, l = Infinity
            for (let i = 0, n = visible.length; i < n; i++) {
                const x = visible[i]
                if (x[2] > h) h = x[2]
                if (x[3] < l) l = x[3]
            }
            if (!isFinite(h) || !isFinite(l)) return null
            const exp = expand || 0
            let nhi = h + (h - l) * exp
            let nlo = l - (h - l) * exp
            if (nhi === nlo) {                       // collapsed band (hi === lo)
                if (nhi === 0) { nhi = 1; nlo = -1 } // all-zero → [1, -1]
                const pad = Math.abs(nhi) * 0.05 || 1
                nhi += pad; nlo -= pad
            }
            const nA = -height / (nhi - nlo)
            const nB = -nhi * nA
            return { A: nA, B: nB, hi: nhi, lo: nlo, changed: nA !== A || nB !== B }
        },

        // Price → screen-y (memoized). Byte-identical to layout_fn.$2screen.
        $2screen(y) {
            ensureFresh()
            const cached = $2sCache.get(y)
            if (cached !== undefined) return cached
            let yVal = y
            if (logScale) yVal = math.log(y)
            const result = Math.floor(yVal * A + B) - 0.5
            if ($2sCache.size < MAX_CACHE_SIZE) $2sCache.set(y, result)
            return result
        },

        // Screen-y → price (memoized). Byte-identical to layout_fn.screen2$.
        screen2$(y) {
            ensureFresh()
            const cached = s2$Cache.get(y)
            if (cached !== undefined) return cached
            let result
            if (logScale) {
                result = math.exp((y - B) / A)
            } else {
                result = (y - B) / A
            }
            if (s2$Cache.size < MAX_CACHE_SIZE) s2$Cache.set(y, result)
            return result
        },

        clearCache() {
            $2sCache.clear()
            s2$Cache.clear()
            cacheVer = version
        }
    }

    return ps
}

export default createPriceScale
