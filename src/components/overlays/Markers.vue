<script>
// Point-marker overlay for chart-feed `view.layers` kind=marker.
// Data: [ts, y, label?] — draws a glyph at (t2screen(ts), $2screen(y)) for each
// point with a finite y (null/absent y is skipped, so signal-only outputs render
// only on their bars). Shape/colour/size come from the layer's style hints
// (settings.shape | settings.style.shape, settings.color, settings.markerSize).
import Overlay from '../../mixins/overlay.js'

export default {
    name: 'Markers',
    mixins: [Overlay],
    methods: {
        meta_info() {
            return { author: 'TVJS', version: '1.0.0', desc: 'Point markers (view.layers kind=marker)' }
        },
        draw(ctx) {
            const layout = this.$props.layout
            const data = this.$props.data
            if (!data || !data.length) return
            const r = this.marker_size
            ctx.lineWidth = this.line_width
            ctx.strokeStyle = this.stroke
            ctx.font = this.new_font
            ctx.textAlign = 'center'
            for (let k = 0, n = data.length; k < n; k++) {
                const p = data[k]
                const yv = p[1]
                if (yv == null || !Number.isFinite(Number(yv))) continue
                const x = layout.t2screen(p[0])
                const y = layout.$2screen(Number(yv))
                ctx.fillStyle = this.color
                this.draw_marker(ctx, x, y, r)
                const label = p.length > 2 ? p[2] : null
                if (this.show_label && label != null && label !== '') {
                    ctx.fillStyle = this.label_color
                    ctx.fillText(String(label), x, y - r - 4)
                }
            }
        },
        draw_marker(ctx, x, y, r) {
            ctx.beginPath()
            switch (this.shape) {
                case 'triangle-up':
                    ctx.moveTo(x, y - r); ctx.lineTo(x + r, y + r); ctx.lineTo(x - r, y + r); ctx.closePath()
                    break
                case 'triangle-down':
                    ctx.moveTo(x, y + r); ctx.lineTo(x + r, y - r); ctx.lineTo(x - r, y - r); ctx.closePath()
                    break
                case 'square':
                    ctx.rect(x - r, y - r, r * 2, r * 2)
                    break
                case 'diamond':
                    ctx.moveTo(x, y - r); ctx.lineTo(x + r, y); ctx.lineTo(x, y + r); ctx.lineTo(x - r, y); ctx.closePath()
                    break
                case 'circle':
                default:
                    ctx.arc(x, y, r, 0, Math.PI * 2, true)
            }
            ctx.fill()
            if (this.line_width > 0) ctx.stroke()
        },
        use_for() { return ['Markers'] },
        legend(values) {
            const out = []
            if (values[1] != null && Number.isFinite(Number(values[1]))) {
                out.push({ value: Number(values[1]).toFixed(4), color: this.color })
            }
            if (values.length > 2 && values[2] != null && values[2] !== '') {
                out.push({ value: String(values[2]) })
            }
            return out
        }
    },
    computed: {
        default_font() { return '11px ' + this.$props.font.split('px').pop() },
        color() { return this.sett.color || '#42b3f4' },
        stroke() { return this.sett.markerStroke || this.sett.color || '#1b2331' },
        marker_size() {
            const s = this.sett
            const v = s.markerSize != null ? s.markerSize : (s.style && s.style.marker_size)
            return Number(v) || 5
        },
        line_width() { return this.sett.lineWidth != null ? Number(this.sett.lineWidth) : 1 },
        shape() { return this.sett.shape || (this.sett.style && this.sett.style.shape) || 'circle' },
        show_label() { return this.sett.showLabel !== false },
        label_color() {
            return this.sett.labelColor || (this.$props.colors && this.$props.colors.text) || '#999'
        },
        new_font() { return this.sett.font || this.default_font }
    }
}
</script>
