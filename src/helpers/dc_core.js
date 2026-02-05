
// DataCube "private" methods
// Optimized for Vue 3: reduced Vue instance coupling

import Utils from '../stuff/utils.js'
import DCEvents from './dc_events.js'
import Dataset from './dataset.js'
import emitter from '../stuff/eventBus.js'

export default class DCCore extends DCEvents {

    // Set TV instance (once). Called by TradingVue itself
    init_tvjs($root) {
        if (!this.tv) {
            this.tv = $root
            this.init_data()
            this.update_ids()

            // Listen to all setting changes via event bus
            // This decouples from Vue instance for better testability
            this._settingsUnwatch = this.tv.$watch(
                () => this.get_by_query('.settings'),
                (n, p) => {
                    this.on_settings(n, p)
                    emitter.emit('settings-changed', { newVal: n, oldVal: p })
                }
            )

            // Listen to all indices changes
            // PERFORMANCE: Cache the UUID array to avoid creating new array on every getter call
            // The getter returns a comma-joined string for efficient Vue comparison
            this._cachedIds = null
            this._cachedIdsKey = null
            this._idsUnwatch = this.tv.$watch(
                () => {
                    const items = this.get('.')
                    const ids = items.map(x => x.settings.$uuid)
                    const key = ids.join(',')
                    // Only update cache when key changes
                    if (key !== this._cachedIdsKey) {
                        this._cachedIdsKey = key
                        this._cachedIds = ids
                    }
                    return this._cachedIds
                },
                (n, p) => this.on_ids_changed(n, p)
            )

            // Watch for all 'datasets' changes
            this._datasetsUnwatch = this.tv.$watch(
                () => this.get('datasets'),
                Dataset.watcher.bind(this)
            )
        }
    }

    // Cleanup watchers (call on destroy)
    destroy() {
        if (this._settingsUnwatch) this._settingsUnwatch()
        if (this._idsUnwatch) this._idsUnwatch()
        if (this._datasetsUnwatch) this._datasetsUnwatch()
    }

    // Init Data Structure v1.1
    init_data($root) {

        if (!('chart' in this.data)) {
            this.data['chart'] = {
                type: 'Candles',
                data: this.data.ohlcv || []
            }
        }

        if (!('onchart' in this.data)) {
            this.data['onchart'] = []
        }

        if (!('offchart' in this.data)) {
            this.data['offchart'] = []
        }

        if (!this.data.chart.settings) {
            this.data.chart['settings'] = {}
        }

        // Remove ohlcv cuz we have Data v1.1^
        delete this.data.ohlcv

        if (!('datasets' in this.data)) {
            this.data['datasets'] = []
        }

        // Init dataset proxies
        for (let ds of this.data.datasets) {
            if (!this.dss) this.dss = {}
            this.dss[ds.id] = new Dataset(this, ds)
        }

    }

    // Range change callback (called by TradingVue)
    // TODO: improve (reliablity + chunk with limited size)
    async range_changed(range, tf, check=false) {

        if (!this.loader) return
        if (!this.loading) {
            if (!this.data.chart.data.length) return
            let first = this.data.chart.data[0][0]
            if (range[0] < first) {
                this.loading = true
                await Utils.pause(250) // Load bigger chunks
                range = range.slice()  // copy
                range[0] = Math.floor(range[0])
                range[1] = Math.floor(first)
                let prom = this.loader(range, tf, d => {
                    // Callback way
                    this.chunk_loaded(d)
                })
                if (prom && prom.then) {
                    // Promise way
                    this.chunk_loaded(await prom)
                }
            }
        }
        if (!check) this.last_chunk = [range, tf]
    }

    // A new chunk of data is loaded
    // TODO: bulletproof fetch
    chunk_loaded(data) {

        // Updates only candlestick data, or
        if (Array.isArray(data)) {
            this.merge('chart.data', data)
        } else {
            // Bunch of overlays, including chart.data
            for (let k in data) {
                this.merge(k, data[k])
            }
        }

        this.loading = false
        if (this.last_chunk) {
            this.range_changed(...this.last_chunk, true)
            this.last_chunk = null
        }

    }

    // Update ids for all overlays
    update_ids() {
        this.data.chart.id = `chart.${this.data.chart.type}`
        let count = {}
        // grid_id,layer_id => DC id mapping
        this.gldc = {}, this.dcgl = {}
        for (let ov of this.data.onchart) {
            if (count[ov.type] === undefined) {
                count[ov.type] = 0
            }
            let i = count[ov.type]++
            ov.id = `onchart.${ov.type}${i}`
            if (!ov.name) ov.name = ov.type + ` ${i}`
            if (!ov.settings) ov['settings'] = {}

            // grid_id,layer_id => DC id mapping
            this.gldc[`g0_${ov.type}_${i}`] = ov.id
            this.dcgl[ov.id] = `g0_${ov.type}_${i}`
        }
        count = {}
        let grids = [{}]
        let gid = 0
        for (let ov of this.data.offchart) {
            if (count[ov.type] === undefined) {
                count[ov.type] = 0
            }
            let i = count[ov.type]++
            ov.id = `offchart.${ov.type}${i}`
            if (!ov.name) ov.name = ov.type + ` ${i}`
            if (!ov.settings) ov['settings'] = {}

            // grid_id,layer_id => DC id mapping
            gid++
            let rgid = (ov.grid || {}).id || gid // real grid_id
            // When we merge grid, skip ++
            if ((ov.grid || {}).id) gid--
            if (!grids[rgid]) grids[rgid] = {}
            if (grids[rgid][ov.type] === undefined) {
                grids[rgid][ov.type] = 0
            }
            let ri = grids[rgid][ov.type]++
            this.gldc[`g${rgid}_${ov.type}_${ri}`] = ov.id
            this.dcgl[ov.id] = `g${rgid}_${ov.type}_${ri}`
        }
    }

    // TODO: chart refine (from the exchange chart)
    update_candle(data) {
        let ohlcv = this.data.chart.data
        if (!ohlcv.length) return false
        let last = ohlcv[ohlcv.length - 1]
        let candle = data['candle']
        let tf = this.tv.$refs.chart.interval_ms
        let t_next = last[0] + tf
        let now = data.t || Utils.now()
        let t = now >= t_next ? (now - now % tf) : last[0]

        // Update the entire candle
        if (candle.length >= 6) {
            t = candle[0]
        } else {
            candle = [t, ...candle]
        }

        this.agg.push('ohlcv', candle)
        this.update_overlays(data, t, tf)
        return t >= t_next

    }

    update_tick(data) {
        let ohlcv = this.data.chart.data
        let last = ohlcv[ohlcv.length - 1]
        if (!last && !ohlcv.length) return false
        let tick = data['price']
        let volume = data['volume'] || 0
        let tf = this.tv.$refs.chart.interval_ms
        if (!tf) {
            return console.warn('Define the main timeframe')
        }
        let now = data.t || Utils.now()
        if (!last) last = [now - now % tf]
        let t_next = last[0] + tf

        let t = now >= t_next ? (now - now % tf) : last[0]

        if ((t >= t_next || !ohlcv.length) && tick !== undefined) {
            // And new zero-height candle
            let nc = [t, tick, tick, tick, tick, volume]
            this.agg.push('ohlcv', nc, tf)
            ohlcv.push(nc)
            this.scroll_to(t)

        } else if (tick !== undefined) {
            // Update an existing one
            // TODO: make a separate class Sampler
            last[2] = Math.max(tick, last[2])
            last[3] = Math.min(tick, last[3])
            last[4] = tick
            last[5] += volume
            this.agg.push('ohlcv', last, tf)
        }
        this.update_overlays(data, t, tf)
        return t >= t_next
    }

    // Updates all overlays with given values.
    update_overlays(data, t, tf) {
        for (let k in data) {
            if (k === 'price' || k === 'volume' ||
                k === 'candle' || k === 't') {
                continue
            }
            if (k.includes('datasets.')) {
                this.agg.push(k, data[k], tf)
                continue
            }
            let val
            if (!Array.isArray(data[k])) {
                val = [data[k]]
            } else {
                val = data[k]
            }
            if (!k.includes('.data')) k += '.data'
            this.agg.push(k, [t, ...val], tf)
        }
    }

    // Returns array of objects matching query.
    // Object contains { parent, index, value }
    // TODO: query caching
    get_by_query(query, chuck) {

        let tuple = query.split('.')

        let result
        switch (tuple[0]) {
            case 'chart':
                result = this.chart_as_piv(tuple)
                break
            case 'onchart':
            case 'offchart':
                result = this.query_search(query, tuple)
                break
            case 'datasets':
                result = this.query_search(query, tuple)
                for (let r of result) {
                    if (r.i === 'data') {
                        r.v = this.dss[r.p.id].data()
                    }
                }
                break
            default:
                let on = this.query_search(query, [
                    'onchart',
                    tuple[0],
                    tuple[1]
                ])
                let off = this.query_search(query, [
                    'offchart',
                    tuple[0],
                    tuple[1]
                ])
                result = [...on, ...off]
                break
        }
        return result.filter(
            x => !(x.v || {}).locked || chuck)
    }

    chart_as_piv(tuple) {
        let field = tuple[1]
        if (field) return [{
            p: this.data.chart,
            i: field,
            v: this.data.chart[field]
        }]
        else return [{
            p: this.data,
            i: 'chart',
            v: this.data.chart
        }]
    }

    query_search(query, tuple) {

        let side = tuple[0]
        let path = tuple[1] || ''
        let field = tuple[2]

        let arr = this.data[side].filter(x => (
            x.id === query ||
            (x.id && x.id.includes(path)) ||
            x.name === query ||
            (x.name && x.name.includes(path)) ||
            query.includes((x.settings || {}).$uuid)
        ))

        if (field) {
            return arr.map(x => ({
                p: x,
                i: field,
                v: x[field]
            }))
        }

        // PERFORMANCE: Build index map for O(1) lookup instead of indexOf O(n) per element
        // This changes O(n²) to O(n) for the entire operation
        const sideData = this.data[side]
        const indexMap = new Map(sideData.map((item, idx) => [item, idx]))
        return arr.map(x => ({
            p: sideData,
            i: indexMap.get(x),
            v: x
        }))
    }

    merge_objects(obj, data, new_obj = {}) {

        // The only way to get Vue to update all stuff
        // reactively is to create a brand new object.
        // TODO: Is there a simpler approach?
        Object.assign(new_obj, obj.v)
        Object.assign(new_obj, data)
        obj.p[obj.i] = new_obj

    }

    // Merge overlapping time series
    merge_ts(obj, data) {

        // Assume that both arrays are pre-sorted

        if (!data.length) return obj.v

        let r1 = [obj.v[0][0], obj.v[obj.v.length - 1][0]]
        let r2 = [data[0][0],  data[data.length - 1][0]]

        // Overlap
        let o = [Math.max(r1[0],r2[0]), Math.min(r1[1],r2[1])]

        if (o[1] >= o[0]) {

            let { od, d1, d2 } = this.ts_overlap(obj.v, data, o)

            obj.v.splice(...d1)
            data.splice(...d2)

            // Dst === Overlap === Src
            if (!obj.v.length && !data.length) {
                obj.p[obj.i] = od
                return obj.v
            }

            // If src is totally contained in dst
            if (!data.length) { data = obj.v.splice(d1[0]) }

            // If dst is totally contained in src
            if (!obj.v.length) { obj.v = data.splice(d2[0]) }

            obj.p[obj.i] = this.combine(obj.v, od, data)

        } else {

            obj.p[obj.i] = this.combine(obj.v, [], data)

        }

        return obj.v

    }

    // Optimized: O(n) instead of O(n²) using binary search for index lookup
    ts_overlap(arr1, arr2, range) {

        const t1 = range[0]
        const t2 = range[1]

        let ts = {} // timestamp map

        // Use binary search to find indices directly instead of filter + indexOf
        // This avoids O(n) indexOf calls inside the O(n) loop = O(n²)
        let id11 = this.binarySearchGTE(arr1, t1)
        let id12 = this.binarySearchLTE(arr1, t2)
        let id21 = this.binarySearchGTE(arr2, t1)
        let id22 = this.binarySearchLTE(arr2, t2)

        // Handle edge cases
        if (id11 === -1 || id12 === -1 || id11 > id12) {
            id11 = 0
            id12 = -1
        }
        if (id21 === -1 || id22 === -1 || id21 > id22) {
            id21 = 0
            id22 = -1
        }

        // Build timestamp map from found segments
        for (let i = id11; i <= id12 && i < arr1.length; i++) {
            ts[arr1[i][0]] = arr1[i]
        }

        for (let i = id21; i <= id22 && i < arr2.length; i++) {
            ts[arr2[i][0]] = arr2[i]
        }

        // Sort numerically (Object.keys returns strings)
        let ts_sorted = Object.keys(ts).sort((a, b) => a - b)

        return {
            od: ts_sorted.map(x => ts[x]),
            d1: [id11, Math.max(0, id12 - id11 + 1)],
            d2: [id21, Math.max(0, id22 - id21 + 1)]
        }

    }

    // Binary search: find first index where arr[i][0] >= target
    binarySearchGTE(arr, target) {
        if (!arr.length) return -1
        let lo = 0, hi = arr.length - 1
        while (lo < hi) {
            let mid = (lo + hi) >> 1
            if (arr[mid][0] < target) {
                lo = mid + 1
            } else {
                hi = mid
            }
        }
        return arr[lo][0] >= target ? lo : -1
    }

    // Binary search: find last index where arr[i][0] <= target
    binarySearchLTE(arr, target) {
        if (!arr.length) return -1
        let lo = 0, hi = arr.length - 1
        while (lo < hi) {
            let mid = (lo + hi + 1) >> 1
            if (arr[mid][0] > target) {
                hi = mid - 1
            } else {
                lo = mid
            }
        }
        return arr[lo][0] <= target ? lo : -1
    }

    // Combine parts together:
    // (destination, overlap, source)
    combine(dst, o, src) {

        function last(arr) { return arr[arr.length - 1][0] }

        if (!dst.length) { dst = o; o = [] }
        if (!src.length) { src = o; o = [] }

        // The overlap right in the middle
        if (src[0][0] >= dst[0][0] && last(src) <= last(dst)) {

            return Object.assign(dst, o)

        // The overlap is on the right
        } else if (last(src) > last(dst)) {

            // Psh(...) is faster but can overflow the stack
            if (o.length < 100000 && src.length < 100000) {
                dst.push(...o, ...src)
                return dst
            } else {
                return dst.concat(o, src)
            }

        // The overlap is on the left
        } else if (src[0][0] < dst[0][0]) {

            // Push(...) is faster but can overflow the stack
            if (o.length < 100000 && src.length < 100000) {
                src.push(...o, ...dst)
                return src
            } else {
                return src.concat(o, dst)
            }

        } else {  return []  }

    }

    // Simple data-point merge (faster)
    fast_merge(data, point, main = true) {

        if (!data) return

        let last_t = (data[data.length - 1] || [])[0]
        let upd_t = point[0]

        if (!data.length || upd_t > last_t) {
            data.push(point)
            if (main && this.sett.auto_scroll) {
                this.scroll_to(upd_t)
            }
        } else if (upd_t === last_t) {
            data[data.length - 1] = point
        }

    }

    scroll_to(t) {
        if (this.tv.$refs.chart.cursor.locked) return
        let last = this.tv.$refs.chart.last_candle
        if (!last) return
        let tl = last[0]
        let d = this.tv.getRange()[1] - tl
        if (d > 0) this.tv.goto(t + d)
    }

}
