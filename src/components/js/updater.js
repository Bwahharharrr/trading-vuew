// Cursor updater: calculates current values for
// OHLCV and all other indicators

import Utils from '../../stuff/utils.js'

class CursorUpdater {

    constructor(comp) {
        this.comp = comp
        this.cursor = comp.cursor
        // PERFORMANCE: Cache for mapped screen positions
        this._screenCache = null
        this._screenCacheKey = null
    }

    // Get fresh grid references from the current layout
    get grids() {
        return this.comp.chartLayout.grids
    }

    // PERFORMANCE: Binary search directly on data array timestamps
    // Avoids creating intermediate array with .map()
    _nearestTimestamp(t, data) {
        if (!data || !data.length) return -1
        if (data.length === 1) return 0

        let lo = 0
        let hi = data.length - 1

        // Edge cases
        if (t <= data[lo][0]) return lo
        if (t >= data[hi][0]) return hi

        // Binary search
        while (lo < hi - 1) {
            const mid = (lo + hi) >> 1
            const midT = data[mid][0]
            if (midT === t) return mid
            if (midT < t) lo = mid
            else hi = mid
        }

        // Return closer of lo or hi
        return (t - data[lo][0]) <= (data[hi][0] - t) ? lo : hi
    }

    // PERFORMANCE: Find nearest screen X with caching
    // Cache invalidates when range or data changes
    _nearestScreenX(x, data, grid) {
        const cacheKey = `${grid.startx},${grid.px_step},${data.length}`

        if (this._screenCacheKey !== cacheKey || !this._screenCache) {
            // Rebuild cache - only happens when range/data changes
            this._screenCache = new Float64Array(data.length)
            for (let i = 0; i < data.length; i++) {
                this._screenCache[i] = grid.t2screen(data[i][0]) + 0.5
            }
            this._screenCacheKey = cacheKey
        }

        // Binary search on cached screen positions
        const xs = this._screenCache
        if (!xs.length) return -1
        if (xs.length === 1) return 0

        let lo = 0
        let hi = xs.length - 1

        if (x <= xs[lo]) return lo
        if (x >= xs[hi]) return hi

        while (lo < hi - 1) {
            const mid = (lo + hi) >> 1
            if (xs[mid] === x) return mid
            if (xs[mid] < x) lo = mid
            else hi = mid
        }

        return (x - xs[lo]) <= (xs[hi] - x) ? lo : hi
    }

    sync(e) {
        // TODO: values not displaying if a custom grid id is set:
        // grid: { id: N }
        this.cursor.grid_id = e.grid_id
        let once = true
        for (var grid of this.grids) {
            const c = this.cursor_data(grid, e)
            if (!this.cursor.locked) {
                // TODO: find a better fix to invisible cursor prob
                if (once) {
                    this.cursor.t = this.cursor_time(grid, e, c)
                    if (this.cursor.t) once = false
                }
                if(c.values) {
                    this.cursor.values[grid.id] = c.values
                }
            }
            if (grid.id !== e.grid_id) continue
            this.cursor.x = grid.t2screen(this.cursor.t)
            this.cursor.y = c.y
            this.cursor.y$ = c.y$
        }
    }

    overlay_data(grid, e) {

        const s = grid.id === 0 ? 'main_section' : 'sub_section'
        let data = this.comp[s].data

        // PERFORMANCE: Single-pass filter instead of two separate filter calls
        // Split offchart data between offchart grids
        if (grid.id > 0) {
            // Single pass to separate sequential grids from custom id grids
            let d = []  // Sequential grids (no custom id)
            let m = []  // Grids with custom ids matching this grid
            for (let i = 0; i < data.length; i++) {
                const x = data[i]
                if (x.grid.id === undefined) {
                    d.push(x)
                } else if (x.grid.id === grid.id) {
                    m.push(x)
                }
            }
            // PERFORMANCE: Use concat instead of spread operator
            data = [d[grid.id - 1]].concat(m)
        }

        const t = grid.screen2t(e.x)
        let ids = {}, res = {}
        for (var d of data) {
            // PERFORMANCE: Binary search directly on data array - no intermediate array
            let i = this._nearestTimestamp(t, d.data)
            d.type in ids ? (ids[d.type]++) : (ids[d.type] = 0)
            res[`${d.type}_${ids[d.type]}`] = d.data[i]
        }
        return res

    }

    // Nearest datapoints
    cursor_data(grid, e) {

        const data = this.comp.main_section.sub
        if (!data || !data.length) return {}

        // PERFORMANCE: Use cached screen positions with binary search
        let i = this._nearestScreenX(e.x, data, grid)
        if (i < 0) return {}

        // Get screen X from cache (already computed)
        const screenX = this._screenCache ? this._screenCache[i] : grid.t2screen(data[i][0]) + 0.5

        return {
            x: Math.floor(screenX) - 0.5,
            y: Math.floor(e.y - 2) - 0.5 - grid.offset,
            y$: grid.screen2$(e.y - 2 - grid.offset),
            t: (data[i] || [])[0],
            values: Object.assign({
                ohlcv: grid.id === 0 ? data[i] : undefined
            },
            this.overlay_data(grid, e))
        }
    }

    // Get cursor t-position (extended)
    cursor_time(grid, mouse, candle) {
        let t = grid.screen2t(mouse.x)
        let r = Math.abs((t - candle.t) / this.comp.interval)
        let sign = Math.sign(t - candle.t)
        if (r >= 0.5) {
            // Outside the data range
            let n = Math.round(r)
            return candle.t + n * this.comp.interval * sign
        }
        // Inside the data range
        return candle.t
    }

}

export default CursorUpdater
