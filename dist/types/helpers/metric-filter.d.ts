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
export function passesFilter(num: number | string | null | undefined, op: string, value: number): boolean;
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
export function applyMetricFilters<T>(rows: Array<T>, filters: Array<{
    key: string;
    label?: string;
    op: string;
    value: number;
}>, getVal: (row: T, key: string) => (number | string | null | undefined)): Array<T>;
/** Supported comparison operators (order = UI <select> order). */
export const FILTER_OPS: string[];
