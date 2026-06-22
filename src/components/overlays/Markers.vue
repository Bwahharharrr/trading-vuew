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
            // Per-point SYMBOL rule (e.g. SCMR reversal markers): each row carries
            // its own glyph + colour + above/below placement — drawn as a text
            // glyph anchored to the candle's high/low. Plain markers fall through
            // to the single-shape path below.
            if (this.marker_rule) { this.draw_symbol_markers(ctx, layout, data, r); return }
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
        // Per-point glyph markers. Row: [ts, y, label, glyph, color, dir] where
        // `y` is the OWNING candle's anchor price (high for above, low for below),
        // `glyph` is drawn as a literal text character in its own `color`, and
        // `dir` ('above'|'below') offsets it clear of the candle. label (col 2)
        // renders further out when showLabel.
        draw_symbol_markers(ctx, layout, data, r) {
            ctx.font = this.glyph_font
            ctx.textAlign = 'center'
            const gap = r + 2
            for (let k = 0, n = data.length; k < n; k++) {
                const p = data[k]
                const yv = p[1]
                const glyph = p.length > 3 ? p[3] : null
                if (yv == null || !Number.isFinite(Number(yv)) || glyph == null || glyph === '') continue
                const above = p[5] !== 'below'
                const x = layout.t2screen(p[0])
                const y0 = layout.$2screen(Number(yv))
                ctx.fillStyle = (p.length > 4 && p[4]) ? p[4] : this.color
                ctx.textBaseline = above ? 'bottom' : 'top'
                const gy = above ? y0 - gap : y0 + gap
                ctx.fillText(String(glyph), x, gy)
                // The glyph IS the marker; the descriptor's label (reversal name/id)
                // is for the legend, NOT stamped on every candle — drawing it next
                // to each glyph just clutters (e.g. an "o" with a "1" beside it).
                // Opt in per layer via style.show_label='true' (or settings.showLabel).
                const label = p.length > 2 ? p[2] : null
                if (this.marker_show_label && label != null && label !== '') {
                    ctx.fillStyle = this.label_color
                    ctx.textBaseline = above ? 'bottom' : 'top'
                    ctx.fillText(String(label), x, above ? gy - r - 2 : gy + r + 2)
                }
            }
            ctx.textBaseline = 'alphabetic' // restore default for sibling overlays
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
        // Active when the layer carries a per-point symbol rule (e.g. SCMR).
        marker_rule() { return this.sett.corkyMarkerRule || null },
        // Glyph font scaled to the marker size so single chars (o/x/z) read clearly.
        glyph_font() {
            const px = Math.max(10, Math.round(this.marker_size * 2))
            return `${px}px ` + this.$props.font.split('px').pop()
        },
        show_label() { return this.sett.showLabel !== false },
        // Per-point marker labels are OFF by default (glyph-only); opt in with the
        // descriptor's style.show_label='true' or an explicit settings.showLabel.
        marker_show_label() {
            const s = this.sett
            return s.showLabel === true || !!(s.style && s.style.show_label === 'true')
        },
        label_color() {
            return this.sett.labelColor || (this.$props.colors && this.$props.colors.text) || '#999'
        },
        new_font() { return this.sett.font || this.default_font }
    }
}
</script>
