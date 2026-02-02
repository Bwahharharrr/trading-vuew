// Shared mixin for bar-chart style overlays (Histogram, Bar)
// Draws values as vertical bars from a baseline

export default {
    methods: {
        meta_info() {
            return { author: 'Custom', version: '1.0.0' }
        },
        draw(ctx) {
            const layout = this.$props.layout
            const data = this.$props.data
            const i = this.data_index
            const baseline = this.baseline

            if (data.length < 1) return

            const barWidth = Math.max(1, layout.px_step * this.bar_width_ratio)

            for (var k = 0, n = data.length; k < n; k++) {
                let p = data[k]
                if (p[i] == null) continue

                let x = layout.t2screen(p[0])
                let y = layout.$2screen(p[i])
                let y0 = layout.$2screen(baseline)

                let isPositive = p[i] >= baseline
                ctx.fillStyle = isPositive ? this.colorUp : this.colorDown

                let barX = x - barWidth / 2
                let barY = Math.min(y, y0)
                let barHeight = Math.abs(y - y0) || 1

                ctx.fillRect(barX, barY, barWidth, barHeight)
            }
        },
        data_colors() { return [this.colorUp, this.colorDown] },
        legend(values) {
            let val = values[this.data_index]
            let isPositive = val >= this.baseline
            return [{
                value: val,
                color: isPositive ? this.colorUp : this.colorDown
            }]
        },
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
            let baseline = this.baseline
            if (baseline < min) min = baseline
            if (baseline > max) max = baseline
            let pad = (max - min) * 0.1 || 1
            return [max + pad, min - pad]
        }
    },
    computed: {
        colorDown() {
            return this.sett.colorDown || '#EF5350'
        },
        baseline() {
            return this.sett.baseline || 0
        },
        data_index() {
            return this.sett.dataIndex || 1
        }
    },
    data() {
        return {}
    }
}
