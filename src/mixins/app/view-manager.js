// View management mixin - handles view selection and candle coloring

import Utils from '../../stuff/utils.js'

export default {
    data() {
        return {
            candleColoringOptions: [],
            selectedView: '',      // User's persistent choice (survives file switches)
            displayedView: '',     // Actually rendered view (may differ if selectedView unavailable)
            originalChartData: null
        }
    },
    methods: {
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
            const cleaned = Utils.fastDeepCopy(chartData)
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
            // Force chart reset to render offchart changes
            this.$nextTick(() => {
                if (this.$refs.tradingVue) {
                    this.$refs.tradingVue.resetChart(false)
                }
            })
            this.saveStateToStorage()
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
            const newData = Utils.fastDeepCopy(this.originalChartData)
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
            this.chart.data.chart.data = newData

            // Handle view-specific offchart indicators
            this.applyViewOffchart(viewData)
        },

        applyViewOffchart(viewData) {
            const tfData = this.currentTimeframe && this.charts[this.currentTimeframe]

            // Get viewData if not passed (for calls from toggleViewIndicatorVisibility)
            if (!viewData && this.displayedView) {
                const selectedOption = this.candleColoringOptions.find(opt => opt.title === this.displayedView)
                if (selectedOption && selectedOption.viewData) {
                    viewData = selectedOption.viewData
                }
            }

            // Build combined offchart using helper
            let combinedOffchart = this.buildOffchartData(this.persistentIndicatorsClipped, viewData)

            // Track persistent indicator names for visibility preference handling
            const persistentNames = new Set(this.persistentIndicatorsClipped.map(ind => ind.name))

            // Handle base offchart when no view is selected
            if (!this.displayedView && tfData?.offchart) {
                combinedOffchart = combinedOffchart.concat(Utils.fastDeepCopy(tfData.offchart))
            }

            // Get current indicator names
            const currentIndicatorNames = combinedOffchart.map(ind => ind.name)

            // Check if indicator set matches saved preferences
            const sameSet = this.lastIndicatorSet.length === currentIndicatorNames.length &&
                this.lastIndicatorSet.every(name => currentIndicatorNames.includes(name))

            if (sameSet && currentIndicatorNames.length > 0) {
                // Same indicator set - apply saved visibility preferences (skip persistent indicators)
                for (let i = 0; i < combinedOffchart.length; i++) {
                    const name = combinedOffchart[i].name
                    // Don't override persistent indicators - they use persistentIndicatorVisibility
                    if (!persistentNames.has(name) && name in this.indicatorVisibility) {
                        combinedOffchart[i].settings = combinedOffchart[i].settings || {}
                        combinedOffchart[i].settings.display = this.indicatorVisibility[name]
                    }
                }
            } else if (currentIndicatorNames.length > 0) {
                // Different indicator set - default to first non-persistent visible only
                this.indicatorVisibility = {}
                let firstNonPersistent = true
                for (let i = 0; i < combinedOffchart.length; i++) {
                    const name = combinedOffchart[i].name
                    // Don't override persistent indicators - they keep their settings
                    if (persistentNames.has(name)) continue
                    const isVisible = firstNonPersistent  // Only first non-persistent is visible
                    firstNonPersistent = false
                    combinedOffchart[i].settings = combinedOffchart[i].settings || {}
                    combinedOffchart[i].settings.display = isVisible
                    this.indicatorVisibility[name] = isVisible
                }
                this.lastIndicatorSet = [...currentIndicatorNames]
            }

            // Update chart offchart
            this.chart.data.offchart = combinedOffchart
        },

        buildOffchartData(persistentIndicators, viewData = null) {
            // Start with visible persistent indicators
            const visiblePersistent = persistentIndicators.filter(
                ind => ind.settings?.display !== false
            )
            let combinedOffchart = Utils.fastDeepCopy(visiblePersistent)

            // Add view-specific offchart if view is active
            if (this.displayedView && viewData?.offchart) {
                combinedOffchart = combinedOffchart.concat(Utils.fastDeepCopy(viewData.offchart))
            }

            return combinedOffchart
        }
    }
}
