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
                    <th v-for="c in columns" :key="c.key" @click="sortBy(c.key)" :class="{ sorted: sortKey === c.key }">
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
                        <td class="time">{{ fmtTime(r.started_at_ms) }}</td>
                        <td class="time">{{ fmtTime(r.completed_at_ms) }}</td>
                    </tr>
                </tbody>
            </table>
        </div>

        <!-- Selected run detail -->
        <div v-if="selectedRun" class="bt-detail">
            <div class="bt-detail-head">
                <span class="bt-badge" :class="selectedRun.status">{{ selectedRun.status }}</span>
                <span class="bt-runid" :title="selectedRun.run_id">{{ selectedRun.run_id }}</span>
            </div>
            <div class="bt-meta">
                {{ selectedRun.venue }} · {{ (selectedRun.symbols||[]).join(',') }} · {{ selectedRun.trade_timeframe }}
                <span v-if="selectedRun.started_at_ms"> · started {{ fmtTime(selectedRun.started_at_ms) }}</span>
            </div>

            <div v-if="metricRows.length" class="bt-metrics-wrap">
                <div class="bt-sec-head">Metrics</div>
                <table class="bt-table bt-metrics-table">
                    <tbody>
                        <tr v-for="m in metricRows" :key="m.key">
                            <td class="bt-mkey">{{ m.label }}</td>
                            <td class="num" :class="m.sign">{{ m.value }}</td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <!-- Progress -->
            <div v-if="progress.length" class="bt-progress">
                <div class="bt-prog-head">Progress<span v-if="progressLive" class="bt-live">● live</span></div>
                <div v-for="(p, i) in progress" :key="i" class="bt-prog-row" :class="p.kind">
                    <span class="bt-prog-kind">{{ p.kind }}</span>
                    <span v-if="p.total_steps" class="bt-prog-steps">{{ p.completed_steps }}/{{ p.total_steps }}</span>
                    <span class="bt-prog-msg">{{ p.message }}</span>
                </div>
            </div>

            <div class="bt-actions">
                <button class="bt-btn bt-plot" :disabled="plotBusy" @click="$emit('plot-run', selectedRun)">
                    {{ plotBusy ? 'Loading onto chart…' : (plotted ? 'Re-plot equity / trades' : 'Plot equity / trades on chart') }}
                </button>
            </div>

            <!-- Trades (click → navigate + markers) -->
            <div v-if="trades.length" class="bt-trades">
                <div class="bt-sec-head">Trades ({{ trades.length }})</div>
                <table class="bt-table">
                    <thead><tr><th>Side</th><th class="num">Qty</th><th class="num">Price</th><th>Time</th></tr></thead>
                    <tbody>
                        <tr v-for="(t, i) in trades" :key="i" class="bt-row"
                            :title="`Open ${t.symbol} at ${fmtTime(t.timestamp_ms)}`"
                            @click="$emit('select-trade', t)">
                            <td><span class="bt-side" :class="String(t.side).toLowerCase()">{{ t.side }}</span></td>
                            <td class="num">{{ t.quantity }}</td>
                            <td class="num">{{ t.price }}</td>
                            <td class="time">{{ fmtTime(t.timestamp_ms) }}</td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <!-- Period returns -->
            <div v-if="periodReturns.length" class="bt-periods">
                <div class="bt-sec-head">Period returns</div>
                <table class="bt-table">
                    <thead><tr><th>Period</th><th class="num">Start eq</th><th class="num">End eq</th><th class="num">Return</th><th class="num">%</th></tr></thead>
                    <tbody>
                        <tr v-for="(p, i) in periodReturns" :key="i">
                            <td>{{ p.period }}</td>
                            <td class="num">{{ p.starting_equity }}</td>
                            <td class="num">{{ p.ending_equity }}</td>
                            <td class="num" :class="signClass(p.return_amount)">{{ p.return_amount }}</td>
                            <td class="num" :class="signClass(p.return_pct)">{{ pctText(p.return_pct) }}</td>
                        </tr>
                    </tbody>
                </table>
            </div>
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
        selectedRun: { type: Object, default: null },
        // { progress:[], live:bool, report:{trades,period_returns,...}, reportLoading, plottedRunId }
        detail: { type: Object, default: () => ({}) },
        loading: { type: Boolean, default: false },
        error: { type: String, default: null },
    },
    emits: ['refresh-strategies', 'update:filter', 'list-runs', 'inspect-strategy', 'select-run', 'plot-run', 'select-trade'],
    data() {
        return {
            // Default newest-first by completion.
            sortKey: 'completed_at_ms',
            sortDir: -1,   // 1 asc, -1 desc
            columns: [
                { key: 'strategy', label: 'Strategy' },
                { key: 'symbols', label: 'Symbols' },
                { key: 'trade_timeframe', label: 'TF' },
                { key: 'status', label: 'Status' },
                { key: 'started_at_ms', label: 'Started' },
                { key: 'completed_at_ms', label: 'Completed' },
            ],
        }
    },
    computed: {
        // Client-side sortable run list (the backend returns the full set; the
        // user orders by any column). Symbols sort by their joined string.
        sortedRuns() {
            const key = this.sortKey
            const dir = this.sortDir
            const val = (r) => {
                const v = key === 'symbols' ? (r.symbols || []).join(',') : r[key]
                return v == null ? '' : v
            }
            return this.runs.slice().sort((a, b) => {
                const av = val(a); const bv = val(b)
                if (typeof av === 'number' && typeof bv === 'number') return (av - bv) * dir
                return String(av).localeCompare(String(bv)) * dir
            })
        },
        selectedStrategy() {
            const n = this.filters.strategy
            return n ? this.strategies.find((s) => s.name === n) || null : null
        },
        metricRows() {
            const m = (this.selectedRun && this.selectedRun.metrics) || {}
            // Show the headline metrics first, then the rest alphabetically.
            const PRIORITY = ['total_net_profit', 'profit_factor', 'total_trades', 'ending_equity',
                'initial_deposit', 'max_equity_drawdown', 'absolute_drawdown', 'recovery_factor',
                'expected_payoff', 'gross_profit', 'gross_loss', 'largest_winner', 'largest_loser']
            const rank = (k) => { const i = PRIORITY.indexOf(k); return i === -1 ? PRIORITY.length : i }
            const humanize = (k) => k.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
            return Object.keys(m)
                .sort((a, b) => (rank(a) - rank(b)) || a.localeCompare(b))
                .map((key) => {
                    const value = m[key]
                    const neg = String(value).trim().startsWith('-')
                    return { key, label: humanize(key), value, sign: neg ? 'neg' : '' }
                })
        },
        progress() { return (this.detail && this.detail.progress) || [] },
        progressLive() { return !!(this.detail && this.detail.live) },
        reportLoading() { return !!(this.detail && this.detail.reportLoading) },
        // Busy while the report fetch OR the chart load is in flight.
        plotBusy() { return !!(this.detail && (this.detail.reportLoading || this.detail.plotting)) },
        plotted() {
            return !!(this.detail && this.selectedRun && this.detail.plottedRunId === this.selectedRun.run_id)
        },
        trades() { return (this.detail && this.detail.report && this.detail.report.trades) || [] },
        periodReturns() { return (this.detail && this.detail.report && this.detail.report.period_returns) || [] },
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
        signClass(dec) {
            if (dec == null || dec === '') return ''
            return String(dec).trim().startsWith('-') ? 'neg' : 'pos'
        },
        pctText(dec) {
            if (dec == null || dec === '') return '—'
            // return_pct is a decimal fraction string (0.01255 = 1.255%); show raw.
            return `${dec}`
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
.bt-runs { flex: 1 1 45%; overflow: auto; border-right: 1px solid #1c212e; }
.bt-detail { flex: 1 1 55%; overflow: auto; padding: 10px 12px; }
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
.bt-row:hover { background: #1e222d; }
.bt-row.active { background: rgba(53,167,118,0.12); }
.sym { color: #fff; font-weight: 600; }
.time { color: #808a9d; }
.bt-badge { font-size: 10px; text-transform: uppercase; padding: 1px 7px; border-radius: 9px; background: #2a2e39; color: #b0b6c0; }
.bt-badge.completed { background: rgba(53,167,118,0.18); color: #35a776; }
.bt-badge.running { background: rgba(245,197,24,0.18); color: #f5c518; }
.bt-badge.failed { background: rgba(229,65,80,0.18); color: #e54150; }
.bt-badge.queued { background: #2a2e39; color: #808a9d; }
.bt-detail-head { display: flex; gap: 8px; align-items: center; }
.bt-runid { font-size: 11px; color: #808a9d; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.bt-meta { color: #808a9d; margin: 6px 0; font-size: 11px; }
.bt-metrics-wrap { margin: 8px 0; }
.bt-metrics-table { width: 100%; }
.bt-metrics-table td { padding: 3px 10px; border-bottom: 1px solid #1c212e; }
.bt-mkey { color: #808a9d; }
.bt-metrics-table .num { font-variant-numeric: tabular-nums; color: #d1d4dc; max-width: 0; overflow: hidden; text-overflow: ellipsis; }
.bt-progress { margin: 8px 0; border: 1px solid #1c212e; border-radius: 4px; padding: 6px 8px; }
.bt-prog-head { color: #808a9d; font-weight: 600; display: flex; gap: 8px; }
.bt-live { color: #f5c518; }
.bt-prog-row { display: flex; gap: 8px; font-size: 11px; padding: 2px 0; }
.bt-prog-row.failed { color: #e54150; }
.bt-prog-row.completed { color: #35a776; }
.bt-prog-kind { width: 70px; color: #808a9d; }
.bt-prog-steps { font-variant-numeric: tabular-nums; }
.bt-actions { margin: 8px 0; }
.bt-sec-head { color: #808a9d; font-weight: 600; margin: 10px 0 4px; }
.bt-side.buy { color: #23a776; }
.bt-side.sell { color: #e54150; }
.pos { color: #23a776; }
.neg { color: #e54150; }
</style>
