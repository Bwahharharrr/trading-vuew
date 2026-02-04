// Grid.js - I/O system for Grid.vue
// Orchestrates zoom, pan, and rendering modules

import * as Hammer from 'hammerjs'
import Hamster from 'hamsterjs'
import Utils from '../../stuff/utils.js'
import { createCursorEventPool } from '../../stuff/pool.js'
import { ZoomManager, PanManager, GridRenderer } from './grid/index.js'

export default class Grid {

    constructor(canvas, comp, canvasDynamic = null) {
        const config = comp.$props.config || {}
        this.MIN_ZOOM = config.MIN_ZOOM || 25
        this.MAX_ZOOM = config.MAX_ZOOM || 100000

        if (Utils.is_mobile) this.MIN_ZOOM *= 0.5

        // Static canvas for grid, candles, overlays
        this.canvas = canvas
        this.ctx = canvas.getContext('2d')

        // Dynamic canvas for crosshair (optional - falls back to single canvas)
        this.canvasDynamic = canvasDynamic
        this.ctxDynamic = canvasDynamic ? canvasDynamic.getContext('2d') : null

        this.comp = comp
        this.$p = comp.$props
        this.data = this.$p.sub
        // Note: range is accessed via getter to always get current prop value
        this.id = this.$p.grid_id
        this.layout = this.$p.layout?.grids?.[this.id]
        this.interval = this.$p.interval
        this.cursor = comp.$props.cursor
        this.offset_x = 0
        this.offset_y = 0
        this.deltas = 0
        this.wmode = this.$p.config?.SCROLL_WHEEL
        this.trackpad = false

        // PERFORMANCE: Cache offset to avoid getBoundingClientRect on every mousemove
        this._offsetCached = false
        this._offsetCacheTime = 0

        // Initialize modules
        this.zoomManager = new ZoomManager(this)
        this.panManager = new PanManager(this)
        this.renderer = new GridRenderer(this)

        // Object pool for cursor events to reduce GC pressure
        this._cursorEventPool = createCursorEventPool()
        this._pooledCursorEvent = this._cursorEventPool.acquire()

        this.listeners()
    }

    // Always access range from current props (Vue 3 reactivity fix)
    get range() { return this.$p.range }

    // Delegate to renderer
    get overlays() { return this.renderer.overlays }
    set overlays(v) { this.renderer.overlays = v }

    listeners() {
        this.hm = Hamster(this.canvasDynamic || this.canvas)
        // Throttle wheel events to ~60fps for smooth zoom
        this._throttledWheel = Utils.rafThrottle((delta, event) => {
            this.zoomManager.mousezoom(-delta * 50, event)
        })
        this.hm.wheel((event, delta) => this._throttledWheel(delta, event))

        let mc = this.mc = new Hammer.Manager(this.canvasDynamic || this.canvas)
        let T = Utils.is_mobile ? 10 : 0
        mc.add(new Hammer.Pan({ threshold: T }))
        mc.add(new Hammer.Tap())
        mc.add(new Hammer.Pinch({ threshold: 0 }))
        mc.get('pinch').set({ enable: true })
        if (Utils.is_mobile) mc.add(new Hammer.Press())

        mc.on('panstart', event => {
            // Guard: don't start drag if range isn't valid yet
            if (!this.range || this.range[0] === undefined || this.range[1] === undefined) {
                return
            }
            if (this.cursor.scroll_lock) return
            if (this.cursor.mode === 'aim') {
                return this.emit_cursor_coord(event)
            }
            this.calc_offset()
            let tfrm = this.$p.y_transform
            this.drug = {
                x: event.center.x + this.offset_x,
                y: event.center.y + this.offset_y,
                r: this.range.slice(),
                t: this.range[1] - this.range[0],
                o: tfrm ? (tfrm.offset || 0) : 0,
                y_r: tfrm && tfrm.range ? tfrm.range.slice() : undefined,
                B: this.layout.B,
                t0: Utils.now()
            }
            // Reuse pooled cursor event object
            this._pooledCursorEvent.grid_id = this.id
            this._pooledCursorEvent.x = event.center.x + this.offset_x
            this._pooledCursorEvent.y = event.center.y + this.offset_y
            this._pooledCursorEvent.mode = undefined
            this.comp.$emit('cursor-changed', this._pooledCursorEvent)
            this.comp.$emit('cursor-locked', true)
        })

        // Throttle panmove for smoother drag performance
        this._throttledPanmove = Utils.rafThrottle((event) => {
            if (Utils.is_mobile) {
                this.calc_offset()
                this.renderer.propagate('mousemove', this.touch2mouse(event))
            }
            if (this.drug) {
                this.panManager.mousedrag(
                    this.drug.x + event.deltaX,
                    this.drug.y + event.deltaY
                )
                // Reuse pooled cursor event object
                this._pooledCursorEvent.grid_id = this.id
                this._pooledCursorEvent.x = event.center.x + this.offset_x
                this._pooledCursorEvent.y = event.center.y + this.offset_y
                this._pooledCursorEvent.mode = undefined
                this.comp.$emit('cursor-changed', this._pooledCursorEvent)
            } else if (this.cursor.mode === 'aim') {
                this.emit_cursor_coord(event)
            }
        })
        mc.on('panmove', event => this._throttledPanmove(event))

        mc.on('panend', event => {
            if (Utils.is_mobile && this.drug) {
                this.panManager.pan_fade(event)
            }
            this.drug = null
            this.comp.$emit('cursor-locked', false)
        })

        mc.on('tap', event => {
            if (!Utils.is_mobile) return
            this.sim_mousedown(event)
            this.panManager.stopFade()
            this.comp.$emit('cursor-changed', {})
            this.comp.$emit('cursor-changed', { mode: 'explore' })
            this.update()
        })

        mc.on('pinchstart', () => {
            this.drug = null
            this.pinch = {
                t: this.range[1] - this.range[0],
                r: this.range.slice()
            }
        })

        mc.on('pinchend', () => {
            this.pinch = null
        })

        mc.on('pinch', event => {
            if (this.pinch) this.zoomManager.pinchzoom(event.scale)
        })

        mc.on('press', event => {
            if (!Utils.is_mobile) return
            this.panManager.stopFade()
            this.calc_offset()
            this.emit_cursor_coord(event, { mode: 'aim' })
            setTimeout(() => this.update())
            this.sim_mousedown(event)
        })

        let add = addEventListener
        add("gesturestart", this.gesturestart)
        add("gesturechange", this.gesturechange)
        add("gestureend", this.gestureend)
    }

    gesturestart(event) { event.preventDefault() }
    gesturechange(event) { event.preventDefault() }
    gestureend(event) { event.preventDefault() }

    mousemove(event) {
        if (Utils.is_mobile) return
        // Guard against uninitialized state
        if (!this.layout || !this.renderer) return
        this.comp.$emit('cursor-changed', {
            grid_id: this.id,
            x: event.layerX,
            y: event.layerY + (this.layout.offset || 0)
        })
        this.calc_offset()
        this.renderer.propagate('mousemove', event)
    }

    mouseout(event) {
        if (Utils.is_mobile) return
        // Guard against uninitialized renderer
        if (!this.renderer) return
        this.comp.$emit('cursor-changed', {})
        this.renderer.propagate('mouseout', event)
    }

    mouseup(event) {
        this.drug = null
        this.comp.$emit('cursor-locked', false)
        if (this.renderer) this.renderer.propagate('mouseup', event)
    }

    mousedown(event) {
        if (Utils.is_mobile) return
        if (!this.renderer) return
        this.renderer.propagate('mousedown', event)
        this.comp.$emit('cursor-locked', true)
        if (event.defaultPrevented) return
        this.comp.$emit('custom-event', {
            event: 'grid-mousedown', args: [this.id, event]
        })
    }

    sim_mousedown(event) {
        if (event.srcEvent.defaultPrevented) return
        this.comp.$emit('custom-event', {
            event: 'grid-mousedown',
            args: [this.id, event]
        })
        this.renderer.propagate('mousemove', this.touch2mouse(event))
        this.update()
        this.renderer.propagate('mousedown', this.touch2mouse(event))
        setTimeout(() => {
            this.renderer.propagate('click', this.touch2mouse(event))
        })
    }

    touch2mouse(e) {
        this.calc_offset()
        return {
            original: e.srcEvent,
            layerX: e.center.x + this.offset_x,
            layerY: e.center.y + this.offset_y,
            preventDefault: function() {
                this.original.preventDefault()
            }
        }
    }

    click(event) {
        this.renderer.propagate('click', event)
    }

    emit_cursor_coord(event, add = {}) {
        // PERFORMANCE: Avoid Object.assign overhead when add is empty (common case)
        const base = {
            grid_id: this.id,
            x: event.center.x + this.offset_x,
            y: event.center.y + this.offset_y + this.layout.offset
        }
        // Only merge if add has properties
        const hasAdd = Object.keys(add).length > 0
        this.comp.$emit('cursor-changed', hasAdd ? Object.assign(base, add) : base)
    }

    // PERFORMANCE: Cache getBoundingClientRect to avoid layout thrashing
    // Offset only changes on scroll, resize, or layout changes - not on every mousemove
    calc_offset(force = false) {
        const now = Date.now()
        // Refresh cache every 100ms or when forced (resize, scroll, etc.)
        if (force || !this._offsetCached || (now - this._offsetCacheTime) > 100) {
            let rect = this.canvas.getBoundingClientRect()
            this.offset_x = -rect.x
            this.offset_y = -rect.y
            this._offsetCached = true
            this._offsetCacheTime = now
        }
    }

    // Force offset recalculation (call on resize/scroll)
    invalidate_offset() {
        this._offsetCached = false
    }

    // Delegate layer management to renderer
    new_layer(layer) { this.renderer.new_layer(layer) }
    del_layer(id) { this.renderer.del_layer(id) }
    show_hide_layer(event) { this.renderer.show_hide_layer(event) }
    update() { this.renderer.update() }
    propagate(name, event) { this.renderer.propagate(name, event) }

    change_range() {
        if (!this.range.length || this.data.length < 2) return

        let l = this.data.length - 1
        let data = this.data
        let range = this.range

        range[0] = Utils.clamp(
            range[0],
            -Infinity, data[l][0] - this.interval * 5.5
        )

        range[1] = Utils.clamp(
            range[1],
            data[0][0] + this.interval * 5.5, Infinity
        )

        this.comp.$emit('range-changed', range)
    }

    destroy() {
        let rm = removeEventListener
        rm("gesturestart", this.gesturestart)
        rm("gesturechange", this.gesturechange)
        rm("gestureend", this.gestureend)
        if (this.mc) this.mc.destroy()
        if (this.hm) this.hm.unwheel()
        // Cancel any pending throttled callbacks
        if (this._throttledWheel) this._throttledWheel.cancel()
        if (this._throttledPanmove) this._throttledPanmove.cancel()
        // Release pooled objects
        if (this._cursorEventPool && this._pooledCursorEvent) {
            this._cursorEventPool.release(this._pooledCursorEvent)
        }
    }
}
