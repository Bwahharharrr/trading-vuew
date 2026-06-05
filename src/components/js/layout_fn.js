// Layout functional interface
// Performance optimized with memoization for coordinate transforms

import Utils from '../../stuff/utils.js'
import math from '../../stuff/math.js'

export default function(self, range) {

    const ib = self.ti_map.ib
    const dt = range[1] - range[0]
    const r = self.spacex / dt
    const ls = self.grid.logScale || false

    // Memoization caches - cleared automatically on layout recalculation
    // since a new layout_fn instance is created each time
    const t2screenCache = new Map()
    const $2screenCache = new Map()
    const screen2$Cache = new Map()

    // Cache size limit to prevent unbounded memory growth
    const MAX_CACHE_SIZE = 2000

    // Cached timestamp array for magnet lookups, tied to candle array identity.
    // Rebuilt only when the underlying candles array reference changes, so
    // t_magnet/c_magnet don't re-scan the whole array on every call.
    let magnetCn = null
    let magnetTs = null
    const magnet_ts = cn => {
        if (cn !== magnetCn) {
            magnetCn = cn
            magnetTs = cn.map(x => x.raw[0])
        }
        return magnetTs
    }

    Object.assign(self, {
        // Time to screen coordinates (memoized)
        t2screen: t => {
            // Check cache first
            let cached = t2screenCache.get(t)
            if (cached !== undefined) return cached

            let tVal = t
            if (ib) tVal = self.ti_map.smth2i(t)
            const result = Math.floor((tVal - range[0]) * r) - 0.5

            // Store in cache with size limit
            if (t2screenCache.size < MAX_CACHE_SIZE) {
                t2screenCache.set(t, result)
            }
            return result
        },
        // $ to screen coordinates (memoized)
        $2screen: y => {
            // Check cache first
            let cached = $2screenCache.get(y)
            if (cached !== undefined) return cached

            let yVal = y
            if (ls) yVal = math.log(y)
            const result = Math.floor(yVal * self.A + self.B) - 0.5

            // Store in cache with size limit
            if ($2screenCache.size < MAX_CACHE_SIZE) {
                $2screenCache.set(y, result)
            }
            return result
        },
        // Time-axis nearest step
        t_magnet: t => {
            if (ib) t = self.ti_map.smth2i(t)
            const cn = self.candles || self.master_grid.candles
            const arr = magnet_ts(cn)
            const i = Utils.nearest_a(t, arr)[0]
            if (!cn[i]) return
            return Math.floor(cn[i].x) - 0.5
        },
        // Screen-Y to dollar value (memoized)
        screen2$: y => {
            // Check cache first
            let cached = screen2$Cache.get(y)
            if (cached !== undefined) return cached

            let result
            if (ls) {
                result = math.exp((y - self.B) / self.A)
            } else {
                result = (y - self.B) / self.A
            }

            // Store in cache with size limit
            if (screen2$Cache.size < MAX_CACHE_SIZE) {
                screen2$Cache.set(y, result)
            }
            return result
        },
        // Screen-X to timestamp
        screen2t: x => {
            // TODO: most likely Math.floor not needed
            // return Math.floor(range[0] + x / r)
            return range[0] + x / r
        },
        // $-axis nearest step
        $_magnet: price => { },
        // Nearest candlestick
        c_magnet: t => {
            const cn = self.candles || self.master_grid.candles
            const arr = magnet_ts(cn)
            const i = Utils.nearest_a(t, arr)[0]
            return cn[i]
        },
        // Index of the nearest candlestick (avoids O(n) indexOf at call site)
        c_magnet_i: t => {
            const cn = self.candles || self.master_grid.candles
            const arr = magnet_ts(cn)
            return Utils.nearest_a(t, arr)[0]
        },
        // Nearest data points
        data_magnet: t => {  /* TODO: implement */ },
        // Clear memoization caches (call when range changes significantly)
        clearCoordCaches: () => {
            t2screenCache.clear()
            $2screenCache.clear()
            screen2$Cache.clear()
        }
    })

    return self

}
