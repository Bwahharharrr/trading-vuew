<script>
// Standalone renedrer for the volume

import Overlay from '../../mixins/overlay.js'
import CanvasDrawing from '../../mixins/canvas-drawing.js'
import { layout_vol } from '../js/layout_cnv.js'
import Volbar from '../primitives/volbar.js'
import Utils from '../../stuff/utils.js'
import { VOLUME_LINE_STYLES } from '../../stuff/volume.js'

export default {
    name: 'Volume',
    mixins: [Overlay, CanvasDrawing],
    methods: {
        meta_info() {
            return { author: 'C451', version: '1.1.0' }
        },

        draw(ctx) {

            // Visual style (Bar / Histogram / Spline / StepLine). Bar/Histogram
            // and the default render bars; Spline/StepLine render a line of the
            // SAME volume series (column _i1), never a different data column.
            const style = this.sett.style
            if (VOLUME_LINE_STYLES.includes(style)) {
                this.draw_line(ctx, style)
                return
            }

            for (let v of layout_vol(this)) {
                new Volbar(this, ctx, v)
            }

        },

        // Line variant (Spline / StepLine) of the volume series. Uses the grid
        // Y-transform ($2screen) so it shares the detached pane's 0-based,
        // drag-scalable Y-axis with the bar variant.
        draw_line(ctx, style) {
            const sub = this.$props.sub
            const dim = sub && sub[0] ? sub[0].length : 0
            // Mirror layout_vol's index detection so the legend value + line
            // both read the volume column (col 5 for OHLCV, col 1 otherwise).
            this._i1 = dim < 6 ? 1 : 5
            this._i2 = dim < 6 ? (p => p[2]) : (p => p[4] >= p[1])

            ctx.lineJoin = 'round'
            ctx.lineWidth = this.sett.lineWidth || 1.0
            ctx.strokeStyle = this.colorVolUp
            ctx.beginPath()
            if (style === 'StepLine') {
                this.drawStepLine(ctx, sub, this._i1)
            } else {
                this.drawDataLine(ctx, sub, this._i1)
            }
            ctx.stroke()
        },
        use_for() { return ['Volume'] },

        // Defines legend format (values & colors)
        // _i2 - detetected data index (see layout_cnv)
        legend(values) {

            let flag = this._i2 ?
                this._i2(values) : values[2]

            const color = flag ?
                this.colorVolUpLegend :
                this.colorVolDwLegend

            return [{
                value: values[this._i1 || 1], color
            }]
        },
        // When added as offchart overlay
        // If data is OHLCV => recalc y-range
        // _i1 - detetected data index (see layout_cnv)
        y_range(hi, lo) {
            const sub = this.$props.sub
            // Detect the volume column directly from data width — _i1 is only
            // set at DRAW time (layout_vol), so on the first layout build it is
            // still undefined; reading the width here makes the range correct
            // from the very first frame.
            const dim = sub && sub[0] ? sub[0].length : 0
            const i1 = dim < 6 ? 1 : 5

            // Detached (own offchart pane): baseline 0 sits flush at the bottom
            // (exp=false → no EXPAND padding), and bars/line are drawn through
            // layout.$2screen so dragging the Y-axis rescales them. The top is
            // padded by volscale (~0.85 → ~15% headroom) so the tallest bar
            // doesn't jam against the ceiling, mirroring the candle-pane VOLSCALE.
            if (this.$props.grid_id > 0 && dim > 0) {
                const headroom = this.volscale || 1
                return [Utils.maxAtIndex(sub, i1) / headroom, 0, false]
            }
            // Candle-pane / legacy OHLCV use: unchanged range.
            if (i1 === 5) {
                return [
                    Utils.maxAtIndex(sub, i1),
                    Utils.minAtIndex(sub, i1)
                ]
            }
            return [hi, lo]
        }
    },

    // Define internal setting & constants here
    computed: {
        colorVolUp() {
            // colorUp/colorDown are the keys the settings modal's Bar/Histogram
            // colour pickers emit — accept them as a fallback so picked colours
            // actually reach the bars/line.
            return this.sett.colorVolUp ||
            this.sett.colorUp ||
            this.$props.colors.volUp
        },
        colorVolDw() {
            return this.sett.colorVolDw ||
            this.sett.colorDown ||
            this.$props.colors.volDw
        },
        colorVolUpLegend() {
            return this.sett.colorVolUpLegend ||
            this.$props.colors.candleUp
        },
        colorVolDwLegend() {
            return this.sett.colorVolDwLegend ||
            this.$props.colors.candleDw
        },
        volscale() {
            return this.sett.volscale ||
            (this.$props.grid_id > 0 ? 0.85 :
            this.$props.config.VOLSCALE)
        }
    },
    data() {
        return {}
    }

}
</script>
