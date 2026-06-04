/**
 * Draw a single candle directly to canvas context
 * @param {CanvasRenderingContext2D} ctx - Canvas context
 * @param {Object} data - Candle data {x, w, o, h, l, c, raw}
 * @param {Object} overlay - Overlay component for color settings
 */
export function drawCandle(ctx: CanvasRenderingContext2D, data: Object, overlay: Object): void;
/**
 * Draw a single volume bar directly to canvas context
 * @param {CanvasRenderingContext2D} ctx - Canvas context
 * @param {Object} data - Volume data {x1, x2, h, green, raw}
 * @param {Object} overlay - Overlay component for color settings
 * @param {number} layoutHeight - Layout height for positioning
 */
export function drawVolbar(ctx: CanvasRenderingContext2D, data: Object, overlay: Object, layoutHeight: number): void;
