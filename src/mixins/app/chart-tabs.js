// Multi-tab charts (Phase 2).
//
// App owns a list of ChartTab records, each an INDEPENDENT chart: its own
// DataCube (+ orderAgent) and, from later phases, its own symbol/timeframe and
// overlay state. Only the ACTIVE tab is rendered — the `chart` computed swaps
// <trading-vue :data> reactively, the exact mechanism a timeframe switch already
// uses (chart-state.js reassigns the cube; :data updates; decubed re-inits). The
// bottom dock + discovery panel stay SHARED across tabs.
//
// The `chart` get/set shim keeps every existing `this.chart` read/write working:
//   get -> the active tab's cube
//   set -> REPLACE the active tab's cube (a tf/file load)
// A tab SWITCH never goes through the setter — it only changes activeChartTabId.
// That cleanly separates replace-semantics (destroy the replaced cube, re-wire)
// from activate-semantics (swap render, NEVER destroy a backgrounded cube). With
// exactly one tab only the replace path runs, so single-chart behaviour is
// byte-identical to the old `chart` watcher this mixin replaces.
import { OrderAgent } from '../../helpers/orders/order-agent.js'
import { StubOrderTransport } from '../../helpers/orders/stub-order-transport.js'

const MAX_CHART_TABS = 8
let _tabSeq = 0

export default {
    data() {
        return {
            chartTabs: [],            // [ChartTab]; seeded in created()
            activeChartTabId: null,
            maxChartTabs: MAX_CHART_TABS,
        }
    },
    computed: {
        activeTab() {
            return this.chartTabs.find(t => t.id === this.activeChartTabId)
                || this.chartTabs[0] || null
        },
        activeChart() {
            return this.activeTab ? this.activeTab.chart : null
        },
        // Back-compat shim for the ~30 existing `this.chart` references + the
        // <trading-vue :data="chart"> binding. See the file header.
        chart: {
            get() { return this.activeChart },
            set(dc) { this.onTabCubeReplaced(this.activeTab, dc) },
        },
        // Vertical space the tab bar steals from the chart canvas
        // (chart-state.js chartHeight subtracts this).
        chartTabBarHeight() { return 34 },
    },
    created() {
        this.seedInitialChartTab()
    },
    methods: {
        _makeChartTab(chart, extra = {}) {
            const n = ++_tabSeq
            return {
                id: `ct-${n}`,
                // 'Chart N' until a symbol loads; corkySelect sets 'SYMBOL · TF'.
                title: `Chart ${n}`,
                chart,
                // Per-tab gateway stream (concurrent-live): each tab owns its feed
                // + subscription, kept alive even when the tab is hidden, so
                // switching never re-subscribes. `range` preserves the view so a
                // switch doesn't jump.
                corkyFeed: null,
                corkyCurrent: null,
                corkyHandle: null,
                corkyLast: null,
                range: null,
                // Per-tab ON-CHART overlay state — a plotted position / backtest /
                // search-result marker / price alarms / drawing-tool arm all belong
                // to the chart they were created on, not the app. Surfaced via the
                // active-tab computed shims in App.vue.
                positionPlot: null,
                searchNav: null,
                priceAlarms: [],
                rectDrawMode: false,
                btPlot: null,
                btProgressSub: null,
                ...extra,
            }
        },

        // Per-cube wiring extracted from the old `chart` watcher: the order agent
        // (so OrderBox ▶ Submit works) + the log-scale preference. Idempotent.
        setupChartCube(dc) {
            if (!dc) return
            if (dc.data && dc.data.chart) {
                dc.data.chart.grid = {
                    ...(dc.data.chart.grid || {}),
                    logScale: this.log_scale,
                }
            }
            if (!dc.orderAgent) {
                dc.orderAgent = new OrderAgent({
                    transport: new StubOrderTransport(),
                    dataCube: dc,
                })
            }
        },

        // Boot: one tab around a fresh cube. Mirrors the old watcher's
        // `immediate` setup. (The Corky feed binds this cube in enterGatewayMode.)
        seedInitialChartTab() {
            const dc = new this.DataCubeClass()
            const tab = this._makeChartTab(dc)
            this.chartTabs = [tab]
            this.activeChartTabId = tab.id
            this.setupChartCube(dc)
        },

        // The active tab's cube was REPLACED (tf/file load via `this.chart = …`).
        // Destroy the old one (it held a root $watch + the full old dataset), wire
        // the new one, and — only for the active tab — re-point the shared feed +
        // overlays. This is exactly the old `chart` watcher, scoped to one tab.
        onTabCubeReplaced(tab, dc) {
            if (!tab) return
            const old = tab.chart
            if (old && old.orderAgent) {
                try { old.orderAgent.destroy() } catch (_) { /* gone */ }
                old.orderAgent = null
            }
            if (old && old !== dc && typeof old.destroy === 'function') {
                try { old.destroy() } catch (_) { /* already gone */ }
            }
            tab.chart = dc
            this.setupChartCube(dc)
            if (tab.id === this.activeChartTabId) {
                // The Corky feed captured the cube at construction; re-point it so
                // a chart replacement can't strand the gateway stream.
                if (dc && this.corkyFeed) this.corkyFeed.dc = dc
                this.$nextTick(() => {
                    window.dc = dc
                    // A replaced cube lost the alarm/position overlays — re-add.
                    if (this.priceAlarms && this.priceAlarms.length) this.ensurePriceAlarmOverlay()
                    if (this.positionPlot) this.syncPositionOverlays()
                })
            }
        },

        createChartTab() {
            if (this.chartTabs.length >= MAX_CHART_TABS) return null
            const dc = new this.DataCubeClass()
            const tab = this._makeChartTab(dc)
            this.chartTabs.push(tab)
            this.setupChartCube(dc)
            this.activateChartTab(tab.id)
            return tab
        },

        // Switch which tab renders. NEVER destroys a cube and — concurrent-live —
        // never re-subscribes: every tab's feed keeps streaming in the background,
        // so a switch is a pure render swap + restore of that tab's saved view (so
        // it doesn't jump). The corky computed shims auto-follow the active tab.
        activateChartTab(id) {
            const tab = this.chartTabs.find(t => t.id === id)
            if (!tab || id === this.activeChartTabId) return
            // Save the OUTGOING tab's view range so switching back doesn't jump.
            // COPY it: getRange() returns a REFERENCE to the live chart.range
            // array, so storing it directly made every tab share (and mutate) the
            // same array — zooming one tab bled into all of them.
            const tvOut = this.$refs.tradingVue
            const outgoing = this.activeTab
            if (tvOut && outgoing && typeof tvOut.getRange === 'function') {
                try {
                    const r = tvOut.getRange()
                    if (Array.isArray(r) && r.length === 2) outgoing.range = [r[0], r[1]]
                } catch (_) { /* not ready */ }
            }
            this.activeChartTabId = id
            if (typeof this.saveStateToStorage === 'function') this.saveStateToStorage()
            this.$nextTick(() => {
                window.dc = tab.chart
                const tv = this.$refs.tradingVue
                if (!tv) return
                // Re-bind the lazy-history loader to the now-active cube.
                if (this.feedMode === 'gateway' && typeof this._corkyBindActiveCube === 'function') {
                    this._corkyBindActiveCube()
                    // Lazy (re)subscribe a RESTORED (or dropped) tab on first view:
                    // it remembers its selection but isn't streaming yet. Once live
                    // it stays live (concurrent), so this only fires once per tab.
                    if (tab.corkyCurrent && !tab.corkyHandle && typeof this.corkySelect === 'function') {
                        const s = tab.corkyCurrent
                        this.corkySelect({ venue: s.venue, symbol: s.symbol, timeframe: s.timeframe })
                        return   // corkySelect resets the chart to the freshly-loaded data
                    }
                }
                // Restore this tab's view (its feed kept it live — no re-fetch).
                if (Array.isArray(tab.range) && tab.range.length === 2 && typeof tv.setRange === 'function') {
                    tv.setRange(tab.range[0], tab.range[1])
                } else if (typeof tv.resetChart === 'function') {
                    tv.resetChart()
                }
            })
        },

        // Serialize the tab set for persistence: each tab's selection (or null for
        // a blank tab) + the active index. Tab ids are session-local, so we persist
        // positions/selections, not ids.
        serializeChartTabs() {
            return {
                tabs: this.chartTabs.map((t) => {
                    const sel = t.corkyCurrent || t.corkyLast
                    return (sel && sel.venue && sel.symbol && sel.timeframe)
                        ? { venue: sel.venue, symbol: sel.symbol, timeframe: sel.timeframe } : null
                }),
                activeIndex: Math.max(0, this.chartTabs.findIndex((t) => t.id === this.activeChartTabId)),
            }
        },

        // Restore tabs from persisted selections (validated against discovery).
        // Creates the tabs WITHOUT subscribing — each lazy-subscribes on first
        // view (activateChartTab). Returns the number of tabs restored.
        restoreChartTabs(saved) {
            if (!saved || !Array.isArray(saved.tabs)) return 0
            const states = this.corkyStates || []
            const resolve = (sel) => {
                if (!sel || !sel.venue || !sel.symbol) return null
                const st = states.find((s) => s && s.venue === sel.venue && s.symbol === sel.symbol)
                if (!st) return null
                const tfs = st.available_timeframes || []
                const tf = tfs.includes(sel.timeframe) ? sel.timeframe : tfs[0]
                return tf ? { venue: sel.venue, symbol: sel.symbol, timeframe: tf, indicators: [], layers: [] } : null
            }
            const wanted = saved.tabs.map(resolve).filter(Boolean)
            if (!wanted.length) return 0
            const ids = []
            wanted.forEach((sel, i) => {
                // Reuse the seeded tab 0; create fresh tabs for the rest (capped).
                let tab
                if (i === 0) { tab = this.chartTabs[0] } else { tab = this._appendChartTab() }
                if (!tab) return
                tab.corkyCurrent = sel
                tab.corkyLast = { venue: sel.venue, symbol: sel.symbol, timeframe: sel.timeframe }
                tab.title = `${sel.symbol} · ${sel.timeframe}`
                ids.push(tab.id)
            })
            // Activate the saved-active tab (clamped) → triggers its lazy-subscribe.
            const idx = Math.min(Math.max(0, saved.activeIndex | 0), ids.length - 1)
            this.activeChartTabId = ids[idx]
            // Kick the active tab's subscribe (activateChartTab early-returns when
            // id === active, so call the bind+subscribe path directly).
            this.$nextTick(() => {
                if (typeof this._corkyBindActiveCube === 'function') this._corkyBindActiveCube()
                const t = this.activeTab
                if (t && t.corkyCurrent && !t.corkyHandle && typeof this.corkySelect === 'function') {
                    const s = t.corkyCurrent
                    this.corkySelect({ venue: s.venue, symbol: s.symbol, timeframe: s.timeframe })
                }
            })
            return ids.length
        },

        // Append a tab WITHOUT activating it (used by restore). Capped at MAX.
        _appendChartTab() {
            if (this.chartTabs.length >= MAX_CHART_TABS) return null
            const dc = new this.DataCubeClass()
            const tab = this._makeChartTab(dc)
            this.chartTabs.push(tab)
            this.setupChartCube(dc)
            return tab
        },

        closeChartTab(id) {
            if (this.chartTabs.length <= 1) return   // always keep one tab
            const idx = this.chartTabs.findIndex(t => t.id === id)
            if (idx < 0) return
            const [tab] = this.chartTabs.splice(idx, 1)
            this._destroyChartTabCube(tab)
            if (id === this.activeChartTabId) {
                const neighbor = this.chartTabs[idx] || this.chartTabs[idx - 1] || this.chartTabs[0]
                if (neighbor) this.activateChartTab(neighbor.id)   // persists the set
            } else if (typeof this.saveStateToStorage === 'function') {
                this.saveStateToStorage()   // closed a background tab → persist the new set
            }
        },

        _destroyChartTabCube(tab) {
            if (!tab) return
            // Release this tab's backtest-progress subscription (per-tab overlay).
            if (tab.btProgressSub && this.backtestsFeed) {
                try { this.backtestsFeed.unsubscribe(tab.btProgressSub) } catch (_) { /* gone */ }
                tab.btProgressSub = null
            }
            if (!tab.chart) return
            if (tab.chart.orderAgent) {
                try { tab.chart.orderAgent.destroy() } catch (_) { /* gone */ }
                tab.chart.orderAgent = null
            }
            try { tab.chart.destroy() } catch (_) { /* gone */ }
        },

        // App.beforeUnmount: release every cube's worker/watchers/orderAgent.
        // DCCore.destroy() is idempotent, so the active cube being destroyed again
        // by TradingVue.beforeUnmount is a safe no-op.
        destroyAllChartTabs() {
            for (const tab of this.chartTabs) this._destroyChartTabCube(tab)
        },
    },
}
