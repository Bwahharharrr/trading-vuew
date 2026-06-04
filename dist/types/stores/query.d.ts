/**
 * @typedef {Object} QueryCtx
 * @property {Object} data - the DataCube data object ({chart,onchart,offchart,datasets,...})
 * @property {Object} [dss] - dataset proxies keyed by id (for `datasets.*` queries)
 */
/** Resolve a chart.* query into a pivot list. */
export function chartAsPiv(data: any, tuple: any): {
    p: any;
    i: any;
    v: any;
}[];
/** Search onchart/offchart (or datasets) for objects matching the query. */
export function querySearch(data: any, query: any, tuple: any): any;
/**
 * Resolve a string-path query against the data model.
 * @param {QueryCtx} ctx
 * @param {string} query  e.g. 'chart.data', 'onchart.EMA', 'RSI', '.settings'
 * @param {boolean} [chuck] include locked overlays
 * @returns {Array<{p:any,i:any,v:any}>}
 */
export function getByQuery(ctx: QueryCtx, query: string, chuck?: boolean): Array<{
    p: any;
    i: any;
    v: any;
}>;
/**
 * Opt-in memoization wrapper for getByQuery. Caches by query string and
 * invalidates when `versionFn()` changes. NOT yet used by DataCube — wiring it
 * in (to retire the JSON.stringify fingerprint watcher) is the reactivity
 * sub-step, which needs the 600-ticks/sec stress gate.
 */
export function createQueryCache(versionFn: any): (ctx: any, query: any, chuck: any) => any;
export type QueryCtx = {
    /**
     * - the DataCube data object ({chart,onchart,offchart,datasets,...})
     */
    data: Object;
    /**
     * - dataset proxies keyed by id (for `datasets.*` queries)
     */
    dss?: Object | undefined;
};
