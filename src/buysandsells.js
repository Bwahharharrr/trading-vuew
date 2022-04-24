import { Overlay } from 'trading-vue-js'

export default {
    name: 'BuysAndSells',
    mixins: [Overlay],
    methods: {
        draw(ctx) {
            let layout = this.$props.layout // Layout object (see API BOOK)
            // ctx.lineWidth = 1
            // ctx.strokeStyle = 'black'

            for (var i in this.$props.data) {

                let p = this.$props.data[i]

                let x = layout.t2screen(p[0])
                let y = layout.$2screen(p[1])
                const amt = p[2]

                ctx.strokeStyle = 'white'
                if (amt > 0) {
                    ctx.fillStyle = '#1EFF00'
                } else { 
                    ctx.fillStyle = '#FF002F'
                }
                //this.draw_circle(ctx, x, y)
                ctx.lineWidth = 2
                ctx.beginPath()
                ctx.arc(x, y, 5 + 0.5, 0, Math.PI * 2, true)
                ctx.fill()
                ctx.stroke()

             

                /*
                ctx.fillStyle = p[5] === 'buy' ? this.buy_color : this.sell_color
                ctx.beginPath()
                let x = layout.t2screen(p[0]) // x - Mapping
                let y = layout.$2screen(p[2]) // y - Mapping
                //y = layout.$2screen(high) // y - Mapping

                const size = layout.px_step / 5;// this.marker_size;
                const x05 = Math.floor(x - size) - 0.5;
                const w = Math.max(size * 2, 8);
                const h = Math.max(size * 1, 8);
                ctx.moveTo(x05, y)
                ctx.lineTo(x05 - w, y - h)
                ctx.lineTo(x05 - w, y + h)
                ctx.lineTo(x05, y)
                ctx.lineTo(x, y)
                ctx.fill()
                ctx.stroke()

                // label
                // const msg = `${p[5]} ${p[1].toFixed(3)}\n${p[6].toFixed(3)} BTC\n$ ${p[7].toFixed(0)}`;
                const msg = 'test'
                ctx.fillStyle = '#555'
                ctx.font = '12px Arial'
                ctx.textAlign = 'center'
                ctx.fillText(`${p[5]} ${p[1].toFixed(3)}`, x, y - 100)
                ctx.fillText(`${p[6].toFixed(3)} BTC`, x, y - 85)
                ctx.fillText(`$ ${p[7].toFixed(0)}`, x, y - 70)
                ctx.fillText(`Equity: ${p[8].toFixed(3)}`, x, y - 55)

                // If this is a SELL, draw the profit
                if (this.show_label && p[1] === 0 && prev) {
                    let profit = p[2] / prev[2] - 1
                    const col = profit > 0 ? this.buy_color : this.sell_color
                    ctx.strokeStyle = col;
                    ctx.lineWidth = 2;
                    ctx.beginPath()
                    ctx.moveTo(x, y)

                    let px = layout.t2screen(prev[0]) // x - Mapping
                    let py = layout.$2screen(prev[2]) // y - Mapping
                    ctx.lineTo(px, py)
                    ctx.stroke()
                }
                */ 
            }
        },
        use_for() { return ['BuysAndSells'] }
    },
    // Define internal setting & constants here
    computed: {
    }
}
