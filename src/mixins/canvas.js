// Interactive canvas-based component with dual-layer rendering
// Static layer: grid, candles, overlays (only redrawn when data/range changes)
// Dynamic layer: crosshair (redrawn on every cursor move)
// Should implement: mousemove, mouseout, mouseup, mousedown, click

import { h } from 'vue'
import Utils from '../stuff/utils.js'

export default {
    methods: {
        setup() {
            const id = `${this.$props.tv_id}-${this._id}-canvas`
            const canvas = document.getElementById(id)
            if (!canvas) return  // Guard against missing canvas during deferred init

            // Also setup dynamic canvas for crosshair layer
            const dynamicCanvas = document.getElementById(`${id}-dynamic`)

            let dpr = window.devicePixelRatio || 1
            if (dpr < 1) dpr = 1 // Issue #63

            // Setup static (main) canvas
            canvas.style.width = `${this._attrs.width}px`
            canvas.style.height = `${this._attrs.height}px`

            // Setup dynamic canvas (same size, positioned on top)
            if (dynamicCanvas) {
                dynamicCanvas.style.width = `${this._attrs.width}px`
                dynamicCanvas.style.height = `${this._attrs.height}px`
            }

            this.$nextTick(() => {
                let rect = canvas.getBoundingClientRect()
                canvas.width = rect.width * dpr
                canvas.height = rect.height * dpr
                const ctx = canvas.getContext('2d')
                ctx.scale(dpr, dpr)

                // Setup dynamic canvas context
                if (dynamicCanvas) {
                    dynamicCanvas.width = rect.width * dpr
                    dynamicCanvas.height = rect.height * dpr
                    const ctxDynamic = dynamicCanvas.getContext('2d')
                    ctxDynamic.scale(dpr, dpr)
                    // Store dynamic context for renderer
                    this._ctxDynamic = ctxDynamic
                    this._canvasDynamic = dynamicCanvas
                }

                // CRITICAL: Setting canvas.width/height clears the canvas content.
                // Force a full redraw by marking static content as dirty.
                // This ensures any drawing done before this $nextTick is redrawn.
                if (this.renderer?.renderer?.markStaticDirty) {
                    this.renderer.renderer.markStaticDirty()
                }

                this.redraw()
                // Fallback fix for Brave browser
                // https://github.com/brave/brave-browser/issues/1738
                if (!ctx.measureTextOrg) {
                    ctx.measureTextOrg = ctx.measureText
                }
                ctx.measureText = text =>
                    Utils.measureText(ctx, text, this.$props.tv_id)
            })
        },
        create_canvas(h_arg, id, props) {
            // Note: h_arg is ignored in Vue 3, we use the imported h
            this._id = id
            this._attrs = props.attrs
            const baseId = `${this.$props.tv_id}-${id}-canvas`

            return h('div', {
                class: `trading-vue-${id}`,
                style: {
                    left: props.position.x + 'px',
                    top: props.position.y + 'px',
                    position: 'absolute',
                    zIndex: 1,
                }
            }, [
                // Static layer canvas (grid, candles, overlays)
                h('canvas', {
                    id: baseId,
                    width: props.attrs.width,
                    height: props.attrs.height,
                    ref: 'canvas',
                    style: Object.assign({}, props.style, {
                        position: 'absolute',
                        left: 0,
                        top: 0
                    }),
                }),
                // Dynamic layer canvas (crosshair) - positioned on top, receives mouse events
                // IMPORTANT: Must have transparent background to show static canvas underneath
                h('canvas', {
                    onMousemove: e => this.renderer && this.renderer.mousemove(e),
                    onMouseout: e => this.renderer && this.renderer.mouseout(e),
                    onMouseup: e => this.renderer && this.renderer.mouseup(e),
                    onMousedown: e => this.renderer && this.renderer.mousedown(e),
                    onDblclick: e => this.on_dblclick && this.on_dblclick(e),
                    id: `${baseId}-dynamic`,
                    width: props.attrs.width,
                    height: props.attrs.height,
                    ref: 'canvasDynamic',
                    style: {
                        position: 'absolute',
                        left: 0,
                        top: 0,
                        pointerEvents: 'auto',  // Receives all mouse events
                        backgroundColor: 'transparent'  // Must be transparent to show static canvas
                    },
                })
            ].concat(props.hs || []))
        },
        redraw() {
            if (!this.renderer) return
            this.renderer.update()
        },
        // Redraw only the dynamic (crosshair) layer - much faster for cursor moves
        redrawDynamic() {
            if (!this.renderer) return
            this.renderer.updateDynamic()
        }
    },
    computed: {
        // Consolidated dimension key for efficient change detection
        canvasDimensions() {
            return `${this.width}x${this.height}`
        }
    },
    watch: {
        // Single watcher for both dimensions - avoids double setup() calls
        canvasDimensions(newVal) {
            if (this._attrs) {
                this._attrs.width = this.width
                this._attrs.height = this.height
                this.setup()
            }
        }
    }
}
