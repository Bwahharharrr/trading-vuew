<template>
<div class="trading-vue-legend"
     v-if="common"
     v-bind:style="calc_style"
     @dblclick="on_dblclick">
    <div v-if="grid_id === 0"
         class="trading-vue-ohlcv"
        :style = "{ 'max-width': (common?.layout?.grids?.[0]?.width || 200) + 'px' }">
        <span class="t-vue-title"
             :style="{ color: common?.colors?.title }">
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
            :style="{color: common?.colors?.text}">
            {{(common.meta.last || [])[4]}}
        </span>
    </div>
    <!-- Volume legend row (main grid only): eye = show/hide, cog = settings,
         arrow = detach to its own offchart pane / re-attach onto candles. -->
    <div class="t-vue-vol" v-if="grid_id === 0 && show_volume_row && !volume_detached">
        <span class="t-vue-iname">Volume</span>
        <button
            class="t-vue-settings-btn"
            @click.stop="openVolumeSettings"
            title="Volume settings"
            aria-label="Volume settings">
            <svg viewBox="0 0 24 24" width="14" height="14">
                <path fill="currentColor" d="M19.14 12.94c.04-.31.06-.63.06-.94 0-.31-.02-.63-.06-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.04.31-.06.63-.06.94s.02.63.06.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z"/>
            </svg>
        </button>
        <button
            class="t-vue-detach-btn"
            @click.stop="toggleVolumeDetach"
            :title="volume_detached ? 'Attach volume to candles' : 'Detach volume to its own pane'"
            :aria-label="volume_detached ? 'Attach volume to candles' : 'Detach volume to its own pane'">
            <svg v-if="!volume_detached" viewBox="0 0 24 24" width="14" height="14">
                <path fill="currentColor" d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6z"/>
            </svg>
            <svg v-else viewBox="0 0 24 24" width="14" height="14">
                <path fill="currentColor" d="M7.41 15.41L12 10.83l4.59 4.58L18 14l-6-6-6 6z"/>
            </svg>
        </button>
        <!-- Eye (candle-pane show/hide) only while ATTACHED: when detached the
             subplot owns its own visibility, so showing this eye too would let
             the user draw volume in BOTH panes at once. -->
        <button-group
            v-if="!volume_detached"
            v-bind:buttons="[{ name: 'display' }]"
            v-bind:config="common.config"
            v-bind:ov_id="'Volume'"
            v-bind:grid_id="0"
            v-bind:index="-1"
            v-bind:tv_id="common.tv_id"
            v-bind:display="chart_show_volume"
            v-on:legend-button-click="volume_button_click">
        </button-group>
    </div>
    <div class="t-vue-ind" v-for="ind in this.indicators" :key="ind.id">
        <span class="t-vue-iname">{{ind.name}}</span>
        <!-- Re-attach arrow: only on the detached-volume row (its own pane).
             Moves volume back onto the candle pane. Mirrors the down-arrow that
             lives on the candle-pane volume row while attached. -->
        <button
            v-if="grid_id > 0 && isDetachedVolume(ind)"
            class="t-vue-detach-btn"
            @click.stop="reattachVolume"
            title="Attach volume to candles"
            aria-label="Attach volume to candles">
            <svg viewBox="0 0 24 24" width="14" height="14">
                <path fill="currentColor" d="M7.41 15.41L12 10.83l4.59 4.58L18 14l-6-6-6 6z"/>
            </svg>
        </button>
        <button
            v-if="grid_id > 0"
            class="t-vue-settings-btn"
            @click.stop="openSettings(ind)"
            title="Settings">
            <svg viewBox="0 0 24 24" width="14" height="14">
                <path fill="currentColor" d="M19.14 12.94c.04-.31.06-.63.06-.94 0-.31-.02-.63-.06-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.04.31-.06.63-.06.94s.02.63.06.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z"/>
            </svg>
        </button>
        <!-- No close button on the managed detached-volume row: closing it would
             hide the pane without re-showing candle-pane volume (volumeIsDetached
             reads the unfiltered offchart), stranding volume off both panes.
             Re-attach (up-arrow) is the only exit. -->
        <button
            v-if="grid_id > 0 && !isDetachedVolume(ind)"
            class="t-vue-close-btn"
            @click.stop="closeIndicator(ind)"
            title="Remove indicator">
            <svg viewBox="0 0 24 24" width="14" height="14">
                <path fill="currentColor" d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
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
            <template v-if="show_values">
                <span class="t-vue-lspan t-vue-ivalue"
                    v-for="(v, idx) in ind.values" :key="idx" :style="{ color: v.color }">
                    {{v.value}}
                </span>
            </template>
        </span>
        <span v-if="ind.unk" class="t-vue-unknown">
            (Unknown type)
        </span>
        <transition name="tvjs-appear">
            <spinner :colors="common?.colors" v-if="ind.loading">
            </spinner>
        </transition>
    </div>
</div>
</template>
<script>

import ButtonGroup from './ButtonGroup.vue'
import Spinner from './Spinner.vue'
import { VOLUME_LEGEND_FLAG } from '../stuff/volume.js'

export default {
    name: 'ChartLegend',
    props: [
        'common', 'values', 'grid_id', 'meta_props', 'layout_override'
    ],
    components: { ButtonGroup, Spinner },
    created() {
        // Non-reactive render caches for the OHLCV legend toFixed() results.
        // Initialise here so they exist before the first render reads them —
        // Vue 3 warns when a `_`-prefixed property is accessed during render
        // before it is defined on the instance.
        this._ohlcvCacheKey = null
        this._ohlcvCache = null
    },
    computed: {
        ohlcv() {
            if (!this.$props.values || !this.$props.values.ohlcv || !this.layout) {
                return Array(6).fill('n/a')
            }
            const prec = this.layout.prec ?? 2

            // TODO: main the main legend more customizable
            let id = this.main_type + '_0'
            let meta = this.$props.meta_props[id] || {}
            if (meta.legend) {
                return (meta.legend() || []).map(x => x.value)
            }

            // PERFORMANCE: Cache toFixed() results - only recalculate when values change
            const ohlcv = this.$props.values.ohlcv
            const cacheKey = `${ohlcv[1]},${ohlcv[2]},${ohlcv[3]},${ohlcv[4]},${ohlcv[5]},${prec}`
            if (this._ohlcvCacheKey === cacheKey && this._ohlcvCache) {
                return this._ohlcvCache
            }
            this._ohlcvCacheKey = cacheKey
            this._ohlcvCache = [
                ohlcv[1].toFixed(prec),
                ohlcv[2].toFixed(prec),
                ohlcv[3].toFixed(prec),
                ohlcv[4].toFixed(prec),
                ohlcv[5] ? ohlcv[5].toFixed(2) : 'n/a'
            ]
            return this._ohlcvCache
        },
        // PERFORMANCE: Memoize index map — only rebuild when source data reference changes
        _indexMap() {
            const sourceData = this.off_data || this.json_data
            return new Map(sourceData.map((item, idx) => [item, idx]))
        },
        // TODO: add support for { grid: { id : N }}
        indicators() {
            const values = this.$props.values
            const f = this.format
            let types = {}

            const indexMap = this._indexMap

            return this.json_data.filter(
                x => x.settings.legend !== false && !x.main
            ).map(x => {
                if (!(x.type in types)) types[x.type] = 0
                const id = x.type + `_${types[x.type]++}`
                return {
                    v: 'display' in x.settings ? x.settings.display : true,
                    name: x.name || id,
                    index: indexMap.get(x) ?? -1,
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
            if (!this.layout) return { top: '10px', width: '100px' }
            let top = this.layout.height > 150 ? 10 : 5
            let grids = this.$props.common?.layout?.grids
            let w = grids?.[0]?.width ?? 100
            return {
                top: `${(this.layout.offset || 0) + top}px`,
                width: `${w-20}px`
            }
        },
        layout() {
            const id = this.$props.grid_id
            // Use layout override if available (for resize operations)
            if (this.$props.layout_override?.grids?.[id]) {
                return this.$props.layout_override.grids[id]
            }
            return this.$props.common?.layout?.grids?.[id]
        },
        json_data() {
            return this.$props.common?.data || []
        },
        off_data() {
            return this.$props.common?.offchart
        },
        main_type() {
            let f = this.$props.common?.data?.find(x => x.main)
            return f ? f.type : undefined
        },
        show_values() {
            return this.$props.common?.cursor?.mode !== 'explore'
        },
        // The main candle overlay (carries showVolume in its settings).
        main_overlay() {
            return this.json_data.find(x => x.main)
        },
        // Only show the Volume legend row when there is a real candle chart on
        // the main grid (i.e. the data exposes a Candles main overlay). This
        // keeps the row out of empty/indicator-only charts.
        show_volume_row() {
            return !!this.main_overlay
        },
        // Visibility of the volume bars on the candle pane (the eye toggle).
        // Default true — matches Candles.vue show_volume default.
        chart_show_volume() {
            let s = this.main_overlay?.settings
            return !s || !('showVolume' in s) ? true : s.showVolume
        },
        // Detached === a Volume overlay exists on the offchart side. The
        // presence/absence of that overlay IS the state (no extra flag).
        volume_detached() {
            let off = this.$props.common?.volume_detached
            return off === undefined ? false : off
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

            // PERFORMANCE: Cache formatted values - avoid repeated toFixed() and array creation
            const data = values[id]
            const cacheKey = `${id}:${data.join(',')}`
            if (!this._formatCache) this._formatCache = new Map()
            if (this._formatCache.has(cacheKey)) {
                return this._formatCache.get(cacheKey)
            }
            // Limit cache size to prevent memory growth
            if (this._formatCache.size > 50) {
                const firstKey = this._formatCache.keys().next().value
                this._formatCache.delete(firstKey)
            }

            const cs = meta.data_colors ? meta.data_colors() : []
            const result = new Array(data.length - 1)
            for (let i = 1; i < data.length; i++) {
                let x = data[i]
                if (typeof x === 'number') {
                    // Show 8 digits for small values
                    x = x.toFixed(Math.abs(x) > 0.001 ? 4 : 8)
                }
                result[i - 1] = {
                    value: x,
                    color: cs.length ? cs[(i - 1) % cs.length] : undefined
                }
            }
            this._formatCache.set(cacheKey, result)
            return result
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
        },
        closeIndicator(indicator) {
            this.$emit('close-indicator', {
                name: indicator.name,
                index: indicator.index,
                gridId: this.$props.grid_id,
                // The overlay's settings OBJECT (same reference as in dc.data) so
                // the handler can resolve the exact overlay by IDENTITY — names
                // alone collide (e.g. SCMR and SCMR(INV) publish identical layer
                // labels, and a find-by-name would close the wrong instance's pane).
                settings: indicator.settings
            })
        },
        // Volume row — settings (cog). Mirrors openSettings() but always points
        // at the main grid (the volume row lives on the candle pane).
        openVolumeSettings() {
            this.$emit('open-indicator-settings', {
                name: 'Volume',
                type: 'Volume',
                index: -1,
                settings: this.main_overlay?.settings || {},
                gridId: 0
            })
        },
        // Volume row — eye (show / hide on the candle pane). Reuses the standard
        // legend-button-click channel; Chart.legend_button_click() recognises
        // the 'Volume' ov_id and toggles showVolume.
        volume_button_click(event) {
            this.button_click(event)
        },
        // Volume row — arrow (detach to its own pane / re-attach).
        toggleVolumeDetach() {
            this.$emit('legend-button-click', {
                button: 'volume-detach',
                overlay: 'Volume',
                grid: 0,
                detach: !this.volume_detached
            })
        },
        // Is this offchart indicator the auto-managed detached volume?
        isDetachedVolume(ind) {
            return ind.type === 'Volume' &&
                ind.settings && ind.settings[VOLUME_LEGEND_FLAG]
        },
        // Offchart volume pane — up-arrow (re-attach onto the candle pane).
        // Reuses the volume-detach channel; Chart.toggleVolumeDetach() routes to
        // reattach because volume is currently detached (the chart owns the flip).
        reattachVolume() {
            this.$emit('legend-button-click', {
                button: 'volume-detach',
                overlay: 'Volume',
                grid: this.$props.grid_id
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
.t-vue-close-btn {
    background: none;
    border: none;
    color: #808a9d;
    cursor: pointer;
    padding: 2px 4px;
    margin-left: 2px;
    border-radius: 3px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    transition: all 0.15s ease;
    position: relative;
    z-index: 10;
}
.t-vue-close-btn:hover {
    color: #e54077;
    background: rgba(229, 64, 119, 0.1);
}
.t-vue-close-btn svg {
    display: block;
}
.t-vue-vol {
    margin-left: 0.2em;
    margin-bottom: 0.5em;
    font-size: 1.0em;
    margin-top: 0.3em;
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    pointer-events: auto;
}
.t-vue-detach-btn {
    background: none;
    border: none;
    color: #808a9d;
    cursor: pointer;
    padding: 2px 4px;
    margin-left: 2px;
    border-radius: 3px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    transition: all 0.15s ease;
    position: relative;
    z-index: 10;
}
.t-vue-detach-btn:hover {
    color: #35a776;
    background: rgba(53, 167, 118, 0.1);
}
.t-vue-detach-btn svg {
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
