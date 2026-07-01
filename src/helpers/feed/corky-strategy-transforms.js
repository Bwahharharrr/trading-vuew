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
