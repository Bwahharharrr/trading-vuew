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
    const raw = data.raw
    const style = raw[6] || overlay
    const green = raw[4] >= raw[1]

    const body_color = raw[6] || (green ?
        (style.colorCandleUp || '#23a776') :
        (style.colorCandleDw || '#e54150'))
    const wick_color = green ?
        (style.colorWickUp || '#23a776') :
        (style.colorWickDw || '#e54150')

    // PERF: Pre-calculate all Math.floor values once
    const w = Math.max(data.w, 1)
    const hw = Math.max(Math.floor(w * 0.5), 1)
    const h = Math.abs(data.o - data.c)
    const max_h = data.c === data.o ? 1 : 2
    const xFloor = Math.floor(data.x)
    const x05 = xFloor - 0.5
    const hFloor = Math.floor(data.h)
    const lFloor = Math.floor(data.l)

    // Draw wick
    ctx.strokeStyle = wick_color
    ctx.beginPath()
    ctx.moveTo(x05, hFloor)
    ctx.lineTo(x05, lFloor)
    ctx.stroke()

    // Draw body
    if (data.w > 1.5) {
        ctx.fillStyle = body_color
        const s = green ? 1 : -1
        ctx.fillRect(
            xFloor - hw - 1,
            data.c,
            hw * 2 + 1,
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
    const value1 = raw[7]
    const value2 = raw[8]

    if ((value1 && value1 !== '') || (value2 && value2 !== '')) {
        const fontSize = Math.max(Math.min(Math.floor(data.w * 0.8), 14), 8)
        ctx.font = `${fontSize}px sans-serif`
        ctx.textAlign = 'center'

        if (value1 && value1 !== '') {
            ctx.fillStyle = '#00FF00'
            ctx.textBaseline = 'top'
            ctx.fillText(value1, xFloor, lFloor + 3)
        }

        if (value2 && value2 !== '') {
            ctx.fillStyle = '#FF0000'
            ctx.textBaseline = 'bottom'
            ctx.fillText(value2, xFloor, hFloor - 3)
        }
    }
}

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
export function drawCandles(ctx, candles, overlay) {
    const n = candles.length
    if (!n) return

    // Resolve colours + geometry ONCE per candle, bucketed by colour.
    const wickGroups = new Map()   // wick colour -> [x05, hFloor, lFloor, ...]
    const fillGroups = new Map()   // body colour -> [x, y, w, h, ...] (wide)
    const lineGroups = new Map()   // body colour -> [x05, y0, y1, ...] (narrow)
    let labels = null              // candles carrying a label, in index order

    for (let i = 0; i < n; i++) {
        const data = candles[i]
        const raw = data.raw
        const style = raw[6] || overlay
        const green = raw[4] >= raw[1]

        const body_color = raw[6] || (green ?
            (style.colorCandleUp || '#23a776') :
            (style.colorCandleDw || '#e54150'))
        const wick_color = green ?
            (style.colorWickUp || '#23a776') :
            (style.colorWickDw || '#e54150')

        const w = Math.max(data.w, 1)
        const hw = Math.max(Math.floor(w * 0.5), 1)
        const xFloor = Math.floor(data.x)
        const x05 = xFloor - 0.5
        const hFloor = Math.floor(data.h)
        const lFloor = Math.floor(data.l)

        // Wick (same geometry as drawCandle)
        let wg = wickGroups.get(wick_color)
        if (wg === undefined) { wg = []; wickGroups.set(wick_color, wg) }
        wg.push(x05, hFloor, lFloor)

        // Body
        if (data.w > 1.5) {
            const h = Math.abs(data.o - data.c)
            const max_h = data.c === data.o ? 1 : 2
            const s = green ? 1 : -1
            let fg = fillGroups.get(body_color)
            if (fg === undefined) { fg = []; fillGroups.set(body_color, fg) }
            fg.push(xFloor - hw - 1, data.c, hw * 2 + 1, s * Math.max(h, max_h))
        } else {
            const y0 = Math.floor(Math.min(data.o, data.c))
            const y1 = Math.floor(Math.max(data.o, data.c)) +
                (data.o === data.c ? 1 : 0)
            let lg = lineGroups.get(body_color)
            if (lg === undefined) { lg = []; lineGroups.set(body_color, lg) }
            lg.push(x05, y0, y1)
        }

        // Labels: collect, draw last in index order — renders ABOVE all bodies
        // (a deliberate change from drawCandle's per-candle interleave; see header)
        const value1 = raw[7]
        const value2 = raw[8]
        if ((value1 && value1 !== '') || (value2 && value2 !== '')) {
            if (labels === null) labels = []
            labels.push(data)
        }
    }

    // Pass 1: wicks — one beginPath/stroke per wick colour
    for (const [color, pts] of wickGroups) {
        ctx.strokeStyle = color
        ctx.beginPath()
        for (let i = 0, m = pts.length; i < m; i += 3) {
            ctx.moveTo(pts[i], pts[i + 1])
            ctx.lineTo(pts[i], pts[i + 2])
        }
        ctx.stroke()
    }

    // Pass 2: wide bodies — one fillStyle per body colour, batched fillRects
    for (const [color, rects] of fillGroups) {
        ctx.fillStyle = color
        for (let i = 0, m = rects.length; i < m; i += 4) {
            ctx.fillRect(rects[i], rects[i + 1], rects[i + 2], rects[i + 3])
        }
    }

    // Pass 2b: narrow/doji bodies — one beginPath/stroke per body colour
    for (const [color, pts] of lineGroups) {
        ctx.strokeStyle = color
        ctx.beginPath()
        for (let i = 0, m = pts.length; i < m; i += 3) {
            ctx.moveTo(pts[i], pts[i + 1])
            ctx.lineTo(pts[i], pts[i + 2])
        }
        ctx.stroke()
    }

    // Pass 3: value labels LAST (on top of every body), in original order
    if (labels !== null) {
        ctx.textAlign = 'center'
        for (let i = 0, m = labels.length; i < m; i++) {
            const data = labels[i]
            const raw = data.raw
            const xFloor = Math.floor(data.x)
            const hFloor = Math.floor(data.h)
            const lFloor = Math.floor(data.l)
            const fontSize = Math.max(Math.min(Math.floor(data.w * 0.8), 14), 8)
            ctx.font = `${fontSize}px sans-serif`

            const value1 = raw[7]
            const value2 = raw[8]
            if (value1 && value1 !== '') {
                ctx.fillStyle = '#00FF00'
                ctx.textBaseline = 'top'
                ctx.fillText(value1, xFloor, lFloor + 3)
            }
            if (value2 && value2 !== '') {
                ctx.fillStyle = '#FF0000'
                ctx.textBaseline = 'bottom'
                ctx.fillText(value2, xFloor, hFloor - 3)
            }
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
    const h = Math.floor(data.h)

    ctx.fillStyle = data.green ?
        (style.colorVolUp || '#23a77642') :
        (style.colorVolDw || '#e5415042')

    // PERF: Pre-calculate positions once
    ctx.fillRect(
        Math.floor(data.x1),
        Math.floor(layoutHeight - h - 0.5),
        Math.floor(data.x2 - data.x1),
        h + 1
    )
}

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
export function drawVolbars(ctx, vols, overlay, layoutHeight) {
    const n = vols.length
    if (!n) return

    const groups = new Map()   // fill colour -> [x, y, w, h, ...]
    for (let i = 0; i < n; i++) {
        const data = vols[i]
        const style = data.raw[6] || overlay
        const color = data.green ?
            (style.colorVolUp || '#23a77642') :
            (style.colorVolDw || '#e5415042')
        const h = Math.floor(data.h)
        let g = groups.get(color)
        if (g === undefined) { g = []; groups.set(color, g) }
        g.push(
            Math.floor(data.x1),
            Math.floor(layoutHeight - h - 0.5),
            Math.floor(data.x2 - data.x1),
            h + 1
        )
    }

    for (const [color, rects] of groups) {
        ctx.fillStyle = color
        for (let i = 0, m = rects.length; i < m; i += 4) {
            ctx.fillRect(rects[i], rects[i + 1], rects[i + 2], rects[i + 3])
        }
    }
}
