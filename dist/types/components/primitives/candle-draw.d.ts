/**
 * Draw a single candle directly to canvas context
 * @param {CanvasRenderingContext2D} ctx - Canvas context
 * @param {Object} data - Candle data {x, w, o, h, l, c, raw}
 * @param {Object} overlay - Overlay component for color settings
 */
export function drawCandle(ctx: CanvasRenderingContext2D, data: Object, overlay: Object): void;
/**
 * Draw a whole array of candles, COLOR-BATCHED.
 *
 * PERFORMANCE: `drawCandle` issues a per-candle beginPath+stroke (wick) and a
 * fillStyle+fillRect (body) — one state-set + one path per candle. This groups
 * candles by their RESOLVED colour and emits one state-set + one path per
 * colour, mirroring the grid-line batch in render-engine.js:66-79.
 *
 * Passes, in order:
 *   1. all wicks, grouped by wick colour (one beginPath/stroke per colour)
 *   2. all wide bodies, grouped by body colour (one fillStyle per colour)
 *   2b. all narrow/doji bodies (1px strokes), grouped by body colour
 *   3. all value1/value2 labels LAST so they stay on top of every body
 *
 * PIXEL EQUIVALENCE (passes 1-2b) is bit-for-bit vs looping `drawCandle` only
 * while adjacent different-colour bodies never share a pixel column — true for
 * CANDLEW < 1.0 (bodies gap: 2*floor(CANDLEW*px_step/2) < px_step; the app
 * ships CANDLEW=0.9). At CANDLEW >= 1.0 bodies abut/overlap and cross-colour
 * z-order at a shared column can differ from the per-candle order. Verified by
 * the byte-identical visual golden (tasks/render-perf-constraints.md).
 *
 * LABELS (pass 3) are a DELIBERATE z-order change, NOT pixel-identical: each
 * candle's value labels now render above EVERY neighbour's body, whereas the
 * per-candle loop let a later candle's body occlude an earlier candle's
 * overflowing label. This improves label readability; the visual golden carries
 * no labelled data, so the on-top order is pinned by a unit test instead.
 *
 * Body and wick colours are INDEPENDENT groupings; raw[6] overrides the body
 * only (string raw[6] ⇒ wick falls back to the hardcoded up/down hex). This is
 * the exact colour resolution `drawCandle` performs — preserved bit-for-bit.
 *
 * @param {CanvasRenderingContext2D} ctx - Canvas context
 * @param {Array<Object>} candles - Candle data {x, w, o, h, l, c, raw}[]
 * @param {Object} overlay - Overlay component for color settings
 */
export function drawCandles(ctx: CanvasRenderingContext2D, candles: Array<Object>, overlay: Object): void;
/**
 * Draw a single volume bar directly to canvas context
 * @param {CanvasRenderingContext2D} ctx - Canvas context
 * @param {Object} data - Volume data {x1, x2, h, green, raw}
 * @param {Object} overlay - Overlay component for color settings
 * @param {number} layoutHeight - Layout height for positioning
 */
export function drawVolbar(ctx: CanvasRenderingContext2D, data: Object, overlay: Object, layoutHeight: number): void;
/**
 * Draw a whole array of volume bars, COLOR-BATCHED.
 *
 * Same idea as `drawCandles`: group bars by resolved fill colour and emit one
 * `fillStyle` per colour instead of one per bar. `fillRect` is path-independent,
 * so coalescing same-colour rects is trivially pixel-identical (only the count
 * of `fillStyle` assignments drops). The per-bar geometry matches `drawVolbar`
 * (candle-pane / glued-to-bottom path) bit-for-bit.
 *
 * @param {CanvasRenderingContext2D} ctx - Canvas context
 * @param {Array<Object>} vols - Volume data {x1, x2, h, green, raw}[]
 * @param {Object} overlay - Overlay component for color settings
 * @param {number} layoutHeight - Layout height for positioning
 */
export function drawVolbars(ctx: CanvasRenderingContext2D, vols: Array<Object>, overlay: Object, layoutHeight: number): void;
