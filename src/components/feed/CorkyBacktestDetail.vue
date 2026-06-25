<template>
<div class="btd">
    <div class="btd-head">
        <span class="bt-badge" :class="run.status">{{ run.status }}</span>
        <span class="btd-title">{{ run.strategy }}</span>
        <span class="btd-sub">{{ run.venue }} · {{ (run.symbols||[]).join(',') }} · {{ run.trade_timeframe }}</span>
        <span class="btd-spacer"></span>
        <button class="btd-close" title="Close run details" @click="$emit('close')">×</button>
    </div>
    <div class="btd-runid" :title="run.run_id">{{ run.run_id }}</div>
    <div class="btd-meta">
        <span v-if="run.started_at_ms">started {{ fmtTime(run.started_at_ms) }}</span>
        <span v-if="run.completed_at_ms"> · completed {{ fmtTime(run.completed_at_ms) }}</span>
    </div>

    <!-- Plot action -->
    <div class="btd-actions">
        <button class="bt-btn bt-plot" :disabled="plotBusy" @click="$emit('plot-run', run)">
            {{ plotBusy ? 'Loading onto chart…' : (plotted ? 'Re-plot equity / trades' : 'Plot equity / trades on chart') }}
        </button>
        <span v-if="overviewLoading" class="btd-dim">loading metrics…</span>
    </div>

    <!-- Metrics: one table so columns align across ALL sections, rows zebra-stripe,
         and dividers separate each [label | value] block. 4 blocks per row. -->
    <table v-if="metricRows.length" class="btd-mtable">
        <tbody>
            <template v-for="(row, ri) in metricRows" :key="ri">
                <tr v-if="row.type === 'section'" class="btd-msection">
                    <td :colspan="metricColSpan">{{ row.title }}</td>
                </tr>
                <tr v-else class="btd-mrow" :class="{ alt: row.alt }">
                    <template v-for="c in row.cells" :key="c.key">
                        <td class="btd-mlabel" :title="c.key">{{ c.label }}</td>
                        <td class="btd-mval" :class="c.sign" :title="c.raw">{{ c.value }}</td>
                    </template>
                </tr>
            </template>
        </tbody>
    </table>
    <div v-else class="btd-empty">No metrics for this run yet.</div>

    <!-- Progress -->
    <div v-if="progress.length" class="bt-progress">
        <div class="bt-prog-head">Progress<span v-if="progressLive" class="bt-live">● live</span></div>
        <div v-for="(p, i) in progress" :key="i" class="bt-prog-row" :class="p.kind">
            <span class="bt-prog-kind">{{ p.kind }}</span>
            <span v-if="p.total_steps" class="bt-prog-steps">{{ p.completed_steps }}/{{ p.total_steps }}</span>
            <span class="bt-prog-msg">{{ p.message }}</span>
        </div>
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
</template>

<script>
// CorkyBacktestDetail — a single run's full details (metrics grid, progress,
// trades, period returns) rendered in its own reusable dock tab. Presentational:
// App owns the feed + state; this emits plot-run / select-trade / close. All
// money/quantity values are DECIMAL STRINGS — Number() is used for DISPLAY only.

// Curated short labels for the metric grid (the descriptor `description` is the
// long-form sentence; the grid wants a compact column header). Unknown keys fall
// back to a humanized version of the metric name.
const SHORT_LABELS = {
    // Performance
    total_net_profit: 'Net Profit', strategy_return_pct: 'Strategy Return',
    ending_equity: 'Ending Eq.', initial_deposit: 'Initial Dep.', expected_payoff: 'Expected Payoff',
    gross_profit: 'Gross Profit', gross_loss: 'Gross Loss', profit_factor: 'Profit Factor',
    // Risk / Drawdown
    max_equity_drawdown: 'Max DD', absolute_drawdown: 'Absolute DD', recovery_factor: 'Recovery Fac.',
    sharpe_ratio: 'Sharpe', sortino_ratio: 'Sortino',
    // Buy & Hold
    strategy_vs_buy_hold_return_pct: 'vs B&H Return', strategy_beat_buy_hold: 'Beat B&H?',
    strategy_vs_buy_hold_profit: 'vs B&H Profit', buy_hold_return_pct: 'B&H Return',
    buy_hold_net_profit: 'B&H Net Profit', buy_hold_ending_equity: 'B&H End Equity',
    buy_hold_start_price: 'B&H Start Px', buy_hold_end_price: 'B&H End Px', buy_hold_quantity: 'B&H Qty',
    // Profit distribution
    total_trades: 'Total Trades', positive_trade_pct: 'Win %',
    top_1_trade_profit_share: 'Top-1 Share', top_5_trade_profit_share: 'Top-5 Share',
    profit_concentration_hhi: 'Concentration', largest_winner: 'Largest Win', largest_loser: 'Largest Loss',
    equity_curve_slope: 'Slope', equity_curve_r2: 'R²',
    // Period consistency
    positive_period_pct: 'Positive Periods', period_return_consistency: 'Period Consistency', period_return_count: '# Periods',
}

// Logical grouping (per the gateway's display guidance). Any metric NOT listed
// here falls into a trailing "Other" group so nothing is ever silently dropped.
const GROUPS = [
    { title: 'Performance', keys: ['total_net_profit', 'strategy_return_pct', 'ending_equity', 'initial_deposit', 'expected_payoff', 'gross_profit', 'gross_loss', 'profit_factor'] },
    { title: 'Risk / Drawdown', keys: ['max_equity_drawdown', 'absolute_drawdown', 'recovery_factor', 'sharpe_ratio', 'sortino_ratio'] },
    { title: 'Buy & Hold', keys: ['strategy_vs_buy_hold_return_pct', 'strategy_beat_buy_hold', 'strategy_vs_buy_hold_profit', 'buy_hold_return_pct', 'buy_hold_net_profit', 'buy_hold_ending_equity', 'buy_hold_start_price', 'buy_hold_end_price', 'buy_hold_quantity'] },
    { title: 'Profit Distribution', keys: ['total_trades', 'positive_trade_pct', 'top_1_trade_profit_share', 'top_5_trade_profit_share', 'profit_concentration_hhi', 'largest_winner', 'largest_loser', 'equity_curve_slope', 'equity_curve_r2'] },
    { title: 'Period Consistency', keys: ['positive_period_pct', 'period_return_consistency', 'period_return_count'] },
]

const humanize = (k) => String(k).replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())

export default {
    name: 'CorkyBacktestDetail',
    props: {
        run: { type: Object, required: true },
        // { progress:[], live, report:{trades,period_returns,metric_descriptors,...},
        //   plotting, overviewLoading, plottedRunId }
        detail: { type: Object, default: () => ({}) },
    },
    emits: ['plot-run', 'select-trade', 'close'],
    computed: {
        // metric name → descriptor (from the OVERVIEW report's metric_descriptors).
        metricDescriptors() {
            const ds = (this.detail && this.detail.report && this.detail.report.metric_descriptors) || []
            const map = {}
            for (const d of ds) if (d && d.name) map[d.name] = d
            return map
        },
        // The metrics arranged into logical groups, each flowing 3 (label,value)
        // pairs per row. Only metrics actually present on the run are rendered.
        metricGroups() {
            const m = (this.run && this.run.metrics) || {}
            const desc = this.metricDescriptors
            const claimed = new Set()
            GROUPS.forEach((g) => g.keys.forEach((k) => claimed.add(k)))
            const cell = (key) => {
                const raw = m[key]
                const d = desc[key]
                let sign = ''
                if (raw != null && raw !== '') {
                    if (d && d.unit === 'boolean') sign = this._truthy(raw) ? 'pos' : 'neg'
                    else if (String(raw).trim().startsWith('-')) sign = 'neg'
                }
                return {
                    key,
                    label: SHORT_LABELS[key] || humanize(key),
                    value: (raw == null || raw === '') ? '—' : this.formatMetric(raw, d),
                    raw,
                    sign,
                }
            }
            const groups = GROUPS
                .map((g) => ({ title: g.title, cells: g.keys.filter((k) => m[k] != null).map(cell) }))
                .filter((g) => g.cells.length)
            const rest = Object.keys(m).filter((k) => !claimed.has(k)).sort()
            if (rest.length) groups.push({ title: 'Other', cells: rest.map(cell) })
            return groups
        },
        // Flatten the groups into table rows: a 'section' header row, then
        // 'metrics' rows of up to 4 blocks each. `alt` toggles per metric row
        // (continuous across sections) so the zebra striping is always visible
        // even for single-row sections.
        metricRows() {
            const rows = []
            let alt = false
            for (const g of this.metricGroups) {
                rows.push({ type: 'section', title: g.title })
                for (let i = 0; i < g.cells.length; i += 4) {
                    rows.push({ type: 'metrics', cells: g.cells.slice(i, i + 4), alt })
                    alt = !alt
                }
            }
            return rows
        },
        // Header colspan = the widest metric row's cell count (≤ 4 blocks × 2).
        metricColSpan() {
            let max = 2
            for (const g of this.metricGroups) {
                if (g.cells.length) max = Math.max(max, Math.min(4, g.cells.length) * 2)
            }
            return max
        },
        progress() { return (this.detail && this.detail.progress) || [] },
        progressLive() { return !!(this.detail && this.detail.live) },
        overviewLoading() { return !!(this.detail && this.detail.overviewLoading) },
        // Busy while the report fetch OR the chart load is in flight.
        plotBusy() { return !!(this.detail && (this.detail.reportLoading || this.detail.plotting)) },
        plotted() {
            return !!(this.detail && this.run && this.detail.plottedRunId === this.run.run_id)
        },
        trades() { return (this.detail && this.detail.report && this.detail.report.trades) || [] },
        periodReturns() { return (this.detail && this.detail.report && this.detail.report.period_returns) || [] },
    },
    methods: {
        // Format a decimal-string metric per its descriptor. Number() is DISPLAY
        // ONLY (never calculations); the exact string rides along as the hover
        // title. NB: percent values are FRACTIONS (0.32 = 32%).
        _truthy(raw) { return raw === true || raw === 'true' || raw === 1 || raw === '1' },
        formatMetric(raw, d) {
            if (raw == null || raw === '') return '—'
            const unit = d && d.unit
            if (unit === 'boolean') return this._truthy(raw) ? '✓ Yes' : '✗ No'
            if (!unit) return String(raw)
            const n = Number(raw)
            if (!Number.isFinite(n)) return String(raw)   // don't lie about a bad value
            const p = d.precision != null ? d.precision : 2
            switch (unit) {
                case 'currency': return n.toLocaleString(undefined, { minimumFractionDigits: p, maximumFractionDigits: p })
                case 'quantity': return n.toLocaleString(undefined, { maximumFractionDigits: Math.max(p, 0) })
                case 'percent': return (n * 100).toFixed(p) + '%'   // value is a FRACTION
                case 'bps': return n.toFixed(p) + ' bps'
                case 'ratio': return n.toFixed(p)
                case 'count': return n.toLocaleString(undefined, { maximumFractionDigits: 0 })
                default: return String(raw)
            }
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
.btd { height: 100%; overflow: auto; color: #d1d4dc; font-size: 12px; padding: 10px 14px; }
.btd-head { display: flex; align-items: center; gap: 10px; }
.btd-title { font-weight: 700; color: #fff; }
.btd-sub { color: #808a9d; font-size: 11px; }
.btd-spacer { flex: 1 1 auto; }
.btd-close { background: #131722; color: #808a9d; border: 1px solid #2a2e39; border-radius: 4px; width: 24px; height: 24px; cursor: pointer; font-size: 15px; line-height: 1; }
.btd-close:hover { color: #e54150; border-color: #e54150; }
.btd-runid { font-size: 11px; color: #5c6370; margin-top: 4px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.btd-meta { color: #808a9d; font-size: 11px; margin: 2px 0 8px; }
.btd-actions { display: flex; align-items: center; gap: 10px; margin: 8px 0 12px; }
.btd-dim { color: #808a9d; font-size: 11px; }

/* Metrics table: ONE table so the label/value columns align across every
   section; rows zebra-stripe; up to 4 [label | value] blocks per row with a
   vertical divider between blocks (left border of every label but the first). */
.btd-mtable { width: 100%; border-collapse: collapse; margin-top: 2px; }
.btd-msection td { color: #35a776; font-weight: 700; font-size: 10px; letter-spacing: 0.06em; text-transform: uppercase; padding: 9px 0 3px; border-bottom: 1px solid #1c212e; }
.btd-mrow.alt { background: rgba(255, 255, 255, 0.025); }   /* zebra striping */
.btd-mrow td { padding: 3px 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.btd-mlabel { color: #808a9d; font-size: 11px; padding-left: 14px; padding-right: 8px; }
.btd-mlabel:first-child { padding-left: 4px; }                    /* first block: flush left */
.btd-mlabel:not(:first-child) { border-left: 1px solid #2a2e39; } /* divider between blocks */
.btd-mval { text-align: left; font-variant-numeric: tabular-nums; color: #d1d4dc; padding-right: 12px; }
.btd-empty { color: #808a9d; padding: 16px 0; }

/* Shared table / badge / progress styling (mirrors CorkyBacktestsPanel). */
.bt-btn { background: #35a776; color: #fff; border: none; border-radius: 4px; padding: 6px 14px; font-size: 12px; cursor: pointer; }
.bt-btn:hover:not(:disabled) { background: #2e9468; }
.bt-btn:disabled { opacity: 0.5; cursor: default; }
.bt-badge { font-size: 10px; text-transform: uppercase; padding: 1px 7px; border-radius: 9px; background: #2a2e39; color: #b0b6c0; }
.bt-badge.completed { background: rgba(53,167,118,0.18); color: #35a776; }
.bt-badge.running { background: rgba(245,197,24,0.18); color: #f5c518; }
.bt-badge.failed { background: rgba(229,65,80,0.18); color: #e54150; }
.bt-badge.queued { background: #2a2e39; color: #808a9d; }
.bt-progress { margin: 12px 0; border: 1px solid #1c212e; border-radius: 4px; padding: 6px 8px; }
.bt-prog-head { color: #808a9d; font-weight: 600; display: flex; gap: 8px; }
.bt-live { color: #f5c518; }
.bt-prog-row { display: flex; gap: 8px; font-size: 11px; padding: 2px 0; }
.bt-prog-row.failed { color: #e54150; }
.bt-prog-row.completed { color: #35a776; }
.bt-prog-kind { width: 70px; color: #808a9d; }
.bt-prog-steps { font-variant-numeric: tabular-nums; }
.bt-sec-head { color: #808a9d; font-weight: 600; margin: 12px 0 4px; }
.bt-table { width: 100%; border-collapse: collapse; }
.bt-table th { text-align: left; padding: 5px 10px; border-bottom: 1px solid #2a2e39; color: #808a9d; font-weight: 500; white-space: nowrap; }
.bt-table td { padding: 5px 10px; border-bottom: 1px solid #1c212e; white-space: nowrap; }
.bt-table .num { text-align: right; font-variant-numeric: tabular-nums; }
.bt-row { cursor: pointer; }
.bt-row:nth-child(even) { background: rgba(255, 255, 255, 0.025); }            /* zebra striping */
.bt-periods tbody tr:nth-child(even) { background: rgba(255, 255, 255, 0.025); }
.bt-row:hover { background: #1e222d; }
.bt-side.buy { color: #23a776; }
.bt-side.sell { color: #e54150; }
.time { color: #808a9d; }
.pos { color: #23a776; }
.neg { color: #e54150; }
</style>
