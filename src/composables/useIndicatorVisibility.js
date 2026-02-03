// Composable for indicator visibility management
// Consolidates toggle methods from indicator-manager.js

import { reactive } from 'vue'

/**
 * Creates indicator visibility state and toggle methods
 * @param {Function} onToggle - callback when visibility changes (receives name, visible, isPersistent)
 * @returns {Object} visibility state and methods
 */
export function useIndicatorVisibility(onToggle) {
    // Regular indicator visibility by name
    const visibility = reactive({})
    // Persistent indicator visibility by name
    const persistentVisibility = reactive({})
    // Accordion expanded state by group name
    const accordionExpanded = reactive({})

    /**
     * Check if an indicator is visible
     * @param {string} name - indicator name
     * @param {boolean} isPersistent - whether it's a persistent indicator
     * @returns {boolean} visibility state
     */
    function isVisible(name, isPersistent = false) {
        const target = isPersistent ? persistentVisibility : visibility
        return target[name] !== false
    }

    /**
     * Toggle indicator visibility
     * @param {string} name - indicator name
     * @param {boolean} isPersistent - whether it's a persistent indicator
     */
    function toggle(name, isPersistent = false) {
        const target = isPersistent ? persistentVisibility : visibility
        const newValue = !isVisible(name, isPersistent)
        target[name] = newValue

        if (onToggle) {
            onToggle(name, newValue, isPersistent)
        }
    }

    /**
     * Set visibility for an indicator
     * @param {string} name - indicator name
     * @param {boolean} visible - visibility state
     * @param {boolean} isPersistent - whether it's a persistent indicator
     */
    function setVisibility(name, visible, isPersistent = false) {
        const target = isPersistent ? persistentVisibility : visibility
        target[name] = visible
    }

    /**
     * Check if accordion section is expanded
     * @param {string} groupName - group/view name
     * @returns {boolean} expanded state
     */
    function isAccordionExpanded(groupName) {
        return accordionExpanded[groupName] === true
    }

    /**
     * Toggle accordion section
     * @param {string} groupName - group/view name
     */
    function toggleAccordion(groupName) {
        accordionExpanded[groupName] = !isAccordionExpanded(groupName)
    }

    /**
     * Restore visibility state from saved object
     * @param {Object} savedVisibility - saved regular visibility
     * @param {Object} savedPersistentVisibility - saved persistent visibility
     * @param {Object} savedAccordion - saved accordion state
     */
    function restore(savedVisibility = {}, savedPersistentVisibility = {}, savedAccordion = {}) {
        Object.assign(visibility, savedVisibility)
        Object.assign(persistentVisibility, savedPersistentVisibility)
        Object.assign(accordionExpanded, savedAccordion)
    }

    /**
     * Get current state for persistence
     * @returns {Object} current visibility state
     */
    function getState() {
        return {
            visibility: { ...visibility },
            persistentVisibility: { ...persistentVisibility },
            accordionExpanded: { ...accordionExpanded }
        }
    }

    return {
        visibility,
        persistentVisibility,
        accordionExpanded,
        isVisible,
        toggle,
        setVisibility,
        isAccordionExpanded,
        toggleAccordion,
        restore,
        getState
    }
}

export default useIndicatorVisibility
