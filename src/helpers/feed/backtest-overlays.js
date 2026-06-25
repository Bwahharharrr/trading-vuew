// backtest-overlays.js — pure transforms from a `backtest_report_overlays`
// event into chart-renderable shapes:
//   • account/equity series → descriptor-driven offchart overlays (the SAME
//     mechanism indicator view.layers use — layerKindToOverlay + styleToSettings)
//   • trades[] → Trades-overlay marker rows
//   • price_levels[] → stop/take level segments (active window + trigger)
//
// Decimal safety: source money/quantity fields are DECIMAL STRINGS. We Number()
// ONLY for canvas plotting (the renderer needs numbers); the raw strings remain
// in the source event for any display/analytics. No float maths is done here
// beyond that final-mile coercion.

import { layerKindToOverlay, styleToSettings } from './indicator-catalog.js'

/**
 * Build descriptor-driven offchart overlays from a report-overlays event.
 * Each `series_descriptors[]` entry plots its first field out of `equity_curve[]`
 * (e.g. `backtest_equity` → equity line; `backtest_drawdown` → drawdown
 * histogram). Returns `[{ id, name, type, pane, fields, visible, data, settings }]`.
 *
 * @param {object} report - a `backtest_report_overlays` event
 */
export function backtestSeriesOverlays(report) {
  const descriptors = (report && report.series_descriptors) || []
  const curve = (report && report.equity_curve) || []
  const overlays = []
  for (const d of descriptors) {
    if (!d || !d.id) continue
    const type = layerKindToOverlay(d.kind)
    if (!type) continue                       // unknown plot kind → skip (no overlay)
    const field = d.fields && d.fields[0]
    if (!field) continue
    const data = []
    for (const p of curve) {
      const v = p[field]
      if (v == null) continue                 // missing/null = absent for that bar
      const n = Number(v)
      if (!Number.isFinite(n)) continue
      data.push([p.timestamp_ms, n])
    }
    overlays.push({
      id: d.id,
      name: d.display_name || d.id,
      type,
      pane: (d.target && d.target.pane) || 'Backtest',
      fields: Array.isArray(d.fields) ? d.fields.slice() : [field],
      visible: d.visible_by_default !== false,
      data,
      settings: styleToSettings(d.style || {}),
    })
  }
  return overlays
}

/**
 * `trades[]` → Trades-overlay rows `[ts, buy?1:0, price, label]` (same shape the
 * position-trades overlay uses). Side is case-insensitive `Buy`/`Sell`.
 */
export function backtestTradeMarkers(trades) {
  const out = []
  for (const t of (Array.isArray(trades) ? trades : [])) {
    if (!t || t.timestamp_ms == null) continue
    const price = Number(t.price)
    if (!Number.isFinite(price)) continue
    const buy = String(t.side).toLowerCase() === 'buy'
    const label = `${t.side} ${t.quantity != null ? t.quantity : ''}`.trim()
    out.push([t.timestamp_ms, buy ? 1 : 0, price, label])
  }
  return out
}

/**
 * `price_levels[]` → `[{ price, priceRaw, kind, side, quantity, from, to,
 * triggered }]` — a horizontal level over its active lifecycle (activated →
 * triggered/cleared). `from`/`to` are ms (to=null means still active).
 */
export function backtestPriceLevels(levels) {
  const out = []
  for (const l of (Array.isArray(levels) ? levels : [])) {
    if (!l) continue
    const price = Number(l.price)
    if (!Number.isFinite(price)) continue
    out.push({
      price,
      priceRaw: l.price,
      kind: l.kind,
      side: l.side,
      quantity: l.quantity,
      from: l.activated_at_ms != null ? Number(l.activated_at_ms) : null,
      to: l.triggered_at_ms != null ? Number(l.triggered_at_ms)
        : (l.cleared_at_ms != null ? Number(l.cleared_at_ms) : null),
      triggered: l.triggered_at_ms != null,
    })
  }
  return out
}
