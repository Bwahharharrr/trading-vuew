// Chart range, layout, and data subset management

import { markRaw } from 'vue'
import Utils from '../../stuff/utils.js'
import Layout from '../../components/js/layout.js'
import TI from '../../components/js/ti_mapping.js'
import Const from '../../stuff/constants.js'

export default {
    methods: {
        range_changed(r) {
            r = this.clamp_range(r)
            let sub = this.subset(r)
            Utils.overwrite(this.range, r)
            Utils.overwrite(this.sub, sub)
            this.update_layout()
            this.$emit('range-changed', r)
            if (this.$props.ib) this.save_data_t()
        },

        // Keep the visible range overlapping the data so a redraw never empties
        // the chart. Over-scroll past one edge stays allowed (normal panning,
        // setRange, goto) — we only step in when a range has been pushed ENTIRELY
        // off the data (e.g. an X-axis drag-to-scale anchored far outside the new
        // timeframe's bounds): in that case shift it back, preserving its span,
        // so at least one candle remains visible. No-op when ohlcv is empty so
        // the bootstrap/default_range path is untouched. Returns a (possibly new)
        // [t1, t2]; never mutates the input.
        clamp_range(r) {
            const ohlcv = this.ohlcv
            if (!ohlcv || ohlcv.length < 1) return r
            let t1 = r[0], t2 = r[1]
            if (!Number.isFinite(t1) || !Number.isFinite(t2) || t1 > t2) return r
            const first = this.$props.ib ? 0 : ohlcv[0][0]
            const last = this.$props.ib ? ohlcv.length - 1 : ohlcv[ohlcv.length - 1][0]
            const span = t2 - t1
            if (t2 < first) {
                // Entirely left of the data → pin the data's first bar inside.
                t1 = first - span + this.interval
                t2 = t1 + span
            } else if (t1 > last) {
                // Entirely right of the data → pin the data's last bar inside.
                t2 = last + span - this.interval
                t1 = t2 - span
            }
            return [t1, t2]
        },

        goto(t) {
            const dt = this.range[1] - this.range[0]
            this.range_changed([t - dt, t])
        },

        setRange(t1, t2) {
            this.range_changed([t1, t2])
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
            let existing = this.y_transforms[s.grid_id] || {}
            // Create a NEW object so Vue 3 detects the reference change
            let obj = Object.assign({}, existing, s)
            if (obj.range) obj.range = [...obj.range]
            this.y_transforms[s.grid_id] = obj
            this.update_layout()
        },

        default_range() {
            const dl = this.$props.config.DEFAULT_LEN
            const ml = this.$props.config.MINIMUM_LEN + 0.5
            const l = this.ohlcv.length - 1

            if (this.ohlcv.length < 2) return
            let s, d
            if (this.ohlcv.length <= dl) {
                s = 0; d = ml
            } else {
                s = l - dl; d = 0.5
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
            let [res, index] = this.filter(
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

        init_range() {
            this.calc_interval()
            this.default_range()
        },

        update_layout(clac_tf, forceResize = false) {
            if (clac_tf) this.calc_interval()

            // CRITICAL: Ensure range is valid before creating layout
            // If range is not set, try to initialize it
            if (this.range[0] === undefined || this.range[1] === undefined) {
                if (this.ohlcv && this.ohlcv.length >= 2) {
                    this.init_range()
                    // Also need to recompute subset with new range
                    const sub = this.subset()
                    Utils.overwrite(this.sub, sub)
                } else {
                    return  // Can't create layout without valid range and data
                }
            }

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
            // Layout objects are complex and updated frequently - reactivity adds overhead
            this.chartLayout = markRaw(new Layout(layoutParams))
            this.rerender++

            const layout = this.chartLayout
            if (forceResize) {
                if (this.$refs.sec) {
                    this.$refs.sec.forEach((section, i) => {
                        const grid = section && section.$refs.grid
                        const sidebar = section && section.$refs['sb-' + i]
                        if (grid && grid.resize_from_layout) {
                            grid.resize_from_layout(layout)
                        }
                        if (sidebar && sidebar.resize_from_layout) {
                            sidebar.resize_from_layout(layout)
                        }
                        if (section && section.updateLegendPosition) {
                            section.updateLegendPosition(layout)
                        }
                    })
                }
            } else {
                if (this.$refs.sec) {
                    this.$refs.sec.forEach((section, i) => {
                        const grid = section && section.$refs.grid
                        const sidebar = section && section.$refs['sb-' + i]
                        if (grid) {
                            if (grid.layoutOverride) grid.layoutOverride = null
                            if (grid.renderer) grid.renderer.layout = layout.grids[i]
                        }
                        if (sidebar) {
                            if (sidebar.layoutOverride) sidebar.layoutOverride = null
                            if (sidebar.renderer) sidebar.renderer.layout = layout.grids[i]
                        }
                        if (section && section.clearLayoutOverride) {
                            section.clearLayoutOverride()
                        }
                    })
                }
            }
            if (this._hook_update) this.ce('?chart-update', this.chartLayout)
        },

        common_props() {
            return {
                title_txt: this.chart.name || this.$props.title_txt,
                layout: this.chartLayout,
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
                skin: this.$props.skin,
                // Reactive render-invalidation signal from the DataCube store,
                // forwarded so Grid.dataKey can detect in-place mutations
                // (e.g. live candle colour writes) that the OHLC key misses.
                dataVersion: this.$props.data?.$cd?.revision?.() ?? 0
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
                let arr = res[0] || []
                let i0 = res[1]
                // Index-based bracketing: include the data point immediately
                // OUTSIDE each visible edge. Time-window filtering alone returns an
                // empty/partial subset when the view sits in a SPARSE gap between
                // two far-apart points (e.g. a position-size line whose only points
                // are the entry and "now") — the overlay and its Y-axis then vanish
                // as you scroll between them. Bracketing keeps a line/step/spline
                // continuous across the window. `i0` (res[1]) is the original index
                // of the first in-range point; keep it consistent with the prepend.
                const full = d.data
                if (Array.isArray(full) && full.length && i0 != null) {
                    const end = i0 + arr.length          // one past the last in-range point
                    const lead = i0 > 0 ? 1 : 0
                    const tail = end < full.length ? 1 : 0
                    if (lead || tail) {
                        arr = full.slice(i0 - lead, end + tail)
                        i0 = i0 - lead
                    }
                }
                return {
                    type: d.type,
                    name: Utils.format_name(d),
                    data: this.ti_map.parse(arr, d.indexSrc || 'map'),
                    settings: d.settings || this.settings_ov,
                    grid: d.grid || {},
                    tf: Utils.parse_tf(d.tf),
                    i0: i0,
                    loading: d.loading,
                    last: (this.last_values[side] || [])[i]
                }
            })
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
        }
    },

    data() {
        return {
            sub: [],
            range: [],
            interval: 0,
            interval_ms: 0,
            y_transforms: {},
            sub_start: undefined,
            last_candle: [],
            last_values: {},
            rerender: 0,
            chartLayout: null
        }
    },

    computed: {
        // Computed property to consolidate width/height watching
        dimensions() {
            return `${this.width}x${this.height}`
        },
        // Optimized hash key for data changes - avoids deep watching
        // Captures meaningful changes without traversing entire data tree
        dataHashKey() {
            const data = this.$props.data
            if (!data) return ''
            const ohlcv = data.ohlcv || data.chart?.data || []
            const ohlcvLen = ohlcv.length
            const firstTs = ohlcv[0]?.[0] ?? ''
            const lastTs = ohlcv[ohlcvLen - 1]?.[0] ?? ''
            const lastClose = ohlcv[ohlcvLen - 1]?.[4] ?? ''
            const scrollLock = data.scrollLock ? '1' : '0'
            // Store revision — bumped by DataCube.touchData()/cd.invalidate() on
            // any render-relevant in-place mutation (tick close, colour slot
            // writes, etc) that the OHLC fields above don't capture.
            const revision = data.$cd?.revision?.() ?? 0
            return `${ohlcvLen},${firstTs},${lastTs},${lastClose},${scrollLock},${revision}`
        }
    },

    watch: {
        // Consolidated width/height watcher using computed
        dimensions() {
            this.update_layout()
            if (this._hook_resize) this.ce('?chart-resize')
        },
        ib(nw) {
            if (!nw) {
                let t1 = this.ti_map.i2t(this.range[0])
                let t2 = this.ti_map.i2t(this.range[1])
                Utils.overwrite(this.range, [t1, t2])
                this.interval = this.interval_ms
            } else {
                this.init_range()
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
            this.calc_interval()
            this.update_layout(true)
            this.ce('exec-all-scripts')
        },
        // Optimized data watcher using hash key instead of deep watching
        dataHashKey(newKey, oldKey) {
            if (!newKey || newKey === oldKey) return
            const n = this.$props.data
            if (!this.sub.length) this.init_range()
            const sub = this.subset()
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
            this.rerender++
        }
    }
}
