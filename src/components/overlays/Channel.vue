<script>
// Channel renderer. (Keltner, Bollinger)

import Overlay from '../../mixins/overlay.js'
import CanvasDrawing from '../../mixins/canvas-drawing.js'
import Const from '../../stuff/constants.js'

export default {
    name: 'Channel',
    mixins: [Overlay, CanvasDrawing],
    methods: {
        meta_info() {
            return { author: 'C451', version: '1.0.1' }
        },
        draw(ctx) {
            const data = this.$props.data

            // Background fill between top (index 1) and bottom (index 3)
            ctx.fillStyle = this.back_color
            this.drawBandFill(ctx, data, 1, 3)

            // Lines
            this.setupStroke(ctx, this.line_width, this.color)

            // Top line (index 1)
            ctx.beginPath()
            this.drawDataLine(ctx, data, 1, false)
            ctx.stroke()

            // Bottom line (index 3)
            ctx.beginPath()
            this.drawDataLine(ctx, data, 3, false)
            ctx.stroke()

            // Middle line (index 2) - optional
            if (this.show_mid) {
                ctx.beginPath()
                this.drawDataLine(ctx, data, 2, false)
                ctx.stroke()
            }
        },
        use_for() { return ['Channel', 'KC', 'BB'] },
        data_colors() { return [this.color, this.color, this.color] }
    },
    computed: {
        line_width() {
            return this.sett.lineWidth || 0.75
        },
        color() {
            const n = this.$props.num % 5
            return this.sett.color || Const.OVERLAY_COLORS[n]
        },
        show_mid() {
            return 'showMid' in this.sett ? this.sett.showMid : true
        },
        back_color() {
            return this.sett.backColor || this.color + '11'
        }
    }
}
</script>
