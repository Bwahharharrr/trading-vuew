
// ChartUI store (Phase 3.1) — typed facade for chart *interaction* state,
// separated from chart *data*.
//
// The plan calls for OHLCV to never co-mingle with tool/drawingMode/scrollLock/
// selected/tools. As the first low-risk step toward that, this store provides
// the typed API while still backing onto the same reactive object the rest of
// DataCube uses (so reactivity and existing `this.data.tool` readers are
// unaffected). Note: the constructor eagerly initialises `backing.tools = []`
// if absent (an enumerable field on data.* from init_data onward) — a mild
// robustness improvement, since some legacy paths read data.tools unguarded.
//
// Framework-agnostic and Node-testable.

export default class ChartUI {

    /**
     * @param {object} backing - object holding the UI fields (DataCube.data).
     */
    constructor(backing = {}) {
        this._b = backing
        if (this._b.tools === undefined) this._b.tools = []
    }

    /** Active drawing tool type, e.g. 'Cursor' | 'LineTool:Segment'. */
    get tool() { return this._b.tool }
    set tool(v) { this._b.tool = v }

    /** Whether a tool drawing gesture is in progress. */
    get drawingMode() { return !!this._b.drawingMode }
    setDrawingMode(v) { this._b.drawingMode = !!v }

    /** Whether chart scrolling is locked (during tool interaction). */
    get scrollLock() { return !!this._b.scrollLock }
    setScrollLock(v) { this._b.scrollLock = !!v }

    /** $uuid of the currently selected object (or null). */
    get selected() { return this._b.selected != null ? this._b.selected : null }
    select(uuid) { this._b.selected = uuid }
    deselect() { this._b.selected = null }

    /** Registered drawing tools list. */
    get tools() { return this._b.tools || [] }
    set tools(v) { this._b.tools = v }

    hasTool(type) {
        return !!(this._b.tools || []).find(t => t.type === type)
    }

    /** Reset interaction state to defaults (e.g. on tool finish). */
    resetInteraction() {
        this._b.drawingMode = false
        this._b.scrollLock = false
    }
}
