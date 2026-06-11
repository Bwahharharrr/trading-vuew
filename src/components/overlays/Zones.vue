<script>
// Zone renderer - draws filled rectangles (support/resistance zones)
// Data format: each data point is [timestamp, y1, y2, x2, color]
// where timestamp (index 0) is x1 (used by Trading-Vue for time filtering),
// y1/y2 are price levels, x2 is the right edge timestamp, color is fill color.
//
// This layout ensures Trading-Vue's fast_filter includes zones whose x1
// falls within the visible range. For zones that start before the view
// but extend into it, we also check settings.zones as a fallback.

import Overlay from '../../mixins/overlay.js'

export default {
    name: 'Zones',
    mixins: [Overlay],
    methods: {
        meta_info() {
            return { author: 'qb', version: '1.0.0' }
        },
        draw(ctx) {
            const layout = this.$props.layout

            // Draw from data (time-filtered by Trading-Vue)
            this.$props.data.forEach((p) => {
                if (p.length < 5) return
                this._drawZone(ctx, layout, p[0], p[1], p[3], p[2], p[4])
            })

            // Also draw from settings.zones (not filtered, for zones spanning ranges).
        // NB: settings.zones uses a DIFFERENT element order than data —
        // [x1, y1, x2, y2, color] — because ws-manager._wsHandleAlert converts
        // on write (see its push: [z[0], z[1], z[3], z[2], z[4]]). Do not
        // "align" these two paths without changing the producer too.
            const extra = this.sett.zones || []
            extra.forEach((p) => {
                this._drawZone(ctx, layout, p[0], p[1], p[2], p[3], p[4])
            })
        },

        _drawZone(ctx, layout, x1_ts, y1_price, x2_ts, y2_price, color) {
            let x1 = layout.t2screen(x1_ts)
            let y1 = layout.$2screen(y1_price)
            let x2 = layout.t2screen(x2_ts)
            let y2 = layout.$2screen(y2_price)
            color = color || this.default_color

            let left = Math.min(x1, x2)
            let right = Math.max(x1, x2)
            // Ensure minimum 2px width for very narrow zones
            if (right - left < 2) right = left + 2

            // Skip if entirely off-screen
            if (right < 0 || left > layout.width) return

            ctx.fillStyle = color
            ctx.fillRect(
                left,
                Math.min(y1, y2),
                right - left,
                Math.abs(y2 - y1)
            )
        },

        use_for() { return ['Zones'] },
        data_colors() { return [this.default_color] }
    },
    computed: {
        default_color() {
            return this.sett.color || '#FF000020'
        }
    },
    data() {
        return {}
    }
}
</script>
