import Overlay from '../../mixins/overlay.js'

export default {
    name: 'BuysAndSells',
    mixins: [Overlay],
    methods: {
        draw(ctx) {
            let layout = this.$props.layout

            for (let p of this.$props.data) {
                let x = layout.t2screen(p[0])
                let y = layout.$2screen(p[1])
                const amt = p[2]

                ctx.strokeStyle = 'white'
                ctx.fillStyle = amt > 0 ? '#1EFF00' : '#FF002F'
                ctx.lineWidth = 2
                ctx.beginPath()
                ctx.arc(x, y, 5.5, 0, Math.PI * 2, true)
                ctx.fill()
                ctx.stroke()
            }
        },
        use_for() { return ['BuysAndSells'] }
    },
    computed: {}
}
