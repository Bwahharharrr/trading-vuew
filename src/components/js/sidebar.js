import Utils from '../../stuff/utils.js'
import math from '../../stuff/math.js'
import { loadGestures } from '../../stuff/gestures.js'

let PANHEIGHT

export default class Sidebar {

    constructor(canvas, comp, side = 'right', canvasDynamic = null) {
        const config = comp.$props.config || {}
        PANHEIGHT = config.PANHEIGHT || 22

        this.canvas = canvas
        this.canvasDynamic = canvasDynamic
        this.ctx = canvas.getContext('2d')
        this.comp = comp
        this.$p = comp.$props
        this.data = this.$p.sub
        this.range = this.$p.range
        this.id = this.$p.grid_id
        this.layout = this.$p.layout?.grids?.[this.id]

        this.side = side
        this._destroyed = false
        this.listeners()

    }

    async listeners() {
        const { Hammer, Hamster } = await loadGestures()
        if (this._destroyed) return // unmounted while gestures were loading
        let eventTarget = this.canvasDynamic || this.canvas
        // Add wheel zoom for Y-axis
        this.hm = Hamster(eventTarget)
        // Throttle wheel events to ~60fps
        this._throttledWheel = Utils.rafThrottle((delta, event) => {
            this.mousezoom(delta * 50, event)
        })
        this.hm.wheel((event, delta) => this._throttledWheel(delta, event))

        let mc = this.mc = new Hammer.Manager(eventTarget)
        mc.add(new Hammer.Pan({
            direction: Hammer.DIRECTION_VERTICAL,
            threshold: 0
        }))

        mc.add( new Hammer.Tap({
            event: 'doubletap',
            taps: 2,
            posThreshold: 50
        }))

        mc.on('panstart', event => {
            if (this.$p.y_transform) {
                this.zoom = this.$p.y_transform.zoom
            } else {
                this.zoom = 1.0
            }
            this.y_range = [
                this.layout.$_hi,
                this.layout.$_lo
            ]
            this.drug = {
                y: event.center.y,
                z: this.zoom,
                mid: math.log_mid(this.y_range, this.layout.height),
                A: this.layout.A,
                B: this.layout.B
            }
        })

        // Throttle panmove for smoother drag performance
        this._throttledPanmove = Utils.rafThrottle((event) => {
            if (this.drug) {
                this.zoom = this.calc_zoom(event)
                this.comp.$emit('sidebar-transform', {
                    grid_id: this.id,
                    zoom: this.zoom,
                    auto: false,
                    range: this.calc_range(),
                    drugging: true
                })
            }
        })
        mc.on('panmove', event => this._throttledPanmove(event))

        mc.on('panend', () => {
            this.drug = null
            this.comp.$emit('sidebar-transform', {
                grid_id: this.id,
                drugging: false
            })
        })

        mc.on('doubletap', () => {
            this.comp.$emit('sidebar-transform', {
                grid_id: this.id,
                zoom: 1.0,
                auto: true
            })
            this.zoom = 1.0
        })

        // TODO: Do later for mobile version

    }

    update() {

        // Update reference to the grid
        // Use layoutOverride if available (for resize operations)
        this.layout = this.comp.layoutOverride || this.$p.layout.grids[this.id]

        let points = this.layout.ys
        let x, y, w, h, side = this.side
        let sb = this.layout.sb

        //this.ctx.fillStyle = this.$p.colors.back
        this.ctx.font = this.$p.font

        switch(side) {
            case 'left':
                x = 0
                y = 0
                w = Math.floor(sb)
                h = this.layout.height

                //this.ctx.fillRect(x, y, w, h)
                this.ctx.clearRect(x, y, w, h)

                this.ctx.strokeStyle = this.$p.colors.scale

                this.ctx.beginPath()
                this.ctx.moveTo(x + 0.5, 0)
                this.ctx.lineTo(x + 0.5, h)
                this.ctx.stroke()

                break
            case 'right':
                x = 0
                y = 0
                w = Math.floor(sb)
                h = this.layout.height
                //this.ctx.fillRect(x, y, w, h)
                this.ctx.clearRect(x, y, w, h)

                this.ctx.strokeStyle = this.$p.colors.scale

                this.ctx.beginPath()
                this.ctx.moveTo(x + 0.5, 0)
                this.ctx.lineTo(x + 0.5, h)
                this.ctx.stroke()
                break
        }

        // PERFORMANCE: Cache property lookups outside loop
        const ctx = this.ctx
        const layoutHeight = this.layout.height
        const prec = this.layout.prec
        const isLeft = side === 'left'
        const x1Base = isLeft ? w - 0.5 : x - 0.5
        const x2Offset = isLeft ? -4.5 : 4.5
        const textOffset = isLeft ? -10 : 10
        const textAlign = isLeft ? 'end' : 'start'

        ctx.fillStyle = this.$p.colors.text
        ctx.beginPath()
        ctx.textAlign = textAlign  // Set once outside loop

        for (let i = 0; i < points.length; i++) {
            const p = points[i]
            if (p[0] > layoutHeight) continue

            const y = p[0] - 0.5
            ctx.moveTo(x1Base, y)
            ctx.lineTo(x1Base + x2Offset, y)
            ctx.fillText(p[1].toFixed(prec), x1Base + textOffset, p[0] + 4)
        }

        ctx.stroke()

        // PERFORMANCE: Cache label geometry so _clearPanel() can repaint just
        // the labels (and tick marks) it erases without re-deriving the math.
        this._labelGeom = { x1Base, x2Offset, textOffset, textAlign }

        if (this.$p.grid_id) this.upper_border()

        this.apply_shaders()

        if (this.$p.cursor.y && this.$p.cursor.y$) this.panel()

        // PERFORMANCE: Store last panel position for optimized cursor-only updates
        this._lastPanelY = this.$p.cursor.y

    }

    // PERFORMANCE: Update only the cursor panel without redrawing entire sidebar
    // Called when only cursor.y$ changes (not range or layout)
    updatePanelOnly() {
        // `this.layout` is only resolved by a full update(). A cursor move can
        // fire this fast path BEFORE the first update() (initial load) or while
        // this grid's layout is momentarily absent (tf-switch / grid rebuild on
        // the gateway feed). With no layout there is nothing to clear or repaint
        // — bail; the next full update() repaints the panel. (Guards _clearPanel
        // /panel() which dereference this.layout.sb.)
        if (!this.layout) return
        if (!this.$p.cursor.y || !this.$p.cursor.y$) {
            // Clear old panel if cursor is gone
            if (this._lastPanelY !== undefined) {
                this._clearPanel(this._lastPanelY)
                this._lastPanelY = undefined
                // The cleared band may have erased a sidebar shader (e.g. the
                // last-price tag). Repaint shaders so it survives the cursor move.
                this.apply_shaders()
            }
            return
        }

        // Clear old panel area
        if (this._lastPanelY !== undefined && this._lastPanelY !== this.$p.cursor.y) {
            this._clearPanel(this._lastPanelY)
        }

        // Repaint sidebar shaders (the highlighted last-price tag) BEFORE the
        // cursor panel, so the panel overlays them — matching update()'s order
        // (clear → labels → apply_shaders → panel). Without this, _clearPanel
        // wipes the price tag and the cursor-only fast path never redraws it.
        this.apply_shaders()

        // Draw new panel
        this.panel()
        this._lastPanelY = this.$p.cursor.y
    }

    // PERFORMANCE: Clear just the panel area
    _clearPanel(panelY) {
        const panwidth = this.layout.sb + 1
        const x = -0.5
        const y = panelY - PANHEIGHT * 0.5 - 0.5 - 1
        const clearTop = y - 1
        const clearBottom = y - 1 + (PANHEIGHT + 2)
        // Clear slightly larger area to ensure clean redraw
        this.ctx.clearRect(x - 1, clearTop, panwidth + 2, PANHEIGHT + 2)
        // Redraw the scale line that may have been cleared
        this.ctx.strokeStyle = this.$p.colors.scale
        this.ctx.beginPath()
        this.ctx.moveTo(0.5, y)
        this.ctx.lineTo(0.5, y + PANHEIGHT + 2)
        this.ctx.stroke()
        // FIX (label-wipe): the grid VALUE labels live on this same (static)
        // canvas, so the clearRect above erased any that overlapped the old
        // cursor-panel box. Repaint just those labels back into the band.
        this._repaintLabels(clearTop, clearBottom)
    }

    // Repaint grid value labels whose Y baseline falls within [top, bottom].
    // Mirrors the label drawing in update() exactly so restored labels are
    // pixel-identical to a full draw.
    _repaintLabels(top, bottom) {
        const geom = this._labelGeom
        if (!geom || !this.layout) return
        const points = this.layout.ys
        if (!points) return
        const ctx = this.ctx
        const layoutHeight = this.layout.height
        const prec = this.layout.prec
        const { x1Base, x2Offset, textOffset, textAlign } = geom

        ctx.font = this.$p.font
        ctx.fillStyle = this.$p.colors.text
        ctx.textAlign = textAlign
        // Ticks share update()'s scale colour (the vertical scale line set it).
        ctx.strokeStyle = this.$p.colors.scale
        ctx.beginPath()
        let stroked = false

        // _clearPanel cleared EXACTLY [top, bottom]. Repaint a label only when
        // its glyph box actually intersects that cleared band. The old guard
        // ([top - PANHEIGHT, bottom + 4]) repainted labels up to 22px ABOVE the
        // cleared rect — value labels (transparent background, unlike the opaque
        // cursor panel) were fillText-ed onto un-cleared pixels every frame as
        // the cursor swept past, so the anti-aliased glyphs accumulated into a
        // BOLD smear. Derive the glyph extents from the font size so a custom
        // font scales correctly. Glyph box ≈ [labelY - ascent, labelY + descent].
        const fsMatch = /(\d+(?:\.\d+)?)px/.exec(ctx.font || '')
        const fontPx = fsMatch ? parseFloat(fsMatch[1]) : 11
        const ascent = fontPx * 0.8 + 1
        const descent = fontPx * 0.25 + 1

        for (let i = 0; i < points.length; i++) {
            const p = points[i]
            if (p[0] > layoutHeight) continue
            // Label baseline used in update(): p[0] + 4.
            const labelY = p[0] + 4
            // Skip labels whose glyph does NOT intersect the cleared band — they
            // were never cleared, so repainting would double them up (bold).
            if (labelY - ascent > bottom || labelY + descent < top) continue
            // Repaint the short grid tick (mirrors update(): y = p[0] - 0.5)
            // that the clearRect also erased.
            const ty = p[0] - 0.5
            ctx.moveTo(x1Base, ty)
            ctx.lineTo(x1Base + x2Offset, ty)
            stroked = true
            ctx.fillText(p[1].toFixed(prec), x1Base + textOffset, labelY)
        }
        if (stroked) ctx.stroke()
    }

    apply_shaders() {
        // PERF: Use already-resolved layout instead of re-traversing props
        let layout = this.layout
        if (!layout) return
        let props = {
            layout: layout,
            cursor: this.$p.cursor
        }
        for (let s of this.$p.shaders) {
            this.ctx.save()
            s.draw(this.ctx, props)
            this.ctx.restore()
        }
    }

    upper_border() {
        this.ctx.strokeStyle = this.$p.colors.scale
        this.ctx.beginPath()
        this.ctx.moveTo(0, 0.5)
        this.ctx.lineTo(this.layout.width, 0.5)
        this.ctx.stroke()
    }

    // A gray bar behind the current price
    panel() {

        if (this.$p.cursor.grid_id !== this.layout.id) {
            return
        }

        // PERFORMANCE: Cache formatted label - only recalculate when value or precision changes
        const y$ = this.$p.cursor.y$
        const prec = this.layout.prec
        let lbl
        if (this._lastY$ === y$ && this._lastPrec === prec && this._lastLbl) {
            lbl = this._lastLbl
        } else {
            lbl = y$.toFixed(prec)
            this._lastY$ = y$
            this._lastPrec = prec
            this._lastLbl = lbl
        }
        this.ctx.fillStyle = this.$p.colors.panel

        let panwidth = this.layout.sb + 1

        let x = - 0.5
        let y = this.$p.cursor.y - PANHEIGHT * 0.5 - 0.5
        let a = 7
        this.ctx.fillRect(x - 0.5, y, panwidth, PANHEIGHT)
        this.ctx.fillStyle = this.$p.colors.textHL
        this.ctx.textAlign = 'left'
        this.ctx.fillText(lbl, a, y + 15)

    }

    calc_zoom(event) {
        let d = this.drug.y - event.center.y
        let speed = d > 0 ? 3 : 1
        let k = 1 + speed * d / this.layout.height
        return Utils.clamp(this.drug.z * k, 0.005, 100)
    }

    // Not the best place to calculate y-range but
    // this is the simplest solution I found up to
    // date
    calc_range(diff1 = 1, diff2 = 1) {

        let z = this.zoom / this.drug.z
        let zk = (1 / z - 1) / 2

        let range = this.y_range.slice()
        let delta = range[0] - range[1]

        if (!this.layout.grid.logScale) {
            range[0] = range[0] + delta * zk * diff1
            range[1] = range[1] - delta * zk * diff2
        } else {

            let px_mid = this.layout.height / 2
            let new_hi = px_mid - px_mid * (1/z)
            let new_lo = px_mid + px_mid * (1/z)

            // Use old mapping to get a new range
            let f = y => math.exp((y - this.drug.B) / this.drug.A)

            let copy = range.slice()
            range[0] = f(new_hi)
            range[1] = f(new_lo)

        }

        return range
    }

    mousezoom(delta, event) {
        event.originalEvent.preventDefault()
        event.preventDefault()

        // Initialize zoom state if needed
        if (this.$p.y_transform) {
            this.zoom = this.$p.y_transform.zoom
        } else {
            this.zoom = 1.0
        }

        this.y_range = [
            this.layout.$_hi,
            this.layout.$_lo
        ]
        this.drug = {
            y: 0,
            z: this.zoom,
            mid: math.log_mid(this.y_range, this.layout.height),
            A: this.layout.A,
            B: this.layout.B
        }

        // Calculate zoom based on wheel delta
        delta = Utils.smart_wheel(delta)
        let k = delta * 0.002
        this.zoom = Utils.clamp(this.zoom * (1 + k), 0.005, 100)

        this.comp.$emit('sidebar-transform', {
            grid_id: this.id,
            zoom: this.zoom,
            auto: false,
            range: this.calc_range(),
            drugging: false
        })
        this.drug = null
    }

    rezoom_range(delta, diff1, diff2) {

        if (!this.$p.y_transform || this.$p.y_transform.auto) return

        this.zoom = 1.0
        // TODO: further work (improve scaling ratio)
        if (delta < 0) delta /= 3.75  // Btw, idk why 3.75, but it works
        delta *= 0.25
        this.y_range = [
            this.layout.$_hi,
            this.layout.$_lo
        ]
        this.drug = {
            y: 0,
            z: this.zoom,
            mid: math.log_mid(this.y_range, this.layout.height),
            A: this.layout.A,
            B: this.layout.B
        }
        this.zoom = this.calc_zoom({
            center: {
                y: delta * this.layout.height
            }
        })

        this.comp.$emit('sidebar-transform', {
            grid_id: this.id,
            zoom: this.zoom,
            auto: false,
            range: this.calc_range(diff1, diff2),
            drugging: true
        })
        this.drug = null
        this.comp.$emit('sidebar-transform', {
            grid_id: this.id,
            drugging: false
        })
    }

    destroy() {
        this._destroyed = true // stop a still-loading listeners() from wiring up
        if (this.mc) this.mc.destroy()
        if (this.hm) this.hm.unwheel()
        if (this._throttledWheel) this._throttledWheel.cancel()
        if (this._throttledPanmove) this._throttledPanmove.cancel()
        this.canvasDynamic = null
    }

    mousemove() { }
    mouseout() { }
    mouseup() { }
    mousedown() { }

}
