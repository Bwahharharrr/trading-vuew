
// Navigation bounds validation (Phase 4.2) — resolves the long-standing
// "limit goto & setRange (out of data error)" TODO. Pure + unit-testable.
//
// goto() targets a single point and should land inside the data, so an
// out-of-range target is CLAMPED (with a warn diagnostic). setRange() may
// legitimately extend past the data edge (over-scroll / empty space), so it is
// NOT clamped — we only flag a reversed range (swapped) or a range entirely off
// the data on one side. All callers stay non-breaking: the navigation still
// happens; the returned diagnostics are advisory.

import { warn } from './schema/diagnostics.js'

/**
 * @param {number} t - target timestamp (or index in IB mode)
 * @param {[number,number]|null} bounds - [firstTs, lastTs] of the data
 * @returns {{ value:number, diagnostics:object[] }}
 */
export function clampGoto(t, bounds) {
    const out = []
    if (bounds && Number.isFinite(t) && (t < bounds[0] || t > bounds[1])) {
        const c = Math.max(bounds[0], Math.min(bounds[1], t))
        out.push(warn('nav.goto.out_of_range',
            `goto(${t}) is outside the data range [${bounds[0]}, ${bounds[1]}]; clamped to ${c}`))
        t = c
    }
    return { value: t, diagnostics: out }
}

/**
 * @param {number} t1 @param {number} t2
 * @param {[number,number]|null} bounds
 * @returns {{ t1:number, t2:number, diagnostics:object[] }}
 */
export function clampRange(t1, t2, bounds) {
    const out = []
    if (Number.isFinite(t1) && Number.isFinite(t2) && t1 > t2) {
        out.push(warn('nav.range.reversed',
            `setRange(${t1}, ${t2}) is reversed; swapping`))
        const tmp = t1; t1 = t2; t2 = tmp
    }
    if (bounds && Number.isFinite(t1) && Number.isFinite(t2)) {
        const offLeft = t1 < bounds[0] && t2 < bounds[0]
        const offRight = t1 > bounds[1] && t2 > bounds[1]
        if (offLeft || offRight) {
            out.push(warn('nav.range.off_data',
                `setRange [${t1}, ${t2}] is entirely outside the data range [${bounds[0]}, ${bounds[1]}]`))
        }
    }
    return { t1, t2, diagnostics: out }
}

/** Extract [firstTs, lastTs] from a DataCube (or null if no data). */
export function dataBounds(dataCube) {
    const d = dataCube && dataCube.data && dataCube.data.chart && dataCube.data.chart.data
    if (!Array.isArray(d) || !d.length) return null
    return [d[0][0], d[d.length - 1][0]]
}
