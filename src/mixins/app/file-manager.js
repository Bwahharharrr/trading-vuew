// File management mixin - handles file I/O and localStorage persistence

import Utils from '../../stuff/utils.js'

export default {
    data() {
        return {
            dataFiles: [],
            currentDataFile: 'data.json',
            selectedDataFile: 'data.json',
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
                    // Single-timeframe format (data.json style)
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
                    // Multi-timeframe format (data_tf.json style)
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

                // Build combined offchart with persistent indicators BEFORE creating DataCube
                // Pass originalChartData to avoid re-copying chart.data (applyCurrentColoring overwrites it)
                const preparedData = this.prepareChartData(firstTfData, firstTf, this.originalChartData)
                preparedData.offchart = this.buildOffchartData(clippedIndicators, viewData)

                // Create DataCube with complete offchart data
                this.chart = new this.DataCubeClass(preparedData)

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

        // localStorage persistence methods
        saveStateToStorage() {
            const state = {
                selectedDataFile: this.selectedDataFile,
                selectedView: this.selectedView,
                log_scale: this.log_scale,
                indicatorVisibility: this.indicatorVisibility,
                indicatorSettings: this.getIndicatorSettings(),
                persistentIndicatorVisibility: this.persistentIndicatorVisibility,
                accordionExpandedViews: this.accordionExpandedViews
            }
            localStorage.setItem('trading-vue-state', JSON.stringify(state))
        },

        loadStateFromStorage() {
            try {
                const saved = localStorage.getItem('trading-vue-state')
                return saved ? JSON.parse(saved) : null
            } catch (e) {
                console.error('Failed to parse saved state:', e)
                return null
            }
        }
    },
    watch: {
        dataFiles(newFiles) {
            // Load pending file when file list arrives
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
            } else if (this.pendingFileLoad && newFiles.length > 0) {
                // Saved file no longer exists - clear pending
                this.pendingFileLoad = null
                this.pendingIndicatorSettings = null
            }
        }
    }
}
