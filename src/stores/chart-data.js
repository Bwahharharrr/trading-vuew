
// ChartData store (Phase 3.1b) — the typed home for the chart DATA model
// (chart/onchart/offchart/datasets) and its structural mutation API.
//
// Composes the framework-agnostic query (query.js) and merge (merge.js) engines
// behind typed actions. DataCube delegates its public data API (get/set/merge/
// del/add/lock/unlock) here; the mutation BODIES are moved verbatim so the
// goldens stay byte-identical.
//
// Backed by a context ({data, dss, updateIds}) referencing the live DataCube
// fields via getters, so reactivity is unchanged. It also OWNS the render-
// invalidation signal (revision/invalidate) — Phase 3.1b-final replaced the old
// `data.dataVersion` integer + the touchData() raw/reactive routing hack with
// the closure-held ref below. The in-place OHLCV mutation BODY (fast_merge)
// still lives on DCCore and simply calls touchData() -> cd.invalidate().

import { ref } from 'vue'
import { getByQuery } from './query.js'
import { mergeTs, mergeObjects } from './merge.js'

export default class ChartData {

    /**
     * @param {object} ctx
     * @param {object} ctx.data - DataCube data object (live ref / getter)
     * @param {object} [ctx.dss] - dataset proxies
     * @param {()=>void} [ctx.updateIds] - rebuild id maps after a structural change
     */
    constructor(ctx) {
        this._ctx = ctx
        if (!this._ctx.updateIds) this._ctx.updateIds = () => {}

        // Render-invalidation signal (Phase 3.1b-final) — replaces the old
        // integer `data.dataVersion` field + the `touchData()` raw/reactive
        // routing hack. The ref is held in a CLOSURE (not a property) so it is
        // never auto-unwrapped when the store is reached through a reactive
        // proxy. `revision()` is read by Chart.dataHashKey / Grid.dataKey;
        // `invalidate()` is the single bump, called for in-place mutations that
        // aren't captured by the OHLC key (e.g. live candle colour writes) —
        // these genuinely need explicit invalidation, so the signal stays.
        const rev = ref(0)
        this.invalidate = () => { rev.value++ }
        this.revision = () => rev.value
    }

    get data() { return this._ctx.data }

    _q() { return { data: this._ctx.data, dss: this._ctx.dss } }

    // ── reads ──
    query(query, chuck) { return getByQuery(this._q(), query, chuck) }
    get(query) { return this.query(query).map(x => x.v) }
    getOne(query) { return this.query(query).map(x => x.v)[0] }

    // ── structural mutations (bodies moved verbatim from datacube.js) ──
    set(query, data) {
        let objects = this.query(query)
        for (var obj of objects) {
            let i = obj.i !== undefined ? obj.i : obj.p.indexOf(obj.v)
            if (i !== -1) obj.p[i] = data
        }
        this._ctx.updateIds()
    }

    merge(query, data) {
        let objects = this.query(query)
        // mergeTs CONSUMES the incoming array (splices it) and stores its point
        // arrays by reference. With a multi-match query the first merge would
        // eat the chunk (siblings get the stale remainder) and the matched
        // overlays would share row references (an in-place tick update on one
        // corrupts the others). Give each pivot its own row-level copy.
        const multi = objects.length > 1 && Array.isArray(data)
        for (var obj of objects) {
            if (Array.isArray(obj.v)) {
                if (!Array.isArray(data)) continue
                const chunk = multi
                    ? data.map(r => (Array.isArray(r) ? r.slice() : r))
                    : data
                if (obj.v[0] && obj.v[0].length >= 2) {
                    mergeTs(obj, chunk)
                } else {
                    mergeObjects(obj, chunk, [])
                }
            } else if (typeof obj.v === 'object') {
                mergeObjects(obj, data)
            }
        }
        this._ctx.updateIds()
    }

    del(query) {
        let objects = this.query(query)
        for (var obj of objects) {
            let i = typeof obj.i !== 'number' ? obj.i : obj.p.indexOf(obj.v)
            // field queries (e.g. 'chart.data') pivot onto a plain object —
            // a string index passed the old `!== -1` check and splice threw
            if (typeof i === 'number' && i !== -1 && Array.isArray(obj.p)) {
                obj.p.splice(i, 1)
            }
        }
        this._ctx.updateIds()
    }

    add(side, overlay) {
        if (side !== 'onchart' && side !== 'offchart' && side !== 'datasets') return
        this._ctx.data[side].push(overlay)
        this._ctx.updateIds()
        return overlay.id
    }

    lock(query) {
        this.query(query).forEach(x => {
            if (x.v && x.v.id && x.v.type) x.v.locked = true
        })
    }

    unlock(query) {
        this.query(query, true).forEach(x => {
            if (x.v && x.v.id && x.v.type) x.v.locked = false
        })
    }
}
