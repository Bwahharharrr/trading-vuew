import { Overlay } from 'trading-vue-js'

export default {
    name: 'Balance',
    mixins: [Overlay],
    methods: {
        draw(ctx) {
            if (!this.data.length) return
            for (var i0 = 0; i0 < this.data.length; i0++) {
                if (typeof this.data[i0][1] === 'number') break
            }

            const layout = this.$props.layout
            let x0 = layout.t2screen( this.$props.data[0][0] )
            let y0 = layout.t2screen( this.$props.data[0][1] )
            let xN = layout.t2screen( this.$props.data[this.$props.data.length-1][0] )
            let yN = y0

            //let top = layout.$2screen(1)
            //let mid = layout.$2screen(0.5)
            //let bot = layout.$2screen(0)
            // let bot = layout.$2screen(0)

            // #let startY = layout.$2screen( this.$props.data[0][1] )
            ctx.beginPath()
            //var grd = ctx.createLinearGradient(this.$props.data[0][0], layout.height, 0, 0)
            // grd.addColorStop(0, "#2f74ed22")
            //grd.addColorStop(1, "#2f74ed00")
            // ctx.fillStyle = grd
            ctx.lineWidth = 1
            ctx.strokeStyle = 'white'
            // ctx.moveTo(x0, y0)
            // ctx.moveTo( layout.t2screen(this.$props.data[0][0]), layout.$2screen(this.$props.data[this.$props.data.length-1][1]) )
            ctx.moveTo( layout.t2screen(this.$props.data[0][0]), layout.$2screen(this.$props.data[0][1]) )
            let lastY = y0

            for (var i = i0; i < this.data.length; i++) {
                let p = this.data[i]
                let x = layout.t2screen(p[0])
                let y = layout.$2screen(p[1])
                //ctx.moveTo(y, y)
                ctx.lineTo(x, lastY)
                ctx.lineTo(x, y)

                let lastY = y

            }
            // ctx.lineTo(xN, yN)
            // ctx.fill()
            ctx.stroke()

            ctx.beginPath()
            ctx.lineWidth = 1
            ctx.strokeStyle = 'yellow'

            let x = layout.t2screen(this.data[0][0])
            let lastYY = layout.$2screen(this.data[this.data.length-1][1])
            ctx.moveTo(x, lastYY)

            for (var i = i0; i < this.data.length; i++) {
                let p = this.data[i]
                let x = layout.t2screen(p[0])
                let y = layout.$2screen(p[1]+p[2])

                if ( p[2] == 0 ) { 
                    if (i != 0) {
                        if (this.data[i-1][2] != 0) {
                            ctx.lineTo(x, y)
                        } 
                        else { 
                            ctx.moveTo(x, lastYY)
                        }
                    }
                    else { 
                        ctx.moveTo(x, lastYY)
                    }
                } else { 
                    ctx.lineTo(x, lastYY)
                    ctx.lineTo(x, y)
                }
                let lastYY = y

            }
            ctx.stroke()

          

/*
            var grd = ctx.createLinearGradient(0, layout.height, 0, 0)
            grd.addColorStop(0, "#2f74ed22")
            grd.addColorStop(0.5, "#2f74ed00")
            ctx.fillStyle = grd
            
            ctx.lineWidth = 1
            ctx.strokeStyle = 'white'

            ctx.beginPath()
            ctx.moveTo(x0, startY)
            ctx.lineTo(xN,startY)
            ctx.fill()

            /*
            
            ctx.lineWidth = 2
            ctx.strokeStyle = 'yellow'
            ctx.beginPath()

            for (var i in this.$props.data) {
                let el = this.$props.data[i] 
                let x = layout.t2screen(el[0])
                let y = layout.$2screen(el[1])
                ctx.lineTo(x,y)
            }


            ctx.stroke()
            

            //let xN = layout.t2screen(this.data[this.data.length-1][0])
            // let bot = layout.$2screen(0)
            //ctx.moveTo(x0, bot)
            //ctx.beginPath()
            //ctx.lineTo(xN, bot)
/*
            ctx.fillStyle = grd

            let x0 = layout.t2screen(this.data[i0][0])
            let xN = layout.t2screen(this.data[this.data.length-1][0])
            let top = layout.$2screen(1)
            let mid = layout.$2screen(0.5)
            let bot = layout.$2screen(0)
/*
            ctx.strokeStyle = 'white'

            ctx.moveTo(x0, bot)
            ctx.beginPath()
            ctx.lineTo(xN, bot)
            ctx.fill()
           */


/*
            for (var i in this.$props.data) {

                let p = this.$props.data[i]

                let x = layout.t2screen(p[0])
                let y = layout.$2screen(p[1])
                const amt = p[2]

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
        },
        use_for() { return ['Balance'] }
    },
    // Define internal setting & constants here
    computed: {
    }
}
