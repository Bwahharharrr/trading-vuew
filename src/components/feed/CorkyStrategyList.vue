<template>
<div class="strategy-list">
    <div class="strategy-list-head">
        <div>
            <div class="strategy-list-title">Strategies</div>
            <div class="strategy-list-summary">{{ summary }}</div>
        </div>
        <div class="strategy-list-actions">
            <span v-if="streaming" class="strategy-list-live">● live</span>
            <button class="strategy-list-refresh" title="Refresh strategies" @click="$emit('refresh')">⟳</button>
        </div>
    </div>

    <div v-if="error && runtimes.length" class="strategy-list-error">{{ error }}</div>
    <div v-if="!runtimes.length" class="strategy-list-empty" :class="{ error: !loading && !!error }">
        <template v-if="loading">Loading strategies…</template>
        <template v-else-if="error">{{ error }}</template>
        <template v-else>No active strategies were found.</template>
    </div>

    <div v-else class="strategy-list-rows" role="list" aria-label="Active strategies">
        <button v-for="row in rows" :key="row.runtime.runtime_id"
                class="strategy-list-row" role="listitem"
                :title="`Open ${row.name} (${row.runtime.runtime_id})`"
                @click="$emit('open-runtime', row.runtime.runtime_id)">
            <span class="strategy-list-identity">
                <span class="strategy-list-name">{{ row.name }}</span>
                <span class="strategy-list-mode" :class="'mode-' + row.semantics.mode.raw">
                    {{ row.semantics.mode.label }}
                </span>
            </span>
            <span class="strategy-list-state" :class="'tone-' + row.semantics.currentStatus.tone">
                {{ statusLabel(row.semantics.currentStatus) }}
            </span>
            <span class="strategy-list-meta">{{ row.tickerCount }} {{ row.tickerCount === 1 ? 'ticker' : 'tickers' }}</span>
            <span class="strategy-list-meta">{{ freshness(row.semantics.freshness) }}</span>
            <span v-if="row.semantics.primaryReason" class="strategy-list-reason">
                <template v-if="!row.semantics.currentStatus.known">Last reported: </template>
                {{ humanReason(row.semantics.primaryReason, row.semantics.mode.raw) }}
            </span>
            <span class="strategy-list-open">Open strategy →</span>
        </button>
    </div>
</div>
</template>

<script>
import {
    fmtDuration,
    humanizeStrategyReason,
    strategyDisplayName,
    strategyRuntimeSemantics,
} from '../../helpers/feed/corky-strategy-transforms.js'

export default {
    name: 'CorkyStrategyList',
    props: {
        runtimes: { type: Array, default: () => [] },
        loading: { type: Boolean, default: false },
        error: { type: String, default: null },
        streaming: { type: Boolean, default: false },
        now: { type: Number, default: 0 },
    },
    emits: ['open-runtime', 'refresh'],
    computed: {
        rows() {
            const nowMs = this.now || Date.now()
            return this.runtimes.filter(Boolean).map((runtime) => {
                const tickers = Array.isArray(runtime.tickers) && runtime.tickers.length
                    ? runtime.tickers : (runtime.ticker_allocations || [])
                return {
                    runtime,
                    name: strategyDisplayName(runtime),
                    tickerCount: tickers.filter(Boolean).length,
                    semantics: strategyRuntimeSemantics(runtime, { nowMs, streaming: this.streaming }),
                }
            })
        },
        summary() {
            const known = this.rows.filter((row) => row.semantics.currentStatus.known)
            const healthy = known.filter((row) => row.semantics.currentStatus.ready).length
            const attention = known.length - healthy
            const unknown = this.rows.length - known.length
            const parts = [`${this.rows.length} active`]
            if (healthy) parts.push(`${healthy} healthy`)
            if (attention) parts.push(`${attention} needs attention`)
            if (unknown) parts.push(`${unknown} status unknown`)
            return parts.join(' · ')
        },
    },
    methods: {
        humanReason(reason, mode) { return humanizeStrategyReason(reason, mode) },
        statusLabel(status) {
            if (!status || !status.known) return 'Status unknown'
            return status.ready ? 'Healthy' : 'Needs attention'
        },
        freshness(value) {
            if (!value) return 'Update time unavailable'
            if (value.ageMs == null) return value.label
            if (value.status === 'current' && value.ageMs < 60_000) return 'Updated just now'
            return `${value.label} · ${fmtDuration(value.ageMs)} ago`
        },
    },
}
</script>

<style scoped>
.strategy-list { height: 100%; overflow: auto; padding: 10px; color: #c9d1d9; background: #0d1117; }
.strategy-list-head { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 10px; }
.strategy-list-title { color: #f0f6fc; font-size: 15px; font-weight: 700; }
.strategy-list-summary { margin-top: 2px; color: #8b949e; font-size: 11px; }
.strategy-list-actions { display: flex; align-items: center; gap: 8px; }
.strategy-list-live { color: #3fb950; font-size: 11px; }
.strategy-list-refresh { border: 1px solid #30363d; border-radius: 4px; padding: 3px 8px; color: #c9d1d9; background: #161b22; cursor: pointer; }
.strategy-list-rows { display: grid; gap: 7px; }
.strategy-list-row { display: grid; grid-template-columns: minmax(230px, 1.6fr) auto auto auto minmax(160px, 1fr) auto; align-items: center; gap: 10px; width: 100%; border: 1px solid #30363d; border-radius: 6px; padding: 10px 12px; color: inherit; text-align: left; background: #161b22; cursor: pointer; }
.strategy-list-row:hover, .strategy-list-row:focus-visible { border-color: #58a6ff; background: #1b2430; outline: none; }
.strategy-list-identity { display: flex; align-items: center; gap: 8px; min-width: 0; }
.strategy-list-name { overflow: hidden; color: #f0f6fc; font-weight: 700; text-overflow: ellipsis; white-space: nowrap; }
.strategy-list-mode, .strategy-list-state { border-radius: 999px; padding: 2px 7px; font-size: 10px; white-space: nowrap; }
.strategy-list-mode { color: #c9d1d9; background: #21262d; }
.mode-live { color: #7ee787; background: rgba(46, 160, 67, .18); }
.mode-origin_observer, .mode-shadow_live, .mode-paper { color: #79c0ff; background: rgba(56, 139, 253, .15); }
.strategy-list-state { color: #8b949e; background: #21262d; }
.tone-ready { color: #7ee787; }
.tone-attention, .tone-critical { color: #ff7b72; }
.strategy-list-meta { color: #8b949e; font-size: 11px; white-space: nowrap; }
.strategy-list-reason { overflow: hidden; color: #d29922; font-size: 11px; text-overflow: ellipsis; white-space: nowrap; }
.strategy-list-open { color: #58a6ff; font-size: 11px; font-weight: 600; white-space: nowrap; }
.strategy-list-empty { display: grid; min-height: 120px; place-items: center; color: #8b949e; }
.strategy-list-empty.error, .strategy-list-error { color: #ff7b72; }
.strategy-list-error { margin-bottom: 8px; border: 1px solid rgba(248, 81, 73, .35); border-radius: 4px; padding: 7px 9px; background: rgba(248, 81, 73, .08); }
@media (max-width: 980px) {
    .strategy-list-row { grid-template-columns: minmax(220px, 1fr) auto auto; }
    .strategy-list-reason { grid-column: 1 / 3; }
}
</style>
