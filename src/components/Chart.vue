<template>
    <!-- Chart components combined together -->
    <div class="trading-vue-chart" :style="styles">
        <keyboard ref="keyboard"></keyboard>
        <grid-section v-for="(grid, i) in (this.chartLayout?.grids || [])"
            :key="grid.id" ref="sec"
            v-bind:common="section_props(i)"
            v-bind:grid_id="i"
            v-on:register-kb-listener="register_kb"
            v-on:remove-kb-listener="remove_kb"
            v-on:range-changed="range_changed"
            v-on:cursor-changed="cursor_changed"
            v-on:cursor-locked="cursor_locked"
            v-on:sidebar-transform="set_ytransform"
            v-on:layer-meta-props="layer_meta_props"
            v-on:custom-event="emit_custom_event"
            v-on:legend-button-click="legend_button_click"
            >
        </grid-section>
        <grid-resizer v-for="i in resizerIndices"
            :key="'resizer-' + i"
            :grid_id="i"
            :layout="chartLayout"
            :colors="colors"
            v-on:resize-grids="on_resize_grids"
            v-on:resize-complete="on_resize_complete"
            v-on:toggle-minimize="on_toggle_minimize">
        </grid-resizer>
        <botbar v-bind="botbar_props"
            :shaders="shaders" :timezone="timezone"
            v-on:botbar-zoom="range_changed">
        </botbar>
    </div>
</template>

<script>

import { markRaw } from 'vue'
import Context from '../stuff/context.js'
import Utils from '../stuff/utils.js'
import CursorUpdater from './js/updater.js'
import GridSection from './Section.vue'
import Botbar from './Botbar.vue'
import Keyboard from './Keyboard.vue'
import GridResizer from './GridResizer.vue'
import Shaders from '../mixins/shaders.js'
import DataTrack from '../mixins/datatrack.js'
import Layout from './js/layout.js'

// Decomposed chart mixins
import { ChartRange, ChartResize, ChartCursor, ChartEvents } from '../mixins/chart/index.js'

export default {
    name: 'Chart',
    props: [
        'title_txt', 'data', 'width', 'height', 'font', 'colors',
        'overlays', 'tv_id', 'config', 'buttons', 'toolbar', 'ib',
        'skin', 'timezone'
    ],
    mixins: [Shaders, DataTrack, ChartRange, ChartResize, ChartCursor, ChartEvents],
    components: {
        GridSection,
        Botbar,
        Keyboard,
        GridResizer
    },
    created() {
        // Context for text measurements
        this.ctx = new Context(this.$props)

        // Initial layout
        this.init_range()
        this.sub = this.subset()
        Utils.overwrite(this.range, this.range)

        // Layout is imported statically at the top (ESM live bindings resolve
        // any cycle by created()-time; webpack's require() polyfill is gone).
        // CRITICAL: Create plain object with unwrapped values for Layout
        // Vue 3 reactive proxies don't spread correctly - use direct index access
        const rangeArr = [this.range[0], this.range[1]]  // Direct access, not spread
        const subArr = Array.from(this.sub)  // Use Array.from instead of spread
        const layoutParams = {
            chart: this.chart,
            sub: subArr,
            offsub: this.offsub,
            interval: this.interval,
            range: rangeArr,
            ctx: this.ctx,
            layers_meta: this.layers_meta,
            ti_map: this.ti_map,
            $props: this.$props,
            y_transforms: this.y_transforms,
            customGridHeights: this.customGridHeights,
            minimizedGrids: this.minimizedGrids
        }
        // Use markRaw to prevent Vue from making Layout deeply reactive
        this.chartLayout = markRaw(new Layout(layoutParams))

        // Updates current cursor values
        this.updater = new CursorUpdater(this)

        this.update_last_values()
        this.init_shaders(this.skin)
    },
    methods: {
        section_props(i) {
            return i === 0 ? this.main_section : this.sub_section
        },

        // Performance: Targeted update methods to avoid full chart reset

        // Toggle visibility of a specific overlay
        toggleOverlayVisibility(gridId, overlayId, display) {
            const section = this.$refs.sec?.[gridId]
            const grid = section?.$refs?.grid
            if (grid?.renderer?.renderer) {
                grid.renderer.renderer.show_hide_layer({ id: overlayId, display })
                grid.redraw()
            }
        },

        // Refresh offchart overlays without full reset
        // Use when adding/removing offchart indicators
        refreshOffchartOverlays() {
            this.rerender++
            this.$nextTick(() => this.update_layout())
        }
    },
    computed: {
        main_section() {
            const layout = this.chartLayout
            let p = Object.assign({}, this.common_props())
            p.layout = layout
            p.data = this.overlay_subset(this.onchart, 'onchart')
            p.data.push({
                type: this.chart.type || 'Candles',
                main: true,
                data: this.sub,
                i0: this.sub_start,
                settings: this.chart.settings || this.settings_ohlcv,
                grid: this.chart.grid || {},
                last: this.last_candle
            })
            p.overlays = this.$props.overlays
            return p
        },
        sub_section() {
            const layout = this.chartLayout
            let p = Object.assign({}, this.common_props())
            p.layout = layout
            p.data = this.overlay_subset(this.offchart, 'offchart')
            p.overlays = this.$props.overlays
            return p
        },
        botbar_props() {
            const layout = this.chartLayout
            if (!layout || !layout.botbar) {
                return {}
            }
            let p = Object.assign({}, this.common_props())
            p.layout = layout
            p.width = layout.botbar.width
            p.height = layout.botbar.height
            p.rerender = this.rerender
            return p
        },
        offsub() {
            return this.overlay_subset(this.offchart, 'offchart')
        },
        ohlcv() {
            return this.$props.data.ohlcv || this.chart.data || []
        },
        chart() {
            return this.$props.data.chart || { grid: {} }
        },
        onchart() {
            return this.$props.data.onchart || []
        },
        offchart() {
            const all = this.$props.data.offchart || []
            return all.filter(x => {
                if (!x.settings) return true
                return x.settings.display !== false
            })
        },
        filter() {
            return this.$props.ib ?
                Utils.fast_filter_i : Utils.fast_filter
        },
        styles() {
            let w = this.$props.toolbar ? this.$props.config.TOOLBAR : 0
            return {
                'margin-left': `${w}px`,
                'position': 'relative'
            }
        },
        meta() {
            return {
                last: this.last_candle,
                sub_start: this.sub_start,
                activated: this.activated
            }
        },
        forced_tf() {
            return this.chart.tf
        },
        visibleOffchartCount() {
            return this.offchart.length
        },
        resizerIndices() {
            if (!this.chartLayout || !this.chartLayout.grids) {
                return []
            }
            const count = this.chartLayout.grids.length
            let indices = []
            for (let i = 1; i < count; i++) {
                indices.push(i)
            }
            return indices
        }
    },
    watch: {
        visibleOffchartCount() {
            this.update_layout()
            this.update_last_values()
        }
    },
    data() {
        return {
            // Default OHLCV settings (when using DataStructure v1.0)
            settings_ohlcv: {},
            // Default overlay settings
            settings_ov: {},
            // Meta data
            activated: false
        }
    }
}

</script>
