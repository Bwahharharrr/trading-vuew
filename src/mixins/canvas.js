// Interactive canvas-based component
// Should implement: mousemove, mouseout, mouseup, mousedown, click

import { h } from 'vue'
import Utils from '../stuff/utils.js'

export default {
    methods: {
        setup() {
            const id = `${this.$props.tv_id}-${this._id}-canvas`
            const canvas = document.getElementById(id)
            if (!canvas) return  // Guard against missing canvas during deferred init
            let dpr = window.devicePixelRatio || 1
            canvas.style.width = `${this._attrs.width}px`
            canvas.style.height = `${this._attrs.height}px`
            if (dpr < 1) dpr = 1 // Realy ? That's it? Issue #63
            this.$nextTick(() => {
                var rect = canvas.getBoundingClientRect()
                canvas.width = rect.width * dpr
                canvas.height = rect.height * dpr
                const ctx = canvas.getContext('2d', {
                    // TODO: test the boost:
                    //alpha: false,
                    //desynchronized: true,
                    //preserveDrawingBuffer: false
                })
                ctx.scale(dpr, dpr)
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
            return h('div', {
                class: `trading-vue-${id}`,
                style: {
                    left: props.position.x + 'px',
                    top: props.position.y + 'px',
                    position: 'absolute',
                    zIndex: 1,
                }
            }, [
                h('canvas', {
                    onMousemove: e => this.renderer && this.renderer.mousemove(e),
                    onMouseout: e => this.renderer && this.renderer.mouseout(e),
                    onMouseup: e => this.renderer && this.renderer.mouseup(e),
                    onMousedown: e => this.renderer && this.renderer.mousedown(e),
                    onDblclick: e => this.on_dblclick && this.on_dblclick(e),
                    id: `${this.$props.tv_id}-${id}-canvas`,
                    width: props.attrs.width,
                    height: props.attrs.height,
                    ref: 'canvas',
                    style: props.style,
                })
            ].concat(props.hs || []))
        },
        redraw() {
            if (!this.renderer) return
            this.renderer.update()
        }
    },
    watch: {
        width(val) {
            this._attrs.width = val
            this.setup()
        },
        height(val) {
            this._attrs.height = val
            this.setup()
        }
    }
}
