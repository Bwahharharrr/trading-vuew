
// Public composables (Phase 4.2) — a typed, $refs-free way to drive the chart.
//
//   const tv = ref(null)
//   const { setRange, goto, getRange } = useChart(tv)
//   <trading-vue ref="tv" :data="dc" @range-changed="onRangeChanged" />
//
// Instead of reaching into `tvRef.value.$refs.chart.*`, consumers call typed
// actions on the TradingVue instance. Reactive helpers (useRange/useCursor)
// expose a ref kept in sync via the chart's events. Additive, non-breaking.

import { ref } from 'vue'

// Resolve a Vue ref (or a raw component) to the TradingVue instance.
function resolve(tvRef) {
    if (!tvRef) return null
    return (typeof tvRef === 'object' && 'value' in tvRef) ? tvRef.value : tvRef
}

/**
 * Imperative chart actions over a TradingVue ref. All are null-safe (no-op /
 * null until the chart is mounted).
 * @param {import('vue').Ref|object} tvRef
 */
export function useChart(tvRef) {
    const tv = () => resolve(tvRef)
    return {
        /** Navigate to a timestamp (out-of-range is clamped). Returns {ok,diagnostics}. */
        goto: (t) => tv()?.goto(t),
        /** Set the visible [t1,t2] range. Returns {ok,diagnostics}. */
        setRange: (t1, t2) => tv()?.setRange(t1, t2),
        /** Current visible range [t1,t2] (or null). */
        getRange: () => { const i = tv(); return i ? i.getRange() : null },
        /** Current cursor (or null). */
        getCursor: () => { const i = tv(); return i ? i.getCursor() : null },
        /** Toggle an overlay's visibility without a full reset. */
        toggleOverlayVisibility: (gridId, overlayId, display) =>
            tv()?.toggleOverlayVisibility(gridId, overlayId, display),
        /** Recompute layout. */
        updateLayout: (force = false) => tv()?.updateLayout(force),
        /** Refresh offchart overlays (after add/remove). */
        refreshOffchartOverlays: () => tv()?.refreshOffchartOverlays(),
        /** The underlying TradingVue instance (escape hatch). */
        instance: tv,
    }
}

/**
 * Reactive visible range. Wire `onRangeChanged` to `@range-changed`.
 * @returns {{ range: import('vue').Ref, setRange:Function, getRange:Function, onRangeChanged:Function }}
 */
export function useRange(tvRef) {
    const { setRange, getRange } = useChart(tvRef)
    const range = ref(null)
    return { range, setRange, getRange, onRangeChanged: (r) => { range.value = r } }
}

/**
 * Reactive cursor. Wire `onCursorChanged` to the chart's cursor event.
 * @returns {{ cursor: import('vue').Ref, getCursor:Function, onCursorChanged:Function }}
 */
export function useCursor(tvRef) {
    const { getCursor } = useChart(tvRef)
    const cursor = ref(null)
    return { cursor, getCursor, onCursorChanged: (c) => { cursor.value = c } }
}

/**
 * Typed access to a DataCube's data API (read/mutate), without reaching into
 * DataCube internals. Pass the DataCube instance.
 * @param {object} dataCube
 */
export function useData(dataCube) {
    const dc = () => dataCube
    return {
        get: (q) => dc()?.get(q),
        getOne: (q) => dc()?.get_one(q),
        set: (q, d) => dc()?.set(q, d),
        merge: (q, d) => dc()?.merge(q, d),
        del: (q) => dc()?.del(q),
        add: (side, ov) => dc()?.add(side, ov),
        update: (d) => dc()?.update(d),
        show: (q) => dc()?.show(q),
        hide: (q) => dc()?.hide(q),
        dc,
    }
}
