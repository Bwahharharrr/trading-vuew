// Pure transforms: a position's audit bundle → chart-overlay `data` arrays.
//
// No framework / I/O deps so the shapes are golden-pinnable. Decimal STRINGS are
// parsed to Number ONLY for plot coordinates (the chart axes need numbers);
// marker labels reuse the raw strings so displayed quantities keep exact text.
// Cumulative sums are rounded to 8 dp to avoid float-noise like 0.04999999.

function num(s) {
  const n = Number(s)
  return Number.isFinite(n) ? n : 0
}

function round8(n) { return Math.round(n * 1e8) / 1e8 }

// Trades sorted ascending by execution time (audit order isn't guaranteed).
function sortedTrades(audit) {
  const t = (audit && Array.isArray(audit.trades)) ? audit.trades : []
  return t.slice().sort(
    (a, b) => (a.execution_timestamp_ms || 0) - (b.execution_timestamp_ms || 0))
}

/**
 * Buy/sell markers for the price pane (Trades.vue): `[ts, sideBool, price, label]`
 * where sideBool = 1 for a buy (amount > 0), 0 for a sell. Label is the raw,
 * signed amount string so precision is preserved in the readout.
 */
export function tradeMarkers(audit) {
  return sortedTrades(audit).map((t) => {
    const amt = num(t.amount)
    const label = `${amt > 0 ? '+' : ''}${t.amount}`
    return [t.execution_timestamp_ms, amt > 0 ? 1 : 0, num(t.price), label]
  })
}

/**
 * Cumulative position size over the position's life (StepLine.vue): `[ts, size]`.
 * Running signed sum of trade amounts; a final point at the close timestamp so a
 * closed position visibly holds its last size to the end of its window.
 */
export function positionSizeSeries(audit) {
  const trades = sortedTrades(audit)
  const out = []
  let cum = 0
  for (const t of trades) {
    cum += num(t.amount)               // accumulate UNrounded (avoid step drift)
    out.push([t.execution_timestamp_ms, round8(cum)])   // round only for display
  }
  const p = (audit && audit.position) || {}
  const end = p.closed_at_ms != null ? p.closed_at_ms
    : (p.updated_at_ms != null ? p.updated_at_ms : null)
  if (out.length && end != null && end > out[out.length - 1][0]) {
    out.push([end, out[out.length - 1][1]])
  }
  return out
}

/**
 * One bar per trade (Histogram.vue): `[ts, signedAmount]`. Positive (buy) renders
 * with colorUp (green), negative (sell) with colorDown (red).
 */
export function buySellHistogram(audit) {
  return sortedTrades(audit).map((t) => [t.execution_timestamp_ms, num(t.amount)])
}

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
export function cumulativeFees(audit) {
  const trades = sortedTrades(audit)
  const totals = {}
  for (const t of trades) {
    if (t.fee == null || !t.fee_currency) continue
    totals[t.fee_currency] = (totals[t.fee_currency] || 0) + num(t.fee)
  }
  let currency = null
  let best = -1
  for (const [c, v] of Object.entries(totals)) {
    if (Math.abs(v) > best) { best = Math.abs(v); currency = c }
  }
  const series = []
  let cum = 0
  for (const t of trades) {
    if (currency == null || t.fee_currency !== currency || t.fee == null) continue
    cum += num(t.fee)                  // accumulate UNrounded (avoid step drift)
    series.push([t.execution_timestamp_ms, round8(cum)])
  }
  return { series, currency }
}

/**
 * The [start, end] time window of a position, from `opened_at_ms` and
 * `closed_at_ms` (falling back to `updated_at_ms`). Accepts a position ROW or an
 * audit's `position` (both carry these fields). `end` is null for a still-open
 * position with no update stamp — callers extend that to "now" for ranging.
 */
export function positionWindow(p) {
  if (!p) return { start: null, end: null }
  const start = p.opened_at_ms != null ? p.opened_at_ms : null
  const end = p.closed_at_ms != null ? p.closed_at_ms
    : (p.updated_at_ms != null ? p.updated_at_ms : null)
  return { start, end }
}
