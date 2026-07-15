<script>
// Spline renderer. (SMAs, EMAs, TEMAs, etc.)

import Overlay from '../../mixins/overlay.js'
import CanvasDrawing from '../../mixins/canvas-drawing.js'
import Const from '../../stuff/constants.js'

export default {
    name: 'Spline',
    mixins: [Overlay, CanvasDrawing],
    methods: {
        meta_info() {
            return { author: 'C451', version: '1.1.2' }
        },
        draw(ctx) {
            const dash = this.sett.lineDash || []
            this.setupStroke(ctx, this.line_width, this.color)
            if (dash.length) ctx.setLineDash(dash)
            ctx.beginPath()
            this.drawDataLine(ctx, this.$props.data, this.data_index, this.skip_nan)
            ctx.stroke()
            // Canvas state is shared by sibling overlays. Never leak a dotted
            // spline's pattern into the next line/candle renderer.
            if (dash.length) ctx.setLineDash([])
        },
        use_for() { return ['Spline', 'EMA', 'SMA'] },
        data_colors() { return [this.color] }
    },
    computed: {
        line_width() {
            return this.sett.lineWidth || 0.75
        },
        color() {
            const n = this.$props.num % 5
            return this.sett.color || Const.OVERLAY_COLORS[n]
        },
        data_index() {
            return this.sett.dataIndex || 1
        },
        skip_nan() {
            return this.sett.skipNaN
        }
    }
}
</script>
