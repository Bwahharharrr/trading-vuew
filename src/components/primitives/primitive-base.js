// Base class for drawing primitives with collision detection

import Utils from '../../stuff/utils.js'

export default class PrimitiveBase {

    // Overlay ref, canvas ctx
    constructor(overlay, ctx) {
        this.ctx = ctx
        this.comp = overlay
        this.T = overlay.$props.config.TOOL_COLL
        if (Utils.is_mobile) this.T *= 2
    }

    // Get layout helper
    get layout() {
        return this.comp.$props.layout
    }

    // Convert time-price to screen coordinates
    toScreen(p) {
        return [
            this.layout.t2screen(p[0]),
            this.layout.$2screen(p[1])
        ]
    }
}
