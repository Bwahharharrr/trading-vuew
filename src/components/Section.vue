<template>
    <!-- Horizontal section: (grid + sidebar) -->
    <div class="trading-vue-section">
        <chart-legend ref="legend"
            v-bind:values="section_values"
            v-bind:grid_id="grid_id"
            v-bind:common="legend_props"
            v-bind:meta_props="get_meta_props"
            v-bind:layout_override="legendLayoutOverride"
            v-on:legend-button-click="button_click"
            v-on:legend-dblclick="legend_dblclick"
            v-on:open-indicator-settings="open_indicator_settings">
        </chart-legend>
        <grid v-bind="grid_props" ref="grid"
            v-bind:grid_id="grid_id"
             v-on:register-kb-listener="register_kb"
             v-on:remove-kb-listener="remove_kb"
             v-on:range-changed="range_changed"
             v-on:cursor-changed="cursor_changed"
             v-on:cursor-locked="cursor_locked"
             v-on:layer-meta-props="emit_meta_props"
             v-on:custom-event="emit_custom_event"
             v-on:sidebar-transform="sidebar_transform"
             v-on:rezoom-range="rezoom_range">
        </grid>
        <sidebar
            :ref="'sb-' + grid_id"
            v-bind="sidebar_props"
            v-bind:grid_id="grid_id"
            v-bind:rerender="rerender"
            v-on:sidebar-transform="sidebar_transform">
        </sidebar>
    </div>
</template>

<script>

import Grid from './Grid.vue'
import Sidebar from './Sidebar.vue'
import ChartLegend from './Legend.vue'
import Shaders from '../mixins/shaders.js'

export default {
    name: 'GridSection',
    props: ['common', 'grid_id'],
    mixins: [Shaders],
    components: {
        Grid,
        Sidebar,
        ChartLegend
    },
    mounted() {
        this.init_shaders(this.$props.common.skin)
    },
    methods: {
        range_changed(r) {
            this.$emit('range-changed', r)
        },
        cursor_changed(c) {
            c.grid_id = this.$props.grid_id
            this.$emit('cursor-changed', c)
        },
        cursor_locked(state) {
            this.$emit('cursor-locked', state)
        },
        sidebar_transform(s) {
            this.$emit('sidebar-transform', s)
        },
        emit_meta_props(d) {
            this.$set(this.meta_props, d.layer_id, d)
            this.$emit('layer-meta-props', d)
        },
        emit_custom_event(d) {
            this.on_shader_event(d, 'sidebar')
            this.$emit('custom-event', d)
        },
        button_click(event) {
            this.$emit('legend-button-click', event)
        },
        legend_dblclick(grid_id) {
            // Emit as custom event to be handled by Chart.vue
            this.$emit('custom-event', {
                event: 'grid-dblclick',
                args: [grid_id]
            })
        },
        register_kb(event) {
            this.$emit('register-kb-listener', event)
        },
        remove_kb(event) {
            this.$emit('remove-kb-listener', event)
        },
        rezoom_range(event) {
            let id = 'sb-' + event.grid_id
            if (this.$refs[id]) {
                this.$refs[id].renderer.rezoom_range(
                    event.z, event.diff1, event.diff2
                )
            }
        },
        open_indicator_settings(indicatorInfo) {
            // Emit as custom event to be handled by Chart.vue -> App.vue
            this.$emit('custom-event', {
                event: 'open-indicator-settings',
                args: [indicatorInfo]
            })
        },
        ghash(val) {
            // Measures grid heights configuration
            let hs = val.layout.grids.map(x => x.height)
            return hs.reduce((a, b) => a + b, '')
        },
        // Update legend position during resize using layoutOverride
        updateLegendPosition(layout) {
            const id = this.$props.grid_id
            const grid = layout ? layout.grids[id] : null
            if (grid) {
                // Set layout override so legend_props uses correct layout
                this.legendLayoutOverride = layout
                this.$forceUpdate()
            }
        },
        // Clear the layout override (called after normal layout update)
        clearLayoutOverride() {
            this.legendLayoutOverride = null
        }
    },
    computed: {
        // Component-specific props subsets:
        grid_props() {
            const id = this.$props.grid_id
            let p = Object.assign({}, this.$props.common)

            // Split offchart data between offchart grids
            if (id > 0) {
                let all = p.data
                p.data = [p.data[id - 1]]
                // Merge offchart overlays with custom ids with
                // the existing onse (by comparing the grid ids)
                p.data.push(...all.filter(
                    x => x.grid && x.grid.id === id))
            }

            p.width = p.layout.grids[id].width
            p.height = p.layout.grids[id].height
            p.y_transform = p.y_ts[id]
            p.shaders = this.grid_shaders
            return p
        },
        sidebar_props() {
            const id = this.$props.grid_id
            let p = Object.assign({}, this.$props.common)
            p.width = p.layout.grids[id].sb
            p.height = p.layout.grids[id].height
            p.y_transform = p.y_ts[id]
            p.shaders = this.sb_shaders
            return p
        },
        section_values() {
            const id = this.$props.grid_id
            let p = Object.assign({}, this.$props.common)
            p.width = p.layout.grids[id].width
            return p.cursor.values[id]
        },
        legend_props() {
            const id = this.$props.grid_id
            let p = Object.assign({}, this.$props.common)

            // Split offchart data between offchart grids
            if (id > 0) {
                let all = p.data
                p.offchart = all
                p.data = [p.data[id - 1]]
                p.data.push(...all.filter(
                    x => x.grid && x.grid.id === id))
            }
            return p
        },
        get_meta_props() {
            return this.meta_props
        },
        grid_shaders() {
            return this.shaders.filter(x => x.target === 'grid')
        },
        sb_shaders() {
            return this.shaders.filter(x => x.target === 'sidebar')
        }
    },
    watch: {
        common: {
            handler: function (val, old_val) {
                let newhash = this.ghash(val)
                if (newhash !== this.last_ghash) {
                    this.rerender++
                }

                if(val.data.length !== old_val.data.length) {
                    // Look at this nasty trick!
                    this.rerender++
                }
                 this.last_ghash = newhash
            },
            deep: true
        }
    },
    data() {
        return {
            meta_props: {},
            rerender: 0,
            last_ghash: '',
            legendLayoutOverride: null
        }
    }
}
</script>
<style>
.trading-vue-section {
    height: 0;
    position: absolute;
}
</style>
