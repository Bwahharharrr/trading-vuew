// File management mixin - handles file I/O, file metadata extraction,
// and split storage (per-tab vs global).

import Utils from '../../stuff/utils.js'

// Storage key constants
const SESSION_STATE_KEY = 'trading-vue-state-tab'   // per-tab: file + indicator settings
const LOCAL_STATE_KEY   = 'trading-vue-state'        // global: prefs (kept for back-compat)

export default {
    data() {
        return {
            dataFiles: [],
            currentDataFile: '',
            selectedDataFile: '',
            // Identity + ws + indicators_url for the currently-loaded chart file.
            // Set in onFileSelected from data[firstTf]._meta. ws-manager watches
            // this and connects/reconnects accordingly; indicator-manager
            // watches it and re-fetches the matching indicators file.
            // null when the loaded file has no _meta (legacy / build_model
            // without _meta would also be null — they get no live feed).
            currentFileMeta: null,
            pendingFileLoad: null,           // File to load after file list arrives
            pendingIndicatorSettings: null   // Settings to apply after file loads
        }
    },
    methods: {
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

        async onFileSelected(filename) {
            // Validate filename to prevent path traversal
            if (!filename || /[\/\\]|\.\./.test(filename)) {
                console.error('Invalid filename:', filename)
                return
            }
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
                let firstTf, firstTfData
                if (data.chart && Array.isArray(data.chart.data)) {
                    // Single-timeframe format (legacy data.json style)
                    this.charts = { 'default': data }
                    this.currentTimeframe = 'default'
                    firstTf = 'default'
                    firstTfData = data
                    // PERFORMANCE: Use fastDeepCopy instead of JSON.parse(stringify)
                    this.originalChartData = Utils.fastDeepCopy(data.chart.data)
                    this.extractCandleColoringOptions(data, 'default')
                    if (data.chart.data.length >= 2) {
                        newStart = data.chart.data[0][0]
                        newEnd = data.chart.data[data.chart.data.length - 1][0]
                    }
                } else {
                    // Multi-timeframe format (data_<...>.json style)
                    this.charts = data
                    const timeframes = Object.keys(data)
                    if (timeframes.length > 0) {
                        firstTf = timeframes[0]
                        firstTfData = data[firstTf]
                        this.currentTimeframe = firstTf
                        // PERFORMANCE: Use fastDeepCopy instead of JSON.parse(stringify)
                        this.originalChartData = Utils.fastDeepCopy(firstTfData.chart.data)
                        this.extractCandleColoringOptions(firstTfData, firstTf)
                        if (firstTfData.chart.data.length >= 2) {
                            newStart = firstTfData.chart.data[0][0]
                            newEnd = firstTfData.chart.data[firstTfData.chart.data.length - 1][0]
                        }
                    }
                }

                // Extract _meta (if present). Files written by qb-new live or
                // build_model carry a per-tf-payload _meta block; legacy files
                // (committed bootstrap data.json, hand-edited files) won't.
                // Null _meta → no live WS, no per-file indicators fetch.
                this.currentFileMeta = (firstTfData && firstTfData._meta) ? firstTfData._meta : null

                // Determine displayedView based on selectedView availability
                const availableViews = this.candleColoringOptions.map(opt => opt.title)
                if (availableViews.includes(this.selectedView)) {
                    this.displayedView = this.selectedView
                } else if (availableViews.length > 0) {
                    this.displayedView = availableViews[0]
                } else {
                    this.displayedView = ''
                }

                // Pre-clip persistent indicators using the new chart data
                const clippedIndicators = this.clipPersistentIndicators(firstTf, firstTfData?.chart?.data)

                // Get view data for current displayedView
                let viewData = null
                if (this.displayedView) {
                    const selectedOption = this.candleColoringOptions.find(opt => opt.title === this.displayedView)
                    viewData = selectedOption?.viewData
                }

                // Guard: a multi-timeframe file with no timeframes leaves
                // firstTfData undefined. prepareChartData would then destructure
                // chartData.chart off undefined and throw, so bail out cleanly.
                if (!firstTfData) {
                    console.error('No loadable timeframe data in file:', filename)
                    return
                }

                // Build combined offchart with persistent indicators BEFORE creating DataCube
                // Pass originalChartData to avoid re-copying chart.data (applyCurrentColoring overwrites it)
                const preparedData = this.prepareChartData(firstTfData, firstTf, this.originalChartData)
                preparedData.offchart = this.buildOffchartData(clippedIndicators, viewData)

                // Create DataCube with complete offchart data
                this.chart = new this.DataCubeClass(preparedData)
                window.dc = this.chart  // Keep global reference in sync

                // Check if datasets have same bounds
                const sameBounds = savedRange && savedRange[0] && savedRange[1] &&
                    prevStart !== null && newStart === prevStart && newEnd === prevEnd

                // Apply candle coloring and reset chart
                this.$nextTick(() => {
                    this.applyCurrentColoring()

                    if (this.$refs.tradingVue) {
                        this.$refs.tradingVue.resetChart(!sameBounds)
                    }

                    // Restore range if same bounds (needs double nextTick for chart to initialize)
                    if (sameBounds && savedRange) {
                        this.$nextTick(() => {
                            this.$nextTick(() => {
                                if (this.$refs.tradingVue) {
                                    this.$refs.tradingVue.setRange(savedRange[0], savedRange[1])
                                }
                            })
                        })
                    }
                })

                this.saveStateToStorage()
            } catch (error) {
                console.error('Error loading data file:', error)
            }
        },

        // ── Persistence: split per-tab state (sessionStorage) from global
        //    preferences (localStorage). Per-tab keys live in sessionStorage so
        //    multiple tabs can view different files without trampling each
        //    other's selection on reload.
        saveStateToStorage() {
            const tabState = {
                selectedDataFile: this.selectedDataFile,
                indicatorSettings: this.getIndicatorSettings(),
            }
            const globalState = {
                selectedView: this.selectedView,
                log_scale: this.log_scale,
                indicatorVisibility: this.indicatorVisibility,
                persistentIndicatorVisibility: this.persistentIndicatorVisibility,
                accordionExpandedViews: this.accordionExpandedViews,
                // Corky: enabled indicators + hidden view-layers per venue|symbol
                // (survives reload as well as tf-switch).
                corkyEnabled: this.corkyEnabled,
                // Corky: last-viewed { venue, symbol, timeframe } — reopened on the
                // next load (incl. after a full browser restart; localStorage).
                corkyLast: this.corkyLast,
                // Multi-tab: the whole chart-tab set (selections + active index) so
                // a reload restores every open chart. Back-compat: when absent,
                // boot falls back to the single corkyLast.
                corkyTabs: typeof this.serializeChartTabs === 'function' ? this.serializeChartTabs() : null,
                // Right-panel width (user-resizable via its left-edge handle) +
                // collapsed state (the SOURCE-title toggle button).
                panelWidth: this.panelWidth,
                rightPanelCollapsed: this.rightPanelCollapsed,
                // Positions dock: open/height + active tab (gateway mode).
                positionsDockOpen: this.positionsDockOpen,
                positionsDockHeight: this.positionsDockHeight,
                positionsActiveTab: this.positionsActiveTab,
            }
            try {
                sessionStorage.setItem(SESSION_STATE_KEY, JSON.stringify(tabState))
            } catch (e) {
                console.error('Failed to write sessionStorage:', e)
            }
            try {
                localStorage.setItem(LOCAL_STATE_KEY, JSON.stringify(globalState))
            } catch (e) {
                console.error('Failed to write localStorage:', e)
            }
        },

        loadStateFromStorage() {
            let tab = {}, global = {}
            try {
                const t = sessionStorage.getItem(SESSION_STATE_KEY)
                if (t) tab = JSON.parse(t)
            } catch (e) {
                console.error('Failed to parse sessionStorage state:', e)
            }
            try {
                const g = localStorage.getItem(LOCAL_STATE_KEY)
                if (g) global = JSON.parse(g)
            } catch (e) {
                console.error('Failed to parse localStorage state:', e)
            }
            // Merge for back-compat with the previous single-store shape.
            // Tab state wins for per-tab keys; global wins for the rest.
            const merged = { ...global, ...tab }
            return Object.keys(merged).length ? merged : null
        }
    },
    watch: {
        dataFiles(newFiles) {
            // 1) Honour an explicit pending request (from ?file= URL param or
            //    sessionStorage restore) if the file still exists.
            if (this.pendingFileLoad && newFiles.includes(this.pendingFileLoad)) {
                this.onFileSelected(this.pendingFileLoad).then(() => {
                    this.applyRestoredIndicatorSettings(this.pendingIndicatorSettings)
                    this.pendingFileLoad = null
                    this.pendingIndicatorSettings = null
                }).catch(err => {
                    console.error('Failed to restore file selection:', err)
                    this.pendingFileLoad = null
                    this.pendingIndicatorSettings = null
                })
                return
            }
            // 2) Pending file no longer exists — drop it, fall through to
            //    auto-select.
            if (this.pendingFileLoad) {
                this.pendingFileLoad = null
                this.pendingIndicatorSettings = null
            }
            // 3) Auto-select: pick the first chart-loadable file
            //    (data_*.json). Skips data_alerts_/data_scorers_/target_
            //    by prefix so the default is the "main" chart, not an
            //    overlay-only variant.
            // Only in FILE mode — the default GATEWAY source must not load a
            // file underneath the gateway feed (both drive the same DataCube).
            if (this.feedMode === 'file' && !this.currentDataFile && newFiles.length > 0) {
                const first = newFiles.find(
                    f => f.startsWith('data_') &&
                         !f.startsWith('data_alerts_') &&
                         !f.startsWith('data_scorers_') &&
                         !f.startsWith('data_tf')
                )
                if (first) this.onFileSelected(first)
            }
        }
    }
}
