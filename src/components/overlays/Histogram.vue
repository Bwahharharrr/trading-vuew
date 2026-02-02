<script>
// Histogram renderer - draws values as histogram bars
// Uses wider bars (0.8 ratio) with baseline extension

import Overlay from '../../mixins/overlay.js'
import BarChartBase from '../../mixins/bar-chart-base.js'

export default {
    name: 'Histogram',
    mixins: [Overlay, BarChartBase],
    methods: {
        use_for() { return ['Histogram'] }
    },
    computed: {
        colorUp() {
            return this.sett.colorUp || this.sett.color || '#26A69A'
        },
        bar_width_ratio() {
            return this.sett.barWidth || 0.8
        }
    }
}
</script>
