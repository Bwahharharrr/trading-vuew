/**
 * Find the discovery descriptor for a display label, preferring one configured
 * at `timeframe`. Returns null when the label isn't in the catalog.
 *
 * @param {Array} descriptors flat list of indicator descriptors (state.indicators)
 * @param {string} label      display_label to match
 * @param {string} [timeframe] preferred descriptor timeframe
 */
export function findIndicatorDescriptor(descriptors: any[], label: string, timeframe?: string): any;
/** Walk a condition tree and collect every distinct indicator display label. */
export function conditionIndicatorLabels(condition: any): any[];
/** Collect every compare leaf's `field` ref ({indicator, field, bar_offset}). */
export function conditionFields(condition: any): any[];
/**
 * Build the gateway-ready `query.indicators[]` from the referenced display
 * labels × the search timeframes. Each entry copies `{kind, source, params}`
 * verbatim from the descriptor and pins `timeframe` to the search timeframe.
 * Deduped by (kind, timeframe, source, params). Labels with no descriptor are
 * reported in `unresolved` so the caller can refuse to run an un-runnable search.
 *
 * @returns {{ indicators: Array, unresolved: string[] }}
 */
export function buildSearchIndicators({ descriptors, labels, timeframes }: {
    descriptors: any;
    labels: any;
    timeframes: any;
}): {
    indicators: any[];
    unresolved: string[];
};
/**
 * Assemble a single compare leaf. `value` is coerced to a number (the gateway
 * compares numerically). `bar_offset` is included only when non-zero.
 */
export function compareCondition({ indicator, field, op, value, bar_offset }: {
    indicator: any;
    field: any;
    op: any;
    value: any;
    bar_offset: any;
}): {
    type: string;
    field: {
        indicator: any;
        field: any;
    };
    op: any;
    value: number;
};
/**
 * Combine validated compare-rows into a condition tree: a lone row collapses to
 * its compare; multiple rows AND together under `all`. Returns null for none.
 * A row is valid iff it has indicator, field, op and a finite numeric value.
 */
export function buildCondition(rows: any): {
    type: string;
    field: {
        indicator: any;
        field: any;
    };
    op: any;
    value: number;
} | {
    type: string;
    conditions: {
        type: string;
        field: {
            indicator: any;
            field: any;
        };
        op: any;
        value: number;
    }[];
} | null;
export function isValidRow(row: any): boolean;
/**
 * Build a `{ type:'barrier_symmetric', spec }` target spec from form-ish values.
 * Only non-empty fields are sent; the gateway applies documented defaults for the
 * rest. Numeric fields are coerced; `version` defaults to 1.
 */
export function barrierTargetSpec(opts?: {}): {
    type: string;
    spec: {
        version: number;
    };
};
/**
 * Assemble a full, gateway-ready search query. Throws when the inputs can't
 * produce a runnable search (no symbols / timeframes / condition, or a
 * referenced indicator has no descriptor — which would silently stall).
 *
 * `target_specs` (optional) requests result ENRICHMENT (e.g. Barrier Symmetric
 * plans/outcomes) attached to rows that already matched the causal condition; it
 * never changes which rows match.
 *
 * @returns {{ query: object }}
 */
export function buildSearchQuery({ search_id, venue, symbols, range, timeframes, condition, descriptors, result_window, max_results, target_specs, }: {
    search_id: any;
    venue: any;
    symbols: any;
    range: any;
    timeframes: any;
    condition: any;
    descriptors: any;
    result_window: any;
    max_results: any;
    target_specs: any;
}): {
    query: object;
};
/**
 * Project a `search_match` result into a compact display row. Keeps the raw
 * timestamp (format in the view) and passes `chart_window` straight through for
 * click-to-navigate. Box context from `crup_context.detection_box_timeframes`
 * is rendered like the spec's example: `{2h bull box}`.
 *
 * Decimal indicator values are LEFT AS STRINGS (never float-parsed); the match
 * candle close is surfaced for the row.
 */
export function projectMatchRow(result: any): {
    ticker: any;
    venue: any;
    timeframe: any;
    side: any;
    signal: string;
    timestamp_ms: any;
    close: any;
    low: any;
    high: any;
    boxes: any;
    boxesText: any;
    observations: any;
    crup_context: any;
    chart_window: any;
    targets: any;
    barrier: any;
} | null;
/**
 * Normalize one `target_evaluations[]` entry. Keeps plan/outcome/analytics raw
 * (decimal strings) for display + charting. `pending` is true when the outcome
 * hasn't matured (outcome absent OR plan.evaluable_outcome === false) — render
 * that as unavailable, NEVER as a miss (per the contract).
 */
export function projectTargetEvaluation(entry: any): {
    type: any;
    hash: any;
    plan: any;
    outcome: any;
    analytics: any;
    pending: boolean;
} | null;
export { OPS as SEARCH_COMPARE_OPS };
declare const OPS: Set<string>;
