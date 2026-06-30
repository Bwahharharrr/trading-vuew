// Grid rendering: canvas drawing, overlay management
// Performance optimized with dual-canvas architecture:
// - Static canvas: grid, candles, overlays (redrawn only when data/range changes)
// - Dynamic canvas: crosshair (redrawn on every cursor move)

import { RenderEngine } from '../../../render/render-engine.js'

export default class GridRenderer {
    constructor(grid) {
        this.grid = grid
        this.overlays = []
        this.crosshair = null

        // Framework-agnostic drawing core (Phase 3.3b). Owns the per-overlay
        // error boundary; persisted across frames so a persistently-failing
        // overlay is reported once, not every frame. grid-renderer keeps the
        // dirty-flag/dual-canvas/lifecycle orchestration and delegates drawing.
        this.engine = new RenderEngine()

        // Dirty tracking for smart redraws
        this._lastRange = null
        this._lastCursorX = null
        this._lastCursorY = null
        this._staticDirty = true  // Force initial draw
        this._overlaysDirty = true
        this._crosshairOnly = false

        // Performance: track if we only need crosshair update
        this._lastDataLength = 0
        this._lastLayoutRef = null

        // PERFORMANCE: Cache sorted overlays to avoid sorting every frame
        this._sortedOverlays = []
        this._overlaysSortDirty = true

        // PERFORMANCE: Reuse one props object across shadered frames instead of
        // allocating a fresh 10-key object each redraw. Safe because shaders read
        // the field VALUES synchronously in-frame and never retain its identity.
        this._shaderPropsObj = {
            layout: null,
            range: null,
            interval: null,
            tf: null,
            cursor: null,
            colors: null,
            sub: null,
            font: null,
            config: null,
            meta: null
        }
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
        // Scale-version seam (plan §2.2 — the reactivity migration, same class as
        // dataVersion→cd.revision: explicit + shallow, no deep watcher). Dirty when
        // the price/time scale MOVED. Tracks both the scale object IDENTITY (a fresh
        // `new Layout` births new scales at version 0 → identity changes every
        // frame, the per-frame rebuild model — this subsumes the old `_lastLayoutRef`
        // check) AND the monotonic VERSION (a future in-place Reposition bumps
        // `version` WITHOUT changing identity). Either ⇒ static dirty. Strictly
        // additive: it can only ADD a dirty trigger, never swallow one, so a live
        // tick / pan can never be missed.
        const layoutRef = this.layout
        const ps = layoutRef && layoutRef.priceScale
        const ts = layoutRef && layoutRef.timeScale
        const psv = ps ? ps.version : -1
        const tsv = ts ? ts.version : -1
        if (this._lastLayoutRef !== layoutRef ||
            this._lastPS !== ps || this._lastTS !== ts ||
            this._lastPSV !== psv || this._lastTSV !== tsv) {
            this._lastLayoutRef = layoutRef
            this._lastPS = ps; this._lastTS = ts
            this._lastPSV = psv; this._lastTSV = tsv
            this._staticDirty = true
            this._overlaysDirty = true
            return false
        }

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

    update(freshGridLayout) {
        const comp = this.grid.comp
        // `freshGridLayout` (RenderScheduler drain) is the just-built
        // chartLayout.grids[id], passed directly because the reactive `layout`
        // PROP only flushes on the post-drain microtask — reading it here would
        // paint a frame-stale scale. Falls back to the prop for the legacy path.
        const layout = freshGridLayout || comp.layoutOverride ||
            this.$p.layout?.grids?.[this.id]
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

        // PERFORMANCE: Cache sorted overlays - only re-sort when overlays change
        if (this._overlaysSortDirty || this._sortedOverlays.length !== this.overlays.length) {
            this._sortedOverlays = this.overlays.slice()
            this._sortedOverlays.sort((l1, l2) => l1.z - l2.z)
            this._overlaysSortDirty = false
        }

        // Build an immutable frame and delegate the draw to the RenderEngine
        // (clear -> shaders -> grid -> overlays -> crosshair). Identical
        // sequence to the old inline code.
        this.engine.renderStatic(this.ctx, {
            canvas: this.grid.canvas,
            layout: this.layout,
            colors: this.$p.colors,
            overlays: this._sortedOverlays,
            shaders: this.$p.shaders,
            shaderProps: this.$p.shaders.length ? this._shaderProps() : null,
            // Draw crosshair on the static canvas only when there's no dynamic one.
            crosshair: this.crosshair,
            drawCrosshairHere: !this.hasDualCanvas,
            upperBorder: !!this.$p.grid_id,
        })

        // With a dynamic canvas, the crosshair is drawn there instead.
        if (this.hasDualCanvas) this.updateDynamic()

        // Reset dirty flags after successful draw
        this._staticDirty = false
        this._overlaysDirty = false
    }

    // Update only the dynamic canvas (crosshair layer)
    // This is much faster than full redraw for cursor-only changes
    updateDynamic() {
        const canvas = this.grid.canvasDynamic || this.grid.canvas
        this.engine.renderDynamic(this.ctxDynamic, canvas, this.crosshair)
    }

    // Props passed to grid shaders (resolved layout + theme + cursor).
    // Mutates and returns ONE persistent object (see constructor) rather than
    // allocating a new one each frame; shaders read field values in-frame only.
    _shaderProps() {
        const layout = this.layout
        const p = this._shaderPropsObj
        p.layout = layout
        p.range = this.range
        p.interval = this.interval
        p.tf = layout.ti_map.tf
        p.cursor = this.cursor
        p.colors = this.$p.colors
        p.sub = this.data
        p.font = this.$p.font
        p.config = this.$p.config
        p.meta = this.$p.meta
        return p
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
