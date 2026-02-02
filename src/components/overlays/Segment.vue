<script>
// Segment renderer - draws a line between two points

import Overlay from '../../mixins/overlay.js'
import CanvasDrawing from '../../mixins/canvas-drawing.js'
import Const from '../../stuff/constants.js'

export default {
    name: 'Segment',
    mixins: [Overlay, CanvasDrawing],
    methods: {
        meta_info() {
            return { author: 'C451', version: '1.0.0' }
        },
        draw(ctx) {
            if (!this.p1 || !this.p2) return

            this.setupStroke(ctx, this.line_width, this.color)
            ctx.beginPath()

            let [x1, y1] = this.pointToScreen(this.p1)
            let [x2, y2] = this.pointToScreen(this.p2)

            ctx.moveTo(x1, y1)
            ctx.lineTo(x2, y2)
            ctx.stroke()
        },
        use_for() { return ['Segment'] },
        data_colors() { return [this.color] }
    },
    computed: {
        p1() {
            return this.$props.settings.p1
        },
        p2() {
            return this.$props.settings.p2
        },
        line_width() {
            return this.sett.lineWidth || 0.9
        },
        color() {
            const n = this.$props.num % 5
            return this.sett.color || Const.OVERLAY_COLORS[n]
        }
    }
}
</script>
