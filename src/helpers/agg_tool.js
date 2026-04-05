// Tick aggregation
// PERFORMANCE: Uses RAF-coordinated updates to sync with render loop

import Utils from '../stuff/utils.js'

export default class AggTool {

    constructor(dc, int = 100) {

        this.symbols = {}
        this.int = int // Interval in ms
        this.dc = dc
        this.st_id = null
        this.raf_id = null
        this.data_changed = false
        this._lastUpdate = 0

    }

    push(sym, upd, tf) {

        // Start auto updates
        if (!this.st_id) {
            this.st_id = setTimeout(() => this.update())
        }

        tf = parseInt(tf)
        let old = this.symbols[sym]
        let t = Utils.now()
        let isds = sym.includes('datasets.')
        this.data_changed = true

        if (!old) {

            this.symbols[sym] = { upd, t, data: [] }

        } else if (upd[0] >= old.upd[0] + tf && !isds) {

            // Refine the previous data point
            this.refine(sym, old.upd.slice())

            this.symbols[sym] = { upd, t, data: [] }

        } else {

            // Tick updates the current
            this.symbols[sym].upd = upd
            this.symbols[sym].t = t

        }

        if (isds) {
            this.symbols[sym].data.push(upd)
        }

    }

    update() {
        let out = {}
        for (let sym in this.symbols) {
            let upd = this.symbols[sym].upd
            let data
            switch (sym) {
                case 'ohlcv':
                    data = this.dc.data.chart.data
                    this.dc.fast_merge(data, upd)
                    out.ohlcv = data.slice(-2)
                    break
                default:
                    if (sym.includes('datasets.')) {
                        this.update_ds(sym, out)
                        continue
                    }
                    data = this.dc.get_one(`${sym}`)
                    if (!data) continue
                    this.dc.fast_merge(data, upd, false)
                    break
            }
        }
        // TODO: fill gaps
        if (this.data_changed) {
            this.dc.ww.just('update-data', out)
            this.data_changed = false
        }
        // Notify the chart that data changed. Without scripts, the
        // Worker feedback loop (data-len-changed) never fires, so
        // the chart's data watcher doesn't trigger on in-place mutations.
        // Bump a reactive flag to force re-render of the last candle.
        if (out.ohlcv && this.dc.tv && this.dc.tv.$refs.chart) {
            this.dc.tv.$refs.chart.update_layout()
        }
        // PERFORMANCE: Use RAF-coordinated scheduling
        // This ensures updates are synced with the render loop
        this._scheduleNextUpdate()
    }

    // PERFORMANCE: RAF-coordinated update scheduling
    // Combines setTimeout for minimum interval with RAF for render sync
    _scheduleNextUpdate() {
        const now = Date.now()
        const elapsed = now - this._lastUpdate
        const remaining = Math.max(0, this.int - elapsed)

        // Clear any pending timers
        if (this.st_id) {
            clearTimeout(this.st_id)
            this.st_id = null
        }

        // Schedule next update: wait for minimum interval, then sync with RAF
        this.st_id = setTimeout(() => {
            this.st_id = null
            // Use RAF to sync with render loop
            this.raf_id = requestAnimationFrame(() => {
                this.raf_id = null
                this._lastUpdate = Date.now()
                this.update()
            })
        }, remaining)
    }

    refine(sym, upd) {
        let data
        if (sym === 'ohlcv') {
            data = this.dc.data.chart.data
            this.dc.fast_merge(data, upd)
        } else {
            data = this.dc.get_one(`${sym}`)
            if (!data) return
            this.dc.fast_merge(data, upd, false)
        }
    }

    update_ds(sym, out) {
        let data = this.symbols[sym].data
        if (data.length) {
            out[sym] = data
            this.symbols[sym].data = []
        }
    }

    clear() {
        this.symbols = {}
    }

    // PERFORMANCE: Proper cleanup of timers
    destroy() {
        if (this.st_id) {
            clearTimeout(this.st_id)
            this.st_id = null
        }
        if (this.raf_id) {
            cancelAnimationFrame(this.raf_id)
            this.raf_id = null
        }
        this.symbols = {}
    }

}
