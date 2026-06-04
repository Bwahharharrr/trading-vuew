export default class ChartUI {
    /**
     * @param {object} backing - object holding the UI fields (DataCube.data).
     */
    constructor(backing?: object);
    _b: object;
    set tool(v: any);
    /** Active drawing tool type, e.g. 'Cursor' | 'LineTool:Segment'. */
    get tool(): any;
    /** Whether a tool drawing gesture is in progress. */
    get drawingMode(): boolean;
    setDrawingMode(v: any): void;
    /** Whether chart scrolling is locked (during tool interaction). */
    get scrollLock(): boolean;
    setScrollLock(v: any): void;
    /** $uuid of the currently selected object (or null). */
    get selected(): any;
    select(uuid: any): void;
    deselect(): void;
    set tools(v: any);
    /** Registered drawing tools list. */
    get tools(): any;
    hasTool(type: any): boolean;
    /** Reset interaction state to defaults (e.g. on tool finish). */
    resetInteraction(): void;
}
