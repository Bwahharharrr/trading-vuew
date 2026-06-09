
// Volume bar primitive for Candles overlay

export default class VolbarExt {

    constructor(overlay, ctx, data) {
        this.ctx = ctx
        this.$p = overlay.$props
        this.self = overlay
        this.style = data.raw[6] || this.self
        this.draw(data)
    }

    draw(data) {
        let w = data.x2 - data.x1

        const fillStyle = data.green ?
            (this.style.colorVolUp || '#23a77642') :
            (this.style.colorVolDw || '#e5415042')

        this.ctx.fillStyle = fillStyle

        // Detached pane: bar spans from the value (yTop) to the 0-baseline (y0),
        // both already mapped through layout.$2screen — so a Y-axis drag (which
        // changes the transform) rescales the bar height.
        if (data.yTop != null && data.y0 != null) {
            let top = Math.min(data.yTop, data.y0)
            let h = Math.max(1, Math.abs(data.y0 - data.yTop))
            this.ctx.fillRect(
                Math.floor(data.x1),
                Math.floor(top),
                Math.floor(w),
                Math.floor(h)
            )
            return
        }

        // Candle pane (golden path): glued to the bottom of the layout.
        let y0 = this.$p.layout.height
        let h = Math.floor(data.h)
        this.ctx.fillRect(
            Math.floor(data.x1),
            Math.floor(y0 - h - 0.5),
            Math.floor(w),
            Math.floor(h + 1)
        )
    }

}
