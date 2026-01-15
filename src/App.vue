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
                    @open-indicator-settings="openIndicatorSettings">
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
        <div class="panel-section">
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
            <div class="section-title">Indicators</div>
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
</div>
</template>

<script>
import TradingVue from './TradingVue.vue'
import IndicatorSettings from './components/IndicatorSettings.vue'

let uri = window.location.href.split('?');
if(uri.length == 2) {
  let vars = uri[1].split('&');
  let getVars = {};
  let tmp = '';
  vars.forEach(function(v) {
    tmp = v.split('=');
    if(tmp.length == 2)
      getVars[tmp[0]] = tmp[1];
  });
  console.log(getVars);
  // do 
    if (getVars['data'] != 'undefined') { 
        console.log('hello world')
       // #import Data from '../data/data_colormap.json'
    } 
} 


import Utils from '../src/stuff/utils.js'
import Data from '../data/data.json'
// import DataColmap from '../data/data_colmap.json'
import DataCube from '../src/helpers/datacube.js'
import BuysAndSells from './buysandsells.js'
import Balance from './balance.js'
import LineTracker from './linetracker.js'

export default {
    name: 'app',
    computed: {
    	colors() {
        	return {
            	back: '#121827',
                grid: '#3e3e3e',
                text: '#35a776',
              	cross: '#dd64ef',
              	candle_dw: '#e54077',
              	wick_dw: '#e54077'
            }
        },
        rightPanelWidth() {
            return this.config.RIGHTBAR || 250
        },
        chartWidth() {
            return this.width - this.rightPanelWidth
        },
        chartHeight() {
            return this.height - this.bottomPanelHeight
        },
        bottomPanelHeight() {
            return 44
        },
        timeframes() {
            return Object.keys(this.charts)
        },
        offchartIndicators() {
            if (!this.chart || !this.chart.data || !this.chart.data.offchart) {
                return []
            }
            return this.chart.data.offchart.map((indicator, index) => ({
                name: indicator.name || `Indicator ${index + 1}`,
                type: indicator.type,
                visible: indicator.settings?.display !== false,
                index: index
            }))
        }
    },
    components: {
        TradingVue,
        IndicatorSettings
    },
    methods: {
        onResize() {
            this.width = window.innerWidth
            this.height = window.innerHeight
        },
        resetView() {
            if (this.$refs.tradingVue) {
                this.$refs.tradingVue.resetChart()
            }
        },
        toggleRectDrawMode() {
            this.rectDrawMode = !this.rectDrawMode
            if (!this.rectDrawMode) {
                this.isDrawing = false
                this.rectStart = null
                this.rectCurrent = null
            }
        },
        onDrawStart(event) {
            this.isDrawing = true
            this.rectStart = { x: event.clientX, y: event.clientY }
            this.rectCurrent = { x: event.clientX, y: event.clientY }
        },
        onDrawMove(event) {
            if (this.isDrawing) {
                this.rectCurrent = { x: event.clientX, y: event.clientY }
            }
        },
        onDrawEnd(event) {
            if (this.isDrawing && this.rectStart && this.rectCurrent) {
                const x = Math.min(this.rectStart.x, this.rectCurrent.x)
                const y = Math.min(this.rectStart.y, this.rectCurrent.y)
                const w = Math.abs(this.rectCurrent.x - this.rectStart.x)
                const h = Math.abs(this.rectCurrent.y - this.rectStart.y)

                if (w > 5 && h > 5) {
                    alert(
                        `Rectangle Coordinates:\n` +
                        `Position: (${x}, ${y})\n` +
                        `Size: ${w} x ${h}\n` +
                        `End: (${x + w}, ${y + h})`
                    )
                }

                this.isDrawing = false
                this.rectStart = null
                this.rectCurrent = null
                this.rectDrawMode = false
            }
        },
        selectTimeframe(tf, index) {
            this.selectedTimeframe = index
            const chartData = this.charts[tf]
            // Store original data for color scheme switching
            this.originalChartData = JSON.parse(JSON.stringify(chartData.chart.data))
            // Track current timeframe
            this.currentTimeframe = tf
            // Extract candle coloring options for this timeframe
            this.extractCandleColoringOptions(chartData, tf)

            // Determine displayedView based on selectedView availability
            const availableViews = this.candleColoringOptions.map(opt => opt.title)
            if (availableViews.includes(this.selectedView)) {
                // Selected view exists - use it
                this.displayedView = this.selectedView
            } else if (availableViews.length > 0) {
                // Fallback to first view for display only (keep selectedView unchanged)
                this.displayedView = availableViews[0]
            } else {
                this.displayedView = ''
            }

            // Create DataCube with views filtered out
            this.chart = new DataCube(this.prepareChartData(chartData, tf))
            // Apply displayed view
            this.$nextTick(() => {
                this.applyCurrentColoring()
            })
            // Force chart to redraw
            this.$nextTick(() => {
                if (this.$refs.tradingVue) {
                    this.$refs.tradingVue.resetChart()
                }
            })
        },
        extractCandleColoringOptions(chartData, timeframe = null) {
            this.candleColoringOptions = []

            // New format: read from views object
            const views = chartData.views
            if (views && typeof views === 'object') {
                for (const viewName of Object.keys(views)) {
                    this.candleColoringOptions.push({
                        title: viewName,
                        viewData: views[viewName]
                    })
                }
            }
        },
        // Create a clean copy of chart data for DataCube
        // Always set chart.tf from timeframe key for multi-timeframe data
        prepareChartData(chartData, timeframe = null) {
            const cleaned = JSON.parse(JSON.stringify(chartData))
            // Remove views from the cleaned data (it's metadata, not rendered directly)
            delete cleaned.views
            // Always set chart.tf from timeframe key (except for 'default' single-timeframe)
            if (timeframe && timeframe !== 'default' && cleaned.chart) {
                cleaned.chart.tf = timeframe
            }
            return cleaned
        },
        onViewSelected(viewName) {
            this.selectedView = viewName      // Update persistent selection
            this.displayedView = viewName     // Update display
            this.applyCurrentColoring()
        },
        applyCurrentColoring() {
            if (!this.originalChartData || !this.chart.data.chart) return

            // Get the view data for displayed view
            let viewData = null
            if (this.displayedView) {
                const selectedOption = this.candleColoringOptions.find(opt => opt.title === this.displayedView)
                if (selectedOption && selectedOption.viewData) {
                    viewData = selectedOption.viewData
                }
            }

            // Apply colors, below, and above markers to chart data
            const newData = JSON.parse(JSON.stringify(this.originalChartData))
            if (viewData) {
                const colors = viewData.colors || []
                // Handle both simple array and extended object format for below/above
                const below = Array.isArray(viewData.below) ? viewData.below : (viewData.below?.values || [])
                const above = Array.isArray(viewData.above) ? viewData.above : (viewData.above?.values || [])

                for (let i = 0; i < newData.length; i++) {
                    // Ensure candle array has slots for color, below, above (indices 6, 7, 8)
                    while (newData[i].length < 9) {
                        newData[i].push('')
                    }
                    // Apply color
                    if (i < colors.length && colors[i]) {
                        newData[i][6] = colors[i]
                    }
                    // Apply below marker
                    if (i < below.length) {
                        newData[i][7] = below[i] || ''
                    }
                    // Apply above marker
                    if (i < above.length) {
                        newData[i][8] = above[i] || ''
                    }
                }
            } else {
                // No view selected - clear colors and markers
                for (let i = 0; i < newData.length; i++) {
                    if (newData[i].length > 6) newData[i][6] = ''
                    if (newData[i].length > 7) newData[i][7] = ''
                    if (newData[i].length > 8) newData[i][8] = ''
                }
            }

            // Update the chart candle data
            this.$set(this.chart.data.chart, 'data', newData)

            // Handle view-specific offchart indicators
            this.applyViewOffchart(viewData)
        },
        applyViewOffchart(viewData) {
            const tfData = this.currentTimeframe && this.charts[this.currentTimeframe]

            // Only include base offchart if NO view is active (displayedView is empty)
            let combinedOffchart = []

            if (!this.displayedView) {
                // No view selected - show base offchart
                combinedOffchart = JSON.parse(JSON.stringify(tfData?.offchart || []))
            } else {
                // View is active - only show view-specific offchart, hide base
                combinedOffchart = JSON.parse(JSON.stringify(viewData?.offchart || []))
            }

            // Get current indicator names
            const currentIndicatorNames = combinedOffchart.map(ind => ind.name)

            // Check if indicator set matches saved preferences
            const sameSet = this.lastIndicatorSet.length === currentIndicatorNames.length &&
                this.lastIndicatorSet.every(name => currentIndicatorNames.includes(name))

            if (sameSet && currentIndicatorNames.length > 0) {
                // Same indicator set - apply saved visibility preferences
                for (let i = 0; i < combinedOffchart.length; i++) {
                    const name = combinedOffchart[i].name
                    if (name in this.indicatorVisibility) {
                        combinedOffchart[i].settings = combinedOffchart[i].settings || {}
                        combinedOffchart[i].settings.display = this.indicatorVisibility[name]
                    }
                }
            } else if (currentIndicatorNames.length > 0) {
                // Different indicator set - default to first visible only
                this.indicatorVisibility = {}
                for (let i = 0; i < combinedOffchart.length; i++) {
                    const name = combinedOffchart[i].name
                    const isVisible = (i === 0)  // Only first is visible
                    combinedOffchart[i].settings = combinedOffchart[i].settings || {}
                    combinedOffchart[i].settings.display = isVisible
                    this.indicatorVisibility[name] = isVisible
                }
                this.lastIndicatorSet = [...currentIndicatorNames]
            }

            // Update chart offchart
            this.$set(this.chart.data, 'offchart', combinedOffchart)

            // Force chart reset to properly render new offchart panels
            this.$nextTick(() => {
                if (this.$refs.tradingVue) {
                    this.$refs.tradingVue.resetChart(false)
                }
            })
        },
        async loadDataFileList() {
            try {
                const response = await fetch('/data-files')
                if (response.ok) {
                    this.dataFiles = await response.json()
                }
            } catch (error) {
                console.error('Error loading file list:', error)
            }
        },
        initializeChart(data) {
            // Check if this is single-format (has chart.data array at root)
            if (data.chart && Array.isArray(data.chart.data)) {
                // Single-timeframe format (data.json style)
                this.charts = { 'default': data }
                this.currentTimeframe = 'default'
                this.selectedTimeframe = 0
                this.originalChartData = JSON.parse(JSON.stringify(data.chart.data))
                this.extractCandleColoringOptions(data, 'default')
                this.chart = new DataCube(this.prepareChartData(data, 'default'))
            } else {
                // Multi-timeframe format (data_tf.json style)
                this.charts = data
                const timeframes = Object.keys(data)
                if (timeframes.length > 0) {
                    const firstTf = timeframes[0]
                    const firstTfData = data[firstTf]
                    this.currentTimeframe = firstTf
                    this.selectedTimeframe = 0
                    this.originalChartData = JSON.parse(JSON.stringify(firstTfData.chart.data))
                    this.extractCandleColoringOptions(firstTfData, firstTf)
                    this.chart = new DataCube(this.prepareChartData(firstTfData, firstTf))
                }
            }

            // Set initial displayedView (fallback to first view since selectedView is empty on init)
            const availableViews = this.candleColoringOptions.map(opt => opt.title)
            if (availableViews.length > 0) {
                this.displayedView = availableViews[0]
                this.$nextTick(() => {
                    this.applyCurrentColoring()
                })
            }
        },
        async onFileSelected(filename) {
            try {
                // Save current view range and dataset bounds before loading new data
                let savedRange = null
                let prevStart = null
                let prevEnd = null
                if (this.$refs.tradingVue && this.$refs.tradingVue.$refs.chart) {
                    savedRange = this.$refs.tradingVue.getRange()
                    const ohlcv = this.$refs.tradingVue.$refs.chart.ohlcv
                    if (ohlcv && ohlcv.length >= 2) {
                        prevStart = ohlcv[0][0]
                        prevEnd = ohlcv[ohlcv.length - 1][0]
                    }
                }

                const response = await fetch(`/data/${filename}`)
                if (!response.ok) {
                    throw new Error(`Failed to load ${filename}`)
                }
                const data = await response.json()
                this.currentDataFile = filename
                this.selectedDataFile = filename

                this.selectedTimeframe = 0

                // Check if this is single-format (has chart.data array at root)
                let newStart = null
                let newEnd = null
                if (data.chart && Array.isArray(data.chart.data)) {
                    // Single-timeframe format (data.json style)
                    this.charts = { 'default': data }
                    this.currentTimeframe = 'default'
                    this.originalChartData = JSON.parse(JSON.stringify(data.chart.data))
                    this.extractCandleColoringOptions(data, 'default')
                    if (data.chart.data.length >= 2) {
                        newStart = data.chart.data[0][0]
                        newEnd = data.chart.data[data.chart.data.length - 1][0]
                    }
                    this.chart = new DataCube(this.prepareChartData(data, 'default'))
                } else {
                    // Multi-timeframe format (data_tf.json style)
                    this.charts = data
                    const timeframes = Object.keys(data)
                    if (timeframes.length > 0) {
                        const firstTf = timeframes[0]
                        const firstTfData = data[firstTf]
                        this.currentTimeframe = firstTf
                        this.originalChartData = JSON.parse(JSON.stringify(firstTfData.chart.data))
                        this.extractCandleColoringOptions(firstTfData, firstTf)
                        if (firstTfData.chart.data.length >= 2) {
                            newStart = firstTfData.chart.data[0][0]
                            newEnd = firstTfData.chart.data[firstTfData.chart.data.length - 1][0]
                        }
                        this.chart = new DataCube(this.prepareChartData(firstTfData, firstTf))
                    }
                }

                // Determine displayedView based on selectedView availability
                const availableViews = this.candleColoringOptions.map(opt => opt.title)
                if (availableViews.includes(this.selectedView)) {
                    // Selected view exists - use it
                    this.displayedView = this.selectedView
                } else if (availableViews.length > 0) {
                    // Fallback to first view for display only (keep selectedView unchanged)
                    this.displayedView = availableViews[0]
                } else {
                    this.displayedView = ''
                }

                // Apply displayed view
                this.$nextTick(() => {
                    this.applyCurrentColoring()
                })

                // Check if datasets have same bounds (can restore range without flash)
                const sameBounds = savedRange && savedRange[0] && savedRange[1] &&
                    prevStart !== null && newStart === prevStart && newEnd === prevEnd

                if (sameBounds) {
                    // Same dataset bounds - restore range without reset to avoid flash
                    this.$nextTick(() => {
                        if (this.$refs.tradingVue) {
                            this.$refs.tradingVue.setRange(savedRange[0], savedRange[1])
                        }
                    })
                } else {
                    // Different dataset - force chart to redraw
                    this.$nextTick(() => {
                        if (this.$refs.tradingVue) {
                            this.$refs.tradingVue.resetChart()
                        }
                    })
                }
            } catch (error) {
                console.error('Error loading data file:', error)
            }
        },
        openIndicatorSettings(indicatorInfo) {
            this.indicatorSettingsData = indicatorInfo
            this.indicatorSettingsOpen = true
        },
        closeIndicatorSettings() {
            this.indicatorSettingsOpen = false
            this.indicatorSettingsData = null
        },
        applyIndicatorSettings(payload) {
            // payload: { gridId, indicatorIndex, newType, newSettings }
            const { gridId, indicatorIndex, newType, newSettings } = payload

            // Update the offchart data type and settings immediately
            if (this.chart.data.offchart && this.chart.data.offchart[indicatorIndex]) {
                this.$set(this.chart.data.offchart[indicatorIndex], 'type', newType)

                // Merge new settings with existing settings
                const currentSettings = this.chart.data.offchart[indicatorIndex].settings || {}
                const mergedSettings = Object.assign({}, currentSettings, newSettings)
                this.$set(this.chart.data.offchart[indicatorIndex], 'settings', mergedSettings)

                // Also update in the original charts data to persist across timeframe changes
                if (this.currentTimeframe && this.charts[this.currentTimeframe]) {
                    const tfData = this.charts[this.currentTimeframe]
                    if (tfData.offchart && tfData.offchart[indicatorIndex]) {
                        tfData.offchart[indicatorIndex].type = newType
                        tfData.offchart[indicatorIndex].settings = mergedSettings
                    }
                }

                // Update the indicatorSettingsData so the modal reflects current state
                if (this.indicatorSettingsData) {
                    this.indicatorSettingsData.type = newType
                    this.indicatorSettingsData.settings = mergedSettings
                }
            }
            // Modal stays open - user clicks Close to dismiss
        },
        toggleIndicatorVisibility(index) {
            if (!this.chart.data.offchart || !this.chart.data.offchart[index]) return

            const indicator = this.chart.data.offchart[index]
            const indicatorName = indicator.name
            const currentSettings = indicator.settings || {}
            const isCurrentlyVisible = currentSettings.display !== false
            const newDisplay = !isCurrentlyVisible

            // Save visibility preference by indicator name
            this.indicatorVisibility[indicatorName] = newDisplay

            // Update settings with new display value
            const newSettings = Object.assign({}, currentSettings, { display: newDisplay })
            this.$set(this.chart.data.offchart[index], 'settings', newSettings)

            // Also update in the original charts data to persist across timeframe changes
            if (this.currentTimeframe && this.charts[this.currentTimeframe]) {
                const tfData = this.charts[this.currentTimeframe]
                if (tfData.offchart && tfData.offchart[index]) {
                    tfData.offchart[index].settings = newSettings
                }
            }

            // Force chart reset to properly recreate overlays and recalculate layout
            // resetChart(false) preserves range and uses double nextTick for proper initialization
            this.$nextTick(() => {
                if (this.$refs.tradingVue) {
                    this.$refs.tradingVue.resetChart(false)
                }
            })
        }
    },
    mounted() {
        window.addEventListener('resize', this.onResize)
        this.loadDataFileList()

        // Initialize with imported data
        this.initializeChart(Data)

        this.$nextTick(() => {
            window.dc = this.chart
            window.tv = this.$refs.tradingVue
        })
    },
    beforeDestroy() {
        window.removeEventListener('resize', this.onResize)
    },
    data() {
        return {
            charts: Data,
            chart: new DataCube(),
            width: window.innerWidth,
            height: window.innerHeight,
            overlays: [BuysAndSells,Balance,LineTracker],
            config: {
                DEFAULT_LEN: 200,
                TB_BORDER: 5,
                CANDLEW: 0.9,
                GRIDX: 200,
                VOLSCALE: 0.1,
                RIGHTBAR: 250
            },
            log_scale: true,
            dataFiles: [],
            currentDataFile: 'data.json',
            selectedDataFile: 'data.json',
            currentTimeframe: null,
            selectedTimeframe: 0,
            candleColoringOptions: [],
            selectedView: '',      // User's persistent choice (survives file switches)
            displayedView: '',     // Actually rendered view (may differ if selectedView unavailable)
            indicatorVisibility: {},  // Saved visibility preferences by indicator name
            lastIndicatorSet: [],     // Track which indicators were in the last applied set
            originalChartData: null,
            rectDrawMode: false,
            isDrawing: false,
            rectStart: null,
            rectCurrent: null,
            indicatorSettingsOpen: false,
            indicatorSettingsData: null
        };
    },
    watch: {
        log_scale(value) {
            if (this.chart.data.chart) {
                this.$set(this.chart.data.chart, 'grid', {
                    logScale: value
                })
            }
        }
    }
};
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
    background-color: #121826; /* Match toolbar background to fill bottom-left corner */
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
    border-left: 5px dotted #8282827d; /* Match toolbar border style (TB_BORDER: 5) */
    display: flex;
    align-items: center;
    padding: 0 15px;
    margin-left: 52px; /* Account for left toolbar width minus border */
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
</style>
