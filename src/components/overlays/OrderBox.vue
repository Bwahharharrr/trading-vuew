<script>
// OrderBox — a persistent, data-anchored box that holds a distribution of orders.
// Drawn as a green (buy) / red (sell) rectangle anchored to two corner Pins
// (c0/c1 = [t, price]); everything is re-projected from data coords each frame
// via layout.t2screen/$2screen, so it tracks zoom/pan/relayout.
//
// P3: box + corner pins.  P4: order lines + size/qty widgets + eye toggle
// (render only).  P5: per-order drag/delete + eye interaction.  P6: ws status.

import Overlay from '../../mixins/overlay.js'
import Tool from '../../mixins/tool.js'
import Pin from '../primitives/pin.js'

const ROW_H = 18         // handle widget height (px)
const GRAB_W = 20        // grab (≡) zone width
const DEL_W = 18         // delete (✕) zone width
const MIN_MID = 44       // min width for the size label segment
const EYE = 16           // eye icon box size

export default {
    name: 'OrderBox',
    mixins: [Overlay, Tool],
    methods: {
        meta_info() { return { author: 'order-box', version: '0.2.0' } },
        use_for() { return ['OrderBox'] },

        // Overlay is created 'finished', so Pins hydrate from settings.c0/c1.
        init() {
            this.pins.push(new Pin(this, 'c0'))
            this.pins.push(new Pin(this, 'c1'))
        },

        // Screen-space box rect from the two corner data-coords.
        box_rect() {
            const c0 = this.sett.c0, c1 = this.sett.c1
            if (!c0 || !c1) return null
            const L = this.$props.layout
            const x0 = L.t2screen(c0[0]), x1 = L.t2screen(c1[0])
            const y0 = L.$2screen(c0[1]), y1 = L.$2screen(c1[1])
            return {
                xL: Math.min(x0, x1), xR: Math.max(x0, x1),
                yT: Math.min(y0, y1), yB: Math.max(y0, y1)
            }
        },

        // Per-frame geometry used by BOTH draw() and (P5) hit-testing. Returns
        // { eye:{x,y,w,h}, rows:[{id, y, xL, xR, grab, del, size, status}] }.
        // The line + widget are clamped to the box width.
        order_geometry(r) {
            const L = this.$props.layout
            const eye = { x: r.xL + 4, y: r.yT + 4, w: EYE, h: EYE }
            const rows = []
            if (this.visible) {
                for (const o of this.orders) {
                    const y = L.$2screen(o.price)
                    if (y < r.yT - ROW_H || y > r.yB + ROW_H) continue // off-box
                    // Widget centered on the line, clamped inside the box.
                    const want = GRAB_W + MIN_MID + DEL_W
                    const w = Math.min(want, Math.max(GRAB_W + DEL_W + 8, r.xR - r.xL))
                    let wx = (r.xL + r.xR) / 2 - w / 2
                    wx = Math.max(r.xL, Math.min(wx, r.xR - w))
                    rows.push({
                        id: o.id, size: o.size, status: o.status || 'local',
                        y, xL: r.xL, xR: r.xR,
                        widget: { x: wx, y: y - ROW_H / 2, w, h: ROW_H },
                        grab: { x: wx, y: y - ROW_H / 2, w: w - DEL_W, h: ROW_H },
                        del: { x: wx + w - DEL_W, y: y - ROW_H / 2, w: DEL_W, h: ROW_H }
                    })
                }
            }
            return { eye, rows }
        },

        draw(ctx) {
            const r = this.box_rect()
            if (!r) return
            const buy = this.side === 'buy'
            const stroke = buy ? this.color_buy : this.color_sell

            // Box fill + border
            ctx.save()
            ctx.fillStyle = buy ? this.fill_buy : this.fill_sell
            ctx.fillRect(r.xL, r.yT, r.xR - r.xL, r.yB - r.yT)
            ctx.strokeStyle = stroke
            ctx.lineWidth = 1
            ctx.strokeRect(r.xL + 0.5, r.yT + 0.5, r.xR - r.xL - 1, r.yB - r.yT - 1)
            ctx.restore()

            // Order lines + widgets (cache geometry for P5 hit-testing).
            const geom = this.order_geometry(r)
            this._geom = geom
            for (const row of geom.rows) this.draw_order(ctx, row, stroke)

            // Eye toggle chrome (top-left of the box).
            this.draw_eye(ctx, geom.eye, this.visible, stroke)

            this.render_pins(ctx)
        },

        draw_order(ctx, row, color) {
            ctx.save()
            // pending/local dashed+translucent; confirmed solid (P6 sets status)
            const pending = row.status !== 'confirmed'
            ctx.globalAlpha = pending ? 0.55 : 1
            ctx.strokeStyle = color
            ctx.fillStyle = color
            ctx.lineWidth = 1
            // Horizontal line clamped to the box width only.
            ctx.beginPath()
            if (pending) ctx.setLineDash([4, 4])
            ctx.moveTo(row.xL, row.y + 0.5)
            ctx.lineTo(row.xR, row.y + 0.5)
            ctx.stroke()
            ctx.setLineDash([])

            // Widget background
            const wgt = row.widget
            ctx.globalAlpha = 1
            ctx.fillStyle = this.$props.colors.back || '#0b0e16'
            ctx.fillRect(wgt.x, wgt.y, wgt.w, wgt.h)
            ctx.strokeStyle = color
            ctx.strokeRect(wgt.x + 0.5, wgt.y + 0.5, wgt.w - 1, wgt.h - 1)

            // Grab handle (≡)
            ctx.strokeStyle = color
            const gx = row.grab.x, gcy = row.grab.y + row.grab.h / 2
            for (let i = -1; i <= 1; i++) {
                ctx.beginPath()
                ctx.moveTo(gx + 5, gcy + i * 3 + 0.5)
                ctx.lineTo(gx + GRAB_W - 6, gcy + i * 3 + 0.5)
                ctx.stroke()
            }

            // Size label (between grab and delete)
            ctx.fillStyle = this.$props.colors.textHL || '#cfe'
            ctx.font = this.font11
            ctx.textAlign = 'center'
            ctx.textBaseline = 'middle'
            const midX = row.grab.x + GRAB_W + (row.grab.w - GRAB_W) / 2
            ctx.fillText(String(row.size), midX, gcy)

            // Delete (✕)
            const d = row.del
            ctx.strokeStyle = color
            ctx.beginPath()
            ctx.moveTo(d.x + 5, d.y + 5)
            ctx.lineTo(d.x + d.w - 5, d.y + d.h - 5)
            ctx.moveTo(d.x + d.w - 5, d.y + 5)
            ctx.lineTo(d.x + 5, d.y + d.h - 5)
            ctx.stroke()

            ctx.textAlign = 'left'
            ctx.textBaseline = 'alphabetic'
            ctx.restore()
        },

        draw_eye(ctx, e, open, color) {
            ctx.save()
            ctx.strokeStyle = color
            ctx.lineWidth = 1.2
            const cx = e.x + e.w / 2, cy = e.y + e.h / 2
            // eye outline
            ctx.beginPath()
            ctx.moveTo(e.x + 1, cy)
            ctx.quadraticCurveTo(cx, e.y, e.x + e.w - 1, cy)
            ctx.quadraticCurveTo(cx, e.y + e.h, e.x + 1, cy)
            ctx.stroke()
            if (open) {
                ctx.beginPath()
                ctx.arc(cx, cy, 2.2, 0, Math.PI * 2)
                ctx.stroke()
            } else {
                // slash for hidden
                ctx.beginPath()
                ctx.moveTo(e.x + 1, e.y + e.h - 1)
                ctx.lineTo(e.x + e.w - 1, e.y + 1)
                ctx.stroke()
            }
            ctx.restore()
        },

        data_colors() { return [this.side === 'buy' ? this.color_buy : this.color_sell] }
    },
    computed: {
        side() { return this.sett.side === 'sell' ? 'sell' : 'buy' },
        visible() { return this.sett.visible !== false },
        orders() { return Array.isArray(this.sett.orders) ? this.sett.orders : [] },
        color_buy() { return this.sett.colorBuy || '#23a776' },
        color_sell() { return this.sett.colorSell || '#e54150' },
        fill_buy() { return this.sett.fillBuy || 'rgba(35,167,118,0.10)' },
        fill_sell() { return this.sett.fillSell || 'rgba(229,65,80,0.10)' },
        font11() { return '11px ' + (this.$props.font || '').split('px').pop() }
    },
    data() { return { _geom: null } }
}
</script>
