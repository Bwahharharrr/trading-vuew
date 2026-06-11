// Composable for canvas-based rendering
// Replaces canvas.js mixin with Vue 3 Composition API

import { ref, onBeforeUnmount, getCurrentInstance, nextTick, h } from 'vue'
import Utils from '../stuff/utils.js'

/**
 * Creates a canvas renderer with DPR scaling and RAF-based redraw
 * @param {Object} props - component props with tv_id, width, height
 * @param {Function} getRenderer - function that returns the renderer instance
 * @returns {Object} canvas methods and state
 */
export function useCanvasRenderer(props, getRenderer) {
    const canvasRef = ref(null)
    const attrs = ref({ width: 0, height: 0 })
    let componentId = null
    let rafId = null
    let pendingRedraw = false

    /**
     * Set up the canvas with proper DPR scaling
     */
    function setup() {
        const id = `${props.tv_id}-${componentId}-canvas`
        const canvas = document.getElementById(id)
        if (!canvas) return

        let dpr = window.devicePixelRatio || 1
        if (dpr < 1) dpr = 1

        canvas.style.width = `${attrs.value.width}px`
        canvas.style.height = `${attrs.value.height}px`

        nextTick(() => {
            const rect = canvas.getBoundingClientRect()
            canvas.width = rect.width * dpr
            canvas.height = rect.height * dpr

            const ctx = canvas.getContext('2d')
            ctx.scale(dpr, dpr)

            // Apply Brave browser fix
            if (!ctx.measureTextOrg) {
                ctx.measureTextOrg = ctx.measureText
            }
            ctx.measureText = text => Utils.measureText(ctx, text, props.tv_id)

            redraw()
        })
    }

    /**
     * Request a redraw on next animation frame (debounced)
     */
    function scheduleRedraw() {
        if (pendingRedraw) return
        pendingRedraw = true
        rafId = requestAnimationFrame(() => {
            pendingRedraw = false
            redraw()
        })
    }

    /**
     * Immediate redraw
     */
    function redraw() {
        const renderer = getRenderer()
        if (renderer) {
            renderer.update()
        }
    }

    /**
     * Create canvas element with render function
     * @param {string} id - component identifier
     * @param {Object} config - canvas configuration
     * @returns {VNode} rendered canvas element
     */
    function createCanvas(id, config) {
        componentId = id
        attrs.value = config.attrs

        const renderer = getRenderer()

        return h('div', {
            class: `trading-vue-${id}`,
            style: {
                left: config.position.x + 'px',
                top: config.position.y + 'px',
                position: 'absolute',
                zIndex: 1
            }
        }, [
            h('canvas', {
                onMousemove: e => renderer?.mousemove?.(e),
                onMouseout: e => renderer?.mouseout?.(e),
                onMouseup: e => renderer?.mouseup?.(e),
                onMousedown: e => renderer?.mousedown?.(e),
                onDblclick: config.onDblclick,
                id: `${props.tv_id}-${id}-canvas`,
                width: config.attrs.width,
                height: config.attrs.height,
                ref: canvasRef,
                style: config.style
            })
        ].concat(config.hs || []))
    }

    /**
     * Update canvas dimensions
     * @param {number} width - new width
     * @param {number} height - new height
     */
    function updateDimensions(width, height) {
        if (width !== undefined) attrs.value.width = width
        if (height !== undefined) attrs.value.height = height
        setup()
    }

    /**
     * Cleanup on unmount
     */
    function cleanup() {
        if (rafId) {
            cancelAnimationFrame(rafId)
            rafId = null
        }
    }

    // Self-wire the teardown when used inside a component setup() — the
    // composable returned cleanup but never registered it, so consumers who
    // forgot leaked a pending RAF firing renderer.update() after unmount.
    // getCurrentInstance guard keeps direct (non-setup) usage working.
    if (getCurrentInstance()) onBeforeUnmount(cleanup)

    return {
        canvasRef,
        attrs,
        setup,
        redraw,
        scheduleRedraw,
        createCanvas,
        updateDimensions,
        cleanup
    }
}

export default useCanvasRenderer
