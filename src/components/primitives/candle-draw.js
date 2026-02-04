// PERFORMANCE: Static draw functions for candles and volume bars
// These replace object instantiation (new Candle/new Volbar) to eliminate GC pressure
// Creating objects per candle per frame was causing massive memory churn

/**
 * Draw a single candle directly to canvas context
 * @param {CanvasRenderingContext2D} ctx - Canvas context
 * @param {Object} data - Candle data {x, w, o, h, l, c, raw}
 * @param {Object} overlay - Overlay component for color settings
 */
export function drawCandle(ctx, data, overlay) {
    const style = data.raw[6] || overlay
    const green = data.raw[4] >= data.raw[1]

    const body_color = data.raw[6] || (green ?
        (style.colorCandleUp || '#23a776') :
        (style.colorCandleDw || '#e54150'))
    const wick_color = green ?
        (style.colorWickUp || '#23a776') :
        (style.colorWickDw || '#e54150')

    let w = Math.max(data.w, 1)
    let hw = Math.max(Math.floor(w * 0.5), 1)
    let h = Math.abs(data.o - data.c)
    let max_h = data.c === data.o ? 1 : 2
    let x05 = Math.floor(data.x) - 0.5

    // Draw wick
    ctx.strokeStyle = wick_color
    ctx.beginPath()
    ctx.moveTo(x05, Math.floor(data.h))
    ctx.lineTo(x05, Math.floor(data.l))
    ctx.stroke()

    // Draw body
    if (data.w > 1.5) {
        ctx.fillStyle = body_color
        let s = green ? 1 : -1
        ctx.fillRect(
            Math.floor(data.x - hw - 1),
            data.c,
            Math.floor(hw * 2 + 1),
            s * Math.max(h, max_h),
        )
    } else {
        ctx.strokeStyle = body_color
        ctx.beginPath()
        ctx.moveTo(
            x05,
            Math.floor(Math.min(data.o, data.c)),
        )
        ctx.lineTo(
            x05,
            Math.floor(Math.max(data.o, data.c)) +
                (data.o === data.c ? 1 : 0)
        )
        ctx.stroke()
    }

    // Draw optional text labels (value1 below, value2 above)
    const value1 = data.raw[7]
    const value2 = data.raw[8]

    if ((value1 && value1 !== '') || (value2 && value2 !== '')) {
        const fontSize = Math.max(Math.min(Math.floor(data.w * 0.8), 14), 8)
        ctx.font = `${fontSize}px sans-serif`
        ctx.textAlign = 'center'

        if (value1 && value1 !== '') {
            ctx.fillStyle = '#00FF00'
            ctx.textBaseline = 'top'
            ctx.fillText(value1, Math.floor(data.x), Math.floor(data.l) + 3)
        }

        if (value2 && value2 !== '') {
            ctx.fillStyle = '#FF0000'
            ctx.textBaseline = 'bottom'
            ctx.fillText(value2, Math.floor(data.x), Math.floor(data.h) - 3)
        }
    }
}

/**
 * Draw a single volume bar directly to canvas context
 * @param {CanvasRenderingContext2D} ctx - Canvas context
 * @param {Object} data - Volume data {x1, x2, h, green, raw}
 * @param {Object} overlay - Overlay component for color settings
 * @param {number} layoutHeight - Layout height for positioning
 */
export function drawVolbar(ctx, data, overlay, layoutHeight) {
    const style = data.raw[6] || overlay
    let y0 = layoutHeight
    let w = data.x2 - data.x1
    let h = Math.floor(data.h)

    const fillStyle = data.green ?
        (style.colorVolUp || '#23a77642') :
        (style.colorVolDw || '#e5415042')

    ctx.fillStyle = fillStyle
    ctx.fillRect(
        Math.floor(data.x1),
        Math.floor(y0 - h - 0.5),
        Math.floor(w),
        Math.floor(h + 1)
    )
}
