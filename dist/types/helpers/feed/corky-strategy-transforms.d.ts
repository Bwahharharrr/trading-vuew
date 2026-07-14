/**
 * Format a decimal STRING for display: drop unnecessary trailing precision
 * (`0.0000` → `0`, `1.2500` → `1.25`, `1617.080000` → `1,617.08`) and group the
 * integer part with thousands separators. PURE STRING MANIPULATION — the value is
 * never Number()-parsed, so arbitrary-precision decimals are preserved exactly.
 *
 * - null / '' / whitespace → '—'
 * - a value that isn't a plain decimal number is returned verbatim (never mangled)
 * - `opts.group === false` skips the thousands separators
 *
 * @param {string|number|null|undefined} raw
 * @param {{group?: boolean, dash?: string}} [opts]
 * @returns {string}
 */
export function fmtDecimal(raw: string | number | null | undefined, opts?: {
    group?: boolean;
    dash?: string;
}): string;
/**
 * Group `auth_wallet_balances[]` by `class` into `[{ class, wallets }]`, in the
 * canonical WALLET_CLASS_ORDER, dropping empty groups. Wallet objects are passed
 * through UNCHANGED — balance / available stay decimal strings.
 */
export function groupWalletBalancesByClass(balances: any): {
    class: string;
    wallets: any;
}[];
/**
 * Classify a strategy/allocation status string into `{ status, raw, known, tone,
 * group, isPosition, isHalted }`. `tone` drives colour, `group` buckets the row
 * (flat / position / alert / halted), `isPosition` marks long|short, `isHalted`
 * marks paused|bust_locked. Unknown / null → known:false, tone/group 'unknown'.
 */
export function classifyStrategyStatus(raw: any): {
    status: string;
    raw: any;
    known: boolean;
    tone: any;
    group: any;
    isPosition: any;
    isHalted: any;
};
/**
 * Classify a runtime READINESS state (e.g. 'Ready') — the delivery/health axis,
 * separate from the strategy status above. Returns `{ state, ready, tone }`.
 */
export function classifyRuntimeReadiness(state: any): {
    state: string;
    ready: boolean;
    tone: string;
};
/**
 * Build the operator-facing runtime semantics without conflating health, mode,
 * mutation authority, freshness, or dependency gates. This is intentionally a
 * read-only view model: it never grants authority from a connected socket.
 */
export function strategyRuntimeSemantics(runtime: any, opts?: {}): {
    health: {
        state: string;
        ready: boolean;
        tone: string;
    };
    mode: {
        raw: string;
        label: string;
    };
    observer: boolean;
    authority: {
        status: string;
        tone: string;
        label: string;
        reason: any;
    };
    freshness: {
        status: string;
        tone: string;
        label: string;
        ageMs: number | null;
    };
    auth: {
        configured: boolean;
        ready: boolean;
        status: string;
        tone: string;
        label: any;
    };
    allocation: {
        configured: boolean;
        ready: boolean;
        status: string;
        tone: string;
        label: any;
    };
    runtimeControl: {
        available: boolean;
        reason: any;
    };
    primaryReason: any;
};
/**
 * Classify the RUNTIME-level allocation_strategy_status ROLLUP (e.g. 'active' /
 * 'inactive') — a coarse per-runtime health axis, DISTINCT from the per-ticker
 * waiting/long/short/… status (classifyStrategyStatus) and the readiness state.
 * Kept separate so a healthy 'active' rollup renders positively instead of the
 * neutral 'unknown' tone the per-ticker classifier would give it.
 */
export function classifyRuntimeStrategyRollup(raw: any): {
    status: string;
    known: boolean;
    tone: string;
};
/**
 * Group `overlays[]` into `{ decision, fill, order, allocation, control, other }`,
 * each a list of normalized markers `{ timestamp_ms, kind, label, status, source,
 * decision_id, symbol, ticker_id, timeframe, order_status_counts, provenance,
 * raw }` in input order. `raw` retains every gateway field for chart-to-activity
 * inspection; rows without a timestamp are skipped and unknown kinds fold to
 * `other`.
 */
export function overlaysToMarkers(overlays: any): {
    decision: never[];
    fill: never[];
    order: never[];
    allocation: never[];
    control: never[];
    other: never[];
};
/**
 * Split an `order_status_counts` map into `{ local:{ queued }, dispatched:{…},
 * localTotal, dispatchedTotal, total }`. Counts are integers → coerced with a
 * safe Number (missing → 0); this is NOT money, so no precision is at stake.
 */
export function splitOrderStatusCounts(counts: any): {
    local: {
        queued: number;
    };
    dispatched: {};
    localTotal: number;
    dispatchedTotal: number;
    total: number;
};
/**
 * True when a live-operator approval has expired (expires_at_ms < now). A missing
 * approval, or one without a numeric expiry, is treated as NOT stale (there is
 * nothing to expire). `now` is injectable so the check is pure/testable.
 */
export function isApprovalStale(approval: any, now?: number): boolean;
/**
 * Summarize a `live_operator_approval` for display: `{ present, stale,
 * expiresAtMs, approvedAtMs, maxOrderNotional, tradeTimeframe, contextTimeframes,
 * symbols }`. `maxOrderNotional` stays a DECIMAL STRING (verbatim). `stale` flags
 * an expired approval (expires_at_ms < now).
 */
export function approvalStatus(approval: any, now?: number): {
    present: boolean;
    stale: boolean;
    expiresAtMs: any;
    approvedAtMs: any;
    maxOrderNotional: any;
    tradeTimeframe: any;
    contextTimeframes: any;
    symbols: any;
};
/**
 * Humanize a NON-NEGATIVE duration in ms into a compact `Xd Yh` / `Xh Ym` / `Xm`
 * / `Xs` label (matches the ticker-status render transcript, e.g. 1260000 → "21m").
 * Seconds are only shown below a minute; minute/hour/day scales drop the smaller
 * unit when it is zero. null / negative / non-finite → ''.
 */
export function fmtDuration(ms: any): string;
/**
 * Classify a published ticker/allocation status into the full render model
 * `{ status, known, style, attention, position, lockout, durationMs,
 * durationSource, label, reason, lockoutReason }`.
 *
 * - `style` ∈ muted-grey | positive-green | short-distinct | attention | lockout |
 *   transitional | neutral.
 * - Duration source: `long`/`short` prefer `position_opened_at_ms`, falling back
 *   to `status_since_ms`; every other status uses `status_since_ms`. When no
 *   timing field is present the duration is OMITTED (durationMs/durationSource
 *   null and the label carries no "for <dur>").
 * - `reason` is `status_reason` (falling back to `lockout_reason`); `lockoutReason`
 *   surfaces the manual-reapproval reason for a `bust_locked` ticker.
 *
 * @param {string|null|undefined} rawStatus
 * @param {{status_since_ms?:number, position_opened_at_ms?:number, status_reason?:string, lockout_reason?:string}} [timing]
 * @param {number} [nowMs]
 */
export function classifyTickerStatus(rawStatus: string | null | undefined, timing?: {
    status_since_ms?: number;
    position_opened_at_ms?: number;
    status_reason?: string;
    lockout_reason?: string;
}, nowMs?: number): {
    status: string;
    known: boolean;
    style: any;
    attention: boolean;
    position: boolean;
    lockout: boolean;
    durationMs: number | null;
    durationSource: string | null;
    label: string;
    reason: string | null;
    lockoutReason: string | null;
};
/**
 * Build `{ legacy, wallets:[{ account_id, wallet_type, currency, class,
 * observed_balance, observed_available, allocated_to_strategy,
 * unallocated_available, ticker_ids, tickers, legacy }] }`. All money/quantity
 * fields pass through as decimal STRINGS. `legacy:true` marks the flat-shape
 * fallback (single synthesized wallet, `allocated_to_strategy:null`).
 */
export function buildWalletAllocationTree(runtime: any): {
    legacy: boolean;
    wallets: any;
};
/**
 * `{ blocked, submittedNonterminal, oldestSubmittedTsMs }` from a runtime or a
 * per-ticker order row. Counts are integers (safe to coerce); the oldest ts is a
 * ms integer (accepts either `oldest_submitted_order_ts_ms` or the shorter
 * `oldest_submitted_ts_ms`).
 */
export function orderBlocker(runtimeOrTicker: any): {
    blocked: boolean;
    submittedNonterminal: number;
    oldestSubmittedTsMs: number | null;
};
export function strategyTickerControlActions(status: any, blocker: any, opts?: {}): ({
    kind: string;
    intent: string;
    label: string;
    reason: boolean;
    danger: boolean;
    allocation?: undefined;
    capital?: undefined;
    position?: undefined;
} | {
    kind: string;
    intent: string;
    label: string;
    reason: boolean;
    danger?: undefined;
    allocation?: undefined;
    capital?: undefined;
    position?: undefined;
} | {
    kind: string;
    intent: string;
    label: string;
    reason: boolean;
    allocation: boolean;
    capital: boolean;
    danger?: undefined;
    position?: undefined;
} | {
    kind: string;
    intent: string;
    label: string;
    reason: boolean;
    position: boolean;
    capital: boolean;
    danger?: undefined;
    allocation?: undefined;
})[];
/**
 * Classify `lineage_status` into `{ status, raw, tone, running, known }` where
 * `status` ∈ verified | mismatch | unknown. `running` is true ONLY for verified,
 * guaranteeing a mismatched/unknown lineage is never read as running.
 */
export function classifyLineage(rawStatus: any): {
    status: string;
    raw: any;
    tone: string;
    running: boolean;
    known: boolean;
};
/**
 * The clickable backtest-candidate link for a runtime's lineage (field-map
 * "Candidate link": link a runtime to its universe backtest run + selected
 * candidate ONLY when lineage is verified). Returns { runId, runIndex, rank } —
 * ready to open in the Backtests dock — or null when lineage isn't verified /
 * carries no run id (mismatch/unknown never link).
 */
export function lineageCandidateLink(runtime: any): {
    runId: any;
    runIndex: any;
    rank: any;
} | null;
/**
 * Group runtimes into `[{ process_kind, runtimes }]` in first-seen process order,
 * preserving runtime order within each group. Missing `process_kind` defaults to
 * `corky-strategy-runtime`.
 */
export function groupRuntimesByProcess(runtimes: any): {
    process_kind: any;
    runtimes: any;
}[];
/**
 * Normalize dependencies to `[{ kind, runtime_id, legacy }]`. Accepts a runtime
 * object (reads `dependencies[]`, falling back to `target_public/private_runtime_id`
 * tagged `legacy:true`) OR a raw dependencies array. A dependency without a
 * runtime id keeps `runtime_id:null` (rendered as unknown, never silently ok).
 */
export function normalizeDependencies(runtimeOrDeps: any): any;
export const WALLET_CLASS_ORDER: string[];
export const OVERLAY_KINDS: string[];
export const DISPATCHED_STATUS_KEYS: string[];
export const CAPITAL_CONTROL_METHODS: Set<string>;
