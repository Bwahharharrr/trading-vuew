declare namespace _default {
    namespace methods {
        /**
         * Draw a data line with coordinate transformation and optional NaN skipping
         * @param {CanvasRenderingContext2D} ctx - Canvas context
         * @param {Array} data - Data array [[timestamp, value, ...], ...]
         * @param {number} index - Data index to use for Y values (default: 1)
         * @param {boolean} skipNaN - Whether to skip NaN/null values (default: true)
         */
        function drawDataLine(ctx: CanvasRenderingContext2D, data: any[], index?: number, skipNaN?: boolean): void;
        /**
         * Draw a step line (horizontal then vertical segments)
         * @param {CanvasRenderingContext2D} ctx - Canvas context
         * @param {Array} data - Data array
         * @param {number} index - Data index for Y values
         */
        function drawStepLine(ctx: CanvasRenderingContext2D, data: any[], index?: number): void;
        /**
         * Draw a filled band/channel between two data indices
         * @param {CanvasRenderingContext2D} ctx - Canvas context
         * @param {Array} data - Data array
         * @param {number} topIndex - Data index for top line
         * @param {number} bottomIndex - Data index for bottom line
         */
        function drawBandFill(ctx: CanvasRenderingContext2D, data: any[], topIndex: number, bottomIndex: number): void;
        /**
         * Draw multiple lines from a single data array
         * @param {CanvasRenderingContext2D} ctx - Canvas context
         * @param {Array} data - Data array
         * @param {Array} indices - Array of data indices to draw
         * @param {boolean} skipNaN - Whether to skip NaN values
         */
        function drawMultiLines(ctx: CanvasRenderingContext2D, data: any[], indices: any[], skipNaN?: boolean): void;
        /**
         * Setup stroke style on canvas context
         * @param {CanvasRenderingContext2D} ctx - Canvas context
         * @param {number} width - Line width
         * @param {string} color - Stroke color
         */
        function setupStroke(ctx: CanvasRenderingContext2D, width: number, color: string): void;
        /**
         * Setup fill and stroke style
         * @param {CanvasRenderingContext2D} ctx - Canvas context
         * @param {number} strokeWidth - Line width
         * @param {string} strokeColor - Stroke color
         * @param {string} fillColor - Fill color
         */
        function setupFillAndStroke(ctx: CanvasRenderingContext2D, strokeWidth: number, strokeColor: string, fillColor: string): void;
        /**
         * Iterate over data points with coordinate transformation
         * @param {Array} data - Data array
         * @param {Function} callback - Called with (point, x, y, index) for each point
         * @param {Object} options - { index: 1, skipNaN: true }
         */
        function iterateData(data: any[], callback: Function, options?: Object): void;
        /**
         * Transform a single point to screen coordinates
         * @param {Array} point - Data point [timestamp, value, ...]
         * @param {number} index - Data index for Y value
         * @returns {Array} [x, y] screen coordinates
         */
        function pointToScreen(point: any[], index?: number): any[];
    }
}
export default _default;
