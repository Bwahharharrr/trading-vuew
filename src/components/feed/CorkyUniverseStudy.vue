<template>
<div class="us">
    <div class="us-note">
        <span class="bt-type t-universe">Universe</span>
        Metric study only — candidate rankings + per-symbol metrics. Plotting an
        equity/trade chart requires a materialized execution artifact (rerun a
        candidate as a normal backtest).
    </div>

    <div v-if="loading" class="us-msg">Loading study artifact…</div>
    <div v-else-if="error" class="us-msg us-err">{{ error }}</div>
    <template v-else-if="artifact">
        <!-- Optimization metadata (sampler / objective / etc.) when present. -->
        <div v-if="optMetaRows.length" class="us-meta">
            <span v-for="m in optMetaRows" :key="m.key" class="us-meta-item">
                <span class="us-meta-k">{{ m.label }}</span><span class="us-meta-v">{{ m.value }}</span>
            </span>
        </div>

        <!-- Candidate ranking table -->
        <template v-if="candidates.length">
            <div class="us-sec">Candidates ({{ candidates.length }})</div>
            <table class="bt-table us-table">
                <thead><tr>
                    <th>#</th>
                    <th v-for="c in candidateCols" :key="c.key" class="num" :title="c.title || ''">{{ c.label }}</th>
                    <th>Parameters</th>
                </tr></thead>
                <tbody>
                    <template v-for="(cand, i) in candidates" :key="i">
                        <tr class="bt-row" :class="{ open: expanded === i }" @click="toggle(i)">
                            <td class="us-rank">{{ cand.runIndex != null ? cand.runIndex : i }}</td>
                            <td v-for="c in candidateCols" :key="c.key" class="num" :class="c.sign ? signOf(cand[c.key]) : ''">{{ fmtCell(cand[c.key], c) }}</td>
                            <td class="us-params" :title="paramStr(cand.params)">{{ paramStr(cand.params) || '—' }}</td>
                        </tr>
                        <!-- Per-symbol breakdown for the expanded candidate -->
                        <tr v-if="expanded === i && cand.perSymbol.length" class="us-sub-row">
                            <td :colspan="candidateCols.length + 2">
                                <table class="bt-table us-subtable">
                                    <thead><tr>
                                        <th>Symbol</th>
                                        <th v-for="c in perSymbolCols" :key="c.key" class="num">{{ c.label }}</th>
                                    </tr></thead>
                                    <tbody>
                                        <tr v-for="(s, si) in cand.perSymbol" :key="si">
                                            <td class="sym">{{ s.symbol || '—' }}</td>
                                            <td v-for="c in perSymbolCols" :key="c.key" class="num" :class="c.sign ? signOf(s[c.key]) : ''">{{ fmtCell(s[c.key], c) }}</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </td>
                        </tr>
                    </template>
                </tbody>
            </table>
        </template>
        <div v-else class="us-msg">
            No ranked candidates found in this artifact's known fields.
        </div>

        <!-- Raw artifact (always available — the study schema is feature-detected,
             so this guarantees the data is inspectable even if a field is renamed). -->
        <div class="us-raw">
            <button class="us-raw-toggle" @click="showRaw = !showRaw">{{ showRaw ? '▾' : '▸' }} Raw artifact JSON</button>
            <pre v-if="showRaw" class="us-raw-pre">{{ rawJson }}</pre>
        </div>
    </template>
    <div v-else class="us-msg">No artifact available.</div>
</div>
</template>

<script>
// CorkyUniverseStudy — renders a compact "universe optimization" artifact
// (candidate rankings + aggregate robustness + per-symbol metrics). These
// studies do NOT carry fill/equity timelines, so there is nothing to plot.
//
// The exact artifact schema is NOT hard-coded (per the gateway contract): every
// field is feature-detected across a list of likely names, and a raw-JSON
// fallback guarantees the data is always inspectable. All money/ratio/percent
// values are treated as decimal strings (formatted for display only).

// First present (non-null) value among candidate keys on an object.
function pick(obj, keys) {
    if (!obj || typeof obj !== 'object') return undefined
    for (const k of keys) {
        if (obj[k] != null && obj[k] !== '') return obj[k]
        if (obj.metrics && obj.metrics[k] != null && obj.metrics[k] !== '') return obj.metrics[k]
    }
    return undefined
}

// Display columns for a candidate / per-symbol row. fmt: money|pct|ratio|count.
const CANDIDATE_COLS = [
    { key: 'score', label: 'Score', fmt: 'ratio', sign: false, names: ['robust_cross_symbol_score_v1', 'robust_score', 'robustness_score', 'robustness', 'score'] },
    { key: 'profitable', label: 'Profitable', fmt: 'count', names: ['profitable_symbol_count', 'profitable_symbols', 'profitable_count', 'num_profitable_symbols'] },
    { key: 'ret', label: 'Return', fmt: 'pct', sign: true, names: ['median_return_pct', 'aggregate_return_pct', 'median_return', 'return_pct', 'mean_return_pct'] },
    { key: 'dd', label: 'Max DD', fmt: 'pct', names: ['median_max_drawdown_pct', 'max_drawdown_pct', 'max_equity_drawdown', 'drawdown_pct', 'drawdown'] },
    { key: 'recovery', label: 'Recovery', fmt: 'ratio', names: ['recovery_factor', 'median_recovery_factor'] },
    { key: 'pf', label: 'PF', fmt: 'ratio', names: ['profit_factor', 'median_profit_factor'] },
]
const PER_SYMBOL_COLS = [
    { key: 'ret', label: 'Return', fmt: 'pct', sign: true, names: ['return_pct', 'total_return_pct', 'net_return_pct'] },
    { key: 'pf', label: 'PF', fmt: 'ratio', names: ['profit_factor'] },
    { key: 'dd', label: 'Max DD', fmt: 'pct', names: ['max_drawdown_pct', 'max_equity_drawdown', 'drawdown_pct'] },
    { key: 'trades', label: 'Trades', fmt: 'count', names: ['total_trades', 'trades', 'trade_count'] },
]

export default {
    name: 'CorkyUniverseStudy',
    props: {
        run: { type: Object, default: null },
        artifact: { type: Object, default: null },
        loading: { type: Boolean, default: false },
        error: { type: String, default: null },
    },
    data() { return { expanded: -1, showRaw: false } },
    computed: {
        candidateCols() { return CANDIDATE_COLS },
        perSymbolCols() { return PER_SYMBOL_COLS },
        // The universe sub-object the rankings live under (feature-detected).
        study() {
            const a = this.artifact || {}
            return a.universe || a.study || a.metric_study || a.optimization || a
        },
        // Feature-detected candidate list, normalized to a stable row shape.
        candidates() {
            const u = this.study
            const raw = (u && (u.candidates || u.rankings || u.ranked_candidates || u.ranked_runs || u.results))
                || (this.artifact && (this.artifact.candidates || this.artifact.rankings)) || []
            if (!Array.isArray(raw)) return []
            return raw.map((c, i) => {
                const row = {
                    runIndex: pick(c, ['run_index', 'index', 'rank', 'candidate_index']),
                    params: pick(c, ['parameters', 'params', 'parameter_set', 'parameter_values']) || {},
                    perSymbol: this._perSymbol(c),
                }
                for (const col of CANDIDATE_COLS) row[col.key] = pick(c, col.names)
                if (row.runIndex == null) row.runIndex = pick(c, ['run_index'])
                return row
            })
        },
        // Optimization metadata key/value chips (sampler, objective, seed, etc.).
        optMetaRows() {
            const a = this.artifact || {}
            const o = a.optimization || (a.plan && a.plan.optimization) || (this.study && this.study.optimization) || null
            if (!o || typeof o !== 'object') return []
            const FIELDS = [
                ['sampler', 'Sampler'], ['objective', 'Objective'], ['kind', 'Kind'],
                ['seed', 'Seed'], ['iterations', 'Iterations'], ['n_trials', 'Trials'],
                ['scoring', 'Scoring'], ['ranking', 'Ranking'],
            ]
            return FIELDS.filter(([k]) => o[k] != null && o[k] !== '').map(([k, label]) => ({ key: k, label, value: String(o[k]) }))
        },
        rawJson() { try { return JSON.stringify(this.artifact, null, 2) } catch (_) { return '(unserializable)' } },
    },
    methods: {
        toggle(i) { this.expanded = this.expanded === i ? -1 : i },
        _perSymbol(c) {
            const ps = pick(c, ['per_symbol', 'symbols', 'by_symbol', 'symbol_metrics', 'per_symbol_metrics'])
            if (!ps) return []
            // Normalize each row to the per-symbol column keys (feature-detected),
            // from either an array of {symbol, ...} or a map of symbol → metrics.
            const norm = (sym, obj) => {
                const o = flat(obj)
                const row = { symbol: sym }
                for (const col of PER_SYMBOL_COLS) row[col.key] = pick(o, col.names)
                return row
            }
            if (Array.isArray(ps)) return ps.map((s) => norm(s.symbol || s.name, s))
            return Object.keys(ps).map((sym) => norm(sym, ps[sym]))
        },
        signOf(v) {
            if (v == null || v === '') return ''
            const n = Number(v)
            if (!Number.isFinite(n)) return ''
            return n > 0 ? 'pos' : (n < 0 ? 'neg' : '')
        },
        fmtCell(v, col) {
            if (v == null || v === '') return '—'
            const n = Number(v)
            if (!Number.isFinite(n)) return String(v)
            switch (col.fmt) {
                case 'pct': return `${(n * 100).toFixed(2)}%`   // fractions
                case 'ratio': return n.toFixed(2)
                case 'count': return n.toLocaleString(undefined, { maximumFractionDigits: 0 })
                case 'money': return n.toLocaleString(undefined, { maximumFractionDigits: 2 })
                default: return String(v)
            }
        },
        paramStr(params) {
            if (!params || typeof params !== 'object') return ''
            return Object.keys(params).map((k) => `${k}=${params[k]}`).join(', ')
        },
    },
}

// Hoist a candidate/symbol's `metrics` sub-object up so pick() finds fields at
// the top level too (some artifacts nest, some flatten).
function flat(o) {
    if (!o || typeof o !== 'object') return {}
    return o.metrics && typeof o.metrics === 'object' ? { ...o.metrics, ...o } : o
}
</script>

<style scoped>
.us { color: #d1d4dc; font-size: 12px; }
.us-note { background: rgba(255,127,0,0.08); border: 1px solid rgba(255,127,0,0.25); border-radius: 4px; padding: 8px 10px; margin-bottom: 10px; color: #c9b08a; line-height: 1.4; }
.us-msg { padding: 14px 0; color: #808a9d; }
.us-err { color: #e54150; }
.us-meta { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 10px; }
.us-meta-item { display: inline-flex; gap: 6px; background: #161d2b; border: 1px solid #2a2e39; border-radius: 4px; padding: 2px 8px; }
.us-meta-k { color: #808a9d; }
.us-meta-v { color: #d1d4dc; font-weight: 600; }
.us-sec { color: #808a9d; font-weight: 700; font-size: 10px; letter-spacing: 0.06em; text-transform: uppercase; margin: 8px 0 4px; }
.us-table { width: 100%; border-collapse: collapse; }
.us-table th { text-align: left; padding: 5px 8px; border-bottom: 1px solid #2a2e39; color: #808a9d; font-weight: 500; white-space: nowrap; }
.us-table .num { text-align: right; font-variant-numeric: tabular-nums; }
.us-table td { padding: 4px 8px; border-bottom: 1px solid #1c212e; white-space: nowrap; }
.us-table .bt-row { cursor: pointer; }
.us-table .bt-row:hover { background: #1e222d; }
.us-table .bt-row.open { background: rgba(187,134,252,0.10); }
.us-rank { font-weight: 700; color: #bb86fc; }
.us-params { color: #808a9d; max-width: 280px; overflow: hidden; text-overflow: ellipsis; }
.us-sub-row > td { padding: 0 8px 8px 24px; background: #11151f; }
.us-subtable { width: 100%; }
.us-subtable th { font-size: 11px; }
.sym { color: #fff; font-weight: 600; }
.us-raw { margin: 12px 0; }
.us-raw-toggle { background: #131722; color: #808a9d; border: 1px solid #2a2e39; border-radius: 4px; padding: 4px 10px; cursor: pointer; font-size: 11px; }
.us-raw-toggle:hover { color: #d1d4dc; }
.us-raw-pre { max-height: 320px; overflow: auto; background: #0e1320; border: 1px solid #1c212e; border-radius: 4px; padding: 8px; font-size: 11px; margin-top: 6px; }
.bt-type { font-size: 10px; padding: 1px 7px; border-radius: 9px; }
.bt-type.t-universe { background: rgba(255,127,0,0.16); color: #ff9f40; }
.pos { color: #23a776; }
.neg { color: #e54150; }
</style>
