<template>
<div class="sr">
    <!-- Tabbed interface (replaces the old STRATEGY | N runtimes | live header).
         App owns the feed/subscription; this only renders + emits intents. -->
    <div class="sr-tabs" role="tablist" aria-label="Strategy views">
        <button v-for="t in TABS" :key="t.id" class="sr-tab" :class="{ active: activeTab === t.id }"
                role="tab" :aria-selected="activeTab === t.id" @click="activeTab = t.id">{{ t.label }}</button>
        <span class="sr-spacer"></span>
        <span v-if="streaming" class="sr-live" title="Live runtime subscription (full-replacement updates)">● live</span>
        <button class="sr-icon" title="Refresh runtimes" @click="$emit('refresh')">⟳</button>
    </div>

    <div v-if="error" class="sr-error">{{ error }}</div>

    <!-- Runtime selector: one row per runtime in the replacement set. Default
         (v8-tail-repair-live-main) highlighted; others selectable. Hidden only
         for a single auto-selected runtime (its id shows in the Summary head). -->
    <div v-if="loading || runtimes.length !== 1" class="sr-runtimes" role="tablist" aria-label="Strategy runtimes">
        <div v-if="loading && !runtimes.length" class="sr-msg">Loading runtimes…</div>
        <div v-else-if="!runtimes.length" class="sr-msg">No strategy runtimes available.</div>
        <button v-for="rt in runtimes" :key="rt.runtime_id"
                class="sr-rt" :class="{ active: rt.runtime_id === activeRuntimeId }"
                role="tab" :aria-selected="rt.runtime_id === activeRuntimeId"
                @click="$emit('select-runtime', rt.runtime_id)">
            <span class="sr-rt-id">{{ rt.runtime_id }}</span>
            <span class="sr-rt-strategy">{{ rt.strategy }}</span>
            <span class="sr-mode" :class="'mode-' + rt.mode">{{ rt.mode }}</span>
            <span class="rt-badge" :class="'tone-' + readiness(rt.state).tone">{{ readiness(rt.state).state }}</span>
            <span v-if="rt.allocation_strategy_status" class="st-badge"
                  :class="rollupClasses(rt.allocation_strategy_status)">{{ rt.allocation_strategy_status }}</span>
        </button>
    </div>

    <div v-if="!selectedRuntime" class="sr-body">
        <div v-if="!loading" class="sr-msg">No strategy runtime loaded.</div>
    </div>

    <!-- ═══ SUMMARY ═══ -->
    <div v-else-if="activeTab === 'summary'" class="sr-body">
        <section class="sr-sec">
            <div class="sr-sec-head">
                Runtime <span class="sr-rt-name">{{ selectedRuntime.runtime_id }}</span>
                <span class="rt-badge" :class="'tone-' + readiness(selectedRuntime.state).tone">{{ readiness(selectedRuntime.state).state }}</span>
                <span class="sr-mode" :class="'mode-' + selectedRuntime.mode">{{ selectedRuntime.mode }}</span>
                <span v-if="selectedRuntime.allocation_strategy_status" class="st-badge"
                      :class="rollupClasses(selectedRuntime.allocation_strategy_status)">{{ selectedRuntime.allocation_strategy_status }}</span>
            </div>
            <div class="sr-grid">
                <div class="sr-field"><span class="sr-k">strategy</span><span class="sr-v">{{ dash(selectedRuntime.strategy) }}</span></div>
                <div class="sr-field"><span class="sr-k">public runtime</span><span class="sr-v">{{ dash(selectedRuntime.target_public_runtime_id) }}</span></div>
                <div class="sr-field"><span class="sr-k">private runtime</span><span class="sr-v">{{ dash(selectedRuntime.target_private_runtime_id) }}</span></div>
                <div class="sr-field">
                    <span class="sr-k">features</span>
                    <span class="sr-v" :class="gateClass(selectedRuntime.features_ready === selectedRuntime.feature_requirements)">
                        {{ dash(selectedRuntime.features_ready) }} / {{ dash(selectedRuntime.feature_requirements) }} ready
                    </span>
                </div>
                <div class="sr-field"><span class="sr-k">auth ready</span><span class="sr-v" :class="gateClass(selectedRuntime.auth_ready)">{{ boolText(selectedRuntime.auth_ready) }}</span></div>
                <div class="sr-field"><span class="sr-k">allocation ready</span><span class="sr-v" :class="gateClass(selectedRuntime.allocation_ready)">{{ boolText(selectedRuntime.allocation_ready) }}</span></div>
                <div class="sr-field"><span class="sr-k">last decision</span><span class="sr-v time">{{ fmtTime(selectedRuntime.last_decision_ms) }}</span></div>
                <div class="sr-field"><span class="sr-k">ledger / fills</span><span class="sr-v">{{ dash(selectedRuntime.ledger_events) }} / {{ dash(selectedRuntime.fills) }}</span></div>
            </div>

            <!-- Observed allocation balances (decimal strings, cleanly formatted). -->
            <div class="sr-grid">
                <div class="sr-field"><span class="sr-k">observed balance</span><span class="sr-v mono">{{ fmt(selectedRuntime.allocation_observed_balance) }}</span></div>
                <div class="sr-field"><span class="sr-k">observed available</span><span class="sr-v mono">{{ fmt(selectedRuntime.allocation_observed_available) }}</span></div>
                <div class="sr-field"><span class="sr-k">unallocated available</span><span class="sr-v mono">{{ fmt(selectedRuntime.allocation_unallocated_available) }}</span></div>
            </div>

            <div v-if="selectedRuntime.last_error" class="sr-lasterr">
                <span class="sr-k">last error</span> {{ selectedRuntime.last_error }}
            </div>

            <!-- Live-operator approval: expiry + max notional + STALE flag. -->
            <div v-if="approval.present" class="sr-approval" :class="{ stale: approval.stale }">
                <span class="sr-appr-tag">APPROVAL</span>
                <span v-if="approval.stale" class="sr-stale" title="Approval expired (expires_at_ms < now)">⚠ STALE</span>
                <span v-else class="sr-appr-ok">active</span>
                <span class="sr-appr-f">max notional <b class="mono">{{ fmt(approval.maxOrderNotional) }}</b></span>
                <span class="sr-appr-f">expires <span class="time">{{ fmtTime(approval.expiresAtMs) }}</span></span>
                <span v-if="approval.approvedAtMs" class="sr-appr-f">approved <span class="time">{{ fmtTime(approval.approvedAtMs) }}</span></span>
                <span v-if="approval.tradeTimeframe" class="sr-appr-f">trade tf {{ approval.tradeTimeframe }}</span>
                <span v-if="approval.contextTimeframes.length" class="sr-appr-f">ctx {{ approval.contextTimeframes.join(', ') }}</span>
            </div>
        </section>

        <!-- Orders: local journal (queued) kept DISTINCT from dispatched. -->
        <section class="sr-sec">
            <div class="sr-sec-head">Orders
                <span class="sr-dim">total {{ dash(selectedRuntime.orders_total) }} · active/pending {{ dash(selectedRuntime.orders_active_or_pending) }}</span>
            </div>
            <div class="sr-orders">
                <div class="sr-order-grp sr-order-local" title="Durable LOCAL JOURNAL only — NOT sent to the exchange">
                    <span class="sr-og-label">Local journal only</span>
                    <span class="sr-og-hint">(not sent to exchange)</span>
                    <span class="sr-oc"><span class="sr-oc-k">queued</span><span class="sr-oc-v">{{ orderSplit.local.queued }}</span></span>
                </div>
                <div class="sr-order-grp sr-order-dispatched" title="Dispatched / reconciled — states after the order left the local journal">
                    <span class="sr-og-label">Dispatched / reconciled</span>
                    <span v-for="k in dispatchedKeys" :key="k" class="sr-oc" :class="{ zero: !orderSplit.dispatched[k] }">
                        <span class="sr-oc-k">{{ k }}</span><span class="sr-oc-v">{{ orderSplit.dispatched[k] }}</span>
                    </span>
                </div>
            </div>
        </section>
    </div>

    <!-- ═══ BALANCES ═══ -->
    <div v-else-if="activeTab === 'balances'" class="sr-body">
        <section class="sr-sec" v-if="walletTree.length">
            <div class="sr-sec-head">Wallet balances<span class="sr-dim">{{ walletTree.length }}</span></div>
            <div v-for="w in walletTree" :key="w.wallet_type + ':' + w.currency + ':' + w.class"
                 class="sr-wallet" :class="{ alloc: w.isAllocationWallet }">
                <div class="sr-wallet-head">
                    <span class="sym">{{ w.currency }}</span>
                    <span class="sr-wclass">{{ w.class }}</span>
                    <span class="sr-spacer"></span>
                    <span class="sr-wbal"><span class="sr-k">balance</span> <b class="mono">{{ fmt(w.balance) }}</b></span>
                    <span class="sr-wbal"><span class="sr-k">available</span> <b class="mono">{{ fmt(w.available) }}</b></span>
                </div>

                <!-- The wallet the strategy allocates FROM: the allocation pool + the
                     ticker allocations sourced from it. -->
                <div v-if="w.isAllocationWallet" class="sr-wallet-alloc">
                    <div class="sr-alloc-pool">
                        <span class="sr-appr-tag">STRATEGY ALLOCATION</span>
                        <span class="sr-appr-f">observed <b class="mono">{{ fmt(w.observedBalance) }}</b></span>
                        <span class="sr-appr-f">available <b class="mono">{{ fmt(w.observedAvailable) }}</b></span>
                        <span class="sr-appr-f">unallocated <b class="mono">{{ fmt(w.unallocatedAvailable) }}</b></span>
                    </div>
                    <table v-if="w.tickers.length" class="sr-table sr-alloc">
                        <thead>
                            <tr>
                                <th>Symbol</th><th>Status</th>
                                <th class="num">Allocated eq.</th><th class="num">Available</th>
                                <th class="num">Reserved</th><th class="num">Locked</th>
                                <th class="num">Position</th><th class="num">Avg price</th>
                                <th class="num">Realized</th><th class="num">Unreal.</th><th class="num">Fees</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="t in w.tickers" :key="t.ticker_id">
                                <td class="sym" :title="t.ticker_id">{{ t.symbol }}</td>
                                <td><span class="st-badge" :class="statusClasses(t.status)">{{ statusLabel(t.status) }}</span></td>
                                <td class="num mono">{{ fmt(t.allocated_equity) }}</td>
                                <td class="num mono">{{ fmt(t.available_cash) }}</td>
                                <td class="num mono">{{ fmt(t.reserved_cash) }}</td>
                                <td class="num mono">{{ fmt(t.locked_margin) }}</td>
                                <td class="num mono">{{ fmt(t.position_quantity) }}</td>
                                <td class="num mono">{{ fmt(t.position_avg_price) }}</td>
                                <td class="num mono" :class="signClass(t.realized_pnl)">{{ fmt(t.realized_pnl) }}</td>
                                <td class="num mono" :class="signClass(t.unrealized_pnl)">{{ fmt(t.unrealized_pnl) }}</td>
                                <td class="num mono">{{ fmt(t.fees_paid) }}</td>
                            </tr>
                        </tbody>
                    </table>
                    <div v-else class="sr-msg sr-msg-sm">No ticker allocations under this wallet.</div>
                </div>
            </div>
        </section>
        <div v-else class="sr-msg sr-msg-sm">No wallet balances for this runtime.</div>
    </div>

    <!-- ═══ DECISION AUDIT ═══ -->
    <div v-else-if="activeTab === 'audit'" class="sr-body">
        <section class="sr-sec">
            <div class="sr-sec-head">Decision audit<span class="sr-dim">{{ decisions.length }}</span></div>
            <div v-if="!auditTickers.length" class="sr-msg sr-msg-sm">No decisions loaded for this runtime.</div>
            <div v-else class="sr-audit">
                <!-- clickable ticker list -->
                <div class="sr-audit-list" role="tablist" aria-label="Tickers">
                    <button v-for="tk in auditTickers" :key="tk.ticker_id"
                            class="sr-audit-tk" :class="{ active: tk.ticker_id === activeAuditTicker }"
                            role="tab" :aria-selected="tk.ticker_id === activeAuditTicker"
                            @click="selectedAuditTicker = tk.ticker_id">
                        <span class="sym">{{ tk.symbol }}</span>
                        <span class="sr-dim">{{ tk.count }}</span>
                    </button>
                </div>
                <!-- the selected ticker's most-recent decisions -->
                <div class="sr-audit-detail">
                    <table v-if="auditDecisions.length" class="sr-table sr-decisions">
                        <thead>
                            <tr>
                                <th>Time</th><th>TF</th><th>Outcome</th>
                                <th class="num">Intents</th><th class="num">Queued</th><th class="num">Rejected</th>
                                <th>Risk checks</th><th>Ledger Δ</th><th>Claims</th><th>Fingerprint</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="d in auditDecisions" :key="d.decision_id || (d.decision_ts_ms + ':' + d.symbol)">
                                <td class="time">{{ fmtTime(d.decision_ts_ms) }}</td>
                                <td>{{ dash(d.timeframe) }}</td>
                                <td><span class="sr-outcome" :class="outcomeClass(d.outcome)">{{ dash(d.outcome) }}</span></td>
                                <td class="num" :title="intentsTitle(d.intents)">{{ (d.intents || []).length }}</td>
                                <td class="num" title="Queued order intents (local journal only — NOT sent to the exchange)">{{ dash0(d.queued_order_count) }}</td>
                                <td class="num" :class="{ neg: numOr0(d.rejected_order_count) > 0 }">{{ dash0(d.rejected_order_count) }}</td>
                                <td :title="checksTitle(d.risk_checks)"><span class="sr-chip" :class="{ warn: risksFailed(d.risk_checks) }">{{ (d.risk_checks || []).length }}</span></td>
                                <td :title="deltasTitle(d.ledger_deltas)"><span class="sr-chip">{{ (d.ledger_deltas || []).length }}</span></td>
                                <td :title="claimsTitle(d.claim_states)"><span class="sr-chip">{{ (d.claim_states || []).length }}</span></td>
                                <td class="sr-fp mono" :title="d.feature_fingerprint">{{ shortFp(d.feature_fingerprint) }}</td>
                            </tr>
                        </tbody>
                    </table>
                    <div v-else class="sr-msg sr-msg-sm">Select a ticker to view its decisions.</div>
                </div>
            </div>
        </section>
    </div>
</div>
</template>

<script>
// CorkyStrategyPanel — presentational Strategy-runtime view (bottom dock). App
// owns the CorkyStrategyFeed + selection/state; this renders props + emits intents
// (select-runtime / refresh). Three tabs: Summary / Balances / Decision Audit.
//
// DECIMAL SAFETY: every money/quantity field is a decimal STRING. fmt() formats
// for display via PURE STRING MANIPULATION (trims trailing zeros, groups
// thousands) — it never Number()-parses, so 28-digit decimals stay exact.
// Number() is only used for colouring / order-COUNT integers.
//
// TWO STATUS AXES kept visually distinct: runtime READINESS (Ready/…) vs
// strategy/allocation status (waiting/long/short/…). `queued` = durable LOCAL
// JOURNAL only (NOT exchange-sent).
import {
    classifyStrategyStatus,
    classifyRuntimeReadiness,
    classifyRuntimeStrategyRollup,
    splitOrderStatusCounts,
    approvalStatus,
    fmtDecimal,
    DISPATCHED_STATUS_KEYS,
} from '../../helpers/feed/corky-strategy-transforms.js'
import { isNeg } from '../../helpers/feed/corky-positions.js'

const DEFAULT_RUNTIME_ID = 'v8-tail-repair-live-main'
const TABS = [
    { id: 'summary', label: 'Summary' },
    { id: 'balances', label: 'Balances' },
    { id: 'audit', label: 'Decision Audit' },
]

export default {
    name: 'CorkyStrategyPanel',
    props: {
        runtimes: { type: Array, default: () => [] },
        selectedRuntimeId: { type: String, default: '' },
        decisions: { type: Array, default: () => [] },
        loading: { type: Boolean, default: false },
        error: { type: String, default: null },
        streaming: { type: Boolean, default: false },
        now: { type: Number, default: 0 },
    },
    emits: ['select-runtime', 'refresh'],
    data() {
        return {
            TABS,
            activeTab: 'summary',
            // Decision-audit: which ticker's decisions are shown (local UI state).
            selectedAuditTicker: '',
        }
    },
    computed: {
        activeRuntimeId() {
            const ids = this.runtimes.map((r) => r && r.runtime_id)
            if (this.selectedRuntimeId && ids.includes(this.selectedRuntimeId)) return this.selectedRuntimeId
            if (ids.includes(DEFAULT_RUNTIME_ID)) return DEFAULT_RUNTIME_ID
            return ids[0] || ''
        },
        selectedRuntime() {
            return this.runtimes.find((r) => r && r.runtime_id === this.activeRuntimeId) || null
        },
        approval() {
            const rt = this.selectedRuntime
            return approvalStatus(rt && rt.live_operator_approval, this.now || Date.now())
        },
        orderSplit() {
            return splitOrderStatusCounts(this.selectedRuntime && this.selectedRuntime.order_status_counts)
        },
        dispatchedKeys() { return DISPATCHED_STATUS_KEYS },
        // Per-ticker allocation rows: ticker_allocations joined with ticker_orders
        // (order counts) by ticker_id. Each carries its own status + order split.
        tickerRows() {
            const rt = this.selectedRuntime
            if (!rt) return []
            const ordersById = new Map()
            for (const o of (rt.ticker_orders || [])) if (o && o.ticker_id) ordersById.set(o.ticker_id, o)
            return (rt.ticker_allocations || []).map((a) => {
                const orders = ordersById.get(a.ticker_id) || null
                return {
                    ...a,
                    symbol: (orders && orders.symbol) || this._symbolFromTickerId(a.ticker_id),
                    orderSplit: splitOrderStatusCounts(orders && orders.order_status_counts),
                }
            })
        },
        // Balances tab: wallet balances, each annotated with the strategy allocation
        // it sources (only the wallet matching allocation_wallet_type +
        // allocation_quote_currency), with the ticker allocations nested under it.
        // NOTE: the wallet↔allocation match is INFERRED here from the single-pool
        // snapshot shape — see the backend note in the PR; an explicit per-wallet
        // `allocated_to_strategy` + `ticker_allocations` would remove this inference.
        walletTree() {
            const rt = this.selectedRuntime
            if (!rt) return []
            const allocType = rt.allocation_wallet_type
            const allocCcy = rt.allocation_quote_currency
            const balances = Array.isArray(rt.auth_wallet_balances) ? rt.auth_wallet_balances : []
            let matched = false
            const rows = balances.map((w) => {
                const isAlloc = allocCcy != null && w.currency === allocCcy &&
                    (allocType == null || w.wallet_type === allocType)
                if (isAlloc) matched = true
                return {
                    wallet_type: w.wallet_type, currency: w.currency,
                    class: w.class || w.wallet_type || 'other',
                    balance: w.balance, available: w.available,
                    isAllocationWallet: isAlloc,
                    observedBalance: isAlloc ? rt.allocation_observed_balance : null,
                    observedAvailable: isAlloc ? rt.allocation_observed_available : null,
                    unallocatedAvailable: isAlloc ? rt.allocation_unallocated_available : null,
                    tickers: isAlloc ? this.tickerRows : [],
                }
            })
            // Fallback: the allocation wallet isn't in the balances list → surface
            // the pool + tickers as a synthetic row so allocations are never hidden.
            if (!matched && (this.tickerRows.length || allocCcy != null)) {
                rows.push({
                    wallet_type: allocType || '', currency: allocCcy || '—', class: 'allocation',
                    balance: rt.allocation_observed_balance, available: rt.allocation_observed_available,
                    isAllocationWallet: true,
                    observedBalance: rt.allocation_observed_balance,
                    observedAvailable: rt.allocation_observed_available,
                    unallocatedAvailable: rt.allocation_unallocated_available,
                    tickers: this.tickerRows,
                })
            }
            return rows
        },
        // Decisions grouped by ticker (input order) — feeds the audit ticker list.
        decisionGroups() {
            const groups = []
            const byId = new Map()
            for (const d of this.decisions) {
                if (!d) continue
                const id = d.ticker_id || d.symbol || 'unknown'
                let g = byId.get(id)
                if (!g) { g = { ticker_id: id, symbol: d.symbol || id, decisions: [] }; byId.set(id, g); groups.push(g) }
                g.decisions.push(d)
            }
            return groups
        },
        auditTickers() {
            return this.decisionGroups.map((g) => ({ ticker_id: g.ticker_id, symbol: g.symbol, count: g.decisions.length }))
        },
        activeAuditTicker() {
            const ids = this.auditTickers.map((t) => t.ticker_id)
            if (this.selectedAuditTicker && ids.includes(this.selectedAuditTicker)) return this.selectedAuditTicker
            return ids[0] || ''
        },
        // The selected ticker's decisions, MOST RECENT FIRST (decision_ts_ms is an
        // integer epoch-ms — safe to sort numerically).
        auditDecisions() {
            const id = this.activeAuditTicker
            if (!id) return []
            return this.decisions
                .filter((d) => d && (d.ticker_id || d.symbol) === id)
                .slice()
                .sort((a, b) => (Number(b.decision_ts_ms) || 0) - (Number(a.decision_ts_ms) || 0))
        },
    },
    methods: {
        // ── formatting ──────────────────────────────────────────────────────────
        // Clean decimal display: trims trailing zeros + groups thousands, PURE
        // string manipulation (never float-parses). null/'' → '—'.
        fmt(v) { return fmtDecimal(v) },
        dash(v) { return (v == null || v === '') ? '—' : v },
        dash0(v) { return (v == null || v === '') ? '0' : v },
        boolText(v) { return v === true ? 'yes' : v === false ? 'no' : '—' },
        gateClass(ok) { return ok === true ? 'pos' : ok === false ? 'neg' : '' },
        // Colour a P/L decimal string by its TEXTUAL sign (no float maths).
        signClass(dec) {
            if (dec == null || dec === '') return ''
            const s = String(dec).trim()
            if (isNeg(s)) return 'neg'
            return /^0(?:\.0+)?$/.test(s) ? '' : 'pos'
        },
        numOr0(v) { const n = Number(v); return Number.isFinite(n) ? n : 0 },
        // ── classification helpers ──────────────────────────────────────────────
        readiness(state) { return classifyRuntimeReadiness(state) },
        statusClasses(raw) {
            const info = classifyStrategyStatus(raw)
            return [`tone-${info.tone}`, `st-${info.status}`]
        },
        statusLabel(raw) { return classifyStrategyStatus(raw).status },
        rollupClasses(raw) { return [`tone-${classifyRuntimeStrategyRollup(raw).tone}`] },
        // ── decision-audit cell summaries (hover titles) ────────────────────────
        intentsTitle(intents) {
            const a = Array.isArray(intents) ? intents : []
            if (!a.length) return 'no order intents'
            return a.map((i) => i && (i.kind || i.side || i.action || JSON.stringify(i))).join('\n')
        },
        checksTitle(checks) {
            return (Array.isArray(checks) ? checks : [])
                .map((c) => `${c.name}: ${c.status}${c.detail ? ' — ' + c.detail : ''}`).join('\n') || 'no risk checks'
        },
        risksFailed(checks) {
            return (Array.isArray(checks) ? checks : []).some((c) => {
                const s = String(c && c.status || '').toLowerCase()
                return s === 'failed' || s === 'rejected' || s === 'error'
            })
        },
        deltasTitle(deltas) {
            return (Array.isArray(deltas) ? deltas : [])
                .map((d) => `${d.kind}${d.detail ? ' — ' + d.detail : ''}`).join('\n') || 'no ledger deltas'
        },
        claimsTitle(claims) {
            return (Array.isArray(claims) ? claims : [])
                .map((c) => `${c.ticker_id || ''}: ${c.status}`).join('\n') || 'no claim states'
        },
        outcomeClass(outcome) {
            const s = String(outcome || '').toLowerCase()
            if (s.includes('reject') || s.includes('error') || s.includes('fail')) return 'neg'
            if (s.includes('order') || s.includes('fill') || s.includes('queued')) return 'act'
            return ''
        },
        shortFp(fp) {
            if (!fp) return '—'
            const s = String(fp).replace(/^sha256:/, '')
            return s.length > 10 ? s.slice(0, 10) + '…' : s
        },
        _symbolFromTickerId(id) {
            if (!id) return ''
            const parts = String(id).split(':')
            return parts.length > 2 ? parts.slice(1).join(':') : id
        },
        fmtTime(ms) {
            if (!(ms > 0)) return '—'
            const d = new Date(ms)
            if (Number.isNaN(d.getTime())) return '—'
            const pad = (n) => String(n).padStart(2, '0')
            return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
        },
    },
}
</script>

<style scoped>
.sr { display: flex; flex-direction: column; height: 100%; color: #d1d4dc; font-size: 12px; }

/* Tab bar */
.sr-tabs { display: flex; align-items: stretch; gap: 2px; padding: 0 8px; border-bottom: 1px solid #1c212e; background: #121827; }
.sr-tab { background: none; border: none; border-bottom: 2px solid transparent; color: #808a9d; font-size: 12px;
          padding: 9px 12px; cursor: pointer; }
.sr-tab:hover { color: #d1d4dc; }
.sr-tab.active { color: #35a776; border-bottom-color: #35a776; font-weight: 600; }
.sr-spacer { flex: 1 1 auto; }
.sr-live { color: #35a776; font-size: 11px; align-self: center; }
.sr-icon { align-self: center; background: #131722; color: #808a9d; border: 1px solid #2a2e39; border-radius: 4px; width: 24px; height: 24px; cursor: pointer; margin: 0 4px; }
.sr-icon:hover { color: #35a776; border-color: #35a776; }
.sr-error { padding: 8px 12px; color: #e54150; }
.sr-msg { padding: 14px; color: #808a9d; text-align: center; }
.sr-msg-sm { padding: 8px; text-align: left; font-size: 11px; }

/* Runtime selector */
.sr-runtimes { display: flex; flex-direction: column; gap: 4px; padding: 8px 12px; border-bottom: 1px solid #1c212e; }
.sr-rt { display: flex; align-items: center; gap: 10px; text-align: left; background: #0e1320; color: #d1d4dc;
         border: 1px solid #2a2e39; border-radius: 4px; padding: 6px 10px; cursor: pointer; }
.sr-rt:hover { border-color: #35a776; }
.sr-rt.active { border-color: #35a776; box-shadow: inset 3px 0 0 #35a776; background: rgba(53,167,118,0.08); }
.sr-rt-id { font-weight: 700; color: #fff; }
.sr-rt-strategy { color: #808a9d; }
.sr-rt-name { color: #fff; font-weight: 700; text-transform: none; letter-spacing: 0; font-size: 12px; }
.sr-mode { font-size: 10px; text-transform: uppercase; padding: 1px 6px; border-radius: 8px; background: #2a2e39; color: #b0b6c0; }
.sr-mode.mode-live { background: rgba(229,65,80,0.16); color: #e07a85; }
.sr-mode.mode-shadow_live { background: rgba(88,166,255,0.16); color: #58a6ff; }

/* Body / sections */
.sr-body { flex: 1 1 0; min-height: 0; overflow: auto; padding: 4px 12px 14px; }
.sr-sec { margin-top: 12px; }
.sr-sec-head { display: flex; align-items: center; gap: 8px; color: #35a776; font-weight: 700; font-size: 10px;
              letter-spacing: 0.06em; text-transform: uppercase; padding: 6px 0 4px; border-bottom: 1px solid #1c212e; }
.sr-dim { color: #808a9d; margin-left: 4px; }
.sr-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 4px 16px; margin-top: 6px; }
.sr-field { display: flex; justify-content: space-between; gap: 10px; padding: 2px 0; }
.sr-k { color: #808a9d; }
.sr-v { color: #d1d4dc; text-align: right; }
.mono { font-variant-numeric: tabular-nums; }
.time { color: #808a9d; }
.sr-lasterr { margin-top: 8px; color: #e07a85; background: rgba(229,65,80,0.08); border: 1px solid rgba(229,65,80,0.3); border-radius: 4px; padding: 6px 8px; }

/* Readiness badge (delivery axis) */
.rt-badge { font-size: 10px; text-transform: uppercase; padding: 1px 7px; border-radius: 9px; background: #2a2e39; color: #b0b6c0; }
.rt-badge.tone-ready { background: rgba(53,167,118,0.18); color: #35a776; }
.rt-badge.tone-pending { background: rgba(245,197,24,0.18); color: #f5c518; }
.rt-badge.tone-unknown { background: #2a2e39; color: #808a9d; }

/* Approval + allocation pool chips */
.sr-approval { display: flex; flex-wrap: wrap; align-items: center; gap: 10px; margin-top: 8px;
               border: 1px solid rgba(53,167,118,0.3); border-radius: 4px; padding: 6px 10px; background: rgba(53,167,118,0.05); }
.sr-approval.stale { border-color: rgba(229,65,80,0.5); background: rgba(229,65,80,0.07); }
.sr-appr-tag { font-size: 9px; font-weight: 700; letter-spacing: 0.06em; color: #808a9d; }
.sr-appr-ok { color: #35a776; font-size: 11px; }
.sr-stale { color: #e54150; font-weight: 700; font-size: 11px; }
.sr-appr-f { color: #808a9d; font-size: 11px; }
.sr-appr-f b { color: #d1d4dc; }

/* Orders */
.sr-orders { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 8px; }
.sr-order-grp { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; border: 1px solid #2a2e39; border-radius: 4px; padding: 6px 10px; }
.sr-order-local { border-color: rgba(245,197,24,0.4); background: rgba(245,197,24,0.05); }
.sr-og-label { font-size: 10px; font-weight: 700; letter-spacing: 0.04em; text-transform: uppercase; color: #b0b6c0; }
.sr-og-hint { font-size: 10px; color: #f5c518; font-style: italic; }
.sr-oc { display: inline-flex; gap: 4px; align-items: baseline; }
.sr-oc-k { color: #808a9d; font-size: 11px; }
.sr-oc-v { color: #d1d4dc; font-variant-numeric: tabular-nums; }
.sr-oc.zero .sr-oc-k, .sr-oc.zero .sr-oc-v { color: #5c6470; }

/* Balances: wallet cards with a nested allocation block */
.sr-wallet { border: 1px solid #2a2e39; border-radius: 5px; margin-top: 8px; overflow: hidden; }
.sr-wallet.alloc { border-color: rgba(53,167,118,0.4); }
.sr-wallet-head { display: flex; align-items: center; gap: 10px; padding: 8px 10px; background: #131a27; }
.sr-wclass { font-size: 10px; text-transform: uppercase; letter-spacing: 0.05em; color: #808a9d; }
.sr-wbal { font-size: 11px; color: #d1d4dc; }
.sr-wbal .sr-k { margin-right: 4px; }
.sr-wallet-alloc { padding: 8px 10px; border-top: 1px solid #1c212e; }
.sr-alloc-pool { display: flex; flex-wrap: wrap; align-items: center; gap: 12px; margin-bottom: 8px; }

/* Decision audit: ticker list + detail */
.sr-audit { display: flex; gap: 10px; margin-top: 8px; align-items: flex-start; }
.sr-audit-list { display: flex; flex-direction: column; gap: 4px; flex: 0 0 200px; }
.sr-audit-tk { display: flex; justify-content: space-between; align-items: center; gap: 8px; text-align: left;
               background: #0e1320; border: 1px solid #2a2e39; border-radius: 4px; color: #d1d4dc; padding: 8px 10px; cursor: pointer; }
.sr-audit-tk:hover { border-color: #35a776; }
.sr-audit-tk.active { border-color: #35a776; box-shadow: inset 3px 0 0 #35a776; background: rgba(53,167,118,0.08); }
.sr-audit-detail { flex: 1 1 0; min-width: 0; overflow: auto; }

/* Tables (shared) */
.sr-table { width: 100%; border-collapse: collapse; }
.sr-table th { text-align: left; padding: 4px 8px; border-bottom: 1px solid #2a2e39; color: #808a9d; font-weight: 500; white-space: nowrap; }
.sr-table td { padding: 4px 8px; border-bottom: 1px solid #1c212e; white-space: nowrap; }
.sr-table .num { text-align: right; font-variant-numeric: tabular-nums; }
.sr-table tbody tr:nth-child(even) { background: rgba(255,255,255,0.025); }
.sym { color: #fff; font-weight: 600; }

/* Strategy/allocation status badges — one distinct treatment per status. */
.st-badge { font-size: 10px; text-transform: uppercase; padding: 1px 7px; border-radius: 9px; background: #2a2e39; color: #b0b6c0; white-space: nowrap; }
.st-badge.tone-idle { background: rgba(129,139,157,0.18); color: #9aa4b2; }
.st-badge.tone-long { background: rgba(53,167,118,0.18); color: #35a776; }
.st-badge.tone-short { background: rgba(229,65,80,0.18); color: #e54150; }
.st-badge.tone-warn { background: rgba(245,197,24,0.18); color: #f5c518; }
.st-badge.tone-critical { background: rgba(229,65,80,0.28); color: #ff6b7a; }
.st-badge.tone-unknown { background: #2a2e39; color: #808a9d; }
.st-badge.tone-ready { background: rgba(53,167,118,0.18); color: #35a776; }
.st-badge.st-waiting { box-shadow: inset 0 0 0 1px rgba(129,139,157,0.5); }
.st-badge.st-long { box-shadow: inset 0 0 0 1px rgba(53,167,118,0.6); }
.st-badge.st-short { box-shadow: inset 0 0 0 1px rgba(229,65,80,0.6); }
.st-badge.st-paused { box-shadow: inset 0 0 0 1px rgba(245,197,24,0.7); border-radius: 3px; }
.st-badge.st-degraded { box-shadow: inset 0 0 0 1px rgba(255,159,64,0.7); background: rgba(255,159,64,0.16); color: #ff9f40; }
.st-badge.st-bust_locked { box-shadow: inset 0 0 0 1px rgba(229,65,80,0.9); background: rgba(229,65,80,0.34); color: #fff; letter-spacing: 0.04em; }
.st-badge.st-capital_shortfall { box-shadow: inset 0 0 0 1px rgba(187,134,252,0.8); background: rgba(187,134,252,0.2); color: #bb86fc; }

/* Decision audit table cells */
.sr-outcome { font-size: 11px; }
.sr-outcome.neg { color: #e54150; }
.sr-outcome.act { color: #35a776; }
.sr-chip { display: inline-block; min-width: 16px; text-align: center; font-size: 10px; padding: 0 5px; border-radius: 8px; background: #2a2e39; color: #b0b6c0; }
.sr-chip.warn { background: rgba(229,65,80,0.2); color: #e54150; }
.sr-fp { color: #5c6470; font-size: 11px; }

.pos { color: #23a776; }
.neg { color: #e54150; }
</style>
