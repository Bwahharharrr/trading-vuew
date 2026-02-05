// Grid rendering: canvas drawing, overlay management
// Performance optimized with dual-canvas architecture:
// - Static canvas: grid, candles, overlays (redrawn only when data/range changes)
// - Dynamic canvas: crosshair (redrawn on every cursor move)

export default class GridRenderer {
    constructor(grid) {
        this.grid = grid
        this.overlays = []
        this.crosshair = null

        // Dirty tracking for smart redraws
        this._lastRange = null
        this._lastCursorX = null
        this._lastCursorY = null
        this._staticDirty = true  // Force initial draw
        this._overlaysDirty = true
        this._crosshairOnly = false

        // Performance: track if we only need crosshair update
        this._lastDataLength = 0

        // PERFORMANCE: Cache sorted overlays to avoid sorting every frame
        this._sortedOverlays = []
        this._overlaysSortDirty = true
    }

    // Static canvas context (grid, candles, overlays)
    get ctx() { return this.grid.ctx }

    // Dynamic canvas context (crosshair) - falls back to static if not available
    get ctxDynamic() { return this.grid.ctxDynamic || this.grid.ctx }

    // Check if dual-canvas mode is active
    get hasDualCanvas() { return !!this.grid.ctxDynamic }

    get layout() { return this.grid.layout }
    get $p() { return this.grid.$p }
    get data() { return this.grid.data }
    get range() { return this.grid.range }
    get interval() { return this.grid.interval }
    get cursor() { return this.grid.cursor }
    get id() { return this.grid.id }

    new_layer(layer) {
        if (layer.name === 'crosshair') {
            this.crosshair = layer
        } else {
            this.overlays.push(layer)
            // PERFORMANCE: Mark sorted cache as dirty
            this._overlaysSortDirty = true
        }
        this._overlaysDirty = true
        this.update()
    }

    del_layer(id) {
        this.overlays = this.overlays.filter(x => x.id !== id)
        // PERFORMANCE: Mark sorted cache as dirty
        this._overlaysSortDirty = true
        this._overlaysDirty = true
        this.update()
    }

    show_hide_layer(event) {
        let l = this.overlays.filter(x => x.id === event.id)
        if (l.length) l[0].display = event.display
        this._overlaysDirty = true
    }

    // Mark static content as dirty (range change, data change, resize)
    markStaticDirty() {
        this._staticDirty = true
        this._overlaysDirty = true
    }

    // Check if only crosshair needs update
    _detectCrosshairOnlyUpdate() {
        const range = this.range
        const cursor = this.cursor
        const data = this.data

        // Check if range changed
        const rangeKey = range ? `${range[0]},${range[1]}` : ''
        if (this._lastRange !== rangeKey) {
            this._lastRange = rangeKey
            this._staticDirty = true
            this._overlaysDirty = true
            return false
        }

        // Check if data length changed (new candles)
        const dataLen = data?.length || 0
        if (this._lastDataLength !== dataLen) {
            this._lastDataLength = dataLen
            this._staticDirty = true
            this._overlaysDirty = true
            return false
        }

        // Check if cursor moved
        const cursorX = cursor?.x
        const cursorY = cursor?.y
        if (this._lastCursorX !== cursorX || this._lastCursorY !== cursorY) {
            this._lastCursorX = cursorX
            this._lastCursorY = cursorY
            // Only cursor changed - potential crosshair-only update
            // But we still need full redraw because crosshair is drawn on same canvas
            return true
        }

        return false
    }

    update() {
        const comp = this.grid.comp
        const layout = comp.layoutOverride || this.$p.layout?.grids?.[this.id]
        this.grid.layout = layout
        this.grid.interval = this.$p.interval

        if (!layout) {
            return
        }

        // Detect what needs redrawing
        this._crosshairOnly = this._detectCrosshairOnlyUpdate()

        // With dual-canvas mode, we can skip static redraw when only cursor moved
        if (this.hasDualCanvas && this._crosshairOnly && !this._staticDirty && !this._overlaysDirty) {
            // Only update dynamic layer (crosshair)
            this.updateDynamic()
            return
        }

        // Full redraw of static canvas
        this.ctx.clearRect(0, 0, this.grid.canvas.width, this.grid.canvas.height)

        if (this.$p.shaders.length) this.apply_shaders()

        this.drawGrid()

        // PERFORMANCE: Cache sorted overlays - only re-sort when overlays change
        if (this._overlaysSortDirty || this._sortedOverlays.length !== this.overlays.length) {
            this._sortedOverlays = this.overlays.slice()
            this._sortedOverlays.sort((l1, l2) => l1.z - l2.z)
            this._overlaysSortDirty = false
        }

        this._sortedOverlays.forEach(l => {
            if (!l.display) return
            this.ctx.save()
            try {
                let r = l.renderer
                if (r.pre_draw) r.pre_draw(this.ctx)
                r.draw(this.ctx)
                if (r.post_draw) r.post_draw(this.ctx)
            } catch(e) {
                console.error('Overlay draw error:', e)
            } finally {
                this.ctx.restore()
            }
        })

        // Draw crosshair on dynamic canvas if available, otherwise on static
        if (this.hasDualCanvas) {
            this.updateDynamic()
        } else if (this.crosshair) {
            this.crosshair.renderer.draw(this.ctx)
        }

        // Reset dirty flags after successful draw
        this._staticDirty = false
        this._overlaysDirty = false
    }

    // Update only the dynamic canvas (crosshair layer)
    // This is much faster than full redraw for cursor-only changes
    updateDynamic() {
        if (!this.crosshair) return

        const canvas = this.grid.canvasDynamic || this.grid.canvas
        const ctx = this.ctxDynamic

        // Clear dynamic canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height)

        // Draw crosshair
        this.crosshair.renderer.draw(ctx)
    }

    apply_shaders() {
        let layout = this.$p.layout?.grids?.[this.id]
        if (!layout) return
        let props = {
            layout: layout,
            range: this.range,
            interval: this.interval,
            tf: layout.ti_map.tf,
            cursor: this.cursor,
            colors: this.$p.colors,
            sub: this.data,
            font: this.$p.font,
            config: this.$p.config,
            meta: this.$p.meta
        }
        for (let s of this.$p.shaders) {
            this.ctx.save()
            s.draw(this.ctx, props)
            this.ctx.restore()
        }
    }

    drawGrid() {
        this.ctx.strokeStyle = this.$p.colors.grid
        this.ctx.beginPath()

        const ymax = this.layout.height
        for (let [x, p] of this.layout.xs) {
            this.ctx.moveTo(x - 0.5, 0)
            this.ctx.lineTo(x - 0.5, ymax)
        }

        for (let [y, y$] of this.layout.ys) {
            this.ctx.moveTo(0, y - 0.5)
            this.ctx.lineTo(this.layout.width, y - 0.5)
        }

        this.ctx.stroke()

        if (this.$p.grid_id) this.drawUpperBorder()
    }

    drawUpperBorder() {
        this.ctx.strokeStyle = this.$p.colors.scale
        this.ctx.beginPath()
        this.ctx.moveTo(0, 0.5)
        this.ctx.lineTo(this.layout.width, 0.5)
        this.ctx.stroke()
    }

    // Propagate mouse event to overlays
    propagate(name, event) {
        for (let layer of this.overlays) {
            if (layer.renderer[name]) {
                layer.renderer[name](event)
            }
            const mouse = layer.renderer.mouse
            const keys = layer.renderer.keys
            if (mouse.listeners) {
                mouse.emit(name, event)
            }
            if (keys && keys.listeners) {
                keys.emit(name, event)
            }
        }
    }
}
