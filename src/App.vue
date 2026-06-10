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
                @close-indicator="onCloseIndicator"
                @order-settings="onOrderBoxSettings"
                @sidebar-click="onSidebarClick"
                @alarm-cleared="onAlarmCleared"
                @alarm-moved="onAlarmMoved">
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

            <div class="bottom-panel-section">
                <button class="bottom-btn" @click="captureScreen" title="Screenshot the whole browser view and save it as a PNG">
                    📷 Capture
                </button>
            </div>

            <div class="bottom-panel-section">
                <button class="bottom-btn" :disabled="!priceAlarms.length"
                    @click="clearAllAlarms"
                    title="Remove every price alarm and silence any that are ringing">
                    🔕 Clear Alarms<span v-if="priceAlarms.length"> ({{ priceAlarms.length }})</span>
                </button>
            </div>
        </div>
    </div>

    <!-- Right-panel left-edge drag handle: resize the panel (width persisted).
         Fixed-positioned at the boundary so the panel's internal scroll can't
         move it. -->
    <div class="panel-resizer"
        :style="{ right: rightPanelWidth + 'px' }"
        @mousedown="startPanelResize"></div>

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

        <!-- Legacy FILE-feed indicator UI (Views / Values / Indicators). In
             GATEWAY mode the Corky discovery panel above owns indicator control,
             so these are gated to file mode — otherwise gateway-added offchart
             overlays (e.g. "MACD histogram", "MACD averages") leaked into the
             "Values" list, duplicating the panel's own toggles. -->
        <div class="panel-section" v-if="feedMode === 'file' && candleColoringOptions.length > 0">
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

        <div class="panel-section" v-if="feedMode === 'file' && offchartIndicators.length > 0">
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
        <div class="panel-section" v-if="feedMode === 'file' && viewIndicatorsAccordion.length > 0">
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

    <!-- Scaled Order modal (after choosing the 'scaled' type, or via an existing
         box's cog — then `initial` pre-fills the current qty/size/distribution) -->
    <order-distribution-modal
        v-if="orderModalOpen"
        :geometry="editingOrderBox ? editingOrderBox.geometry : pendingBoxGeometry"
        :initial="editingOrderBox ? editingOrderBox.initial : null"
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
import PriceAlarms from './components/overlays/PriceAlarms.vue'
import { AlarmSound, updateAlarms } from './helpers/alarm-sound.js'

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
            overlays: [BuysAndSells, Balance, LineTracker, OrderBox, PriceAlarms].map(c => markRaw(c)),
            // Price alarms (Y-axis click): App owns the list; the PriceAlarms
            // overlay renders THIS array by reference (survives DataCube wipes
            // because ensurePriceAlarmOverlay re-adds the overlay pointing at it).
            priceAlarms: [],
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
            // `${venue}|${symbol}` → { kinds:[{display_label,kind}], layers:[layerId],
            //                          hiddenLayers:[layerId] }
            corkyEnabled: {},
            // Last selected stream { venue, symbol, timeframe } — persisted so a
            // reload (or browser restart) reopens the chart you were looking at.
            corkyLast: null,
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
                // A replaced DataCube (File-mode load/tf-switch) lost the alarm
                // renderer — re-add it pointing at the same alarms array.
                if (dc && this.priceAlarms && this.priceAlarms.length) {
                    this.$nextTick(() => this.ensurePriceAlarmOverlay())
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
            this.corkyEnabled = (savedState.corkyEnabled && typeof savedState.corkyEnabled === 'object')
                ? savedState.corkyEnabled : {}
            this.corkyLast = (savedState.corkyLast && savedState.corkyLast.venue &&
                savedState.corkyLast.symbol) ? savedState.corkyLast : null
            if (Number.isFinite(Number(savedState.panelWidth))) {
                this.panelWidth = Number(savedState.panelWidth)
            }
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

        // Price-alarm trigger loop: cheap (reads one array tail), feed-agnostic.
        this._alarmTimer = setInterval(() => this.checkPriceAlarms(), 500)
    },
    beforeUnmount() {
        window.removeEventListener('resize', this.onResize)
        // Don't leak the panel-resize document listeners / body cursor mid-drag.
        this.endPanelResize()
        // Stop the alarm trigger loop and silence/release the audio backend.
        if (this._alarmTimer) { clearInterval(this._alarmTimer); this._alarmTimer = null }
        if (this._alarmSound) { this._alarmSound.destroy(); this._alarmSound = null }
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
            this.corkyDiscover().then((states) => {
                // Reopen the last-viewed stream (persisted across reloads/browser
                // restarts) if it still exists in the catalog. Falls back to the
                // state's first timeframe when the remembered tf is gone.
                const last = this.corkyLast
                if (!last || this.corkyCurrent || this.corkyHandle) return
                const st = (states || []).find(
                    s => s && s.venue === last.venue && s.symbol === last.symbol)
                if (!st) return
                const tfs = st.available_timeframes || []
                const timeframe = tfs.includes(last.timeframe) ? last.timeframe : tfs[0]
                if (timeframe) {
                    this.corkySelect({ venue: last.venue, symbol: last.symbol, timeframe })
                }
            })
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
            // Normalize: `indicators` must be AT LEAST [] — the feed maps a null/
            // missing field to include_indicators:undefined, and the gateway then
            // serves candles WITHOUT indicator rows. The boot-restore call hit
            // exactly that: chart loaded, but no indicator data → _reapplyEnabled
            // a no-op and every panel toggle dead (applied=false).
            opts = { ...opts, indicators: opts.indicators || [] }
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
            const enabled = {
                kinds: mem.kinds.slice(),
                layers: mem.layers.slice(),
                hiddenLayers: mem.hiddenLayers.slice(), // explicit [x]-closed layers stay closed
            }
            // Target the runtime that OWNS this candle-state (from discovery).
            // The gateway's documented preferred pattern: echo back the state's
            // runtime_id as target_runtime_id rather than letting it default to
            // its first-public-runtime fallback (which goes stale across runtime
            // restarts → "missing or stale runtime control session").
            const target_runtime_id = state && state.runtime_id || undefined
            try {
                this.corkyHandle = await this.corkyFeed.subscribe(
                    { ...opts, views, enabled, target_runtime_id }, {
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
                                // The gateway load wiped onchart — restore the
                                // price-alarm renderer (same alarms array).
                                if (this.priceAlarms.length) this.ensurePriceAlarmOverlay()
                            })
                        }
                    },
                    onError: (err) => { this.corkyError = this._corkyErr(err) },
                })
                this._corkySelectRetries = 0   // a clean subscribe clears the ride-through counter
                // Remember the selection so a reload / browser restart reopens it.
                this.corkyLast = {
                    venue: opts.venue, symbol: opts.symbol, timeframe: opts.timeframe,
                }
                this.saveStateToStorage()
            } catch (err) {
                const mapped = this._corkyErr(err)
                // Ride through transient runtime restarts: a retryable control
                // error (runtime_not_found / control_response_timeout /
                // subscribe_timeout) re-discovers + re-selects with backoff a few
                // times before surfacing, so a runtime redeploy self-heals.
                if (this._corkyScheduleSelectRetry(opts, mapped)) return
                this._corkySelectRetries = 0
                this.corkyError = mapped
                this.corkyCurrent = null
            } finally {
                if (!this._corkyRetryPending) this.corkyLoading = false
            }
        },

        // Bounded backoff retry for a transient (retryable) select failure.
        // Returns true if a retry was scheduled (caller should leave the spinner
        // up and NOT surface the error). User-initiated selects reset the count.
        _corkyScheduleSelectRetry(opts, mapped) {
            if (!mapped || !mapped.retryable) return false
            const n = this._corkySelectRetries || 0
            if (n >= 4) return false   // exhausted → surface the error
            this._corkySelectRetries = n + 1
            const delay = Math.min(400 * Math.pow(2, n), 4000)
            this.corkyProgress = { phase: 'retrying', attempt: n + 1, message: mapped.message }
            this._corkyRetryPending = true
            clearTimeout(this._corkyRetryTimer)
            this._corkyRetryTimer = setTimeout(() => {
                this._corkyRetryPending = false
                // A restarted runtime may have a NEW runtime_id — re-discover first.
                Promise.resolve(this.corkyDiscover(opts.venue))
                    .then(() => this.corkySelect(opts))
            }, delay)
            return true
        },

        // Panel: select a venue/symbol/timeframe (+ default indicators).
        onCorkySelect(opts) {
            this._corkyCancelSelectRetry()   // a manual pick supersedes any pending retry
            this.corkySelect(opts)
        },

        // Cancel a pending ride-through retry and reset its counter.
        _corkyCancelSelectRetry() {
            clearTimeout(this._corkyRetryTimer)
            this._corkyRetryTimer = null
            this._corkyRetryPending = false
            this._corkySelectRetries = 0
        },

        // Panel: add a timeframe → patch the candle-state, re-discover, then
        // re-select the new timeframe so it streams.
        async onCorkyAddTimeframe(req) {
            // Stream the new tf CANDLES-ONLY (matching the chip-click select
            // path); the user toggles indicators on client-side afterwards.
            // patch_candle_state falls back to "first public runtime for venue"
            // when no target_runtime_id is given — stale across restarts — so
            // target the runtime that owns this state (from discovery).
            await this._corkyPatchAndReselect(
                {
                    venue: req.venue, symbol: req.symbol, timeframes: [req.timeframe],
                    target_runtime_id: this._corkyRuntimeId(req.venue, req.symbol),
                },
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
            // Pass display_label as the UNIQUE instance: kindOf collapses SCMR and
            // SCMR(INV) to the same 'SCMR', so without it their candle colouring
            // (same layer id scmr_candle_color) overwrites each other.
            const applied = this.corkyFeed.setIndicatorEnabled(
                this.corkyHandle, req.kind, req.enabled, req.display_label)
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
            this._syncHandleEnabled(mem)
            this.saveStateToStorage()   // persist across reloads
        },

        // Keep the live handle's enabled-snapshot fresh: a WS reconnect replays
        // handle.enabled (_reapplyEnabled after the gateway re-serves history) —
        // without this it restores only the SUBSCRIBE-time state and silently
        // drops every indicator/layer toggled since the load.
        _syncHandleEnabled(mem) {
            if (!this.corkyHandle) return
            this.corkyHandle.enabled = {
                kinds: mem.kinds.slice(),
                layers: mem.layers.slice(),
                hiddenLayers: mem.hiddenLayers.slice(),
            }
        },

        // Toggle a single view layer on/off (TL/TH/diagnostics opt-in, or an
        // explicit hide of a default-visible layer via the pane's [x]).
        onCorkyToggleLayer(req) {
            if (!this.corkyFeed || !this.corkyHandle) return
            const applied = this.corkyFeed.setLayerEnabled(
                this.corkyHandle, req.layerId, req.enabled)
            if (!applied) return
            const cur = this.corkyCurrent
            if (cur) cur.layers = [...this.corkyHandle.enabledLayers]
            // Persist for tf-switch + reload survival: enabled layers AND explicit
            // hides (so a default-visible layer closed via [x] stays closed after
            // a reload — _reapplyEnabled seeds handle.hiddenLayers from this).
            const mem = this._corkyMem(req.venue, req.symbol)
            mem.layers = [...this.corkyHandle.enabledLayers]
            const hi = mem.hiddenLayers.indexOf(req.layerId)
            if (req.enabled) {
                if (hi !== -1) mem.hiddenLayers.splice(hi, 1)
            } else if (hi === -1) {
                mem.hiddenLayers.push(req.layerId)
            }
            this._syncHandleEnabled(mem)
            this.saveStateToStorage()
        },

        // ── Price alarms (Y-axis click → bell + repeating tone) ──────────────
        _alarmSoundInst() {
            if (!this._alarmSound) this._alarmSound = new AlarmSound()
            return this._alarmSound
        },
        _lastClose() {
            const d = this.chart && this.chart.data && this.chart.data.chart &&
                this.chart.data.chart.data
            if (!d || !d.length) return NaN
            return Number(d[d.length - 1][4])
        },
        // Y-axis click on the PRICE pane: above the current price → green
        // 'above' alarm, below → red 'below' alarm.
        onSidebarClick(s) {
            if (!s || s.grid_id !== 0 || !Number.isFinite(s.price)) return
            const close = this._lastClose()
            if (!Number.isFinite(close)) return
            // User gesture: create/resume the AudioContext NOW so the later
            // (non-gesture) trigger beeps are allowed to play.
            this._alarmSoundInst().unlock()
            const side = s.price >= close ? 'above' : 'below'
            // ONE alarm per side: a repeat click on the same side MOVES that
            // side's alarm to the new level (and silences it if it was ringing)
            // instead of stacking a second one.
            const existing = this.priceAlarms.find(a => a.side === side)
            if (existing) {
                existing.price = s.price
                existing.triggered = false
                this._alarmSoundInst().stop(existing.id)
            } else {
                this._alarmSeq = (this._alarmSeq || 0) + 1
                this.priceAlarms.push({
                    id: `alarm-${this._alarmSeq}`,
                    price: s.price,
                    side,
                    triggered: false,
                })
            }
            this.ensurePriceAlarmOverlay()
            if (typeof this.chart.touchData === 'function') this.chart.touchData()
        },
        // (Re-)add the renderer overlay. The DataCube is wiped on every load /
        // tf-switch, so this runs after each; settings.alarms is the SAME array
        // as this.priceAlarms, so the alarms themselves survive.
        ensurePriceAlarmOverlay() {
            const dc = this.chart
            if (!dc || !dc.data || typeof dc.add !== 'function') return
            const on = dc.data.onchart || []
            if (on.some(o => o && o.type === 'PriceAlarms')) return
            dc.add('onchart', {
                name: 'Price Alarms', type: 'PriceAlarms', grid: { id: 0 }, data: [],
                settings: {
                    $uuid: 'price-alarms', 'z-index': 150, legend: false,
                    alarms: this.priceAlarms,
                },
            })
        },
        // Poll the last close (feed-agnostic — works for File AND Gateway):
        // ring alarms whose level the price has reached, and silence + re-arm
        // ringing alarms once price crosses BACK to the armed side.
        checkPriceAlarms() {
            if (!this.priceAlarms.length) return
            const close = this._lastClose()
            if (!Number.isFinite(close)) return
            const changed = updateAlarms(this.priceAlarms, close, this._alarmSoundInst())
            if (changed && typeof this.chart.touchData === 'function') this.chart.touchData()
        },
        // Bell clicked → remove that alarm and silence it.
        onAlarmCleared({ id }) {
            this._alarmSoundInst().stop(id)
            const i = this.priceAlarms.findIndex(a => a.id === id)
            if (i !== -1) this.priceAlarms.splice(i, 1)
            if (typeof this.chart.touchData === 'function') this.chart.touchData()
        },
        // Bell dragged to a new level → re-arm there (side re-derived vs the
        // current price) and stop a ringing tone.
        onAlarmMoved({ id, price }) {
            const a = this.priceAlarms.find(x => x.id === id)
            if (!a) return
            a.price = price
            const close = this._lastClose()
            if (Number.isFinite(close)) a.side = price >= close ? 'above' : 'below'
            if (a.triggered) a.triggered = false
            this._alarmSoundInst().stop(id)
            // One alarm per side: if the drag crossed the price and another
            // alarm already holds the new side, the DRAGGED alarm wins.
            const dup = this.priceAlarms.find(x => x !== a && x.side === a.side)
            if (dup) {
                this._alarmSoundInst().stop(dup.id)
                this.priceAlarms.splice(this.priceAlarms.indexOf(dup), 1)
            }
            if (typeof this.chart.touchData === 'function') this.chart.touchData()
        },
        // Bottom-panel 🔕: drop every alarm and silence all tones. splice — NOT
        // reassignment — keeps the array reference the overlay renders.
        clearAllAlarms() {
            this._alarmSoundInst().stopAll()
            this.priceAlarms.splice(0, this.priceAlarms.length)
            if (this.chart && typeof this.chart.touchData === 'function') this.chart.touchData()
        },

        // Pane/legend [x] on a Corky-driven overlay: route through the Corky
        // toggle path so the discovery panel un-highlights AND the hide persists
        // (the File-mode close just flips settings.display, leaving the panel
        // green and the layer resurrected on reload). Returns true when handled.
        closeCorkyIndicator(payload) {
            if (this.feedMode !== 'gateway' || !this.corkyCurrent ||
                !this.corkyHandle || !payload) return false
            const d = this.chart && this.chart.data
            const all = [...((d && d.onchart) || []), ...((d && d.offchart) || [])]
            // Resolve by settings IDENTITY first (the Legend passes the overlay's
            // settings object through): overlay NAMES are just layer labels and
            // collide across instances (SCMR vs SCMR(INV) publish identical layer
            // labels) — a name match would close the wrong instance's pane.
            let ov = payload.settings
                ? all.find(o => o && o.settings === payload.settings) : null
            if (ov && !(ov.settings.corkyLayerId || ov.settings.corkyKind)) {
                return false // identity says it's a non-Corky overlay → File path
            }
            if (!ov) {
                ov = all.find(o => o && o.name === payload.name && o.settings &&
                    (o.settings.corkyLayerId || o.settings.corkyKind))
            }
            if (!ov) return false
            const { venue, symbol, timeframe } = this.corkyCurrent
            const s = ov.settings
            if (s.corkyLayerId) {
                // One view layer (e.g. the MACD bull-strength pane) → layer off.
                this.onCorkyToggleLayer({
                    venue, symbol, timeframe,
                    layerId: s.corkyLayerId, enabled: false,
                })
            } else {
                // Fallback (no-view) overlay → whole indicator off. The mem/panel
                // are keyed by the DESCRIPTOR's display_label, so resolve it from
                // discovery (fallback overlays carry no corkyInstance).
                const st = (this.corkyStates || []).find(
                    x => x && x.venue === venue && x.symbol === symbol)
                const kl = String(s.corkyKind).toLowerCase()
                const desc = ((st && st.indicators) || []).find(
                    i => i && String(i.kind).toLowerCase() === kl)
                this.onCorkyToggleIndicator({
                    venue, symbol, timeframe,
                    kind: s.corkyKind,
                    display_label: (desc && desc.display_label) || s.corkyInstance || s.corkyKind,
                    enabled: false,
                })
            }
            return true
        },

        // The runtime that owns a venue/symbol's candle-state, from the latest
        // discovery (list_candle_states descriptors carry a required runtime_id).
        // Echoed back as target_runtime_id on subscribe/patch so control requests
        // route to the live runtime instead of the gateway's stale default.
        _corkyRuntimeId(venue, symbol) {
            const st = (this.corkyStates || []).find(
                s => s && s.venue === venue && s.symbol === symbol)
            return (st && st.runtime_id) || undefined
        },

        // Per-(venue,symbol) enabled-state memory (lazily created; normalized so a
        // malformed/older restored entry can't break .kinds/.layers access).
        _corkyMem(venue, symbol) {
            const key = `${venue}|${symbol}`
            let m = this.corkyEnabled[key]
            if (!m) { m = { kinds: [], layers: [], hiddenLayers: [] }; this.corkyEnabled[key] = m }
            if (!Array.isArray(m.kinds)) m.kinds = []
            if (!Array.isArray(m.layers)) m.layers = []
            if (!Array.isArray(m.hiddenLayers)) m.hiddenLayers = []
            return m
        },

        // Patch the candle-state on the gateway, re-discover the catalog, then
        // re-select so the newly-added tf/indicator actually streams.
        async _corkyPatchAndReselect(patch, selectOpts) {
            if (!this.corkyClient) return
            this._corkyCancelSelectRetry()   // fresh user action
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
            this._corkyCancelSelectRetry()   // don't let a pending retry fire post-teardown
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

.bottom-btn:disabled {
    opacity: 0.4;
    cursor: default;
}
.bottom-btn:disabled:hover {
    background: none;
    border-color: #2a2e39;
    color: inherit;
}

/* Right Panel */
.right-panel {
    background-color: #1e222d;
    border-left: 1px solid #2a2e39;
    overflow-y: auto;
    overflow-x: hidden;
    box-sizing: border-box;
}

/* Drag handle on the right panel's left border: widen/narrow the panel.
   Fixed at the boundary (style binds `right`), straddling the border line. */
.panel-resizer {
    position: fixed;
    top: 0;
    bottom: 0;
    width: 8px;
    margin-right: -4px; /* straddle the border */
    cursor: col-resize;
    z-index: 1000;
}
.panel-resizer:hover {
    background: rgba(53, 167, 118, 0.35);
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
