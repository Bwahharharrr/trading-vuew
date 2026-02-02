// Drawing tools mixin - handles rectangle drawing mode

export default {
    data() {
        return {
            rectDrawMode: false,
            isDrawing: false,
            rectStart: null,
            rectCurrent: null
        }
    },
    methods: {
        toggleRectDrawMode() {
            this.rectDrawMode = !this.rectDrawMode
            if (!this.rectDrawMode) {
                this.isDrawing = false
                this.rectStart = null
                this.rectCurrent = null
            }
        },

        onDrawStart(event) {
            this.isDrawing = true
            this.rectStart = { x: event.clientX, y: event.clientY }
            this.rectCurrent = { x: event.clientX, y: event.clientY }
        },

        onDrawMove(event) {
            if (this.isDrawing) {
                this.rectCurrent = { x: event.clientX, y: event.clientY }
            }
        },

        onDrawEnd(event) {
            if (this.isDrawing && this.rectStart && this.rectCurrent) {
                const x = Math.min(this.rectStart.x, this.rectCurrent.x)
                const y = Math.min(this.rectStart.y, this.rectCurrent.y)
                const w = Math.abs(this.rectCurrent.x - this.rectStart.x)
                const h = Math.abs(this.rectCurrent.y - this.rectStart.y)

                if (w > 5 && h > 5) {
                    alert(
                        `Rectangle Coordinates:\n` +
                        `Position: (${x}, ${y})\n` +
                        `Size: ${w} x ${h}\n` +
                        `End: (${x + w}, ${y + h})`
                    )
                }

                this.isDrawing = false
                this.rectStart = null
                this.rectCurrent = null
                this.rectDrawMode = false
            }
        }
    }
}
