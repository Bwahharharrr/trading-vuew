// Corky indicator `kind` → chart placement + overlay-type mapping.
//
// Maps an indicator kind (the prefix of a Corky instance key, e.g. the `sma`
// in `sma:20`) to where its series belongs on the chart and which
// trading-vue overlay component renders it.
//
// The overlay types referenced here MUST exist under
// src/components/overlays/ (e.g. Spline.vue, Splines.vue, Volume.vue,
// Histogram.vue) — they are registered by name in the overlay registry.
//
// Extending: add a row to ONCHART or OFFCHART below. Anything not listed
// falls back to an off-chart line, so unknown kinds still render in their own
// pane without throwing.

// Default line overlay for a single-value series. `Spline` is the smooth-line
// overlay shipped in src/components/overlays/Spline.vue.
const LINE = 'Spline'

// Price-overlay indicators: drawn on the main (price) pane, on top of candles.
const ONCHART = {
  sma: LINE,
  ema: LINE,
  wma: LINE,
  vwap: LINE,
  hma: LINE,
  bbands: 'Splines', // multi-line band → Splines (multi-series line overlay)
  dema: LINE,
  tema: LINE,
  kc: 'Splines', // Keltner channel: multi-line band
  supertrend: LINE,
}

// Momentum / volume indicators: drawn in their own pane below price.
const OFFCHART = {
  rsi: LINE,
  macd: 'Splines', // macd line + signal + histogram → multi-series
  stoch: 'Splines',
  atr: LINE,
  adx: LINE,
  cci: LINE,
  mfi: LINE,
  obv: LINE,
  volume: 'Histogram',
}

/**
 * Resolve placement + overlay type for an indicator kind.
 *
 * @param {string} kind - indicator kind, e.g. `'sma'`, `'rsi'`, `'macd'`.
 * @returns {{ pane: 'onchart'|'offchart', overlayType: string }}
 */
export function indicatorPlacement(kind) {
  const k = typeof kind === 'string' ? kind.toLowerCase() : ''
  if (Object.prototype.hasOwnProperty.call(ONCHART, k)) {
    return { pane: 'onchart', overlayType: ONCHART[k] }
  }
  if (Object.prototype.hasOwnProperty.call(OFFCHART, k)) {
    return { pane: 'offchart', overlayType: OFFCHART[k] }
  }
  // Unknown kind: a plain off-chart line, in its own pane.
  return { pane: 'offchart', overlayType: LINE }
}

// Exposed for tests / programmatic extension.
export const onchartKinds = ONCHART
export const offchartKinds = OFFCHART
