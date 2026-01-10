<script>
// The side bar (yep, that thing with a bunch of $$$)

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
        this.renderer = new Sidebar(el, this)
        this.setup()
        this.redraw()
    },
    render(h) {
        const id = this.$props.grid_id
        // Use layout override if available (for resize operations)
        const layout = this.layoutOverride ||
            this.$props.layout.grids[id]
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
                // Force re-render and setup
                this.$forceUpdate()
                this.$nextTick(() => {
                    this.setup()
                })
            }
        }
    },
    data() {
        return {
            // Override layout for resize operations (bypassing Vue reactivity)
            layoutOverride: null
        }
    },
    watch: {
        range: {
            handler: function() { this.redraw() },
            deep: true
        },
        cursor: {
            handler: function() { this.redraw() },
            deep: true
        },
        rerender() {
            this.$nextTick(() => this.redraw())
        }
    },
    beforeDestroy () {
        if(this.renderer) this.renderer.destroy()
    }
}

</script>
