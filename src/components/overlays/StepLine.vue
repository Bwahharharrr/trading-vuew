<script>
// StepLine renderer - draws values as a step/stair pattern

import Overlay from '../../mixins/overlay.js'
import CanvasDrawing from '../../mixins/canvas-drawing.js'
import Const from '../../stuff/constants.js'

export default {
    name: 'StepLine',
    mixins: [Overlay, CanvasDrawing],
    methods: {
        meta_info() {
            return { author: 'Custom', version: '1.0.0' }
        },
        draw(ctx) {
            if (this.$props.data.length < 1) return

            this.setupStroke(ctx, this.line_width, this.color)
            ctx.beginPath()
            this.drawStepLine(ctx, this.$props.data, this.data_index)
            ctx.stroke()
        },
        use_for() { return ['StepLine'] },
        data_colors() { return [this.color] },
        y_range(hi, lo) {
            let data = this.$props.data
            let i = this.data_index
            let max = -Infinity
            let min = Infinity
            for (let p of data) {
                if (p[i] != null) {
                    if (p[i] > max) max = p[i]
                    if (p[i] < min) min = p[i]
                }
            }
            if (max === -Infinity) return [hi, lo]
            let pad = (max - min) * 0.1 || 1
            return [max + pad, min - pad]
        }
    },
    computed: {
        line_width() {
            return this.sett.lineWidth || 1.5
        },
        color() {
            const n = this.$props.num % 5
            return this.sett.color || Const.OVERLAY_COLORS[n]
        },
        data_index() {
            return this.sett.dataIndex || 1
        }
    }
}
</script>
