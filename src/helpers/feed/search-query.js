// search-query.js — pure helpers to assemble a `search_candles` query from UI
// form state + discovery descriptors, and to project a `search_match` result
// into a compact display row.
//
// Two id spaces meet in a search and must NOT be conflated:
//   • condition.field.indicator → the DISPLAY LABEL (e.g. "MACD(12,26,9)", "CRUP")
//   • query.indicators[].kind   → the descriptor's canonical KIND, verbatim
//                                  (e.g. "MACD", "CRUP_MTF") — copied straight
//                                  off the discovery descriptor for that label.
// The `indicators[]` array is REQUIRED and non-empty: it declares what the
// gateway must COMPUTE. Omit it and the search accepts then stalls (nothing to
// match on). We derive it from the labels the condition references × the search
// timeframes, looking each up in the descriptors.
//
// No wall-clock / randomness here — everything is a pure function of its args.

/**
 * Find the discovery descriptor for a display label, preferring one configured
 * at `timeframe`. Returns null when the label isn't in the catalog.
 *
 * @param {Array} descriptors flat list of indicator descriptors (state.indicators)
 * @param {string} label      display_label to match
 * @param {string} [timeframe] preferred descriptor timeframe
 */
export function findIndicatorDescriptor(descriptors, label, timeframe) {
    if (!Array.isArray(descriptors) || !label) return null
    const matches = descriptors.filter((d) => d && d.display_label === label)
    if (!matches.length) return null
    if (timeframe != null) {
        const exact = matches.find((d) => d.timeframe === timeframe)
        if (exact) return exact
    }
    return matches[0]
}

/** Walk a condition tree and collect every distinct indicator display label. */
export function conditionIndicatorLabels(condition) {
    const out = []
    const seen = new Set()
    const visit = (node) => {
        if (!node || typeof node !== 'object') return
        if (node.type === 'compare') {
            const label = node.field && node.field.indicator
            if (label && !seen.has(label)) { seen.add(label); out.push(label) }
            return
        }
        if ((node.type === 'all' || node.type === 'any') && Array.isArray(node.conditions)) {
            for (const c of node.conditions) visit(c)
        }
    }
    visit(condition)
    return out
}

/**
 * Build the gateway-ready `query.indicators[]` from the referenced display
 * labels × the search timeframes. Each entry copies `{kind, source, params}`
 * verbatim from the descriptor and pins `timeframe` to the search timeframe.
 * Deduped by (kind, timeframe, source, params). Labels with no descriptor are
 * reported in `unresolved` so the caller can refuse to run an un-runnable search.
 *
 * @returns {{ indicators: Array, unresolved: string[] }}
 */
export function buildSearchIndicators({ descriptors, labels, timeframes }) {
    const tfs = (Array.isArray(timeframes) && timeframes.length) ? timeframes : [undefined]
    const wanted = Array.isArray(labels) ? labels : []
    const indicators = []
    const seen = new Set()
    const unresolved = []
    const unresolvedSeen = new Set()

    for (const label of wanted) {
        let resolvedAnywhere = false
        for (const tf of tfs) {
            const desc = findIndicatorDescriptor(descriptors, label, tf)
            if (!desc) continue
            resolvedAnywhere = true
            const entry = { kind: desc.kind }
            // Pin to the search timeframe (the indicator is recomputed for the
            // scan); fall back to the descriptor's own tf when none was given.
            const tfForEntry = tf != null ? tf : desc.timeframe
            if (tfForEntry != null) entry.timeframe = tfForEntry
            if (desc.source != null) entry.source = desc.source
            if (desc.params != null) entry.params = desc.params
            const key = `${entry.kind}|${entry.timeframe || ''}|${entry.source || ''}|${stableParams(entry.params)}`
            if (!seen.has(key)) { seen.add(key); indicators.push(entry) }
        }
        if (!resolvedAnywhere && !unresolvedSeen.has(label)) {
            unresolvedSeen.add(label)
            unresolved.push(label)
        }
    }
    return { indicators, unresolved }
}

// Deterministic params signature for dedupe (key order independent).
function stableParams(params) {
    if (!params || typeof params !== 'object') return ''
    return Object.keys(params).sort().map((k) => `${k}=${params[k]}`).join(',')
}

/**
 * Assemble a single compare leaf. `value` is coerced to a number (the gateway
 * compares numerically). `bar_offset` is included only when non-zero.
 */
export function compareCondition({ indicator, field, op, value, bar_offset }) {
    const fieldRef = { indicator, field }
    if (bar_offset) fieldRef.bar_offset = bar_offset
    else fieldRef.bar_offset = 0
    return { type: 'compare', field: fieldRef, op, value: Number(value) }
}

/**
 * Combine validated compare-rows into a condition tree: a lone row collapses to
 * its compare; multiple rows AND together under `all`. Returns null for none.
 * A row is valid iff it has indicator, field, op and a finite numeric value.
 */
export function buildCondition(rows) {
    const valid = (Array.isArray(rows) ? rows : []).filter(isValidRow)
    if (!valid.length) return null
    const leaves = valid.map(compareCondition)
    if (leaves.length === 1) return leaves[0]
    return { type: 'all', conditions: leaves }
}

export function isValidRow(row) {
    if (!row) return false
    if (!row.indicator || !row.field || !row.op) return false
    if (row.value == null || row.value === '') return false
    return Number.isFinite(Number(row.value))
}

const OPS = new Set(['gt', 'gte', 'lt', 'lte', 'eq', 'ne'])

/**
 * Assemble a full, gateway-ready search query. Throws when the inputs can't
 * produce a runnable search (no symbols / timeframes / condition, or a
 * referenced indicator has no descriptor — which would silently stall).
 *
 * @returns {{ query: object }}
 */
export function buildSearchQuery({
    search_id, venue, symbols, range, timeframes, condition,
    descriptors, result_window, max_results,
}) {
    if (!search_id) throw new Error('buildSearchQuery: search_id is required')
    if (!venue) throw new Error('buildSearchQuery: venue is required')
    const symbolList = normalizeSymbols(symbols)
    if (!symbolList.length) throw new Error('buildSearchQuery: at least one symbol is required')
    const tfs = (Array.isArray(timeframes) ? timeframes : []).filter(Boolean)
    if (!tfs.length) throw new Error('buildSearchQuery: at least one timeframe is required')
    if (!condition) throw new Error('buildSearchQuery: a condition is required')

    const labels = conditionIndicatorLabels(condition)
    if (!labels.length) throw new Error('buildSearchQuery: the condition references no indicator')
    const { indicators, unresolved } = buildSearchIndicators({ descriptors, labels, timeframes: tfs })
    if (unresolved.length) {
        throw new Error(
            `buildSearchQuery: no descriptor for ${unresolved.join(', ')} — ` +
            'pick an indicator available on this symbol/timeframe',
        )
    }
    if (!indicators.length) throw new Error('buildSearchQuery: could not derive any indicators[] to compute')

    const query = {
        search_id,
        venue,
        symbols: { type: 'symbols', symbols: symbolList },
        range: range || { type: 'latest', limit: 500 },
        timeframes: tfs,
        indicators,
        condition,
    }
    if (result_window) {
        query.result_window = {
            before_bars: toInt(result_window.before_bars, 200),
            after_bars: toInt(result_window.after_bars, 600),
        }
    }
    if (max_results != null && Number.isFinite(Number(max_results))) {
        query.max_results = toInt(max_results, 0)
    }
    return { query }
}

function normalizeSymbols(symbols) {
    if (Array.isArray(symbols)) return symbols.filter(Boolean)
    if (symbols && Array.isArray(symbols.symbols)) return symbols.symbols.filter(Boolean)
    if (typeof symbols === 'string') {
        return symbols.split(',').map((s) => s.trim()).filter(Boolean)
    }
    return []
}

function toInt(v, fallback) {
    const n = Math.trunc(Number(v))
    return Number.isFinite(n) ? n : fallback
}

/**
 * Project a `search_match` result into a compact display row. Keeps the raw
 * timestamp (format in the view) and passes `chart_window` straight through for
 * click-to-navigate. Box context from `crup_context.detection_box_timeframes`
 * is rendered like the spec's example: `{2h bull box}`.
 *
 * Decimal indicator values are LEFT AS STRINGS (never float-parsed); the match
 * candle close is surfaced for the row.
 */
export function projectMatchRow(result) {
    if (!result) return null
    const ctx = result.crup_context || null
    const boxes = (ctx && Array.isArray(ctx.detection_box_timeframes))
        ? ctx.detection_box_timeframes.map((b) => ({
            timeframe: b.timeframe, side: b.side, box_count: b.box_count,
            text: `${b.timeframe} ${b.side} box${b.box_count != null ? ` ×${b.box_count}` : ''}`,
        }))
        : []
    const signal = [result.timeframe, result.side].filter(Boolean).join(' ')
    return {
        ticker: result.symbol,
        venue: result.venue,
        timeframe: result.timeframe,
        side: result.side,
        signal,
        timestamp_ms: result.timestamp_ms,
        close: result.candle ? result.candle.close : null,
        boxes,
        boxesText: boxes.map((b) => b.text).join(', '),
        observations: Array.isArray(result.observations) ? result.observations : [],
        crup_context: ctx,
        chart_window: result.chart_window || null,
    }
}

export { OPS as SEARCH_COMPARE_OPS }
