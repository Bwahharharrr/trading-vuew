<script>
// The side bar (yep, that thing with a bunch of $$$)
// Optimized for Vue 3: no $forceUpdate, targeted watchers

import { h, nextTick } from 'vue'
import Sidebar from './js/sidebar.js'
import Canvas from '../mixins/canvas.js'

export default {
    name: 'Sidebar',
    props: [
        'sub', 'layout', 'range', 'interval', 'cursor', 'colors', 'font',
        'width', 'height', 'grid_id', 'rerender', 'y_transform', 'tv_id',
        'config', 'shaders'
    ],
    mixins: [Canvas],
    mounted() {
        const el = this.$refs['canvas']
        if (!el) {
            // Canvas not created yet (render returned loading state)
            return
        }
        const dynEl = this.$refs['canvasDynamic']
        this.renderer = new Sidebar(el, this, 'right', dynEl)
        this.setup()
        this.redraw()
    },
    render() {
        const id = this.$props.grid_id
        // Use layout override if available (for resize operations)
        const layout = this.layoutOverride ||
            (this.$props.layout?.grids?.[id])
        // Guard against missing layout during initialization
        if (!layout) {
            return h('div', { class: 'trading-vue-sidebar-loading' })
        }
        return this.create_canvas(h, `sidebar-${id}`, {
            position: {
                x: layout.width,
                y: layout.offset || 0
            },
            attrs: {
                rerender: this.$props.rerender,
                width: layout.sb,
                height: layout.height,
            },
            style: {
                backgroundColor: this.$props.colors.back
            },
        })
    },
    methods: {
        // Force resize canvas based on provided layout (for drag resize)
        resize_from_layout(layout) {
            const id = this.$props.grid_id
            const grid = layout ? layout.grids[id] : null
            if (grid && this._attrs) {
                this._attrs.width = grid.sb
                this._attrs.height = grid.height
                // Store layout override
                this.layoutOverride = grid
                // Update wrapper div position
                const wrapper = this.$el
                if (wrapper) {
                    wrapper.style.top = (grid.offset || 0) + 'px'
                    wrapper.style.left = grid.width + 'px'
                }
                // Update renderer's layout reference for correct Y-scale
                if (this.renderer) {
                    this.renderer.layout = grid
                }
                // Trigger re-render via reactive key (replaces $forceUpdate)
                this.renderKey++
                nextTick(() => {
                    this.setup()
                })
            }
        }
    },
    data() {
        return {
            // Override layout for resize operations (bypassing Vue reactivity)
            layoutOverride: null,
            // Reactive key for triggering re-renders (replaces $forceUpdate)
            renderKey: 0
        }
    },
    computed: {
        // Computed hash keys for efficient change detection (replaces deep watchers)
        rangeKey() {
            const r = this.$props.range
            if (!r || r.length < 2) return ''
            return `${r[0]},${r[1]}`
        },
        layoutKey() {
            const id = this.$props.grid_id
            const grid = this.$props.layout?.grids?.[id]
            if (!grid) return ''
            return `${grid.sb},${grid.height},${grid.offset},${grid.width}`
        },
        yTransformKey() {
            const yt = this.$props.y_transform
            if (!yt) return ''
            return `${yt.zoom},${yt.auto},${yt.range?.[0]},${yt.range?.[1]}`
        }
    },
    watch: {
        // Initialize renderer when layout becomes available (deferred init)
        layoutKey: {
            handler(newKey, oldKey) {
                const id = this.$props.grid_id
                const grid = this.$props.layout?.grids?.[id]
                if (!this.renderer && grid) {
                    // Wait for Vue to re-render with canvas element
                    nextTick(() => {
                        if (this.renderer) return  // Already initialized
                        const el = this.$refs['canvas']
                        if (!el) return  // Canvas still not ready
                        const dynEl = this.$refs['canvasDynamic']
                        this.renderer = new Sidebar(el, this, 'right', dynEl)
                        this.setup()
                        this.redraw()
                    })
                } else if (this.renderer && newKey !== oldKey) {
                    // Layout dimensions changed - resize
                    nextTick(() => {
                        this.setup()
                        this.redraw()
                    })
                }
            },
            immediate: false
        },
        // Watch range using computed hash key
        rangeKey(newKey, oldKey) {
            if (!newKey || newKey === oldKey) return
            this.redraw()
        },
        // PERFORMANCE: Watch cursor y$ (price) changes only - use panel-only update
        // This avoids redrawing all price labels when only the cursor panel needs updating
        'cursor.y$': function(newY) {
            if (this._cursorRafPending) return
            this._cursorRafPending = true
            requestAnimationFrame(() => {
                this._cursorRafPending = false
                // Use optimized panel-only update instead of full redraw
                if (this.renderer && this.renderer.updatePanelOnly) {
                    this.renderer.updatePanelOnly()
                } else {
                    this.redraw()
                }
            })
        },
        // Redraw when the sidebar shader set changes. The last-price tag shader
        // registers lazily on the first candle draw (Price.init_shader), so
        // without this the tag wouldn't paint until some other redraw fired.
        // sb_shaders (Section.vue) returns a fresh filtered array on change, so a
        // shallow prop watch is enough.
        shaders() {
            nextTick(() => this.redraw())
        },
        rerender() {
            nextTick(() => this.redraw())
        },
        renderKey() {
            nextTick(() => this.redraw())
        },
        // Watch y-axis transform changes (sidebar zoom/drag)
        yTransformKey(newKey, oldKey) {
            if (!newKey || newKey === oldKey) return
            nextTick(() => this.redraw())
        }
    },
    beforeUnmount () {
        if(this.renderer) this.renderer.destroy()
    }
}

</script>
