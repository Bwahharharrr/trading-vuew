
import Const from '../../stuff/constants.js'
import Utils from '../../stuff/utils.js'
import { loadGestures } from '../../stuff/gestures.js'

const { MINUTE15, MINUTE, HOUR, DAY, WEEK, MONTH, YEAR, MONTHMAP } = Const

// PERFORMANCE: Cache for measureText results - avoids expensive canvas text measurement
const measureTextCache = new Map()
const MAX_CACHE_SIZE = 100

export default class Botbar {

    constructor(canvas, comp, canvasDynamic = null) {

        this.canvas = canvas
        this.canvasDynamic = canvasDynamic
        this.ctx = canvas.getContext('2d')
        this.comp = comp
        this.$p = comp.$props
        this.data = this.$p.sub
        this.range = this.$p.range
        this.layout = this.$p.layout

        const config = comp.$props.config || {}
        this.MIN_ZOOM = config.MIN_ZOOM || 25
        this.MAX_ZOOM = config.MAX_ZOOM || 100000
        this._destroyed = false
        this.listeners()

    }

    // PERFORMANCE: Cached measureText to avoid repeated canvas text measurement
    measureTextCached(text) {
        const font = this.ctx.font
        const key = `${font}|${text}`

        if (measureTextCache.has(key)) {
            return measureTextCache.get(key)
        }

        // Evict oldest entries if cache is too large
        if (measureTextCache.size >= MAX_CACHE_SIZE) {
            const firstKey = measureTextCache.keys().next().value
            measureTextCache.delete(firstKey)
        }

        const result = this.ctx.measureText(text)
        measureTextCache.set(key, result.width)
        return result.width
    }

    async listeners() {
        const { Hammer, Hamster } = await loadGestures()
        if (this._destroyed) return // unmounted while gestures were loading
        let eventTarget = this.canvasDynamic || this.canvas
        this.hm = Hamster(eventTarget)
        // Throttle wheel events to ~60fps
        this._throttledWheel = Utils.rafThrottle((delta, event) => {
            this.mousezoom(-delta * 50, event)
        })
        this.hm.wheel((event, delta) => this._throttledWheel(delta, event))

        // X-axis drag-to-scale: a horizontal drag zooms the TIME range about
        // the anchor where the drag started (mirrors Sidebar's Y-axis pan).
        let mc = this.mc = new Hammer.Manager(eventTarget)
        mc.add(new Hammer.Pan({
            direction: Hammer.DIRECTION_HORIZONTAL,
            threshold: 0
        }))

        mc.on('panstart', event => {
            this.drug = {
                x: event.center.x,
                r: this.range.slice()
            }
        })

        // Throttle panmove for smoother drag performance
        this._throttledPanmove = Utils.rafThrottle(event => {
            if (this.drug) this.pandrag(event)
        })
        mc.on('panmove', event => this._throttledPanmove(event))

        mc.on('panend', () => {
            this.drug = null
        })
    }

    // Map a horizontal drag into a symmetric zoom of the time range, anchored
    // on the position where the drag began. Dragging left expands (zoom out),
    // dragging right compresses (zoom in) the visible range. Emits the same
    // 'botbar-zoom' event as wheel zoom so Chart.vue consumes it identically.
    pandrag(event) {
        let width = this.layout.botbar.width
        if (!width) return
        // No detected interval (≤1 candle) → the MIN/MAX span clamps below would
        // collapse to a zero-width range. Skip the gesture rather than emit one.
        if (!this.$p.interval) return

        let r = this.drug.r
        let span = r[1] - r[0]

        // Normalised drag distance: full half-width drag ~= one full zoom step.
        let dx = event.center.x - this.drug.x
        let k = dx / (width * 0.5)
        // Clamp the per-gesture factor so a fast drag can't invert the range.
        let factor = Utils.clamp(1 + k, 0.1, 10)

        // Anchor the zoom on the gesture's start x (in time coordinates) so the
        // bar under the cursor stays put while the rest scales around it.
        let anchorFrac = this.drug.x / width
        let anchorT = r[0] + span * anchorFrac
        let newSpan = span / factor

        let newRange = [
            anchorT - newSpan * anchorFrac,
            anchorT + newSpan * (1 - anchorFrac)
        ]

        // Respect the same bar-count limits as wheel zoom (MIN/MAX_ZOOM are in
        // bars; convert to a time span via the interval).
        let interval = this.$p.interval
        let minSpan = this.MIN_ZOOM * interval
        let maxSpan = this.MAX_ZOOM * interval
        let resultSpan = newRange[1] - newRange[0]
        if (resultSpan < minSpan) {
            newRange = [
                anchorT - minSpan * anchorFrac,
                anchorT + minSpan * (1 - anchorFrac)
            ]
        } else if (resultSpan > maxSpan) {
            newRange = [
                anchorT - maxSpan * anchorFrac,
                anchorT + maxSpan * (1 - anchorFrac)
            ]
        }

        this.range[0] = newRange[0]
        this.range[1] = newRange[1]

        this.comp.$emit('botbar-zoom', this.range)
    }

    mousezoom(delta, event) {
        event.originalEvent.preventDefault()
        event.preventDefault()

        let dominated = this.data.length

        if (delta < 0 && dominated <= this.MIN_ZOOM) return
        if (delta > 0 && dominated > this.MAX_ZOOM) return

        delta = Utils.smart_wheel(delta)

        let interval = this.$p.interval
        let k = interval / 1000
        let diff = delta * k * dominated

        // Zoom from center of x-axis
        this.range[0] -= diff * 0.5
        this.range[1] += diff * 0.5

        this.comp.$emit('botbar-zoom', this.range)
    }

    destroy() {
        this._destroyed = true // stop a still-loading listeners() from wiring up
        if (this.mc) this.mc.destroy()
        if (this.hm) this.hm.unwheel()
        if (this._throttledWheel) this._throttledWheel.cancel()
        if (this._throttledPanmove) this._throttledPanmove.cancel()
        this.canvasDynamic = null
    }

    update() {

        this.grid_0 = this.layout.grids[0]

        const width = this.layout.botbar.width
        const height = this.layout.botbar.height

        const sb = this.layout.grids[0].sb

        //this.ctx.fillStyle = this.$p.colors.back
        this.ctx.font = this.$p.font
        //this.ctx.fillRect(0, 0, width, height)
        this.ctx.clearRect(0, 0, width, height)

        this.ctx.strokeStyle = this.$p.colors.scale

        this.ctx.beginPath()
        this.ctx.moveTo(0, 0.5)
        this.ctx.lineTo(Math.floor(width + 1), 0.5)
        this.ctx.stroke()

        this.ctx.fillStyle = this.$p.colors.text
        this.ctx.beginPath()

        // PERFORMANCE: Track globalAlpha state to avoid unnecessary changes
        let dimmed = false
        this.ctx.textAlign = 'center'  // Set once outside loop

        for (let p of this.layout.botbar.xs) {

            let lbl = this.format_date(p)

            if (p[0] > width - sb) continue

            this.ctx.moveTo(p[0] - 0.5, 0)
            this.ctx.lineTo(p[0] - 0.5, 4.5)

            const shouldDim = !this.lbl_highlight(p)
            if (shouldDim !== dimmed) {
                this.ctx.globalAlpha = shouldDim ? 0.85 : 1
                dimmed = shouldDim
            }
            this.ctx.fillText(lbl, p[0], 18)
        }
        // Reset globalAlpha if we ended in dimmed state
        if (dimmed) this.ctx.globalAlpha = 1

        this.ctx.stroke()
        this.apply_shaders()
        if (this.$p.cursor.x && this.$p.cursor.t !== undefined)
            this.panel()

    }

    apply_shaders() {
        // PERF: Use already-resolved grid_0 instead of re-traversing layout
        let layout = this.grid_0
        if (!layout) return
        let props = {
            layout: layout,
            cursor: this.$p.cursor
        }
        for (let s of this.comp.bot_shaders) {
            this.ctx.save()
            s.draw(this.ctx, props)
            this.ctx.restore()
        }
    }

    panel() {

        let lbl = this.format_cursor_x()
        this.ctx.fillStyle = this.$p.colors.panel

        // PERFORMANCE: Use cached measureText
        let panwidth = Math.floor(this.measureTextCached(lbl + '    '))
        let cursor = this.$p.cursor.x
        let x = Math.floor(cursor - panwidth * 0.5)
        let y = - 0.5
        let panheight = this.$p.config?.PANHEIGHT || 22
        this.ctx.fillRect(x, y, panwidth, panheight + 0.5)

        this.ctx.fillStyle = this.$p.colors.textHL
        this.ctx.textAlign = 'center'
        this.ctx.fillText(lbl, cursor, y + 16)

    }

    format_date(p) {
        let t = p[1][0]
        // PERF: Use cached ti_map reference (set in update())
        const ti_map = this.grid_0.ti_map
        t = ti_map.i2t(t)
        let ti = ti_map.tf
        // Enable timezones only for tf < 1D
        let k = ti < DAY ? 1 : 0
        let tZ = t + k * this.$p.timezone * HOUR

        // PERF: Use LRU-cached Date instead of new Date() per label
        let d = Utils.getCachedDate(tZ)

        if (p[2] === YEAR || Utils.year_start(tZ) === tZ) {
            return d.getUTCFullYear()
        }
        if (p[2] === MONTH || Utils.month_start(tZ) === tZ) {
            return MONTHMAP[d.getUTCMonth()]
        }
        // TODO(*) see grid_maker.js
        if (Utils.day_start(tZ) === tZ) return d.getUTCDate()

        let h = Utils.add_zero(d.getUTCHours())
        let m = Utils.add_zero(d.getUTCMinutes())
        return h + ":" + m

    }

    format_cursor_x() {

        let t = this.$p.cursor.t
        // PERF: Use cached ti_map reference (set in update())
        const ti_map = this.grid_0.ti_map
        t = ti_map.i2t(t)
        let ti = ti_map.tf
        // Enable timezones only for tf < 1D
        let k = ti < DAY ? 1 : 0

        //t += new Date(t).getTimezoneOffset() * MINUTE
        // PERFORMANCE: Use cached Date object - only creates new Date when timestamp changes
        let d = Utils.getCachedDate(t + k * this.$p.timezone * HOUR)

        if (ti === YEAR) {
            return d.getUTCFullYear()
        }

        let yr, mo, dd
        if (ti < YEAR) {
            yr = '`' + `${d.getUTCFullYear()}`.slice(-2)
            mo = MONTHMAP[d.getUTCMonth()]
            dd = '01'
        }
        if (ti <= WEEK) dd = d.getUTCDate()
        let date = `${dd} ${mo} ${yr}`
        let time = ''

        if (ti < DAY) {
            let h = Utils.add_zero(d.getUTCHours())
            let m = Utils.add_zero(d.getUTCMinutes())
            time = h + ":" + m
        }

        return `${date}  ${time}`

    }

    // Highlights the begining of a time interval
    // TODO: improve. Problem: let's say we have a new month,
    // but if there is no grid line in place, there
    // will be no month name on t-axis. Sad.
    // Solution: manipulate the grid, skew it, you know
    lbl_highlight(p) {

        let ti = this.$p.interval

        // Mirror format_date()'s timestamp normalisation so the boundary checks
        // run on the SAME adjusted time that produced the label text. `p` is the
        // grid entry [px, candleRow, rank]; p[1][0] is the candle ts (or index in
        // IB mode). Without the i2t + timezone shift below, the raw ts rarely
        // matched a month/day/hour boundary once a non-zero timezone was applied,
        // so every label got dimmed to near-invisibility — the "no X labels" bug.
        const ti_map = this.grid_0.ti_map
        let t = ti_map.i2t(p[1][0])
        let k = ti_map.tf < DAY ? 1 : 0
        let tZ = t + k * this.$p.timezone * HOUR

        if (tZ === 0) return true
        if (Utils.month_start(tZ) === tZ) return true
        if (Utils.day_start(tZ) === tZ) return true
        if (ti <= MINUTE15 && tZ % HOUR === 0) return true

        return false

    }

    mousemove() { }
    mouseout() { }
    mouseup() { }
    mousedown() { }

}
