<script>
// StepLine renderer - draws values as a step/stair pattern
// Horizontal line at each value, vertical line to next value

import Overlay from '../../mixins/overlay.js'

export default {
    name: 'StepLine',
    mixins: [Overlay],
    methods: {
        meta_info() {
            return { author: 'Custom', version: '1.0.0' }
        },
        draw(ctx) {
            ctx.lineWidth = this.line_width
            ctx.strokeStyle = this.color
            ctx.beginPath()

            const layout = this.$props.layout
            const data = this.$props.data
            const i = this.data_index

            if (data.length < 1) return

            let prevX = null
            let prevY = null

            for (var k = 0, n = data.length; k < n; k++) {
                let p = data[k]
                let x = layout.t2screen(p[0])
                let y = layout.$2screen(p[i])

                if (p[i] == null || y !== y) {
                    prevX = null
                    prevY = null
                    continue
                }

                if (prevX !== null && prevY !== null) {
                    // Draw horizontal line from prev point to current x
                    ctx.lineTo(x, prevY)
                    // Draw vertical line to current y
                    ctx.lineTo(x, y)
                } else {
                    ctx.moveTo(x, y)
                }

                prevX = x
                prevY = y
            }
            ctx.stroke()
        },
        use_for() { return ['StepLine'] },
        data_colors() { return [this.color] },
        // Calculate y-range for offchart display
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
            return this.sett.color || this.COLORS[n]
        },
        data_index() {
            return this.sett.dataIndex || 1
        }
    },
    data() {
        return {
            COLORS: [
                '#42b28a', '#5691ce', '#612ff9',
                '#d50b90', '#ff2316'
            ]
        }
    }
}
</script>
