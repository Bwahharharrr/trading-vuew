/**
 * Validate a single OHLCV candle row: [t, o, h, l, c, v, ...extras].
 * `prevTs` (optional) enables ascending-order / duplicate detection for feeds.
 * Pushes diagnostics into `out`. Returns nothing.
 */
export function validateCandle(row: any, path: any, out: any, prevTs: any): void;
/** Validate an OHLCV series. Caps per-issue noise; checks ordering across rows. */
export function validateOHLCV(data: any, basePath: any, out: any): void;
/**
 * Validate a full DataCube data object. Accepts both the short form
 * ({ ohlcv, onchart, offchart, datasets }) and the chart form
 * ({ chart: { data }, ... }). Multi-timeframe maps ({ '1m': {...} }) are
 * validated per-timeframe.
 *
 * @returns {{ ok: boolean, diagnostics: Diagnostic[] }}
 */
export function validateData(data: any): {
    ok: boolean;
    diagnostics: Diagnostic[];
};
