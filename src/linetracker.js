import { Overlay } from 'trading-vue-js'

export default {
    name: 'LineTracker',
    mixins: [Overlay],
    methods: {
        draw(ctx) {
            if (!this.data.length) return

            let layout = this.$props.layout // Layout object (see API BOOK)

            for (var i = 0; i < this.data.length; i++) {
                if (i == 0) { continue }

                try {
                    let c = this.$props.data[i];
                    let nxt = this.$props.data[i + 1];

                    if (c[1] == null) {
                        continue;
                    }

                    // x coordinate
                    let x = layout.t2screen(c[0] + (this.$props.interval * this.offset));
                    let x2 = layout.t2screen(c[0] + (this.$props.interval * (this.offset + 1)));
                    let width = x2 - x;
                    let half = width / 2;

                    if (Array.isArray(c[1])) {
                        c[1].forEach((price) => {
                            // Y coordinate
                            let y = layout.$2screen(price);

                            ctx.beginPath();
                            ctx.moveTo(x - half, y);
                            ctx.lineTo(x + half, y);
                            ctx.strokeStyle = this.linecolor;
                            ctx.lineWidth = 2;
                            ctx.stroke();
                        });
                    } else {
                        // Y coordinate
                        let y = layout.$2screen(c[1])
                        let y1 = layout.$2screen(nxt[1])

                        ctx.beginPath()
                        ctx.moveTo( x-half, y )
                        ctx.lineTo(x + half , y)
                        if (this.linkLines && nxt[1] !== null) {
                            ctx.lineTo(x + half,y1)
                        }

                        ctx.strokeStyle = this.linecolor
                        ctx.lineWidth = 2
                        ctx.stroke()
                    }

                } catch (e) {
                }
            }
        },
        use_for() { return ['LineTracker'] }
    },
    // Define internal setting & constants here
    computed: {
        sett() {
            return this.$props.settings;
        },
        linecolor() {
            return this.sett.linecolor || '#FFFFFF';
        },
        offset() {
            return this.sett.offset || 0;
        },
        linkLines() {
            return !!this.sett.linkLines;
        }
    }
}

