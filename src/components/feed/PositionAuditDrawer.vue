<template>
<div v-if="open" class="pad-overlay" @click.self="$emit('close')">
    <div class="pad-modal" role="dialog" aria-modal="true"
         :aria-label="`Position audit ${headSymbol} #${headId}`">
        <div class="pad-head">
            <div class="pad-title">
                <span class="pad-sym">{{ headSymbol }}</span>
                <span class="pad-id">#{{ headId }}</span>
                <span v-if="audit" class="pad-badge" :class="'st-' + (audit.summary && audit.summary.status)">
                    {{ audit.summary && audit.summary.status }}
                </span>
            </div>
            <button class="pad-close" title="Close" @click="$emit('close')">✕</button>
        </div>

        <div class="pad-body">
            <div v-if="error" class="pad-msg pad-error">{{ error }}</div>
            <div v-if="loading && !audit" class="pad-msg">Loading audit…</div>
            <div v-else-if="!audit" class="pad-msg">No audit data.</div>

            <template v-else>
                <!-- degraded / incomplete / missing reasons -->
                <div v-if="isMissing" class="pad-note">
                    No audit on disk for this position.
                </div>
                <div v-else-if="reasons.length" class="pad-note pad-note-warn">
                    <div class="pad-note-title">Audit {{ audit.summary.status }} — reasons:</div>
                    <ul><li v-for="(r, i) in reasons" :key="i">{{ r }}</li></ul>
                </div>

                <!-- position identity / window -->
                <div class="pad-section" v-if="audit.position">
                    <div class="pad-section-title">Position</div>
                    <div class="pad-kv">
                        <span>Side</span><b :class="sideClass(audit.position.side)">{{ audit.position.side }}</b>
                        <span>Status</span><b>{{ audit.position.status }}</b>
                        <span>Amount</span><b>{{ audit.position.amount }}</b>
                        <span>Base price</span><b>{{ audit.position.base_price }}</b>
                        <span>Opened</span><b>{{ fmtTime(audit.position.opened_at_ms) }}</b>
                        <span>Closed</span><b>{{ fmtTime(audit.position.closed_at_ms) }}</b>
                    </div>
                </div>

                <!-- reconciliation summary -->
                <div class="pad-section" v-if="audit.summary">
                    <div class="pad-section-title">Summary</div>
                    <div class="pad-kv">
                        <span>Orders</span><b>{{ audit.summary.order_count }}</b>
                        <span>Trades</span><b>{{ audit.summary.trade_count }}</b>
                        <span>Fee events</span><b>{{ audit.summary.fee_count || 0 }}</b>
                        <span>Trade Σ</span><b>{{ audit.summary.trade_amount_sum }}</b>
                        <span>Expected</span><b>{{ audit.summary.expected_position_amount }}</b>
                        <span>Δ amount</span><b :class="signClass(audit.summary.amount_delta)">{{ audit.summary.amount_delta }}</b>
                        <span>Total fees</span><b>{{ feesText }}</b>
                    </div>
                </div>

                <!-- linked orders -->
                <div class="pad-section" v-if="orders.length">
                    <div class="pad-section-title">Orders ({{ orders.length }})</div>
                    <table class="pad-table">
                        <thead><tr><th>ID</th><th>Type</th><th>Status</th><th class="num">Amount</th><th class="num">Price</th><th>Created</th></tr></thead>
                        <tbody>
                            <tr v-for="o in orders" :key="o.order_id">
                                <td>{{ o.order_id }}</td>
                                <td>{{ o.order_type }}</td>
                                <td>{{ o.status || '—' }}</td>
                                <td class="num">{{ o.amount == null ? '—' : o.amount }}</td>
                                <td class="num">{{ o.price == null ? '—' : o.price }}</td>
                                <td class="time">{{ fmtTime(o.created_at_ms) }}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <!-- linked trades -->
                <div class="pad-section" v-if="trades.length">
                    <div class="pad-section-title">Trades ({{ trades.length }})</div>
                    <table class="pad-table">
                        <thead><tr><th>ID</th><th class="num">Amount</th><th class="num">Price</th><th>Maker</th><th class="num">Fee</th><th>Executed</th></tr></thead>
                        <tbody>
                            <tr v-for="t in trades" :key="t.trade_id">
                                <td>{{ t.trade_id }}</td>
                                <td class="num">{{ t.amount }}</td>
                                <td class="num">{{ t.price }}</td>
                                <td>{{ t.maker ? 'maker' : 'taker' }}</td>
                                <td class="num" :class="signClass(t.fee)">{{ t.fee == null ? '—' : (t.fee + ' ' + (t.fee_currency || '')) }}</td>
                                <td class="time">{{ fmtTime(t.execution_timestamp_ms) }}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <!-- ledger fee events (funding / margin) — distinct from trade fees -->
                <div class="pad-section" v-if="fees.length">
                    <div class="pad-section-title">Fees ({{ fees.length }})</div>
                    <table class="pad-table">
                        <thead><tr><th>Kind</th><th>Description</th><th class="num">Amount</th><th>When</th></tr></thead>
                        <tbody>
                            <tr v-for="f in fees" :key="f.fee_id">
                                <td><span class="pad-fee-kind" :class="'fk-' + f.kind">{{ feeKindLabel(f.kind) }}</span></td>
                                <td class="pad-fee-desc" :title="f.description">{{ f.description }}</td>
                                <td class="num" :class="signClass(f.amount)">{{ f.amount }} {{ f.currency }}</td>
                                <td class="time">{{ fmtTime(f.timestamp_ms) }}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </template>
        </div>
    </div>
</div>
</template>

<script>
import { isNeg } from '../../helpers/feed/corky-positions.js'

export default {
    name: 'PositionAuditDrawer',
    props: {
        open: { type: Boolean, default: false },
        audit: { type: Object, default: null },
        loading: { type: Boolean, default: false },
        error: { type: String, default: null },
        // Fallback identity for the header before the bundle lands.
        target: { type: Object, default: null },
    },
    emits: ['close'],
    watch: {
        // Esc-to-close while the modal is open (document-level so it works
        // regardless of focus).
        open(now) {
            if (now) document.addEventListener('keydown', this._onKeydown)
            else document.removeEventListener('keydown', this._onKeydown)
        },
    },
    mounted() {
        this._onKeydown = (e) => { if (e.key === 'Escape') this.$emit('close') }
        if (this.open) document.addEventListener('keydown', this._onKeydown)
    },
    beforeUnmount() {
        if (this._onKeydown) document.removeEventListener('keydown', this._onKeydown)
    },
    computed: {
        headSymbol() {
            return (this.audit && this.audit.symbol) || (this.target && this.target.symbol) || '—'
        },
        headId() {
            const id = (this.audit && this.audit.position_id) != null
                ? this.audit.position_id
                : (this.target && this.target.position_id)
            return id == null ? '—' : id
        },
        isMissing() {
            return !!(this.audit && this.audit.summary && this.audit.summary.status === 'missing')
        },
        reasons() {
            return (this.audit && this.audit.summary && this.audit.summary.reasons) || []
        },
        orders() { return (this.audit && this.audit.orders) || [] },
        trades() { return (this.audit && this.audit.trades) || [] },
        fees() { return (this.audit && this.audit.fees) || [] },   // ledger fee events (back-compat: [])
        feesText() {
            const fees = this.audit && this.audit.summary && this.audit.summary.fees_by_currency
            if (!fees) return '—'
            const parts = Object.entries(fees).map(([cur, amt]) => `${amt} ${cur}`)
            return parts.length ? parts.join(', ') : '—'
        },
    },
    methods: {
        signClass(dec) {
            if (dec == null || dec === '') return ''
            return isNeg(dec) ? 'neg' : 'pos'
        },
        sideClass(side) {
            const s = String(side || '').toLowerCase()
            if (s === 'long') return 'side-long'
            if (s === 'short') return 'side-short'
            return ''
        },
        fmtTime(ms) {
            // null / 0 / negative / NaN = unknown — never render the 1970 epoch
            // (e.g. a current position whose opened_at_ms came through as 0).
            if (!(ms > 0)) return '—'
            const d = new Date(ms)
            if (Number.isNaN(d.getTime())) return '—'
            const pad = (n) => String(n).padStart(2, '0')
            return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
        },
        feeKindLabel(kind) {
            switch (kind) {
                case 'margin_funding': return 'Margin funding'
                case 'derivatives_funding': return 'Derivatives funding'
                case 'funding_provider_fee': return 'Provider fee'
                default: return kind || 'Fee'
            }
        },
    },
}
</script>

<style scoped>
.pad-overlay {
    position: fixed; inset: 0;
    background: rgba(0, 0, 0, 0.55);
    display: flex; align-items: center; justify-content: center;
    z-index: 2000;
}
.pad-modal {
    width: 640px; max-width: 92vw; max-height: 86vh;
    display: flex; flex-direction: column;
    background: #1e222d;
    border: 1px solid #2a2e39;
    border-radius: 8px;
    color: #d1d4dc;
    font-size: 12px;
    box-shadow: 0 12px 40px rgba(0, 0, 0, 0.5);
}
.pad-head {
    display: flex; align-items: center; justify-content: space-between;
    padding: 12px 16px;
    border-bottom: 1px solid #2a2e39;
}
.pad-title { display: flex; align-items: center; gap: 8px; }
.pad-sym { font-size: 14px; font-weight: 700; color: #fff; }
.pad-id { color: #808a9d; }
.pad-badge {
    text-transform: capitalize;
    padding: 2px 8px; border-radius: 10px;
    font-size: 10px; font-weight: 600;
}
.st-complete { background: rgba(35, 167, 118, 0.18); color: #23a776; }
.st-degraded, .st-incomplete { background: rgba(217, 119, 6, 0.18); color: #d97706; }
.st-missing { background: #2a2e39; color: #808a9d; }
.pad-close {
    background: transparent; border: none; color: #808a9d;
    font-size: 16px; cursor: pointer;
}
.pad-close:hover { color: #fff; }

.pad-body { padding: 12px 16px; overflow: auto; }
.pad-msg { padding: 12px; text-align: center; color: #808a9d; }
.pad-error { color: #e54150; }
.pad-note {
    padding: 8px 10px; margin-bottom: 12px;
    background: #131722; border-radius: 6px; color: #808a9d;
}
.pad-note-warn { border-left: 3px solid #d97706; }
.pad-note-title { color: #d97706; font-weight: 600; margin-bottom: 4px; }
.pad-note ul { margin: 0; padding-left: 18px; }

.pad-section { margin-bottom: 14px; }
.pad-section-title {
    color: #808a9d; font-weight: 600; text-transform: uppercase;
    font-size: 10px; letter-spacing: 0.4px; margin-bottom: 6px;
}
.pad-kv {
    display: grid; grid-template-columns: auto 1fr auto 1fr auto 1fr;
    gap: 4px 10px; align-items: baseline;
}
.pad-kv span { color: #808a9d; }
.pad-kv b { color: #d1d4dc; font-weight: 600; font-variant-numeric: tabular-nums; }

.pad-table { width: 100%; border-collapse: collapse; margin-top: 4px; }
.pad-table th {
    text-align: left; color: #808a9d; font-weight: 500;
    padding: 5px 8px; border-bottom: 1px solid #2a2e39; white-space: nowrap;
}
.pad-table td { padding: 5px 8px; border-bottom: 1px solid #2a2e39; white-space: nowrap; }
.pad-table .num { text-align: right; font-variant-numeric: tabular-nums; }
.time { color: #808a9d; }
.pos { color: #23a776; }
.neg { color: #e54150; }
.pad-fee-kind {
    display: inline-block; padding: 1px 6px; border-radius: 8px;
    font-size: 10px; font-weight: 600; white-space: nowrap;
    background: rgba(217, 119, 6, 0.18); color: #d97706;
}
.fk-derivatives_funding { background: rgba(100, 181, 246, 0.18); color: #64b5f6; }
.fk-funding_provider_fee { background: rgba(53, 167, 118, 0.18); color: #35a776; }
.pad-fee-desc {
    max-width: 240px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
    color: #d1d4dc;
}
.side-long { color: #23a776; text-transform: capitalize; }
.side-short { color: #e54150; text-transform: capitalize; }
</style>
