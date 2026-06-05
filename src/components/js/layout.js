// Calculates all necessary s*it to build the chart
// Heights, widths, transforms, ... = everything
// Why such a mess you ask? Well, that's because
// one components size can depend on other component
// data formatting (e.g. grid width depends on sidebar precision)
// So it's better to calc all in one place.
//
// Performance optimized: candles/volume calculations are cached

import GridMaker from './grid_maker.js'
import Utils from '../../stuff/utils.js'
import math from '../../stuff/math.js'
import log_scale from './log_scale.js'

// Layout cache for candles and volume computations
// Key format: `${range[0]},${range[1]},${sub.length},${interval}`
const layoutCache = {
    key: '',
    candles: null,
    volume: null
}

// PERFORMANCE: Check if object has any own property without creating an array
// Object.keys(obj).length > 0 creates an array just to check length
// This is O(1) in the best case vs O(n) for Object.keys
function hasAnyProperty(obj) {
    for (const key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) return true
    }
    return false
}

function Layout(params) {

    let {
        chart, sub, offsub, interval, range, ctx, layers_meta,
        ti_map, $props:$p, y_transforms: y_ts,
        customGridHeights, minimizedGrids
    } = params

    // CRITICAL FIX: Vue 3 reactive arrays may not destructure correctly
    // Convert to plain array values to ensure we have the actual range
    // Ensure range has actual values - if it's a Vue reactive array, spread it
    const rangeValues = Array.isArray(range) ? [...range] : [range?.[0], range?.[1]]
    if (rangeValues[0] !== undefined && rangeValues[1] !== undefined) {
        range = rangeValues
    }

    let mgrid = chart.grid || {}

    offsub = offsub.filter((x, i) => {
        // Skip offchart overlays with custom grid id,
        // because they will be mergred with the existing grids
        return !(x.grid && x.grid.id)
    })

    // Minimum height for minimized grids (title bar only)
    const MINIMIZED_HEIGHT = 28

    // Splits space between main chart
    // and offchart indicator grids
    function grid_hs() {

        const height = $p.height - $p.config.BOTBAR

        // PERFORMANCE: Check for any property without Object.keys() allocation
        // Object.keys() creates an array just to check length - this is O(1) instead of O(n)
        const hasCustomHeights = customGridHeights && hasAnyProperty(customGridHeights)
        const hasMinimizedGrids = minimizedGrids && hasAnyProperty(minimizedGrids)
        if (hasCustomHeights || hasMinimizedGrids) {
            return custom_hs(height)
        }

        // When at least one height defined (default = 1),
        // Pxs calculated as: (sum of weights) / number
        if (mgrid.height || offsub.find(x => x.grid.height)) {
            return weighted_hs(mgrid, height)
        }

        const n = offsub.length
        const off_h = (2 * Math.sqrt(n) / 7) / (n || 1)

        // Offchart grid height
        const px = Math.floor(height * off_h)

        // Main grid height
        const m = height - px * n
        return [m].concat(Array(n).fill(px))

    }

    // Use custom pixel heights directly
    function custom_hs(height) {
        const n = offsub.length + 1 // main + offcharts
        let hs = []

        // Check for minimized grids
        let minimized = minimizedGrids || {}

        // Calculate heights for each grid
        for (let i = 0; i < n; i++) {
            if (minimized[i]) {
                hs.push(MINIMIZED_HEIGHT)
            } else if (customGridHeights && customGridHeights[i] !== undefined) {
                hs.push(customGridHeights[i])
            } else {
                hs.push(null) // Will be calculated
            }
        }

        // PERFORMANCE: Single-pass calculation instead of 3 separate filter/reduce calls
        // Combines: filter+reduce for usedHeight, filter for nullCount, and final reduce
        let usedHeight = 0
        let nullCount = 0
        for (let i = 0; i < hs.length; i++) {
            if (hs[i] !== null) {
                usedHeight += hs[i]
            } else {
                nullCount++
            }
        }

        if (nullCount > 0) {
            let remainingHeight = height - usedHeight
            let defaultHeight = Math.floor(remainingHeight / nullCount)
            for (let i = 0; i < hs.length; i++) {
                if (hs[i] === null) hs[i] = defaultHeight
            }
        }

        // Recalculate actual total after null slots were filled
        let total = 0
        for (let i = 0; i < hs.length; i++) total += hs[i]
        if (total !== height && hs.length > 0) {
            hs[0] += (height - total)
        }

        return hs
    }

    function weighted_hs(grid, height) {
        // PERFORMANCE: Single-pass sum instead of reduce, avoid intermediate map
        const sources = [{grid}, ...offsub]
        const hs = new Array(sources.length)
        let sum = 0
        for (let i = 0; i < sources.length; i++) {
            hs[i] = sources[i].grid.height || 1
            sum += hs[i]
        }

        // Calculate weighted heights in single pass
        let newSum = 0
        for (let i = 0; i < hs.length; i++) {
            hs[i] = Math.floor((hs[i] / sum) * height)
            newSum += hs[i]
        }

        // Refine the height if Math.floor decreased px sum
        for (let i = 0; i < height - newSum; i++) hs[i % hs.length]++
        return hs
    }

    function candles_n_vol() {
        self.candles = []
        self.volume = []

        // Guard: need data and valid transform parameters (A, B, px_step are only set when sub.length >= 2)
        if (!sub.length || self.A === undefined || self.B === undefined || self.px_step === undefined) {
            return
        }

        // Performance: Generate cache key based on inputs that affect output
        // Note: px_step is derived from range and width, so A and B already capture transform state
        const cacheKey = `${range[0]},${range[1]},${sub.length},${interval},${$p.height},${self.A.toFixed(6)},${self.B.toFixed(0)}`

        // Check if we can reuse cached candles/volume
        if (layoutCache.key === cacheKey && layoutCache.candles && layoutCache.volume) {
            self.candles = layoutCache.candles
            self.volume = layoutCache.volume
            return
        }

        let maxv = Utils.maxAtIndex(sub, 5)
        let vs = maxv > 0 ? $p.config.VOLSCALE * $p.height / maxv : 0
        let x1, x2, mid, prev = undefined

        let splitter = self.px_step > 5 ? 1 : 0
        let hf_px_step = self.px_step * 0.5

        // Pre-calculate common values
        const candleW = self.px_step * $p.config.CANDLEW
        const A = self.A
        const B = self.B

        for (let i = 0; i < sub.length; i++) {
            let p = sub[i]
            mid = self.t2screen(p[0]) + 0.5
            self.candles.push(mgrid.logScale ?
                log_scale.candle(self, mid, p, $p): {
                x: mid,
                w: candleW,
                o: Math.floor(p[1] * A + B),
                h: Math.floor(p[2] * A + B),
                l: Math.floor(p[3] * A + B),
                c: Math.floor(p[4] * A + B),
                z: p[6],
                raw: p
            })
            // Clear volume bar if there is a time gap
            if (sub[i-1] && p[0] - sub[i-1][0] > interval) {
                prev = null
            }
            x1 = prev || Math.floor(mid - hf_px_step)
            x2 = Math.floor(mid + hf_px_step) - 0.5
            self.volume.push({
                x1: x1,
                x2: x2,
                h: p[5] * vs,
                green: p[4] >= p[1],
                z: p[6],
                raw: p
            })
            prev = x2 + splitter
        }

        // Update cache
        layoutCache.key = cacheKey
        layoutCache.candles = self.candles
        layoutCache.volume = self.volume
    }

    // Main grid
    const hs = grid_hs()
    let specs = {
        sub, interval, range, ctx, $p, layers_meta,
        ti_map, height: hs[0], y_t: y_ts[0],
        grid: mgrid, timezone: $p.timezone
    }
    let gms = [new GridMaker(0, specs)]

    // Sub grids
    for (let [i, { data, grid }] of offsub.entries()) {
        specs.sub = data
        specs.height = hs[i + 1]
        specs.y_t = y_ts[i + 1]
        specs.grid = grid || {}
        gms.push(new GridMaker(i + 1, specs, gms[0].get_layout()))
    }

    // Max sidebar among all grids
    let sb = Utils.maxInArray(gms.map(x => x.get_sidebar()))

    let grids = [], offset = 0

    for (let i = 0; i < gms.length; i++) {
        gms[i].set_sidebar(sb)
        grids.push(gms[i].create())
        grids[i].id = i
        grids[i].offset = offset
        offset += grids[i].height
    }

    let self = grids[0]

    candles_n_vol()

    return {
        grids: grids,
        botbar: {
            width: $p.width,
            height: $p.config.BOTBAR,
            offset: offset,
            xs: grids[0] ? grids[0].xs : []
        }
    }
}

export default Layout
