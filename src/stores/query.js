
// Framework-agnostic query engine for the DataCube data model (Phase 3.1).
//
// Faithful extraction of dc_core's get_by_query / query_search / chart_as_piv,
// operating on a plain `{ data, dss }` context instead of `this`. This is the
// first strangler-fig seam: the query logic is now pure, Vue-free, and
// unit-testable in Node, while DataCube delegates to it byte-identically (the
// Phase 1 DataCube golden masters are the guarantee).
//
// Behaviour-preserving on purpose — NO memoization is wired in here yet
// (that's the reactivity sub-step that removes the fingerprint watcher);
// `createQueryCache` is provided but opt-in so no stale-cache risk is taken.

/**
 * @typedef {Object} QueryCtx
 * @property {Object} data - the DataCube data object ({chart,onchart,offchart,datasets,...})
 * @property {Object} [dss] - dataset proxies keyed by id (for `datasets.*` queries)
 */

/** Resolve a chart.* query into a pivot list. */
export function chartAsPiv(data, tuple) {
    let field = tuple[1]
    if (field) return [{
        p: data.chart,
        i: field,
        v: data.chart[field]
    }]
    else return [{
        p: data,
        i: 'chart',
        v: data.chart
    }]
}

/** Search onchart/offchart (or datasets) for objects matching the query. */
export function querySearch(data, query, tuple) {

    let side = tuple[0]
    let path = tuple[1] || ''
    let field = tuple[2]

    let arr = data[side].filter(x => (
        x.id === query ||
        (x.id && x.id.includes(path)) ||
        x.name === query ||
        (x.name && x.name.includes(path)) ||
        // $uuid must EXIST: String.includes(undefined) matches the literal
        // "undefined", so a stale id query ('undefined' from a gldc miss)
        // matched every uuid-less overlay and returned an arbitrary one.
        ((x.settings || {}).$uuid != null &&
            query.includes(x.settings.$uuid))
    ))

    if (field) {
        return arr.map(x => ({
            p: x,
            i: field,
            v: x[field]
        }))
    }

    // O(1) index lookup (vs indexOf O(n) per element) — O(n) overall.
    const sideData = data[side]
    const indexMap = new Map(sideData.map((item, idx) => [item, idx]))
    return arr.map(x => ({
        p: sideData,
        i: indexMap.get(x),
        v: x
    }))
}

/**
 * Resolve a string-path query against the data model.
 * @param {QueryCtx} ctx
 * @param {string} query  e.g. 'chart.data', 'onchart.EMA', 'RSI', '.settings'
 * @param {boolean} [chuck] include locked overlays
 * @returns {Array<{p:any,i:any,v:any}>}
 */
export function getByQuery(ctx, query, chuck) {

    const data = ctx.data
    const dss = ctx.dss
    let tuple = query.split('.')

    let result
    switch (tuple[0]) {
        case 'chart':
            result = chartAsPiv(data, tuple)
            break
        case 'onchart':
        case 'offchart':
            result = querySearch(data, query, tuple)
            break
        case 'datasets':
            result = querySearch(data, query, tuple)
            for (let r of result) {
                if (r.i === 'data') {
                    r.v = dss[r.p.id].data()
                }
            }
            break
        default:
            let on = querySearch(data, query, [
                'onchart',
                tuple[0],
                tuple[1]
            ])
            let off = querySearch(data, query, [
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

/**
 * Opt-in memoization wrapper for getByQuery. Caches by query string and
 * invalidates when `versionFn()` changes. NOT yet used by DataCube — wiring it
 * in (to retire the JSON.stringify fingerprint watcher) is the reactivity
 * sub-step, which needs the 600-ticks/sec stress gate.
 */
export function createQueryCache(versionFn) {
    let cache = new Map()
    let lastVersion
    return function cachedGetByQuery(ctx, query, chuck) {
        const v = versionFn()
        if (v !== lastVersion) { cache.clear(); lastVersion = v }
        const key = chuck ? `c:${query}` : query
        if (cache.has(key)) return cache.get(key)
        const r = getByQuery(ctx, query, chuck)
        cache.set(key, r)
        return r
    }
}
