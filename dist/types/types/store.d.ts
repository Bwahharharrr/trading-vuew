/** A query-resolution pivot: parent object, key/index, and the value at it. */
export interface QueryPivot {
    p: any;
    i: string | number;
    v: any;
}
export interface QueryCtx {
    data: Record<string, any>;
    dss?: Record<string, {
        data(): unknown[];
    }>;
}
/** Chart interaction state, separated from chart data. */
export interface ChartUIState {
    tool?: string;
    drawingMode: boolean;
    scrollLock: boolean;
    selected: string | null;
    tools: Array<{
        type: string;
        [k: string]: unknown;
    }>;
}
