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

// ───────────────────────────────────────────── view.layers rendering ──
// (chart-feed v1: prefer the descriptor's `view.layers` over plot-every-output)

/**
 * Map a view-layer `kind` to a trading-vue overlay component.
 * Returns `null` for kinds with no declarative renderer:
 *  - `candle_color` → stamps the candle colour slot (handled separately)
 *  - `marker` → no declarative overlay yet (kept as hidden metadata)
 *
 * @param {string} kind  layer kind
 * @param {number} [fieldCount=1]  number of fields the layer reads
 * @returns {string|null} overlay type name, or null
 */
export function layerKindToOverlay(kind, fieldCount = 1) {
  switch (kind) {
    case 'line':
    case 'diagnostic':
      return fieldCount > 1 ? 'Splines' : 'Spline'
    case 'histogram':
      return 'Histogram'
    case 'band':
      return 'Channel'   // [ts, top, mid, bottom]
    case 'box':
      return 'Zones'     // per-ts rectangles
    case 'candle_color':
    case 'marker':
    default:
      return null
  }
}

/**
 * Translate protocol `style` hints (free-form string map) into trading-vue
 * overlay settings. Unknown keys pass through under `settings.style` for
 * forward-compat.
 * @param {Record<string,string>} [style]
 * @returns {object} settings fragment
 */
export function styleToSettings(style) {
  const s = style || {}
  const out = {}
  if (s.color) out.color = s.color
  if (s.colors) out.colors = String(s.colors).split(',').map((x) => x.trim())
  if (s.line_width || s.width) out.lineWidth = Number(s.line_width || s.width)
  if (s.color_up) out.colorUp = s.color_up
  if (s.color_down || s.color_dw) out.colorDown = s.color_down || s.color_dw
  if (s.back_color) out.backColor = s.back_color
  if (s.show_mid != null) out.showMid = s.show_mid === 'true' || s.show_mid === '1'
  out.style = s // keep raw hints for forward-compat / client rules
  return out
}

// Categorical SCMR-style candle colours → hex.
const CANDLE_COLOR_ENUM = {
  bull: '#23a776', bear: '#e54150', neutral: '#7f8694',
  up: '#23a776', down: '#e54150',
  strong_bull: '#1f9e6b', strong_bear: '#d63a48'
}

/**
 * Map a `candle_color` field value to a body-colour hex.
 * Pass-through for `#RRGGBB`; categorical enum lookup; else a numeric score
 * ramp (>=0 green, <0 red). Returns null if unmappable.
 * @param {string|number|null} value
 * @returns {string|null}
 */
export function candleColorOf(value) {
  if (value == null || value === '') return null
  if (typeof value === 'string') {
    if (/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(value)) return value
    const k = value.toLowerCase()
    if (CANDLE_COLOR_ENUM[k]) return CANDLE_COLOR_ENUM[k]
  }
  const n = Number(value)
  if (Number.isFinite(n)) return n >= 0 ? CANDLE_COLOR_ENUM.bull : CANDLE_COLOR_ENUM.bear
  return null
}
