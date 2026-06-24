import Overlay from '../../mixins/overlay.js'

// BarrierPlan — draws a Barrier Symmetric target plan for a clicked search match:
// horizontal take/stop/entry levels spanning from the match candle forward to the
// plan's expiry, a shaded take↔stop channel, an expiry vertical, and the matured
// outcome (or "pending") label. All levels come pre-extracted as NUMBERS in
// settings.plan (App converts the decimal strings); the overlay just draws.
//
// settings.plan: { entryTs, expiryTs, entry, take_up, stop_up, take_dn, stop_dn,
//                  outcome, pending } — any price may be null (then it's skipped).
export default {
    name: 'BarrierPlan',
    mixins: [Overlay],
    methods: {
        meta_info() {
            return { author: 'TVJS', version: '1.0.0', desc: 'Barrier Symmetric target plan (search match)' }
        },
        draw(ctx) {
            const layout = this.$props.layout
            const data = this.$props.data
            if (!data || !data.length) return
            const p = this.sett.plan
            if (!p || p.entry == null) return

            const x0 = layout.t2screen(p.entryTs)
            const x1 = p.expiryTs != null
                ? Math.max(x0 + 4, layout.t2screen(p.expiryTs))
                : layout.width
            // Symmetric: the upper barrier is the bull-take / bear-stop, the lower
            // is the bull-stop / bear-take. Fall back across the mirrored fields.
            const upper = p.take_up != null ? p.take_up : p.stop_dn
            const lower = p.stop_up != null ? p.stop_up : p.take_dn

            // Shaded take↔stop channel.
            if (upper != null && lower != null) {
                const yU = layout.$2screen(upper)
                const yL = layout.$2screen(lower)
                ctx.fillStyle = 'rgba(245,197,24,0.05)'
                ctx.fillRect(x0, yU, x1 - x0, yL - yU)
            }

            this._level(ctx, layout, x0, x1, upper, this.up_color, [], 'take ↑')
            this._level(ctx, layout, x0, x1, lower, this.dn_color, [], 'stop ↑')
            this._level(ctx, layout, x0, x1, p.entry, this.entry_color, [3, 3], 'entry')

            // Expiry vertical.
            if (p.expiryTs != null) {
                ctx.beginPath()
                ctx.setLineDash([3, 3])
                ctx.moveTo(x1, 0)
                ctx.lineTo(x1, layout.height)
                ctx.strokeStyle = this.entry_color
                ctx.lineWidth = 1
                ctx.stroke()
                ctx.setLineDash([])
            }

            // Outcome / pending label just above the entry, at the match.
            if (p.outcome) {
                ctx.fillStyle = p.pending ? '#808a9d'
                    : (p.outcome.indexOf('bull') === 0 ? this.up_color
                        : p.outcome.indexOf('bear') === 0 ? this.dn_color : '#808a9d')
                ctx.font = this.font_px
                ctx.textAlign = 'left'
                ctx.textBaseline = 'bottom'
                ctx.fillText(p.outcome, x0 + 4, layout.$2screen(p.entry) - 4)
            }
        },
        _level(ctx, layout, x0, x1, price, color, dash, label) {
            if (price == null || !Number.isFinite(Number(price))) return
            const y = layout.$2screen(Number(price))
            ctx.beginPath()
            ctx.setLineDash(dash)
            ctx.moveTo(x0, y)
            ctx.lineTo(x1, y)
            ctx.strokeStyle = color
            ctx.lineWidth = 1.3
            ctx.stroke()
            ctx.setLineDash([])
            if (label) {
                ctx.fillStyle = color
                ctx.font = this.font_px
                ctx.textAlign = 'left'
                ctx.textBaseline = 'middle'
                ctx.fillText(label, Math.min(x1 + 4, layout.width - 44), y)
            }
        },
        use_for() { return ['BarrierPlan'] },
        legend() { return [] },
    },
    computed: {
        up_color() { return this.sett.upColor || '#23a776' },
        dn_color() { return this.sett.dnColor || '#e54150' },
        entry_color() { return this.sett.entryColor || '#9aa3b2' },
        font_px() { return this.sett.font || ('10px ' + this.$props.font.split('px').pop()) },
    },
}
