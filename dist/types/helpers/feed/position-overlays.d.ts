/**
 * Buy/sell markers for the price pane (Trades.vue): `[ts, sideBool, price, label]`
 * where sideBool = 1 for a buy (amount > 0), 0 for a sell. Label is the raw,
 * signed amount string so precision is preserved in the readout.
 */
export function tradeMarkers(audit: any): any;
/**
 * Cumulative position size over the position's life (StepLine.vue): `[ts, size]`.
 * Running signed sum of trade amounts; a final point at the close timestamp so a
 * closed position visibly holds its last size to the end of its window.
 */
export function positionSizeSeries(audit: any): any[][];
/**
 * One bar per trade (Histogram.vue): `[ts, signedAmount]`. Positive (buy) renders
 * with colorUp (green), negative (sell) with colorDown (red).
 */
export function buySellHistogram(audit: any): any;
/**
 * Cumulative TRADE fees over the position (Spline.vue): `{ series:[[ts, cumFee]],
 * currency }`. Fees are decimal strings (negative = cost); the running sum stays
 * signed. Uses the dominant fee currency (largest |Σ|); other-currency fees are
 * omitted from the single line (rare — most positions are one currency).
 *
 * NOTE: this is TRADE fees only. Funding / margin-funding fees are not in the
 * chart-feed audit bundle (they live in the gateway's private_auth_state_rows_v1),
 * so a true all-in "total fees" needs a future gateway enhancement.
 */
export function cumulativeFees(audit: any): {
    series: any[][];
    currency: string | null;
};
/**
 * The [start, end] time window of a position, from `opened_at_ms` and
 * `closed_at_ms` (falling back to `updated_at_ms`). Accepts a position ROW or an
 * audit's `position` (both carry these fields). `end` is null for a still-open
 * position with no update stamp — callers extend that to "now" for ranging.
 */
export function positionWindow(p: any): {
    start: any;
    end: any;
};
