<template>
<div class="bt">
    <!-- Controls: strategy + filters -->
    <div class="bt-controls">
        <select class="bt-input" :value="filters.strategy" @change="onStrategy($event.target.value)">
            <option value="">All strategies</option>
            <option v-for="s in strategies" :key="s.name" :value="s.name">{{ s.display_name || s.name }}</option>
        </select>
        <input class="bt-input bt-sym" :value="filters.symbol" placeholder="symbol (e.g. tBTCUSD)"
               @input="$emit('update:filter', { symbol: $event.target.value })" />
        <select class="bt-input bt-status" :value="filters.status" @change="$emit('update:filter', { status: $event.target.value })">
            <option value="">Any status</option>
            <option value="queued">queued</option>
            <option value="running">running</option>
            <option value="completed">completed</option>
            <option value="failed">failed</option>
        </select>
        <button class="bt-btn" :disabled="loading" @click="$emit('list-runs')">Load runs</button>
        <button class="bt-icon" title="Refresh strategies" @click="$emit('refresh-strategies')">⟳</button>
    </div>

    <!-- Selected strategy info (params + indicators) -->
    <div v-if="selectedStrategy" class="bt-strategy">
        <div class="bt-strat-head">
            <span class="bt-tag">STRATEGY</span>
            <strong>{{ selectedStrategy.display_name || selectedStrategy.name }}</strong>
            <span class="bt-dim">trade tf {{ selectedStrategy.default_trade_timeframe }}</span>
            <span v-if="(selectedStrategy.default_context_timeframes||[]).length" class="bt-dim">
                ctx {{ selectedStrategy.default_context_timeframes.join(', ') }}</span>
        </div>
        <div v-if="(selectedStrategy.parameters||[]).length" class="bt-params">
            <span v-for="p in selectedStrategy.parameters" :key="p.name" class="bt-param"
                  :title="p.description || ''">
                {{ p.name }}=<b>{{ p.default_value == null ? '—' : p.default_value }}</b>
                <span class="bt-dim">({{ p.type }})</span>
            </span>
        </div>
        <div v-if="(selectedStrategy.default_indicators||[]).length" class="bt-dim bt-inds">
            indicators: {{ selectedStrategy.default_indicators.map(indLabel).join(', ') }}
        </div>
    </div>

    <div v-if="error" class="bt-error">{{ error }}</div>

    <div class="bt-body">
        <!-- Runs list -->
        <div class="bt-runs">
            <div class="bt-runs-head">
                Runs<span class="bt-count">{{ runs.length }}</span>
                <span v-if="filters.strategy" class="bt-dim">· {{ filters.strategy }}</span>
            </div>
            <div v-if="loading && !runs.length" class="bt-msg">Loading…</div>
            <div v-else-if="!runs.length" class="bt-msg">
                No backtest runs{{ filters.strategy ? ` for ${filters.strategy}` : '' }} in the store yet.
                <div class="bt-dim bt-hint">A run appears here once the backend executes &amp; saves a backtest. (Strategy details above are NOT a run.)</div>
            </div>
            <table v-else class="bt-table bt-sortable">
                <thead><tr>
                    <th v-for="c in columns" :key="c.key" @click="sortBy(c.key)" :title="c.title || ''"
                        :class="{ sorted: sortKey === c.key, num: !!c.metric }">
                        {{ c.label }}<span v-if="sortKey === c.key" class="bt-sort">{{ sortDir === 1 ? '▲' : '▼' }}</span>
                    </th>
                </tr></thead>
                <tbody>
                    <tr v-for="r in sortedRuns" :key="r.run_id" class="bt-row"
                        :class="{ active: selectedRun && selectedRun.run_id === r.run_id }"
                        tabindex="0" role="button"
                        @click="$emit('select-run', r)"
                        @keydown.enter.prevent="$emit('select-run', r)">
                        <td>{{ r.strategy }}</td>
                        <td class="sym">{{ (r.symbols||[]).join(',') }}</td>
                        <td>{{ r.trade_timeframe }}</td>
                        <td><span class="bt-badge" :class="r.status">{{ r.status }}</span></td>
                        <td v-for="c in metricCols" :key="c.key" class="num" :class="cellSign(r, c)" :title="cellTitle(r, c)">{{ cellText(r, c) }}</td>
                        <td class="time bt-dur" :title="durationTitle(r)">{{ fmtDuration(r) }}</td>
                    </tr>
                </tbody>
            </table>
        </div>
    </div>
</div>
</template>

<script>
// CorkyBacktestsPanel — presentational Strategies/Backtests view rendered in the
// bottom dock. App owns the feed + state; this emits intents. All money/quantity
// values are DECIMAL STRINGS — displayed verbatim, never float-parsed here.
export default {
    name: 'CorkyBacktestsPanel',
    props: {
        strategies: { type: Array, default: () => [] },
        runs: { type: Array, default: () => [] },
        filters: { type: Object, default: () => ({ strategy: '', symbol: '', status: '' }) },
        // Highlights the active row; the run's details open in their own dock tab.
        selectedRun: { type: Object, default: null },
        loading: { type: Boolean, default: false },
        error: { type: String, default: null },
    },
    emits: ['refresh-strategies', 'update:filter', 'list-runs', 'inspect-strategy', 'select-run'],
    data() {
        return {
            // Default longest-period first.
            sortKey: 'duration',
            sortDir: -1,   // 1 asc, -1 desc
            // Compact metric columns (the gateway's suggested run-list set). Each
            // sorts numerically (booleans → 1/0); `fmt` drives display, `signMode`
            // the colour. New fields are blank ("—") until a run is regenerated.
            metricCols: [
                { key: 'total_net_profit', label: 'Net P/L', metric: 'total_net_profit', fmt: 'money', signMode: 'sign' },
                { key: 'strategy_return_pct', label: 'Return', metric: 'strategy_return_pct', fmt: 'pct', signMode: 'sign' },
                { key: 'buy_hold_return_pct', label: 'B&H Ret', metric: 'buy_hold_return_pct', fmt: 'pct', signMode: 'sign' },
                { key: 'strategy_vs_buy_hold_return_pct', label: 'vs B&H', metric: 'strategy_vs_buy_hold_return_pct', fmt: 'pct', signMode: 'beat', beat: 'strategy_beat_buy_hold' },
                { key: 'strategy_beat_buy_hold', label: 'Beat', metric: 'strategy_beat_buy_hold', fmt: 'bool', signMode: 'bool', title: 'Strategy beat buy & hold?' },
                { key: 'sharpe_ratio', label: 'Sharpe', metric: 'sharpe_ratio', fmt: 'ratio2', signMode: 'sign' },
                { key: 'sortino_ratio', label: 'Sortino', metric: 'sortino_ratio', fmt: 'ratio2', signMode: 'sign' },
                { key: 'profit_factor', label: 'PF', metric: 'profit_factor', fmt: 'ratio2', signMode: 'gte1', title: 'Profit factor (gross profit ÷ gross loss)' },
                { key: 'recovery_factor', label: 'RF', metric: 'recovery_factor', fmt: 'ratio2', signMode: 'gte1', title: 'Recovery factor (net profit ÷ max drawdown)' },
            ],
        }
    },
    computed: {
        // Header/sort column set: fixed identity columns, the metric columns, then
        // the data-period Duration column.
        columns() {
            return [
                { key: 'strategy', label: 'Strategy' },
                { key: 'symbols', label: 'Symbols' },
                { key: 'trade_timeframe', label: 'TF' },
                { key: 'status', label: 'Status' },
                ...this.metricCols,
                { key: 'duration', label: 'Duration', title: 'Backtest data period (start – end, days, bars)' },
            ]
        },
        // Client-side sortable run list (the backend returns the full set; the
        // user orders by any column). Symbols sort by their joined string; metric
        // columns (PF/RF) sort numerically with missing values always last.
        sortedRuns() {
            const col = this.columns.find((c) => c.key === this.sortKey)
            const metric = col && col.metric
            const dir = this.sortDir
            const num = (r) => {
                const n = Number((r.metrics || {})[metric])
                return Number.isFinite(n) ? n : null
            }
            const strVal = (r) => {
                const v = this.sortKey === 'symbols' ? (r.symbols || []).join(',') : r[this.sortKey]
                return v == null ? '' : v
            }
            const span = (r) => (Number(r.completed_at_ms) || 0) - (Number(r.started_at_ms) || 0)
            return this.runs.slice().sort((a, b) => {
                if (metric) {
                    const an = num(a); const bn = num(b)
                    if (an == null && bn == null) return 0
                    if (an == null) return 1       // missing metric → bottom
                    if (bn == null) return -1
                    return (an - bn) * dir
                }
                if (this.sortKey === 'duration') return (span(a) - span(b)) * dir   // sort by data-period length
                const av = strVal(a); const bv = strVal(b)
                if (typeof av === 'number' && typeof bv === 'number') return (av - bv) * dir
                return String(av).localeCompare(String(bv)) * dir
            })
        },
        selectedStrategy() {
            const n = this.filters.strategy
            return n ? this.strategies.find((s) => s.name === n) || null : null
        },
    },
    methods: {
        sortBy(key) {
            if (this.sortKey === key) this.sortDir = -this.sortDir
            else { this.sortKey = key; this.sortDir = 1 }
        },
        onStrategy(name) {
            this.$emit('update:filter', { strategy: name })
            // Selecting a strategy reloads its runs in one action (and inspects it).
            if (name) this.$emit('inspect-strategy', name)
            this.$emit('list-runs')
        },
        indLabel(i) {
            const p = i.params && Object.values(i.params).join(',')
            return `${i.kind}${p ? '(' + p + ')' : ''}@${i.timeframe || ''}`
        },
        // Raw decimal-string metric value off a run summary (or undefined).
        metric(r, key) { return (r.metrics || {})[key] },
        _truthy(raw) { return raw === true || raw === 'true' || raw === 1 || raw === '1' },
        // Number() is DISPLAY ONLY; the exact decimal string rides along as the
        // cell's hover title (cellTitle). Percent values are FRACTIONS (0.32=32%).
        fmtRatio(raw) {
            const n = Number(raw)
            return Number.isFinite(n) ? n.toFixed(2) : String(raw)
        },
        fmtPct(raw) {
            const n = Number(raw)
            return Number.isFinite(n) ? `${(n * 100).toFixed(2)}%` : String(raw)
        },
        fmtMoney(raw) {
            const n = Number(raw)
            return Number.isFinite(n) ? n.toLocaleString(undefined, { maximumFractionDigits: 2 }) : String(raw)
        },
        // Display text for a metric column cell.
        cellText(r, c) {
            const raw = this.metric(r, c.metric)
            if (raw == null || raw === '') return '—'
            switch (c.fmt) {
                case 'money': return this.fmtMoney(raw)
                case 'pct': return this.fmtPct(raw)
                case 'ratio2': return this.fmtRatio(raw)
                case 'bool': return this._truthy(raw) ? '✓' : '✗'
                default: return String(raw)
            }
        },
        // pos/neg colour for a metric column cell, per its signMode.
        cellSign(r, c) {
            if (c.signMode === 'beat') {
                const b = this.metric(r, c.beat)
                if (b != null && b !== '') return this._truthy(b) ? 'pos' : 'neg'
            }
            const raw = this.metric(r, c.metric)
            if (raw == null || raw === '') return ''
            if (c.signMode === 'bool') return this._truthy(raw) ? 'pos' : 'neg'
            const n = Number(raw)
            if (c.signMode === 'gte1') return Number.isFinite(n) ? (n >= 1 ? 'pos' : 'neg') : ''
            if (Number.isFinite(n)) return n > 0 ? 'pos' : (n < 0 ? 'neg' : '')
            return String(raw).trim().startsWith('-') ? 'neg' : ''
        },
        cellTitle(r, c) {
            const raw = this.metric(r, c.metric)
            let t = (raw == null || raw === '') ? '' : String(raw)
            if (c.beat) {
                const b = this.metric(r, c.beat)
                if (b != null && b !== '') t += `${t ? ' · ' : ''}beat B&H: ${this._truthy(b) ? 'yes' : 'no'}`
            }
            return t || (c.title || '')
        },
        fmtTime(ms) {
            if (!(ms > 0)) return '—'
            const d = new Date(ms)
            if (Number.isNaN(d.getTime())) return '—'
            const pad = (n) => String(n).padStart(2, '0')
            return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
        },
        // Date only (YYYY-MM-DD) — multi-year backtest periods don't need a time.
        fmtDate(ms) {
            const d = new Date(Number(ms))
            if (Number.isNaN(d.getTime())) return '—'
            const pad = (n) => String(n).padStart(2, '0')
            return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
        },
        _tfMs(tf) {
            const m = String(tf).match(/^(\d+)\s*([mhdwM])$/)
            if (!m) return 0
            const u = { m: 60000, h: 3600000, d: 86400000, w: 604800000, M: 2592000000 }[m[2]] || 0
            return Number(m[1]) * u
        },
        // { n, exact } bar count: EXACT when the run summary carries bar_count;
        // otherwise an estimate from the data span / timeframe (continuous bars).
        barCount(r) {
            const exact = r.bar_count != null ? Number(r.bar_count) : NaN
            if (Number.isFinite(exact)) return { n: exact, exact: true }
            const s = Number(r.started_at_ms); const e = Number(r.completed_at_ms)
            const tf = this._tfMs(r.trade_timeframe)
            if (!(e > s) || !(tf > 0)) return null
            return { n: Math.round((e - s) / tf), exact: false }
        },
        // "2013-03-31 – 2026-06-25 (4,835 days, ~116,005 bars)" for the run's
        // backtest data period (started_at_ms → completed_at_ms).
        fmtDuration(r) {
            const s = Number(r.started_at_ms); const e = Number(r.completed_at_ms)
            if (!(s > 0) || !(e > 0) || e < s) return '—'
            const days = Math.round((e - s) / 86400000)
            const b = this.barCount(r)
            const bars = b ? `, ${b.exact ? '' : '~'}${b.n.toLocaleString()} bars` : ''
            return `${this.fmtDate(s)} – ${this.fmtDate(e)} (${days.toLocaleString()} day${days === 1 ? '' : 's'}${bars})`
        },
        durationTitle(r) {
            const b = this.barCount(r)
            return b && !b.exact ? 'Bar count estimated from the data span ÷ timeframe (exact bar_count not in the run summary)' : ''
        },
    },
}
</script>

<style scoped>
.bt { display: flex; flex-direction: column; height: 100%; color: #d1d4dc; font-size: 12px; }
.bt-controls { display: flex; gap: 8px; padding: 8px 12px; border-bottom: 1px solid #1c212e; align-items: center; flex-wrap: wrap; }
.bt-input { background: #0e1320; color: #d1d4dc; border: 1px solid #2a2e39; border-radius: 4px; padding: 5px 8px; font-size: 12px; }
.bt-sym { width: 150px; }
.bt-btn { background: #35a776; color: #fff; border: none; border-radius: 4px; padding: 6px 14px; font-size: 12px; cursor: pointer; }
.bt-btn:hover:not(:disabled) { background: #2e9468; }
.bt-btn:disabled { opacity: 0.5; cursor: default; }
.bt-icon { background: #131722; color: #808a9d; border: 1px solid #2a2e39; border-radius: 4px; width: 26px; height: 26px; cursor: pointer; }
.bt-icon:hover { color: #35a776; border-color: #35a776; }
.bt-strategy { padding: 8px 12px; border-bottom: 1px solid #1c212e; background: rgba(53,167,118,0.04); }
.bt-strat-head { display: flex; gap: 10px; align-items: center; }
.bt-tag { font-size: 9px; font-weight: 700; letter-spacing: 0.06em; color: #35a776; background: rgba(53,167,118,0.14); border-radius: 3px; padding: 1px 6px; }
.bt-dim { color: #808a9d; }
.bt-hint { font-size: 11px; margin-top: 6px; }
.bt-runs-head { display: flex; align-items: center; gap: 6px; padding: 6px 10px; font-weight: 600; color: #808a9d; border-bottom: 1px solid #1c212e; position: sticky; top: 0; background: #121827; }
.bt-count { background: #2a2e39; color: #d1d4dc; border-radius: 8px; padding: 0 6px; font-size: 10px; }
.bt-params { display: flex; flex-wrap: wrap; gap: 12px; margin-top: 4px; }
.bt-param { font-size: 11px; }
.bt-inds { margin-top: 4px; font-size: 11px; }
.bt-error { padding: 8px 12px; color: #e54150; }
.bt-body { flex: 1 1 0; min-height: 0; display: flex; overflow: hidden; }
.bt-runs { flex: 1 1 100%; overflow: auto; }
.bt-msg { padding: 16px; color: #808a9d; text-align: center; }
.bt-table { width: 100%; border-collapse: collapse; }
.bt-table th { position: sticky; top: 0; background: #131722; color: #808a9d; font-weight: 500; text-align: left; padding: 6px 10px; border-bottom: 1px solid #2a2e39; white-space: nowrap; }
.bt-sortable th { cursor: pointer; user-select: none; }
.bt-sortable th:hover { color: #d1d4dc; }
.bt-sortable th.sorted { color: #35a776; }
.bt-sort { margin-left: 4px; font-size: 9px; }
.bt-table td { padding: 5px 10px; border-bottom: 1px solid #1c212e; white-space: nowrap; }
.bt-table .num { text-align: right; font-variant-numeric: tabular-nums; }
.bt-row { cursor: pointer; }
.bt-row:nth-child(even) { background: rgba(255, 255, 255, 0.025); }   /* zebra striping */
.bt-row:hover { background: #1e222d; }
.bt-row.active { background: rgba(53,167,118,0.12); }
.sym { color: #fff; font-weight: 600; }
.time { color: #808a9d; }
.bt-badge { font-size: 10px; text-transform: uppercase; padding: 1px 7px; border-radius: 9px; background: #2a2e39; color: #b0b6c0; }
.bt-badge.completed { background: rgba(53,167,118,0.18); color: #35a776; }
.bt-badge.running { background: rgba(245,197,24,0.18); color: #f5c518; }
.bt-badge.failed { background: rgba(229,65,80,0.18); color: #e54150; }
.bt-badge.queued { background: #2a2e39; color: #808a9d; }
.pos { color: #23a776; }
.neg { color: #e54150; }
</style>
