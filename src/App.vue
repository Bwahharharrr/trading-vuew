<template>
<div class="app-container">
    <!-- Chart area -->
    <div class="chart-area">
        <div class="chart-wrapper">
            <trading-vue ref="tradingVue" :data="chart" :width="chartWidth" :height="chartHeight"
                    :color-back="colors.colorBack"
                    :color-grid="colors.colorGrid"
                    :color-text="colors.colorText"
                    :overlays="overlays"
                    :chart-config="config"
                    :toolbar="true"
                    @open-indicator-settings="openIndicatorSettings"
                @close-indicator="onCloseIndicator">
            </trading-vue>

            <!-- Left toolbar for drawing tools -->
            <div class="left-toolbar">
                <button
                    class="tool-btn"
                    :class="{ active: rectDrawMode }"
                    @click="toggleRectDrawMode"
                    title="Draw Rectangle">
                    <svg viewBox="0 0 24 24" width="20" height="20">
                        <rect x="3" y="3" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"/>
                    </svg>
                </button>
            </div>

            <!-- Drawing overlay -->
            <div
                v-if="rectDrawMode"
                class="drawing-overlay"
                @mousedown="onDrawStart"
                @mousemove="onDrawMove"
                @mouseup="onDrawEnd"
                @mouseleave="onDrawEnd">
                <svg :width="chartWidth" :height="chartHeight">
                    <rect
                        v-if="isDrawing && rectStart && rectCurrent"
                        :x="Math.min(rectStart.x, rectCurrent.x)"
                        :y="Math.min(rectStart.y, rectCurrent.y)"
                        :width="Math.abs(rectCurrent.x - rectStart.x)"
                        :height="Math.abs(rectCurrent.y - rectStart.y)"
                        fill="rgba(53, 167, 118, 0.2)"
                        stroke="#35a776"
                        stroke-width="2"
                        stroke-dasharray="5,5"
                    />
                </svg>
            </div>
        </div>

        <!-- Bottom Panel -->
        <div class="bottom-panel">
            <div class="bottom-panel-section" v-if="Object.keys(charts).length > 1">
                <span class="bottom-label">Timeframe</span>
                <div class="tf-buttons">
                    <button
                        v-for="(tf, i) in timeframes"
                        :key="tf"
                        class="tf-btn"
                        :class="{ active: selectedTimeframe === i }"
                        @click="selectTimeframe(tf, i)">
                        {{ tf }}
                    </button>
                </div>
            </div>

            <div class="bottom-panel-section">
                <label class="toggle-control">
                    <input type="checkbox" v-model="log_scale">
                    <span class="toggle-label">Log Scale</span>
                </label>
            </div>

            <div class="bottom-panel-section">
                <button class="bottom-btn" @click="resetView">Reset View</button>
            </div>
        </div>
    </div>

    <!-- Right Panel -->
    <div class="right-panel" :style="{ width: rightPanelWidth + 'px', height: height + 'px' }">
        <!-- Source toggle: File (default) | Gateway (Corky) -->
        <div class="panel-section">
            <div class="section-title">Source</div>
            <div class="tf-buttons">
                <button
                    class="tf-btn"
                    :class="{ active: feedMode === 'file' }"
                    @click="setFeedMode('file')">
                    File
                </button>
                <button
                    class="tf-btn"
                    :class="{ active: feedMode === 'gateway' }"
                    @click="setFeedMode('gateway')">
                    Gateway
                </button>
            </div>
        </div>

        <!-- FILE source (default, unchanged) -->
        <div class="panel-section" v-if="feedMode === 'file'">
            <div class="section-title">Data</div>
            <div class="control-group">
                <label>Data File</label>
                <select v-model="selectedDataFile" @change="onFileSelected(selectedDataFile)">
                    <option v-for="file in dataFiles" :key="file" :value="file">
                        {{ file }}
                    </option>
                </select>
            </div>
        </div>

        <!-- GATEWAY source (Corky discovery), opt-in -->
        <corky-discovery-panel
            v-if="feedMode === 'gateway'"
            :states="corkyStates"
            :current="corkyCurrent"
            :loading="corkyLoading"
            :progress="corkyProgress"
            :error="corkyError"
            @select="onCorkySelect"
            @add-timeframe="onCorkyAddTimeframe"
            @toggle-indicator="onCorkyToggleIndicator"
            @toggle-layer="onCorkyToggleLayer"
            @retry="onCorkyRetry">
        </corky-discovery-panel>

        <div class="panel-section" v-if="candleColoringOptions.length > 0">
            <div class="section-title">Views</div>
            <div class="control-group">
                <select v-model="displayedView" @change="onViewSelected(displayedView)">
                    <option value="">Default</option>
                    <option v-for="option in candleColoringOptions" :key="option.title" :value="option.title">
                        {{ option.title }}
                    </option>
                </select>
            </div>
        </div>

        <div class="panel-section" v-if="offchartIndicators.length > 0">
            <div class="section-title">Values</div>
            <div class="indicator-list">
                <div
                    v-for="(indicator, index) in offchartIndicators"
                    :key="index"
                    class="indicator-item">
                    <button
                        class="visibility-toggle"
                        :class="{ hidden: !indicator.visible }"
                        @click="toggleIndicatorVisibility(index)"
                        :title="indicator.visible ? 'Hide indicator' : 'Show indicator'">
                        <svg v-if="indicator.visible" viewBox="0 0 24 24" width="16" height="16">
                            <path fill="currentColor" d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/>
                        </svg>
                        <svg v-else viewBox="0 0 24 24" width="16" height="16">
                            <path fill="currentColor" d="M12 7c2.76 0 5 2.24 5 5 0 .65-.13 1.26-.36 1.83l2.92 2.92c1.51-1.26 2.7-2.89 3.43-4.75-1.73-4.39-6-7.5-11-7.5-1.4 0-2.74.25-3.98.7l2.16 2.16C10.74 7.13 11.35 7 12 7zM2 4.27l2.28 2.28.46.46C3.08 8.3 1.78 10.02 1 12c1.73 4.39 6 7.5 11 7.5 1.55 0 3.03-.3 4.38-.84l.42.42L19.73 22 21 20.73 3.27 3 2 4.27zM7.53 9.8l1.55 1.55c-.05.21-.08.43-.08.65 0 1.66 1.34 3 3 3 .22 0 .44-.03.65-.08l1.55 1.55c-.67.33-1.41.53-2.2.53-2.76 0-5-2.24-5-5 0-.79.2-1.53.53-2.2zm4.31-.78l3.15 3.15.02-.16c0-1.66-1.34-3-3-3l-.17.01z"/>
                        </svg>
                    </button>
                    <span class="indicator-name" :class="{ dimmed: !indicator.visible }">
                        {{ indicator.name }}
                    </span>
                </div>
            </div>
        </div>

        <!-- View Indicators Accordion Section -->
        <div class="panel-section" v-if="viewIndicatorsAccordion.length > 0">
            <div class="section-title">Indicators</div>
            <div class="accordion-container">
                <div v-for="view in viewIndicatorsAccordion"
                     :key="view.title"
                     class="accordion-item"
                     :class="{ 'current-view': view.isCurrentView }">
                    <div class="accordion-header" @click="toggleAccordion(view.title)">
                        <span class="accordion-arrow" :class="{ expanded: view.isExpanded }">&#9654;</span>
                        <span class="accordion-title">{{ view.title }}</span>
                        <span class="indicator-count">({{ view.indicators.length }})</span>
                    </div>
                    <div v-if="view.isExpanded" class="accordion-content">
                        <div v-for="ind in view.indicators"
                             :key="ind.name"
                             class="indicator-item">
                            <button class="visibility-toggle"
                                    :class="{ hidden: !ind.visible }"
                                    @click.stop="toggleViewIndicatorVisibility(view.title, ind.name)"
                                    :title="ind.visible ? 'Hide indicator' : 'Show indicator'">
                                <svg v-if="ind.visible" viewBox="0 0 24 24" width="16" height="16">
                                    <path fill="currentColor" d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/>
                                </svg>
                                <svg v-else viewBox="0 0 24 24" width="16" height="16">
                                    <path fill="currentColor" d="M12 7c2.76 0 5 2.24 5 5 0 .65-.13 1.26-.36 1.83l2.92 2.92c1.51-1.26 2.7-2.89 3.43-4.75-1.73-4.39-6-7.5-11-7.5-1.4 0-2.74.25-3.98.7l2.16 2.16C10.74 7.13 11.35 7 12 7zM2 4.27l2.28 2.28.46.46C3.08 8.3 1.78 10.02 1 12c1.73 4.39 6 7.5 11 7.5 1.55 0 3.03-.3 4.38-.84l.42.42L19.73 22 21 20.73 3.27 3 2 4.27zM7.53 9.8l1.55 1.55c-.05.21-.08.43-.08.65 0 1.66 1.34 3 3 3 .22 0 .44-.03.65-.08l1.55 1.55c-.67.33-1.41.53-2.2.53-2.76 0-5-2.24-5-5 0-.79.2-1.53.53-2.2zm4.31-.78l3.15 3.15.02-.16c0-1.66-1.34-3-3-3l-.17.01z"/>
                                </svg>
                            </button>
                            <span class="indicator-name" :class="{ dimmed: !ind.visible }">
                                {{ ind.name }}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>

    </div>

    <!-- Indicator Settings Modal (rendered at app level to escape stacking contexts) -->
    <indicator-settings
        v-if="indicatorSettingsOpen"
        :indicator-name="indicatorSettingsData.name"
        :current-type="indicatorSettingsData.type"
        :current-settings="indicatorSettingsData.settings"
        :indicator-index="indicatorSettingsData.index"
        :grid-id="indicatorSettingsData.gridId"
        @close="closeIndicatorSettings"
        @apply="applyIndicatorSettings">
    </indicator-settings>

    <!-- Order Type chooser (first popup after a box is drawn) -->
    <order-type-modal
        v-if="orderTypeModalOpen"
        :geometry="pendingBoxGeometry"
        @select="onOrderTypeSelect"
        @close="onOrderTypeCancel">
    </order-type-modal>

    <!-- Scaled Order modal (after choosing the 'scaled' type) -->
    <order-distribution-modal
        v-if="orderModalOpen"
        :geometry="pendingBoxGeometry"
        @confirm="onOrderConfirm"
        @close="onOrderCancel">
    </order-distribution-modal>
</div>
</template>

<script>
import { markRaw } from 'vue'
import TradingVue from './TradingVue.vue'
import IndicatorSettings from './components/IndicatorSettings.vue'
import OrderDistributionModal from './components/OrderDistributionModal.vue'
import OrderTypeModal from './components/OrderTypeModal.vue'
import { OrderAgent } from './helpers/orders/order-agent.js'
import { StubOrderTransport } from './helpers/orders/stub-order-transport.js'
import CorkyDiscoveryPanel from './components/feed/CorkyDiscoveryPanel.vue'
import DataCube from '../src/helpers/datacube.js'
import { CorkyClient } from '../src/helpers/feed/corky-client.js'
import { CorkyFeed } from '../src/helpers/feed/corky-feed.js'
import BuysAndSells from './components/overlays/BuysAndSells.js'
import Balance from './components/overlays/Balance.js'
import LineTracker from './components/overlays/LineTracker.js'
import OrderBox from './components/overlays/OrderBox.vue'

// Resolve the Corky chart-feed gateway WS URL (opt-in "Gateway" source).
// Mirrors the file feed's two-mode buildWsUrl logic so it works from a REMOTE
// browser (where `127.0.0.1` is the browser's localhost, not the gateway box):
//   - explicit override via `?corky=ws://…` or localStorage('corkyUrl')
//   - same-origin localhost page → connect directly to 127.0.0.1:7070
//   - remote page → proxy through the dev-server's wildcard /live-ws/<port>
//     handler (vite/dev-server-plugin.ts forwards /live-ws/7070 → ws://127.0.0.1:7070).
const CORKY_GATEWAY_PORT = 7070
function deriveCorkyUrl() {
    try {
        const q = new URLSearchParams(window.location.search).get('corky')
        if (q) return q
        const saved = window.localStorage.getItem('corkyUrl')
        if (saved) return saved
    } catch (_) { /* no URL/storage access — fall through to derivation */ }
    const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    const host = window.location.hostname
    if (host === 'localhost' || host === '127.0.0.1' || host === '') {
        return `${proto}//127.0.0.1:${CORKY_GATEWAY_PORT}`
    }
    return `${proto}//${window.location.host}/live-ws/${CORKY_GATEWAY_PORT}`
}

// App mixins (decomposed concerns)
import { ViewManager, IndicatorManager, FileManager, ChartState, DrawingTools, WsManager } from './mixins/app/index.js'

export default {
    name: 'app',
    mixins: [ViewManager, IndicatorManager, FileManager, ChartState, DrawingTools, WsManager],
    components: {
        TradingVue,
        IndicatorSettings,
        OrderDistributionModal,
        OrderTypeModal,
        CorkyDiscoveryPanel
    },
    data() {
        return {
            chart: new DataCube(),
            // markRaw: overlay component definitions must not be made reactive
            // (Vue warns + needless overhead) when held in component data.
            overlays: [BuysAndSells, Balance, LineTracker, OrderBox].map(c => markRaw(c)),
            // Store DataCube class for mixin use
            DataCubeClass: DataCube,

            // ── Corky gateway source (opt-in; File stays the default) ──
            // 'gateway' = the Corky chart-feed (DEFAULT) driving the DataCube.
            // 'file' = the existing file-based feed; selected by a ?file= URL
            // param (explicit file request) or the Source toggle.
            feedMode: (() => {
                try {
                    return new URLSearchParams(window.location.search).get('file')
                        ? 'file' : 'gateway'
                } catch (_) { return 'gateway' }
            })(),
            corkyClient: null,   // lazily-built CorkyClient (own its socket)
            corkyFeed: null,     // CorkyFeed over (client, this.chart)
            // Reactive discovery surface rendered by CorkyDiscoveryPanel.
            corkyStates: [],
            corkyCurrent: null,
            // Enabled indicators + hidden layers, persisted per venue|symbol so a
            // timeframe switch (which tears down the subscription) keeps them on.
            // `${venue}|${symbol}` → { kinds:[{display_label,kind}], layers:[layerId] }
            corkyEnabled: {},
            corkyLoading: false,
            corkyProgress: null,
            corkyError: null,
            corkyHandle: null,   // active subscription handle (single stream)
        }
    },
    watch: {
        // `this.chart` is REPLACED on every data/timeframe load (chart-state /
        // file-manager). Re-attach the order agent to the active DataCube each
        // time (immediate: also attaches to the initial one) so OrderBox's ▶
        // Submit → dc_events.submit_orders → agent works after any reload.
        // Without this the agent would point at a stale DataCube and Submit
        // would be a silent no-op.
        chart: {
            immediate: true,
            handler(dc, old) {
                if (old && old.orderAgent) {
                    try { old.orderAgent.destroy() } catch (_) { /* gone */ }
                    old.orderAgent = null
                }
                if (dc && !dc.orderAgent) {
                    dc.orderAgent = new OrderAgent({
                        transport: new StubOrderTransport(),
                        dataCube: dc
                    })
                }
            }
        }
    },
    mounted() {
        window.addEventListener('resize', this.onResize)
        // loadDataFileList resolves the picker; the watcher on dataFiles
        // (file-manager.js) consumes pendingFileLoad and drives the rest.
        this.loadDataFileList()

        // Load saved state from sessionStorage (per-tab) + localStorage (global).
        const savedState = this.loadStateFromStorage()

        if (savedState) {
            this.log_scale = savedState.log_scale ?? true
            this.indicatorVisibility = savedState.indicatorVisibility || {}
            this.selectedView = savedState.selectedView || ''
            this.persistentIndicatorVisibility = savedState.persistentIndicatorVisibility || {}
            this.accordionExpandedViews = savedState.accordionExpandedViews || {}
        }

        // Bootstrap order (FILE mode only): ?file=<name> URL param wins (per-tab,
        // no storage interaction); else per-tab sessionStorage; else first
        // /data-files entry resolved by the dataFiles watcher in file-manager.js.
        // In the default GATEWAY mode we do NOT queue a file load (enterGatewayMode
        // below drives the chart instead).
        if (this.feedMode === 'file') {
            const params = new URLSearchParams(window.location.search)
            const fileParam = params.get('file')
            if (fileParam && !/[\/\\]|\.\./.test(fileParam)) {
                this.pendingFileLoad = fileParam
                this.pendingIndicatorSettings = savedState?.indicatorSettings || {}
            } else if (savedState?.selectedDataFile) {
                this.pendingFileLoad = savedState.selectedDataFile
                this.pendingIndicatorSettings = savedState.indicatorSettings || {}
            }
        }

        this.$nextTick(() => {
            window.dc = this.chart
            window.tv = this.$refs.tradingVue
            // No unconditional wsConnect() here — the currentFileMeta watcher
            // in ws-manager.js opens the WS once a file is loaded.
            // Gateway is the default source: connect + discover on mount.
            if (this.feedMode === 'gateway') this.enterGatewayMode()
        })
    },
    beforeUnmount() {
        window.removeEventListener('resize', this.onResize)
        // Tear down the gateway feed if it was ever activated (no dangling
        // sockets/listeners on unmount).
        this.teardownCorky()
        if (this.chart && this.chart.orderAgent) {
            try { this.chart.orderAgent.destroy() } catch (_) { /* gone */ }
            this.chart.orderAgent = null
        }
    },
    methods: {
        // ── Source toggle ─────────────────────────────────────────────────────
        // Switch between the File feed (default) and the Corky Gateway feed.
        // Switching to one cleanly tears down the other.
        setFeedMode(mode) {
            if (mode === this.feedMode) return
            if (mode === 'gateway') {
                this.enterGatewayMode()
            } else {
                // Back to File: drop the gateway socket/listeners entirely, then
                // restore the file feed — reload the selected file so its data
                // repopulates the DataCube the gateway overwrote, and re-arm the
                // file WS (the currentFileMeta watcher reconnects on the reload).
                // If no file was ever selected (Gateway was the startup default),
                // auto-pick the first chart-loadable file.
                this.teardownCorky()
                if (this.selectedDataFile) {
                    this.onFileSelected(this.selectedDataFile)
                } else {
                    const files = this.dataFiles || []
                    const first = files.find(
                        (f) => f.startsWith('data_') &&
                               !f.startsWith('data_alerts_') &&
                               !f.startsWith('data_scorers_') &&
                               !f.startsWith('data_tf'))
                    if (first) this.onFileSelected(first)
                }
            }
            this.feedMode = mode
        },

        // Lazily build CorkyClient + CorkyFeed over the App's DataCube and
        // kick off discovery. Idempotent — a second call just re-discovers.
        enterGatewayMode() {
            // Pause the FILE live feed (ws-manager) first: it drives the SAME
            // this.chart DataCube, so leaving it connected would let both feeds
            // mutate the candles concurrently. wsDisconnect() also cancels any
            // pending file-WS reconnect.
            this.wsDisconnect()
            if (!this.corkyFeed) {
                const url = deriveCorkyUrl()
                console.log('[Corky] gateway URL:', url)
                this.corkyClient = new CorkyClient({ url })
                this.corkyClient.connect()
                this.corkyFeed = new CorkyFeed({
                    client: this.corkyClient,
                    dataCube: this.chart,
                })
            }
            this.corkyDiscover()
        },

        // Discover the catalog → populate the reactive `corkyStates`.
        async corkyDiscover(venue) {
            if (!this.corkyFeed) return
            this.corkyLoading = true
            this.corkyError = null
            try {
                const list = await this.corkyFeed.discover(venue)
                this.corkyStates = Array.isArray(list) ? list : (list ? [list] : [])
            } catch (err) {
                this.corkyError = this._corkyErr(err)
            } finally {
                this.corkyLoading = false
            }
            return this.corkyStates
        },

        // Subscribe to a stream (single active subscription): drop the prior
        // one, then drive the DataCube from the gateway.
        async corkySelect(opts) {
            if (!this.corkyFeed) return
            // Single active stream: tear down the previous subscription first.
            await this._corkyUnsub()
            this.corkyLoading = true
            this.corkyError = null
            this.corkyProgress = null
            // Candles-only by default: indicators are toggled on client-side
            // afterwards (their data already ships in the rows — no resubscribe).
            // Persisted enabled indicators/layers for this symbol (survives a
            // tf-switch). Reflect them optimistically in the panel; the feed
            // re-applies them after the new history loads (_reapplyEnabled).
            const mem = this._corkyMem(opts.venue, opts.symbol)
            this.corkyCurrent = {
                venue: opts.venue,
                symbol: opts.symbol,
                timeframe: opts.timeframe,
                indicators: mem.kinds.map(k => k.display_label),
                layers: mem.layers.slice(),   // enabled view-layer ids
            }
            // Assemble the indicator VIEW map (display_label → { kind, view }) from
            // the discovery descriptors for this venue/symbol so buildChartData can
            // prefer view.layers over plotting every output. (The select opts from
            // the panel don't carry descriptors, so read corkyStates here.)
            const state = (this.corkyStates || []).find(
                s => s && s.venue === opts.venue && s.symbol === opts.symbol)
            const views = {}
            for (const ind of ((state && state.indicators) || [])) {
                if (ind && ind.view && ind.display_label) {
                    views[ind.display_label] = { kind: ind.kind, view: ind.view }
                }
            }
            const enabled = { kinds: mem.kinds.slice(), layers: mem.layers.slice() }
            try {
                this.corkyHandle = await this.corkyFeed.subscribe({ ...opts, views, enabled }, {
                    onStatus: (status) => {
                        this.corkyProgress = status
                        if (status && (status.phase === 'history-complete' ||
                                       status.phase === 'live')) {
                            this.corkyLoading = false
                        }
                        // Refit the visible range to the freshly-loaded history.
                        // The gateway pushes the new timeframe's candles into the
                        // shared DataCube but never resets the chart's range; on a
                        // tf switch (e.g. 1D → 1m) the OLD wide range still
                        // partially overlaps the new data's tail, so the chart's
                        // dataHashKey watcher (which only re-inits when `sub` is
                        // empty) leaves the stale range in place and the candles
                        // squish to a sliver. resetChart(true) re-runs
                        // init_range() over the new ohlcv (the same path the FILE
                        // feed uses via onFileSelected), showing the latest
                        // DEFAULT_LEN window. Deferred to nextTick so the chart's
                        // data watcher has applied the new candles first.
                        if (status && status.phase === 'history-complete') {
                            this.$nextTick(() => {
                                if (this.$refs.tradingVue) {
                                    this.$refs.tradingVue.resetChart(true)
                                }
                            })
                        }
                    },
                    onError: (err) => { this.corkyError = this._corkyErr(err) },
                })
            } catch (err) {
                this.corkyError = this._corkyErr(err)
                this.corkyCurrent = null
            } finally {
                this.corkyLoading = false
            }
        },

        // Panel: select a venue/symbol/timeframe (+ default indicators).
        onCorkySelect(opts) {
            this.corkySelect(opts)
        },

        // Panel: add a timeframe → patch the candle-state, re-discover, then
        // re-select the new timeframe so it streams.
        async onCorkyAddTimeframe(req) {
            // Stream the new tf CANDLES-ONLY (matching the chip-click select
            // path); the user toggles indicators on client-side afterwards.
            await this._corkyPatchAndReselect(
                { venue: req.venue, symbol: req.symbol, timeframes: [req.timeframe] },
                { venue: req.venue, symbol: req.symbol, timeframe: req.timeframe, indicators: [] },
            )
        },

        // Panel: toggle an indicator ON/OFF client-side. The indicator DATA is
        // already loaded on the active subscription handle (the rows carry every
        // maintained series), so we just show/hide its overlays in the DataCube
        // — NO patch, NO re-subscribe. Mirror the new state into
        // corkyCurrent.indicators so the panel's ●/○ reflects it.
        onCorkyToggleIndicator(req) {
            if (!this.corkyFeed || !this.corkyHandle) return
            // Only reflect the toggle in the UI if the kind actually has overlays
            // in the loaded data (setIndicatorEnabled returns false otherwise),
            // so a no-op toggle can't leave a filled dot for an empty indicator.
            const applied = this.corkyFeed.setIndicatorEnabled(
                this.corkyHandle, req.kind, req.enabled)
            if (!applied) return

            const cur = this.corkyCurrent
            if (!cur) return
            const inds = Array.isArray(cur.indicators) ? cur.indicators.slice() : []
            const i = inds.indexOf(req.display_label)
            if (req.enabled) {
                if (i === -1) inds.push(req.display_label)
            } else if (i !== -1) {
                inds.splice(i, 1)
            }
            cur.indicators = inds
            // Mirror the feed handle's enabled view-layers so the panel's
            // per-layer sub-toggles reflect which layers are showing.
            cur.layers = this.corkyHandle ? [...this.corkyHandle.enabledLayers] : []
            // Persist for tf-switch survival (keyed by venue|symbol).
            const mem = this._corkyMem(req.venue, req.symbol)
            const mi = mem.kinds.findIndex(k => k.display_label === req.display_label)
            if (req.enabled) {
                if (mi === -1) mem.kinds.push({ display_label: req.display_label, kind: req.kind })
            } else if (mi !== -1) {
                mem.kinds.splice(mi, 1)
            }
            mem.layers = cur.layers.slice()
        },

        // Toggle a single hidden view layer (TL/TH/diagnostics) on/off.
        onCorkyToggleLayer(req) {
            if (!this.corkyFeed || !this.corkyHandle) return
            const applied = this.corkyFeed.setLayerEnabled(
                this.corkyHandle, req.layerId, req.enabled)
            if (!applied) return
            const cur = this.corkyCurrent
            if (cur) cur.layers = [...this.corkyHandle.enabledLayers]
            // Persist for tf-switch survival.
            this._corkyMem(req.venue, req.symbol).layers =
                [...this.corkyHandle.enabledLayers]
        },

        // Per-(venue,symbol) enabled-state memory (lazily created).
        _corkyMem(venue, symbol) {
            const key = `${venue}|${symbol}`
            let m = this.corkyEnabled[key]
            if (!m) { m = { kinds: [], layers: [] }; this.corkyEnabled[key] = m }
            return m
        },

        // Patch the candle-state on the gateway, re-discover the catalog, then
        // re-select so the newly-added tf/indicator actually streams.
        async _corkyPatchAndReselect(patch, selectOpts) {
            if (!this.corkyClient) return
            this.corkyError = null
            try {
                await this.corkyClient.patchCandleState(patch)
            } catch (err) {
                this.corkyError = this._corkyErr(err)
                return
            }
            await this.corkyDiscover()
            await this.corkySelect(selectOpts)
        },

        // Panel: retry after an error → re-run discovery.
        onCorkyRetry() {
            this.corkyDiscover()
        },

        // Drop the active subscription (if any) without closing the client.
        async _corkyUnsub() {
            const h = this.corkyHandle
            this.corkyHandle = null
            if (h != null && this.corkyFeed) {
                await Promise.resolve(this.corkyFeed.unsubscribe(h)).catch(() => {})
            }
        },

        // Full gateway teardown: unsubscribe + destroy the feed (which closes
        // the client). Leaves the DataCube intact for the File feed to reuse.
        teardownCorky() {
            this._corkyUnsub()
            if (this.corkyFeed) {
                try { this.corkyFeed.destroy() } catch (_) { /* already gone */ }
            }
            this.corkyFeed = null
            this.corkyClient = null
            this.corkyStates = []
            this.corkyCurrent = null
            this.corkyProgress = null
            this.corkyError = null
            this.corkyLoading = false
        },

        // Normalise an error into the { message, retryable } shape the panel
        // renders (errors arrive as CorkyError, plain Error, or wire events).
        _corkyErr(err) {
            if (!err) return { message: 'Unknown error', retryable: false }
            return {
                message: err.message || err.code || String(err),
                retryable: !!err.retryable,
            }
        },
    }
}
</script>

<style>
html,
body {
    background-color: #000;
    margin: 0;
    padding: 0;
    overflow: hidden;
}

/* Main layout */
.app-container {
    display: flex;
    width: 100vw;
    height: 100vh;
}

.chart-area {
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    background-color: #121826;
}

.chart-wrapper {
    flex: 1;
    position: relative;
    overflow: hidden;
}

/* Bottom Panel */
.bottom-panel {
    height: 44px;
    background-color: #121827;
    border-top: 1px solid #2a2e39;
    border-left: 5px dotted #8282827d;
    display: flex;
    align-items: center;
    padding: 0 15px;
    margin-left: 52px;
    gap: 20px;
    box-sizing: border-box;
}

.bottom-panel-section {
    display: flex;
    align-items: center;
    gap: 10px;
}

.bottom-label {
    color: #808a9d;
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    font-family: -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Oxygen, Ubuntu, sans-serif;
}

.bottom-btn {
    background: #131722;
    color: #808a9d;
    border: 1px solid #2a2e39;
    border-radius: 4px;
    padding: 6px 12px;
    font-size: 11px;
    font-family: -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Oxygen, Ubuntu, sans-serif;
    cursor: pointer;
    transition: all 0.15s ease;
}

.bottom-btn:hover {
    background: #1e222d;
    border-color: #35a776;
    color: #35a776;
}

/* Right Panel */
.right-panel {
    background-color: #1e222d;
    border-left: 1px solid #2a2e39;
    overflow-y: auto;
    overflow-x: hidden;
    box-sizing: border-box;
}

.panel-section {
    padding: 12px 15px;
    border-bottom: 1px solid #2a2e39;
}

.section-title {
    color: #808a9d;
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin-bottom: 10px;
    font-family: -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Oxygen, Ubuntu, sans-serif;
}

.control-group {
    margin-bottom: 8px;
}

.control-group:last-child {
    margin-bottom: 0;
}

.control-group label {
    display: block;
    color: #888;
    font-size: 11px;
    margin-bottom: 4px;
    font-family: -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Oxygen, Ubuntu, sans-serif;
}

.control-group select {
    width: 100%;
    background: #131722;
    color: #d1d4dc;
    border: 1px solid #2a2e39;
    border-radius: 4px;
    padding: 6px 8px;
    font-size: 12px;
    font-family: -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Oxygen, Ubuntu, sans-serif;
    cursor: pointer;
    outline: none;
    box-sizing: border-box;
}

.control-group select:hover {
    border-color: #3e4251;
}

.control-group select:focus {
    border-color: #35a776;
}

.control-group select option {
    background: #131722;
    color: #d1d4dc;
}

/* Timeframe buttons */
.tf-buttons {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
}

.tf-btn {
    background: #131722;
    color: #808a9d;
    border: 1px solid #2a2e39;
    border-radius: 4px;
    padding: 6px 10px;
    font-size: 11px;
    font-weight: 500;
    font-family: -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Oxygen, Ubuntu, sans-serif;
    cursor: pointer;
    transition: all 0.15s ease;
}

.tf-btn:hover {
    background: #1e222d;
    border-color: #3e4251;
    color: #d1d4dc;
}

.tf-btn.active {
    background: rgba(53, 167, 118, 0.15);
    border-color: #35a776;
    color: #35a776;
}

/* Toggle control styling */
.toggle-control {
    display: flex;
    align-items: center;
    gap: 8px;
    cursor: pointer;
    padding: 6px 12px;
    background: #131722;
    border: 1px solid #2a2e39;
    border-radius: 4px;
    transition: all 0.15s ease;
}

.toggle-control:hover {
    border-color: #3e4251;
}

.toggle-control input[type="checkbox"] {
    width: 14px;
    height: 14px;
    accent-color: #35a776;
    cursor: pointer;
    margin: 0;
}

.toggle-label {
    color: #808a9d;
    font-size: 11px;
    font-weight: 500;
    font-family: -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Oxygen, Ubuntu, sans-serif;
    user-select: none;
}

.toggle-control:has(input:checked) {
    border-color: #35a776;
    background: rgba(53, 167, 118, 0.1);
}

.toggle-control:has(input:checked) .toggle-label {
    color: #35a776;
}

/* Panel button */
.panel-btn {
    width: 100%;
    background: #131722;
    color: #808a9d;
    border: 1px solid #2a2e39;
    border-radius: 4px;
    padding: 8px 12px;
    font-size: 12px;
    font-family: -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Oxygen, Ubuntu, sans-serif;
    cursor: pointer;
    transition: all 0.15s ease;
    margin-top: 10px;
}

.panel-btn:hover {
    background: #1e222d;
    border-color: #35a776;
    color: #35a776;
}

/* Left toolbar for drawing tools */
.left-toolbar {
    position: absolute;
    left: 10px;
    top: 50%;
    transform: translateY(-50%);
    display: flex;
    flex-direction: column;
    gap: 8px;
    z-index: 1000;
}

.tool-btn {
    width: 36px;
    height: 36px;
    background: rgba(30, 36, 51, 0.8);
    border: 1px solid rgba(62, 62, 62, 0.6);
    border-radius: 4px;
    color: rgba(53, 167, 118, 0.8);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s ease;
}

.tool-btn:hover {
    background: rgba(30, 36, 51, 1);
    color: #35a776;
    border-color: #35a776;
}

.tool-btn.active {
    background: rgba(53, 167, 118, 0.3);
    color: #35a776;
    border-color: #35a776;
}

/* Drawing overlay */
.drawing-overlay {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: 999;
    cursor: crosshair;
}

.drawing-overlay svg {
    display: block;
}

/* Indicator list in right panel */
.indicator-list {
    display: flex;
    flex-direction: column;
    gap: 4px;
}

.indicator-item {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 6px 8px;
    background: #131722;
    border: 1px solid #2a2e39;
    border-radius: 4px;
}

.visibility-toggle {
    background: none;
    border: none;
    color: #35a776;
    cursor: pointer;
    padding: 2px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.15s ease;
    border-radius: 3px;
}

.visibility-toggle:hover {
    background: rgba(53, 167, 118, 0.1);
}

.visibility-toggle.hidden {
    color: #808a9d;
}

.visibility-toggle.hidden:hover {
    color: #d1d4dc;
    background: rgba(128, 138, 157, 0.1);
}

.indicator-name {
    color: #d1d4dc;
    font-size: 12px;
    font-family: -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Oxygen, Ubuntu, sans-serif;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.indicator-name.dimmed {
    color: #808a9d;
}

/* Accordion styles for view indicators */
.accordion-container {
    display: flex;
    flex-direction: column;
    gap: 2px;
}

.accordion-item {
    background: rgba(255, 255, 255, 0.03);
    border-radius: 4px;
}

.accordion-item.current-view {
    background: rgba(100, 181, 246, 0.1);
    border-left: 2px solid #64b5f6;
}

.accordion-header {
    display: flex;
    align-items: center;
    padding: 8px;
    cursor: pointer;
    gap: 8px;
}

.accordion-header:hover {
    background: rgba(255, 255, 255, 0.05);
}

.accordion-arrow {
    font-size: 10px;
    transition: transform 0.2s;
    color: #888;
}

.accordion-arrow.expanded {
    transform: rotate(90deg);
}

.accordion-title {
    flex: 1;
    font-size: 12px;
    color: #d1d4dc;
    font-family: -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Oxygen, Ubuntu, sans-serif;
}

.indicator-count {
    color: #666;
    font-size: 11px;
}

.accordion-content {
    padding: 4px 8px 8px 24px;
    display: flex;
    flex-direction: column;
    gap: 4px;
}
</style>
