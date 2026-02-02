<script>
// Bar renderer - draws each value as an individual thin bar
// Uses thinner bars (0.4 ratio) by default

import Overlay from '../../mixins/overlay.js'
import BarChartBase from '../../mixins/bar-chart-base.js'

export default {
    name: 'Bar',
    mixins: [Overlay, BarChartBase],
    methods: {
        use_for() { return ['Bar'] }
    },
    computed: {
        colorUp() {
            return this.sett.colorUp || this.sett.color || '#612ff9'
        },
        bar_width_ratio() {
            return this.sett.barWidth || 0.4
        }
    }
}
</script>
