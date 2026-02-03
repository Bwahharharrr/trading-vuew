// Chart state mixin - handles chart initialization, timeframe selection, and layout

export default {
    data() {
        return {
            charts: {},
            currentTimeframe: null,
            selectedTimeframe: 0,
            log_scale: true,
            width: window.innerWidth,
            height: window.innerHeight,
            config: {
                DEFAULT_LEN: 200,
                TB_BORDER: 5,
                CANDLEW: 0.9,
                GRIDX: 200,
                VOLSCALE: 0.1,
                RIGHTBAR: 250
            }
        }
    },
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
        }
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
            this.chart = new this.DataCubeClass(this.prepareChartData(chartData, tf))
            // Apply displayed view and re-clip persistent indicators
            this.$nextTick(() => {
                this.clipPersistentIndicators()
                this.applyCurrentColoring()
            })
            // Force chart to redraw
            this.$nextTick(() => {
                if (this.$refs.tradingVue) {
                    this.$refs.tradingVue.resetChart()
                }
            })
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
                this.chart = new this.DataCubeClass(this.prepareChartData(data, 'default'))
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
                    this.chart = new this.DataCubeClass(this.prepareChartData(firstTfData, firstTf))
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
        }
    },
    watch: {
        log_scale(value) {
            if (this.chart.data.chart) {
                this.chart.data.chart.grid = {
                    logScale: value
                }
            }
            this.saveStateToStorage()
        }
    }
}
