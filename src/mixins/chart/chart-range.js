// Chart range, layout, and data subset management

import Utils from '../../stuff/utils.js'
import Layout from '../../components/js/layout.js'
import TI from '../../components/js/ti_mapping.js'
import Const from '../../stuff/constants.js'

export default {
    methods: {
        range_changed(r) {
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

        init_range() {
            this.calc_interval()
            this.default_range()
        },

        update_layout(clac_tf, forceResize = false) {
            if (clac_tf) this.calc_interval()
            this._layout = new Layout(this)
            this.rerender++

            const layout = this._layout
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
                        if (grid && grid.layoutOverride) {
                            grid.layoutOverride = null
                            if (grid.renderer) grid.renderer.layout = layout.grids[i]
                        }
                        if (sidebar && sidebar.layoutOverride) {
                            sidebar.layoutOverride = null
                            if (sidebar.renderer) sidebar.renderer.layout = layout.grids[i]
                        }
                        if (section && section.clearLayoutOverride) {
                            section.clearLayoutOverride()
                        }
                    })
                }
            }
            if (this._hook_update) this.ce('?chart-update', this._layout)
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
        data: {
            handler: function(n, p) {
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
            },
            deep: true
        }
    }
}
