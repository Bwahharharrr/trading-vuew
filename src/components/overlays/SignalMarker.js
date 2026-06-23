import Overlay from '../../mixins/overlay.js'

// SignalMarker — a vertical "signal" rule for a search-result match. Draws a
// vertical line at the match timestamp from the grid's x-axis (bottom) up to the
// bottom of the candle (its low), marking exactly where the signal fired without
// covering the candle body. Optional caret + label sit just under the low.
//
// Data rows: [ts, low, label?]
//   ts    — signal candle timestamp (ms)
//   low   — candle low (decimal string or number); the line stops here. When
//           absent/non-finite the line runs the full grid height (still marks
//           the bar's x position).
//   label — optional text drawn beneath the low.
export default {
    name: 'SignalMarker',
    mixins: [Overlay],
    methods: {
        meta_info() {
            return { author: 'TVJS', version: '1.0.0', desc: 'Vertical signal marker (search match)' }
        },
        draw(ctx) {
            const layout = this.$props.layout
            const data = this.$props.data
            if (!data || !data.length) return
            const bottom = layout.height            // grid bottom = x-axis (y grows down)

            for (let k = 0, n = data.length; k < n; k++) {
                const p = data[k]
                if (!p || p[0] == null) continue
                const x = layout.t2screen(p[0])
                const lowVal = p[1]
                // Top of the line: the candle low (its bottom). Leave a 2px gap so
                // the line stops just under the wick. Full height when low unknown.
                const hasLow = lowVal != null && Number.isFinite(Number(lowVal))
                const top = hasLow ? layout.$2screen(Number(lowVal)) + 2 : 0

                // Soft translucent band behind a crisp centre line, so the marker
                // reads at a glance but never hides the candle.
                if (this.glow_width > 0) {
                    ctx.fillStyle = this.band_color
                    ctx.fillRect(x - this.glow_width / 2, top, this.glow_width, bottom - top)
                }
                ctx.beginPath()
                ctx.moveTo(x, bottom)
                ctx.lineTo(x, top)
                ctx.lineWidth = this.line_width
                ctx.strokeStyle = this.color
                if (this.dashed) ctx.setLineDash([5, 4])
                ctx.stroke()
                if (this.dashed) ctx.setLineDash([])

                // Caret + label under the candle, pointing up at the signal bar.
                if (hasLow) {
                    const cy = layout.$2screen(Number(lowVal)) + 6
                    ctx.beginPath()
                    ctx.moveTo(x, cy)
                    ctx.lineTo(x - 4, cy + 6)
                    ctx.lineTo(x + 4, cy + 6)
                    ctx.closePath()
                    ctx.fillStyle = this.color
                    ctx.fill()
                    const label = p.length > 2 ? p[2] : null
                    if (this.show_label && label != null && label !== '') {
                        ctx.fillStyle = this.color
                        ctx.font = this.new_font
                        ctx.textAlign = 'center'
                        ctx.textBaseline = 'top'
                        ctx.fillText(String(label), x, cy + 9)
                        ctx.textBaseline = 'alphabetic'
                    }
                }
            }
        },
        use_for() { return ['SignalMarker'] },
        // No legend row — the marker is self-explanatory on the chart.
        legend() { return [] },
    },
    computed: {
        color() { return this.sett.color || '#f5c518' },
        band_color() { return this.sett.bandColor || 'rgba(245, 197, 24, 0.10)' },
        line_width() { return this.sett.lineWidth != null ? Number(this.sett.lineWidth) : 1.5 },
        glow_width() { return this.sett.glowWidth != null ? Number(this.sett.glowWidth) : 7 },
        dashed() { return this.sett.dashed === true },
        show_label() { return this.sett.showLabel !== false },
        new_font() {
            return this.sett.font || ('10px ' + this.$props.font.split('px').pop())
        },
    },
}
