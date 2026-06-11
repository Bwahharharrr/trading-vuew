
// DataCube "private" methods
// Optimized for Vue 3: reduced Vue instance coupling

import Utils from '../stuff/utils.js'
import DCEvents from './dc_events.js'
import Dataset from './dataset.js'
import emitter from '../stuff/eventBus.js'
import { getByQuery, querySearch, chartAsPiv } from '../stores/query.js'
import {
    mergeTs, mergeObjects, tsOverlap, combine,
    binarySearchGTE, binarySearchLTE,
} from '../stores/merge.js'
import ChartUI from '../stores/chart-ui.js'
import ChartData from '../stores/chart-data.js'

export default class DCCore extends DCEvents {

    // Set TV instance (once). Called by TradingVue itself
    init_tvjs($root) {
        if (!this.tv) {
            this.tv = $root
            this.init_data()
            this.update_ids()

            // Listen to all setting changes via event bus
            // PERF: Cache settings result using fingerprint to avoid ~600 spurious
            // watcher fires/sec (get_by_query returns new array each call)
            this._cachedSettings = null
            this._cachedSettingsKey = null
            this._settingsUnwatch = this.tv.$watch(
                () => {
                    const settings = this.get_by_query('.settings')
                    // Build a fingerprint from settings content
                    const key = settings.map(s =>
                        JSON.stringify(s.v)
                    ).join('|')
                    if (key !== this._cachedSettingsKey) {
                        this._cachedSettingsKey = key
                        this._cachedSettings = settings
                    }
                    return this._cachedSettings
                },
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

        // Always present: Dataset.watcher and the 'datasets.*' query path write
        // through this map — initializing it only inside the loop below meant a
        // cube constructed without datasets THREW on a later dc.add('datasets').
        if (!this.dss) this.dss = {}

        // Init dataset proxies
        for (let ds of this.data.datasets) {
            if (!this.dss) this.dss = {}
            this.dss[ds.id] = new Dataset(this, ds)
        }

        // Typed UI-state facade (Phase 3.1 data/UI seam). Backed by `this.data`
        // so reactivity and existing `this.data.tool` readers are unaffected;
        // call-site migration + physical separation is the 3.1b sub-step.
        this.ui = new ChartUI(this.data)

        // Force-create the chart-DATA store (and its invalidation signal) now,
        // outside any render computed, so consumers can read `revision()`
        // without the lazy getter firing mid-render.
        void this.cd

        // The `data` PROP passed to Chart/Grid is `dc.data` (this object), not
        // the DataCube — so the old `dataVersion` lived here. Expose the store
        // via a non-enumerable back-ref so Chart.dataHashKey / Grid.dataKey can
        // reach the revision signal from the data object. Non-enumerable keeps
        // it out of spreads / Object.keys / worker payloads.
        Object.defineProperty(this.data, '$cd', {
            value: this.cd, enumerable: false, configurable: true, writable: true,
        })

    }

    // Typed chart-DATA store (Phase 3.1b): query + structural mutations +
    // the render-invalidation signal, composing the framework-agnostic
    // query/merge engines. Provided lazily so it works mounted or not.
    get cd() {
        if (!this._cd) {
            const self = this
            this._cd = new ChartData({
                get data() { return self.data },
                get dss() { return self.dss },
                updateIds: () => self.update_ids(),
            })
        }
        return this._cd
    }

    // Render-invalidation entry point (Phase 3.1b-final). Call after any
    // in-place mutation to OHLCV / overlay data / candle colour slots so
    // consumers (Chart.dataHashKey, Grid.dataKey) recompute and redraw.
    //
    // Replaces the old `data.dataVersion` integer + the `this.tv.$props.data
    // .data` raw/reactive routing hack: now a single delegate to the store's
    // reactive `invalidate()`, whose signal lives in a closure ref (so it is
    // never auto-unwrapped through a reactive proxy, and the AggTool raw-`this`
    // problem disappears — the ref is reactive on its own, not via the data
    // object). Kept as `touchData()` for the external callers in
    // ws-manager / view-manager.
    touchData() {
        this.cd.invalidate()
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
                try {
                    let prom = this.loader(range, tf, d => {
                        // Callback way
                        this.chunk_loaded(d)
                    })
                    if (prom && prom.then) {
                        // Promise way
                        this.chunk_loaded(await prom)
                    }
                } catch (e) {
                    // A failed loader (network blip) must NOT leave `loading`
                    // stuck true — that permanently disabled lazy history until
                    // a full reload.
                    this.loading = false
                    console.warn('DataCube loader failed:', e)
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
        let last = ohlcv[ohlcv.length - 1]
        let candle = data['candle']
        let tf = this.tv.$refs.chart.interval_ms
        // Only the PARTIAL-candle path derives its timestamp from `last`; a
        // full candle carries its own. The old blanket empty-guard silently
        // dropped the first candle of an empty chart (feed connected before
        // history) — the chart stayed blank forever.
        if (!last && !(candle && candle.length >= 6)) return false
        let now = data.t || Utils.now()
        let t_next = last ? last[0] + tf : now - now % tf
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
        // No early return on empty: the `if (!last)` seed below EXISTS to
        // bootstrap the first candle on an empty chart — the old guard made it
        // unreachable and every tick before history loaded was discarded.
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
            this.touchData()

        } else if (tick !== undefined) {
            // Update an existing one
            // TODO: make a separate class Sampler
            last[2] = Math.max(tick, last[2])
            last[3] = Math.min(tick, last[3])
            last[4] = tick
            last[5] += volume
            this.agg.push('ohlcv', last, tf)
            this.touchData()
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
    // Delegates to the framework-agnostic query engine (src/stores/query.js).
    // Thin wrappers are kept so existing callers (and the `this.query_search`
    // call sites) work unchanged during the strangler-fig migration.
    get_by_query(query, chuck) {
        return getByQuery({ data: this.data, dss: this.dss }, query, chuck)
    }

    chart_as_piv(tuple) {
        return chartAsPiv(this.data, tuple)
    }

    query_search(query, tuple) {
        return querySearch(this.data, query, tuple)
    }

    // Merge primitives now live in the framework-agnostic merge engine
    // (src/stores/merge.js). Thin delegates are kept so existing callers
    // (datacube.merge, dc.test.js, the golden masters) work unchanged.
    merge_objects(obj, data, new_obj = {}) { return mergeObjects(obj, data, new_obj) }
    merge_ts(obj, data) { return mergeTs(obj, data) }
    ts_overlap(arr1, arr2, range) { return tsOverlap(arr1, arr2, range) }
    binarySearchGTE(arr, target) { return binarySearchGTE(arr, target) }
    binarySearchLTE(arr, target) { return binarySearchLTE(arr, target) }
    combine(dst, o, src) { return combine(dst, o, src) }

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
            this.touchData()
        } else if (upd_t === last_t) {
            data[data.length - 1] = point
            this.touchData()
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
