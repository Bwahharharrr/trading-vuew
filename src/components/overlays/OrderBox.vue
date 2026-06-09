<script>
// OrderBox — a persistent, data-anchored box that holds a distribution of orders.
// Green (buy) / red (sell) rectangle anchored to two corner Pins (c0/c1 =
// [t, price]); everything is re-projected from data coords each frame via
// layout.t2screen/$2screen, so it tracks zoom/pan/relayout.
//
// P3 box + pins · P4 order lines/widgets/eye (render) · P5 per-order drag/
// delete + eye toggle + resize-recompute · P6 ws status styling.

import Overlay from '../../mixins/overlay.js'
import Tool from '../../mixins/tool.js'
import Pin from '../primitives/pin.js'
import Utils from '../../stuff/utils.js'
import { distributeOrders } from '../../stuff/order-distribution.js'

const ROW_H = 18         // handle widget height (px)
const GRAB_W = 20        // grab (≡) zone width
const DEL_W = 18         // delete (✕) zone width
const MIN_MID = 44       // min width for the size label segment
const EYE = 16           // eye icon box size

function inRect(r, x, y) {
    return x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h
}

export default {
    name: 'OrderBox',
    mixins: [Overlay, Tool],
    methods: {
        meta_info() { return { author: 'order-box', version: '0.3.0' } },
        use_for() { return ['OrderBox'] },

        // Overlay is created 'finished', so Pins hydrate from settings.c0/c1.
        // Resizing a corner recomputes the distribution (decision: always
        // recompute). Order handlers are registered LAST so they run first
        // (mouse.on unshifts) and can preventDefault to beat the box Pins.
        init() {
            this.pins.push(new Pin(this, 'c0'))
            this.pins.push(new Pin(this, 'c1'))
            this.pins[0].on('settled', () => this.recompute_orders())
            this.pins[1].on('settled', () => this.recompute_orders())

            this._dragOrder = null
            this.mouse.on('mousedown', e => this.on_mousedown(e))
            this.mouse.on('mousemove', () => this.on_mousemove())
            this.mouse.on('mouseup', e => this.on_mouseup(e))
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

        // Per-frame geometry used by BOTH draw() and hit-testing.
        order_geometry(r) {
            const L = this.$props.layout
            const eye = { x: r.xL + 4, y: r.yT + 4, w: EYE, h: EYE }
            const rows = []
            if (this.visible) {
                for (const o of this.orders) {
                    const y = L.$2screen(o.price)
                    if (y < r.yT - ROW_H || y > r.yB + ROW_H) continue
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

            // Box collision (select / move / Delete-key) — order handlers run
            // first and preventDefault on an order hit so they win.
            this.collisions.push((x, y) => inRect(
                { x: r.xL, y: r.yT, w: r.xR - r.xL, h: r.yB - r.yT }, x, y))

            ctx.save()
            ctx.fillStyle = buy ? this.fill_buy : this.fill_sell
            ctx.fillRect(r.xL, r.yT, r.xR - r.xL, r.yB - r.yT)
            ctx.strokeStyle = stroke
            ctx.lineWidth = 1
            ctx.strokeRect(r.xL + 0.5, r.yT + 0.5, r.xR - r.xL - 1, r.yB - r.yT - 1)
            ctx.restore()

            const geom = this.order_geometry(r)
            this._geom = geom
            for (const row of geom.rows) this.draw_order(ctx, row, stroke)
            this.draw_eye(ctx, geom.eye, this.visible, stroke)

            this.render_pins(ctx)
        },

        draw_order(ctx, row, color) {
            ctx.save()
            const pending = row.status !== 'confirmed'
            ctx.globalAlpha = pending ? 0.55 : 1
            ctx.strokeStyle = color
            ctx.lineWidth = 1
            ctx.beginPath()
            if (pending) ctx.setLineDash([4, 4])
            ctx.moveTo(row.xL, row.y + 0.5)
            ctx.lineTo(row.xR, row.y + 0.5)
            ctx.stroke()
            ctx.setLineDash([])

            const wgt = row.widget
            ctx.globalAlpha = 1
            ctx.fillStyle = this.$props.colors.back || '#0b0e16'
            ctx.fillRect(wgt.x, wgt.y, wgt.w, wgt.h)
            ctx.strokeStyle = color
            ctx.strokeRect(wgt.x + 0.5, wgt.y + 0.5, wgt.w - 1, wgt.h - 1)

            const gx = row.grab.x, gcy = row.grab.y + row.grab.h / 2
            for (let i = -1; i <= 1; i++) {
                ctx.beginPath()
                ctx.moveTo(gx + 5, gcy + i * 3 + 0.5)
                ctx.lineTo(gx + GRAB_W - 6, gcy + i * 3 + 0.5)
                ctx.stroke()
            }

            ctx.fillStyle = this.$props.colors.textHL || '#cfe'
            ctx.font = this.font11
            ctx.textAlign = 'center'
            ctx.textBaseline = 'middle'
            const midX = row.grab.x + GRAB_W + (row.grab.w - GRAB_W) / 2
            ctx.fillText(String(row.size), midX, gcy)

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
                ctx.beginPath()
                ctx.moveTo(e.x + 1, e.y + e.h - 1)
                ctx.lineTo(e.x + e.w - 1, e.y + 1)
                ctx.stroke()
            }
            ctx.restore()
        },

        // ── interaction ──────────────────────────────────────────────────────
        on_mousedown(e) {
            if (Utils.default_prevented(e)) return
            const g = this._geom
            if (!g) return
            const mx = this.mouse.x, my = this.mouse.y

            // Eye toggle (top-left of box).
            if (inRect(g.eye, mx, my)) {
                this.custom_event('change-settings', { visible: !this.visible })
                e.preventDefault()
                return
            }
            // Per-order: delete (✕) wins over grab.
            for (const row of g.rows) {
                if (inRect(row.del, mx, my)) {
                    this.delete_order(row.id)
                    e.preventDefault()
                    return
                }
            }
            for (const row of g.rows) {
                if (inRect(row.grab, mx, my)) {
                    this._dragOrder = row.id
                    this.custom_event('scroll-lock', true)
                    e.preventDefault()
                    return
                }
            }
            // else: fall through to box Pins / Tool (select / move / resize).
        },

        on_mousemove() {
            if (this._dragOrder == null) return
            // cursor.y$ is already updated for this move (grid emits
            // cursor-changed before propagating to overlays).
            const price = this.$props.cursor.y$
            if (price == null) return
            this.set_orders(o => o.id === this._dragOrder ? { ...o, price } : o)
        },

        on_mouseup() {
            if (this._dragOrder == null) return
            const o = this.orders.find(x => x.id === this._dragOrder)
            this._dragOrder = null
            this.custom_event('scroll-lock', false)
            if (o) {
                const prec = (this.$props.layout && this.$props.layout.prec) || 2
                /* eslint-disable-next-line no-alert */
                if (typeof alert === 'function') alert(`Order moved to ${Number(o.price).toFixed(prec)}`)
            }
        },

        // Replace orders[] with a NEW array (reactivity) via change-settings.
        set_orders(mapFn) {
            const next = this.orders.map(mapFn)
            this.custom_event('change-settings', { orders: next })
        },

        delete_order(id) {
            // Splice by object identity (NOT id-substring) to avoid ord-1/ord-10
            // collisions; emit a NEW array + force a repaint (no cursor move).
            const next = this.orders.filter(o => o.id !== id)
            this.custom_event('change-settings', { orders: next })
        },

        // Resize → re-derive the distribution from the new box range.
        recompute_orders() {
            const c0 = this.sett.c0, c1 = this.sett.c1
            if (!c0 || !c1) return
            const low = Math.min(c0[1], c1[1])
            const high = Math.max(c0[1], c1[1])
            const fresh = distributeOrders({
                low, high,
                qty: this.sett.qty || this.orders.length || 1,
                size: this.sett.totalSize || 0,
                dist: this.sett.distribution || 'flat'
            }).map(o => ({ ...o, status: 'local' }))
            this.custom_event('change-settings', { orders: fresh })
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
