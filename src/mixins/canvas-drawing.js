// Canvas drawing utilities for overlay components
// Consolidates repeated drawing patterns across overlays

export default {
    methods: {
        /**
         * Draw a data line with coordinate transformation and optional NaN skipping
         * @param {CanvasRenderingContext2D} ctx - Canvas context
         * @param {Array} data - Data array [[timestamp, value, ...], ...]
         * @param {number} index - Data index to use for Y values (default: 1)
         * @param {boolean} skipNaN - Whether to skip NaN/null values (default: true)
         */
        drawDataLine(ctx, data, index = 1, skipNaN = true) {
            const layout = this.$props.layout

            if (!skipNaN) {
                for (let k = 0, n = data.length; k < n; k++) {
                    let p = data[k]
                    let x = layout.t2screen(p[0])
                    let y = layout.$2screen(p[index])
                    ctx.lineTo(x, y)
                }
            } else {
                let skip = false
                for (let k = 0, n = data.length; k < n; k++) {
                    let p = data[k]
                    let x = layout.t2screen(p[0])
                    let y = layout.$2screen(p[index])

                    if (p[index] == null || y !== y) {
                        skip = true
                    } else {
                        if (skip) ctx.moveTo(x, y)
                        ctx.lineTo(x, y)
                        skip = false
                    }
                }
            }
        },

        /**
         * Draw a step line (horizontal then vertical segments)
         * @param {CanvasRenderingContext2D} ctx - Canvas context
         * @param {Array} data - Data array
         * @param {number} index - Data index for Y values
         */
        drawStepLine(ctx, data, index = 1) {
            const layout = this.$props.layout
            let prevX = null
            let prevY = null

            for (let k = 0, n = data.length; k < n; k++) {
                let p = data[k]
                let x = layout.t2screen(p[0])
                let y = layout.$2screen(p[index])

                if (p[index] == null || y !== y) {
                    prevX = null
                    prevY = null
                    continue
                }

                if (prevX !== null && prevY !== null) {
                    ctx.lineTo(x, prevY)
                    ctx.lineTo(x, y)
                } else {
                    ctx.moveTo(x, y)
                }

                prevX = x
                prevY = y
            }
        },

        /**
         * Draw a filled band/channel between two data indices
         * @param {CanvasRenderingContext2D} ctx - Canvas context
         * @param {Array} data - Data array
         * @param {number} topIndex - Data index for top line
         * @param {number} bottomIndex - Data index for bottom line
         */
        drawBandFill(ctx, data, topIndex, bottomIndex) {
            const layout = this.$props.layout

            ctx.beginPath()
            // Forward pass for top line
            for (let i = 0; i < data.length; i++) {
                let p = data[i]
                let x = layout.t2screen(p[0])
                let y = layout.$2screen(p[topIndex] || undefined)
                ctx.lineTo(x, y)
            }
            // Reverse pass for bottom line
            for (let i = data.length - 1; i >= 0; i--) {
                let p = data[i]
                let x = layout.t2screen(p[0])
                let y = layout.$2screen(p[bottomIndex] || undefined)
                ctx.lineTo(x, y)
            }
            ctx.fill()
        },

        /**
         * Draw multiple lines from a single data array
         * @param {CanvasRenderingContext2D} ctx - Canvas context
         * @param {Array} data - Data array
         * @param {Array} indices - Array of data indices to draw
         * @param {boolean} skipNaN - Whether to skip NaN values
         */
        drawMultiLines(ctx, data, indices, skipNaN = true) {
            for (let idx of indices) {
                ctx.beginPath()
                this.drawDataLine(ctx, data, idx, skipNaN)
                ctx.stroke()
            }
        },

        /**
         * Setup stroke style on canvas context
         * @param {CanvasRenderingContext2D} ctx - Canvas context
         * @param {number} width - Line width
         * @param {string} color - Stroke color
         */
        setupStroke(ctx, width, color) {
            ctx.lineWidth = width
            ctx.strokeStyle = color
        },

        /**
         * Setup fill and stroke style
         * @param {CanvasRenderingContext2D} ctx - Canvas context
         * @param {number} strokeWidth - Line width
         * @param {string} strokeColor - Stroke color
         * @param {string} fillColor - Fill color
         */
        setupFillAndStroke(ctx, strokeWidth, strokeColor, fillColor) {
            ctx.lineWidth = strokeWidth
            ctx.strokeStyle = strokeColor
            ctx.fillStyle = fillColor
        },

        /**
         * Iterate over data points with coordinate transformation
         * @param {Array} data - Data array
         * @param {Function} callback - Called with (point, x, y, index) for each point
         * @param {Object} options - { index: 1, skipNaN: true }
         */
        iterateData(data, callback, options = {}) {
            const layout = this.$props.layout
            const index = options.index || 1
            const skipNaN = options.skipNaN !== false

            for (let k = 0, n = data.length; k < n; k++) {
                let p = data[k]
                let x = layout.t2screen(p[0])
                let y = layout.$2screen(p[index])

                if (skipNaN && (p[index] == null || y !== y)) {
                    continue
                }

                callback(p, x, y, k)
            }
        },

        /**
         * Transform a single point to screen coordinates
         * @param {Array} point - Data point [timestamp, value, ...]
         * @param {number} index - Data index for Y value
         * @returns {Array} [x, y] screen coordinates
         */
        pointToScreen(point, index = 1) {
            const layout = this.$props.layout
            return [
                layout.t2screen(point[0]),
                layout.$2screen(point[index])
            ]
        }
    }
}
