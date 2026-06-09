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
const HND = 8            // half resize-handle grab size (px)
const BTN_H = 16         // status button height
const BTN_PADX = 8       // status button horizontal padding
const AVG_COLOR = '#e0b030' // average-price line / label colour (distinct gold)

function inRect(r, x, y) {
    return x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h
}

function fmtNum(v) { return Number((Number(v) || 0).toFixed(4)) }

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
            this._dragResize = null
            this._moveDy = 0       // live price offset while the box body is dragged
            this._moving = false
            this.mouse.on('mousedown', e => this.on_mousedown(e))
            this.mouse.on('mousemove', () => this.on_mousemove())
            this.mouse.on('mouseup', e => this.on_mouseup(e))
        },

        // Live corner coords: prefer the Pin's OWN state (set synchronously by
        // Tool.drag_update / resize during a drag) over settings.c0/c1, which
        // only refresh after an async re-render — otherwise the box lags the
        // corner dots ("dots move, box doesn't"). Pins hydrate from settings on
        // init, so this is correct at rest / on zoom too.
        corner(i) {
            // `this.pins` doesn't exist until init() — but new-grid-layer fires a
            // draw BEFORE init (overlay.js mounted order), so guard it.
            const p = this.pins && this.pins[i]
            if (p && p.t != null && p.y$ != null) return [p.t, p.y$]
            return i === 0 ? this.sett.c0 : this.sett.c1
        },

        // Screen-space box rect from the two (live) corner data-coords.
        box_rect() {
            const c0 = this.corner(0), c1 = this.corner(1)
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
        order_geometry(ctx, r) {
            const L = this.$props.layout
            const eye = { x: r.xL + 4, y: r.yT + 4, w: EYE, h: EYE }
            // Status button — width measured to fit the label.
            const st = this.order_status()
            ctx.save(); ctx.font = this.font11
            const tw = Math.ceil(ctx.measureText(st.label).width)
            ctx.restore()
            const submit = { x: r.xL + 4 + EYE + 4, y: r.yT + 4, w: tw + BTN_PADX * 2, h: BTN_H, st }

            // Resize handles: 4 corners + 4 edge midpoints. Ownership uses the
            // LIVE corners (corner()), the same source as r, so a flipped box
            // maps the visual edge to the correct c0/c1 component each frame.
            const lc0 = this.corner(0), lc1 = this.corner(1)
            let resize = []
            if (lc0 && lc1) {
                const cxL = L.t2screen(lc0[0]) <= L.t2screen(lc1[0]) ? 0 : 1 // owns left x
                const cxR = cxL ^ 1
                const cyT = L.$2screen(lc0[1]) <= L.$2screen(lc1[1]) ? 0 : 1 // owns top y
                const cyB = cyT ^ 1
                const mx = (r.xL + r.xR) / 2, my = (r.yT + r.yB) / 2
                const hb = (cx, cy) => ({ x: cx - HND, y: cy - HND, w: HND * 2, h: HND * 2 })
                resize = [
                    { rect: hb(r.xL, r.yT), edits: [{ pin: cxL, axis: 't' }, { pin: cyT, axis: '$' }] },
                    { rect: hb(r.xR, r.yT), edits: [{ pin: cxR, axis: 't' }, { pin: cyT, axis: '$' }] },
                    { rect: hb(r.xL, r.yB), edits: [{ pin: cxL, axis: 't' }, { pin: cyB, axis: '$' }] },
                    { rect: hb(r.xR, r.yB), edits: [{ pin: cxR, axis: 't' }, { pin: cyB, axis: '$' }] },
                    { rect: hb(r.xL, my), edits: [{ pin: cxL, axis: 't' }] },
                    { rect: hb(r.xR, my), edits: [{ pin: cxR, axis: 't' }] },
                    { rect: hb(mx, r.yT), edits: [{ pin: cyT, axis: '$' }] },
                    { rect: hb(mx, r.yB), edits: [{ pin: cyB, axis: '$' }] }
                ]
            }

            const rows = []
            if (this.visible) {
                for (const o of this.orders) {
                    // _moveDy: live vertical translation while the box body is
                    // dragged (kept off settings to avoid prop lag; baked in on
                    // drop) so the order lines move WITH the box.
                    const y = L.$2screen(o.price + this._moveDy)
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
            return { eye, submit, rows, resize }
        },

        // Aggregate order status → button {label, color, submittable}. Some mixed
        // states only occur with a real backend (TODO) — the sync stub reaches
        // all-local / pending / all-confirmed / all-rejected.
        order_status() {
            const os = this.orders
            const accent = this.side === 'buy' ? this.color_buy : this.color_sell
            if (!os.length) return { label: 'No orders', color: '#5b6472', submittable: false }
            const st = s => os.every(o => (o.status || 'local') === s)
            const any = s => os.some(o => (o.status || 'local') === s)
            if (any('cancelling')) return { label: 'Cancelling…', color: '#d0a000', submittable: false }
            if (st('local')) return { label: 'Submit', color: accent, submittable: true }
            if (any('pending')) return { label: 'Pending…', color: '#d0a000', submittable: this.has_submittable() }
            if (st('confirmed')) return { label: 'Confirmed', color: this.color_buy, submittable: false }
            if (st('rejected')) return { label: 'Rejected', color: this.color_sell, submittable: true }
            // TODO(backend): mixed terminal states need the real engine.
            if (any('rejected')) return { label: 'Partially Rejected', color: this.color_sell, submittable: true }
            return { label: 'Partially Confirmed', color: accent, submittable: this.has_submittable() }
        },

        // Human label for the order type (shown atop the summary).
        order_type_label() {
            const t = this.sett.orderType || 'scaled'
            return ({ scaled: 'Scaled Order', distribution: 'Distribution' })[t] || 'Order'
        },

        // Any order that can be (re)submitted (local or rejected).
        has_submittable() {
            return this.orders.some(o => { const s = o.status || 'local'; return s === 'local' || s === 'rejected' })
        },

        // Summary stats for the box: originally placed qty/size (from the modal),
        // current order count, filled (confirmed) count/size, and the size-
        // weighted average fill price across ALL current orders (if all execute).
        // Prices include the live move offset so the avg line tracks a drag.
        order_summary() {
            const os = this.orders
            if (!os.length) return null
            let totalSize = 0, wsum = 0, filledCount = 0, filledSize = 0
            for (const o of os) {
                const sz = Number(o.size) || 0
                const price = Number(o.price) + this._moveDy
                totalSize += sz
                wsum += price * sz
                if ((o.status || 'local') === 'confirmed') { filledCount++; filledSize += sz }
            }
            return {
                count: os.length,
                origQty: this.sett.qty != null ? this.sett.qty : os.length,
                origSize: this.sett.totalSize != null ? this.sett.totalSize : totalSize,
                totalSize, filledCount, filledSize,
                avgPrice: totalSize > 0 ? wsum / totalSize : null
            }
        },

        // Orders that are live on the engine (or being cancelled) — the box must
        // not be deleted outright while any exist.
        has_live_orders() {
            return this.orders.some(o => {
                const s = o.status || 'local'
                return s === 'pending' || s === 'confirmed' || s === 'cancelling'
            })
        },

        // Delete/Backspace (Tool mixin binds this.remove_tool). Overrides Tool's:
        // local/rejected orders (or none) → delete the box now; live orders
        // (pending/confirmed) → request a cancel and KEEP the box until the engine
        // confirms the cancellation (the OrderAgent removes the box then).
        remove_tool() {
            if (!this.selected) return
            if (this.has_live_orders()) {
                this.custom_event('cancel-orders')
            } else {
                this.custom_event('remove-tool')
            }
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

            const geom = this.order_geometry(ctx, r)
            this._geom = geom
            for (const row of geom.rows) this.draw_order(ctx, row, stroke)
            this.draw_eye(ctx, geom.eye, this.visible, stroke)
            this.draw_submit(ctx, geom.submit)
            this.draw_summary(ctx, r)

            this.render_pins(ctx)
            // Resize handles only when the box is selected/hovered (like pins).
            if (this.selected || this.show_pins) {
                this.draw_resize_handles(ctx, geom.resize, stroke)
            }
        },

        draw_resize_handles(ctx, handles, color) {
            if (!handles) return
            ctx.save()
            ctx.fillStyle = this.$props.colors.back || '#0b0e16'
            ctx.strokeStyle = color
            ctx.lineWidth = 1
            for (const h of handles) {
                ctx.fillRect(h.rect.x, h.rect.y, h.rect.w, h.rect.h)
                ctx.strokeRect(h.rect.x + 0.5, h.rect.y + 0.5, h.rect.w - 1, h.rect.h - 1)
            }
            ctx.restore()
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

        // Stats panel (under the eye chrome) + the average-fill-price line.
        // avgPrice already includes the live move offset (order_summary), so the
        // line + label track the box during a drag.
        draw_summary(ctx, r) {
            const s = this.order_summary()
            if (!s) return
            const L = this.$props.layout
            const prec = (L && L.prec) || 2

            // Average-price reference line (distinct gold), clamped to box width.
            if (s.avgPrice != null) {
                const y = L.$2screen(s.avgPrice)
                ctx.save()
                ctx.strokeStyle = AVG_COLOR
                ctx.lineWidth = 1
                ctx.setLineDash([2, 2])
                ctx.beginPath()
                ctx.moveTo(r.xL, y + 0.5)
                ctx.lineTo(r.xR, y + 0.5)
                ctx.stroke()
                ctx.setLineDash([])
                ctx.fillStyle = AVG_COLOR
                ctx.font = this.font11
                ctx.textAlign = 'right'
                ctx.textBaseline = 'bottom'
                ctx.fillText(`avg ${s.avgPrice.toFixed(prec)}`, r.xR - 3, y - 1)
                ctx.textAlign = 'left'
                ctx.textBaseline = 'alphabetic'
                ctx.restore()
            }

            // Text under the eye/submit row: order TYPE title, then placed
            // (original) / filled / avg. (Partial-fill QUANTITY per order is
            // backend-dependent — TODO; "filled" counts confirmed orders for now.)
            ctx.save()
            ctx.font = this.font11
            ctx.textBaseline = 'top'
            const tx = r.xL + 6
            let ty = r.yT + 4 + EYE + 5
            // Order-type title (accent colour by side).
            ctx.fillStyle = this.side === 'buy' ? this.color_buy : this.color_sell
            ctx.fillText(this.order_type_label(), tx, ty); ty += 14
            ctx.fillStyle = this.$props.colors.textHL || '#cfe'
            const lines = [
                `placed ${s.origQty} · ${fmtNum(s.origSize)}`,
                `filled ${s.filledCount}/${s.origQty}`
            ]
            if (s.avgPrice != null) lines.push(`avg ${s.avgPrice.toFixed(prec)}`)
            for (const ln of lines) { ctx.fillText(ln, tx, ty); ty += 13 }
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

        // Labeled status button: filled+clickable when submittable, else an
        // outlined status display.
        draw_submit(ctx, s) {
            const st = s.st
            const rr = 3
            ctx.save()
            ctx.beginPath()
            ctx.moveTo(s.x + rr, s.y)
            ctx.arcTo(s.x + s.w, s.y, s.x + s.w, s.y + s.h, rr)
            ctx.arcTo(s.x + s.w, s.y + s.h, s.x, s.y + s.h, rr)
            ctx.arcTo(s.x, s.y + s.h, s.x, s.y, rr)
            ctx.arcTo(s.x, s.y, s.x + s.w, s.y, rr)
            ctx.closePath()
            if (st.submittable) {
                ctx.fillStyle = st.color
                ctx.fill()
                ctx.fillStyle = this.$props.colors.back || '#0b0e16'
            } else {
                ctx.globalAlpha = 0.6
                ctx.strokeStyle = st.color
                ctx.lineWidth = 1
                ctx.stroke()
                ctx.globalAlpha = 1
                ctx.fillStyle = st.color
            }
            ctx.font = this.font11
            ctx.textAlign = 'center'
            ctx.textBaseline = 'middle'
            ctx.fillText(st.label, s.x + s.w / 2, s.y + s.h / 2 + 0.5)
            ctx.textAlign = 'left'
            ctx.textBaseline = 'alphabetic'
            ctx.restore()
        },

        // ── interaction ──────────────────────────────────────────────────────
        on_mousedown(e) {
            if (Utils.default_prevented(e)) return
            const g = this._geom
            if (!g) return
            const mx = this.mouse.x, my = this.mouse.y

            // Status button — submit only when there are unsubmitted orders;
            // otherwise it's a status display (no-op) but still consumes the click.
            if (inRect(g.submit, mx, my)) {
                if (g.submit.st.submittable) this.custom_event('submit-orders')
                e.preventDefault()
                return
            }
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
            // Resize handles (corners/edges) — only active when shown.
            if (this.selected || this.show_pins) {
                for (const h of (g.resize || [])) {
                    if (inRect(h.rect, mx, my)) {
                        this._dragResize = h.edits
                        if (!this.selected) this.custom_event('object-selected')
                        this.custom_event('scroll-lock', true)
                        e.preventDefault()
                        return
                    }
                }
            }
            // else: fall through to box Pins / Tool (select / move).
        },

        on_mousemove() {
            // Resize a corner/edge: edit only the owned c0/c1 components, keep
            // the PINS' live state in sync (so corner()/box_rect follow THIS
            // frame — the settings prop only refreshes after the async re-render),
            // and persist via change-settings.
            if (this._dragResize) {
                const t = this.$props.cursor.t, y$ = this.$props.cursor.y$
                if (t == null || y$ == null) return
                const c0 = [...this.sett.c0], c1 = [...this.sett.c1]
                const pick = i => i === 0 ? c0 : c1
                for (const ed of this._dragResize) {
                    const p = pick(ed.pin)
                    if (ed.axis === 't') p[0] = t; else p[1] = y$
                }
                this.pins[0].update_from(c0, false)
                this.pins[1].update_from(c1, false)
                this.custom_event('change-settings', { c0, c1 })
                return
            }
            if (this._dragOrder != null) {
                // cursor.y$ is already updated for this move (grid emits
                // cursor-changed before propagating to overlays).
                const price = this.$props.cursor.y$
                if (price == null) return
                this.set_orders(o => o.id === this._dragOrder ? { ...o, price } : o)
                return
            }
            // Box-body MOVE (Tool drag active, no order/resize drag): translate the
            // order lines vertically by the SAME dy the box moves (Tool.drag_update
            // shifts the corner prices by cursor.y$ - drag.y$). Live offset only —
            // baked into settings on mouseup; a move preserves relative spacing
            // (no recompute, since a body drag doesn't fire pin 'settled').
            if (this.drag) {
                const y$ = this.$props.cursor.y$
                if (y$ != null) { this._moveDy = y$ - this.drag.y$; this._moving = true }
            }
        },

        on_mouseup() {
            if (this._dragResize) {
                this._dragResize = null
                this.custom_event('scroll-lock', false)
                this.recompute_orders()   // re-derive the distribution for the new range
                return
            }
            if (this._moving) {
                const dy = this._moveDy
                this._moving = false
                this._moveDy = 0
                if (dy) this.set_orders(o => ({ ...o, price: o.price + dy }))
                return
            }
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

        // Resize → re-derive the distribution from the new box range. Use the
        // live corners (pin state) so it's correct even if the settings prop
        // hasn't re-propagated yet.
        recompute_orders() {
            const c0 = this.corner(0), c1 = this.corner(1)
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
