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
                // Distinct placeholder title; Phase 4 derives 'SYMBOL · TF' from
                // the tab's own corkyCurrent once streams are per-tab.
                id: `ct-${n}`,
                title: `Chart ${n}`,
                chart,
                corkyCurrent: null,
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

        // Switch which tab renders. NEVER destroys a cube. Active-only-live: the
        // gateway stream is re-established on the now-active tab (its symbol goes
        // live, the previous tab's is torn down) via the App corky hook below.
        activateChartTab(id) {
            const tab = this.chartTabs.find(t => t.id === id)
            if (!tab || id === this.activeChartTabId) return
            this.activeChartTabId = id
            this.$nextTick(() => {
                window.dc = tab.chart
                const tv = this.$refs.tradingVue
                if (tv && typeof tv.resetChart === 'function') tv.resetChart()
            })
            // Re-point the gateway feed/loader at this tab's cube and re-subscribe
            // its remembered symbol (or tear the stream down for a blank tab).
            if (this.feedMode === 'gateway' && typeof this._corkyActivateTab === 'function') {
                this._corkyActivateTab()
            }
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
