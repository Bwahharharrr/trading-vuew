// Chart range, layout, and data subset management

import { markRaw } from 'vue'
import Utils from '../../stuff/utils.js'
import Layout from '../../components/js/layout.js'
import TI from '../../components/js/ti_mapping.js'
import Const from '../../stuff/constants.js'
import { LEVEL, RENDER_SCHEDULER, REPOSITION_FAST } from '../../render/render-scheduler.js'

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
            // Paint via the single rAF spine. The synchronous rebuild above stays
            // (so the reactive Sidebar/Botbar `rangeKey` watchers repaint against a
            // FRESH layout, exactly as before); only the GRID static paint is
            // coalesced into the drain. Skip when called from inside the drain
            // itself (deferred gesture) — the drain paints once it returns, and a
            // re-invalidate there would just schedule a redundant trailing frame.
            if (RENDER_SCHEDULER && this._scheduler && !this._inDrain) {
                this._scheduler.invalidate(LEVEL.REPOSITION)
            }
        },

        // Drain callback for the single rAF spine (RenderScheduler, plan §3 Phase
        // 2). Runs ONCE per frame with the merged level. Two stages:
        //   1) run any deferred GESTURE work (wheel/pan/pinch were stored instead
        //      of executed at the event). Running it here mutates `range` and
        //      calls the UNCHANGED synchronous range_changed → subset+update_layout,
        //      so the reactive cascade (sidebars/botbar) repaints against a fresh
        //      layout right after this drain — no staleness.
        //   2) paint the grid static layer once (canvas.js redraw stays the paint
        //      primitive). Cursor level paints the dynamic layer only (single-canvas
        //      fallback; the dual-canvas crosshair is drawn synchronously in
        //      grid.js and never reaches this path).
        // Phase 3 — the Reposition fast path is realised INSIDE the rebuild: a pan's
        // deferred gesture → range_changed → update_layout → candles_n_vol now
        // REUSES the kept bars' cached candle geometry (price transform stable,
        // ≤5% churn; see layout.js) instead of recomputing every candle, while the
        // O(visible) grid skeleton (xs/ys/A/B/sidebar) is rebuilt byte-identically.
        // The AUTHORITATIVE reuse gate is candles_n_vol's exact-equality A/B/px_step/
        // interval/height check (co-located with the geometry build, so a wrong
        // verdict can never emit a wrong pixel). REPOSITION_FAST is the rollback
        // that forces a full candle rebuild (Phase-2 behaviour). NOTE: repositionPass()
        // / priceScale.recompute() below are TESTED-but-not-yet-wired scaffolding for
        // the deferred drain-side decision seam (the next increment that skips the
        // grid-skeleton rebuild too) — the drain does NOT consult them today.
        _render_drain(level) {
            const secs = this.$refs.sec
            if (!secs) return
            this._inDrain = true
            try {
                // Stage 1 — deferred gesture work (latest-wins, one run/frame).
                // Per-grid isolation: one grid's gesture throwing must not abort
                // the other grids' work or drop the whole frame's paint.
                for (let i = 0; i < secs.length; i++) {
                    const gv = secs[i] && secs[i].$refs.grid
                    const g = gv && gv.renderer            // grid.js Grid instance
                    if (g && g._pendingGesture) {
                        const work = g._pendingGesture
                        g._pendingGesture = null
                        try { work() } catch (e) { console.error('[render-drain] gesture work failed:', e) }
                    }
                }
                // Stage 2 — paint. Hand each grid its FRESH layout slice (the
                // just-rebuilt chartLayout.grids[i]); the reactive `layout` prop
                // hasn't flushed yet inside this same frame, so reading it would
                // paint a stale scale.
                const grids = this.chartLayout && this.chartLayout.grids
                const cursorOnly = level <= LEVEL.CURSOR
                for (let i = 0; i < secs.length; i++) {
                    const gv = secs[i] && secs[i].$refs.grid
                    if (!gv) continue
                    const fresh = grids && grids[i]
                    try {
                        if (cursorOnly) {
                            // Cursor level: repaint only the crosshair. Dual-canvas
                            // has its own dynamic layer (updateDynamic, on EVERY
                            // pane incl. non-active siblings); single-canvas bakes
                            // the crosshair into the static draw, so a full redraw
                            // is required to avoid erasing candles.
                            const r = gv.renderer && gv.renderer.renderer  // GridRenderer
                            if (r && r.hasDualCanvas) {
                                r.updateDynamic()
                            } else if (gv.redraw) {
                                gv.redraw(fresh)
                            }
                        } else if (gv.redraw) {
                            gv.redraw(fresh)
                        }
                    } catch (e) { console.error('[render-drain] grid paint failed:', e) }
                }
                // Record the range just painted so the trailing rangeKey watcher
                // (range was mutated INSIDE this drain, so it fires a frame later)
                // can skip a redundant byte-identical rebuild+paint. Static drains
                // only; an out-of-drain range mutation (e.g. the ib path) won't
                // match this key and so still invalidates normally.
                if (!cursorOnly && this._scheduler) {
                    const r = this.range
                    this._scheduler._paintedRangeKey = (r && r.length >= 2) ? `${r[0]},${r[1]}` : ''
                }
            } finally {
                this._inDrain = false
            }
        },

        // repositionPass — the Reposition fast-path DECISION (plan §1#2 / §3 Phase
        // 3). Given the upcoming visible slice, answers "is this a pure pan that
        // keeps the price transform (A,B) stable?" by running the spine's
        // priceScale.recompute (minmax → hi/lo → A,B, byte-identical to
        // GridMaker's) against the PREVIOUS frame's scale and checking `!changed`.
        // It ESCALATES (returns false) for the first build, offcharts present, log/
        // manual/overlay-driven y (recompute returns null), or an A/B move — those
        // need a Full rebuild. This is the explicit, testable decision seam; the
        // ACTUAL geometry reuse and its authoritative EXACT-equality guards live in
        // candles_n_vol (layout.js), so a wrong verdict here can never produce a
        // wrong pixel — only a missed/taken optimization. Off ⇒ always Full.
        // NOT wired into _render_drain yet — scaffolding for the deferred grid-
        // skeleton-skip increment; covered by reposition-geometry.test.js.
        repositionPass(visible) {
            if (!REPOSITION_FAST) return false
            if (this.offsub && this.offsub.length) return false
            const lay = this.chartLayout
            const g0 = lay && lay.grids && lay.grids[0]
            const ps = g0 && g0.priceScale
            if (!ps) return false
            if (g0.grid && g0.grid.logScale) return false
            const cand = ps.recompute(visible, this.$props.config.EXPAND)
            if (!cand) return false
            return !cand.changed
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
            // The synchronous update_layout(nw) above already rebuilt the layout;
            // coalesce the GRID static repaint into the single rAF drain. (The
            // Grid.dataKey watcher also invalidates — both merge to one drain.)
            if (RENDER_SCHEDULER && this._scheduler) {
                this._scheduler.invalidate(LEVEL.FULL)
            }
        }
    },

    beforeUnmount() {
        // Tear down the render spine so a pending frame can't fire post-unmount.
        if (this._scheduler) {
            this._scheduler.destroy()
            this._scheduler = null
        }
    }
}
