// Drawing tools mixin - handles rectangle drawing mode

import Utils from '../../stuff/utils.js'
import Const from '../../stuff/constants.js'
import { distributeOrders } from '../../stuff/order-distribution.js'

// Deterministic per-session counter for OrderBox $uuid (no Date.now/random).
let ORDER_BOX_SEQ = 0

// Pure conversion for the rectangle readout. Given the MAIN price grid (exposing
// screen2$/screen2t/ti_map/prec) and a GRID-RELATIVE box rect (pixels measured
// from the chart canvas top-left), return { high, low, tStart, tEnd, startStr,
// endStr }.
//
// - Y is INVERTED (canvas y grows downward, grid_maker A<0): bigger screen-y =
//   lower price, so the box top edge = HIGH and bottom edge = LOW. We feed both
//   edges through screen2$ and Math.max/min, so drag direction doesn't matter.
// - X -> continuous epoch-ms via screen2t, normalized through ti_map.i2t (a no-op
//   in regular mode; index->ms in index-based mode — called exactly ONCE).
// - Readable strings mirror the botbar/x-axis: the timezone (hours) is applied
//   ONLY for intraday timeframes (tf < DAY), and all fields are read with getUTC*
//   so the host machine's local timezone never leaks in.
export function boxReadout(grid, { topY, botY, leftX, rightX }, tzHours = 0) {
    const p1 = grid.screen2$(topY)
    const p2 = grid.screen2$(botY)
    const high = Math.max(p1, p2)
    const low = Math.min(p1, p2)

    const tStart = grid.ti_map.i2t(grid.screen2t(leftX))
    const tEnd = grid.ti_map.i2t(grid.screen2t(rightX))

    const prec = grid.prec != null ? grid.prec : 2
    const fmt = (t) => {
        const k = grid.ti_map.tf < Const.DAY ? 1 : 0
        const d = Utils.getCachedDate(t + k * tzHours * Const.HOUR)
        return `${d.getUTCFullYear()}-${Utils.add_zero(d.getUTCMonth() + 1)}-` +
            `${Utils.add_zero(d.getUTCDate())} ` +
            `${Utils.add_zero(d.getUTCHours())}:${Utils.add_zero(d.getUTCMinutes())}`
    }

    return {
        high: high.toFixed(prec),
        low: low.toFixed(prec),
        tStart: Math.round(tStart),
        tEnd: Math.round(tEnd),
        startStr: fmt(tStart),
        endStr: fmt(tEnd),
    }
}

export default {
    data() {
        return {
            rectDrawMode: false,
            isDrawing: false,
            rectStart: null,
            rectCurrent: null,
            // Order-distribution modal handoff (opened after a box is drawn).
            orderModalOpen: false,
            pendingBoxGeometry: null   // { tStart, tEnd, low, high } (data coords)
        }
    },
    methods: {
        toggleRectDrawMode() {
            this.rectDrawMode = !this.rectDrawMode
            if (!this.rectDrawMode) {
                this.isDrawing = false
                this.rectStart = null
                this.rectCurrent = null
            }
        },

        onDrawStart(event) {
            this.isDrawing = true
            this.rectStart = { x: event.clientX, y: event.clientY }
            this.rectCurrent = { x: event.clientX, y: event.clientY }
        },

        onDrawMove(event) {
            if (this.isDrawing) {
                this.rectCurrent = { x: event.clientX, y: event.clientY }
            }
        },

        // Resolve the main price grid's <canvas> DOM node — the true coordinate
        // origin (the overlay div spans the whole wrapper, but the canvas is inset
        // by the toolbar + sidebar, so the overlay's rect would mis-map X).
        _drawCanvasEl(chart) {
            const sec0 = chart.$refs && chart.$refs.sec && chart.$refs.sec[0]
            const gridVm = sec0 && sec0.$refs && sec0.$refs.grid
            return (gridVm && gridVm.$refs && gridVm.$refs.canvas) ||
                (gridVm && gridVm.$el && gridVm.$el.querySelector &&
                    gridVm.$el.querySelector('canvas')) ||
                (chart.$el && chart.$el.querySelector &&
                    chart.$el.querySelector('canvas')) || null
        },

        onDrawEnd(event) {
            if (!(this.isDrawing && this.rectStart && this.rectCurrent)) return

            const w = Math.abs(this.rectCurrent.x - this.rectStart.x)
            const h = Math.abs(this.rectCurrent.y - this.rectStart.y)

            if (w > 5 && h > 5) {
                const tv = this.$refs.tradingVue
                const chart = tv && tv.$refs && tv.$refs.chart
                const grid = chart && chart.chartLayout &&
                    chart.chartLayout.grids && chart.chartLayout.grids[0]
                const canvasEl = grid && chart ? this._drawCanvasEl(chart) : null

                if (grid && canvasEl) {
                    // client (viewport) corners -> grid-relative pixels, clamped to
                    // the canvas so an off-canvas drag doesn't extrapolate.
                    const rect = canvasEl.getBoundingClientRect()
                    const clamp = (v, max) => Math.max(0, Math.min(v, max))
                    const ys = [this.rectStart.y, this.rectCurrent.y]
                    const xs = [this.rectStart.x, this.rectCurrent.x]
                    const topY = clamp(Math.min(...ys) - rect.top, rect.height)
                    const botY = clamp(Math.max(...ys) - rect.top, rect.height)
                    const leftX = clamp(Math.min(...xs) - rect.left, rect.width)
                    const rightX = clamp(Math.max(...xs) - rect.left, rect.width)

                    const tz = (tv.$props && tv.$props.timezone) || 0
                    const r = boxReadout(grid, { topY, botY, leftX, rightX }, tz)

                    alert(
                        `Rectangle:\n` +
                        `High:  ${r.high}\n` +
                        `Low:   ${r.low}\n` +
                        `Start: ${r.tStart}  (${r.startStr})\n` +
                        `End:   ${r.tEnd}  (${r.endStr})`
                    )

                    // Hand off to the order-distribution modal (the debug alert
                    // above is kept). Stash geometry in DATA coords so the saved
                    // OrderBox overlay can anchor to it (boxReadout high/low are
                    // formatted strings -> Number()).
                    this.pendingBoxGeometry = {
                        tStart: r.tStart,
                        tEnd: r.tEnd,
                        low: Number(r.low),
                        high: Number(r.high)
                    }
                    this.orderModalOpen = true
                }
            }

            // rectDrawMode=false unmounts the z-index:999 .drawing-overlay so it
            // stops swallowing clicks meant for the saved OrderBox handles.
            this.isDrawing = false
            this.rectStart = null
            this.rectCurrent = null
            this.rectDrawMode = false
        },

        onOrderConfirm(cfg) {
            const g = this.pendingBoxGeometry
            this.orderModalOpen = false
            this.pendingBoxGeometry = null
            if (!g || !this.chart || typeof this.chart.add !== 'function') return

            const orders = distributeOrders({
                low: g.low, high: g.high,
                qty: cfg.orderQty, size: cfg.orderSize, dist: cfg.distribution
            }).map(o => ({ ...o, status: 'local' }))

            // Persist as an OrderBox overlay anchored to DATA coords (corner Pins
            // c0/c1 = [t, price]); it redraws + tracks zoom/pan automatically.
            this.chart.add('onchart', {
                name: 'Order Distribution',
                type: 'OrderBox',
                grid: { id: 0 },
                data: [],
                settings: {
                    $uuid: `orderbox-${++ORDER_BOX_SEQ}`,
                    $selected: false,
                    $state: 'finished',
                    'z-index': 100,
                    legend: false,
                    c0: [g.tStart, g.low],
                    c1: [g.tEnd, g.high],
                    side: cfg.side,
                    visible: true,
                    totalSize: cfg.orderSize,
                    qty: cfg.orderQty,
                    distribution: cfg.distribution,
                    orders
                }
            })
        },

        onOrderCancel() {
            this.orderModalOpen = false
            this.pendingBoxGeometry = null
        }
    }
}
