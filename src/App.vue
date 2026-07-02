<template>
<div class="app-container">
    <!-- Chart area -->
    <div class="chart-area">
        <!-- Top-level chart tabs: each tab is an independent chart. -->
        <chart-tab-bar
            :tabs="chartTabs"
            :active-id="activeChartTabId"
            :max="maxChartTabs"
            @select="activateChartTab"
            @create="createChartTab"
            @close="closeChartTab" />
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

            <!-- Empty state: nothing loaded yet. An opaque cover hides the empty
                 grid / Volume legend / axes and invites the user to pick a source. -->
            <div v-if="chartEmpty" class="chart-empty">
                <div class="chart-empty-inner">
                    <div class="chart-empty-icon">▤</div>
                    <div class="chart-empty-msg">Select a ticker, position, strategy or backtest</div>
                    <div class="chart-empty-sub">Pick one from the source panel or the dock below to load a chart.</div>
                </div>
            </div>

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
            <!-- File-feed state only: in gateway mode the stale `charts` map kept
                 these buttons alive, and clicking one replaced this.chart UNDER
                 the CorkyFeed → the stream wrote into a detached cube. -->
            <div class="bottom-panel-section"
                 v-if="feedMode === 'file' && Object.keys(charts).length > 1">
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

        <!-- Positions dock (gateway mode): pinned to the very bottom, BELOW the
             chart-controls bar (log scale / reset / capture). Open / Historical. -->
        <corky-positions-panel
            v-if="feedMode === 'gateway'"
            :height="bottomDockHeight"
            :open="positionsDockOpen"
            :maximized="positionsDockMaximized"
            :active-tab="positionsActiveTab"
            :open-positions="openPositions"
            :historical-positions="historicalPositions"
            :accounts="positionsAccounts"
            :active-account="positionsActiveAccount"
            :loading="positionsLoading"
            :error="positionsError"
            :history-has-more="positionsHistoryCursor != null"
            :history-total="positionsHistoryTotal"
            :current-symbol-key="positionsCurrentSymbolKey"
            :search-tabs="searchTabs"
            :search-context="searchContext"
            :search-nav="searchNav"
            :backtests="backtests"
            :strategy="strategy"
            @strategy-select-runtime="strategySelectRuntime"
            @strategy-refresh="strategyRefresh"
            @strategy-cancel-ticker-orders="strategyCancelTickerOrders"
            @strategy-pause-ticker="strategyPauseTicker"
            @strategy-resume-ticker="strategyResumeTicker"
            @strategy-unlock-ticker="strategyUnlockTicker"
            @strategy-adopt-position="strategyAdoptPosition"
            @strategy-open-lineage-run="strategyOpenLineageRun"
            @bt-refresh-strategies="btLoadStrategies"
            @bt-update-filter="btUpdateFilter"
            @bt-list-runs="btListRuns"
            @bt-inspect-strategy="btInspectStrategy"
            @bt-select-run="btSelectRun"
            @bt-set-metric-filters="btSetMetricFilters"
            @bt-plot-run="btPlotRun"
            @bt-select-trade="btSelectTrade"
            @bt-select-candidate="btSelectCandidate"
            @bt-close-detail="btCloseDetail"
            @update:open="togglePositionsDock"
            @update:maximized="toggleDockMaximize"
            @update:active-tab="setPositionsTab"
            @update:active-account="setPositionsAccount"
            @select-position="onPositionSelect"
            @audit-position="openAudit"
            @load-more="loadHistoryPage(false)"
            @refresh="refreshPositions"
            @run-search="onRunSearch"
            @cancel-search="onCancelSearch"
            @close-search-tab="onCloseSearchTab"
            @select-result="onSearchResultSelect"
            @resize-start="startPositionsDockResize" />
    </div>

    <!-- Right-panel left-edge drag handle: resize the panel (width persisted).
         Fixed-positioned at the boundary so the panel's internal scroll can't
         move it. -->
    <div v-show="!rightPanelCollapsed" class="panel-resizer"
        :style="{ right: rightPanelWidth + 'px' }"
        @mousedown="startPanelResize"></div>

    <!-- Collapse / expand the right panel. Pinned at the panel's LEFT edge, level
         with the SOURCE title: collapsing closes the panel (the chart takes the
         space); reopening restores the previous width. -->
    <button class="panel-collapse-toggle"
        :class="{ collapsed: rightPanelCollapsed }"
        :style="{ right: rightPanelWidth + 'px' }"
        @click="toggleRightPanel"
        :aria-expanded="rightPanelCollapsed ? 'false' : 'true'"
        :aria-label="rightPanelCollapsed ? 'Expand panel' : 'Collapse panel'"
        :title="rightPanelCollapsed ? 'Expand panel' : 'Collapse panel'">
        <span class="pct-chevron">{{ rightPanelCollapsed ? '‹' : '›' }}</span>
    </button>

    <!-- Right Panel -->
    <div class="right-panel" :class="{ collapsed: rightPanelCollapsed }" :style="{ width: rightPanelWidth + 'px', height: height + 'px' }">
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

        <!-- Position Details: toggle the clicked position's chart overlays -->
        <div class="panel-section" v-if="feedMode === 'gateway' && positionPlot">
            <div class="section-title">Position Details — {{ positionPlot.symbol }} #{{ positionPlot.position_id }}</div>
            <div class="indicator-list">
                <div v-for="row in positionDetailRows" :key="row.key" class="indicator-item">
                    <button
                        class="visibility-toggle"
                        :class="{ hidden: !positionPlot.toggles[row.key] }"
                        @click="togglePositionDetail(row.key)"
                        :title="positionPlot.toggles[row.key] ? 'Hide on chart' : 'Show on chart'">
                        <svg v-if="positionPlot.toggles[row.key]" viewBox="0 0 24 24" width="16" height="16">
                            <path fill="currentColor" d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/>
                        </svg>
                        <svg v-else viewBox="0 0 24 24" width="16" height="16">
                            <path fill="currentColor" d="M12 7c2.76 0 5 2.24 5 5 0 .65-.13 1.26-.36 1.83l2.92 2.92c1.51-1.26 2.7-2.89 3.43-4.75-1.73-4.39-6-7.5-11-7.5-1.4 0-2.74.25-3.98.7l2.16 2.16C10.74 7.13 11.35 7 12 7zM2 4.27l2.28 2.28.46.46C3.08 8.3 1.78 10.02 1 12c1.73 4.39 6 7.5 11 7.5 1.55 0 3.03-.3 4.38-.84l.42.42L19.73 22 21 20.73 3.27 3 2 4.27zM7.53 9.8l1.55 1.55c-.05.21-.08.43-.08.65 0 1.66 1.34 3 3 3 .22 0 .44-.03.65-.08l1.55 1.55c-.67.33-1.41.53-2.2.53-2.76 0-5-2.24-5-5 0-.79.2-1.53.53-2.2zm4.31-.78l3.15 3.15.02-.16c0-1.66-1.34-3-3-3l-.17.01z"/>
                        </svg>
                    </button>
                    <span class="indicator-name" :class="{ dimmed: !positionPlot.toggles[row.key] }">
                        {{ row.name }}
                    </span>
                </div>
            </div>
        </div>

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

    <!-- Selected-position audit drawer (opened on a positions-dock row click) -->
    <position-audit-drawer
        :open="auditOpen"
        :audit="auditData"
        :loading="auditLoading"
        :error="auditError"
        :target="auditTarget"
        @close="closeAudit" />
</div>
</template>

<script>
import { markRaw } from 'vue'
import TradingVue from './TradingVue.vue'
import IndicatorSettings from './components/IndicatorSettings.vue'
import OrderDistributionModal from './components/OrderDistributionModal.vue'
import OrderTypeModal from './components/OrderTypeModal.vue'
// OrderAgent / StubOrderTransport now live in the chart-tabs mixin (per-cube setup).
import CorkyDiscoveryPanel from './components/feed/CorkyDiscoveryPanel.vue'
import CorkyPositionsPanel from './components/feed/CorkyPositionsPanel.vue'
import PositionAuditDrawer from './components/feed/PositionAuditDrawer.vue'
import DataCube from '../src/helpers/datacube.js'
import { CorkyClient } from '../src/helpers/feed/corky-client.js'
import { CorkyFeed } from '../src/helpers/feed/corky-feed.js'
import { CorkyPositionsFeed } from '../src/helpers/feed/corky-positions-feed.js'
import { CorkySearchFeed } from '../src/helpers/feed/corky-search-feed.js'
import { CorkyBacktestsFeed } from '../src/helpers/feed/corky-backtests-feed.js'
import { CorkyStrategyFeed } from '../src/helpers/feed/corky-strategy-feed.js'
import { overlaysToMarkers, classifyLineage, CAPITAL_CONTROL_METHODS } from '../src/helpers/feed/corky-strategy-transforms.js'
import { buildSearchQuery, buildCondition, barrierTargetSpec } from '../src/helpers/feed/search-query.js'
import { backtestSeriesOverlays, backtestTradeMarkers } from '../src/helpers/feed/backtest-overlays.js'
import { detectRunShape } from '../src/helpers/feed/backtest-shape.js'
import { pickTimeframe, paddedCandleRange, coarsenTimeframe } from '../src/helpers/feed/pick-timeframe.js'
import { pushRecent } from './helpers/recency.js'
import {
    tradeMarkers, positionSizeSeries, buySellHistogram, cumulativeFees, positionWindow,
    orderMarkers, openCloseMarkers,
} from '../src/helpers/feed/position-overlays.js'
import BuysAndSells from './components/overlays/BuysAndSells.js'
import Balance from './components/overlays/Balance.js'
import LineTracker from './components/overlays/LineTracker.js'
import OrderBox from './components/overlays/OrderBox.vue'
import PriceAlarms from './components/overlays/PriceAlarms.vue'
import SignalMarker from './components/overlays/SignalMarker.js'
import BarrierPlan from './components/overlays/BarrierPlan.js'
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

// Default live strategy runtime to select + subscribe (matches the panel's
// default; falls back to the first runtime when absent from the set).
const DEFAULT_STRATEGY_RUNTIME_ID = 'v8-tail-repair-live-main'

// Distinct on-chart marker style per strategy-overlay class. `anchor` picks the
// owning candle's price the glyph rides on ('h'=high above, 'l'=low below), so
// the classes visually separate. `control` = a manual strategy_control_audit
// marker (distinguished by SOURCE, not kind). Reused by syncStrategyOverlays.
const STRATEGY_MARKER_STYLES = {
    decision:   { color: '#58a6ff', shape: 'circle',        anchor: 'h', z: 150 },
    allocation: { color: '#bb86fc', shape: 'diamond',       anchor: 'l', z: 151 },
    order:      { color: '#d97706', shape: 'square',        anchor: 'h', z: 152 },
    fill:       { color: '#23a776', shape: 'triangle-up',   anchor: 'l', z: 154 },
    control:    { color: '#f5c518', shape: 'triangle-down', anchor: 'h', z: 156 },
}

// App mixins (decomposed concerns)
import { ViewManager, IndicatorManager, FileManager, ChartState, DrawingTools, WsManager, ChartTabs } from './mixins/app/index.js'
import ChartTabBar from './components/ChartTabBar.vue'

export default {
    name: 'app',
    mixins: [ViewManager, IndicatorManager, FileManager, ChartState, DrawingTools, WsManager, ChartTabs],
    components: {
        TradingVue,
        ChartTabBar,
        IndicatorSettings,
        OrderDistributionModal,
        OrderTypeModal,
        CorkyDiscoveryPanel,
        CorkyPositionsPanel,
        PositionAuditDrawer
    },
    data() {
        return {
            // `chart` is now a computed shim in the chart-tabs mixin (get -> the
            // active tab's cube; set -> replace it). chartTabs/activeChartTabId
            // live there too, seeded in created().
            // markRaw: overlay component definitions must not be made reactive
            // (Vue warns + needless overhead) when held in component data.
            overlays: [BuysAndSells, Balance, LineTracker, OrderBox, PriceAlarms, SignalMarker, BarrierPlan].map(c => markRaw(c)),
            // priceAlarms / searchNav / positionPlot are now PER-TAB (computed
            // shims → the active tab; see the computed block). The PriceAlarms
            // overlay renders the active tab's array by reference, re-pointed by
            // ensurePriceAlarmOverlay.
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
            // corkyFeed/corkyCurrent/corkyHandle/corkyLast are now COMPUTED shims
            // that resolve to the ACTIVE tab (concurrent-live: each tab owns its
            // own CorkyFeed + stream, all live at once). See the computed block.
            corkyDiscoverFeed: null,   // a feed used ONLY for discover() (no stream)
            // Reactive discovery surface rendered by CorkyDiscoveryPanel.
            corkyStates: [],
            // Enabled indicators + hidden layers, persisted per venue|symbol so a
            // timeframe switch (which tears down the subscription) keeps them on.
            // `${venue}|${symbol}` → { kinds:[{display_label,kind}], layers:[layerId],
            //                          hiddenLayers:[layerId] }
            corkyEnabled: {},
            // corkyLoading/corkyProgress/corkyError are PER-TAB (computed shims →
            // active tab) so the discovery chrome tracks the active tab and a
            // background tab's load never bleeds into it.

            // ── Auth positions (bottom dock) ──
            positionsFeed: null,           // CorkyPositionsFeed over corkyClient
            openPositions: [],             // current/open position rows
            historicalPositions: [],       // closed/historical rows (paged)
            positionsAccounts: [],         // [{ venue, account_id }] derived from rows
            positionsActiveAccount: null,  // { venue, account_id } for history/audit
            positionsActiveTab: 'open',    // 'open' | 'historical' | 'search' | a search-tab id
            positionsLoading: false,
            positionsError: null,
            positionsHistoryCursor: null,  // opaque next_cursor (null = exhausted)
            positionsHistoryTotal: 0,

            // ── Historical indicator search (dock tabs) ──
            searchFeed: null,              // CorkySearchFeed over corkyClient
            // One reactive tab per search: { id, n, search_id, title, status,
            // running, progress, matches:[], error, summary, query }. Transient —
            // not persisted (results are query output, not state).
            searchTabs: [],
            searchTabSeq: 0,               // increments per created tab → "Search Results N"
            // searchNav (active search-result nav) is PER-TAB (computed shim).

            // ── Strategies / Backtests (read-only via the gateway) ──
            backtestsFeed: null,
            // One reactive bundle passed to CorkyBacktestsPanel. detail =
            // { progress:[], live, report, reportLoading, plottedRunId }.
            backtests: {
                strategies: [], runs: [], filters: { strategy: '', symbol: '', status: '', timeframe: '', runType: '' },
                selectedRun: null, detail: {}, loading: false, error: null,
                // App-level so they PERSIST across opening a run/candidate in a new
                // tab or viewing a detail: column metric filters + recency-graded
                // click history (last-5 run/candidate ids, most-recent first).
                metricFilters: [], clickHistory: [],
            },

            // ── Strategy runtimes (read-only via the gateway) ──
            strategyFeed: null,
            // One reactive bundle passed to CorkyStrategyPanel. `runtimes` is the
            // selectable set (from list_strategy_runtimes, live-upserted by the
            // runtime subscription); `overlays` maps ticker_id → raw chart-overlay
            // rows for the on-chart Markers plot; `decisions` are the selected
            // runtime's audit rows (both tickers). App owns selection + streaming.
            strategy: {
                runtimes: [], selectedRuntimeId: DEFAULT_STRATEGY_RUNTIME_ID,
                decisions: [], overlays: {}, streaming: false, loading: false, error: null,
                // Direct-control session state (see the control handlers below).
                // `available` gates the panel's control surface entirely; a control
                // send flips pending → awaiting and never mutates the runtime set.
                control: { available: false, pending: false, awaiting: false, error: null },
            },

            // positionPlot (a position plotted on the chart: trades + detail panes)
            // is PER-TAB (computed shim → active tab). The derived series live on
            // the tab so they survive the candle feed's onchart/offchart wipe and
            // stay with the chart they were plotted on.

            // ── Selected-position audit drawer ──
            auditOpen: false,
            auditData: null,               // parsed audit bundle (kept on error)
            auditLoading: false,
            auditError: null,
            auditTarget: null,             // { venue, account_id, symbol, position_id }
        }
    },
    computed: {
        // True when the active chart has no candles loaded yet — drives the
        // empty-state placeholder (and hides the empty grid / axes / Volume legend).
        chartEmpty() {
            const dc = this.chart
            const data = dc && dc.data
            if (!data) return true
            // Depend on the store revision (reactive) so an IN-PLACE data load
            // flips this — the ohlcv rows are markRaw'd, so a bare length change
            // wouldn't recompute. Guarded: no-op if the back-ref is absent.
            const cd = data.$cd
            if (cd && typeof cd.revision === 'function') cd.revision()
            const ohlcv = data.chart && data.chart.data
            return !ohlcv || ohlcv.length === 0
        },
        // ── Per-tab gateway stream shims (concurrent-live) ────────────────────
        // Each chart tab owns its own CorkyFeed + stream, all live at once. These
        // resolve to the ACTIVE tab so the existing corky code (corkySelect, the
        // indicator toggles, the discovery panel's :current highlight) transparently
        // reads/writes the active tab's stream — while every tab keeps streaming in
        // the background, so switching is a render swap (no re-subscribe, no jump).
        corkyFeed() { return this.activeTab ? this.activeTab.corkyFeed : null },
        corkyCurrent: {
            get() { return this.activeTab ? this.activeTab.corkyCurrent : null },
            set(v) { if (this.activeTab) this.activeTab.corkyCurrent = v },
        },
        corkyHandle: {
            get() { return this.activeTab ? this.activeTab.corkyHandle : null },
            set(v) { if (this.activeTab) this.activeTab.corkyHandle = v },
        },
        corkyLast: {
            get() { return this.activeTab ? this.activeTab.corkyLast : null },
            set(v) { if (this.activeTab) this.activeTab.corkyLast = v },
        },
        // ── Per-tab on-chart overlay state (shims → active tab) ───────────────
        // A plotted position / backtest / search marker / price alarms / drawing
        // arm belong to the chart they were made on. The draw methods already
        // target this.chart (= active cube), so routing the STATE through the
        // active tab keeps each tab's overlays with it (they persist in its cube).
        positionPlot: {
            get() { return this.activeTab ? this.activeTab.positionPlot : null },
            set(v) { if (this.activeTab) this.activeTab.positionPlot = v },
        },
        searchNav: {
            get() { return this.activeTab ? this.activeTab.searchNav : null },
            set(v) { if (this.activeTab) this.activeTab.searchNav = v },
        },
        priceAlarms: {
            get() { return this.activeTab ? this.activeTab.priceAlarms : [] },
            set(v) { if (this.activeTab) this.activeTab.priceAlarms = v },
        },
        rectDrawMode: {
            get() { return this.activeTab ? this.activeTab.rectDrawMode : false },
            set(v) { if (this.activeTab) this.activeTab.rectDrawMode = v },
        },
        // Non-reactive-by-history backtest plot state, now per-tab via the shim.
        _btPlot: {
            get() { return this.activeTab ? this.activeTab.btPlot : null },
            set(v) { if (this.activeTab) this.activeTab.btPlot = v },
        },
        _btProgressSub: {
            get() { return this.activeTab ? this.activeTab.btProgressSub : null },
            set(v) { if (this.activeTab) this.activeTab.btProgressSub = v },
        },
        // Per-tab load chrome (drives CorkyDiscoveryPanel :loading/:progress/:error).
        corkyLoading: {
            get() { return this.activeTab ? this.activeTab.corkyLoading : false },
            set(v) { if (this.activeTab) this.activeTab.corkyLoading = v },
        },
        corkyProgress: {
            get() { return this.activeTab ? this.activeTab.corkyProgress : null },
            set(v) { if (this.activeTab) this.activeTab.corkyProgress = v },
        },
        corkyError: {
            get() { return this.activeTab ? this.activeTab.corkyError : null },
            set(v) { if (this.activeTab) this.activeTab.corkyError = v },
        },
        // `venue|symbol` (lowercased) of the charted stream — lets the dock
        // highlight the row whose ticker is currently shown.
        positionsCurrentSymbolKey() {
            if (!this.corkyCurrent) return ''
            return `${String(this.corkyCurrent.venue).toLowerCase()}|${String(this.corkyCurrent.symbol).toLowerCase()}`
        },
        // Toggle rows for the Position Details sidebar section (when a position is
        // plotted). The fees row labels the dominant currency once known.
        positionDetailRows() {
            if (!this.positionPlot) return []
            const cur = this.positionPlot.series &&
                this.positionPlot.series.fees && this.positionPlot.series.fees.currency
            return [
                { key: 'trades', name: 'Trades' },
                { key: 'openClose', name: 'Open / Close' },
                { key: 'orders', name: 'Orders' },
                { key: 'size', name: 'Position Size' },
                { key: 'hist', name: 'Buy / Sell Histogram' },
                { key: 'fees', name: cur ? `Fees (${cur})` : 'Fees' },
            ]
        },
        // Form context for SearchSignalsForm. Carries the charted symbol's
        // venue/symbol/timeframe as DEFAULTS, plus a per-symbol option set
        // (timeframes + indicator labels/fields) for EVERY discovered state — so
        // the form's indicator/timeframe choices follow the symbol the user is
        // actually searching, not just the charted one. (Only some symbols carry
        // indicator descriptors; the rest list none, which the form reflects.)
        searchContext() {
            const cur = this.corkyCurrent
            const states = this.corkyStates || []
            const symbols = states.map((s) => ({
                venue: s.venue,
                symbol: s.symbol,
                timeframes: s.available_timeframes || [],
                indicators: this._indicatorOptions(s),
            }))
            const curState = cur
                ? states.find((s) => s && s.venue === cur.venue && s.symbol === cur.symbol)
                : null
            const def = curState || states[0] || null
            return {
                venue: (cur && cur.venue) || (def && def.venue) || '',
                symbol: (cur && cur.symbol) || (def && def.symbol) || '',
                timeframe: cur && cur.timeframe,
                // Charted-symbol fallbacks (used before the user picks a symbol).
                timeframes: (def && def.available_timeframes) || [],
                indicators: this._indicatorOptions(def),
                symbols,
            }
        },
    },
    watch: {
        // The chart canvas is sized from chartLayout, which is rebuilt only by an
        // explicit update_layout() — it does NOT react to the height prop alone.
        // So when the positions dock opens/closes/resizes (changing chartHeight),
        // force a relayout, otherwise the canvas keeps its old height and draws
        // OVER the dock. nextTick lets the new height prop reach the chart first.
        bottomDockHeight() {
            this.$nextTick(() => {
                const tv = this.$refs.tradingVue
                if (tv && typeof tv.updateLayout === 'function') tv.updateLayout(true)
            })
        },
        // Collapsing/expanding the right panel is a large chartWidth change — same
        // story as the dock height: the canvas needs an explicit relayout. (Watched
        // on the boolean, not rightPanelWidth, so a resize DRAG doesn't spam it.)
        rightPanelCollapsed() {
            this.$nextTick(() => {
                const tv = this.$refs.tradingVue
                if (tv && typeof tv.updateLayout === 'function') tv.updateLayout(true)
            })
        },
        // NOTE: the old `chart` watcher moved into the chart-tabs mixin
        // (onTabCubeReplaced) so cube-REPLACE (tf/file load) is cleanly separated
        // from tab-ACTIVATE (switch, never destroys a backgrounded cube).
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
            // Multi-tab restore set (consumed by enterGatewayMode after discovery).
            // Back-compat: if absent but a single corkyLast exists, synthesize one.
            this._savedCorkyTabs = (savedState.corkyTabs && Array.isArray(savedState.corkyTabs.tabs))
                ? savedState.corkyTabs
                : (this.corkyLast ? { tabs: [this.corkyLast], activeIndex: 0 } : null)
            // While a restore is pending, serializeChartTabs round-trips the saved
            // set so no interaction can overwrite the persisted layout before it's
            // actually restored (transient-discovery-failure protection).
            this._corkyRestorePending = !!this._savedCorkyTabs
            if (Number.isFinite(Number(savedState.panelWidth))) {
                this.panelWidth = Number(savedState.panelWidth)
            }
            if (typeof savedState.rightPanelCollapsed === 'boolean') {
                this.rightPanelCollapsed = savedState.rightPanelCollapsed
            }
            // Positions dock layout (gateway mode).
            if (typeof savedState.positionsDockOpen === 'boolean') {
                this.positionsDockOpen = savedState.positionsDockOpen
            }
            if (Number.isFinite(Number(savedState.positionsDockHeight))) {
                this.positionsDockHeight = Number(savedState.positionsDockHeight)
            }
            if (typeof savedState.positionsDockMaximized === 'boolean') {
                this.positionsDockMaximized = savedState.positionsDockMaximized
            }
            if (savedState.positionsActiveTab === 'open' || savedState.positionsActiveTab === 'historical') {
                this.positionsActiveTab = savedState.positionsActiveTab
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
        // Release EVERY tab's cube (worker/watchers/orderAgent). DCCore.destroy()
        // is idempotent, so the active cube being destroyed again by
        // TradingVue.beforeUnmount (child unmounts after this parent hook) is a
        // safe no-op.
        this.destroyAllChartTabs()
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
            if (!this.corkyClient) {
                const url = deriveCorkyUrl()
                console.log('[Corky] gateway URL:', url)
                this.corkyClient = new CorkyClient({ url })
                this.corkyClient.connect()
                // A feed used ONLY for discover() (no chart subscription); the
                // per-tab stream feeds are created by _corkyBindActiveCube.
                this.corkyDiscoverFeed = markRaw(new CorkyFeed({
                    client: this.corkyClient,
                    dataCube: this.activeChart,
                }))
                // Positions ride the SAME socket; they are not chart data so they
                // get their own feed (no DataCube), surfaced in the bottom dock.
                this.positionsFeed = new CorkyPositionsFeed({ client: this.corkyClient })
                // Historical search also rides the same socket (its own feed; not
                // chart data — results are a transient query surface in the dock).
                this.searchFeed = new CorkySearchFeed({ client: this.corkyClient })
                // Strategies/backtests: read-only over the same socket.
                this.backtestsFeed = new CorkyBacktestsFeed({ client: this.corkyClient })
                // Strategy runtimes ride the same socket (read-only reads + a live
                // full-replacement runtime subscription); surfaced in the dock.
                this.strategyFeed = new CorkyStrategyFeed({ client: this.corkyClient })
                // Create the initial tab's stream feed + wire its lazy "load older
                // candles on pan-left" loader onto the active cube. (Each tab gets
                // its own feed; the loader backfills the revealed older range on
                // demand — e.g. a backtest plotted as its last ~1000 bars scrolls
                // back through the full run history.)
                this._corkyBindActiveCube()
            }
            // Preload the strategy catalog so the Backtests tab is populated.
            this.btLoadStrategies()
            // Load the open-positions snapshot up front so the dock's tab badge is
            // populated even before the user expands it.
            this.refreshPositions()
            this.corkyDiscover().then((states) => {
                // Restore the persisted chart-tab SET after discovery. Tabs
                // lazy-subscribe on first view; restoreChartTabs kicks the active one.
                if (this.corkyCurrent || this.corkyHandle) {
                    // Already charting → the live set is authoritative; stop pending.
                    this._savedCorkyTabs = null
                    this._corkyRestorePending = false
                    return
                }
                if (!this._savedCorkyTabs) return   // fresh session → empty tab + discovery CTA
                // CRITICAL: do NOT discard the saved set when discovery came back
                // EMPTY (a transient gateway/runtime failure) — keep it (and the
                // pending flag protecting localStorage) so the NEXT successful
                // discover (this reload's retry, or a future reload) still restores.
                if (!Array.isArray(states) || !states.length) return
                const restored = (typeof this.restoreChartTabs === 'function')
                    ? this.restoreChartTabs(this._savedCorkyTabs) : 0
                if (restored) {
                    this._savedCorkyTabs = null   // cleared ONLY on a real restore
                    this._corkyRestorePending = false
                }
            })
        },

        // Discover the catalog → populate the reactive `corkyStates`. Uses the
        // dedicated discover feed (not a tab's stream feed), so it works even when
        // no tab has a stream yet.
        // `quiet` skips the load chrome (loading/error are active-tab shims, so a
        // BACKGROUND tab's ride-through retry must not flash a phantom spinner or
        // clear a real error on the tab the user is actually looking at).
        async corkyDiscover(venue, quiet) {
            if (!this.corkyDiscoverFeed) return
            if (!quiet) { this.corkyLoading = true; this.corkyError = null }
            try {
                const list = await this.corkyDiscoverFeed.discover(venue)
                this.corkyStates = Array.isArray(list) ? list : (list ? [list] : [])
            } catch (err) {
                if (!quiet) this.corkyError = this._corkyErr(err)
            } finally {
                if (!quiet) this.corkyLoading = false
            }
            return this.corkyStates
        },

        // Lazy-history loader: the chart calls this when the user pans LEFT past
        // the earliest loaded candle. Fetch the revealed older window from the
        // gateway (a one-shot start_end read on its own subscription — never the
        // live stream) and return ascending OHLCV; the DataCube merges/prepends
        // it. Staleness-guarded against a stream switch mid-fetch.
        // @param {[number, number]} range - [olderEdgeMs, firstLoadedCandleMs]
        async _corkyHistoryLoader(range, tab) {
            // Bound to a SPECIFIC tab's cube (see _corkyBindActiveCube): use THAT
            // tab's stream, NEVER the global active tab. Otherwise a backfill that
            // fires for tab B's cube during/after a switch could read tab A's
            // timeframe (corkyCurrent is the active-tab shim) and prepend it — the
            // "daily candles glued onto the start of an hourly chart" corruption.
            tab = tab || this.activeTab
            const cur = tab && tab.corkyCurrent
            const feed = tab && tab.corkyFeed
            if (!feed || !cur || !cur.venue || !cur.symbol || !cur.timeframe) return []
            const end = Math.ceil(range[1])
            let start = Math.floor(range[0])
            if (!(end > start)) return []
            // Bound each backfill to ≤1000 bars: the gateway holds only a small
            // live buffer (~400) and serves older bars from a SLOW historical
            // source, so a far pan would otherwise issue one huge, stalling
            // request. The chart re-fires range_changed after each chunk merges,
            // so panning further keeps loading progressively.
            const tfMs = this._tfToMs(cur.timeframe)
            const MAX_BARS = 1000
            if (tfMs > 0 && (end - start) / tfMs > MAX_BARS) start = end - MAX_BARS * tfMs
            // Per-tab staleness: corkyCurrent is a fresh object on each (re)select,
            // so a reference change means this tab's stream moved on mid-backfill.
            // If a backtest is plotted for THIS stream, fetch its equity/trades
            // for the same older window too, so the overlays extend with the
            // candles (not just the candles). The chart report is windowed, so we
            // merge each panned window into it on demand.
            const plot = tab.btPlot   // the BOUND tab's plotted backtest (not the active shim)
            const btActive = !!(plot && plot.runId && plot.report && this.backtestsFeed
                && plot.venue === cur.venue && plot.symbol === cur.symbol && plot.timeframe === cur.timeframe)
            try {
                const [rows, windowReport] = await Promise.all([
                    feed.fetchHistory({
                        venue: cur.venue, symbol: cur.symbol, timeframe: cur.timeframe,
                        start_ms: start, end_ms: end,
                    }),
                    btActive
                        ? this.backtestsFeed.getReportOverlays(
                            { run_id: plot.runId, start_ms: start, end_ms: end, max_points: 2000, run_index: plot.runIndex }).catch(() => null)
                        : Promise.resolve(null),
                ])
                // This tab was re-selected (tf-switch) while the backfill was in
                // flight — the candles belong to a stream no longer charted in this
                // tab; drop them rather than prepend the wrong timeframe.
                if (tab.corkyCurrent !== cur) return []
                // Extend the plotted report with the older window's equity/trades,
                // then re-sync overlays AFTER the candle merge (the clip keys off
                // the candle range, which only widens once these rows are merged).
                if (btActive && windowReport && tab.btPlot === plot) {
                    plot.report = this._btMergeReportWindow(plot.report, windowReport)
                    setTimeout(() => { if (tab.btPlot === plot && tab.id === this.activeChartTabId) this.syncBacktestOverlays() }, 0)
                }
                return rows
            } catch (err) {
                console.warn('[Corky] history backfill failed:', (err && err.message) || err)
                return []
            }
        },

        // Merge an older windowed report's time-series (equity_curve + trades)
        // into the plotted report so backtest overlays extend as the user pans
        // back. Dedup by timestamp (newer window wins); descriptors / period
        // returns are window-independent and kept from the base report.
        _btMergeReportWindow(base, add) {
            if (!base) return add
            if (!add) return base
            const mergeBy = (a, b, keyOf) => {
                const map = new Map()
                for (const x of (a || [])) map.set(keyOf(x), x)
                for (const x of (b || [])) map.set(keyOf(x), x)
                return [...map.values()].sort((p, q) => Number(p.timestamp_ms) - Number(q.timestamp_ms))
            }
            return {
                ...base,
                equity_curve: mergeBy(base.equity_curve, add.equity_curve, (p) => p.timestamp_ms),
                trades: mergeBy(base.trades, add.trades, (t) => `${t.timestamp_ms}:${t.side}:${t.price}`),
            }
        },

        // Subscribe to a stream (single active subscription): drop the prior
        // one, then drive the DataCube from the gateway.
        async corkySelect(opts, targetTab) {
            if (!this.corkyClient) return
            // Per-tab: this load targets `tab` (defaults to the active tab). Its own
            // feed, control epoch, handle, load-chrome and retry all live on the tab,
            // so a concurrently-loading BACKGROUND tab keeps its completion and the
            // discovery chrome (loading/progress/error shims) tracks the active tab.
            const tab = targetTab || this.activeTab
            if (!tab) return
            // Belt-and-braces: a timer-armed retry can fire after its tab was
            // closed — bail if it's no longer a member (close also bumps its epoch).
            if (Array.isArray(this.chartTabs) && !this.chartTabs.includes(tab)) return
            this._ensureTabFeed(tab)
            const feed = tab.corkyFeed
            if (!feed) return
            const st = tab._stream || (tab._stream = { gen: 0 })
            // Bind the lazy-history loader to the active cube (panning is active-only).
            this._corkyBindActiveCube()
            // Per-TAB staleness epoch: anything after an await only applies if THIS
            // tab's select is still the latest — another tab's select can't supersede
            // it (the global-epoch bug that dropped a concurrent background load).
            st.gen = (st.gen || 0) + 1
            const gen = st.gen
            // Normalize: `indicators` must be AT LEAST [] — the feed maps a null/
            // missing field to include_indicators:undefined, and the gateway then
            // serves candles WITHOUT indicator rows (the boot-restore bug).
            opts = { ...opts, indicators: opts.indicators || [] }
            // Tear down THIS tab's previous subscription first.
            await this._corkyUnsub(tab)
            if (gen !== st.gen) return
            tab.corkyLoading = true
            tab.corkyError = null
            tab.corkyProgress = null
            // Candles-only by default: indicators are toggled on client-side
            // afterwards (their data already ships in the rows — no resubscribe).
            // Persisted enabled indicators/layers for this symbol (survives a
            // tf-switch). Reflect them optimistically in the panel; the feed
            // re-applies them after the new history loads (_reapplyEnabled).
            const mem = this._corkyMem(opts.venue, opts.symbol)
            tab.corkyCurrent = {
                venue: opts.venue,
                symbol: opts.symbol,
                timeframe: opts.timeframe,
                indicators: mem.kinds.map(k => k.display_label),
                layers: mem.layers.slice(),   // enabled view-layer ids
            }
            tab.title = `${opts.symbol} · ${opts.timeframe}`   // label the tab
            // Assemble the indicator VIEW map (display_label → { kind, view }) from
            // the discovery descriptors for this venue/symbol so buildChartData can
            // prefer view.layers over plotting every output. (The select opts from
            // the panel don't carry descriptors, so read corkyStates here.)
            const state = (this.corkyStates || []).find(
                s => s && s.venue === opts.venue && s.symbol === opts.symbol)
            const views = {}
            for (const ind of ((state && state.indicators) || [])) {
                if (!(ind && ind.view && ind.display_label)) continue
                // The catalog publishes the same indicator once PER TIMEFRAME and
                // duplicate display_labels collapse last-write-wins — without the
                // tf filter, another timeframe's view spec could drive rendering
                // for the one actually subscribed (the panel dedupes the same way).
                if (ind.timeframe != null && ind.timeframe !== opts.timeframe) continue
                views[ind.display_label] = { kind: ind.kind, view: ind.view }
            }
            const enabled = {
                kinds: mem.kinds.slice(),
                layers: mem.layers.slice(),
                hiddenLayers: mem.hiddenLayers.slice(), // explicit [x]-closed layers stay closed
            }
            // NB: do NOT pass target_runtime_id to subscribe. Per the gateway
            // author, subscribe_candles SELF-THREADS the runtime from its snapshot
            // cache (data path) and was never misrouted; forcing target_runtime_id
            // here pushes it onto the CONTROL path, which then needs a live runtime
            // control session — exactly what's missing during a runtime restart,
            // turning a recoverable load into an endless "Reconnecting…" loop.
            // target_runtime_id is threaded only into patch/upsert (below), where
            // the gateway really does fall back to a stale default.
            const isActive = () => tab.id === this.activeChartTabId
            try {
                const handle = await feed.subscribe(
                    { ...opts, views, enabled }, {
                    onStatus: (status) => {
                        if (gen !== st.gen) return   // superseded (per-tab epoch)
                        tab.corkyProgress = status
                        // Reflect load phases on THIS tab's search result row.
                        if (tab.searchNav && tab.searchNav.loading && status &&
                            status.phase !== 'history-complete' && status.phase !== 'live') {
                            tab.searchNav.message = this._navStatusLabel(status)
                        }
                        if (status && (status.phase === 'history-complete' ||
                                       status.phase === 'live')) {
                            tab.corkyLoading = false
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
                            // Chart UI is ACTIVE-tab only — a background tab's data
                            // still loads into its cube via the feed; the view +
                            // overlays are (re)applied when you switch to it.
                            if (isActive()) this.$nextTick(() => {
                                const tv = this.$refs.tradingVue
                                // For a plotted position we ZOOM to its window so the
                                // trades fill the pane AND the offchart bars get a
                                // usable px_step (a 1-candle histogram bar is only
                                // px_step·0.8 wide — at the default latest view that
                                // collapses to ~1px and looks blank). resetChart(true)
                                // re-inits to the latest view and a late setRange
                                // RACES that remount, so the window never sticks.
                                // Instead set the range FIRST, then resetChart(FALSE),
                                // which remounts *preserving* the range via its own
                                // proven double-nextTick restore.
                                const pp = this.positionPlot
                                const plotWindow = pp && pp.window && this.corkyCurrent &&
                                    pp.symbol === this.corkyCurrent.symbol &&
                                    pp.window.start != null && pp.window.end != null
                                // A search-result click zooms to result.chart_window
                                // (one-shot — consumed here so a later reload doesn't
                                // re-zoom). Takes precedence over the latest view.
                                const navRange = this._corkyPendingRange
                                const navWindow = navRange &&
                                    navRange.start != null && navRange.end != null
                                if (tv) {
                                    if (navWindow) {
                                        tv.setRange(navRange.start, navRange.end)
                                        tv.resetChart(false)   // remount, keep the window
                                    } else if (plotWindow) {
                                        tv.setRange(pp.window.start, pp.window.end)
                                        tv.resetChart(false)   // remount, keep the window
                                    } else {
                                        tv.resetChart(true)    // discovery → latest view
                                    }
                                }
                                this._corkyPendingRange = null   // consume once
                                // The gateway load wiped onchart — restore THIS
                                // (active) tab's overlays. Same method runs on
                                // switch-back (activateChartTab) for a tab that
                                // completed in the background.
                                this._restoreActiveTabOverlays()
                            })
                            else {
                                // Background completion: don't leak the one-shot zoom
                                // window to the next active tab, and mark this tab's
                                // saved range stale so switch-back refits cleanly
                                // (the wipe ran, so the old range no longer fits).
                                this._corkyPendingRange = null
                                tab.range = null
                            }
                            // THIS tab's search result loaded — clear its row's
                            // "loading onto chart" feedback (data lands regardless
                            // of which tab is on screen).
                            if (tab.searchNav && tab.searchNav.loading) {
                                tab.searchNav.loading = false
                                tab.searchNav.message = ''
                            }
                        }
                    },
                    onError: (err) => {
                        if (gen !== st.gen) return   // superseded (per-tab epoch)
                        tab.corkyError = this._corkyErr(err)
                        if (tab.searchNav && tab.searchNav.loading) {
                            tab.searchNav.loading = false
                            tab.searchNav.error = true
                            tab.searchNav.message = 'Failed to load on chart'
                        }
                    },
                })
                // A superseded select (feed returns null) or a newer per-tab epoch
                // must NOT touch this tab's live selection state.
                if (gen !== st.gen || !handle) return
                tab.corkyHandle = handle
                // A clean subscribe clears this tab's ride-through retry COMPLETELY —
                // including a still-armed timer (success paths that bypass
                // _corkyCancelSelectRetry, e.g. search/backtest/position plot, would
                // otherwise let a stale timer fire and tear down the good stream).
                clearTimeout(st.retryTimer)
                st.retryTimer = null
                st.retryKeepSpinner = false
                st.retries = 0
                st.retryOpts = null
                // Remember the selection so a reload reopens it.
                tab.corkyLast = {
                    venue: opts.venue, symbol: opts.symbol, timeframe: opts.timeframe,
                }
                this.saveStateToStorage()
            } catch (err) {
                if (gen !== st.gen) return   // stale failure: stay quiet
                const mapped = this._corkyErr(err)
                // Ride through transient runtime restarts (per tab): a retryable
                // control error re-discovers + re-selects THIS tab with backoff.
                if (this._corkyScheduleSelectRetry(opts, mapped, tab)) return
                st.retries = 0
                tab.corkyError = mapped
                tab.corkyCurrent = null
                if (tab.searchNav && tab.searchNav.loading) {
                    tab.searchNav.loading = false
                    tab.searchNav.error = true
                    tab.searchNav.message = 'Failed to load on chart'
                }
            } finally {
                // Keep the spinner up only during this tab's brief FAST retry window.
                if (gen === st.gen && !st.retryKeepSpinner) {
                    tab.corkyLoading = false
                }
            }
        },

        // Retry a retryable select failure. Two phases:
        //  • FAST (first few): keep the spinner with a "Reconnecting…" status —
        //    covers a transient blip.
        //  • SLOW (after): surface a CLEAR, actionable error (no ambiguous endless
        //    spinner) AND keep a 20s background retry running, so a longer outage
        //    (a restarted runtime not yet re-registering its control session)
        //    still SELF-HEALS when it returns. Returns true if a retry was armed.
        _corkyScheduleSelectRetry(opts, mapped, tab) {
            if (!mapped || !mapped.retryable) return false
            tab = tab || this.activeTab
            const st = tab && (tab._stream || (tab._stream = {}))
            if (!st) return false
            st.retryOpts = opts   // for the panel's manual Retry button
            const n = st.retries || 0
            st.retries = n + 1
            const FAST = 3
            const fast = n < FAST
            const delay = fast ? Math.min(400 * Math.pow(2, n), 2400) : 20000
            if (fast) {
                tab.corkyError = null
                tab.corkyProgress = {
                    phase: 'retrying', attempt: n + 1,
                    message: 'Reconnecting to the gateway runtime…',
                }
                st.retryKeepSpinner = true
            } else {
                const rid = this._corkyRuntimeId(opts.venue, opts.symbol) || 'public-market-main'
                tab.corkyProgress = null
                // Surface the gateway's ACTUAL reason — this is almost always a
                // backend issue (the runtime's control session being rejected).
                const reason = (mapped && mapped.message) || 'runtime control session rejected'
                tab.corkyError = {
                    message: `Gateway can't open the stream for runtime "${rid}" — retrying automatically. ` +
                        `This is a gateway/runtime issue: ${reason}`,
                    retryable: true,
                }
                st.retryKeepSpinner = false
            }
            clearTimeout(st.retryTimer)
            st.retryTimer = setTimeout(() => {
                // The tab may have been closed since we armed — no-op then.
                if (Array.isArray(this.chartTabs) && !this.chartTabs.includes(tab)) return
                // The client's bounded backoff gives up after ~16s; past that NOTHING
                // re-opens the socket unless we do it here. connect() resets the budget.
                if (this.corkyClient && this.corkyClient.isDead &&
                    this.corkyClient.isDead()) {
                    this.corkyClient.connect()
                }
                // A restarted runtime may have a NEW runtime_id — re-discover first
                // (QUIET: a background retry must not flash the active tab's chrome),
                // then re-select THIS tab (passed so a switch doesn't misroute).
                Promise.resolve(this.corkyDiscover(opts.venue, true))
                    .then(() => this.corkySelect(opts, tab))
            }, delay)
            return true
        },

        // Panel: select a venue/symbol/timeframe (+ default indicators).
        onCorkySelect(opts) {
            // ⌘/Ctrl/middle-click → open this load in a NEW chart tab (becomes the
            // active tab); a plain click loads into the active tab. At the tab cap
            // createChartTab() returns null — abort rather than clobber the active
            // chart with a load the user asked to open elsewhere. (Create FIRST so
            // the cancel/clear below target the TARGET tab, leaving any old tab's
            // background self-heal retry running.)
            if (opts && opts.newTab && !this.createChartTab()) return
            this._corkyCancelSelectRetry()   // a manual pick supersedes the target tab's pending retry
            this.clearPositionPlot()         // a discovery pick drops any plotted position
            this._clearSearchNav()           // …and the active search-result highlight/marker
            this.corkySelect(opts)
        },

        // Cancel a tab's pending ride-through retry and reset its counter.
        _corkyCancelSelectRetry(tab) {
            tab = tab || this.activeTab
            const st = tab && tab._stream
            if (!st) return
            clearTimeout(st.retryTimer)
            st.retryTimer = null
            st.retryKeepSpinner = false
            st.retries = 0
            // Drop the remembered failed selection too — a later manual Retry must
            // not navigate back to a symbol the user already moved off.
            st.retryOpts = null
        },

        // ── Multi-tab gateway binding (concurrent-live) ───────────────────────
        // Each tab owns its own CorkyFeed (over the SHARED client), bound to its
        // cube — so every tab streams in the background and a tab switch is a pure
        // render swap (no re-subscribe, no history re-fetch, no jump). Created
        // lazily once the client exists; markRaw — the feed manages its own state
        // and needs no Vue reactivity.
        _ensureTabFeed(tab) {
            if (!tab || tab.corkyFeed || !this.corkyClient) return
            tab.corkyFeed = markRaw(new CorkyFeed({
                client: this.corkyClient,
                dataCube: tab.chart,
            }))
        },

        // Ensure the active tab's feed exists and bind the lazy-history loader to
        // the active cube. onrange both sets the cube's loader AND rebinds
        // TradingVue's range hook to that cube (datacube.onrange → tv.set_loader).
        // The feed is pre-bound to its cube at creation, so no feed.dc re-pointing.
        _corkyBindActiveCube() {
            const tab = this.activeTab
            if (!tab) return
            this._ensureTabFeed(tab)
            const cube = tab.chart
            if (cube && typeof cube.onrange === 'function') {
                // Close the loader over THIS tab so a backfill always fetches this
                // tab's symbol/tf via this tab's feed — never the global active
                // tab's (which can differ mid-switch due to the deferred set_loader).
                cube.onrange((range) => this._corkyHistoryLoader(range, tab))
            }
        },

        // Re-add the active tab's on-chart overlays (a gateway load wipes the cube's
        // onchart/offchart). Called on the active tab's history-complete AND on
        // switch-BACK to a tab that completed in the background (its overlay sync was
        // skipped while it was hidden). The sync methods read this.chart (= active
        // cube) + the active-tab overlay shims, so they target the right cube once
        // the tab is active; each self-guards on its per-tab state.
        _restoreActiveTabOverlays() {
            if (this.feedMode !== 'gateway') return
            if (this.priceAlarms && this.priceAlarms.length) this.ensurePriceAlarmOverlay()
            this.syncPositionOverlays()
            this.syncSignalMarker()
            this.syncBarrierOverlay()
            this.syncBacktestOverlays()
            this.syncStrategyOverlays()
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
            // Scope by INSTANCE (display_label): instances of the same kind share
            // layer ids (SCMR / SCMR(INV)), so an unscoped toggle hit both.
            const applied = this.corkyFeed.setLayerEnabled(
                this.corkyHandle, req.layerId, req.enabled, req.display_label || null)
            if (!applied) return
            const cur = this.corkyCurrent
            if (cur) cur.layers = [...this.corkyHandle.enabledLayers]
            // Persist for tf-switch + reload survival: enabled layers AND explicit
            // hides (so a default-visible layer closed via [x] stays closed after
            // a reload — _reapplyEnabled seeds handle.hiddenLayers from this).
            // Hides are stored instance-scoped ('SCMR(INV)#trade_lines'); remove
            // both forms on re-enable so legacy bare entries can't linger.
            const mem = this._corkyMem(req.venue, req.symbol)
            mem.layers = [...this.corkyHandle.enabledLayers]
            const key = req.display_label ? `${req.display_label}#${req.layerId}` : req.layerId
            if (req.enabled) {
                mem.hiddenLayers = mem.hiddenLayers.filter(
                    (h) => h !== key && h !== req.layerId)
            } else if (!mem.hiddenLayers.includes(key)) {
                mem.hiddenLayers.push(key)
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
            // Clear any stranded drag flag: if the previous overlay instance
            // was destroyed MID-DRAG (gateway wipe / cube replacement), its
            // mouseup never fired — the alarm then stayed $dragging forever
            // (updateAlarms skips it: it never rings again) and scroll-lock
            // stayed engaged.
            for (const a of this.priceAlarms) { if (a && a.$dragging) a.$dragging = false }
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

        // ── Position plot (trades + Position Details panes) ────────────────────

        // Derive all chart series from an audit bundle (Phase A transforms).
        // tailTs (the window end — "now" for an open position) extends the size +
        // fees lines to the right edge so single-event / open positions still draw.
        _computePositionSeries(audit, tailTs) {
            return {
                markers: tradeMarkers(audit),
                orders: orderMarkers(audit),
                openClose: openCloseMarkers(audit),
                size: positionSizeSeries(audit, tailTs),
                hist: buySellHistogram(audit),
                fees: cumulativeFees(audit, tailTs),   // { series, currency }
            }
        },

        // Remove our tagged overlays from the cube (identity via settings flag).
        _removePositionOverlays(dc) {
            let changed = false
            for (const side of ['onchart', 'offchart']) {
                const arr = dc.data && dc.data[side]
                if (!Array.isArray(arr)) continue
                for (let i = arr.length - 1; i >= 0; i--) {
                    if (arr[i] && arr[i].settings && arr[i].settings.$positionOverlay) {
                        arr.splice(i, 1); changed = true
                    }
                }
            }
            if (changed && typeof dc.update_ids === 'function') dc.update_ids()
        },

        // Remove the search signal marker (identity via settings flag).
        _removeSignalMarker(dc) {
            const arr = dc.data && dc.data.onchart
            if (!Array.isArray(arr)) return
            let changed = false
            for (let i = arr.length - 1; i >= 0; i--) {
                if (arr[i] && arr[i].settings && arr[i].settings.$signalMarker) {
                    arr.splice(i, 1); changed = true
                }
            }
            if (changed && typeof dc.update_ids === 'function') dc.update_ids()
        },

        // Reconcile the on-chart vertical signal marker to `searchNav`. Called
        // after every history-complete (the candle feed wipes onchart) and when
        // the active result changes/clears. Only drawn for the charted symbol.
        syncSignalMarker() {
            const dc = this.chart
            if (!dc || !dc.data || typeof dc.add !== 'function') return
            this._removeSignalMarker(dc)
            const nav = this.searchNav
            if (!nav || !nav.signal || nav.signal.ts == null || !this.corkyCurrent) return
            const tgt = nav.target || {}
            if (tgt.symbol !== this.corkyCurrent.symbol || tgt.venue !== this.corkyCurrent.venue) return
            const low = nav.signal.low != null && Number.isFinite(Number(nav.signal.low))
                ? Number(nav.signal.low) : null
            dc.add('onchart', {
                name: 'Signal', type: 'SignalMarker', grid: { id: 0 },
                data: [[nav.signal.ts, low, nav.signal.label || null]],
                settings: {
                    $signalMarker: true, $uuid: 'search-signal', 'z-index': 130,
                    legend: false, color: '#f5c518', lineWidth: 1.5,
                },
            })
        },

        _removeBarrierOverlay(dc) {
            const arr = dc.data && dc.data.onchart
            if (!Array.isArray(arr)) return
            let changed = false
            for (let i = arr.length - 1; i >= 0; i--) {
                if (arr[i] && arr[i].settings && arr[i].settings.$barrierPlan) {
                    arr.splice(i, 1); changed = true
                }
            }
            if (changed && typeof dc.update_ids === 'function') dc.update_ids()
        },

        // Reconcile the on-chart Barrier Symmetric target plan to `searchNav`
        // (the plan/outcome already arrived with the match — no separate fetch).
        // Pending plans still draw whatever levels are present; outcome shows
        // "pending" rather than a miss. Only for the charted symbol.
        syncBarrierOverlay() {
            const dc = this.chart
            if (!dc || !dc.data || typeof dc.add !== 'function') return
            this._removeBarrierOverlay(dc)
            const nav = this.searchNav
            if (!nav || !nav.barrier || !nav.signal || nav.signal.ts == null || !this.corkyCurrent) return
            const tgt = nav.target || {}
            if (tgt.symbol !== this.corkyCurrent.symbol || tgt.venue !== this.corkyCurrent.venue) return
            const b = nav.barrier
            const plan = b.plan || {}
            const num = (x) => { const n = Number(x); return (x != null && Number.isFinite(n)) ? n : null }
            const entry = num(plan.entry_price)
            if (entry == null) return
            const outcome = b.pending ? 'pending'
                : (b.outcome ? (b.outcome.bull_hit ? 'bull ✓' : b.outcome.bear_hit ? 'bear ✓' : 'no hit') : null)
            dc.add('onchart', {
                name: 'Target', type: 'BarrierPlan', grid: { id: 0 },
                data: [[nav.signal.ts, entry]],
                settings: {
                    $barrierPlan: true, $uuid: 'search-barrier', 'z-index': 129, legend: false,
                    plan: {
                        entryTs: nav.signal.ts,
                        expiryTs: plan.expiry_timestamp_ms != null ? Number(plan.expiry_timestamp_ms) : null,
                        entry,
                        take_up: num(plan.take_up_price), stop_up: num(plan.stop_up_price),
                        take_dn: num(plan.take_dn_price), stop_dn: num(plan.stop_dn_price),
                        pending: b.pending, outcome,
                    },
                },
            })
        },

        // Reconcile the chart's position overlays to `positionPlot` + its toggles.
        // Called after every history-complete (the candle feed wiped onchart/
        // offchart), on a toggle, and on an audit refresh. Idempotent: it removes
        // our tagged overlays then re-adds the enabled ones with fresh data.
        syncPositionOverlays() {
            const dc = this.chart
            if (!dc || !dc.data || typeof dc.add !== 'function') return
            this._removePositionOverlays(dc)
            const pp = this.positionPlot
            // Only plot when the plotted position matches the charted symbol.
            if (!pp || !pp.series || !this.corkyCurrent ||
                pp.symbol !== this.corkyCurrent.symbol) return
            const s = pp.series
            const t = pp.toggles || {}
            // Price-pane markers can coincide (a single-trade position has its
            // trade, order and open marker at the same instant/price). Draw them
            // CONCENTRIC — largest behind, smallest on top — so each still peeks:
            // orders (square, z135, big) < trades (circle, z140) < open/close
            // (diamond, z146, small, labelled).
            if (t.orders && s.orders && s.orders.length) {
                dc.add('onchart', {
                    name: 'Orders', type: 'Markers', grid: { id: 0 }, data: s.orders,
                    settings: {
                        $positionOverlay: true, $uuid: 'pos-orders', 'z-index': 135,
                        legend: false, color: '#d97706', shape: 'square', markerSize: 10, showLabel: false,
                    },
                })
            }
            if (t.trades && s.markers.length) {
                dc.add('onchart', {
                    name: 'Trades', type: 'Trades', grid: { id: 0 }, data: s.markers,
                    settings: {
                        $positionOverlay: true, $uuid: 'pos-trades', 'z-index': 140,
                        legend: false, buyColor: '#23a776', sellColor: '#e54150',
                        markerSize: 7, showLabel: false,
                    },
                })
            }
            if (t.openClose && s.openClose && s.openClose.length) {
                dc.add('onchart', {
                    name: 'Open / Close', type: 'Markers', grid: { id: 0 }, data: s.openClose,
                    settings: {
                        $positionOverlay: true, $uuid: 'pos-openclose', 'z-index': 146,
                        legend: false, color: '#64b5f6', shape: 'diamond', markerSize: 5, showLabel: true,
                    },
                })
            }
            if (t.size && s.size.length) {
                dc.add('offchart', {
                    name: 'Position Size', type: 'StepLine', data: s.size,
                    settings: {
                        $positionOverlay: true, $uuid: 'pos-size', legend: true,
                        color: '#64b5f6', lineWidth: 1.5,
                    },
                })
            }
            if (t.hist && s.hist.length) {
                dc.add('offchart', {
                    name: 'Buy / Sell', type: 'Histogram', data: s.hist,
                    settings: {
                        $positionOverlay: true, $uuid: 'pos-hist', legend: true,
                        colorUp: '#23a776', colorDown: '#e54150', zeroLine: true,
                        // Trades are sparse instants; floor the bar width so a single
                        // trade stays visible even in a wide (open-position) window.
                        minBarWidth: 6,
                    },
                })
            }
            if (t.fees && s.fees && s.fees.series.length) {
                dc.add('offchart', {
                    name: s.fees.currency ? `Fees (${s.fees.currency})` : 'Fees', type: 'Spline',
                    data: s.fees.series,
                    settings: {
                        $positionOverlay: true, $uuid: 'pos-fees', legend: true,
                        color: '#d97706', lineWidth: 1.5,
                    },
                })
            }
        },

        // Toggle one Position Details series on/off and re-sync.
        togglePositionDetail(key) {
            if (!this.positionPlot) return
            const t = this.positionPlot.toggles
            t[key] = !t[key]
            this.syncPositionOverlays()
            const dc = this.chart
            if (dc && typeof dc.touchData === 'function') dc.touchData()
            this.$nextTick(() => {
                if (this.$refs.tradingVue) this.$refs.tradingVue.refreshOffchartOverlays()
            })
        },

        // Drop the plotted position entirely (e.g. a discovery-panel ticker switch).
        clearPositionPlot() {
            this._stopPositionAuditStream()
            this.positionPlot = null
            const dc = this.chart
            if (dc && dc.data) {
                this._removePositionOverlays(dc)
                if (typeof dc.touchData === 'function') dc.touchData()
            }
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
                // Scope to THIS overlay's instance so a shared layer id doesn't
                // close the sibling instance's pane too.
                this.onCorkyToggleLayer({
                    venue, symbol, timeframe,
                    layerId: s.corkyLayerId, enabled: false,
                    display_label: s.corkyInstance || null,
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

        // True when discovery already maintains a candle state for this
        // venue/symbol that exposes the timeframe (case-insensitive).
        _candleStateHas(venue, symbol, timeframe) {
            const st = (this.corkyStates || []).find(
                s => s && s.venue === venue && s.symbol === symbol)
            if (!st) return false
            const want = String(timeframe).toLowerCase()
            return (st.available_timeframes || []).some(tf => String(tf).toLowerCase() === want)
        },

        // Ensure a candle state exists for venue/symbol/timeframe before
        // subscribing. If missing, upsert_candle_state (a control command — thread
        // the discovered runtime_id) then poll discovery until it registers
        // (bounded). Returns true once available, false on timeout. Mirrors
        // scripts/corky-gateway-smoke.mjs bootstrapState.
        async _ensureCandleState(venue, symbol, timeframe) {
            if (this._candleStateHas(venue, symbol, timeframe)) return true
            if (!this.corkyClient) return false
            try {
                await this.corkyClient.upsertCandleState({
                    venue, symbol, timeframes: [timeframe],
                    target_runtime_id: this._corkyRuntimeId(venue, symbol),
                })
            } catch (_) { /* may still register via discovery; fall through to poll */ }
            const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
            for (let i = 0; i < 8; i++) {
                try { await this.corkyDiscover(venue) } catch (_) { /* keep polling */ }
                if (this._candleStateHas(venue, symbol, timeframe)) return true
                await sleep(1000)
            }
            return false
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

        // Panel: retry after an error. Re-discover AND re-select the pending /
        // last selection (a bare re-discover left the chart blank after a runtime
        // outage). Resets the ride-through counter so the fast phase runs again.
        onCorkyRetry() {
            // The active tab's remembered failed selection (per-tab retry state).
            const tab = this.activeTab
            const opts = (tab && tab._stream && tab._stream.retryOpts) || this.corkyLast
            this._corkyCancelSelectRetry(tab)
            // Revive a dead client first (backoff exhaustion never reconnects
            // by itself — without this, Retry was a no-op after a >16s outage).
            if (this.corkyClient && this.corkyClient.isDead &&
                this.corkyClient.isDead()) {
                this.corkyClient.connect()
            }
            if (opts && opts.venue && opts.symbol && opts.timeframe) {
                Promise.resolve(this.corkyDiscover(opts.venue)).then(() => this.corkySelect(opts, tab))
            } else {
                this.corkyDiscover()
            }
        },

        // Drop the active subscription (if any) without closing the client.
        async _corkyUnsub(tab) {
            tab = tab || this.activeTab
            if (!tab) return
            const h = tab.corkyHandle
            tab.corkyHandle = null
            if (h != null && tab.corkyFeed) {
                await Promise.resolve(tab.corkyFeed.unsubscribe(h)).catch(() => {})
            }
        },

        // Full gateway teardown: unsubscribe + destroy the feed (which closes
        // the client). Leaves the DataCube intact for the File feed to reuse.
        // ── Auth positions (bottom dock) ──────────────────────────────────────

        // One-shot refresh of the open-positions snapshot + account list. Also
        // (re)syncs the live stream so an expanded Open tab goes live.
        async refreshPositions() {
            if (!this.positionsFeed) return
            this.positionsLoading = true
            this.positionsError = null
            try {
                const out = await this.positionsFeed.listOpen({ include_historical: false })
                this._applyOpenPositions(out)
                this._positionsSyncStreams()
                this._strategySyncStreams()
            } catch (err) {
                this.positionsError = this._positionsErrText(err)
            } finally {
                this.positionsLoading = false
            }
            // Eagerly load the first history page (once) so the Historical tab's
            // count shows on startup without opening the tab. Needs an account
            // (derived above from the open snapshot); guarded against re-loading.
            // Silent: a history error here must not banner the visible Open tab —
            // clicking Historical later does a normal load that surfaces errors.
            if (this.positionsActiveAccount) this._ensureHistoryLoaded({ silent: true })
        },

        _applyOpenPositions(out) {
            this.openPositions = (out && out.current) || []
            this._positionsDeriveAccounts((out && out.positions) || [])
        },

        // Build the account picker from whatever accounts the rows reference; keep
        // the active account if it still appears, else default to the first.
        _positionsDeriveAccounts(rows) {
            const seen = new Map()
            for (const p of rows) {
                if (!p || !p.account_id) continue
                const key = `${String(p.venue).toLowerCase()}|${p.account_id}`
                if (!seen.has(key)) seen.set(key, { venue: p.venue, account_id: p.account_id })
            }
            this.positionsAccounts = Array.from(seen.values())
            if (this.positionsActiveAccount) {
                const k = `${String(this.positionsActiveAccount.venue).toLowerCase()}|${this.positionsActiveAccount.account_id}`
                if (seen.has(k)) return
            }
            this.positionsActiveAccount = this.positionsAccounts[0] || null
        },

        _positionsErrText(err) {
            if (!err) return 'Positions unavailable'
            return err.message || err.code || String(err)
        },

        // Start/stop the open-positions stream so it runs ONLY while the Open tab
        // is visible (dock open). Falls back to polling if streaming is refused.
        _positionsSyncStreams() {
            const wantOpen = this.feedMode === 'gateway' && this.positionsDockOpen &&
                this.positionsActiveTab === 'open' && !!this.positionsFeed
            if (wantOpen) this._positionsStartOpenStream()
            else this._positionsStopOpenStream()
        },

        // Subscribe the live runtime stream ONLY while the Strategy tab is the
        // visible dock tab; stop otherwise (mirrors _positionsSyncStreams so the
        // subscription doesn't keep streaming when the dock is collapsed / another
        // tab is active). The one-time data load lives in strategyOpen, so
        // re-entering the tab re-subscribes without re-fetching.
        _strategySyncStreams() {
            const want = this.feedMode === 'gateway' && this.positionsDockOpen &&
                this.positionsActiveTab === 'strategy' && !!this.strategyFeed
            if (want) this._strategySubscribe()
            else this._strategyStopSubscribe()
        },

        _positionsStartOpenStream() {
            if (!this.positionsFeed || this._openSubHandle) return
            if (!this.positionsFeed.streamingSupported) { this._positionsStartPoll(); return }
            this._openSubHandle = this.positionsFeed.subscribeOpen(
                { subscription_id: 'corky-positions-open', include_historical: false }, {
                    onData: (out) => { this._applyOpenPositions(out); this.positionsError = null },
                    onError: (err) => {
                        if (err && err.code === 'stateful_websocket_required') {
                            // streaming unsupported on this socket → poll the snapshot
                            this._openSubHandle = null
                            this._positionsStartPoll()
                        } else {
                            this.positionsError = this._positionsErrText(err)
                        }
                    },
                })
        },

        _positionsStopOpenStream() {
            if (this._openSubHandle && this.positionsFeed) {
                try { this.positionsFeed.unsubscribe(this._openSubHandle) } catch (_) { /* gone */ }
            }
            this._openSubHandle = null
            if (this._positionsPoll) { clearInterval(this._positionsPoll); this._positionsPoll = null }
        },

        _positionsStartPoll() {
            if (this._positionsPoll) return
            this._positionsPoll = setInterval(() => {
                if (!this.positionsFeed) return
                this.positionsFeed.listOpen({ include_historical: false })
                    .then((out) => { this._applyOpenPositions(out); this.positionsError = null })
                    .catch(() => { /* keep last good */ })
            }, 5000)
        },

        togglePositionsDock(open) {
            this.positionsDockOpen = open
            // Collapsing clears maximize so re-expanding restores the normal
            // resizable body (mirrors the resize-handle guard below).
            if (!open) this.positionsDockMaximized = false
            if (open && this.positionsActiveTab === 'historical') this._ensureHistoryLoaded()
            this._positionsSyncStreams()
            this._strategySyncStreams()
            this.saveStateToStorage()
        },

        // Maximize the dock to full page height (chart → 0) or restore it to its
        // resizable height. Maximizing a collapsed dock opens it first.
        toggleDockMaximize(max) {
            this.positionsDockMaximized = max
            if (max && !this.positionsDockOpen) this.positionsDockOpen = true
            if (this.positionsDockOpen && this.positionsActiveTab === 'historical') this._ensureHistoryLoaded()
            // Maximize can open a collapsed dock — (re)start its streams, exactly
            // as togglePositionsDock does. Idempotent/guarded → no-op on restore.
            this._positionsSyncStreams()
            this._strategySyncStreams()
            this.saveStateToStorage()
        },

        setPositionsTab(tab) {
            this.positionsActiveTab = tab
            if (tab === 'historical') this._ensureHistoryLoaded()
            // Open the Backtests tab → load ALL runs once (no strategy filter),
            // so the user sees the run list without clicking "Load runs".
            if (tab === 'backtests' && !this.backtests.runs.length && !this.backtests.loading) {
                this.btListRuns()
            }
            // Open the Strategy tab → load the runtime set (+ selected detail) and
            // start the live full-replacement subscription, once.
            if (tab === 'strategy' && !this.strategy.runtimes.length && !this.strategy.loading) {
                this.strategyOpen()
            }
            this._positionsSyncStreams()
            this._strategySyncStreams()
            this.saveStateToStorage()
        },

        // ── Historical indicator search ─────────────────────────────────────────

        // Collapse a state's per-timeframe indicator descriptors into
        // [{ label, fields }] (display_label + union of output names). Used by
        // searchContext to offer the right indicators/fields per symbol.
        _indicatorOptions(state) {
            if (!state || !Array.isArray(state.indicators)) return []
            const byLabel = new Map()
            for (const ind of state.indicators) {
                if (!ind || !ind.display_label) continue
                let set = byLabel.get(ind.display_label)
                if (!set) { set = new Set(); byLabel.set(ind.display_label, set) }
                for (const o of (ind.outputs || [])) set.add(o)
            }
            return Array.from(byLabel.entries())
                .map(([label, set]) => ({ label, fields: Array.from(set).sort() }))
        },

        // Run a search from the SearchSignalsForm payload. Resolves the searched
        // symbol's state (case-insensitive venue — the gateway reports it
        // lowercase), derives indicators[] from THAT symbol's descriptors, spawns
        // a "Search Results N" tab, and streams matches into it. Build errors
        // (e.g. a symbol with no descriptors) surface as a failed tab, not a throw.
        onRunSearch(form) {
            if (!this.searchFeed) return
            // First symbol of the set drives descriptor + venue resolution.
            const firstSymbol = String(form.symbol || '').split(',')[0].trim()
            const states = this.corkyStates || []
            const vlc = String(form.venue || '').toLowerCase()
            const slc = firstSymbol.toLowerCase()
            const state = states.find(
                s => s && String(s.venue).toLowerCase() === vlc && String(s.symbol).toLowerCase() === slc)
            const descriptors = (state && state.indicators) || []
            // Send the venue exactly as the gateway canonicalises it (its state),
            // so we never depend on the user's free-text casing.
            const venue = state ? state.venue : form.venue

            this.searchTabSeq += 1
            const n = this.searchTabSeq
            const search_id = this.searchFeed.nextSearchId('corky-search')
            // Push the tab first, then grab the REACTIVE proxy Vue stored in the
            // array — mutating the raw object would bypass reactivity.
            this.searchTabs.push({
                id: `search-${n}`, n, search_id, title: `Search Results ${n}`,
                status: 'pending', running: true, progress: null,
                matches: [], error: null, summary: null, query: null,
            })
            const tab = this.searchTabs[this.searchTabs.length - 1]
            // Surface this tab immediately (open the dock if needed).
            if (!this.positionsDockOpen) this.togglePositionsDock(true)
            this.setPositionsTab(tab.id)

            let built
            try {
                if (!descriptors.length) {
                    throw new Error(
                        `No indicator descriptors for ${firstSymbol || 'this symbol'} — ` +
                        'chart it (or a symbol that has indicators) first.')
                }
                const condition = buildCondition(form.conditionRows)
                if (!condition) throw new Error('Add at least one complete condition.')
                // Optional Barrier Symmetric target enrichment (causal-only search;
                // target plans/outcomes ride along on matched rows). tf defaults to
                // the first search timeframe when the form left it blank.
                const target_specs = form.target
                    ? [barrierTargetSpec({ ...form.target, timeframe: form.target.timeframe || form.timeframes[0] })]
                    : undefined
                built = buildSearchQuery({
                    search_id, venue, symbols: form.symbol, range: form.range,
                    timeframes: form.timeframes, condition, descriptors,
                    result_window: form.result_window, max_results: form.max_results,
                    target_specs,
                })
            } catch (err) {
                tab.status = 'failed'
                tab.running = false
                tab.error = { message: (err && err.message) || String(err) }
                return
            }
            tab.query = built.query

            this.searchFeed.startSearch(built.query, {
                onAccepted: () => { tab.status = 'running'; tab.running = true },
                onProgress: (p) => { tab.progress = p },
                onMatch: (row) => { tab.matches.push(row) },
                onComplete: (s) => { tab.status = 'complete'; tab.running = false; tab.summary = s },
                onCancelled: () => { tab.status = 'cancelled'; tab.running = false },
                onFailed: (e) => { tab.status = 'failed'; tab.running = false; tab.error = e },
            })
        },

        // Stop a running search (the × in the body / a deliberate halt) — keeps
        // the tab and its partial matches; the terminal search_cancelled finalises.
        onCancelSearch(tabId) {
            const tab = this.searchTabs.find(t => t.id === tabId)
            if (tab && this.searchFeed) this.searchFeed.cancel(tab.search_id)
        },

        // Close a Search Results tab: cancels it if still running (per the spec),
        // forgets it in the feed, and moves focus to a sensible neighbour.
        onCloseSearchTab(tabId) {
            const idx = this.searchTabs.findIndex(t => t.id === tabId)
            if (idx === -1) return
            const tab = this.searchTabs[idx]
            if (this.searchFeed) this.searchFeed.forget(tab.search_id)  // cancels if running
            // If the active result lived in this tab, drop its highlight + marker.
            if (this.searchNav && this.searchNav.tabId === tabId) this._clearSearchNav()
            this.searchTabs.splice(idx, 1)
            if (this.positionsActiveTab === tabId) {
                const next = this.searchTabs[idx] || this.searchTabs[idx - 1]
                this.setPositionsTab(next ? next.id : 'search')
            }
        },

        // Click a match → navigate the chart to result.chart_window. Marks the
        // row active + "loading onto chart" immediately (synchronous feedback),
        // ensures the symbol's candle state exists (a search may hit a symbol that
        // isn't currently charted — this can take a few seconds), then selects
        // with a start_end range so the matched bar lands in view (one-shot zoom
        // via _corkyPendingRange). corkySelect's onStatus/onError/history-complete
        // drive the row's progress + the on-chart vertical signal marker.
        async onSearchResultSelect({ tabId, row, index, newTab } = {}) {
            if (!row) return
            const cw = row.chart_window || null
            const venue = row.venue
            const symbol = row.ticker
            const timeframe = (cw && cw.timeframe) || row.timeframe
            if (!venue || !symbol || !timeframe) return
            // ⌘/Ctrl/middle-click → open this result in a NEW chart tab (abort at
            // the cap rather than clobber the active chart).
            if (newTab && !this.createChartTab()) return

            // Active + loading state on THIS row, set before any await so the user
            // sees instant feedback. Carries the signal info for the chart marker.
            this.searchNav = {
                tabId, index, loading: true, error: false, message: 'Preparing…',
                target: { venue, symbol, timeframe },
                signal: { ts: row.timestamp_ms, low: row.low, label: row.signal, side: row.side },
                // Barrier Symmetric plan/outcome already arrived with the match —
                // overlaid on the chart after load (no separate fetch).
                barrier: row.barrier || null,
            }

            let range
            if (cw && cw.start_ms != null && cw.end_ms != null) {
                range = { type: 'start_end', start_ms: cw.start_ms, end_ms: cw.end_ms }
                this._corkyPendingRange = { start: cw.start_ms, end: cw.end_ms }
            }

            // Provision the candle state if needed (no-op when already charted).
            this._setNavMessage(tabId, index, 'Provisioning symbol…')
            let ok = true
            try { ok = await this._ensureCandleState(venue, symbol, timeframe) } catch (_) { ok = false }
            // A newer result click during the await supersedes this one.
            if (!this._isActiveNav(tabId, index)) return
            if (!ok) {
                this.searchNav.loading = false
                this.searchNav.error = true
                this.searchNav.message = 'Symbol unavailable to chart'
                return
            }
            this._setNavMessage(tabId, index, 'Loading onto chart…')
            this.corkySelect({ venue, symbol, timeframe, range })
        },

        // Is (tabId,index) the row the active search nav points at?
        _isActiveNav(tabId, index) {
            const n = this.searchNav
            return !!n && n.tabId === tabId && n.index === index
        },
        _setNavMessage(tabId, index, message) {
            if (this._isActiveNav(tabId, index) && this.searchNav.loading) {
                this.searchNav.message = message
            }
        },
        // Human-readable progress for a corkyFeed status while loading a result.
        _navStatusLabel(status) {
            if (!status) return 'Loading onto chart…'
            switch (status.phase) {
                case 'accepted': return 'Connecting…'
                case 'history':
                    return status.chunk_index != null
                        ? `Loading history… (chunk ${status.chunk_index + 1})`
                        : 'Loading history…'
                default: return status.message || 'Loading onto chart…'
            }
        },
        // Drop the active-result highlight + the on-chart signal marker (called
        // when navigation leaves the search-result context).
        _clearSearchNav() {
            if (!this.searchNav) return
            this.searchNav = null
            const dc = this.chart
            if (dc && dc.data) {
                this._removeSignalMarker(dc)
                this._removeBarrierOverlay(dc)
                if (typeof dc.touchData === 'function') dc.touchData()
            }
        },

        // ── Strategies / Backtests ──────────────────────────────────────────────

        _btErr(err) { return err ? (err.message || err.code || String(err)) : null },
        _btSetDetail(patch) { this.backtests.detail = { ...this.backtests.detail, ...patch } },

        async btLoadStrategies() {
            if (!this.backtestsFeed) return
            this.backtests.loading = true; this.backtests.error = null
            try {
                this.backtests.strategies = await this.backtestsFeed.listStrategies() || []
            } catch (err) { this.backtests.error = this._btErr(err) }
            finally { this.backtests.loading = false }
        },

        btUpdateFilter(patch) {
            this.backtests.filters = { ...this.backtests.filters, ...patch }
        },

        async btInspectStrategy(name) {
            if (!this.backtestsFeed || !name) return
            try {
                const s = await this.backtestsFeed.getStrategy(name)
                // Merge the fuller descriptor into the catalog list (so the panel's
                // inspect view shows params/indicators even if the list was terse).
                const i = this.backtests.strategies.findIndex((x) => x && x.name === name)
                if (i >= 0) this.backtests.strategies.splice(i, 1, s)
                else this.backtests.strategies.push(s)
            } catch (err) { this.backtests.error = this._btErr(err) }
        },

        async btListRuns() {
            if (!this.backtestsFeed) return
            const f = this.backtests.filters || {}
            const filters = {}
            if (f.strategy) filters.strategy = f.strategy
            if (f.symbol) filters.symbol = String(f.symbol).trim()
            if (f.status) filters.status = f.status
            this.backtests.loading = true; this.backtests.error = null
            try {
                this.backtests.runs = await this.backtestsFeed.listRuns(filters) || []
            } catch (err) { this.backtests.error = this._btErr(err) }
            finally { this.backtests.loading = false }
        },

        async btSelectRun(run) {
            if (!run) return
            // Recency-grade the click: remember the last-5 opened run ids (most
            // recent first) so the list can tint the rows brighter→older.
            this.backtests.clickHistory = pushRecent(this.backtests.clickHistory, run.run_id)
            this.backtests.selectedRun = run
            this.positionsActiveTab = 'bt-detail'   // open this run's details in its tab
            this._btStopProgress()
            // Detected artifact shape drives the candidate selector + universe view.
            // candidateCount: run_id trailing :N first, refined by progress below.
            const shape = detectRunShape(run)
            this._btSetDetail({
                progress: [], live: false, report: null, plottedRunId: this.backtests.detail.plottedRunId,
                shape, candidateCount: shape.candidateCount || null, runIndex: null,
            })
            // One-shot progress, then go live while a run is still executing.
            try {
                const events = await this.backtestsFeed.getProgress(run.run_id)
                if (this.backtests.selectedRun !== run) return
                // A sweep's total_steps == its candidate count (one step per run).
                const steps = (events || []).reduce((m, e) => Math.max(m, Number(e.total_steps) || 0), 0)
                const patch = { progress: events }
                if (steps > 1) patch.candidateCount = Math.max(shape.candidateCount || 0, steps)
                this._btSetDetail(patch)
            } catch (err) { this.backtests.error = this._btErr(err) }
            if (run.status === 'running' || run.status === 'queued') this._btSubscribeProgress(run)
            // Multi-candidate studies (sweep/optimize/universe/walk-forward): fetch
            // the COMPACT artifact for the candidate rankings + optimization
            // metadata. compact:true is bounded (heavy report arrays → *_count), so
            // it's safe even for long sweeps that a full read can't serialize.
            if (shape.multiCandidate) this._btLoadArtifact(run)
            // Chartable runs also get the downsampled full-run OVERVIEW (powers the
            // metrics table / period returns / trades). Universe studies carry no
            // equity timeline, so there is nothing to overview/plot.
            if (shape.chartable) this._btLoadOverview(run)
        },

        // App-level column metric filters (replace wholesale; the bar emits the
        // full new array). Kept here so they PERSIST across detail/new-tab views.
        btSetMetricFilters(filters) {
            this.backtests.metricFilters = Array.isArray(filters) ? filters : []
        },

        // Race a promise against a timeout so a hung/oversized gateway response
        // (e.g. a giant artifact) surfaces as a clean error instead of spinning.
        _withTimeout(promise, ms) {
            let t
            const timeout = new Promise((_, reject) => { t = setTimeout(() => reject(new Error('timed out')), ms) })
            return Promise.race([promise, timeout]).finally(() => clearTimeout(t))
        },

        // Lazily fetch a run's RAW artifact (get_backtest_run) for the universe
        // study view. Refines the detected shape with the authoritative artifact.
        async _btLoadArtifact(run) {
            if (!this.backtestsFeed) return
            this._btSetDetail({ artifact: null, artifactError: null, artifactLoading: true })
            try {
                // compact:true → plan/scenario/optimization/rankings/parameters/
                // metrics, with heavy report arrays replaced by *_count fields, so
                // this never trips the gateway's backtest_artifact_too_large guard.
                const res = await this._withTimeout(this.backtestsFeed.getRun(run.run_id, { compact: true }), 20000)
                if (this.backtests.selectedRun !== run) return
                const artifact = (res && res.artifact) || res || null
                const shape = detectRunShape(run, artifact)   // authoritative refine
                this._btSetDetail({
                    artifact, artifactLoading: false, shape,
                    candidateCount: shape.candidateCount || this.backtests.detail.candidateCount,
                })
            } catch (err) {
                if (this.backtests.selectedRun !== run) return
                this._btSetDetail({ artifactLoading: false, artifactError: this._btErr(err) })
            }
        },

        // Active sweep/optimization candidate (run_index); undefined ⇒ the gateway
        // default (top-ranked). The client omits run_index when undefined.
        _btRunIndex() {
            const ri = this.backtests.detail && this.backtests.detail.runIndex
            return (ri != null && ri !== '') ? Number(ri) : undefined
        },

        // Switch the plotted/inspected sweep candidate. Refreshes the overview
        // (per-candidate equity/trades/period returns) and re-plots if this run is
        // currently on the chart.
        async btSelectCandidate(runIndex) {
            const run = this.backtests.selectedRun
            if (!run) return
            const ri = (runIndex == null || runIndex === '') ? null : Number(runIndex)
            this._btSetDetail({ runIndex: ri })
            this._btLoadOverview(run)
            if (this._btPlot && this._btPlot.runId === run.run_id) await this.btPlotRun(run)
        },

        async _btLoadOverview(run) {
            if (!this.backtestsFeed) return
            this._btSetDetail({ overviewLoading: true })
            try {
                const report = await this.backtestsFeed.getReportOverlays({ run_id: run.run_id, max_points: 1000, run_index: this._btRunIndex() })
                if (this.backtests.selectedRun !== run) return
                this._btSetDetail({ report, overviewLoading: false })
            } catch (err) {
                this.backtests.error = this._btErr(err)
                this._btSetDetail({ overviewLoading: false })
            }
        },

        // Close the Run-Details tab: stop the live progress stream, drop the
        // selection (hides the tab) and fall back to the runs list. Chart overlays
        // are left as-is; the user can re-plot from another run.
        btCloseDetail() {
            this._btStopProgress()
            this.backtests.selectedRun = null
            if (this.positionsActiveTab === 'bt-detail') this.positionsActiveTab = 'backtests'
        },

        _btSubscribeProgress(run) {
            if (!this.backtestsFeed || !this.backtestsFeed.streamingSupported) return
            this._btProgressSub = this.backtestsFeed.subscribeProgress(
                { subscription_id: 'backtest-progress', run_id: run.run_id }, {
                    onData: (events) => {
                        if (this.backtests.selectedRun && this.backtests.selectedRun.run_id === run.run_id) {
                            this._btSetDetail({ progress: events, live: true })
                        }
                    },
                    onError: () => { /* keep last-good progress */ },
                })
        },

        _btStopProgress() {
            if (this._btProgressSub && this.backtestsFeed) {
                try { this.backtestsFeed.unsubscribe(this._btProgressSub) } catch (_) { /* gone */ }
            }
            this._btProgressSub = null
        },

        // Resolve the discovered (canonical-cased) venue. Backtest run venues are
        // UPPERCASE ('BITFINEX') but discovery + the enabled-indicator memory use
        // the gateway's lowercase form — using the wrong case silently drops the
        // user's enabled indicators on navigation.
        _canonicalVenue(venue, symbol) {
            const states = this.corkyStates || []
            const lc = String(venue || '').toLowerCase()
            const st = states.find((s) => s && String(s.venue).toLowerCase() === lc && s.symbol === symbol)
                || states.find((s) => s && String(s.venue).toLowerCase() === lc)
            return st ? st.venue : venue
        },

        _loadedCandleRange() {
            const d = this.chart && this.chart.data && this.chart.data.chart && this.chart.data.chart.data
            if (!Array.isArray(d) || !d.length) return null
            return [d[0][0], d[d.length - 1][0]]
        },

        // Plot a run: fetch its report overlays, navigate to the run's symbol/tf
        // over an end-anchored window (capped), and draw the descriptor-driven
        // equity/drawdown panes + trade markers after load. Keeps the user's
        // enabled indicators (canonical venue) so they show alongside the backtest.
        async btPlotRun(run) {
            if (!run || !this.backtestsFeed) return
            const symbol = (run.symbols || [])[0]
            const timeframe = run.trade_timeframe
            const venue = this._canonicalVenue(run.venue, symbol)
            if (!venue || !symbol || !timeframe) return
            // End-anchored window from the run summary (no need to pull the full
            // report just to learn the span): the run's tail, capped so a multi-year
            // run doesn't request ~100k candles (which stalls / partially loads).
            const win = this._btPlotWindow(run, timeframe)
            this._btSetDetail({ plotting: true })
            // WINDOWED report: equity capped to max_points + only this window's
            // trades/levels — a multi-year run no longer ships its whole curve.
            const runIndex = this._btRunIndex()
            let report
            try {
                report = await this.backtestsFeed.getReportOverlays(
                    { run_id: run.run_id, start_ms: win.start, end_ms: win.end, max_points: 2000, run_index: runIndex })
            } catch (err) {
                this.backtests.error = this._btErr(err)
                this._btSetDetail({ plotting: false })
                return
            }
            if (this.backtests.selectedRun !== run) return   // superseded
            this._btPlot = { runId: run.run_id, venue, symbol, timeframe, report, window: win, runIndex }
            this._corkyPendingRange = { start: win.start, end: win.end }
            try { await this._ensureCandleState(venue, symbol, timeframe) } catch (_) { /* best effort */ }
            // No indicators:[] override → corkySelect re-applies the symbol's enabled
            // indicators from per-(venue,symbol) memory (now keyed on the canonical venue).
            this.corkySelect({ venue, symbol, timeframe, range: { type: 'start_end', start_ms: win.start, end_ms: win.end }, chunk_rows: 500 })
        },

        // End-anchored ≤1000-bar window for a run, from its summary timestamps.
        _btPlotWindow(run, timeframe) {
            const tfMs = this._tfToMs(timeframe)
            const MAX_BARS = 1000
            const end = (run.completed_at_ms && run.completed_at_ms > 0) ? run.completed_at_ms : Date.now()
            let start = (run.started_at_ms && run.started_at_ms > 0) ? run.started_at_ms : end - MAX_BARS * tfMs
            if ((end - start) / tfMs > MAX_BARS) start = end - MAX_BARS * tfMs
            return { start, end }
        },

        // Click a trade → jump to it. INSTANT when the trade is already within the
        // loaded candle range (just re-range, no reload); otherwise load a ±200-bar
        // window around it.
        async btSelectTrade(trade) {
            if (!trade || trade.timestamp_ms == null) return
            const plot = this._btPlot
            const run = this.backtests.selectedRun
            const symbol = trade.symbol || (plot && plot.symbol) || (run && (run.symbols || [])[0])
            const timeframe = (plot && plot.timeframe) || (run && run.trade_timeframe)
            const venue = (plot && plot.venue) || this._canonicalVenue(run && run.venue, symbol)
            if (!venue || !symbol || !timeframe) return
            const tfMs = this._tfToMs(timeframe)
            const tv = this.$refs.tradingVue
            const cur = this.corkyCurrent
            const loaded = this._loadedCandleRange()
            const onThisChart = cur && cur.symbol === symbol && cur.timeframe === timeframe
            if (onThisChart && tv && loaded &&
                trade.timestamp_ms >= loaded[0] && trade.timestamp_ms <= loaded[1]) {
                // Instant: centre the existing view on the trade (no candle reload).
                tv.setRange(trade.timestamp_ms - 60 * tfMs, trade.timestamp_ms + 60 * tfMs)
                return
            }
            // Out of the loaded window → load a context window around the trade.
            // Prefer the gateway's chart_window for this trade (it respects
            // before_bars/after_bars and per-trade gaps); fall back to a client
            // ±BEFORE/AFTER-bar window. Then re-fetch the WINDOWED report so the
            // equity/markers match.
            const BEFORE = 200; const AFTER = 200
            const runIndex = (this._btPlot && this._btPlot.runIndex != null) ? this._btPlot.runIndex : this._btRunIndex()
            let win = await this._btTradeChartWindow(run, trade, timeframe, runIndex, BEFORE, AFTER)
            if (!win) win = { start: trade.timestamp_ms - BEFORE * tfMs, end: trade.timestamp_ms + AFTER * tfMs }
            const start = win.start; const end = win.end
            if (run) {
                this._btSetDetail({ plotting: true })
                try {
                    const report = await this.backtestsFeed.getReportOverlays(
                        { run_id: run.run_id, start_ms: start, end_ms: end, max_points: 2000, run_index: runIndex })
                    this._btPlot = { ...(this._btPlot || {}), runId: run.run_id, venue, symbol, timeframe, report, window: { start, end }, runIndex }
                } catch (_) { /* keep prior overlays */ }
            }
            this._corkyPendingRange = { start, end }
            try { await this._ensureCandleState(venue, symbol, timeframe) } catch (_) { /* best effort */ }
            this.corkySelect({ venue, symbol, timeframe, range: { type: 'start_end', start_ms: start, end_ms: end }, chunk_rows: 500 })
        },

        // The gateway's per-trade candle window via get_backtest_chart_overlays
        // (respects before_bars/after_bars). Returns { start, end } for the
        // overlay matching this trade's timestamp, or null on miss/error so the
        // caller can fall back to a client-computed window.
        async _btTradeChartWindow(run, trade, timeframe, runIndex, beforeBars, afterBars) {
            if (!run || !this.backtestsFeed || trade.timestamp_ms == null) return null
            const tfMs = this._tfToMs(timeframe)
            try {
                const ev = await this.backtestsFeed.getChartOverlays({
                    run_id: run.run_id, run_index: runIndex, timeframe,
                    before_bars: beforeBars, after_bars: afterBars,
                    // Narrow the gateway's work to this trade's neighbourhood.
                    start_ms: trade.timestamp_ms - beforeBars * tfMs,
                    end_ms: trade.timestamp_ms + afterBars * tfMs,
                })
                const overlays = (ev && ev.overlays) || []
                const match = overlays.find((o) => o && o.trade && o.trade.timestamp_ms === trade.timestamp_ms)
                    || overlays[0]
                const cw = match && match.chart_window
                if (cw && cw.start_ms != null && cw.end_ms != null) {
                    return { start: Number(cw.start_ms), end: Number(cw.end_ms) }
                }
            } catch (_) { /* fall back to the client window */ }
            return null
        },

        _tfToMs(tf) {
            const m = String(tf).match(/^(\d+)\s*([mhdwM])$/)
            if (!m) return 3600000
            const n = Number(m[1])
            const u = { m: 60000, h: 3600000, d: 86400000, w: 604800000, M: 2592000000 }[m[2]] || 3600000
            return n * u
        },

        _removeBacktestOverlays(dc) {
            for (const side of ['onchart', 'offchart']) {
                const arr = dc.data && dc.data[side]
                if (!Array.isArray(arr)) continue
                for (let i = arr.length - 1; i >= 0; i--) {
                    if (arr[i] && arr[i].settings && arr[i].settings.$backtestOverlay) arr.splice(i, 1)
                }
            }
            if (typeof dc.update_ids === 'function') dc.update_ids()
        },

        // Reconcile the backtest equity/drawdown panes + trade markers to `_btPlot`.
        // Called after every history-complete (the candle load wipes overlays).
        syncBacktestOverlays() {
            const dc = this.chart
            if (!dc || !dc.data || typeof dc.add !== 'function') return
            this._removeBacktestOverlays(dc)
            const plot = this._btPlot
            if (!plot || !plot.report || !this.corkyCurrent) return
            if (plot.symbol !== this.corkyCurrent.symbol || plot.venue !== this.corkyCurrent.venue) return
            // Clip series/markers to the loaded candle window (± a margin) so a
            // multi-year run's 100k-point series stays light and aligns with the
            // candles actually on screen. Re-plotted on each navigation.
            const loaded = this._loadedCandleRange()
            const margin = loaded ? (loaded[1] - loaded[0]) || 0 : 0
            const lo = loaded ? loaded[0] - margin : -Infinity
            const hi = loaded ? loaded[1] + margin : Infinity
            const inWin = (t) => t >= lo && t <= hi
            // Descriptor-driven account/equity/drawdown series → offchart panes.
            for (const ov of backtestSeriesOverlays(plot.report)) {
                const data = ov.data.filter((p) => inWin(p[0]))
                if (!data.length) continue
                dc.add('offchart', {
                    name: ov.name, type: ov.type, data,
                    settings: { ...ov.settings, $backtestOverlay: true, $uuid: `bt-${ov.id}`, legend: true },
                })
            }
            // Trade markers on the price pane (charted symbol, within the window).
            const trades = (plot.report.trades || []).filter(
                (t) => (!t.symbol || t.symbol === plot.symbol) && inWin(t.timestamp_ms))
            const markers = backtestTradeMarkers(trades)
            if (markers.length) {
                dc.add('onchart', {
                    name: 'Backtest Trades', type: 'Trades', grid: { id: 0 }, data: markers,
                    settings: {
                        $backtestOverlay: true, $uuid: 'bt-trades', 'z-index': 140,
                        legend: false, buyColor: '#23a776', sellColor: '#e54150', markerSize: 7, showLabel: false,
                    },
                })
            }
            this.backtests.detail = { ...this.backtests.detail, plottedRunId: plot.runId, plotting: false }
        },

        // ── Strategy runtimes ────────────────────────────────────────────────────
        // Read-only surface over CorkyStrategyFeed: the runtime SET + a live
        // full-replacement subscription (both runtimes stay selectable; the default
        // live runtime is subscribed). Money/quantity fields flow through as decimal
        // strings — the panel/transforms render them verbatim (never float-parsed).

        _strategyErr(err) { return err ? (err.message || err.code || String(err)) : null },

        // Effective default runtime id: the configured default when present in the
        // set, else the first available (so a renamed/absent default still works).
        _strategyDefaultRuntimeId() {
            const ids = (this.strategy.runtimes || []).map((r) => r && r.runtime_id)
            if (ids.includes(DEFAULT_STRATEGY_RUNTIME_ID)) return DEFAULT_STRATEGY_RUNTIME_ID
            return ids[0] || DEFAULT_STRATEGY_RUNTIME_ID
        },

        // Ticker ids for a runtime, from its allocations then orders (deduped, order
        // preserved) — drives the per-ticker ticker/decision/overlay reads.
        _strategyTickerIds(runtime) {
            const ids = []
            const seen = new Set()
            for (const src of [runtime && runtime.ticker_allocations, runtime && runtime.ticker_orders, runtime && runtime.tickers]) {
                for (const t of (Array.isArray(src) ? src : [])) {
                    const id = t && t.ticker_id
                    if (id && !seen.has(id)) { seen.add(id); ids.push(id) }
                }
            }
            return ids
        },

        // Open the Strategy tab: list runtimes, resolve/default the selection, load
        // the selected runtime's detail (tickers + decisions + overlays), then start
        // the live subscription. Idempotent — a refresh reloads the one-shot reads
        // and leaves the (already-running) subscription in place.
        async strategyOpen() {
            if (!this.strategyFeed) return
            this.strategy.loading = true; this.strategy.error = null
            try {
                const runtimes = await this.strategyFeed.listRuntimes() || []
                this.strategy.runtimes = runtimes
                const ids = runtimes.map((r) => r && r.runtime_id)
                if (!ids.includes(this.strategy.selectedRuntimeId)) {
                    this.strategy.selectedRuntimeId = this._strategyDefaultRuntimeId()
                }
                await this._strategyLoadRuntime(this.strategy.selectedRuntimeId)
                this._strategySubscribe()
            } catch (err) {
                this.strategy.error = this._strategyErr(err)
            } finally {
                this.strategy.loading = false
            }
        },

        // Load one runtime's full snapshot (upserted into the set) plus every
        // ticker's allocation, decisions and chart overlays (1m). Populates the
        // selected-runtime detail + drives the on-chart markers. Staleness-guarded:
        // a selection change mid-fetch abandons the stale load.
        async _strategyLoadRuntime(runtime_id) {
            if (!this.strategyFeed || !runtime_id) return
            let runtime
            try {
                runtime = await this.strategyFeed.getRuntime(runtime_id)
            } catch (err) { this.strategy.error = this._strategyErr(err); return }
            if (this.strategy.selectedRuntimeId !== runtime_id) return   // superseded
            if (runtime) this._strategyUpsertRuntimes([runtime])
            const tickerIds = this._strategyTickerIds(runtime)
            const results = await Promise.all(tickerIds.map((tid) => Promise.all([
                this.strategyFeed.getTicker(runtime_id, tid).catch(() => null),
                this.strategyFeed.listDecisions(runtime_id, { ticker_id: tid, limit: 50 }).catch(() => []),
                this.strategyFeed.getChartOverlays(runtime_id, tid, { timeframe: '1m' }).catch(() => []),
            ])))
            if (this.strategy.selectedRuntimeId !== runtime_id) return   // superseded mid-fetch
            const decisions = []
            const overlays = {}
            const avgByTid = {}
            tickerIds.forEach((tid, i) => {
                const [tk, ds, ov] = results[i]
                if (Array.isArray(ds)) decisions.push(...ds)
                overlays[tid] = Array.isArray(ov) ? ov : []
                // Consume the per-ticker read: position_avg_price is present on the
                // get_strategy_ticker allocation but absent from the runtime
                // snapshot's ticker_allocations, so carry it across.
                const avg = tk && tk.allocation && tk.allocation.position_avg_price
                if (avg != null && avg !== '') avgByTid[tid] = avg
            })
            if (runtime && Object.keys(avgByTid).length) {
                this._strategyUpsertRuntimes([{
                    ...runtime,
                    ticker_allocations: (runtime.ticker_allocations || []).map((a) =>
                        (a && avgByTid[a.ticker_id] != null)
                            ? { ...a, position_avg_price: avgByTid[a.ticker_id] } : a),
                }])
            }
            this.strategy.decisions = decisions
            this.strategy.overlays = overlays
            this.syncStrategyOverlays()
        },

        // Select a different runtime row: change the selection + reload its detail.
        // The live subscription stays pinned to the default live runtime (so its row
        // keeps updating), and the whole set stays selectable.
        strategySelectRuntime(runtime_id) {
            if (!runtime_id || runtime_id === this.strategy.selectedRuntimeId) return
            this.strategy.selectedRuntimeId = runtime_id
            this._strategyLoadRuntime(runtime_id)
        },

        // Manual refresh: reload the runtime set + selected detail (the subscription,
        // if running, keeps live-updating the set on top).
        strategyRefresh() { this.strategyOpen() },

        // ── direct control (MUTATES a live runtime) ──────────────────────────────
        // Each handler forwards a panel intent to the feed's control method. Gated on
        // an active control session (strategy.control.available — the stateful
        // streaming socket the direct-control route also requires) AND a runtime the
        // discovery set actually knows (its runtime_id is the gateway's routing
        // target — the runtime-targeting rule; strategy controls carry that id
        // directly, so no separate target_runtime_id is threaded, unlike
        // upsert_candle_state whose key is venue/symbol).
        //
        // CRITICAL: on ack we do NOT mutate the local strategy/order state — we flip
        // pending → awaiting and rely on the subscribe_strategy_runtime
        // full-replacement update to reconcile (see _strategyApplyUpdate). A send
        // failure surfaces the gateway error; a control-unavailable rejection also
        // drops the control surface until a fresh session advertises it.
        async _strategyControl(method, opts) {
            const ctl = this.strategy.control
            if (!this.strategyFeed || !ctl || !ctl.available) {
                if (ctl) ctl.error = 'No strategy control session.'
                return
            }
            const rt = (this.strategy.runtimes || []).find((r) => r && r.runtime_id === opts.runtime_id)
            if (!rt) { ctl.error = `Unknown runtime ${opts.runtime_id}.`; return }
            // Defense-in-depth: never emit a capital/position-committing control
            // (unlock/adopt) on an unverified (mismatched-lineage) runtime, even if
            // the UI somehow surfaced the action. Halt controls stay allowed.
            if (CAPITAL_CONTROL_METHODS.has(method) && classifyLineage(rt.lineage_status).tone === 'attention') {
                ctl.error = `Runtime lineage ${rt.lineage_status || 'unknown'} not verified — capital controls blocked.`
                return
            }
            ctl.pending = true
            ctl.awaiting = null
            ctl.error = null
            try {
                await this.strategyFeed[method](opts)
                // Ack received. Do NOT touch strategy.runtimes/decisions/overlays —
                // the next subscription full-replacement FOR THIS RUNTIME reconciles.
                ctl.pending = false
                ctl.awaiting = opts.runtime_id
            } catch (err) {
                ctl.pending = false
                ctl.awaiting = null
                ctl.error = this._strategyErr(err)
                // A missing/stale control SESSION invalidates the whole surface until
                // a fresh one is advertised; a per-command rejection just shows the
                // error (canonical gateway code: control_session_required).
                if (err && err.code === 'control_session_required') ctl.available = false
            }
        },

        strategyCancelTickerOrders(p) { return this._strategyControl('cancelTickerOrders', p) },
        strategyPauseTicker(p) { return this._strategyControl('pauseTicker', p) },
        strategyResumeTicker(p) { return this._strategyControl('resumeTicker', p) },
        strategyUnlockTicker(p) { return this._strategyControl('unlockTicker', p) },
        strategyAdoptPosition(p) { return this._strategyControl('adoptPosition', p) },
        strategyAdoptPositions(p) { return this._strategyControl('adoptPositions', p) },

        // A verified runtime's lineage → jump straight to its universe backtest run
        // + selected candidate in the Backtests dock (field-map "Candidate link").
        async strategyOpenLineageRun({ run_id, run_index } = {}) {
            if (!run_id) return
            this.setPositionsTab('backtests')   // switch the dock to the Backtests tab
            // Resolve the run object btSelectRun needs: prefer the loaded list, then a
            // by-id fetch, then a minimal stub (shape is detected from the run_id).
            let run = (this.backtests.runs || []).find((r) => r && r.run_id === run_id)
            if (!run && this.backtestsFeed) {
                if (!(this.backtests.runs || []).length) {
                    await this.btListRuns()
                    run = (this.backtests.runs || []).find((r) => r && r.run_id === run_id)
                }
                if (!run && typeof this.backtestsFeed.getRun === 'function') {
                    try { run = await this.backtestsFeed.getRun(run_id) } catch (_) { /* fall through */ }
                }
            }
            if (!run) run = { run_id }
            await this.btSelectRun(run)
            // Drill into the exact candidate (universe/sweep run_index) when present.
            if (run_index != null && typeof this.btSelectCandidate === 'function') {
                await this.btSelectCandidate(run_index)
            }
        },

        // Start the live runtime subscription (once). Scoped to the default live
        // runtime; each update is a FULL-REPLACEMENT snapshot applied by increasing
        // sequence (see _strategyApplyUpdate). No-op when streaming is unsupported.
        _strategySubscribe() {
            if (!this.strategyFeed || this._strategySub) return
            if (this.strategyFeed.streamingSupported === false) return
            this._strategySub = this.strategyFeed.subscribeRuntime(
                { subscription_id: 'strategy-runtime', runtime_id: this._strategyDefaultRuntimeId() }, {
                    onData: (runtimes) => this._strategyApplyUpdate(runtimes),
                    // Lost stream ⇒ lost control session (controls need the stateful
                    // socket). Keep the last-good set but hide the control surface.
                    onError: () => { this.strategy.streaming = false; if (this.strategy.control) this.strategy.control.available = false },
                })
            this.strategy.streaming = true
            // A live subscription rides the same stateful socket the direct-control
            // commands require, so it is the control session — controls become
            // available (still gated per-action by the runtime the operator picks).
            if (this.strategy.control) this.strategy.control.available = true
        },

        _strategyStopSubscribe() {
            if (this._strategySub && this.strategyFeed) {
                try { this.strategyFeed.unsubscribe(this._strategySub) } catch (_) { /* gone */ }
            }
            this._strategySub = null
            if (this.strategy) {
                this.strategy.streaming = false
                if (this.strategy.control) this.strategy.control.available = false   // no session ⇒ no controls
            }
        },

        // Apply a FULL-REPLACEMENT runtime update from the subscription. The feed
        // already dropped stale/duplicate/reconnect-replay sequences (and resets
        // its watermark on reconnect), so there is no App-level sequence guard.
        // The update carries the current snapshot of the runtime(s) it covers —
        // upserted by runtime_id into the selectable set (order preserved), so
        // out-of-scope rows (e.g. the non-subscribed runtime) stay selectable.
        _strategyApplyUpdate(runtimes) {
            if (!Array.isArray(runtimes) || !runtimes.length) return   // keep last-good
            this._strategyUpsertRuntimes(runtimes)
            this.strategy.streaming = true
            // Clear the awaiting-reconciliation hint only when THIS snapshot actually
            // covers the runtime a control was sent to (awaiting holds that
            // runtime_id) — an unrelated runtime's update must not clear it.
            const ctl = this.strategy.control
            if (ctl && ctl.awaiting && runtimes.some((r) => r && r.runtime_id === ctl.awaiting)) {
                ctl.awaiting = null
            }
        },

        // Upsert runtimes into `strategy.runtimes` by runtime_id (replace in place,
        // preserving order; append unknown ones). Shared by the one-shot detail read
        // and the subscription's full-replacement apply.
        _strategyUpsertRuntimes(runtimes) {
            const set = (this.strategy.runtimes || []).slice()
            for (const rt of runtimes) {
                if (!rt || !rt.runtime_id) continue
                const i = set.findIndex((r) => r && r.runtime_id === rt.runtime_id)
                if (i >= 0) set.splice(i, 1, rt)
                else set.push(rt)
            }
            this.strategy.runtimes = set
        },

        _removeStrategyOverlays(dc) {
            for (const side of ['onchart', 'offchart']) {
                const arr = dc.data && dc.data[side]
                if (!Array.isArray(arr)) continue
                for (let i = arr.length - 1; i >= 0; i--) {
                    if (arr[i] && arr[i].settings && arr[i].settings.$strategyOverlay) arr.splice(i, 1)
                }
            }
            if (typeof dc.update_ids === 'function') dc.update_ids()
        },

        // Price of the loaded candle the given timestamp rides on (last candle with
        // t <= ts). `field` selects high/low/close. null when no candle covers it —
        // the marker is then skipped (Markers.vue skips non-finite y anyway).
        _strategyCandlePriceAt(candles, ts, field) {
            if (!Array.isArray(candles) || !candles.length) return null
            let lo = 0; let hi = candles.length - 1; let ans = -1
            while (lo <= hi) {
                const mid = (lo + hi) >> 1
                if (candles[mid][0] <= ts) { ans = mid; lo = mid + 1 } else hi = mid - 1
            }
            if (ans < 0) return null
            const c = candles[ans]
            const idx = field === 'h' ? 2 : field === 'l' ? 3 : 4
            const v = c && c[idx]
            return Number.isFinite(Number(v)) ? Number(v) : null
        },

        // Reconcile the on-chart strategy markers (decision/fill/order/allocation +
        // manual control) to the charted symbol's overlays. Called after every
        // history-complete (a candle load wipes onchart) and on each strategy load.
        // One Markers overlay per class, anchored to the loaded candles and clipped
        // to the loaded window — nothing plots when the charted symbol has no
        // strategy overlays (or the candles aren't loaded yet).
        syncStrategyOverlays() {
            const dc = this.chart
            if (!dc || !dc.data || typeof dc.add !== 'function') return
            this._removeStrategyOverlays(dc)
            const cur = this.corkyCurrent
            if (!cur || !cur.symbol) return
            // Flatten every ticker's overlays, keep only those for the charted symbol.
            const all = []
            for (const k of Object.keys(this.strategy.overlays || {})) {
                for (const o of (this.strategy.overlays[k] || [])) {
                    if (o && o.symbol === cur.symbol) all.push(o)
                }
            }
            if (!all.length) return
            const candles = dc.data.chart && dc.data.chart.data
            const loaded = this._loadedCandleRange()
            const lo = loaded ? loaded[0] : -Infinity
            const hi = loaded ? loaded[1] : Infinity
            // Group by display class. A manual control marker plots on its own
            // `control` layer — recognized EITHER by kind:'control' (the gateway's
            // shape) OR by source strategy_control_audit on any base kind. Reuses
            // overlaysToMarkers' normalization, then partitions control out.
            const grouped = overlaysToMarkers(all)
            const buckets = { decision: [], fill: [], order: [], allocation: [], control: [] }
            for (const kind of ['decision', 'fill', 'order', 'allocation', 'control']) {
                for (const m of grouped[kind]) {
                    (m.source === 'strategy_control_audit' || m.kind === 'control'
                        ? buckets.control : buckets[kind]).push(m)
                }
            }
            for (const kind of Object.keys(buckets)) {
                const st = STRATEGY_MARKER_STYLES[kind]
                const rows = []
                for (const m of buckets[kind]) {
                    const ts = m.timestamp_ms
                    if (!(ts >= lo && ts <= hi)) continue   // clip to the loaded window
                    const y = this._strategyCandlePriceAt(candles, ts, st.anchor)
                    if (y == null) continue
                    rows.push([ts, y, m.label])
                }
                if (!rows.length) continue
                dc.add('onchart', {
                    name: 'Strategy ' + kind, type: 'Markers', grid: { id: 0 }, data: rows,
                    settings: {
                        $strategyOverlay: true, $uuid: 'strategy-' + kind, 'z-index': st.z,
                        legend: false, color: st.color, shape: st.shape, markerSize: 7, showLabel: false,
                    },
                })
            }
        },

        setPositionsAccount(acct) {
            this.positionsActiveAccount = acct
            // History is per-account — reset and reload for the new account.
            this.historicalPositions = []
            this.positionsHistoryCursor = null
            this.positionsHistoryTotal = 0
            if (this.positionsActiveTab === 'historical') this.loadHistoryPage(true)
        },

        _ensureHistoryLoaded(opts = {}) {
            if (!this.historicalPositions.length && !this.positionsLoading) this.loadHistoryPage(true, opts)
        },

        async loadHistoryPage(reset = false, { silent = false } = {}) {
            if (!this.positionsFeed) return
            const acct = this.positionsActiveAccount
            if (!acct) { if (!silent) this.positionsError = 'Select an account to view history'; return }
            if (reset) {
                this.historicalPositions = []
                this.positionsHistoryCursor = null
                this.positionsHistoryTotal = 0
            }
            this.positionsLoading = true
            this.positionsError = null
            try {
                const out = await this.positionsFeed.listHistory({
                    venue: acct.venue, account_id: acct.account_id,
                    cursor: this.positionsHistoryCursor || undefined,
                })
                this.historicalPositions = this.historicalPositions.concat(out.positions || [])
                this.positionsHistoryCursor = out.next_cursor
                this.positionsHistoryTotal = out.total_count
            } catch (err) {
                if (!silent) this.positionsError = this._positionsErrText(err)
            } finally {
                this.positionsLoading = false
            }
        },

        // Click a position row → switch the chart to that position's ticker,
        // keeping the current timeframe if the target offers it, else 1h, else the
        // lowest available (pickTimeframe). Discovers the venue first if unknown.
        async onPositionSelect(pos, newTab) {
            if (!pos || !pos.symbol) return
            // ⌘/Ctrl/middle-click → plot this position in a NEW chart tab (abort at
            // the cap rather than clobber the active chart).
            if (newTab && !this.createChartTab()) return
            this._clearSearchNav()   // a position pick drops any active search-result marker
            const { venue, symbol } = pos
            let state = (this.corkyStates || []).find(
                (s) => s && s.venue === venue && s.symbol === symbol)
            if (!state) {
                try { await this.corkyDiscover(venue) } catch (_) { /* surfaced below if select fails */ }
                state = (this.corkyStates || []).find(
                    (s) => s && s.venue === venue && s.symbol === symbol)
            }
            const tfs = (state && state.available_timeframes) || []
            const current = this.corkyCurrent && this.corkyCurrent.timeframe
            const preferredTf = pickTimeframe(current, tfs, { fallback: '1h' }) || current || '1h'

            // Provisional plot (lets a discovery switch clear it); series + window
            // are filled from the audit below.
            this._stopPositionAuditStream()
            this.positionPlot = {
                venue, symbol, position_id: pos.position_id,
                window: null, audit: null, series: null,
                toggles: { trades: true, openClose: true, orders: false, size: false, hist: false, fees: false },
            }
            const mine = () => this.positionPlot &&
                this.positionPlot.symbol === symbol &&
                this.positionPlot.position_id === pos.position_id

            // Fetch the audit FIRST: it gives the window (from audit.position /
            // trade-fee timestamps — the row's opened_at_ms can be 0/missing) which
            // drives BOTH the timeframe-coarsening and the candle range. On audit
            // failure we still switch the ticker (latest view), just without a plot.
            this.corkyLoading = true
            let audit = null
            if (this.positionsFeed && pos.position_id != null) {
                try {
                    audit = await this.positionsFeed.getAudit({
                        venue, account_id: pos.account_id, symbol, position_id: pos.position_id,
                    })
                } catch (_) { /* drawer surfaces audit errors; plot just won't show */ }
            }
            if (!mine()) return   // superseded while awaiting

            const win = audit ? this._plotWindow(pos, audit) : null
            const spanMs = win ? (win.end - win.start) : 0
            // Coarsen the timeframe so a long position doesn't request a huge candle
            // count at a fine tf (e.g. a multi-year position at 1m). Never goes finer
            // than the preferred tf; no-op for short spans / no audit.
            const timeframe = coarsenTimeframe(preferredTf, tfs, spanMs) || preferredTf

            // Ensure the gateway maintains a candle state for the chosen symbol+tf
            // before subscribing (some account symbols have none → state_not_found).
            const chartable = await this._ensureCandleState(venue, symbol, timeframe)
            if (!mine()) return
            if (!chartable) {
                this.corkyLoading = false
                this.corkyError = { message:
                    `No candle data available for ${venue} ${symbol} ${timeframe} — can't chart this position. ` +
                    'Use the row’s details (ⓘ) for its orders/trades/fees.' }
                this.clearPositionPlot()
                return
            }

            let range
            if (audit) {
                this.positionPlot.audit = audit
                this.positionPlot.series = this._computePositionSeries(audit, win ? win.end : undefined)
                this.positionPlot.window = win
                if (win) {
                    // Load the position window padded by ~400 candles each side
                    // (calendar-stepped for 1M), clamped to [0, now].
                    const r = paddedCandleRange({
                        start: win.start, end: win.end, timeframe, count: 400, now: Date.now(),
                    })
                    range = { type: 'start_end', start_ms: r.start_ms, end_ms: r.end_ms }
                }
            }
            this.corkySelect({ venue, symbol, timeframe, range, chunk_rows: 500 })
            // Plot now if the chart is already on this symbol; otherwise the
            // history-complete handler re-plots once the new candles load (the
            // subscribe wipes overlays). The symbol guard inside makes this safe.
            this.syncPositionOverlays()
            // Keep an OPEN position's plot live as new trades land.
            if (audit && this._isOpenPosition(pos, audit)) this._startPositionAuditStream(pos)
        },

        // Is the position still OPEN (held)? Open ⇒ the window stretches to "now"
        // (the lines continue to the right edge) and we keep a live audit stream.
        // Decisive signals first (row source, close stamp, audit status); with none
        // present (e.g. a thin fixture) infer from the net holding — a flat (net ≈ 0)
        // position is effectively closed even without a close stamp.
        _isOpenPosition(pos, audit) {
            const valid = (t) => typeof t === 'number' && Number.isFinite(t) && t > 0
            if (pos && pos.source === 'historical') return false
            if (pos && pos.source === 'current') return true
            const p = (audit && audit.position) || {}
            if (valid(p.closed_at_ms) || (pos && valid(pos.closed_at_ms))) return false
            const status = p.status != null ? String(p.status).toLowerCase() : ''
            if (status === 'flat' || status === 'closed') return false
            if (status === 'long' || status === 'short' || status === 'open' || status === 'active') return true
            let net = p.amount != null ? Number(p.amount) : NaN
            if (!Number.isFinite(net)) {
                net = 0
                for (const t of (audit && audit.trades) || []) net += Number(t.amount) || 0
            }
            return Math.abs(net) > 1e-8
        },

        // The position's chart window. START: audit.position.opened_at_ms (gateway
        // infers it) else first trade/fee ts. END: a CLOSED position ends at its
        // close stamp; an OPEN position is STILL HELD, so we stretch the window to
        // NOW — that is what makes the size/fees lines "continue on" to the right
        // edge instead of stopping at the entry. (This relies on the history-complete
        // handler actually ranging to the window via setRange + resetChart(false);
        // before that fix a wide window pushed the data off-screen, which is why this
        // had been clamped to the activity span.) Minimum visible span for a tiny
        // window; `now` is also the last resort when nothing else is known.
        _plotWindow(pos, audit) {
            const valid = (t) => typeof t === 'number' && Number.isFinite(t) && t > 0
            const p = (audit && audit.position) || {}
            const isOpen = this._isOpenPosition(pos, audit)
            let start = valid(p.opened_at_ms) ? p.opened_at_ms : null
            let end = valid(p.closed_at_ms) ? p.closed_at_ms
                : (isOpen ? Date.now()
                    : (valid(p.updated_at_ms) ? p.updated_at_ms : null))
            if (start == null || end == null) {
                const ts = []
                for (const t of (audit && audit.trades) || []) if (valid(t.execution_timestamp_ms)) ts.push(t.execution_timestamp_ms)
                for (const f of (audit && audit.fees) || []) if (valid(f.timestamp_ms)) ts.push(f.timestamp_ms)
                if (ts.length) {
                    if (start == null) start = Math.min(...ts)
                    if (end == null) end = Math.max(...ts)
                }
            }
            // Last-resort row fallback, then now (only if nothing else is known).
            if (start == null || end == null) {
                const w = positionWindow(pos)
                if (start == null && valid(w.start)) start = w.start
                if (end == null) end = valid(w.end) ? w.end : (start != null ? Date.now() : null)
            }
            if (start == null || end == null) return null
            if (end < start) { const t = start; start = end; end = t }
            const MIN_SPAN = 12 * 60 * 60 * 1000   // ≥ ~1 day visible for a tiny window
            if (end - start < MIN_SPAN) {
                const mid = (start + end) / 2
                start = mid - MIN_SPAN / 2; end = mid + MIN_SPAN / 2
            }
            return { start, end }
        },

        _startPositionAuditStream(pos) {
            if (!this.positionsFeed || !this.positionsFeed.streamingSupported) return
            this._stopPositionAuditStream()
            this._posAuditSub = this.positionsFeed.subscribeAudit({
                subscription_id: 'corky-position-plot-audit',
                venue: pos.venue, account_id: pos.account_id,
                symbol: pos.symbol, position_id: pos.position_id,
            }, {
                onData: (audit) => {
                    if (!audit || !this.positionPlot ||
                        this.positionPlot.symbol !== pos.symbol ||
                        this.positionPlot.position_id !== pos.position_id) return
                    this.positionPlot.audit = audit
                    const tail = this.positionPlot.window ? this.positionPlot.window.end : undefined
                    this.positionPlot.series = this._computePositionSeries(audit, tail)
                    this.syncPositionOverlays()
                    const dc = this.chart; if (dc && dc.touchData) dc.touchData()
                },
                onError: () => { /* keep last-good */ },
            })
        },

        _stopPositionAuditStream() {
            if (this._posAuditSub && this.positionsFeed) {
                try { this.positionsFeed.unsubscribe(this._posAuditSub) } catch (_) { /* gone */ }
            }
            this._posAuditSub = null
        },

        // ── Selected-position audit drawer ────────────────────────────────────

        openAudit(pos) {
            if (!pos || pos.position_id == null) return
            this.auditTarget = {
                venue: pos.venue, account_id: pos.account_id,
                symbol: pos.symbol, position_id: pos.position_id,
            }
            this.auditData = null   // fresh target → drop the previous bundle
            this.auditOpen = true
            this._loadAudit()
        },

        async _loadAudit() {
            if (!this.positionsFeed || !this.auditTarget) return
            this.auditLoading = true
            this.auditError = null
            try {
                // One-shot first so the drawer fills immediately…
                const audit = await this.positionsFeed.getAudit({ ...this.auditTarget })
                this.auditData = audit
                // …then go live while the drawer stays open (best-effort).
                this._startAuditStream()
            } catch (err) {
                // Retryable unavailability (auth_position_audit_unavailable) keeps
                // whatever bundle we already had; just surface the message.
                this.auditError = this._positionsErrText(err)
            } finally {
                this.auditLoading = false
            }
        },

        _startAuditStream() {
            if (!this.positionsFeed || !this.auditTarget) return
            if (!this.positionsFeed.streamingSupported) return
            this._stopAuditStream()
            this._auditSubHandle = this.positionsFeed.subscribeAudit(
                { subscription_id: 'corky-position-audit', ...this.auditTarget }, {
                    onData: (audit) => { if (audit) { this.auditData = audit; this.auditError = null } },
                    onError: (err) => {
                        if (!(err && err.code === 'stateful_websocket_required')) {
                            this.auditError = this._positionsErrText(err)
                        }
                    },
                })
        },

        _stopAuditStream() {
            if (this._auditSubHandle && this.positionsFeed) {
                try { this.positionsFeed.unsubscribe(this._auditSubHandle) } catch (_) { /* gone */ }
            }
            this._auditSubHandle = null
        },

        closeAudit() {
            this.auditOpen = false
            this._stopAuditStream()
            this.auditTarget = null
            this.auditData = null
            this.auditError = null
        },

        // Top-edge drag to resize the dock body (mirrors startPanelResize).
        startPositionsDockResize(ev) {
            // A manual drag means the user is choosing a concrete height — exit
            // maximize so the clamp logic resumes. Seed the resizable height from
            // the current (full) body BEFORE clearing the flag, so the drag
            // starts where the dock actually is, not from a stale value (HEADER=34).
            if (this.positionsDockMaximized) {
                this.positionsDockHeight = Math.max(120, this.bottomDockHeight - 34)
                this.positionsDockMaximized = false
            }
            const startY = ev.clientY
            const startH = this.positionsDockHeight
            this._onDockResizeMove = (e) => {
                const dy = startY - e.clientY   // drag up → taller
                const maxBody = Math.max(120, Math.floor(this.height * 0.6))
                this.positionsDockHeight = Math.min(maxBody, Math.max(120, startH + dy))
            }
            this._onDockResizeEnd = () => {
                document.removeEventListener('mousemove', this._onDockResizeMove)
                document.removeEventListener('mouseup', this._onDockResizeEnd)
                document.body.style.cursor = ''
                this.saveStateToStorage()
            }
            document.addEventListener('mousemove', this._onDockResizeMove)
            document.addEventListener('mouseup', this._onDockResizeEnd)
            document.body.style.cursor = 'ns-resize'
        },

        teardownCorky() {
            // Invalidate EVERY tab's in-flight select epoch + cancel its pending
            // retry so nothing fires against the torn-down client (per-tab now).
            for (const t of (this.chartTabs || [])) {
                if (!t) continue
                if (t._stream) t._stream.gen = (t._stream.gen || 0) + 1
                this._corkyCancelSelectRetry(t)
                t.corkyLoading = false
                t.corkyProgress = null
                t.corkyError = null
            }
            this._corkyUnsub()
            this._positionsStopOpenStream()
            this._stopAuditStream()
            this._stopPositionAuditStream()
            if (this._positionsPoll) { clearInterval(this._positionsPoll); this._positionsPoll = null }
            // Dispose EVERY tab's gateway stream feed (concurrent-live) + its
            // backtest-progress sub WITHOUT closing the shared client (we close it
            // once, below) — disposing each feed avoids N redundant socket closes
            // and the dock feeds running against an already-dead client.
            for (const t of (this.chartTabs || [])) {
                if (!t) continue
                if (t.corkyFeed) {
                    try { t.corkyFeed.dispose() } catch (_) { /* already gone */ }
                    t.corkyFeed = null
                    t.corkyHandle = null
                }
                if (t.btProgressSub && this.backtestsFeed) {
                    try { this.backtestsFeed.unsubscribe(t.btProgressSub) } catch (_) { /* gone */ }
                    t.btProgressSub = null
                }
            }
            if (this.corkyDiscoverFeed) {
                try { this.corkyDiscoverFeed.dispose() } catch (_) { /* already gone */ }
                this.corkyDiscoverFeed = null
            }
            if (this.positionsFeed) {
                try { this.positionsFeed.destroy() } catch (_) { /* already gone */ }
            }
            if (this.searchFeed) {
                try { this.searchFeed.destroy() } catch (_) { /* already gone */ }
            }
            this._btStopProgress()
            if (this.backtestsFeed) {
                try { this.backtestsFeed.destroy() } catch (_) { /* already gone */ }
            }
            this._strategyStopSubscribe()
            if (this.strategyFeed) {
                try { this.strategyFeed.destroy() } catch (_) { /* already gone */ }
            }
            // Now close the ONE shared client (the feeds above only disposed).
            if (this.corkyClient && typeof this.corkyClient.close === 'function') {
                try { this.corkyClient.close() } catch (_) { /* already gone */ }
            }
            // NB: corkyFeed is a getter-only computed shim → no `corkyFeed = null`.
            this.positionsFeed = null
            this.searchFeed = null
            this.backtestsFeed = null
            this._btPlot = null
            this.backtests = {
                strategies: [], runs: [], filters: { strategy: '', symbol: '', status: '' },
                selectedRun: null, detail: {}, loading: false, error: null,
                metricFilters: [], clickHistory: [],
            }
            this.strategyFeed = null
            this._strategySub = null
            this.strategy = {
                runtimes: [], selectedRuntimeId: DEFAULT_STRATEGY_RUNTIME_ID,
                decisions: [], overlays: {}, streaming: false, loading: false, error: null,
                control: { available: false, pending: false, awaiting: false, error: null },
            }
            this.searchTabs = []
            this.searchTabSeq = 0
            this.searchNav = null
            this.corkyClient = null
            this.corkyStates = []
            this.corkyCurrent = null
            this.corkyProgress = null
            this.corkyError = null
            this.corkyLoading = false
            this.openPositions = []
            this.historicalPositions = []
            this.positionsAccounts = []
            this.positionsActiveAccount = null
            this.positionsError = null
            this.positionsHistoryCursor = null
            this.positionsHistoryTotal = 0
            this.auditOpen = false
            this.auditData = null
            this.auditTarget = null
            this.auditError = null
            this.positionPlot = null
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
    flex: 1 1 0;
    /* min-height:0 overrides the flex default of `auto`, which would refuse to
       shrink the wrapper below the chart canvas's height and push the bottom
       dock / button row out of the column (dock overlapping the chart). */
    min-height: 0;
    position: relative;
    overflow: hidden;
}
/* Empty state: an opaque cover over the (empty) chart so the grid, axes and
   Volume legend are hidden and only the "pick a source" invite shows. */
.chart-empty {
    position: absolute;
    inset: 0;
    z-index: 20;                /* above the chart chrome + drawing toolbar */
    background: #121827;        /* opaque, matches the chart back */
    display: flex;
    align-items: center;
    justify-content: center;
    text-align: center;
    padding: 24px;
}
.chart-empty-inner { max-width: 440px; user-select: none; }
.chart-empty-icon { font-size: 42px; line-height: 1; color: #2b3446; margin-bottom: 14px; }
.chart-empty-msg { font-size: 16px; font-weight: 600; color: #c4ccda; letter-spacing: 0.01em; }
.chart-empty-sub { margin-top: 8px; font-size: 12px; color: #6b7686; }

/* Bottom Panel */
.bottom-panel {
    height: 44px;
    flex-shrink: 0;          /* never squish the button row */
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
/* Fully closed: drop the 1px left border so no sliver remains at the edge and the
   chart fills the freed space exactly (border-box doesn't suppress border paint). */
.right-panel.collapsed { border-left: 0; }

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
/* Collapse/expand toggle — pinned at the panel's left edge (right = panel width,
   set inline) so it tracks the edge when open and sits at the viewport edge when
   collapsed. A small tab on the chart side of the border. */
.panel-collapse-toggle {
    position: fixed;
    top: 8px;
    width: 22px;
    height: 26px;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0;
    border: 1px solid #2a2e39;
    border-right: none;
    border-radius: 4px 0 0 4px;
    background: #1e222d;
    color: #808a9d;
    cursor: pointer;
    z-index: 1001; /* above the resizer (1000) */
    transition: color 0.12s, background 0.12s;
}
.panel-collapse-toggle:hover { color: #d1d4dc; background: #262b38; }
.panel-collapse-toggle:focus-visible { outline: 2px solid #35a776; outline-offset: -1px; }
/* Collapsed: make the reopen handle OBVIOUS so a closed panel never reads as a
   missing one — a bright green right-edge line, green chevron + tint, slightly
   wider, and a soft glow to draw the eye. */
.panel-collapse-toggle.collapsed {
    width: 26px;
    background: rgba(53,167,118,0.14);
    border-color: rgba(53,167,118,0.55);
    color: #35a776;
    box-shadow: inset -3px 0 0 #35a776, 0 0 10px rgba(53,167,118,0.35);
}
.panel-collapse-toggle.collapsed:hover { background: rgba(53,167,118,0.26); color: #35a776; }
.panel-collapse-toggle.collapsed .pct-chevron { color: #35a776; }
.pct-chevron { font-size: 16px; line-height: 1; font-weight: 700; }

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
