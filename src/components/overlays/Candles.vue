<script>
// Renedrer for candlesticks + volume (optional)
// It can be used as the main chart or an indicator
// PERFORMANCE: Uses static draw functions instead of creating objects per candle

import Overlay from '../../mixins/overlay.js'
import { layout_cnv_cached } from '../js/layout_cnv.js'
import { drawCandles, drawVolbars } from '../primitives/candle-draw.js'
import Price from '../primitives/price.js'

export default {
    name: 'Candles',
    mixins: [Overlay],
    methods: {
        meta_info() {
            return { author: 'C451', version: '1.2.1' }
        },
        init() {
            this._init_price()
        },
        // Create-ONCE: on a runtime add, Grid draws the overlay BEFORE init()
        // runs (overlay.js mounted() emits new-grid-layer at line ~28; init()
        // runs at ~49; Grid.new_layer renders synchronously) — draw() then hit
        // the data() placeholder ({}.draw is not a function). Lazy-create from
        // draw, and NEVER re-create: Price registers its sidebar shader on
        // first draw, so replacing the instance would register a duplicate
        // (the M29 PriceAlarms bug class).
        _init_price() {
            if (!(this.price && this.price.draw)) this.price = new Price(this)
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
            // Else, as offchart / onchart indicator. The main pane caches its
            // geometry in layout.js; the indicator path rebuilt ~2*N objects
            // every frame — memoize it per-overlay-instance on a layout
            // fingerprint (see layout_cnv_cached).
            } else {
                if (!this._cnvCache) this._cnvCache = { key: '', val: null }
                cnv = layout_cnv_cached(this, this._cnvCache)
            }

            // PERFORMANCE: color-batched array draws (one state-set + one path
            // per resolved colour) instead of per-candle state churn. Volume
            // UNDER candles; pixel-identical to the per-item draw (only the
            // order of non-overlapping same-colour draws changes).
            if (this.show_volume) {
                drawVolbars(ctx, cnv.volume, this, this.$props.layout.height)
            }

            drawCandles(ctx, cnv.candles, this)

            if (this.price_line) {
                this._init_price()   // pre-init draw (runtime add) — see above
                this.price.draw(ctx)
            }
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
