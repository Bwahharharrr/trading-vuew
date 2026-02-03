import Overlay from '../../mixins/overlay.js'

export default {
    name: 'TradeHistory',
    mixins: [Overlay],
    methods: {
        draw(ctx) {
            let layout = this.$props.layout
            ctx.lineWidth = 1
            ctx.strokeStyle = 'white'

            for (var i in this.$props.data) {
                let p = this.$props.data[i]

                ctx.fillStyle = p[5] === 'buy' ? this.buy_color : this.sell_color
                ctx.beginPath()
                let x = layout.t2screen(p[0])
                let y = layout.$2screen(p[2])

                const size = layout.px_step / 5
                const x05 = Math.floor(x - size) - 0.5
                const w = Math.max(size * 2, 8)
                const h = Math.max(size * 1, 8)
                ctx.moveTo(x05, y)
                ctx.lineTo(x05 - w, y - h)
                ctx.lineTo(x05 - w, y + h)
                ctx.lineTo(x05, y)
                ctx.lineTo(x, y)
                ctx.fill()
                ctx.stroke()
            }
        },
        use_for() { return ['TradeHistory'] }
    },
    computed: {}
}
