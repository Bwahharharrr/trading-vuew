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
 * All fee events for a position, merged + time-sorted: per-trade execution fees
 * (`trades[].fee`) PLUS ledger-backed funding/margin events (`audit.fees[]`).
 * Each event: `{ ts, currency, amount, kind, description, source, fee_id?, balance? }`.
 * `amount` is the raw decimal string (negative = cost, positive = credit). Older
 * audits with no `fees[]` simply yield the trade fees (backward-compatible).
 */
export function feeEvents(audit) {
  const out = []
  for (const t of sortedTrades(audit)) {
    if (t.fee == null || !t.fee_currency) continue
    out.push({
      ts: t.execution_timestamp_ms, currency: t.fee_currency, amount: t.fee,
      kind: 'trade', description: 'Trade fee', source: t.source,
    })
  }
  const fees = (audit && Array.isArray(audit.fees)) ? audit.fees : []
  for (const f of fees) {
    if (!f || f.amount == null || !f.currency) continue
    out.push({
      ts: f.timestamp_ms, currency: f.currency, amount: f.amount,
      kind: f.kind, description: f.description, source: f.source,
      fee_id: f.fee_id, balance: f.balance,
    })
  }
  out.sort((a, b) => (a.ts || 0) - (b.ts || 0))
  return out
}

/**
 * Cumulative TOTAL fees over the position (Spline.vue): `{ series:[[ts, cumFee]],
 * currency }`. Combines trade execution fees AND ledger funding/margin fees (via
 * {@link feeEvents}) — no longer trade-only. Signed running sum in the dominant
 * currency (largest |Σ|); other-currency events are omitted from the single line
 * (rare). The final point reconciles with `summary.fees_by_currency[currency]`.
 */
export function cumulativeFees(audit) {
  const events = feeEvents(audit)
  const totals = {}
  for (const e of events) totals[e.currency] = (totals[e.currency] || 0) + num(e.amount)
  let currency = null
  let best = -1
  for (const [c, v] of Object.entries(totals)) {
    if (Math.abs(v) > best) { best = Math.abs(v); currency = c }
  }
  const series = []
  let cum = 0
  for (const e of events) {
    if (currency == null || e.currency !== currency) continue
    cum += num(e.amount)               // accumulate UNrounded (avoid step drift)
    series.push([e.ts, round8(cum)])
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
