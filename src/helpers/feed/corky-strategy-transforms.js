// corky-strategy-transforms.js — pure, decimal-safe transforms over the
// read-only strategy-runtime gateway events (list_strategy_runtimes,
// get_strategy_runtime / get_strategy_ticker, list_strategy_decisions,
// get_strategy_chart_overlays, subscribe_strategy_runtime).
//
// No framework / I/O deps so every shape can be golden-pinned and unit-tested in
// isolation (mirrors corky-positions.js / backtest-overlays.js).
//
// DECIMAL SAFETY: every money / quantity field on the wire — wallet
// balance/available, allocated_equity, available_cash, reserved_cash,
// locked_margin, position_quantity / position_avg_price, realized_pnl,
// unrealized_pnl, fees_paid, max_order_notional — is a decimal STRING. These
// transforms pass those strings through VERBATIM and NEVER Number()-parse them
// (float-parsing loses precision on 28-digit decimals). The only numeric
// interpretation is on integer values that are genuinely integers: order-status
// COUNTS and epoch-ms timestamps. Callers may Number() a decimal string later for
// SORT / COLOUR only — never for display.

// ── decimal-string display formatting (NEVER float-parses) ───────────────────
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
export function fmtDecimal(raw, opts = {}) {
  const dash = opts.dash != null ? opts.dash : '—'
  if (raw == null) return dash
  const t = String(raw).trim()
  if (t === '') return dash
  // Only a plain (optionally signed) decimal is reformatted; anything else
  // (ranges, labels, hex, etc.) passes through untouched.
  if (!/^-?\d*\.?\d*$/.test(t) || !/\d/.test(t)) return t
  const neg = t[0] === '-'
  let body = neg ? t.slice(1) : t
  let [int = '', frac = ''] = body.split('.')
  frac = frac.replace(/0+$/, '')             // drop trailing zeros
  int = int.replace(/^0+(?=\d)/, '')          // strip leading zeros, keep one
  if (int === '') int = '0'
  if (opts.group !== false) int = int.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  const out = frac ? `${int}.${frac}` : int
  return (neg && out !== '0') ? `-${out}` : out
}

// ── wallet balances, grouped by class ────────────────────────────────────────
// The gateway tags each wallet with a `class`: exchange / margin / funding /
// derivative / other. Group verbatim (no field is touched) into that canonical
// order; an unknown/missing class folds into `other`.

export const WALLET_CLASS_ORDER = ['exchange', 'margin', 'funding', 'derivative', 'other']
const WALLET_CLASSES = new Set(WALLET_CLASS_ORDER)

/**
 * Group `auth_wallet_balances[]` by `class` into `[{ class, wallets }]`, in the
 * canonical WALLET_CLASS_ORDER, dropping empty groups. Wallet objects are passed
 * through UNCHANGED — balance / available stay decimal strings.
 */
export function groupWalletBalancesByClass(balances) {
  const buckets = new Map()
  for (const cls of WALLET_CLASS_ORDER) buckets.set(cls, [])
  for (const w of (Array.isArray(balances) ? balances : [])) {
    if (!w) continue
    const cls = WALLET_CLASSES.has(w.class) ? w.class : 'other'
    buckets.get(cls).push(w)
  }
  const groups = []
  for (const cls of WALLET_CLASS_ORDER) {
    const wallets = buckets.get(cls)
    if (wallets.length) groups.push({ class: cls, wallets })
  }
  return groups
}

// ── strategy / allocation status classification ──────────────────────────────
// This is the STRATEGY status (ticker.allocation.status / a claim_state.status /
// an allocation-kind overlay.status), DISTINCT from the runtime READINESS state
// (Ready / …) classified by classifyRuntimeReadiness below. The UI must visually
// distinguish these — never conflate the two axes.

const STRATEGY_STATUS = {
  waiting:           { tone: 'idle',     group: 'flat',     isPosition: false, isHalted: false },
  long:              { tone: 'long',     group: 'position', isPosition: true,  isHalted: false },
  short:             { tone: 'short',    group: 'position', isPosition: true,  isHalted: false },
  paused:            { tone: 'warn',     group: 'halted',   isPosition: false, isHalted: true  },
  degraded:          { tone: 'warn',     group: 'alert',    isPosition: false, isHalted: false },
  bust_locked:       { tone: 'critical', group: 'halted',   isPosition: false, isHalted: true  },
  capital_shortfall: { tone: 'critical', group: 'alert',    isPosition: false, isHalted: false },
}

/**
 * Classify a strategy/allocation status string into `{ status, raw, known, tone,
 * group, isPosition, isHalted }`. `tone` drives colour, `group` buckets the row
 * (flat / position / alert / halted), `isPosition` marks long|short, `isHalted`
 * marks paused|bust_locked. Unknown / null → known:false, tone/group 'unknown'.
 */
export function classifyStrategyStatus(raw) {
  const status = raw == null ? '' : String(raw).trim().toLowerCase()
  const spec = STRATEGY_STATUS[status]
  if (!spec) {
    return {
      status: status || 'unknown', raw, known: false,
      tone: 'unknown', group: 'unknown', isPosition: false, isHalted: false,
    }
  }
  return {
    status, raw, known: true,
    tone: spec.tone, group: spec.group, isPosition: spec.isPosition, isHalted: spec.isHalted,
  }
}

/**
 * Classify a runtime READINESS state (e.g. 'Ready') — the delivery/health axis,
 * separate from the strategy status above. Returns `{ state, ready, tone }`.
 */
export function classifyRuntimeReadiness(state) {
  const s = state == null ? '' : String(state).trim()
  const ready = s === 'Ready'
  return { state: s || 'unknown', ready, tone: ready ? 'ready' : (s ? 'pending' : 'unknown') }
}

/**
 * Classify the RUNTIME-level allocation_strategy_status ROLLUP (e.g. 'active' /
 * 'inactive') — a coarse per-runtime health axis, DISTINCT from the per-ticker
 * waiting/long/short/… status (classifyStrategyStatus) and the readiness state.
 * Kept separate so a healthy 'active' rollup renders positively instead of the
 * neutral 'unknown' tone the per-ticker classifier would give it.
 */
export function classifyRuntimeStrategyRollup(raw) {
  const s = raw == null ? '' : String(raw).trim().toLowerCase()
  if (s === 'active' || s === 'running' || s === 'ready') return { status: s, known: true, tone: 'ready' }
  if (s === 'inactive' || s === 'stopped' || s === 'idle') return { status: s, known: true, tone: 'idle' }
  if (s === 'error' || s === 'failed' || s === 'bust_locked') return { status: s, known: true, tone: 'critical' }
  return { status: s || 'unknown', known: false, tone: s ? 'warn' : 'unknown' }
}

// ── chart-overlay markers, grouped by kind ───────────────────────────────────
// `get_strategy_chart_overlays` returns time-anchored markers of kind
// decision / fill / order / allocation. Group them by kind so the UI can plot one
// Markers overlay per kind. timestamp_ms + label + status are preserved; no field
// is float-parsed (any money lives inside the string `label`, kept verbatim).

// `control` is a first-class kind: the gateway emits manual-control markers as
// kind:'control' (source strategy_control_audit). Without it here they'd fold to
// `other` and be dropped by the overlay sync.
export const OVERLAY_KINDS = ['decision', 'fill', 'order', 'allocation', 'control']

/**
 * Group `overlays[]` into `{ decision, fill, order, allocation, control, other }`,
 * each a list of normalized markers `{ timestamp_ms, kind, label, status, source,
 * decision_id, symbol, ticker_id, timeframe, order_status_counts }` in input
 * order. Rows without a `timestamp_ms` are skipped; unknown kinds fold to `other`.
 */
export function overlaysToMarkers(overlays) {
  const groups = { decision: [], fill: [], order: [], allocation: [], control: [], other: [] }
  for (const o of (Array.isArray(overlays) ? overlays : [])) {
    if (!o || o.timestamp_ms == null) continue
    const kind = OVERLAY_KINDS.includes(o.kind) ? o.kind : 'other'
    groups[kind].push({
      timestamp_ms: o.timestamp_ms,
      kind: o.kind,
      label: o.label != null ? o.label : '',
      status: o.status != null ? o.status : '',
      source: o.source,
      decision_id: o.decision_id,
      symbol: o.symbol,
      ticker_id: o.ticker_id,
      timeframe: o.timeframe,
      order_status_counts: o.order_status_counts || {},
    })
  }
  return groups
}

// ── order-status split: local journal vs dispatched/reconciled ───────────────
// `queued` means DURABLE LOCAL JOURNAL ONLY — the order is recorded locally but
// has NOT been sent to the exchange. sent/accepted/open/partially_filled/filled/
// canceled/rejected are later dispatch/reconciliation states. The UI must not
// imply a queued order reached the venue, so keep the two apart.

export const DISPATCHED_STATUS_KEYS = [
  'sent', 'accepted', 'open', 'partially_filled', 'filled', 'canceled', 'rejected',
]

/**
 * Split an `order_status_counts` map into `{ local:{ queued }, dispatched:{…},
 * localTotal, dispatchedTotal, total }`. Counts are integers → coerced with a
 * safe Number (missing → 0); this is NOT money, so no precision is at stake.
 */
export function splitOrderStatusCounts(counts) {
  const c = counts || {}
  const n = (v) => { const x = Number(v); return Number.isFinite(x) ? x : 0 }
  const queued = n(c.queued)
  const dispatched = {}
  let dispatchedTotal = 0
  for (const k of DISPATCHED_STATUS_KEYS) {
    const v = n(c[k])
    dispatched[k] = v
    dispatchedTotal += v
  }
  return {
    local: { queued },   // durable local journal only — NOT sent to the exchange
    dispatched,          // later dispatch / reconciliation states
    localTotal: queued,
    dispatchedTotal,
    total: queued + dispatchedTotal,
  }
}

// ── live-operator approval ───────────────────────────────────────────────────

/**
 * True when a live-operator approval has expired (expires_at_ms < now). A missing
 * approval, or one without a numeric expiry, is treated as NOT stale (there is
 * nothing to expire). `now` is injectable so the check is pure/testable.
 */
export function isApprovalStale(approval, now = Date.now()) {
  if (!approval || typeof approval.expires_at_ms !== 'number') return false
  return approval.expires_at_ms < now
}

/**
 * Summarize a `live_operator_approval` for display: `{ present, stale,
 * expiresAtMs, approvedAtMs, maxOrderNotional, tradeTimeframe, contextTimeframes,
 * symbols }`. `maxOrderNotional` stays a DECIMAL STRING (verbatim). `stale` flags
 * an expired approval (expires_at_ms < now).
 */
export function approvalStatus(approval, now = Date.now()) {
  if (!approval) {
    return {
      present: false, stale: false, expiresAtMs: null, approvedAtMs: null,
      maxOrderNotional: null, tradeTimeframe: null, contextTimeframes: [], symbols: [],
    }
  }
  const expiresAtMs = typeof approval.expires_at_ms === 'number' ? approval.expires_at_ms : null
  return {
    present: true,
    stale: isApprovalStale(approval, now),
    expiresAtMs,
    approvedAtMs: typeof approval.approved_at_ms === 'number' ? approval.approved_at_ms : null,
    maxOrderNotional: approval.max_order_notional != null ? approval.max_order_notional : null,
    tradeTimeframe: approval.trade_timeframe != null ? approval.trade_timeframe : null,
    contextTimeframes: Array.isArray(approval.context_timeframes)
      ? approval.context_timeframes.slice() : [],
    symbols: Array.isArray(approval.symbols) ? approval.symbols.slice() : [],
  }
}

// ── small numeric coercions (INTEGER ms / counts only — never money) ─────────
// Epoch-ms timestamps and order COUNTS are genuine integers, so Number()-coercing
// them is safe. Money/quantity NEVER pass through here (see the decimal note up
// top) — they stay verbatim strings.
function numOrNull(v) {
  if (v == null) return null
  const n = typeof v === 'number' ? v : Number(v)
  return Number.isFinite(n) ? n : null
}
function intOrZero(v) {
  const n = Number(v)
  return Number.isFinite(n) ? Math.trunc(n) : 0
}

/**
 * Humanize a NON-NEGATIVE duration in ms into a compact `Xd Yh` / `Xh Ym` / `Xm`
 * / `Xs` label (matches the ticker-status render transcript, e.g. 1260000 → "21m").
 * Seconds are only shown below a minute; minute/hour/day scales drop the smaller
 * unit when it is zero. null / negative / non-finite → ''.
 */
export function fmtDuration(ms) {
  const n = numOrNull(ms)
  if (n == null || n < 0) return ''
  let s = Math.floor(n / 1000)
  const d = Math.floor(s / 86400); s -= d * 86400
  const h = Math.floor(s / 3600);  s -= h * 3600
  const m = Math.floor(s / 60);    s -= m * 60
  if (d) return h ? `${d}d ${h}h` : `${d}d`
  if (h) return m ? `${h}h ${m}m` : `${h}h`
  if (m) return `${m}m`
  return `${s}s`
}

// ── ticker status model (per the field-map + ticker-status render transcript) ─
// This is the PUBLISHED per-ticker status axis. `style` drives the visual
// treatment; `attention` marks the operator-attention family (paused /
// capital_shortfall / degraded / adoption_required / bust_locked). Duration is
// derived from PUBLISHED timing only — missing timing OMITS the duration (we
// never invent one from the local wall-clock, per the compatibility rules).
//
// NOTE on bust_locked style: the field-map calls it "Error/lockout style" and the
// contract's status model reserves the distinct `lockout` style + a
// `lockout_reason`, so bust_locked → style:'lockout' (with attention:true so a
// coarse renderer can still fold it into the attention family — that is exactly
// how the reference transcript projects it to its 4-token style vocabulary).

const TICKER_STATUS = {
  waiting:           { style: 'muted-grey',    durationFrom: 'status',   attention: false, position: false },
  long:              { style: 'positive-green', durationFrom: 'position', attention: false, position: true  },
  short:             { style: 'short-distinct', durationFrom: 'position', attention: false, position: true  },
  paused:            { style: 'attention',      durationFrom: 'status',   attention: true,  position: false },
  capital_shortfall: { style: 'attention',      durationFrom: 'status',   attention: true,  position: false },
  degraded:          { style: 'attention',      durationFrom: 'status',   attention: true,  position: false },
  adoption_required: { style: 'attention',      durationFrom: 'status',   attention: true,  position: false },
  bust_locked:       { style: 'lockout',        durationFrom: 'status',   attention: true,  position: false, lockout: true },
  entering:          { style: 'transitional',   durationFrom: 'status',   attention: false, position: false },
}

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
export function classifyTickerStatus(rawStatus, timing = {}, nowMs = Date.now()) {
  const t = timing || {}
  const status = rawStatus == null ? '' : String(rawStatus).trim().toLowerCase()
  const spec = TICKER_STATUS[status]
  const known = !!spec
  const style = known ? spec.style : 'neutral'
  const attention = known ? !!spec.attention : false
  const position = known ? !!spec.position : false
  const lockout = known ? !!spec.lockout : false

  const posMs = numOrNull(t.position_opened_at_ms)
  const sinceMs = numOrNull(t.status_since_ms)
  const durationFrom = known ? spec.durationFrom : 'status'
  let durationSource = null
  let sourceMs = null
  if (durationFrom === 'position' && posMs != null) {
    durationSource = 'position_opened_at_ms'; sourceMs = posMs
  } else if (sinceMs != null) {
    durationSource = 'status_since_ms'; sourceMs = sinceMs
  }
  let durationMs = null
  if (sourceMs != null && Number.isFinite(nowMs)) durationMs = Math.max(0, nowMs - sourceMs)

  const statusText = status || 'unknown'
  const label = durationMs != null ? `${statusText} for ${fmtDuration(durationMs)}` : statusText

  const lockoutReason = t.lockout_reason != null ? t.lockout_reason : null
  const reason = t.status_reason != null ? t.status_reason : lockoutReason

  return {
    status: statusText, known, style, attention, position, lockout,
    durationMs, durationSource, label, reason, lockoutReason,
  }
}

// ── wallet → strategy → ticker allocation tree ───────────────────────────────
// Preferred source is the server-computed `wallet_allocations[]` (nested
// `ticker_allocations[]`); its `allocated_to_strategy` / `unallocated_available`
// are used VERBATIM — the client never does money arithmetic on the strings and
// never infers wallet ownership by matching quote currency. When
// `wallet_allocations` is ABSENT (older runtime), fall back to the flat
// `allocation_*` pool + top-level `ticker_allocations[]`, tagged `legacy:true`
// and WITHOUT a computed `allocated_to_strategy` (that number isn't published in
// the flat shape, so we surface null rather than infer it).

/**
 * Build `{ legacy, wallets:[{ account_id, wallet_type, currency, class,
 * observed_balance, observed_available, allocated_to_strategy,
 * unallocated_available, ticker_ids, tickers, legacy }] }`. All money/quantity
 * fields pass through as decimal STRINGS. `legacy:true` marks the flat-shape
 * fallback (single synthesized wallet, `allocated_to_strategy:null`).
 */
export function buildWalletAllocationTree(runtime) {
  const rt = runtime || {}
  const wa = Array.isArray(rt.wallet_allocations) ? rt.wallet_allocations : null
  if (wa) {
    const wallets = wa.filter(Boolean).map((w) => ({
      account_id: w.account_id != null ? w.account_id : null,
      wallet_type: w.wallet_type != null ? w.wallet_type : null,
      currency: w.currency != null ? w.currency : null,
      class: w.class != null ? w.class : null,
      observed_balance: w.observed_balance != null ? w.observed_balance : null,
      observed_available: w.observed_available != null ? w.observed_available : null,
      allocated_to_strategy: w.allocated_to_strategy != null ? w.allocated_to_strategy : null,
      unallocated_available: w.unallocated_available != null ? w.unallocated_available : null,
      ticker_ids: Array.isArray(w.ticker_ids) ? w.ticker_ids.slice()
        : (Array.isArray(w.ticker_allocations)
          ? w.ticker_allocations.map((tk) => tk && tk.ticker_id).filter(Boolean) : []),
      tickers: Array.isArray(w.ticker_allocations) ? w.ticker_allocations.slice() : [],
      legacy: false,
    }))
    return { legacy: false, wallets }
  }

  // FALLBACK — flat allocation_* pool + top-level ticker_allocations[].
  const tickers = Array.isArray(rt.ticker_allocations) ? rt.ticker_allocations.slice() : []
  const hasPool = rt.allocation_account_id != null || rt.allocation_quote_currency != null ||
    rt.allocation_wallet_type != null || rt.allocation_observed_balance != null ||
    rt.allocation_observed_available != null || rt.allocation_unallocated_available != null
  if (!tickers.length && !hasPool) return { legacy: true, wallets: [] }

  const wallet = {
    account_id: rt.allocation_account_id != null ? rt.allocation_account_id : null,
    wallet_type: rt.allocation_wallet_type != null ? rt.allocation_wallet_type : null,
    currency: rt.allocation_quote_currency != null ? rt.allocation_quote_currency : null,
    class: null,                    // not classified in the flat legacy shape
    observed_balance: rt.allocation_observed_balance != null ? rt.allocation_observed_balance : null,
    observed_available: rt.allocation_observed_available != null ? rt.allocation_observed_available : null,
    allocated_to_strategy: null,    // NOT server-computed in the legacy shape — never inferred
    unallocated_available: rt.allocation_unallocated_available != null ? rt.allocation_unallocated_available : null,
    ticker_ids: tickers.map((tk) => tk && tk.ticker_id).filter(Boolean),
    tickers,
    legacy: true,
  }
  return { legacy: true, wallets: [wallet] }
}

// ── submitted-nonterminal order blocker ──────────────────────────────────────
// `orders_submitted_nonterminal > 0` (on the runtime OR a per-ticker ticker_orders
// row) is an attention BLOCKER layered on top of the status style until
// parity/reconciliation clears it.

/**
 * `{ blocked, submittedNonterminal, oldestSubmittedTsMs }` from a runtime or a
 * per-ticker order row. Counts are integers (safe to coerce); the oldest ts is a
 * ms integer (accepts either `oldest_submitted_order_ts_ms` or the shorter
 * `oldest_submitted_ts_ms`).
 */
export function orderBlocker(runtimeOrTicker) {
  const o = runtimeOrTicker || {}
  const submittedNonterminal = intOrZero(o.orders_submitted_nonterminal)
  const oldestSubmittedTsMs = numOrNull(
    o.oldest_submitted_order_ts_ms != null ? o.oldest_submitted_order_ts_ms : o.oldest_submitted_ts_ms,
  )
  return { blocked: submittedNonterminal > 0, submittedNonterminal, oldestSubmittedTsMs }
}

// ── per-ticker manual control actions ────────────────────────────────────────
// The set of DIRECT-CONTROL actions an operator MAY take on one ticker, derived
// PURELY from its published status + submitted-order blocker. This mirrors the
// gateway's control surface (pause/resume/unlock/adopt/cancel) and the field-map
// STATUS MODEL; it does NOT decide availability — the caller still gates the
// whole surface on an active control session (a mismatched-lineage or session-
// less runtime must not expose these). Every action needs a visible operator
// `reason` (schema: reason is required on all six commands). Ordering puts the
// submitted-order blocker first because it is the top-priority attention state.
//
// - submitted-nonterminal blocker → `cancel_strategy_ticker_orders`
// - paused                        → `resume_strategy_ticker`
// - bust_locked / capital_shortfall → `unlock_strategy_ticker` (needs allocation)
// - adoption_required             → `adopt_strategy_position` (needs position_id)
// - waiting / long / short / entering → `pause_strategy_ticker`
// Every other status (e.g. degraded, unknown) exposes only the blocker action.
export function strategyTickerControlActions(status, blocker, opts = {}) {
  // capitalBlocked: the runtime's lineage is not verified (mismatch/attention) →
  // withhold CAPITAL/position-committing controls (unlock/adopt) while still
  // allowing halt/safety controls (cancel/pause/resume) so an operator can stop
  // a misbehaving unverified runtime.
  const { capitalBlocked = false } = opts
  const s = status == null ? '' : String(status).trim().toLowerCase()
  const actions = []
  if (blocker && blocker.blocked) {
    actions.push({ kind: 'cancel', intent: 'cancel-ticker-orders', label: 'Cancel submitted orders', reason: true, danger: true })
  }
  if (s === 'paused') {
    actions.push({ kind: 'resume', intent: 'resume-ticker', label: 'Resume', reason: true })
  } else if (s === 'bust_locked' || s === 'capital_shortfall') {
    actions.push({ kind: 'unlock', intent: 'unlock-ticker', label: 'Unlock', reason: true, allocation: true, capital: true })
  } else if (s === 'adoption_required') {
    actions.push({ kind: 'adopt', intent: 'adopt-position', label: 'Adopt position', reason: true, position: true, capital: true })
  } else if (s === 'long' || s === 'short' || s === 'waiting' || s === 'entering') {
    actions.push({ kind: 'pause', intent: 'pause-ticker', label: 'Pause', reason: true })
  }
  return capitalBlocked ? actions.filter((a) => !a.capital) : actions
}

// Control METHODS that commit capital / take over a position — gated on verified
// lineage. The App-side defense-in-depth check mirrors the UI filter above.
export const CAPITAL_CONTROL_METHODS = new Set(['unlockTicker', 'adoptPosition', 'adoptPositions'])

// ── backtest lineage classification ──────────────────────────────────────────
// Only `verified` may present a runtime/candidate as CURRENTLY RUNNING. mismatch /
// artifact_missing / unsupported_artifact are attention states; unknown (older
// payload) is a NEUTRAL unsupported state — never verified/running. `declared`
// (hash matches, no artifact configured) is a neutral pending state.

const LINEAGE_ATTENTION = new Set(['mismatch', 'artifact_missing', 'unsupported_artifact'])

/**
 * Classify `lineage_status` into `{ status, raw, tone, running, known }` where
 * `status` ∈ verified | mismatch | unknown. `running` is true ONLY for verified,
 * guaranteeing a mismatched/unknown lineage is never read as running.
 */
export function classifyLineage(rawStatus) {
  const raw = rawStatus == null ? '' : String(rawStatus).trim().toLowerCase()
  if (raw === 'verified') return { status: 'verified', raw: rawStatus, tone: 'verified', running: true, known: true }
  if (LINEAGE_ATTENTION.has(raw)) return { status: 'mismatch', raw: rawStatus, tone: 'attention', running: false, known: true }
  if (raw === 'declared') return { status: 'unknown', raw: rawStatus, tone: 'pending', running: false, known: true }
  const knownUnknown = raw === 'unknown'
  return { status: 'unknown', raw: rawStatus, tone: 'neutral', running: false, known: knownUnknown }
}

// ── process grouping + dependency normalization ──────────────────────────────
// Strategy runtimes render under a `process_kind` group (defaulting to
// `corky-strategy-runtime`), NOT under a raw runtime_id. Dependencies come from
// `runtime.dependencies[]` (kind=public|private, dependency_runtime_id); an older
// payload without that array falls back to `target_public/private_runtime_id`.

/**
 * Group runtimes into `[{ process_kind, runtimes }]` in first-seen process order,
 * preserving runtime order within each group. Missing `process_kind` defaults to
 * `corky-strategy-runtime`.
 */
export function groupRuntimesByProcess(runtimes) {
  const order = []
  const buckets = new Map()
  for (const rt of (Array.isArray(runtimes) ? runtimes : [])) {
    if (!rt) continue
    const kind = rt.process_kind != null && String(rt.process_kind).trim() !== ''
      ? rt.process_kind : 'corky-strategy-runtime'
    if (!buckets.has(kind)) { buckets.set(kind, []); order.push(kind) }
    buckets.get(kind).push(rt)
  }
  return order.map((process_kind) => ({ process_kind, runtimes: buckets.get(process_kind) }))
}

/**
 * Normalize dependencies to `[{ kind, runtime_id, legacy }]`. Accepts a runtime
 * object (reads `dependencies[]`, falling back to `target_public/private_runtime_id`
 * tagged `legacy:true`) OR a raw dependencies array. A dependency without a
 * runtime id keeps `runtime_id:null` (rendered as unknown, never silently ok).
 */
export function normalizeDependencies(runtimeOrDeps) {
  const arg = runtimeOrDeps || {}
  const deps = Array.isArray(arg) ? arg
    : (Array.isArray(arg.dependencies) ? arg.dependencies : null)
  if (deps) {
    return deps.filter(Boolean).map((d) => ({
      kind: d.kind != null ? d.kind : null,
      runtime_id: d.dependency_runtime_id != null ? d.dependency_runtime_id
        : (d.runtime_id != null ? d.runtime_id : null),
      legacy: false,
    }))
  }
  const out = []
  if (arg.target_public_runtime_id != null) {
    out.push({ kind: 'public', runtime_id: arg.target_public_runtime_id, legacy: true })
  }
  if (arg.target_private_runtime_id != null) {
    out.push({ kind: 'private', runtime_id: arg.target_private_runtime_id, legacy: true })
  }
  return out
}
