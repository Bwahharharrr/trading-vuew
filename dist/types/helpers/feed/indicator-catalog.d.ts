/**
 * Resolve placement + overlay type for an indicator kind.
 *
 * @param {string} kind - indicator kind, e.g. `'sma'`, `'rsi'`, `'macd'`.
 * @returns {{ pane: 'onchart'|'offchart', overlayType: string }}
 */
export function indicatorPlacement(kind: string): {
    pane: "onchart" | "offchart";
    overlayType: string;
};
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
export function layerKindToOverlay(kind: string, fieldCount?: number): string | null;
/**
 * Translate protocol `style` hints (free-form string map) into trading-vue
 * overlay settings. Unknown keys pass through under `settings.style` for
 * forward-compat.
 * @param {Record<string,string>} [style]
 * @returns {object} settings fragment
 */
export function styleToSettings(style?: Record<string, string>): object;
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
export function candleColorOf(value: string | number | null, opts?: {
    bullAbove?: number;
    bearBelow?: number;
    neutralBand?: number;
    bullColor?: string;
    bearColor?: string;
    neutralColor?: string;
}): string | null;
/**
 * Build numeric candle-colour thresholds/colours from a layer's `style` hints.
 * Recognised keys: `bull_above`, `bear_below`, `neutral_band` (thresholds, field
 * units) and `color_up`/`bull_color`, `color_down`/`bear_color`, `neutral_color`.
 * @param {Record<string,string>} [style]
 * @returns {object} opts for candleColorOf
 */
export function candleColorOpts(style?: Record<string, string>): object;
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
export function candleColorPalette(style?: Record<string, string>): {
    colorField: string;
    labelField: string | null;
    colors: Record<string, string>;
    labels: Record<string, string>;
} | null;
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
export function paletteColorOf(value: string | number | null | undefined, palette: ReturnType<typeof candleColorPalette>): string | null;
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
export function candleColorBullBear(style?: Record<string, string>): {
    bullField: string | null;
    bearField: string | null;
    bullColor: string;
    bearColor: string;
    bothColor: string;
} | null;
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
export function bullBearColorOf(bullVal: string | number | null | undefined, bearVal: string | number | null | undefined, bb: ReturnType<typeof candleColorBullBear>): string | null;
/** Detection-flag truthiness per protocol: numeric value >= 0.5 is SET. */
export function detectionSet(v: any): boolean;
/** `#RRGGBB` (or `#RGB`) + alpha 0..1 → `rgba(r,g,b,a)`. Pass-through else. */
export function hexToRgba(hex: any, alpha: any): any;
/**
 * Parse a `box` layer's DETECTION-ZONE rule from its style
 * (box_rule == "detection_zone_until_close_breaks", the CRUP form).
 * One box per detection candle: span = that candle's low..high, left edge =
 * that candle's CLOSE time; a bull box dies when a later candle CLOSES
 * strictly below its bottom, a bear box on a close strictly above its top.
 * Everything style-driven; field names fall back to the protocol convention.
 *
 * Server-truth companion fields (per side): `{side}_box_count` (boxes covering
 * the bar) and `{side}_box_top` / `{side}_box_bottom` (envelope; 0-count ⇒ no
 * boxes, not a price level) — used for seed boxes when history starts inside
 * a box whose anchor is left of the loaded window.
 *
 * @param {Record<string,string>} [style]
 * @returns {object|null}
 */
export function detectionBoxRule(style?: Record<string, string>): object | null;
/**
 * Resolve the palette LABEL (tooltip/legend text) for a raw type-id value via
 * `label_{id}`. Names live ONLY in the style map — the row's name output is also
 * a numeric id. Returns null when there's no value / no `label_{id}`.
 *
 * @param {string|number|null|undefined} value
 * @param {ReturnType<typeof candleColorPalette>} palette
 * @returns {string|null}
 */
export function paletteLabelOf(value: string | number | null | undefined, palette: ReturnType<typeof candleColorPalette>): string | null;
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
export function signedSlopeColor(value: number, slope: number | null | undefined, colors?: {
    positive_rising_color?: string;
    positive_falling_color?: string;
    negative_falling_color?: string;
    negative_rising_color?: string;
}): string | null;
/**
 * Parse a `marker` layer's SYMBOL rule from its `style` (the SCMR reversal form,
 * `style.marker_rule`). The wire carries a numeric type-id in `value_field`; the
 * glyph / colour / placement for each id live ENTIRELY in the style map as
 * `symbol_{id}` / `color_{id}` / `placement_{id}`, scanned dynamically. Anchors
 * (`above_anchor`/`below_anchor`, default candle_high/candle_low) say which candle
 * price a marker sits at. NOTHING is hardcoded — the SCMR / SCMR(INV) tables are
 * server DEFAULTS; this obeys whatever the descriptor sends. Returns null when
 * `style` is not a marker rule (no `marker_rule`, `value_field`, or `symbol_{id}`).
 *
 * @param {Record<string,string>} [style]
 * @returns {{ rule:string, valueField:string, labelField:string|null,
 *   zeroValue:string, hideZero:boolean, aboveAnchor:string, belowAnchor:string,
 *   symbols:Record<string,string>, colors:Record<string,string>,
 *   placements:Record<string,string> }|null}
 */
export function markerSymbolRule(style?: Record<string, string>): {
    rule: string;
    valueField: string;
    labelField: string | null;
    zeroValue: string;
    hideZero: boolean;
    aboveAnchor: string;
    belowAnchor: string;
    symbols: Record<string, string>;
    colors: Record<string, string>;
    placements: Record<string, string>;
} | null;
/**
 * Resolve the marker for a raw type-id value under a {@link markerSymbolRule}.
 * Returns null (draw nothing) when the value is the zero value (and `hideZero`),
 * empty, missing, non-numeric, or has no `symbol_{id}` entry. Otherwise
 * `{ id, glyph, color, placement }` straight from the descriptor — the id is the
 * value TRUNCATED to an integer (matching paletteColorOf).
 *
 * @param {string|number|null|undefined} value
 * @param {ReturnType<typeof markerSymbolRule>} rule
 * @returns {{ id:string, glyph:string, color:string|null, placement:string }|null}
 */
export function markerSymbolOf(value: string | number | null | undefined, rule: ReturnType<typeof markerSymbolRule>): {
    id: string;
    glyph: string;
    color: string | null;
    placement: string;
} | null;
export namespace onchartKinds {
    export { LINE as sma };
    export { LINE as ema };
    export { LINE as wma };
    export { LINE as vwap };
    export { LINE as hma };
    export let bbands: string;
    export { LINE as dema };
    export { LINE as tema };
    export let kc: string;
    export { LINE as supertrend };
}
export namespace offchartKinds {
    export { LINE as rsi };
    export let macd: string;
    export let stoch: string;
    export { LINE as atr };
    export { LINE as adx };
    export { LINE as cci };
    export { LINE as mfi };
    export { LINE as obv };
    export let volume: string;
}
declare const LINE: "Spline";
export {};
