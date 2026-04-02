// Indicator management mixin - handles visibility toggles, accordion state, persistent indicators

export default {
    data() {
        return {
            indicatorVisibility: {},      // Saved visibility preferences by indicator name
            lastIndicatorSet: [],         // Track which indicators were in the last applied set
            indicatorSettingsOpen: false,
            indicatorSettingsData: null,
            // Persistent indicators (from indicators.json)
            persistentIndicatorsRaw: {},           // Raw data from indicators.json by timeframe
            persistentIndicatorsClipped: [],       // Clipped to current data file's date range
            persistentIndicatorVisibility: {},     // Visibility state by indicator name
            // Accordion state for indicator groups
            accordionExpandedViews: {}             // Track which accordion sections are expanded
        }
    },
    computed: {
        offchartIndicators() {
            if (!this.chart || !this.chart.data || !this.chart.data.offchart) {
                return []
            }
            // Get names of persistent indicators to exclude them from "Values" section
            const persistentNames = new Set(
                this.persistentIndicatorsClipped.map(ind => ind.name)
            )
            return this.chart.data.offchart
                .map((indicator, index) => ({
                    name: indicator.name || `Indicator ${index + 1}`,
                    type: indicator.type,
                    visible: indicator.settings?.display !== false,
                    index: index
                }))
                .filter(ind => !persistentNames.has(ind.name))
        },
        viewIndicatorsAccordion() {
            // Group persistent indicators by their group field for accordion display
            if (!this.persistentIndicatorsClipped.length) return []

            // Group indicators by their group field
            const groups = {}
            for (const ind of this.persistentIndicatorsClipped) {
                const groupName = ind.group || 'Ungrouped'
                if (!groups[groupName]) {
                    groups[groupName] = []
                }
                groups[groupName].push({
                    name: ind.name,
                    type: ind.type,
                    visible: this.persistentIndicatorVisibility[ind.name] !== false
                })
            }

            // Convert to accordion format
            return Object.entries(groups).map(([groupName, indicators]) => ({
                title: groupName,
                isExpanded: this.accordionExpandedViews[groupName] === true,
                isCurrentView: false,
                indicators: indicators
            }))
        }
    },
    methods: {
        async loadPersistentIndicators() {
            try {
                const response = await fetch('/data/indicators.json')
                if (response.ok) {
                    this.persistentIndicatorsRaw = await response.json()
                    this.clipPersistentIndicators()
                } else {
                    // indicators.json doesn't exist - that's fine
                    this.persistentIndicatorsRaw = {}
                    this.persistentIndicatorsClipped = []
                }
            } catch (e) {
                // Network error or parse error
                this.persistentIndicatorsRaw = {}
                this.persistentIndicatorsClipped = []
            }
        },

        clipPersistentIndicators(timeframe = null, chartData = null) {
            // Clip persistent indicators to match chart's date range
            // Uses binary search + slice instead of .filter() for O(log n) vs O(n)
            const tf = timeframe || this.currentTimeframe
            const candles = chartData || this.chart?.data?.chart?.data

            if (!candles?.length) {
                this.persistentIndicatorsClipped = []
                return []
            }

            const firstTs = candles[0][0]
            const lastTs = candles[candles.length - 1][0]

            // Get indicators for timeframe
            const tfIndicators = this.persistentIndicatorsRaw[tf]?.indicators || []

            const clipped = tfIndicators.map(indicator => {
                const data = indicator.data
                // Binary search: first index where data[mid][0] >= firstTs
                let lo = 0, hi = data.length
                while (lo < hi) {
                    const mid = (lo + hi) >> 1
                    if (data[mid][0] < firstTs) lo = mid + 1; else hi = mid
                }
                const startIdx = lo
                // Binary search: first index where data[mid][0] > lastTs
                lo = startIdx; hi = data.length
                while (lo < hi) {
                    const mid = (lo + hi) >> 1
                    if (data[mid][0] <= lastTs) lo = mid + 1; else hi = mid
                }
                return {
                    ...indicator,
                    group: indicator.group || 'Ungrouped',
                    data: data.slice(startIdx, lo),
                    settings: {
                        ...indicator.settings,
                        display: this.persistentIndicatorVisibility[indicator.name] !== false
                    }
                }
            })

            this.persistentIndicatorsClipped = clipped
            return clipped  // Return for immediate use
        },

        isPersistentIndicatorVisible(name) {
            return this.persistentIndicatorVisibility[name] !== false
        },

        togglePersistentIndicatorVisibility(name) {
            this.persistentIndicatorVisibility[name] = !this.isPersistentIndicatorVisible(name)
            this.clipPersistentIndicators()
            this.applyCurrentColoring()
            // Performance: Use targeted refresh instead of full chart reset
            this.$nextTick(() => {
                if (this.$refs.tradingVue) {
                    this.$refs.tradingVue.refreshOffchartOverlays()
                }
            })
            this.saveStateToStorage()
        },

        toggleAccordion(viewTitle) {
            this.accordionExpandedViews[viewTitle] = !this.accordionExpandedViews[viewTitle]
        },

        toggleViewIndicatorVisibility(viewTitle, indicatorName) {
            // Now uses persistentIndicatorVisibility since all indicators are persistent
            this.persistentIndicatorVisibility[indicatorName] = !this.isPersistentIndicatorVisible(indicatorName)
            this.clipPersistentIndicators()
            this.applyCurrentColoring()
            // Performance: Use targeted refresh instead of full chart reset
            this.$nextTick(() => {
                if (this.$refs.tradingVue) {
                    this.$refs.tradingVue.refreshOffchartOverlays()
                }
            })
            this.saveStateToStorage()
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
            this.chart.data.offchart[index].settings = newSettings

            // Also update in the original charts data to persist across timeframe changes
            if (this.currentTimeframe && this.charts[this.currentTimeframe]) {
                const tfData = this.charts[this.currentTimeframe]
                if (tfData.offchart && tfData.offchart[index]) {
                    tfData.offchart[index].settings = newSettings
                }
            }

            // Performance: Use targeted refresh instead of full chart reset
            this.$nextTick(() => {
                if (this.$refs.tradingVue) {
                    this.$refs.tradingVue.refreshOffchartOverlays()
                }
            })

            this.saveStateToStorage()
        },

        openIndicatorSettings(indicatorInfo) {
            this.indicatorSettingsData = indicatorInfo
            this.indicatorSettingsOpen = true
        },

        onCloseIndicator(payload) {
            const { name } = payload

            // Check if this is a persistent indicator
            const isPersistent = this.persistentIndicatorsClipped.some(ind => ind.name === name)

            if (isPersistent) {
                // Toggle off persistent indicator
                this.togglePersistentIndicatorVisibility(name)
            } else {
                // Find the indicator by name in the actual offchart array
                const offchartIndex = this.chart.data.offchart.findIndex(ind => ind.name === name)
                if (offchartIndex !== -1) {
                    this.toggleIndicatorVisibility(offchartIndex)
                }
            }
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
                this.chart.data.offchart[indicatorIndex].type = newType

                // Merge new settings with existing settings
                const currentSettings = this.chart.data.offchart[indicatorIndex].settings || {}
                const mergedSettings = Object.assign({}, currentSettings, newSettings)
                this.chart.data.offchart[indicatorIndex].settings = mergedSettings

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

                this.saveStateToStorage()
            }
            // Modal stays open - user clicks Close to dismiss
        },

        getIndicatorSettings() {
            // Extract current indicator settings by name
            const settings = {}
            if (this.chart && this.chart.data && this.chart.data.offchart) {
                for (const ind of this.chart.data.offchart) {
                    if (ind.name) {
                        settings[ind.name] = {
                            type: ind.type,
                            settings: ind.settings || {}
                        }
                    }
                }
            }
            return settings
        },

        applyRestoredIndicatorSettings(savedSettings) {
            if (!this.chart || !this.chart.data || !this.chart.data.offchart || !savedSettings) return

            for (let i = 0; i < this.chart.data.offchart.length; i++) {
                const ind = this.chart.data.offchart[i]
                const saved = savedSettings[ind.name]
                if (saved) {
                    if (saved.type) {
                        this.chart.data.offchart[i].type = saved.type
                    }
                    if (saved.settings) {
                        const merged = Object.assign({}, ind.settings || {}, saved.settings)
                        this.chart.data.offchart[i].settings = merged
                    }
                }
            }

            // Performance: Use targeted refresh instead of full chart reset
            this.$nextTick(() => {
                if (this.$refs.tradingVue) {
                    this.$refs.tradingVue.refreshOffchartOverlays()
                }
            })
        }
    }
}
