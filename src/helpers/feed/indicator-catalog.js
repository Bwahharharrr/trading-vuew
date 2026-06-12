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
    case 'marker':
      return 'Markers'   // point glyphs at [ts, y]
    case 'candle_color':
    default:
      return null        // candle_color stamps the candle colour slot
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

function numOr(v, d) { const n = Number(v); return Number.isFinite(n) ? n : d }

/**
 * Map a `candle_color` field value to a body-colour hex.
 * - `#RRGGBB` → pass-through; categorical enum (`bull`/`bear`/`neutral`/…) → hex.
 * - Numeric → a ramp with a NEUTRAL DEAD-BAND: `n > bullAbove` green,
 *   `n < bearBelow` red, in-between neutral. Thresholds are in the field's own
 *   units and configurable per layer via `candleColorOpts(layer.style)`.
 *   Defaults: bullAbove=0, bearBelow=0 → >0 green, <0 red, =0 neutral.
 * Returns null if unmappable.
 *
 * @param {string|number|null} value
 * @param {{ bullAbove?:number, bearBelow?:number, neutralBand?:number,
 *           bullColor?:string, bearColor?:string, neutralColor?:string }} [opts]
 * @returns {string|null}
 */
export function candleColorOf(value, opts = {}) {
  if (value == null || value === '') return null
  if (typeof value === 'string') {
    if (/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(value)) return value
    const k = value.toLowerCase()
    if (CANDLE_COLOR_ENUM[k]) return CANDLE_COLOR_ENUM[k]
  }
  const n = Number(value)
  if (!Number.isFinite(n)) return null
  const band = numOr(opts.neutralBand, 0)
  const bull = opts.bullAbove != null ? numOr(opts.bullAbove, 0) : band
  const bear = opts.bearBelow != null ? numOr(opts.bearBelow, 0) : -band
  if (n > bull) return opts.bullColor || CANDLE_COLOR_ENUM.bull
  if (n < bear) return opts.bearColor || CANDLE_COLOR_ENUM.bear
  return opts.neutralColor || CANDLE_COLOR_ENUM.neutral
}

/**
 * Build numeric candle-colour thresholds/colours from a layer's `style` hints.
 * Recognised keys: `bull_above`, `bear_below`, `neutral_band` (thresholds, field
 * units) and `color_up`/`bull_color`, `color_down`/`bear_color`, `neutral_color`.
 * @param {Record<string,string>} [style]
 * @returns {object} opts for candleColorOf
 */
export function candleColorOpts(style) {
  const s = style || {}
  const out = {}
  if (s.neutral_band != null) out.neutralBand = Number(s.neutral_band)
  if (s.bull_above != null) out.bullAbove = Number(s.bull_above)
  if (s.bear_below != null) out.bearBelow = Number(s.bear_below)
  if (s.color_up || s.bull_color) out.bullColor = s.color_up || s.bull_color
  if (s.color_down || s.bear_color) out.bearColor = s.color_down || s.bear_color
  if (s.neutral_color) out.neutralColor = s.neutral_color
  return out
}

/**
 * Parse a `candle_color` layer's PALETTE from its `style` map (the SCMR /
 * SCMR-INV form). A palette names the output that carries a numeric type-id
 * (`style.color_field`) plus `color_{id}` / `label_{id}` entries. The value on
 * the wire is the id (a decimal string), NOT a colour — the colour is looked up
 * here. Returns null when `style` is not a palette (no `color_field`, or no
 * `color_{id}` entries) so the caller can fall back to numeric-threshold mode.
 * NOTHING is hardcoded — the palette is read entirely from `style`, and the
 * caller re-reads it whenever a new view spec / state descriptor arrives.
 *
 * @param {Record<string,string>} [style]
 * @returns {{ colorField:string, labelField:string|null,
 *             colors:Record<string,string>, labels:Record<string,string> }|null}
 */
export function candleColorPalette(style) {
  const s = style || {}
  const colorField = s.color_field
  if (!colorField) return null
  const colors = {}; const labels = {}
  let hasColor = false
  for (const k in s) {
    let m = /^color_(\d+)$/.exec(k)
    if (m) { colors[m[1]] = s[k]; hasColor = true; continue }
    m = /^label_(\d+)$/.exec(k)
    if (m) labels[m[1]] = s[k]
  }
  if (!hasColor) return null
  return { colorField, labelField: s.label_field || null, colors, labels }
}

/**
 * Resolve a palette candle colour from a raw type-id value. The value is a
 * decimal string / number; parse it, TRUNCATE to an integer id, and look up
 * `color_{id}`. A missing / non-finite value (indicator warmup) OR an id with no
 * `color_{id}` entry → null = default/uncoloured. Callers must NOT carry the
 * previous candle's colour for a null result.
 *
 * @param {string|number|null|undefined} value
 * @param {ReturnType<typeof candleColorPalette>} palette
 * @returns {string|null}
 */
export function paletteColorOf(value, palette) {
  if (!palette || value == null || value === '') return null
  const n = Number(value)
  if (!Number.isFinite(n)) return null
  const c = palette.colors[String(Math.trunc(n))]
  return c != null ? c : null
}

/**
 * Parse a `candle_color` layer's BULL/BEAR DETECTION rule from its `style`
 * (the CRUP form: `color_rule == "bull_bear_detection"`). TWO boolean-ish
 * fields drive the colour; everything is read from the style map — no
 * hardcoded field names or colours.
 *
 * @param {Record<string,string>} [style]
 * @returns {{ bullField:string|null, bearField:string|null,
 *             bullColor:string, bearColor:string, bothColor:string }|null}
 */
export function candleColorBullBear(style) {
  const s = style || {}
  if (s.color_rule !== 'bull_bear_detection') return null
  if (!s.bull_field && !s.bear_field) return null
  return {
    bullField: s.bull_field || null,
    bearField: s.bear_field || null,
    bullColor: s.bull_color || s.color_up || CANDLE_COLOR_ENUM.bull,
    bearColor: s.bear_color || s.color_down || CANDLE_COLOR_ENUM.bear,
    bothColor: s.both_color || s.bull_color || CANDLE_COLOR_ENUM.bull,
    // While the rule is ACTIVE, undetected candles paint neutral grey rather
    // than keeping the chart's default green/red — otherwise default-coloured
    // candles read as (false) signals next to the rule's bull/bear paint.
    // Style-overridable; warmup (no data at all) still leaves the default.
    neutralColor: s.neutral_color || CANDLE_COLOR_ENUM.neutral,
  }
}

/**
 * Resolve the bull/bear-detection candle colour. Wire values are STRINGS
 * ("1", "0", "1.0") — parse both sides identically; missing / unparseable
 * counts as no-detection (0). Semantics:
 *   bull>0 && bear>0 → bothColor · bull>0 → bullColor · bear>0 → bearColor
 *   neither (data present) → neutralColor (grey) · both fields MISSING → null
 *   (warmup: leave the candle's default colouring untouched).
 *
 * @param {string|number|null|undefined} bullVal
 * @param {string|number|null|undefined} bearVal
 * @param {ReturnType<typeof candleColorBullBear>} bb
 * @returns {string|null}
 */
export function bullBearColorOf(bullVal, bearVal, bb) {
  if (!bb) return null
  // BOTH fields absent → indicator warmup / no data for this candle: leave the
  // chart's default colouring (null), never guess.
  const missing = (v) => v == null || v === ''
  if (missing(bullVal) && missing(bearVal)) return null
  const num = (v) => { const n = Number(v); return Number.isFinite(n) ? n : 0 }
  const b = num(bullVal)
  const r = num(bearVal)
  if (b > 0 && r > 0) return bb.bothColor
  if (b > 0) return bb.bullColor
  if (r > 0) return bb.bearColor
  // Data present but neither detected → neutral grey (see candleColorBullBear)
  return bb.neutralColor
}

/**
 * Resolve the palette LABEL (tooltip/legend text) for a raw type-id value via
 * `label_{id}`. Names live ONLY in the style map — the row's name output is also
 * a numeric id. Returns null when there's no value / no `label_{id}`.
 *
 * @param {string|number|null|undefined} value
 * @param {ReturnType<typeof candleColorPalette>} palette
 * @returns {string|null}
 */
export function paletteLabelOf(value, palette) {
  if (!palette || value == null || value === '') return null
  const n = Number(value)
  if (!Number.isFinite(n)) return null
  const l = palette.labels[String(Math.trunc(n))]
  return l != null ? l : null
}

/**
 * Per-bar colour for a `signed_slope_histogram` layer (style.color_rule).
 * Picks one of four colours from the value sign and slope direction:
 *   value>=0 & slope>=0 → positive_rising_color
 *   value>=0 & slope<0  → positive_falling_color
 *   value<0  & slope<0  → negative_falling_color
 *   value<0  & slope>=0 → negative_rising_color
 * When `slope` is null/non-finite (no slope field AND no previous bar) → sign-
 * only (positive_rising for >=0, negative_falling for <0). Generic — keyed on
 * the view-layer style, not the indicator name, so any indicator can reuse it.
 *
 * @param {number} value
 * @param {number|null|undefined} slope
 * @param {{positive_rising_color?:string, positive_falling_color?:string,
 *          negative_falling_color?:string, negative_rising_color?:string}} colors
 * @returns {string|null}
 */
export function signedSlopeColor(value, slope, colors = {}) {
  const v = Number(value)
  if (!Number.isFinite(v)) return null
  const pr = colors.positive_rising_color
  const pf = colors.positive_falling_color
  const nf = colors.negative_falling_color
  const nr = colors.negative_rising_color
  const s = slope == null ? NaN : Number(slope)
  if (!Number.isFinite(s)) return (v >= 0 ? pr : nf) || null // sign-only fallback
  if (v >= 0) return (s >= 0 ? pr : pf) || null
  return (s < 0 ? nf : nr) || null
}
