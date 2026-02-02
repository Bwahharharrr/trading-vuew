// Zoom handling: wheel zoom, pinch zoom, trackpad scroll

import Utils from '../../../stuff/utils.js'

export default class ZoomManager {
    constructor(grid) {
        this.grid = grid
    }

    get range() { return this.grid.range }
    get data() { return this.grid.data }
    get layout() { return this.grid.layout }
    get interval() { return this.grid.interval }
    get canvas() { return this.grid.canvas }
    get comp() { return this.grid.comp }
    get $p() { return this.grid.$p }
    get id() { return this.grid.id }

    mousezoom(delta, event) {
        const wmode = this.grid.wmode

        if (wmode !== 'pass') {
            if (wmode === 'click' && !this.$p.meta.activated) {
                return
            }
            event.originalEvent.preventDefault()
            event.preventDefault()
        }

        event.deltaX = event.deltaX || Utils.get_deltaX(event)
        event.deltaY = event.deltaY || Utils.get_deltaY(event)

        if (Math.abs(event.deltaX) > 0) {
            this.grid.trackpad = true
            if (Math.abs(event.deltaX) >= Math.abs(event.deltaY)) {
                delta *= 0.1
            }
            this.trackpad_scroll(event)
        }

        if (this.grid.trackpad) delta *= 0.032

        delta = Utils.smart_wheel(delta)

        if (delta < 0 && this.data.length <= this.grid.MIN_ZOOM) return
        if (delta > 0 && this.data.length > this.grid.MAX_ZOOM) return

        let k = this.interval / 1000
        let diff = delta * k * this.data.length
        let tl = this.comp.config.ZOOM_MODE === 'tl'

        if (event.originalEvent.ctrlKey || tl) {
            let offset = event.originalEvent.offsetX
            let diff1 = offset / (this.canvas.width - 1) * diff
            let diff2 = diff - diff1
            this.range[0] -= diff1
            this.range[1] += diff2
        } else {
            this.range[0] -= diff
        }

        if (tl) {
            let offset = event.originalEvent.offsetY
            let diff1 = offset / (this.canvas.height - 1) * 2
            let diff2 = 2 - diff1
            let z = diff / (this.range[1] - this.range[0])
            this.comp.$emit('rezoom-range', {
                grid_id: this.id, z, diff1, diff2
            })
        }

        this.grid.change_range()
    }

    pinchzoom(scale) {
        const pinch = this.grid.pinch
        if (!pinch) return

        if (scale > 1 && this.data.length <= this.grid.MIN_ZOOM) return
        if (scale < 1 && this.data.length > this.grid.MAX_ZOOM) return

        let t = pinch.t
        let nt = t * 1 / scale

        this.range[0] = pinch.r[0] - (nt - t) * 0.5
        this.range[1] = pinch.r[1] + (nt - t) * 0.5

        this.grid.change_range()
    }

    trackpad_scroll(event) {
        let dt = this.range[1] - this.range[0]

        this.range[0] += event.deltaX * dt * 0.011
        this.range[1] += event.deltaX * dt * 0.011

        this.grid.change_range()
    }
}
