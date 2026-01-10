<template>
<div class="trading-vue-legend"
     v-bind:style="calc_style"
     @dblclick="on_dblclick">
    <div v-if="grid_id === 0"
         class="trading-vue-ohlcv"
        :style = "{ 'max-width': common.width + 'px' }">
        <span class="t-vue-title"
             :style="{ color: common.colors.title }">
              {{common.title_txt}}
        </span>
        <span v-if="show_values">
            O<span class="t-vue-lspan" >{{ohlcv[0]}}</span>
            H<span class="t-vue-lspan" >{{ohlcv[1]}}</span>
            L<span class="t-vue-lspan" >{{ohlcv[2]}}</span>
            C<span class="t-vue-lspan" >{{ohlcv[3]}}</span>
            V<span class="t-vue-lspan" >{{ohlcv[4]}}</span>
        </span>
        <span v-if="!show_values" class="t-vue-lspan"
            :style="{color: common.colors.text}">
            {{(common.meta.last || [])[4]}}
        </span>
    </div>
    <div class="t-vue-ind" v-for="ind in this.indicators" :key="ind.id">
        <span class="t-vue-iname">{{ind.name}}</span>
        <button
            v-if="grid_id > 0"
            class="t-vue-settings-btn"
            @click.stop="openSettings(ind)"
            title="Settings">
            <svg viewBox="0 0 24 24" width="14" height="14">
                <path fill="currentColor" d="M19.14 12.94c.04-.31.06-.63.06-.94 0-.31-.02-.63-.06-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.04.31-.06.63-.06.94s.02.63.06.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z"/>
            </svg>
        </button>
        <button-group
            v-bind:buttons="common.buttons"
            v-bind:config="common.config"
            v-bind:ov_id="ind.id"
            v-bind:grid_id="grid_id"
            v-bind:index="ind.index"
            v-bind:tv_id="common.tv_id"
            v-bind:display="ind.v"
            v-on:legend-button-click="button_click">
        </button-group>
        <span class="t-vue-ivalues" v-if="ind.v">
            <span class="t-vue-lspan t-vue-ivalue"
                v-if="show_values"
                v-for="v in ind.values" :style="{ color: v.color }">
                {{v.value}}
            </span>
        </span>
        <span v-if="ind.unk" class="t-vue-unknown">
            (Unknown type)
        </span>
        <transition name="tvjs-appear">
            <spinner :colors="common.colors" v-if="ind.loading">
            </spinner>
        </transition>
    </div>
</div>
</template>
<script>

import ButtonGroup from './ButtonGroup.vue'
import Spinner from './Spinner.vue'

export default {
    name: 'ChartLegend',
    props: [
        'common', 'values', 'grid_id', 'meta_props', 'layout_override'
    ],
    components: { ButtonGroup, Spinner },
    computed: {
        ohlcv() {
            if (!this.$props.values || !this.$props.values.ohlcv) {
                return Array(6).fill('n/a')
            }
            const prec = this.layout.prec

            // TODO: main the main legend more customizable
            let id = this.main_type + '_0'
            let meta = this.$props.meta_props[id] || {}
            if (meta.legend) {
                return (meta.legend() || []).map(x => x.value)
            }

            return [
                this.$props.values.ohlcv[1].toFixed(prec),
                this.$props.values.ohlcv[2].toFixed(prec),
                this.$props.values.ohlcv[3].toFixed(prec),
                this.$props.values.ohlcv[4].toFixed(prec),
                this.$props.values.ohlcv[5] ?
                    this.$props.values.ohlcv[5].toFixed(2):
                    'n/a'
            ]
        },
        // TODO: add support for { grid: { id : N }}
        indicators() {
            const values = this.$props.values
            const f = this.format
            var types = {}

            return this.json_data.filter(
                x => x.settings.legend !== false && !x.main
            ).map(x => {
                if (!(x.type in types)) types[x.type] = 0
                const id = x.type + `_${types[x.type]++}`
                return {
                    v: 'display' in x.settings ? x.settings.display : true,
                    name: x.name || id,
                    index: (this.off_data || this.json_data).indexOf(x),
                    id: id,
                    type: x.type,
                    settings: x.settings || {},
                    values: values ? f(id, values) : this.n_a(1),
                    unk: !(id in (this.$props.meta_props || {})),
                    loading: x.loading
                }
            })
        },
        calc_style() {
            let top = this.layout.height > 150 ? 10 : 5
            let grids = this.$props.common.layout.grids
            let w = grids[0] ? grids[0].width : undefined
            return {
                top: `${this.layout.offset + top}px`,
                width: `${w-20}px`
            }
        },
        layout() {
            const id = this.$props.grid_id
            // Use layout override if available (for resize operations)
            if (this.$props.layout_override) {
                return this.$props.layout_override.grids[id]
            }
            return this.$props.common.layout.grids[id]
        },
        json_data() {
            return this.$props.common.data
        },
        off_data() {
            return this.$props.common.offchart
        },
        main_type() {
            let f = this.common.data.find(x => x.main)
            return f ? f.type : undefined
        },
        show_values() {
            return this.common.cursor.mode !== 'explore'
        }
    },
    methods: {
        format(id, values) {
            let meta = this.$props.meta_props[id] || {}
            // Matches Overlay.data_colors with the data values
            // (see Spline.vue)
            if (!values[id]) return this.n_a(1)

            // Custom formatter
            if (meta.legend) return meta.legend(values[id])

            return values[id].slice(1).map((x, i) => {
                const cs = meta.data_colors ? meta.data_colors() : []
                if (typeof x == 'number') {
                    // Show 8 digits for small values
                    x = x.toFixed(Math.abs(x) > 0.001 ? 4 : 8)
                }
                return {
                    value: x,
                    color: cs ? cs[i % cs.length] : undefined
                }
            })
        },
        n_a(len) {
            return Array(len).fill({ value: 'n/a' })
        },
        button_click(event) {
            this.$emit('legend-button-click', event)
        },
        // Handle double-click on legend to minimize/expand off-chart grids
        on_dblclick(e) {
            const grid_id = this.$props.grid_id
            // Only trigger for off-chart grids (grid_id > 0)
            if (grid_id > 0) {
                e.preventDefault()
                e.stopPropagation()
                this.$emit('legend-dblclick', grid_id)
            }
        },
        openSettings(indicator) {
            // Emit event to open settings modal at App.vue level
            this.$emit('open-indicator-settings', {
                name: indicator.name,
                type: indicator.type,
                index: indicator.index,
                settings: indicator.settings,
                gridId: this.$props.grid_id
            })
        }
    }
}
</script>
<style>
.trading-vue-legend {
    position: relative;
    z-index: 100;
    font-size: 1.25em;
    margin-left: 10px;
    pointer-events: auto;
    text-align: left;
    user-select: none;
    font-weight: 300;
    cursor: default;
}
@media (min-resolution: 2x) {
    .trading-vue-legend {
        font-weight: 400;
    }
}
.trading-vue-ohlcv {
    pointer-events: auto;
    margin-bottom: 0.5em;
}
.t-vue-lspan {
    font-variant-numeric: tabular-nums;
    font-size: 0.95em;
    color: #999999; /* TODO: move => params */
    margin-left: 0.1em;
    margin-right: 0.2em;
}
.t-vue-title {
    margin-right: 0.25em;
    font-size: 1.45em;
}
.t-vue-ind {
    margin-left: 0.2em;
    margin-bottom: 0.5em;
    font-size: 1.0em;
    margin-top: 0.3em;
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    pointer-events: auto;
}
.t-vue-settings-btn {
    background: none;
    border: none;
    color: #808a9d;
    cursor: pointer;
    padding: 2px 4px;
    margin-left: 4px;
    border-radius: 3px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    transition: all 0.15s ease;
    position: relative;
    z-index: 10;
}
.t-vue-settings-btn:hover {
    color: #35a776;
    background: rgba(53, 167, 118, 0.1);
}
.t-vue-settings-btn svg {
    display: block;
}
.t-vue-ivalue {
    margin-left: 0.5em;
}
.t-vue-unknown {
    color: #999999; /* TODO: move => params */
}

.tvjs-appear-enter-active,
.tvjs-appear-leave-active
{
    transition: all .25s ease;
}

.tvjs-appear-enter, .tvjs-appear-leave-to
{
    opacity: 0;
}
</style>
