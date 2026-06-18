/**
 * Convert a timeframe label (`"1m"`, `"15m"`, `"1h"`/`"1H"`, `"1D"`, `"1W"`,
 * `"1M"`, …) to milliseconds for ordering. Unparseable labels → `Infinity` so
 * they sort LAST and are never chosen as "lowest".
 */
export function tfToMs(tf: any): number;
/**
 * Choose the timeframe to use when switching to `available` (the target symbol's
 * advertised timeframes): keep `current` if present → else `fallback` (default
 * `"1h"`) → else the lowest available. Returns the exact label from `available`
 * (preserving its case), or `current ?? null` when `available` is empty.
 *
 * @param {string} current   the timeframe currently being viewed
 * @param {string[]} available  timeframes the target symbol offers
 * @param {{fallback?: string}} [opts]
 */
export function pickTimeframe(current: string, available: string[], opts?: {
    fallback?: string;
}): string | null;
