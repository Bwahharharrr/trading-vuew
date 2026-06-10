<script>
// PriceAlarms — bell markers hugging the Y axis on the price pane.
//
// The alarm LIST lives in App (settings.alarms is the SAME array reference App
// owns, so it survives DataCube wipes — App re-adds this overlay pointing at
// the same array). The overlay renders each alarm (dotted level line + bell +
// price tag, green above / red below, ringing = filled bell with sound waves)
// and handles bell interaction:
//   click  → custom_event('alarm-cleared', {id})        (App removes + mutes)
//   drag   → custom_event('alarm-moved',  {id, price})  (App re-arms + mutes)
// Sound + trigger detection are App's job (helpers/alarm-sound.js).

import Overlay from '../../mixins/overlay.js'
import Tool from '../../mixins/tool.js' // window-mouseup fallback + std plumbing
import Utils from '../../stuff/utils.js'

const GREEN = '#23a776'
const RED = '#e54150'
const BELL_W = 18 // bell hit-zone size (px)

function inRect(r, x, y) {
    return x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h
}

export default {
    name: 'PriceAlarms',
    mixins: [Overlay, Tool],
    methods: {
        meta_info() { return { author: 'price-alarms', version: '1.0.0' } },
        use_for() { return ['PriceAlarms'] },

        init() {
            this._drag = null
            this._geo = null
            this._axisShader = false
            this.mouse.on('mousedown', e => this.on_mousedown(e))
            this.mouse.on('mousemove', () => this.on_mousemove())
            this.mouse.on('mouseup', e => this.on_mouseup(e))
        },

        // Y-AXIS marker: a sidebar shader (the same channel as the last-price
        // tag, see primitives/price.js) that paints a green/red bar across the
        // axis gutter at each alarm's price. Registered lazily on first draw
        // (Grid wires shader events by then); Grid removes it with the layer
        // (delete-grid-layer → remove-shaders), so DataCube wipes can't leak
        // or duplicate it. The closure reads alarms/layout LIVE per repaint.
        init_axis_shader() {
            const comp = this
            this.custom_event('new-shader', {
                target: 'sidebar',
                draw: (ctx) => {
                    const L = comp.$props.layout
                    const alarms = comp.alarms()
                    if (!L || !alarms.length) return
                    const w = ctx.canvas.width
                    for (const a of alarms) {
                        if (!Number.isFinite(a.price)) continue
                        const y = Math.round(L.$2screen(a.price))
                        ctx.fillStyle = a.side === 'above' ? GREEN : RED
                        ctx.globalAlpha = a.triggered ? 1 : 0.8
                        ctx.fillRect(0, y - 1, w, 2)
                    }
                    ctx.globalAlpha = 1
                },
            })
            this._axisShader = true
        },

        alarms() {
            return Array.isArray(this.sett.alarms) ? this.sett.alarms : []
        },

        draw(ctx) {
            if (!this._axisShader) this.init_axis_shader()
            const L = this.$props.layout
            const W = L.width
            const prec = L.prec || 2
            const geo = []
            ctx.save()
            ctx.font = this.font11
            for (const a of this.alarms()) {
                if (!Number.isFinite(a.price)) continue
                const y = L.$2screen(a.price)
                const color = a.side === 'above' ? GREEN : RED
                // Dotted level line across the pane (stronger while ringing).
                ctx.strokeStyle = color
                ctx.lineWidth = 1
                ctx.globalAlpha = a.triggered ? 0.75 : 0.4
                ctx.setLineDash([3, 4])
                ctx.beginPath()
                ctx.moveTo(0, y + 0.5)
                ctx.lineTo(W, y + 0.5)
                ctx.stroke()
                ctx.setLineDash([])
                ctx.globalAlpha = 1
                // Bell + price tag, hugging the right edge (next to the Y axis).
                const bx = W - 13
                this.draw_bell(ctx, bx, y, color, !!a.triggered)
                ctx.fillStyle = color
                ctx.textAlign = 'right'
                ctx.textBaseline = 'middle'
                ctx.fillText(Number(a.price).toFixed(prec), bx - 11, y + 0.5)
                geo.push({
                    id: a.id,
                    rect: { x: bx - BELL_W / 2, y: y - BELL_W / 2, w: BELL_W, h: BELL_W },
                })
            }
            ctx.textAlign = 'left'
            ctx.textBaseline = 'alphabetic'
            ctx.restore()
            this._geo = geo
        },

        // Bell glyph centered on (x, y): dome + lip + clapper; ringing = filled,
        // with small sound-wave arcs either side.
        draw_bell(ctx, x, y, color, ringing) {
            ctx.save()
            ctx.strokeStyle = color
            ctx.fillStyle = color
            ctx.lineWidth = 1.2
            ctx.beginPath()
            ctx.moveTo(x - 5, y + 3)
            ctx.quadraticCurveTo(x - 5, y - 5, x, y - 5)
            ctx.quadraticCurveTo(x + 5, y - 5, x + 5, y + 3)
            ctx.lineTo(x + 6.5, y + 4.5)
            ctx.lineTo(x - 6.5, y + 4.5)
            ctx.closePath()
            if (ringing) ctx.fill(); else ctx.stroke()
            ctx.beginPath()
            ctx.arc(x, y + 6.5, 1.5, 0, Math.PI * 2)
            if (ringing) ctx.fill(); else ctx.stroke()
            if (ringing) {
                ctx.beginPath()
                ctx.arc(x - 8, y - 1, 3, Math.PI * 0.75, Math.PI * 1.25)
                ctx.stroke()
                ctx.beginPath()
                ctx.arc(x + 8, y - 1, 3, -Math.PI * 0.25, Math.PI * 0.25)
                ctx.stroke()
            }
            ctx.restore()
        },

        on_mousedown(e) {
            if (Utils.default_prevented(e)) return
            const g = this._geo
            if (!g) return
            const mx = this.mouse.x, my = this.mouse.y
            for (const b of g) {
                if (inRect(b.rect, mx, my)) {
                    const a = this.alarms().find(x => x.id === b.id)
                    if (!a) return
                    this._drag = { id: b.id, moved: false, y0: my }
                    // Pause App's trigger checker for the alarm mid-drag (it must
                    // not fire while the level sweeps across the price).
                    a.$dragging = true
                    this.custom_event('scroll-lock', true)
                    e.preventDefault()
                    return
                }
            }
        },

        on_mousemove() {
            const d = this._drag
            if (!d) return
            const my = this.mouse.y
            if (!d.moved && Math.abs(my - d.y0) > 3) d.moved = true
            if (d.moved) {
                const a = this.alarms().find(x => x.id === d.id)
                if (a) {
                    a.price = this.$props.layout.screen2$(my)
                    // Re-emit the same array ref purely to force the repaint
                    // (overlays only redraw on a settings change).
                    this.custom_event('change-settings', { alarms: this.sett.alarms })
                }
            }
        },

        on_mouseup() {
            const d = this._drag
            if (!d) return
            this._drag = null
            this.custom_event('scroll-lock', false)
            const a = this.alarms().find(x => x.id === d.id)
            if (!a) return
            a.$dragging = false
            if (d.moved) {
                this.custom_event('alarm-moved', { id: a.id, price: a.price })
            } else {
                this.custom_event('alarm-cleared', { id: a.id })
            }
        },

        data_colors() { return [GREEN, RED] },
    },
    computed: {
        font11() { return '11px ' + (this.$props.font || '').split('px').pop() },
    },
}
</script>
