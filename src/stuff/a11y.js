
// Accessibility helpers (Phase 4.x). Pure + SSR-safe.
//
// A canvas chart is opaque to assistive tech, so we (a) label the container
// (role/aria-label), (b) provide a visually-hidden text SUMMARY of the data as
// a screen-reader fallback, (c) expose prefers-reduced-motion, and (d) support
// keyboard pan (wired in TradingVue). All additive.

function ohlcvOf(dataCube) {
    const d = dataCube && dataCube.data && dataCube.data.chart && dataCube.data.chart.data
    return Array.isArray(d) ? d : null
}

function fmtTs(t) {
    try { return new Date(t).toISOString().slice(0, 16).replace('T', ' ') }
    catch { return String(t) }
}

/** Short aria-label for the chart container. */
export function chartAriaLabel(dataCube, title = 'TradingVue') {
    const o = ohlcvOf(dataCube)
    if (!o || !o.length) return `${title} financial chart (no data)`
    const last = o[o.length - 1]
    return `${title} financial chart, ${o.length} candles, latest close ${last[4]}`
}

/** A longer text summary used as the screen-reader data fallback. */
export function chartDataSummary(dataCube, title = 'TradingVue') {
    const o = ohlcvOf(dataCube)
    if (!o || !o.length) return `${title}: no chart data loaded.`
    let hi = -Infinity, lo = Infinity
    for (const c of o) { if (c[2] > hi) hi = c[2]; if (c[3] < lo) lo = c[3] }
    const first = o[0], last = o[o.length - 1]
    const parts = [
        `${title} financial chart.`,
        `${o.length} candles from ${fmtTs(first[0])} to ${fmtTs(last[0])}.`,
        `Latest open ${last[1]}, high ${last[2]}, low ${last[3]}, close ${last[4]}.`,
        `Overall high ${hi}, low ${lo}.`,
    ]
    const d = dataCube.data
    const names = (side) => (Array.isArray(d[side]) ? d[side] : [])
        .map((x) => x && x.name).filter(Boolean)
    const on = names('onchart'), off = names('offchart')
    if (on.length) parts.push(`On-chart overlays: ${on.join(', ')}.`)
    if (off.length) parts.push(`Off-chart indicators: ${off.join(', ')}.`)
    return parts.join(' ')
}

/** Whether the user requested reduced motion (false when unavailable). */
export function prefersReducedMotion() {
    return typeof window !== 'undefined' &&
        typeof window.matchMedia === 'function' &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

// Keys that drive keyboard navigation.
export const NAV_KEYS = new Set(['ArrowLeft', 'ArrowRight', 'Home', 'End'])
