// Layout functional interface — now a THIN ADAPTER over the scale-engine spine.
//
// The coordinate transforms (t2screen/$2screen/screen2$/...) and their memo
// caches used to be born inside this closure on every `new Layout()`. They now
// live on first-class TimeScale + PriceScale objects (src/render/scales/*) that
// carry a `version`; this adapter just BINDS the same closure surface onto `self`
// so every overlay / tool / shader is untouched. The math is byte-identical.
//
// GridMaker injects the scales it owns (a per-grid PriceScale; the master grid's
// shared TimeScale, borrowed by offcharts). Direct callers (unit harnesses) may
// invoke `layout_fn(self, range)` with only the loose `self.*` fields — in that
// case we derive equivalent scales from `self` so the surface is identical either
// way. The version-keyed memo clears live INSIDE the scale objects.

import { createTimeScale } from '../../render/scales/time-scale.js'
import { createPriceScale } from '../../render/scales/price-scale.js'

export default function(self, range, timeScale, priceScale) {

    // Use the injected scales (GridMaker path); otherwise derive them from the
    // loose self.* fields (direct-call / test path). Same closure surface.
    const ts = timeScale || createTimeScale({
        ti_map: self.ti_map,
        range,
        spacex: self.spacex,
        px_step: self.px_step,
        startx: self.startx,
    })
    const ps = priceScale || createPriceScale({
        A: self.A,
        B: self.B,
        hi: self.$_hi,
        lo: self.$_lo,
        height: self.height,
        logScale: (self.grid && self.grid.logScale) || false,
    })

    // Expose the scales for the version-based dirty seam (later phases) and for
    // offcharts to borrow the master x. Additive, plain fields on a markRaw'd
    // layout — no reactivity, no deep watcher.
    self.timeScale = ts
    self.priceScale = ps

    // The candle array a magnet snaps to: the grid's own candles, or the master
    // grid's for offcharts (resolved lazily at call time, after candles_n_vol).
    const magnetCn = () => self.candles || self.master_grid.candles

    Object.assign(self, {
        // Time to screen coordinates (memoized by TimeScale)
        t2screen: t => ts.t2screen(t),
        // $ to screen coordinates (memoized by PriceScale)
        $2screen: y => ps.$2screen(y),
        // Time-axis nearest step
        t_magnet: t => ts.t_magnet(t, magnetCn()),
        // Screen-Y to dollar value (memoized by PriceScale)
        screen2$: y => ps.screen2$(y),
        // Screen-X to timestamp
        screen2t: x => ts.screen2t(x),
        // $-axis nearest step
        $_magnet: price => { },
        // Nearest candlestick
        c_magnet: t => ts.c_magnet(t, magnetCn()),
        // Index of the nearest candlestick (avoids O(n) indexOf at call site)
        c_magnet_i: t => ts.c_magnet_i(t, magnetCn()),
        // Nearest data points
        data_magnet: t => {  /* TODO: implement */ },
        // Clear memoization caches (call when range changes significantly)
        clearCoordCaches: () => {
            ts.clearCache()
            ps.clearCache()
        }
    })

    return self

}
