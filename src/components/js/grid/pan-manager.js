// Pan/drag handling with momentum animation

import FrameAnimation from '../../../stuff/frame.js'
import Utils from '../../../stuff/utils.js'
import math from '../../../stuff/math.js'

export default class PanManager {
    constructor(grid) {
        this.grid = grid
        this.fade = null
    }

    get range() { return this.grid.range }
    get layout() { return this.grid.layout }
    get comp() { return this.grid.comp }
    get $p() { return this.grid.$p }
    get id() { return this.grid.id }

    mousedrag(x, y) {
        const drug = this.grid.drug
        if (!drug) return

        let dt = drug.t * (drug.x - x) / this.layout.width

        let d$ = this.layout.$_hi - this.layout.$_lo
        d$ *= (drug.y - y) / this.layout.height
        let offset = drug.o + d$

        let ls = this.layout.grid.logScale

        // `range` is consumed by the sidebar-transform emit below, so it must
        // live at function scope — declaring it inside the `if` made the
        // `range || drug.y_r` reference throw in log-scale pans.
        let range
        if (ls && drug.y_r) {
            let dy = drug.y - y
            range = drug.y_r.slice()
            range[0] = math.exp((0 - drug.B + dy) / this.layout.A)
            range[1] = math.exp((this.layout.height - drug.B + dy) / this.layout.A)
        }

        if (drug.y_r && this.$p.y_transform && !this.$p.y_transform.auto) {
            this.comp.$emit('sidebar-transform', {
                grid_id: this.id,
                range: ls ? (range || drug.y_r) : [
                    drug.y_r[0] - offset,
                    drug.y_r[1] - offset,
                ]
            })
        }

        this.range[0] = drug.r[0] + dt
        this.range[1] = drug.r[1] + dt

        this.grid.change_range()
    }

    pan_fade(event) {
        const drug = this.grid.drug
        if (!drug) return

        let dt = Utils.now() - drug.t0
        let dx = this.range[1] - drug.r[1]
        let v = 42 * dx / dt
        let v0 = Math.abs(v * 0.01)

        if (dt > 500) return

        if (this.fade) this.fade.stop()

        this.fade = new FrameAnimation(self => {
            v *= 0.85
            if (Math.abs(v) < v0) {
                self.stop()
            }
            this.range[0] += v
            this.range[1] += v
            this.grid.change_range()
        })
    }

    stopFade() {
        if (this.fade) this.fade.stop()
    }

    destroy() {
        if (this.fade) this.fade.stop()
        this.fade = null
    }
}
