// Numeric column filters (Foundation, pure).
//
// A framework-agnostic predicate layer for "Net P/L > 1000", "Score v2 >= 0.5",
// … filters over tabular rows (backtest RUNS list, universe CANDIDATES table).
// Every comparison is strictly numeric and non-finite-safe: a row whose value
// (or the filter's threshold) is NaN/±Infinity/non-numeric FAILS the filter,
// i.e. is excluded. No DOM, no Vue, no mutation of inputs.

/** Supported comparison operators (order = UI <select> order). */
export const FILTER_OPS = ['>', '>=', '<', '<=', '=']

/**
 * Compare `num` against `value` under operator `op`.
 *
 * Returns `false` whenever either operand is non-finite (NaN, ±Infinity, or a
 * value that does not coerce to a finite number) or `op` is unknown — so a
 * missing / NaN metric never sneaks past a `>` filter.
 *
 * @param {number} num - the row's metric value
 * @param {string} op - one of FILTER_OPS
 * @param {number} value - the threshold
 * @returns {boolean}
 */
export function passesFilter(num, op, value) {
    const a = Number(num)
    const b = Number(value)
    if (!Number.isFinite(a) || !Number.isFinite(b)) return false
    switch (op) {
        case '>':  return a >  b
        case '>=': return a >= b
        case '<':  return a <  b
        case '<=': return a <= b
        case '=':  return a === b
        default:   return false
    }
}

/**
 * Filter `rows` to those satisfying ALL `filters` (logical AND). With no
 * filters every row passes through unchanged. `getVal(row, key)` extracts the
 * numeric value for a filter's column key.
 *
 * @template T
 * @param {Array<T>} rows - input rows
 * @param {Array<{key:string,label?:string,op:string,value:number}>} filters
 * @param {(row:T, key:string)=>number} getVal - column accessor
 * @returns {Array<T>} rows passing every filter
 */
export function applyMetricFilters(rows, filters, getVal) {
    if (!Array.isArray(rows)) return []
    if (!Array.isArray(filters) || filters.length === 0) return rows
    return rows.filter((row) =>
        filters.every((f) => passesFilter(getVal(row, f.key), f.op, f.value))
    )
}
