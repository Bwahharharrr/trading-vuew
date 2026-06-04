
<template>
    <!-- Main component  -->
    <div class="trading-vue" v-bind:id="id"
        @mousedown="mousedown" @mouseleave="mouseleave"
         :style="{
            color: this.chart_props.colors.text,
            font: this.font_comp,
            width: this.width+'px',
            height: this.height+'px'}">
        <toolbar v-if="toolbar"
            ref="toolbar"
            v-on:custom-event="custom_event"
            v-bind="chart_props"
            v-bind:config="chart_config">
        </toolbar>
        <widgets v-if="controllers.length"
            ref="widgets"
            :map="ws" :width="width" :height="height"
            :tv="this" :dc="data">
        </widgets>
        <chart :key="reset"
            ref="chart"
            v-bind="chart_props"
            v-bind:tv_id="id"
            v-bind:config="chart_config"
            v-on:custom-event="custom_event"
            v-on:range-changed="range_changed"
            v-on:legend-button-click="legend_button"
            v-on:open-indicator-settings="open_indicator_settings">
        </chart>
        <transition name="tvjs-drift">
            <the-tip :data="tip" v-if="tip"
                @remove-me="tip = null"/>
        </transition>
    </div>
</template>

<script>

import Const from './stuff/constants.js'
import Chart from './components/Chart.vue'
import Toolbar from './components/Toolbar.vue'
import Widgets from './components/Widgets.vue'
import TheTip from './components/TheTip.vue'
import XControl from './mixins/xcontrol.js'
import { clampGoto, clampRange, dataBounds } from './helpers/nav.js'
import { report } from './helpers/schema/diagnostics.js'

export default {
    name: 'TradingVue',
    components: {
        Chart, Toolbar, Widgets, TheTip
    },
    mixins: [ XControl ],
    props: {
        titleTxt: {
            type: String,
            default: 'TradingVue.js'
        },
        id: {
            type: String,
            default: 'trading-vue-js'
        },
        width: {
            type: Number,
            default: 800
        },
        height: {
            type: Number,
            default: 421
        },
        colorTitle: {
            type: String,
            default: '#42b883'
        },
        colorBack: {
            type: String,
            default: '#121826'
        },
        colorGrid: {
            type: String,
            default: '#2f3240'
        },
        colorText: {
            type: String,
            default: '#dedddd'
        },
        colorTextHL: {
            type: String,
            default: '#fff'
        },
        colorScale: {
            type: String,
            default: '#838383'
        },
        colorCross: {
            type: String,
            default: '#8091a0'
        },
        colorCandleUp: {
            type: String,
            default: '#23a776'
        },
        colorCandleDw: {
            type: String,
            default: '#e54150'
        },
        colorWickUp: {
            type: String,
            default: '#23a77688'
        },
        colorWickDw: {
            type: String,
            default: '#e5415088'
        },
        colorWickSm: {
            type: String,
            default: 'transparent' // deprecated
        },
        colorVolUp: {
            type: String,
            default: '#23a77642'
        },
        colorVolDw: {
            type: String,
            default: '#e5415042'
        },
        colorPanel: {
            type: String,
            default: '#565c68'
        },
        colorTbBack: {
            type: String
        },
        colorTbBorder: {
            type: String,
            default: '#8282827d'
        },
        colors: {
            type: Object
        },
        font: {
            type: String,
            default: Const.ChartConfig.FONT
        },
        toolbar: {
            type: Boolean,
            default: false
        },
        data: {
            type: Object,
            required: true
        },
        // Your overlay classes here
        overlays: {
            type: Array,
            default: function () { return [] }
        },
        // Overwrites ChartConfig values,
        // see constants.js
        chartConfig: {
            type: Object,
            default: function () { return {} }
        },
        legendButtons: {
            type: Array,
            default: function () { return [] }
        },
        indexBased: {
            type: Boolean,
            default: false
        },
        extensions: {
            type: Array,
            default: function () { return [] }
        },
        xSettings: {
            type: Object,
            default: function () { return {} }
        },
        skin: {
            type: String // Skin Name
        },
        timezone: {
            type: Number,
            default: 0
        }
    },
    computed: {
        // Copy a subset of TradingVue props
        chart_props() {
            let offset = this.$props.toolbar ?
                this.chart_config.TOOLBAR : 0
            let chart_props = {
                title_txt: this.$props.titleTxt,
                overlays: this.$props.overlays.concat(this.mod_ovs),
                data: this.decubed,
                width: this.$props.width - offset,
                height: this.$props.height,
                font: this.font_comp,
                buttons: this.$props.legendButtons,
                toolbar: this.$props.toolbar,
                ib: this.$props.indexBased || this.index_based || false,
                colors: Object.assign({}, this.$props.colors ||
                    this.colorpack),
                skin: this.skin_proto,
                timezone: this.$props.timezone
            }

            this.parse_colors(chart_props.colors)
            return chart_props
        },
        chart_config() {
            return Object.assign({},
                Const.ChartConfig,
                this.$props.chartConfig,
            )
        },
        decubed() {
            let data = this.$props.data
            if (data.data !== undefined) {
                // DataCube detected
                data.init_tvjs(this)
                return data.data
            } else {
                return data
            }
        },
        index_based() {
            const base = this.$props.data
            if (base.chart) {
                return base.chart.indexBased
            }
            else if (base.data) {
                return base.data.chart.indexBased
            }
            return false
        },
        mod_ovs() {
            let arr = []
            for (var x of this.$props.extensions) {
                arr.push(...Object.values(x.overlays))
            }
            return arr
        },
        font_comp() {
            return this.skin_proto && this.skin_proto.font ?
                this.skin_proto.font : this.font
        }
    },
    data() {
        return { reset: 0, tip: null }
    },
    beforeUnmount() {
        this.custom_event({ event: 'before-destroy' })
        this.ctrl_destroy()
        if (this.data && this.data.destroy) {
            this.data.destroy()
        }
    },
    methods: {
        // TODO: reset extensions?
        resetChart(resetRange = true) {
            let range = this.getRange()
            this.reset++
            if (!resetRange && range[0] && range[1]) {
                // Wait for chart to fully initialize before restoring range
                // Double nextTick ensures layout and overlays are created
                this.$nextTick(() => {
                    this.$nextTick(() => {
                        this.setRange(...range)
                    })
                })
            }
            this.$nextTick(() => this.custom_event({
                event: 'chart-reset', args: []
            }))
        },

        // Performance: Targeted update methods to avoid full chart reset
        // Use these instead of resetChart() when possible

        // Toggle visibility of a specific overlay without full reset
        toggleOverlayVisibility(gridId, overlayId, display) {
            this.$refs.chart?.toggleOverlayVisibility(gridId, overlayId, display)
        },

        // Update layout without full chart reset
        updateLayout(forceResize = false) {
            this.$refs.chart?.update_layout(false, forceResize)
        },

        // Refresh offchart overlays (for add/remove operations)
        refreshOffchartOverlays() {
            this.$refs.chart?.refreshOffchartOverlays()
        },
        // Navigate to a timestamp. Out-of-range targets are clamped into the
        // data with a warn diagnostic (resolves the old out-of-data TODO).
        // Returns { ok, diagnostics } (additive — existing callers can ignore).
        goto(t) {
            const { value, diagnostics } = clampGoto(t, dataBounds(this.$props.data))
            if (diagnostics.length) report(diagnostics, 'warn', 'goto')
            t = value
            const chart = this.$refs.chart
            if (!chart) return { ok: false, diagnostics }
            if (this.chart_props.ib) t = chart.ti_map.gt2i(t, chart.ohlcv)
            chart.goto(t)
            return { ok: diagnostics.length === 0, diagnostics }
        },
        // Set the visible range. Reversed ranges are swapped and entirely
        // off-data ranges warn (over-scroll past one edge is allowed).
        setRange(t1, t2) {
            const r = clampRange(t1, t2, dataBounds(this.$props.data))
            if (r.diagnostics.length) report(r.diagnostics, 'warn', 'setRange')
            t1 = r.t1; t2 = r.t2
            const chart = this.$refs.chart
            if (!chart) return { ok: false, diagnostics: r.diagnostics }
            if (this.chart_props.ib) {
                const ti_map = chart.ti_map
                const ohlcv = chart.ohlcv
                t1 = ti_map.gt2i(t1, ohlcv)
                t2 = ti_map.gt2i(t2, ohlcv)
            }
            chart.setRange(t1, t2)
            return { ok: r.diagnostics.length === 0, diagnostics: r.diagnostics }
        },
        getRange() {
            if (this.chart_props.ib) {
                const ti_map = this.$refs.chart.ti_map
                // Time range => index range
                return this.$refs.chart.range
                    .map(x => ti_map.i2t(x))
            }
            return this.$refs.chart.range
        },
        getCursor() {

            let cursor = this.$refs.chart.cursor
            if (this.chart_props.ib) {
                const ti_map = this.$refs.chart.ti_map
                let copy = Object.assign({}, cursor)
                copy.i = copy.t
                copy.t = ti_map.i2t(copy.t)
                return copy
            }
            return cursor
        },
        showTheTip(text, color = "orange") {
            this.tip = { text, color }
        },
        legend_button(event) {
            this.custom_event({
                event: 'legend-button-click', args: [event]
            })
        },
        open_indicator_settings(indicatorInfo) {
            this.$emit('open-indicator-settings', indicatorInfo)
        },
        // Note: close-indicator is handled via custom_event() below
        custom_event(d) {
            if ('args' in d) {
                this.$emit(d.event, ...d.args)
            } else {
                this.$emit(d.event)
            }
            let data = this.$props.data
            let ctrl = this.controllers.length !== 0
            if (ctrl) this.pre_dc(d)
            if (data.tv) {
                // If the data object is DataCube
                data.on_custom_event(d.event, d.args)
            }
            if (ctrl) this.post_dc(d)
        },
        range_changed(r) {
            if (this.chart_props.ib) {
                const ti_map = this.$refs.chart.ti_map
                r = r.map(x => ti_map.i2t(x))
            }
            this.$emit('range-changed', r)
            this.custom_event(
                {event: 'range-changed', args: [r]}
            )
            if (this.onrange) this.onrange(r)
        },
        set_loader(dc) {
            this.onrange = r => {
                let pf = this.chart_props.ib ? '_ms' : ''
                let tf = this.$refs.chart['interval' + pf]
                dc.range_changed(r, tf)
            }
        },
        parse_colors(colors) {
            for (var k in this.$props) {
                if (k.indexOf('color') === 0 && k !== 'colors') {
                    let k2 = k.replace('color', '')
                    k2 = k2[0].toLowerCase() + k2.slice(1)
                    if (colors[k2]) continue
                    colors[k2] = this.$props[k]
                }
            }
        },
        mousedown() {
            this.$refs.chart.activated = true
        },
        mouseleave() {
            this.$refs.chart.activated = false
        }
    }
}
</script>
<style>
/* Anit-boostrap tactix */
.trading-vue *, ::after, ::before {
    box-sizing: content-box;
}
.trading-vue img {
    vertical-align: initial;
}
</style>
