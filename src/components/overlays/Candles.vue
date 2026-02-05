<script>
// Renedrer for candlesticks + volume (optional)
// It can be used as the main chart or an indicator
// PERFORMANCE: Uses static draw functions instead of creating objects per candle

import Overlay from '../../mixins/overlay.js'
import { layout_cnv } from '../js/layout_cnv.js'
import { drawCandle, drawVolbar } from '../primitives/candle-draw.js'
import Price from '../primitives/price.js'

export default {
    name: 'Candles',
    mixins: [Overlay],
    methods: {
        meta_info() {
            return { author: 'C451', version: '1.2.1' }
        },
        init() {
            this.price = new Price(this)
        },
        draw(ctx) {
            const isMainChart = this.$props.sub === this.$props.data
            // If data === main candlestick data
            // render as main chart:
            let cnv
            if (isMainChart) {
                cnv = {
                    candles: this.$props.layout.candles,
                    volume: this.$props.layout.volume,
                }
            // Else, as offchart / onchart indicator:
            } else {
                cnv = layout_cnv(this)
            }

            // PERFORMANCE: Use static draw functions instead of creating new objects
            // This eliminates GC pressure from creating 1000+ objects per frame
            if (this.show_volume) {
                let cv = cnv.volume
                const layoutHeight = this.$props.layout.height
                for (let i = 0, n = cv.length; i < n; i++) {
                    drawVolbar(ctx, cv[i], this, layoutHeight)
                }
            }

            let cc = cnv.candles
            for (let i = 0, n = cc.length; i < n; i++) {
                drawCandle(ctx, cc[i], this)
            }

            if (this.price_line) this.price.draw(ctx)
        },
        use_for() { return ['Candles'] },

        // In case it's added as offchart overlay
        y_range() {
            let hi = -Infinity, lo = Infinity
            for (let i = 0, n = this.$props.sub.length; i < n; i++) {
                let x = this.$props.sub[i]
                if (x[2] > hi) hi = x[2]
                if (x[3] < lo) lo = x[3]
            }
            return [hi, lo]
        }
    },

    // Define internal setting & constants here
    computed: {
        show_volume() {
            return 'showVolume' in this.sett ?
                this.sett.showVolume : true
        },
        price_line() {
            return 'priceLine' in this.sett ?
                this.sett.priceLine : true
        },
        colorCandleUp() {
            return this.sett.colorCandleUp ||
            this.$props.colors.candleUp
        },
        colorCandleDw() {
            return this.sett.colorCandleDw ||
            this.$props.colors.candleDw
        },
        colorWickUp() {
            return this.sett.colorWickUp ||
            this.$props.colors.wickUp
        },
        colorWickDw() {
            return this.sett.colorWickDw ||
            this.$props.colors.wickDw
        },
        colorWickSm() {
            return this.sett.colorWickSm ||
            this.$props.colors.wickSm
        },
        colorVolUp() {
            return this.sett.colorVolUp ||
            this.$props.colors.volUp
        },
        colorVolDw() {
            return this.sett.colorVolDw ||
            this.$props.colors.volDw
        }
    },
    data() {
        return { price: {} }
    }

}
</script>
