<script>
// Splines renderer - multiple lines from single data array (DMI, etc.)

import Overlay from '../../mixins/overlay.js'
import CanvasDrawing from '../../mixins/canvas-drawing.js'
import Const from '../../stuff/constants.js'

export default {
    name: 'Splines',
    mixins: [Overlay, CanvasDrawing],
    methods: {
        meta_info() {
            return { author: 'C451', version: '1.1.0' }
        },
        draw(ctx) {
            for (let i = 0; i < this.lines_num; i++) {
                let colorIdx = i % this.clrx.length
                this.setupStroke(ctx, this.widths[i] || this.line_width, this.clrx[colorIdx])
                ctx.beginPath()
                this.drawDataLine(ctx, this.$props.data, i + 1, this.skip_nan)
                ctx.stroke()
            }
        },
        use_for() { return ['Splines', 'DMI'] },
        data_colors() { return this.clrx }
    },
    computed: {
        line_width() {
            return this.sett.lineWidth || 0.75
        },
        widths() {
            return this.sett.lineWidths || []
        },
        clrx() {
            let colors = this.sett.colors || []
            let n = this.$props.num
            if (!colors.length) {
                for (let i = 0; i < this.lines_num; i++) {
                    colors.push(Const.OVERLAY_COLORS[(n + i) % 5])
                }
            }
            return colors
        },
        lines_num() {
            if (!this.$props.data[0]) return 0
            return this.$props.data[0].length - 1
        },
        skip_nan() {
            return this.sett.skipNaN
        }
    }
}
</script>
