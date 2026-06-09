<script>
// OrderBox — a persistent, data-anchored box that holds a distribution of orders.
// Drawn as a green (buy) / red (sell) rectangle anchored to two corner Pins
// (c0/c1 = [t, price]); everything is re-projected from data coords each frame
// via layout.t2screen/$2screen, so it tracks zoom/pan/relayout.
//
// P3: box + corner pins only. P4 adds the order lines; P5 adds per-order
// drag/delete + the eye toggle; P6 adds the ws pending/confirmed styling.

import Overlay from '../../mixins/overlay.js'
import Tool from '../../mixins/tool.js'
import Pin from '../primitives/pin.js'

export default {
    name: 'OrderBox',
    mixins: [Overlay, Tool],
    methods: {
        meta_info() { return { author: 'order-box', version: '0.1.0' } },
        use_for() { return ['OrderBox'] },

        // Overlay is created in the 'finished' state, so Pins hydrate from
        // settings.c0/c1 (pin.js:37-42) rather than tracking the cursor.
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

        draw(ctx) {
            const r = this.box_rect()
            if (!r) return
            const buy = this.side === 'buy'

            ctx.save()
            ctx.fillStyle = buy ? this.fill_buy : this.fill_sell
            ctx.fillRect(r.xL, r.yT, r.xR - r.xL, r.yB - r.yT)
            ctx.strokeStyle = buy ? this.color_buy : this.color_sell
            ctx.lineWidth = 1
            ctx.strokeRect(r.xL + 0.5, r.yT + 0.5, r.xR - r.xL - 1, r.yB - r.yT - 1)
            ctx.restore()

            this.render_pins(ctx)
        },

        data_colors() { return [this.side === 'buy' ? this.color_buy : this.color_sell] }
    },
    computed: {
        side() { return this.sett.side === 'sell' ? 'sell' : 'buy' },
        color_buy() { return this.sett.colorBuy || '#23a776' },
        color_sell() { return this.sett.colorSell || '#e54150' },
        fill_buy() { return this.sett.fillBuy || 'rgba(35,167,118,0.10)' },
        fill_sell() { return this.sett.fillSell || 'rgba(229,65,80,0.10)' }
    },
    data() { return {} }
}
</script>
