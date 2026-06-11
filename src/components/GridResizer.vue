<template>
    <div
        class="grid-resizer"
        :class="{ dragging: dragging }"
        :style="resizerStyle"
        @mousedown="onMouseDown"
        @dblclick="onDoubleClick">
        <div class="resizer-line" :style="lineStyle"></div>
        <div class="resizer-hitbox"></div>
    </div>
</template>

<script>
export default {
    name: 'GridResizer',
    props: ['grid_id', 'layout', 'colors'],
    mounted() {
        // PERFORMANCE: Create throttled handler once
        this._rafId = null
        this._lastEvent = null
    },
    data() {
        return {
            dragging: false,
            startY: 0,
            startHeights: []
        }
    },
    computed: {
        resizerStyle() {
            const grid = this.layout.grids[this.grid_id]
            if (!grid) return {}
            return {
                top: (grid.offset - 6) + 'px',
                left: '0px',
                width: grid.width + 'px'  // Chart area only, not including sidebar
            }
        },
        lineStyle() {
            const baseColor = this.colors?.scale || '#555'
            return {
                background: baseColor
            }
        }
    },
    methods: {
        onMouseDown(e) {
            e.preventDefault()
            e.stopPropagation()
            this.dragging = true
            this.startY = e.clientY

            // Store starting heights of this grid and the one above
            const grids = this.layout.grids
            this.startHeights = grids.map(g => g.height)

            document.addEventListener('mousemove', this.onMouseMove)
            document.addEventListener('mouseup', this.onMouseUp, { passive: true })
            document.body.style.cursor = 'row-resize'
            document.body.style.userSelect = 'none'
        },
        onMouseMove(e) {
            if (!this.dragging) return

            // PERFORMANCE: RAF-throttle mousemove to prevent layout thrashing
            // Store latest event and schedule processing
            this._lastEvent = e
            if (this._rafId !== null) return

            this._rafId = requestAnimationFrame(() => {
                this._rafId = null
                if (!this._lastEvent || !this.dragging) return

                const deltaY = this._lastEvent.clientY - this.startY
                const gridAbove = this.grid_id - 1
                const gridBelow = this.grid_id

                // Calculate new heights
                const minHeight = 28 // Minimum grid height (matches MINIMIZED_HEIGHT)
                let newHeightAbove = this.startHeights[gridAbove] + deltaY
                let newHeightBelow = this.startHeights[gridBelow] - deltaY

                // Enforce minimum heights
                if (newHeightAbove < minHeight) {
                    newHeightBelow = this.startHeights[gridBelow] + (this.startHeights[gridAbove] - minHeight)
                    newHeightAbove = minHeight
                }
                if (newHeightBelow < minHeight) {
                    newHeightAbove = this.startHeights[gridAbove] + (this.startHeights[gridBelow] - minHeight)
                    newHeightBelow = minHeight
                }

                this.$emit('resize-grids', {
                    gridAbove,
                    gridBelow,
                    heightAbove: newHeightAbove,
                    heightBelow: newHeightBelow
                })
            })
        },
        onMouseUp() {
            this.dragging = false
            document.removeEventListener('mousemove', this.onMouseMove)
            document.removeEventListener('mouseup', this.onMouseUp)
            document.body.style.cursor = ''
            document.body.style.userSelect = ''

            this.$emit('resize-complete')
        },
        onDoubleClick(e) {
            e.preventDefault()
            e.stopPropagation()
            // Toggle minimize for the grid below this separator
            this.$emit('toggle-minimize', this.grid_id)
        }
    },
    beforeUnmount() {
        // mid-drag unmount (layout rebuild removing a pane): restore the body
        // overrides onMouseUp would have cleared — the page was stuck with a
        // row-resize cursor and no text selection.
        if (this.dragging) {
            document.body.style.cursor = ''
            document.body.style.userSelect = ''
        }
        document.removeEventListener('mousemove', this.onMouseMove)
        document.removeEventListener('mouseup', this.onMouseUp)
        // PERFORMANCE: Cancel any pending RAF
        if (this._rafId !== null) {
            cancelAnimationFrame(this._rafId)
            this._rafId = null
        }
    }
}
</script>

<style>
.grid-resizer {
    position: absolute;
    height: 12px;
    z-index: 1000;
    cursor: row-resize;
    pointer-events: all;
}
.resizer-line {
    position: absolute;
    top: 5px;
    left: 0;
    right: 0;
    height: 3px;
    background: #888;
    pointer-events: none;
    transition: background 0.15s ease, height 0.15s ease, top 0.15s ease;
}
.resizer-hitbox {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    pointer-events: all;
}
.grid-resizer:hover .resizer-line {
    background: #7777ff !important;
    height: 3px;
    top: 4.5px;
}
.grid-resizer.dragging .resizer-line {
    background: #9999ff !important;
    height: 4px;
    top: 4px;
}
</style>
