// Grid.js - I/O system for Grid.vue
// Orchestrates zoom, pan, and rendering modules

import Utils from '../../stuff/utils.js'
import { createCursorEventPool } from '../../stuff/pool.js'
import { ZoomManager, PanManager, GridRenderer } from './grid/index.js'
import { loadGestures } from '../../stuff/gestures.js'
import { LEVEL, RENDER_SCHEDULER } from '../../render/render-scheduler.js'

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

        this._destroyed = false
        // Gestures load lazily (browser-only libs); listeners() resolves async.
        this.listeners()
    }

    // Always access range from current props (Vue 3 reactivity fix)
    get range() { return this.$p.range }

    // Delegate to renderer
    get overlays() { return this.renderer.overlays }
    set overlays(v) { this.renderer.overlays = v }

    async listeners() {
        const { Hammer, Hamster } = await loadGestures()
        if (this._destroyed) return // unmounted while gestures were loading
        this.hm = Hamster(this.canvasDynamic || this.canvas)
        // Legacy per-source rafThrottle (rollback path). With the RenderScheduler
        // on, wheel zoom is coalesced by the single rAF spine instead — created
        // lazily so the scheduler path allocates no unused throttle.
        if (!RENDER_SCHEDULER) {
            this._throttledWheel = Utils.rafThrottle((delta, event) => {
                this.zoomManager.mousezoom(-delta * 50, event)
            })
        }
        this.hm.wheel((event, delta) => {
            // preventDefault must run SYNCHRONOUSLY in the wheel dispatch — the
            // deferred (RAF / scheduler-drain) handler fires a frame later, when
            // it is a documented no-op (page scroll / browser ctrl-zoom were no
            // longer blocked).
            if (this.wmode !== 'pass' && event.originalEvent &&
                !(this.wmode === 'click' && !this.$p.meta.activated)) {
                event.originalEvent.preventDefault()
                if (event.preventDefault) event.preventDefault()
            }
            if (RENDER_SCHEDULER) {
                // Defer the zoom into the drain (latest-event-wins, one run per
                // frame — same coalescing the rafThrottle gave).
                this._scheduleGesture(
                    () => this.zoomManager.mousezoom(-delta * 50, event),
                    LEVEL.REPOSITION
                )
            } else {
                this._throttledWheel(delta, event)
            }
        })

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

        // Legacy rafThrottle (rollback path); the scheduler coalesces panmove via
        // the single rAF spine instead.
        if (!RENDER_SCHEDULER) {
            this._throttledPanmove = Utils.rafThrottle(
                (event) => this._panmove_work(event)
            )
        }
        mc.on('panmove', event => {
            if (RENDER_SCHEDULER) {
                this._scheduleGesture(
                    () => this._panmove_work(event), LEVEL.REPOSITION
                )
            } else {
                this._throttledPanmove(event)
            }
        })

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
            if (!this.pinch) return
            if (RENDER_SCHEDULER) {
                // Previously UNthrottled (N rebuilds/frame). Routed through the
                // drain it collapses to one rebuild/frame (latest scale wins).
                this._scheduleGesture(
                    () => this.zoomManager.pinchzoom(event.scale),
                    LEVEL.REPOSITION
                )
            } else {
                this.zoomManager.pinchzoom(event.scale)
            }
        })

        mc.on('press', event => {
            if (!Utils.is_mobile) return
            this.panManager.stopFade()
            this.calc_offset()
            this.emit_cursor_coord(event, { mode: 'aim' })
            if (this._pressTimeout) clearTimeout(this._pressTimeout)
            this._pressTimeout = setTimeout(() => this.update())
            this.sim_mousedown(event)
        })

        // Per-INSTANCE handlers: prototype methods are the same function for
        // every Grid, so duplicate addEventListener was a no-op and the FIRST
        // grid destroyed (closing one offchart pane) unhooked Safari pinch
        // preventDefault for all remaining grids.
        this._gesturestart = (event) => event.preventDefault()
        this._gesturechange = (event) => event.preventDefault()
        this._gestureend = (event) => event.preventDefault()
        let add = addEventListener
        add("gesturestart", this._gesturestart)
        add("gesturechange", this._gesturechange)
        add("gestureend", this._gestureend)
    }

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
        // Paint the crosshair in the SAME tick the cursor was committed. $emit is
        // synchronous, so updater.sync() has already written the reactive cursor.x/y
        // by now, and the crosshair reads them live at draw time. This removes the
        // ~1-frame lag of the reactive watcher + requestAnimationFrame round-trip
        // (the "glued then jumps" stutter). Dynamic-only paint (clearRect + a few
        // strokes) — never touches the static/candle canvas. Single-canvas mode
        // falls back to Grid.vue's cursor.x RAF watcher.
        if (this.renderer.hasDualCanvas && !this.comp.$props.cursor?.locked) {
            this.renderer.updateDynamic()
        }
    }

    mouseout(event) {
        if (Utils.is_mobile) return
        // Guard against uninitialized renderer
        if (!this.renderer) return
        this.comp.$emit('cursor-changed', {})
        this.renderer.propagate('mouseout', event)
        // Clear the dynamic crosshair layer in the same tick (dual-canvas).
        if (this.renderer.hasDualCanvas) this.renderer.updateDynamic()
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
        if (this._clickTimeout) clearTimeout(this._clickTimeout)
        this._clickTimeout = setTimeout(() => {
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

    emit_cursor_coord(event, add) {
        const base = {
            grid_id: this.id,
            x: event.center.x + this.offset_x,
            y: event.center.y + this.offset_y + this.layout.offset
        }
        this.comp.$emit('cursor-changed', add ? Object.assign(base, add) : base)
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
    update(freshGridLayout) { this.renderer.update(freshGridLayout) }
    markStaticDirty() { this.renderer.markStaticDirty() }
    propagate(name, event) { this.renderer.propagate(name, event) }

    // The panmove body, shared by the legacy rafThrottle and the scheduler drain.
    _panmove_work(event) {
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
    }

    // Defer a gesture into the chart's single rAF drain (latest-wins). The drain
    // runs `_pendingGesture`, which mutates range → the UNCHANGED synchronous
    // range_changed → subset+update_layout, then paints — coalescing the whole
    // gesture burst to one rebuild+paint per frame. If no scheduler is reachable
    // (RENDER_SCHEDULER off, or mounted outside a Chart) run it synchronously.
    _scheduleGesture(work, level) {
        this._pendingGesture = work
        if (this.comp && this.comp._invalidate && this.comp._invalidate(level)) {
            return
        }
        // No scheduler — fall back to immediate execution (legacy semantics).
        this._pendingGesture = null
        work()
    }

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
        this._destroyed = true // stop a still-loading listeners() from wiring up
        let rm = removeEventListener
        if (this._gesturestart) rm("gesturestart", this._gesturestart)
        if (this._gesturechange) rm("gesturechange", this._gesturechange)
        if (this._gestureend) rm("gestureend", this._gestureend)
        if (this.mc) this.mc.destroy()
        if (this.hm) this.hm.unwheel()
        // Cancel any pending throttled callbacks (legacy path) + drop a deferred
        // gesture so the scheduler drain can't run it against a torn-down grid.
        if (this._throttledWheel) this._throttledWheel.cancel()
        if (this._throttledPanmove) this._throttledPanmove.cancel()
        this._pendingGesture = null
        // Clear any pending one-shot timeouts
        if (this._pressTimeout) clearTimeout(this._pressTimeout)
        if (this._clickTimeout) clearTimeout(this._clickTimeout)
        // Release pooled objects
        if (this._cursorEventPool && this._pooledCursorEvent) {
            this._cursorEventPool.release(this._pooledCursorEvent)
        }
        // Stop pan fade animation
        if (this.panManager) this.panManager.destroy()
        // Release module references for GC (no own destroy() methods)
        if (this.renderer) this.renderer = null
        if (this.zoomManager) this.zoomManager = null
        // Release canvas/context references for GC
        this.ctx = null
        this.ctxDynamic = null
        this.canvas = null
        this.canvasDynamic = null
    }
}
