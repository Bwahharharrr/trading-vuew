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
 * Returns `false` whenever either operand is non-finite or `op` is unknown — so a
 * missing metric never sneaks past a `>` filter. "Missing" explicitly includes
 * null/undefined and an empty/whitespace string: although `Number(null)` and
 * `Number('')` coerce to a finite 0, the gateway uses those shapes for NO DATA,
 * which must be EXCLUDED rather than treated as zero.
 *
 * @param {number|string|null|undefined} num - the row's metric value (raw)
 * @param {string} op - one of FILTER_OPS
 * @param {number} value - the threshold
 * @returns {boolean}
 */
export function passesFilter(num, op, value) {
    // No-data (null/undefined/blank) → NaN so it fails every comparison, instead
    // of Number()'s misleading 0.
    const a = (num == null || (typeof num === 'string' && num.trim() === '')) ? NaN : Number(num)
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
 * @param {(row:T, key:string)=>(number|string|null|undefined)} getVal - column
 *   accessor; may return the RAW value (passesFilter coerces + excludes no-data)
 * @returns {Array<T>} rows passing every filter
 */
export function applyMetricFilters(rows, filters, getVal) {
    if (!Array.isArray(rows)) return []
    if (!Array.isArray(filters) || filters.length === 0) return rows
    return rows.filter((row) =>
        filters.every((f) => passesFilter(getVal(row, f.key), f.op, f.value))
    )
}
