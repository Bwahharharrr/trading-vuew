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

            ctx.beginPath()
            ctx.lineWidth = 1
            ctx.strokeStyle = 'white'
            ctx.moveTo(layout.t2screen(this.$props.data[0][0]), layout.$2screen(this.$props.data[0][1]))
            let lastY = layout.$2screen(this.$props.data[0][1])

            for (var i = i0; i < this.data.length; i++) {
                let p = this.data[i]
                let x = layout.t2screen(p[0])
                let y = layout.$2screen(p[1])
                ctx.lineTo(x, lastY)
                ctx.lineTo(x, y)
                lastY = y
            }
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

                if (p[2] == 0) {
                    if (i != 0) {
                        if (this.data[i-1][2] != 0) {
                            ctx.lineTo(x, y)
                        } else {
                            ctx.moveTo(x, lastYY)
                        }
                    } else {
                        ctx.moveTo(x, lastYY)
                    }
                } else {
                    ctx.lineTo(x, lastYY)
                    ctx.lineTo(x, y)
                }
                lastYY = y
            }
            ctx.stroke()
        },
        use_for() { return ['Balance'] }
    },
    computed: {}
}
