// Calculates positions and sizes for candlestick
// and volume bars for the given subset of data

import Utils from '../../stuff/utils.js'

export function layout_cnv(self) {

    let $p = self.$props
    let sub = $p.data
    let t2screen = $p.layout.t2screen
    let layout = $p.layout

    let candles = []
    let volume = []

    // The volume bar height is determined as a percentage of
    // the chart's height (VOLSCALE)
    let maxv = Utils.maxAtIndex(sub, 5)
    let vs = maxv > 0 ? $p.config.VOLSCALE * layout.height / maxv : 0
    let x1, x2, w, avg_w, mid, prev = undefined

    // Subset interval against main interval
    let [interval2, ratio] = new_interval(layout, $p, sub)
    let px_step2 = layout.px_step * ratio

    let splitter = px_step2 > 5 ? 1 : 0

    // A & B are current chart tranformations:
    // A === scale,  B === Y-axis shift
    for (let i = 0; i < sub.length; i++) {
        let p = sub[i]
        mid = t2screen(p[0]) + 1

        // Clear volume bar if there is a time gap
        if (sub[i-1] && p[0] - sub[i-1][0] > interval2) {
            prev = null
        }

        x1 = prev || Math.floor(mid - px_step2 * 0.5)
        x2 = Math.floor(mid + px_step2 * 0.5) - 0.5

        // TODO: add log scale support
        candles.push({
            x: mid,
            w: layout.px_step * $p.config.CANDLEW * ratio,
            o: Math.floor(p[1] * layout.A + layout.B),
            h: Math.floor(p[2] * layout.A + layout.B),
            l: Math.floor(p[3] * layout.A + layout.B),
            c: Math.floor(p[4] * layout.A + layout.B),
            raw: p
        })

        volume.push({
            x1: x1,
            x2: x2,
            h: p[5] * vs,
            green: p[4] >= p[1],
            raw: p
        })
        prev = x2 + splitter
    }

    return { candles, volume }

}

// Memoized wrapper around layout_cnv for the indicator-pane draw path.
//
// Candles.vue calls layout_cnv(self) inside draw() on EVERY frame when the
// overlay is an on/off-chart indicator (sub !== main data), rebuilding ~2*N
// candle/volume objects uncached. The main pane already caches this geometry
// (layout.js layoutCache). This mirrors that cache, but stored per-overlay-
// instance via the caller-owned `cache` object ({ key, val }).
//
// The fingerprint captures every input that affects the built geometry:
//   - price transform A/B            (-> o/h/l/c pixels)
//   - px_step                        (-> candle width + bar spacing)
//   - layout height                  (-> volume scale)
//   - horizontal screen anchors      (-> t2screen mapping, i.e. range/zoom/pan)
//     sampled at the first & last bar timestamps (two points pin the affine map
//     for both time- and index-based axes)
//   - sub.length, tf, interval, ti_map.tf  (-> interval ratio + bar count)
//   - the LAST bar's OHLCV + colour  (-> a live intra-candle tick mutates only
//     this bar in place; without it the key would hit and serve stale geometry,
//     the exact bug layout.js's last-bar term guards — see layout.js:184)
//   - the visible-set volume MAX  (-> the volume bar scale vs = VOLSCALE*h/maxv;
//     an INTERIOR bar's volume can move the max while length + last bar are
//     unchanged, which would otherwise serve a stale, mis-scaled volume pane)
//
// Colour is NOT part of the geometry and is re-read from raw[6/7/8] at draw
// time, so a palette recolour of earlier bars is reflected on a cache HIT.
export function layout_cnv_cached(self, cache) {
    const $p = self.$props
    const lay = $p.layout
    const sub = $p.data
    const n = sub.length
    const lb = n ? sub[n - 1] : null
    const fb = n ? sub[0] : null
    const lbKey = lb ?
        `${lb[1]},${lb[2]},${lb[3]},${lb[4]},${lb[5]},${lb[6]}` : ''
    const t2s = lay.t2screen
    const tFirst = (fb && t2s) ? t2s(fb[0]) : ''
    const tLast = (lb && t2s) ? t2s(lb[0]) : ''
    const tiTf = lay.ti_map ? lay.ti_map.tf : ''
    // Volume scale depends on the max volume across the WHOLE visible set, so an
    // interior-bar volume change must bust the cache. O(N) scan, but a cache hit
    // still skips the ~2N-object geometry rebuild — a clear net win.
    const maxv = Utils.maxAtIndex(sub, 5)

    // Scale VERSIONS (plan §1#2 — wire the sub-pane into the version-keyed cache).
    // A,B,px_step + the t2screen anchors already fingerprint the geometry; the
    // versions make the key reflect the scale-engine spine directly so a future
    // in-place Reposition (which bumps version without changing the A/B numbers it
    // re-derived to the same value) still busts this pane's cache. Constant ('0')
    // under the current per-frame-rebuild model, so additive and inert today.
    const tsv = lay.timeScale ? lay.timeScale.version : ''
    const psv = lay.priceScale ? lay.priceScale.version : ''

    const key = `${lay.A},${lay.B},${lay.px_step},${lay.height},` +
        `${n},${$p.tf},${$p.interval},${tiTf},${tFirst},${tLast},${lbKey},${maxv},` +
        `${tsv},${psv}`

    if (cache.key === key && cache.val) return cache.val

    const cnv = layout_cnv(self)
    cache.key = key
    cache.val = cnv
    return cnv
}

export function layout_vol(self) {

    let $p = self.$props
    let sub = $p.data
    let t2screen = $p.layout.t2screen
    let layout = $p.layout

    let volume = []

    // Detect data second dimention size:
    let dim = sub[0] ? sub[0].length : 0

    // Support special volume data (see API book), or OHLCV
    // Data indices:
    self._i1 = dim < 6 ? 1 : 5
    self._i2 = dim < 6 ? (p => p[2]) : (p => p[4] >= p[1])

    let maxv = Utils.maxAtIndex(sub, self._i1)
    let volscale = self.volscale || $p.config.VOLSCALE
    let vs = maxv > 0 ? volscale * layout.height / maxv : 0
    let x1, x2, mid, prev = undefined

    // Detached pane (own offchart grid): map bar top + 0-baseline through the
    // grid Y-transform so the Y-axis scale rescales the bars. The candle-pane
    // path (grid 0, drawn via Candles.vue) never reaches here, and the glued
    // `h` field is still emitted as the fallback for the visual-golden harness.
    let off = $p.grid_id > 0 && typeof layout.$2screen === 'function'
    let y0base = off ? layout.$2screen(0) : undefined

    // Subset interval against main interval
    let [interval2, ratio] = new_interval(layout, $p, sub)
    let px_step2 = layout.px_step * ratio

    let splitter = px_step2 > 5 ? 1 : 0

    // A & B are current chart tranformations:
    // A === scale,  B === Y-axis shift
    for (let i = 0; i < sub.length; i++) {
        let p = sub[i]
        mid = t2screen(p[0]) + 1

        // Clear volume bar if there is a time gap
        if (sub[i-1] && p[0] - sub[i-1][0] > interval2) {
            prev = null
        }
        x1 = prev || Math.floor(mid - px_step2 * 0.5)
        x2 = Math.floor(mid + px_step2 * 0.5) - 0.5

        volume.push({
            x1: x1,
            x2: x2,
            h: p[self._i1] * vs,
            green: self._i2(p),
            raw: p,
            y0: off ? y0base : undefined,
            yTop: off ? layout.$2screen(p[self._i1]) : undefined
        })
        prev = x2 + splitter
    }
    return volume

}

function new_interval(layout, $p, sub) {
    // Subset interval against main interval
    // Prefer using main chart interval to avoid detection issues with data gaps
    let interval2, ratio
    if (!layout.ti_map.ib) {
        // Use overlay's tf, or fall back to main chart interval, then detect
        interval2 = $p.tf || $p.interval || Utils.detect_interval(sub)
        ratio = interval2 / $p.interval
    } else {
        if ($p.tf) {
            ratio = $p.tf / layout.ti_map.tf
            interval2 = ratio
        } else {
            // Use main chart interval if available
            interval2 = $p.interval || Utils.detect_interval(sub)
            ratio = interval2 / $p.interval
        }
    }
    return [interval2, ratio]
}
