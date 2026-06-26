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
            const tvOut = this.$refs.tradingVue
            const outgoing = this.activeTab
            if (tvOut && outgoing && typeof tvOut.getRange === 'function') {
                try { outgoing.range = tvOut.getRange() } catch (_) { /* not ready */ }
            }
            this.activeChartTabId = id
            this.$nextTick(() => {
                window.dc = tab.chart
                const tv = this.$refs.tradingVue
                if (!tv) return
                // Re-bind the lazy-history loader to the now-active cube.
                if (this.feedMode === 'gateway' && typeof this._corkyBindActiveCube === 'function') {
                    this._corkyBindActiveCube()
                }
                // Restore this tab's view (its feed kept it live — no re-fetch).
                if (Array.isArray(tab.range) && tab.range.length === 2 && typeof tv.setRange === 'function') {
                    tv.setRange(tab.range[0], tab.range[1])
                } else if (typeof tv.resetChart === 'function') {
                    tv.resetChart()
                }
            })
        },

        closeChartTab(id) {
            if (this.chartTabs.length <= 1) return   // always keep one tab
            const idx = this.chartTabs.findIndex(t => t.id === id)
            if (idx < 0) return
            const [tab] = this.chartTabs.splice(idx, 1)
            this._destroyChartTabCube(tab)
            if (id === this.activeChartTabId) {
                const neighbor = this.chartTabs[idx] || this.chartTabs[idx - 1] || this.chartTabs[0]
                if (neighbor) this.activateChartTab(neighbor.id)
            }
        },

        _destroyChartTabCube(tab) {
            if (!tab || !tab.chart) return
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
