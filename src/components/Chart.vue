<template>
    <!-- Chart components combined together -->
    <div class="trading-vue-chart" :style="styles">
        <keyboard ref="keyboard"></keyboard>
        <grid-section v-for="(grid, i) in this._layout.grids"
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
            :layout="_layout"
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

import Context from '../stuff/context.js'
import Layout from './js/layout.js'
import Utils from '../stuff/utils.js'
import CursorUpdater from './js/updater.js'
import GridSection from './Section.vue'
import Botbar from './Botbar.vue'
import Keyboard from './Keyboard.vue'
import GridResizer from './GridResizer.vue'
import Shaders from '../mixins/shaders.js'
import DataTrack from '../mixins/datatrack.js'
import TI from './js/ti_mapping.js'
import Const from '../stuff/constants.js'


export default {
    name: 'Chart',
    props: [
        'title_txt', 'data', 'width', 'height', 'font', 'colors',
        'overlays', 'tv_id', 'config', 'buttons', 'toolbar', 'ib',
        'skin', 'timezone'
    ],
    mixins: [Shaders, DataTrack],
    components: {
        GridSection,
        Botbar,
        Keyboard,
        GridResizer
    },
    created() {

        // Context for text measurements
        this.ctx = new Context(this.$props)

        // Initial layout (All measurments for the chart)
        this.init_range()
        this.sub = this.subset()
        Utils.overwrite(this.range, this.range) // Fix for IB mode
        this._layout = new Layout(this)

        // Updates current cursor values
        this.updater = new CursorUpdater(this)

        this.update_last_values()
        this.init_shaders(this.skin)
    },
    methods: {
        range_changed(r) {
            // Overwite & keep the original references
            // Quick fix for IB mode (switch 2 next lines)
            // TODO: wtf?
            var sub = this.subset(r)
            Utils.overwrite(this.range, r)
            Utils.overwrite(this.sub, sub)
            this.update_layout()
            this.$emit('range-changed', r)
            if (this.$props.ib) this.save_data_t()
        },
        goto(t) {
            const dt = this.range[1] - this.range[0]
            this.range_changed([t - dt, t])
        },
        setRange(t1, t2) {
            this.range_changed([t1, t2])
        },
        cursor_changed(e) {
            if (e.mode) this.cursor.mode = e.mode
            if (this.cursor.mode !== 'explore') {
                this.updater.sync(e)
            }
            if (this._hook_xchanged) this.ce('?x-changed', e)
        },
        cursor_locked(state) {
            if (this.cursor.scroll_lock && state) return
            this.cursor.locked = state
            if (this._hook_xlocked) this.ce('?x-locked', state)
        },
        calc_interval() {
            let tf = Utils.parse_tf(this.forced_tf)
            if (this.ohlcv.length < 2 && !tf) return
            this.interval_ms = tf || Utils.detect_interval(this.ohlcv)
            this.interval = this.$props.ib ? 1 : this.interval_ms
            Utils.warn(
                () => this.$props.ib && !this.chart.tf,
                Const.IB_TF_WARN, Const.SECOND
            )
        },
        set_ytransform(s) {
            let obj = this.y_transforms[s.grid_id] || {}
            Object.assign(obj, s)
            this.$set(this.y_transforms, s.grid_id, obj)
            this.update_layout()
            Utils.overwrite(this.range, this.range)
        },
        default_range() {
            const dl = this.$props.config.DEFAULT_LEN
            const ml = this.$props.config.MINIMUM_LEN + 0.5
            const l = this.ohlcv.length - 1

            if (this.ohlcv.length < 2) return
            if (this.ohlcv.length <= dl) {
                var s = 0, d = ml
            } else {
                s = l - dl, d = 0.5
            }
            if (!this.$props.ib) {
                Utils.overwrite(this.range, [
                    this.ohlcv[s][0] - this.interval * d,
                    this.ohlcv[l][0] + this.interval * ml
                ])
            } else {
                Utils.overwrite(this.range, [
                    s - this.interval * d,
                    l + this.interval * ml
                ])
            }
        },
        subset(range = this.range) {
            var [res, index] = this.filter(
                this.ohlcv,
                range[0] - this.interval,
                range[1]
            )
            this.ti_map = new TI()
            if (res) {
                this.sub_start = index
                this.ti_map.init(this, res)
                if (!this.$props.ib) return res || []
                return this.ti_map.sub_i
            }
            return []
        },
        common_props() {
            return {
                title_txt: this.chart.name || this.$props.title_txt,
                layout: this._layout,
                sub: this.sub,
                range: this.range,
                interval: this.interval,
                cursor: this.cursor,
                colors: this.$props.colors,
                font: this.$props.font,
                y_ts: this.y_transforms,
                tv_id: this.$props.tv_id,
                config: this.$props.config,
                buttons: this.$props.buttons,
                meta: this.meta,
                skin: this.$props.skin
            }
        },
        overlay_subset(source, side) {
            return source.map((d, i) => {
                let res = Utils.fast_filter(
                    d.data, this.ti_map.i2t_mode(
                        this.range[0] - this.interval,
                        d.indexSrc
                    ),
                    this.ti_map.i2t_mode(this.range[1], d.indexSrc)
                )
                return {
                    type: d.type,
                    name: Utils.format_name(d),
                    data: this.ti_map.parse(res[0] || [], d.indexSrc || 'map'),
                    settings: d.settings || this.settings_ov,
                    grid: d.grid || {},
                    tf: Utils.parse_tf(d.tf),
                    i0: res[1],
                    loading: d.loading,
                    last: (this.last_values[side] || [])[i]
                }

            })
        },
        section_props(i) {
            return i === 0 ?
                this.main_section : this.sub_section
        },
        init_range() {
            this.calc_interval()
            this.default_range()
        },
        layer_meta_props(d) {
            // TODO: check reactivity when layout is changed
            if (!(d.grid_id in this.layers_meta)) {
                this.$set(this.layers_meta, d.grid_id, {})
            }
            this.$set(this.layers_meta[d.grid_id],
                d.layer_id, d)

            // Rerender
            this.update_layout()
        },
        remove_meta_props(grid_id, layer_id) {
            if (grid_id in this.layers_meta) {
                this.$delete(this.layers_meta[grid_id],layer_id)
            }
        },
        emit_custom_event(d) {
            this.on_shader_event(d, 'botbar')
            this.$emit('custom-event', d)
            if (d.event === 'remove-layer-meta') {
                this.remove_meta_props(...d.args)
            }
            // Handle double-click on off-chart grid to minimize
            if (d.event === 'grid-dblclick') {
                this.on_toggle_minimize(d.args[0])
            }
            // Handle double-click on main chart to minimize all off-charts
            if (d.event === 'minimize-all-offcharts') {
                this.minimize_all_offcharts()
            }
            // Handle open indicator settings modal
            if (d.event === 'open-indicator-settings') {
                this.$emit('open-indicator-settings', d.args[0])
            }
        },
        update_layout(clac_tf, forceResize = false) {
            if (clac_tf) this.calc_interval()
            // Create new layout and assign directly (triggers Vue reactivity)
            this._layout = new Layout(this)
            this.rerender++

            const layout = this._layout
            if (forceResize) {
                // During active resize, force immediate visual updates
                if (this.$refs.sec) {
                    this.$refs.sec.forEach((section, i) => {
                        const grid = section && section.$refs.grid
                        const sidebar = section && section.$refs['sb-' + i]
                        // Update via resize_from_layout for immediate feedback
                        if (grid && grid.resize_from_layout) {
                            grid.resize_from_layout(layout)
                        }
                        if (sidebar && sidebar.resize_from_layout) {
                            sidebar.resize_from_layout(layout)
                        }
                        // Update legend position
                        if (section && section.updateLegendPosition) {
                            section.updateLegendPosition(layout)
                        }
                    })
                }
            } else {
                // Normal update - clear any layoutOverride so Vue reactivity takes over
                if (this.$refs.sec) {
                    this.$refs.sec.forEach((section, i) => {
                        const grid = section && section.$refs.grid
                        const sidebar = section && section.$refs['sb-' + i]
                        if (grid && grid.layoutOverride) {
                            grid.layoutOverride = null
                            if (grid.renderer) grid.renderer.layout = layout.grids[i]
                        }
                        if (sidebar && sidebar.layoutOverride) {
                            sidebar.layoutOverride = null
                            if (sidebar.renderer) sidebar.renderer.layout = layout.grids[i]
                        }
                        // Clear legend layout override
                        if (section && section.clearLayoutOverride) {
                            section.clearLayoutOverride()
                        }
                    })
                }
            }
            if (this._hook_update) this.ce('?chart-update', this._layout)
        },
        legend_button_click(event) {
            this.$emit('legend-button-click', event)
        },
        register_kb(event) {
            if (!this.$refs.keyboard) return
            this.$refs.keyboard.register(event)
        },
        remove_kb(event) {
            if (!this.$refs.keyboard) return
            this.$refs.keyboard.remove(event)
        },
        update_last_values() {
            this.last_candle = this.ohlcv ?
                this.ohlcv[this.ohlcv.length - 1] : undefined
            this.last_values = { onchart: [], offchart: [] }
            this.onchart.forEach((x, i) => {
                let d = x.data || []
                this.last_values.onchart[i] = d[d.length - 1]
            })
            this.offchart.forEach((x, i) => {
                let d = x.data || []
                this.last_values.offchart[i] = d[d.length - 1]
            })
        },
        // Hook events for extensions
        ce(event, ...args) {
            this.emit_custom_event({ event, args })
        },
        // Set hooks list (called from an extension)
        hooks(...list) {
            list.forEach(x => this[`_hook_${x}`] = true)
        },
        // Grid resize handlers
        on_resize_grids(e) {
            this.isResizing = true
            this.$set(this.customGridHeights, e.gridAbove, e.heightAbove)
            this.$set(this.customGridHeights, e.gridBelow, e.heightBelow)
            this.update_layout(false, true)  // forceResize = true
        },
        on_resize_complete() {
            // Save heights for restore after minimize
            const grids = this._layout.grids
            grids.forEach((g, i) => {
                if (!this.minimizedGrids[i]) {
                    this.$set(this.savedGridHeights, i, g.height)
                }
            })
            // End resize mode - layoutOverride stays set until next normal update
            this.isResizing = false
        },
        on_toggle_minimize(gridId) {
            const isMinimized = this.minimizedGrids[gridId]

            if (isMinimized) {
                // Restore from minimized state
                this.$set(this.minimizedGrids, gridId, false)
                // Restore saved height
                if (this.savedGridHeights[gridId]) {
                    this.$set(this.customGridHeights, gridId, this.savedGridHeights[gridId])
                } else {
                    this.$delete(this.customGridHeights, gridId)
                }
            } else {
                // Save current height before minimizing
                const currentHeight = this._layout.grids[gridId]?.height
                if (currentHeight) {
                    this.$set(this.savedGridHeights, gridId, currentHeight)
                }
                // Minimize
                this.$set(this.minimizedGrids, gridId, true)
            }

            // Redistribute remaining space to other grids
            this.redistribute_heights(gridId, isMinimized)
            // Use forceResize to trigger immediate visual updates
            this.update_layout(false, true)
        },
        redistribute_heights(changedGridId, wasMinimized) {
            const grids = this._layout.grids
            const MINIMIZED_HEIGHT = 28
            const MIN_MAIN_CHART_HEIGHT = 100  // Minimum height for main chart
            const MIN_OFFCHART_HEIGHT = 50     // Minimum height for off-charts when donating space

            if (wasMinimized) {
                // EXPANDING: first try main chart, then off-charts above
                const restoreHeight = this.savedGridHeights[changedGridId] || 150
                let remainingDelta = restoreHeight - MINIMIZED_HEIGHT

                // First, try to take from main chart
                const mainChartHeight = this.customGridHeights[0] || grids[0]?.height || 100
                const mainAvailable = Math.max(0, mainChartHeight - MIN_MAIN_CHART_HEIGHT)
                const takeFromMain = Math.min(remainingDelta, mainAvailable)

                if (takeFromMain > 0) {
                    this.$set(this.customGridHeights, 0, mainChartHeight - takeFromMain)
                    remainingDelta -= takeFromMain
                }

                // If still need more space, take from off-charts above (starting from closest)
                if (remainingDelta > 0) {
                    for (let i = changedGridId - 1; i >= 1; i--) {
                        if (this.minimizedGrids[i]) continue  // Skip minimized grids

                        const gridHeight = this.customGridHeights[i] || grids[i]?.height || 100
                        const available = Math.max(0, gridHeight - MIN_OFFCHART_HEIGHT)
                        const takeAmount = Math.min(remainingDelta, available)

                        if (takeAmount > 0) {
                            this.$set(this.customGridHeights, i, gridHeight - takeAmount)
                            remainingDelta -= takeAmount
                        }

                        if (remainingDelta <= 0) break
                    }
                }

                // Set the actual height we could achieve
                const actualHeight = restoreHeight - remainingDelta
                if (actualHeight > MINIMIZED_HEIGHT) {
                    this.$set(this.customGridHeights, changedGridId, actualHeight)
                }
            } else {
                // MINIMIZING: give space to grid directly above
                // This moves the bar down (grid above expands)
                const gridAboveId = changedGridId - 1
                if (gridAboveId < 0) return

                // Find target grid (skip minimized grids)
                let targetGridId = gridAboveId
                if (this.minimizedGrids[gridAboveId]) {
                    for (let i = gridAboveId; i >= 0; i--) {
                        if (!this.minimizedGrids[i]) {
                            targetGridId = i
                            break
                        }
                    }
                }

                const targetHeight = this.customGridHeights[targetGridId] || grids[targetGridId]?.height || 100
                const savedHeight = this.savedGridHeights[changedGridId] || 150
                const heightDelta = savedHeight - MINIMIZED_HEIGHT
                this.$set(this.customGridHeights, targetGridId, targetHeight + heightDelta)
            }
        },
        minimize_all_offcharts() {
            const grids = this._layout.grids
            const MINIMIZED_HEIGHT = 28

            // Check if any off-chart is NOT minimized
            let hasExpandedOffchart = false
            for (let i = 1; i < grids.length; i++) {
                if (!this.minimizedGrids[i]) {
                    hasExpandedOffchart = true
                    break
                }
            }

            if (hasExpandedOffchart) {
                // Minimize all off-charts: save heights and give space to main chart
                let totalHeightGained = 0

                for (let i = 1; i < grids.length; i++) {
                    if (!this.minimizedGrids[i]) {
                        // Save current height before minimizing
                        const currentHeight = this.customGridHeights[i] || grids[i]?.height
                        if (currentHeight) {
                            this.$set(this.savedGridHeights, i, currentHeight)
                            totalHeightGained += currentHeight - MINIMIZED_HEIGHT
                        }
                        // Mark as minimized
                        this.$set(this.minimizedGrids, i, true)
                    }
                }

                // Give all gained space to main chart
                const mainHeight = this.customGridHeights[0] || grids[0]?.height || 100
                this.$set(this.customGridHeights, 0, mainHeight + totalHeightGained)
            } else {
                // All are minimized - expand all off-charts
                let totalHeightNeeded = 0

                // Calculate total height needed to restore all
                for (let i = 1; i < grids.length; i++) {
                    const restoreHeight = this.savedGridHeights[i] || 150
                    totalHeightNeeded += restoreHeight - MINIMIZED_HEIGHT
                }

                // Take space from main chart
                const mainHeight = this.customGridHeights[0] || grids[0]?.height || 100
                const MIN_MAIN_CHART_HEIGHT = 100
                const available = Math.max(0, mainHeight - MIN_MAIN_CHART_HEIGHT)
                const takeFromMain = Math.min(totalHeightNeeded, available)

                if (takeFromMain > 0) {
                    this.$set(this.customGridHeights, 0, mainHeight - takeFromMain)
                }

                // Expand all off-charts (proportionally if not enough space)
                const ratio = takeFromMain / totalHeightNeeded
                for (let i = 1; i < grids.length; i++) {
                    this.$set(this.minimizedGrids, i, false)
                    const restoreHeight = this.savedGridHeights[i] || 150
                    const actualHeight = MINIMIZED_HEIGHT + (restoreHeight - MINIMIZED_HEIGHT) * (ratio < 1 ? ratio : 1)
                    this.$set(this.customGridHeights, i, actualHeight)
                }
            }

            // Update layout with force resize
            this.update_layout(false, true)
        }
    },
    computed: {
        // Component-specific props subsets:
        main_section() {
            // Access _layout directly to ensure Vue tracks it as a dependency
            const layout = this._layout
            let p = Object.assign({}, this.common_props())
            p.layout = layout  // Ensure we use the tracked reference
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
            // Access _layout directly to ensure Vue tracks it as a dependency
            const layout = this._layout
            let p = Object.assign({}, this.common_props())
            p.layout = layout  // Ensure we use the tracked reference
            p.data = this.overlay_subset(this.offchart, 'offchart')
            p.overlays = this.$props.overlays
            return p
        },
        botbar_props() {
            // Access _layout directly to ensure Vue tracks it as a dependency
            const layout = this._layout
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
        // Datasets: candles, onchart, offchart indicators
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
            return this.$props.data.offchart || []
        },
        filter() {
            return this.$props.ib ?
                Utils.fast_filter_i : Utils.fast_filter
        },
        styles() {
            let w = this.$props.toolbar ? this.$props.config.TOOLBAR : 0
            return {
                'margin-left': `${w}px`,
                'position': 'relative'  // Ensure GridResizer is positioned relative to chart
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
        resizerIndices() {
            // Returns array of grid indices that need resizers (1, 2, 3, ...)
            // Resizer at index i sits between grid i-1 and grid i
            const count = this._layout.grids.length
            let indices = []
            for (let i = 1; i < count; i++) {
                indices.push(i)
            }
            return indices
        }
    },
    data() {
        return {
            // Current data slice
            sub: [],

            // Time range
            range: [],

            // Candlestick interval
            interval: 0,

            // Crosshair states
            cursor: {
                x: null, y: null, t: null, y$: null,
                grid_id: null, locked: false, values: {},
                scroll_lock: false, mode: Utils.xmode()
            },

            // A trick to re-render botbar
            rerender: 0,

            // Layers meta-props (changing behaviour)
            layers_meta: {},

            // Y-transforms (for y-zoom and -shift)
            y_transforms: {},

            // Default OHLCV settings (when using DataStructure v1.0)
            settings_ohlcv: {},

            // Default overlay settings
            settings_ov: {},

            // Meta data
            last_candle: [],
            last_values: {},
            sub_start: undefined,
            activated: false,

            // Grid resize state
            customGridHeights: {},
            minimizedGrids: {},
            savedGridHeights: {},
            isResizing: false,

            // Layout object (needs to be reactive for grid resizing)
            _layout: null

        }
    },
    watch: {
        width() {
            this.update_layout()
            if (this._hook_resize) this.ce('?chart-resize')
        },
        height() {
            this.update_layout()
            if (this._hook_resize) this.ce('?chart-resize')
        },
        ib(nw) {
            if (!nw) {
                // Change range index => time
                let t1 = this.ti_map.i2t(this.range[0])
                let t2 = this.ti_map.i2t(this.range[1])
                Utils.overwrite(this.range, [t1, t2])
                this.interval = this.interval_ms
            } else {
                this.init_range() // TODO: calc index range instead
                Utils.overwrite(this.range, this.range)
                this.interval = 1
            }
            let sub = this.subset()
            Utils.overwrite(this.sub, sub)
            this.update_layout()
        },
        timezone() {
            this.update_layout()
        },
        colors() {
            Utils.overwrite(this.range, this.range)
        },
        forced_tf(n, p) {
            this.update_layout(true)
            this.ce('exec-all-scripts')
        },
        data: {
            handler: function(n, p) {
                if (!this.sub.length) this.init_range()
                const sub = this.subset()
                // Fixes Infinite loop warn, when the subset is empty
                // TODO: Consider removing 'sub' from data entirely
                if (this.sub.length || sub.length) {
                    Utils.overwrite(this.sub, sub)
                }
                let nw = this.data_changed()
                this.update_layout(nw)
                Utils.overwrite(this.range, this.range)
                this.cursor.scroll_lock = !!n.scrollLock
                if (n.scrollLock && this.cursor.locked) {
                    this.cursor.locked = false
                }
                if (this._hook_data) this.ce('?chart-data', nw)
                this.update_last_values()
                // TODO: update legend values for overalys
                this.rerender++
            },
            deep: true
        }
    }
}

</script>
