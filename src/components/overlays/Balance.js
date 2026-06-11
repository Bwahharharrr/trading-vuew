import Overlay from '../../mixins/overlay.js'

export default {
    name: 'Balance',
    mixins: [Overlay],
    methods: {
        draw(ctx) {
            if (!this.data.length) return
            if (this._balData !== this.data) {
                let i0 = 0
                for (; i0 < this.data.length; i0++) {
                    if (typeof this.data[i0][1] === 'number') break
                }
                this._balData = this.data
                this._balFirst = i0
            }
            var i0 = this._balFirst

            const layout = this.$props.layout

            ctx.beginPath()
            ctx.lineWidth = 1
            ctx.strokeStyle = 'white'
            // anchor at the first NUMERIC point (i0 was computed exactly to
            // skip a null prefix; anchoring at data[0] drew a phantom line
            // from the 0-price level)
            const a = this.data[i0] || this.data[0]
            ctx.moveTo(layout.t2screen(a[0]), layout.$2screen(a[1]))
            let lastY = layout.$2screen(a[1])

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
