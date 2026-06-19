/**
 * Convert a timeframe label (`"1m"`, `"15m"`, `"1h"`/`"1H"`, `"1D"`, `"1W"`,
 * `"1M"`, …) to milliseconds for ordering. Unparseable labels → `Infinity` so
 * they sort LAST and are never chosen as "lowest".
 */
export function tfToMs(tf: any): number;
/**
 * The candle subscribe window for a position: pad [start, end] by `count` candles
 * on each side using the timeframe's bucket size, then clamp to [0, now]. Month
 * (`M`) and year (`y`) timeframes step by CALENDAR units (not fixed 30-day math);
 * everything else uses {@link tfToMs}. `now` is passed in (pure/testable).
 *
 * Returns `{ start_ms, end_ms }` (end_ms ≥ start_ms; never future, never < 0).
 */
export function paddedCandleRange({ start, end, timeframe, count, now }: {
    start: any;
    end: any;
    timeframe: any;
    count?: number | undefined;
    now: any;
}): {
    start_ms: number;
    end_ms: any;
};
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
