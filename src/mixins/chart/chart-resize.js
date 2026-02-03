// Chart grid resize and minimize functionality
// Performance optimized with throttled resize operations

export default {
    methods: {
        on_resize_grids(e) {
            this.isResizing = true
            this.customGridHeights[e.gridAbove] = e.heightAbove
            this.customGridHeights[e.gridBelow] = e.heightBelow
            // Use throttled update during resize for better performance
            this._throttledResizeUpdate()
        },

        // Throttled resize update - max 60fps during resize operations
        _throttledResizeUpdate() {
            if (this._resizeThrottleRAF) return

            this._resizeThrottleRAF = requestAnimationFrame(() => {
                this._resizeThrottleRAF = null
                this.update_layout(false, true)
            })
        },

        on_resize_complete() {
            const grids = this.chartLayout.grids
            grids.forEach((g, i) => {
                if (!this.minimizedGrids[i]) {
                    this.savedGridHeights[i] = g.height
                }
            })
            this.isResizing = false
        },

        on_toggle_minimize(gridId) {
            const isMinimized = this.minimizedGrids[gridId]

            if (isMinimized) {
                this.minimizedGrids[gridId] = false
                if (this.savedGridHeights[gridId]) {
                    this.customGridHeights[gridId] = this.savedGridHeights[gridId]
                } else {
                    delete this.customGridHeights[gridId]
                }
            } else {
                const currentHeight = this.chartLayout.grids[gridId]?.height
                if (currentHeight) {
                    this.savedGridHeights[gridId] = currentHeight
                }
                this.minimizedGrids[gridId] = true
            }

            this.redistribute_heights(gridId, isMinimized)
            this.update_layout(false, true)
        },

        redistribute_heights(changedGridId, wasMinimized) {
            const grids = this.chartLayout.grids
            const MINIMIZED_HEIGHT = 28
            const MIN_MAIN_CHART_HEIGHT = 100
            const MIN_OFFCHART_HEIGHT = 50

            if (wasMinimized) {
                const restoreHeight = this.savedGridHeights[changedGridId] || 150
                let remainingDelta = restoreHeight - MINIMIZED_HEIGHT

                const mainChartHeight = this.customGridHeights[0] || grids[0]?.height || 100
                const mainAvailable = Math.max(0, mainChartHeight - MIN_MAIN_CHART_HEIGHT)
                const takeFromMain = Math.min(remainingDelta, mainAvailable)

                if (takeFromMain > 0) {
                    this.customGridHeights[0] = mainChartHeight - takeFromMain
                    remainingDelta -= takeFromMain
                }

                if (remainingDelta > 0) {
                    for (let i = changedGridId - 1; i >= 1; i--) {
                        if (this.minimizedGrids[i]) continue

                        const gridHeight = this.customGridHeights[i] || grids[i]?.height || 100
                        const available = Math.max(0, gridHeight - MIN_OFFCHART_HEIGHT)
                        const takeAmount = Math.min(remainingDelta, available)

                        if (takeAmount > 0) {
                            this.customGridHeights[i] = gridHeight - takeAmount
                            remainingDelta -= takeAmount
                        }

                        if (remainingDelta <= 0) break
                    }
                }

                const actualHeight = restoreHeight - remainingDelta
                if (actualHeight > MINIMIZED_HEIGHT) {
                    this.customGridHeights[changedGridId] = actualHeight
                }
            } else {
                const gridAboveId = changedGridId - 1
                if (gridAboveId < 0) return

                let targetGridId = gridAboveId
                if (this.minimizedGrids[gridAboveId]) {
                    for (let i = gridAboveId; i >= 0; i--) {
                        if (!this.minimizedGrids[i]) {
                            targetGridId = i
                            break
                        }
                    }
                }

                const targetHeight = this.customGridHeights[targetGridId] || grids[targetGridId]?.height || 100
                const savedHeight = this.savedGridHeights[changedGridId] || 150
                const heightDelta = savedHeight - MINIMIZED_HEIGHT
                this.customGridHeights[targetGridId] = targetHeight + heightDelta
            }
        },

        minimize_all_offcharts() {
            const grids = this.chartLayout.grids
            const MINIMIZED_HEIGHT = 28

            let hasExpandedOffchart = false
            for (let i = 1; i < grids.length; i++) {
                if (!this.minimizedGrids[i]) {
                    hasExpandedOffchart = true
                    break
                }
            }

            if (hasExpandedOffchart) {
                let totalHeightGained = 0

                for (let i = 1; i < grids.length; i++) {
                    if (!this.minimizedGrids[i]) {
                        const currentHeight = this.customGridHeights[i] || grids[i]?.height
                        if (currentHeight) {
                            this.savedGridHeights[i] = currentHeight
                            totalHeightGained += currentHeight - MINIMIZED_HEIGHT
                        }
                        this.minimizedGrids[i] = true
                    }
                }

                const mainHeight = this.customGridHeights[0] || grids[0]?.height || 100
                this.customGridHeights[0] = mainHeight + totalHeightGained
            } else {
                let totalHeightNeeded = 0

                for (let i = 1; i < grids.length; i++) {
                    const restoreHeight = this.savedGridHeights[i] || 150
                    totalHeightNeeded += restoreHeight - MINIMIZED_HEIGHT
                }

                const mainHeight = this.customGridHeights[0] || grids[0]?.height || 100
                const MIN_MAIN_CHART_HEIGHT = 100
                const available = Math.max(0, mainHeight - MIN_MAIN_CHART_HEIGHT)
                const takeFromMain = Math.min(totalHeightNeeded, available)

                if (takeFromMain > 0) {
                    this.customGridHeights[0] = mainHeight - takeFromMain
                }

                const ratio = takeFromMain / totalHeightNeeded
                for (let i = 1; i < grids.length; i++) {
                    this.minimizedGrids[i] = false
                    const restoreHeight = this.savedGridHeights[i] || 150
                    const actualHeight = MINIMIZED_HEIGHT + (restoreHeight - MINIMIZED_HEIGHT) * (ratio < 1 ? ratio : 1)
                    this.customGridHeights[i] = actualHeight
                }
            }

            this.update_layout(false, true)
        }
    },

    data() {
        return {
            customGridHeights: {},
            minimizedGrids: {},
            savedGridHeights: {},
            isResizing: false
        }
    }
}
