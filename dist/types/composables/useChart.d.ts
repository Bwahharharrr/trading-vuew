/**
 * Imperative chart actions over a TradingVue ref. All are null-safe (no-op /
 * null until the chart is mounted).
 * @param {import('vue').Ref|object} tvRef
 */
export function useChart(tvRef: import("vue").Ref | object): {
    /** Navigate to a timestamp (out-of-range is clamped). Returns {ok,diagnostics}. */
    goto: (t: any) => any;
    /** Set the visible [t1,t2] range. Returns {ok,diagnostics}. */
    setRange: (t1: any, t2: any) => any;
    /** Current visible range [t1,t2] (or null). */
    getRange: () => any;
    /** Current cursor (or null). */
    getCursor: () => any;
    /** Toggle an overlay's visibility without a full reset. */
    toggleOverlayVisibility: (gridId: any, overlayId: any, display: any) => any;
    /** Recompute layout. */
    updateLayout: (force?: boolean) => any;
    /** Refresh offchart overlays (after add/remove). */
    refreshOffchartOverlays: () => any;
    /** The underlying TradingVue instance (escape hatch). */
    instance: () => any;
};
/**
 * Reactive visible range. Wire `onRangeChanged` to `@range-changed`.
 * @returns {{ range: import('vue').Ref, setRange:Function, getRange:Function, onRangeChanged:Function }}
 */
export function useRange(tvRef: any): {
    range: import("vue").Ref;
    setRange: Function;
    getRange: Function;
    onRangeChanged: Function;
};
/**
 * Reactive cursor. Wire `onCursorChanged` to the chart's cursor event.
 * @returns {{ cursor: import('vue').Ref, getCursor:Function, onCursorChanged:Function }}
 */
export function useCursor(tvRef: any): {
    cursor: import("vue").Ref;
    getCursor: Function;
    onCursorChanged: Function;
};
/**
 * Typed access to a DataCube's data API (read/mutate), without reaching into
 * DataCube internals. Pass the DataCube instance.
 * @param {object} dataCube
 */
export function useData(dataCube: object): {
    get: (q: any) => any;
    getOne: (q: any) => any;
    set: (q: any, d: any) => any;
    merge: (q: any, d: any) => any;
    del: (q: any) => any;
    add: (side: any, ov: any) => any;
    update: (d: any) => any;
    show: (q: any) => any;
    hide: (q: any) => any;
    dc: () => object;
};
