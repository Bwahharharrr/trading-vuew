// Composable for chart reset + save patterns
// Consolidates the 16+ repeated resetChart + saveState patterns

import { nextTick } from 'vue'

/**
 * Creates a reusable chart actions handler
 * @param {Ref} tradingVueRef - ref to the TradingVue component
 * @param {Function} saveStateFn - function to save state to storage
 * @returns {Object} chart action methods
 */
export function useChartActions(tradingVueRef, saveStateFn) {
    /**
     * Reset chart and save state in a single operation
     * @param {boolean} resetRange - whether to reset the range (default false)
     */
    function resetAndSave(resetRange = false) {
        nextTick(() => {
            if (tradingVueRef.value) {
                tradingVueRef.value.resetChart(resetRange)
            }
        })
        if (saveStateFn) {
            saveStateFn()
        }
    }

    /**
     * Reset chart only (no save)
     * @param {boolean} resetRange - whether to reset the range
     */
    function reset(resetRange = false) {
        nextTick(() => {
            if (tradingVueRef.value) {
                tradingVueRef.value.resetChart(resetRange)
            }
        })
    }

    /**
     * Get the TradingVue component instance
     * @returns {Object|null} TradingVue instance
     */
    function getInstance() {
        return tradingVueRef.value || null
    }

    return {
        resetAndSave,
        reset,
        getInstance
    }
}

export default useChartActions
