
// Animation frame using requestAnimationFrame
// Auto-pauses when tab is hidden, better frame timing

import Utils from './utils.js'

export default class FrameAnimation {
    constructor(cb) {
        this.t0 = this.t = Utils.now()
        this.cb = cb
        this.running = true
        this.rafId = null
        this._loop()
    }

    _loop() {
        if (!this.running) return

        this.rafId = requestAnimationFrame(() => {
            if (!this.running) return

            const now = Utils.now()
            // Skip if the prev frame took too long (e.g., tab was hidden)
            if (now - this.t > 100) {
                this.t = now
                this._loop()
                return
            }
            // Auto-stop after 1200ms
            if (now - this.t0 > 1200) {
                this.stop()
                return
            }

            this.cb(this)
            this.t = now
            this._loop()
        })
    }

    stop() {
        this.running = false
        if (this.rafId !== null) {
            cancelAnimationFrame(this.rafId)
            this.rafId = null
        }
    }
}
