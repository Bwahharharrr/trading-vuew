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
            v-on:open-indicator-settings="open_indicator_settings"
            v-on:close-indicator="close_indicator">
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
            v-on:sidebar-transform="sidebar_transform"
            v-on:sidebar-click="sidebar_click"
            v-on:sidebar-cursor="sidebar_cursor">
        </sidebar>
    </div>
</template>

<script>
// Optimized for Vue 3: removed hash hack, targeted watchers

import { nextTick } from 'vue'
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
        // Y-axis click (price-alarm placement): ride the existing custom-event
        // chain (Section → Chart → TradingVue re-emits 'sidebar-click' to App).
        sidebar_click(s) {
            this.$emit('custom-event', { event: 'sidebar-click', args: [s] })
        },
        // Y-axis hover: keep the horizontal crosshair tracking on the chart.
        // Route through the SAME cursor pipeline as grid mousemoves, then
        // repaint the crosshair layer synchronously — grid.js only does that
        // for its own mousemoves, and Grid.vue's redraw watcher keys on
        // cursor.x, which a vertical slide along the axis never changes.
        sidebar_cursor(c) {
            this.cursor_changed(c) // same stamping/path as grid cursor events
            const cur = this.$props.common && this.$props.common.cursor
            if (cur && cur.locked) return
            const gr = this.$refs.grid && this.$refs.grid.renderer &&
                this.$refs.grid.renderer.renderer
            if (gr && gr.hasDualCanvas) gr.updateDynamic()
        },
        emit_meta_props(d) {
            this.meta_props[d.layer_id] = d
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
            // renderer is created deferred (layoutKey watcher) — a tl-mode
            // wheel before that threw on .rezoom_range of null
            if (this.$refs[id] && this.$refs[id].renderer) {
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
        close_indicator(indicatorInfo) {
            // Emit as custom event to be handled by Chart.vue -> App.vue
            this.$emit('custom-event', {
                event: 'close-indicator',
                args: [indicatorInfo]
            })
        },
        // Update legend position during resize using layoutOverride
        updateLegendPosition(layout) {
            const id = this.$props.grid_id
            const grid = layout ? layout.grids[id] : null
            if (grid) {
                // Set layout override so legend_props uses correct layout
                this.legendLayoutOverride = layout
                // Trigger re-render via reactive key (replaces $forceUpdate)
                this.rerender++
            }
        },
        // Clear the layout override (called after normal layout update)
        clearLayoutOverride() {
            this.legendLayoutOverride = null
        },
        // Helper to compute grid height key for change detection
        getGridHeightKey(common) {
            const grids = common?.layout?.grids
            if (!grids) return ''
            return grids.map(g => g?.height ?? 0).join(',')
        }
    },
    computed: {
        // Component-specific props subsets:
        // Vue 3 fix: explicitly access common.layout to track reactivity
        grid_props() {
            const id = this.$props.grid_id
            const common = this.$props.common
            // Force reactivity tracking on layout by explicit access
            const layout = common?.layout
            let p = { ...common }  // Spread for shallow copy

            const grid = layout?.grids?.[id]
            if (grid) {
                // Split offchart data between offchart grids
                if (id > 0 && p.data) {
                    let all = p.data
                    p.data = [p.data[id - 1]].filter(Boolean)
                    // Merge offchart overlays with custom ids with
                    // the existing ones (by comparing the grid ids)
                    p.data.push(...all.filter(
                        x => x.grid && x.grid.id === id))
                }
                p.width = grid.width
                p.height = grid.height
            }

            p.y_transform = p.y_ts?.[id]
            p.shaders = this.grid_shaders
            return p
        },
        sidebar_props() {
            const id = this.$props.grid_id
            const common = this.$props.common
            const layout = common?.layout
            let p = { ...common }

            const grid = layout?.grids?.[id]
            if (grid) {
                p.width = grid.sb
                p.height = grid.height
            }
            p.y_transform = p.y_ts?.[id]
            p.shaders = this.sb_shaders
            return p
        },
        section_values() {
            const id = this.$props.grid_id
            const common = this.$props.common
            const layout = common?.layout
            let p = { ...common }
            const grid = layout?.grids?.[id]
            if (grid) p.width = grid.width
            return p.cursor?.values?.[id]
        },
        legend_props() {
            const id = this.$props.grid_id
            const common = this.$props.common
            const layout = common?.layout  // Force tracking
            let p = { ...common }

            // Split offchart data between offchart grids
            if (id > 0 && p.data) {
                let all = p.data
                p.offchart = all
                p.data = [p.data[id - 1]].filter(Boolean)
                p.data.push(...all.filter(
                    x => x.grid && x.grid.id === id))
            }
            return p
        },
        get_meta_props() {
            return this.meta_props
        },
        grid_shaders() {
            return (this.shaders || []).filter(x => x.target === 'grid')
        },
        sb_shaders() {
            return (this.shaders || []).filter(x => x.target === 'sidebar')
        },
        // Computed hash key for layout changes (replaces deep watcher)
        layoutKey() {
            const layout = this.$props.common?.layout
            if (!layout) return ''
            const gridsCount = layout.grids?.length ?? 0
            const heights = layout.grids?.map(g => g?.height ?? 0).join(',') ?? ''
            return `${gridsCount},${heights}`
        }
    },
    watch: {
        // Watch layout changes using computed key (no deep watcher)
        layoutKey(newKey, oldKey) {
            if (!newKey || newKey === oldKey) return
            this.rerender++
        },
        // Watch specific common properties (NOT deep - cursor changes would trigger too often)
        'common.data.length': function(newLen, oldLen) {
            if (newLen !== oldLen) {
                this.rerender++
            }
        },
        // A live in-place tick bumps the data revision (dataVersion) but changes
        // neither the layout key nor the data length, so without this the sidebar
        // (and its last-price tag shader) would never repaint mid-candle — the
        // boxed Y-axis value would freeze. The Sidebar already watches `rerender`.
        'common.dataVersion': function(newV, oldV) {
            if (newV !== oldV) {
                this.rerender++
            }
        }
    },
    data() {
        return {
            meta_props: {},
            rerender: 0,
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
