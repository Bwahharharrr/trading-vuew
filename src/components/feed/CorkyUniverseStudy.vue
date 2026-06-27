<template>
<div class="us">
    <div v-if="!chartable" class="us-note">
        <span class="bt-type t-universe">Universe</span>
        Metric study only — candidate rankings + per-symbol metrics. Plotting an
        equity/trade chart requires a materialized execution artifact (rerun a
        candidate as a normal backtest).
    </div>

    <div v-if="loading" class="us-msg">Loading study artifact…</div>
    <div v-else-if="error" class="us-msg us-err">{{ error }}</div>
    <template v-else-if="artifact">
        <!-- Optimization metadata (sampler / objective / candidate count / …). -->
        <div v-if="optMetaRows.length" class="us-meta">
            <span v-for="m in optMetaRows" :key="m.key" class="us-meta-item">
                <span class="us-meta-k">{{ m.label }}</span><span class="us-meta-v">{{ m.value }}</span>
            </span>
        </div>

        <!-- Candidate ranking table -->
        <template v-if="candidates.length">
            <div class="us-sec">
                Candidates ({{ candidateFilters.length ? shownCandidates.length + ' / ' + candidates.length : candidates.length }})
                <span v-if="chartable" class="us-dim">· click a row to plot it</span>
                <button v-if="candidateFilters.length" class="us-clear" @click="clearAllCandidateFilters"
                        :title="candidateFilters.map(f => `${f.label} ${f.op} ${f.value}`).join('  ·  ')">✕ Clear column filters ({{ candidateFilters.length }})</button>
            </div>
            <table class="bt-table us-table">
                <thead><tr>
                    <th>#</th>
                    <th v-for="c in candidateCols" :key="c.key" class="num" :class="{ 'has-filter': !!filterForCandidateCol(c.key) }" :title="c.title || ''">
                        {{ c.label }}
                        <ColumnFilterButton :column="{ key: c.key, label: c.label }" :filter="filterForCandidateCol(c.key)"
                            @apply="applyCandidateFilter" @clear="clearCandidateFilter" />
                    </th>
                    <th>Parameters</th>
                </tr></thead>
                <tbody>
                    <template v-for="cand in shownCandidates" :key="cand._i">
                        <tr class="bt-row" :class="[
                                { open: expanded === cand._i, active: selectedRunIndex != null && cand.runIndex === selectedRunIndex },
                                recencyClass(cand._i, candidateHistory, 'us-recent')
                            ]"
                            @click="onRowClick(cand, cand._i)">
                            <td class="us-rank">{{ cand.runIndex != null ? cand.runIndex : cand._i }}</td>
                            <td v-for="c in candidateCols" :key="c.key" class="num" :class="c.sign ? signOf(cand[c.key]) : ''">{{ fmtCell(cand[c.key], c) }}</td>
                            <td class="us-params" :title="paramStr(cand.params)">{{ paramStr(cand.params) || '—' }}</td>
                        </tr>
                        <!-- Per-symbol breakdown for the expanded candidate (universe). -->
                        <tr v-if="expanded === cand._i && cand.perSymbol.length" class="us-sub-row">
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
        <div v-else class="us-msg">No ranked candidates found in this artifact's known fields.</div>

        <!-- Raw artifact (always available — the schema is feature-detected, so
             this guarantees the data is inspectable even if a field is renamed). -->
        <div class="us-raw">
            <button class="us-raw-toggle" @click="showRaw = !showRaw">{{ showRaw ? '▾' : '▸' }} Raw artifact JSON</button>
            <button class="us-raw-copy" type="button" title="Copy raw JSON to clipboard" @click="copyRaw">⧉ Copy</button>
            <pre v-if="showRaw" class="us-raw-pre">{{ rawJson }}</pre>
        </div>
    </template>
    <div v-else class="us-msg">No artifact available.</div>

    <!-- Tiny confirmation that floats up beside the cursor, then auto-dismisses
         (fixed → viewport coords; teleported so no overflow/stacking clip). -->
    <Teleport to="body">
        <div v-if="copyToast.show" class="us-copy-toast" :class="{ err: !copyToast.ok }"
             :style="{ left: copyToast.x + 'px', top: copyToast.y + 'px' }">
            {{ copyToast.ok ? '✓ Copied' : 'Copy failed' }}
        </div>
    </Teleport>
</div>
</template>

<script>
import ColumnFilterButton from './ColumnFilterButton.vue'
import { applyMetricFilters } from '../../helpers/metric-filter.js'
import { pushRecent, recencyClass } from '../../helpers/recency.js'

// CorkyUniverseStudy — renders a multi-candidate study artifact (sweep /
// optimize / universe / walk-forward): the candidate ranking table + per-symbol
// breakdown (universe), optimization metadata, and a raw-JSON fallback. For
// CHARTABLE studies (sweep/optimize) a row click selects that run_index (plots
// it); for a UNIVERSE metric study (not chartable) it expands the per-symbol
// metrics. The artifact schema is NOT hard-coded — every field is feature-
// detected across likely names. Decimal values are display-formatted only.

// First present (non-null) value among candidate keys on an object.
function pick(obj, keys) {
    if (!obj || typeof obj !== 'object') return undefined
    for (const k of keys) if (obj[k] != null && obj[k] !== '') return obj[k]
    return undefined
}
// Flatten a candidate/symbol's nested metrics up so pick() finds fields at the
// top level regardless of nesting: sweep runs nest under report.metrics; UNIVERSE
// candidates nest robustness metrics under `aggregate`; per-symbol rows under
// `metrics`; some flatten. Merge all so the column `names` resolve either way.
function look(o) {
    if (!o || typeof o !== 'object') return {}
    return { ...o, ...(o.metrics || {}), ...((o.report && o.report.metrics) || {}), ...(o.aggregate || {}) }
}

// SWEEP / optimize candidates carry a single backtest's metrics (report.metrics).
const SWEEP_COLS = [
    { key: 'rank', label: 'Rank', fmt: 'count', names: ['rank'] },
    { key: 'scorev2', label: 'Score v2', fmt: 'ratio', title: 'Robustness score (v2)', names: ['score_v2', 'robust_cross_symbol_score_v2', 'score'] },
    { key: 'netprofit', label: 'Net P/L', fmt: 'money', sign: true, names: ['total_net_profit'] },
    { key: 'ret', label: 'Return', fmt: 'pct', sign: true, names: ['strategy_return_pct', 'return_pct'] },
    { key: 'pf', label: 'PF', fmt: 'ratio', names: ['profit_factor'] },
    { key: 'recovery', label: 'Recovery', fmt: 'ratio', names: ['recovery_factor'] },
    { key: 'sharpe', label: 'Sharpe', fmt: 'ratio', names: ['sharpe_ratio'] },
    { key: 'dd', label: 'Max DD', fmt: 'money', names: ['max_equity_drawdown'] },
    { key: 'trades', label: 'Trades', fmt: 'count', names: ['total_trades'] },
]
// UNIVERSE candidates carry CROSS-SYMBOL ROBUSTNESS aggregates (median_*/score/
// counts) — there is no single Net P/L (mixed currencies), by design.
const UNIVERSE_COLS = [
    { key: 'rank', label: 'Rank', fmt: 'count', names: ['rank'] },
    { key: 'score', label: 'Score', fmt: 'ratio', title: 'Robust cross-symbol score', names: ['score', 'robust_cross_symbol_score_v1', 'robust_score'] },
    { key: 'scorev2', label: 'Score v2', fmt: 'ratio', title: 'Robust cross-symbol score (v2)', names: ['score_v2', 'robust_cross_symbol_score_v2'] },
    { key: 'medreturn', label: 'Med Return', fmt: 'ratio', sign: true, title: 'Median per-symbol return', names: ['median_return'] },
    { key: 'medpf', label: 'Med PF', fmt: 'ratio', title: 'Median profit factor', names: ['median_pf', 'median_profit_factor'] },
    { key: 'medrecovery', label: 'Med Recovery', fmt: 'ratio', title: 'Median recovery factor', names: ['median_recovery'] },
    { key: 'medsharpe', label: 'Med Sharpe', fmt: 'ratio', title: 'Median Sharpe ratio', names: ['median_sharpe'] },
    { key: 'medsortino', label: 'Med Sortino', fmt: 'ratio', title: 'Median Sortino ratio', names: ['median_sortino'] },
    { key: 'medvsbh', label: 'vs B&H', fmt: 'pct', sign: true, title: 'Median strategy vs buy & hold return', names: ['median_strategy_vs_buy_hold_return_pct'] },
    { key: 'profitable', label: 'Profitable', fmt: 'count', title: 'Profitable symbols', names: ['profitable'] },
    { key: 'beatbh', label: 'Beat B&H', fmt: 'count', title: 'Symbols beating buy & hold', names: ['beat_buy_hold'] },
    { key: 'trades', label: 'Trades', fmt: 'count', title: 'Total trades across symbols', names: ['total_trades'] },
    { key: 'avgtrades', label: 'Avg Trades', fmt: 'avg', title: 'Average trades per symbol', names: ['avg_trades', 'mean_trades'] },
]
// Per-symbol metrics carry the full standard backtest metric set (~34 fields) —
// surface the useful ones for evaluating each ticker individually.
const PER_SYMBOL_COLS = [
    { key: 'ret', label: 'Return', fmt: 'pct', sign: true, names: ['strategy_return_pct', 'return_pct', 'total_return_pct'] },
    { key: 'netprofit', label: 'Net P/L', fmt: 'money', sign: true, names: ['total_net_profit'] },
    { key: 'vsbh', label: 'vs B&H', fmt: 'pct', sign: true, names: ['strategy_vs_buy_hold_return_pct'] },
    { key: 'pf', label: 'PF', fmt: 'ratio', names: ['profit_factor'] },
    { key: 'recovery', label: 'Recovery', fmt: 'ratio', names: ['recovery_factor'] },
    { key: 'sharpe', label: 'Sharpe', fmt: 'ratio', names: ['sharpe_ratio'] },
    { key: 'sortino', label: 'Sortino', fmt: 'ratio', names: ['sortino_ratio'] },
    { key: 'dd', label: 'Max DD', fmt: 'money', names: ['max_equity_drawdown'] },
    { key: 'expectancy', label: 'Exp. Payoff', fmt: 'money', sign: true, names: ['expected_payoff'] },
    { key: 'winpct', label: 'Win %', fmt: 'pct', names: ['positive_trade_pct'] },
    { key: 'trades', label: 'Trades', fmt: 'count', names: ['total_trades'] },
]

export default {
    name: 'CorkyUniverseStudy',
    components: { ColumnFilterButton },
    props: {
        run: { type: Object, default: null },
        artifact: { type: Object, default: null },
        loading: { type: Boolean, default: false },
        error: { type: String, default: null },
        // Sweep/optimize candidates are selectable (plot run_index); universe is not.
        chartable: { type: Boolean, default: false },
        selectedRunIndex: { type: Number, default: null },
    },
    emits: ['select-candidate'],
    // candidateFilters / candidateHistory / expanded are per-study LOCAL state.
    // The parent reuses this instance across studies (no remount), so the watch
    // on `studyKey` below resets them when the shown study changes — otherwise a
    // prior study's filters/recency would leak onto the next one.
    data() { return { expanded: -1, showRaw: false, candidateFilters: [], candidateHistory: [], copyToast: { show: false, ok: true, x: 0, y: 0 } } },
    beforeUnmount() { if (this._copyTimer) clearTimeout(this._copyTimer) },
    watch: {
        studyKey() {
            this.candidateFilters = []
            this.candidateHistory = []
            this.expanded = -1
        },
    },
    computed: {
        // Identity of the shown study — its run_id when present, else the artifact
        // reference. Drives the per-study local-state reset above.
        studyKey() { return (this.run && this.run.run_id) || this.artifact },
        // Universe candidates carry cross-symbol robustness aggregates; sweep/
        // optimize candidates carry a single backtest's metrics.
        candidateCols() { return this.chartable ? SWEEP_COLS : UNIVERSE_COLS },
        perSymbolCols() { return PER_SYMBOL_COLS },
        // The sub-object the rankings live under (feature-detected). NB: an
        // `optimization` object is METADATA, not the ranking container — don't
        // route candidate lookup through it.
        study() {
            const a = this.artifact || {}
            return a.universe || a.study || a.metric_study || a
        },
        // Feature-detected, normalized candidate rows.
        candidates() {
            const u = this.study; const a = this.artifact || {}
            const raw = (u && (u.runs || u.candidates || u.rankings || u.ranked_candidates || u.ranked_runs || u.results))
                || (u && u.summary && u.summary.runs)
                || a.runs || (a.summary && a.summary.runs) || a.candidates || a.rankings || []
            if (!Array.isArray(raw)) return []
            return raw.map((c, i) => {
                const lk = look(c)   // merges metrics / report.metrics / aggregate
                const row = {
                    // _i is the ORIGINAL candidate index — kept stable across the
                    // filter so expand/select/recency key off the same identity.
                    _i: i,
                    runIndex: pick(c, ['run_index', 'index', 'candidate_index']),
                    params: pick(c, ['parameters', 'params', 'parameter_set', 'parameter_values']) || {},
                    perSymbol: this._perSymbol(c),
                }
                for (const col of this.candidateCols) row[col.key] = pick(lk, col.names)
                return row
            })
        },
        // Candidates after applying the active numeric column filters (AND). Each
        // row already exposes col.key as a numeric-ish field (row[col.key]).
        shownCandidates() {
            // Raw value through — passesFilter coerces and excludes missing data.
            return applyMetricFilters(this.candidates, this.candidateFilters, (row, key) => row[key])
        },
        // Optimization metadata key/value chips (sampler, objective, counts, …).
        optMetaRows() {
            const a = this.artifact || {}
            const o = a.optimization || (a.plan && a.plan.optimization) || (a.summary && a.summary.optimization)
                || (this.run && this.run.optimization) || null
            if (!o || typeof o !== 'object') return []
            const FIELDS = [
                ['sampler', 'Sampler'], ['objective', 'Objective'], ['kind', 'Kind'],
                ['candidate_count', 'Candidates'], ['full_grid_count', 'Grid'],
                ['selected_parameter_set_count', 'Selected'], ['exhaustive', 'Exhaustive'],
                ['seed', 'Seed'], ['iterations', 'Iterations'], ['n_trials', 'Trials'],
            ]
            return FIELDS.filter(([k]) => o[k] != null && o[k] !== '').map(([k, label]) => ({ key: k, label, value: String(o[k]) }))
        },
        rawJson() { try { return JSON.stringify(this.artifact, null, 2) } catch (_) { return '(unserializable)' } },
    },
    methods: {
        recencyClass,
        // Copy the raw artifact JSON to the clipboard. Prefers the async Clipboard
        // API (secure contexts), falls back to a hidden-textarea execCommand for
        // older / non-secure ones. Either way a brief toast confirms by the cursor.
        async copyRaw(e) {
            const text = this.rawJson
            let ok = false
            try {
                if (navigator.clipboard && navigator.clipboard.writeText) {
                    await navigator.clipboard.writeText(text)
                    ok = true
                } else {
                    ok = this._fallbackCopy(text)
                }
            } catch (_) {
                ok = this._fallbackCopy(text)   // permission/denied → try the legacy path
            }
            this._showCopyToast(e, ok)
        },
        _fallbackCopy(text) {
            try {
                const ta = document.createElement('textarea')
                ta.value = text
                ta.setAttribute('readonly', '')
                ta.style.cssText = 'position:fixed;top:0;left:0;opacity:0;pointer-events:none;'
                document.body.appendChild(ta)
                ta.select()
                const ok = document.execCommand('copy')
                document.body.removeChild(ta)
                return ok
            } catch (_) { return false }
        },
        _showCopyToast(e, ok) {
            // Offset slightly off the pointer so the toast sits beside, not under it.
            this.copyToast = { show: true, ok, x: ((e && e.clientX) || 0) + 12, y: ((e && e.clientY) || 0) + 12 }
            if (this._copyTimer) clearTimeout(this._copyTimer)
            this._copyTimer = setTimeout(() => { this.copyToast.show = false }, 1100)
        },
        // ── Per-column numeric filters (header [+]). Local per-study state; one
        //    filter per column (re-apply replaces it).
        filterForCandidateCol(key) { return this.candidateFilters.find((f) => f.key === key) || null },
        applyCandidateFilter(filter) {
            this.candidateFilters = [...this.candidateFilters.filter((f) => f.key !== filter.key), filter]
        },
        clearCandidateFilter(key) {
            this.candidateFilters = this.candidateFilters.filter((f) => f.key !== key)
        },
        clearAllCandidateFilters() { this.candidateFilters = [] },
        onRowClick(cand, i) {
            // Record the click in the recency-graded history (most-recent first)
            // BEFORE selecting/expanding, keyed by run_index when present.
            this.candidateHistory = pushRecent(this.candidateHistory, i)   // key recency on the stable _i (collision-free across mixed runIndex/_i)
            if (this.chartable && cand.runIndex != null) this.$emit('select-candidate', Number(cand.runIndex))
            else this.expanded = this.expanded === i ? -1 : i
        },
        _perSymbol(c) {
            const ps = pick(c, ['per_symbol', 'symbols', 'by_symbol', 'symbol_metrics', 'per_symbol_metrics'])
            if (!ps) return []
            const norm = (sym, obj) => {
                const lk = look(obj)
                const row = { symbol: sym }
                for (const col of PER_SYMBOL_COLS) row[col.key] = pick(lk, col.names)
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
                // Averaged count (e.g. avg_trades 7204.7) — keep one decimal so the
                // average isn't rounded away, with thousands separators.
                case 'avg': return n.toLocaleString(undefined, { maximumFractionDigits: 1 })
                case 'money': return n.toLocaleString(undefined, { maximumFractionDigits: 2 })
                default: return String(v)
            }
        },
        paramStr(params) {
            // sweep params nest under { values: {...} }; universe may flatten.
            const p = (params && typeof params === 'object' && params.values && typeof params.values === 'object') ? params.values : params
            if (!p || typeof p !== 'object') return ''
            return Object.keys(p).map((k) => `${k}=${p[k]}`).join(', ')
        },
    },
}
</script>

<style scoped>
.us { color: #d1d4dc; font-size: 12px; }
.us-note { background: rgba(255,127,0,0.08); border: 1px solid rgba(255,127,0,0.25); border-radius: 4px; padding: 8px 10px; margin-bottom: 10px; color: #c9b08a; line-height: 1.4; }
.us-msg { padding: 14px 0; color: #808a9d; }
.us-err { color: #e54150; }
.us-dim { color: #808a9d; font-weight: 400; text-transform: none; letter-spacing: 0; }
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
.us-table .bt-row:nth-child(even) { background: rgba(255,255,255,0.02); }
.us-table .bt-row:hover { background: #1e222d; }
.us-table .bt-row.open { background: rgba(187,134,252,0.10); }
.us-table .bt-row.active { background: rgba(53,167,118,0.16); box-shadow: inset 3px 0 0 #35a776; }
/* Recency-graded click history: brightest (most recent, -0) → darkest (-4),
   green-tinted off the #35a776 accent. -0 also gets the accent inset bar. */
.us-table .bt-row.us-recent-0 { background: rgba(53,167,118,0.22); box-shadow: inset 3px 0 0 #35a776; }
.us-table .bt-row.us-recent-1 { background: rgba(53,167,118,0.16); }
.us-table .bt-row.us-recent-2 { background: rgba(53,167,118,0.11); }
.us-table .bt-row.us-recent-3 { background: rgba(53,167,118,0.07); }
.us-table .bt-row.us-recent-4 { background: rgba(53,167,118,0.04); }
.us-clear { margin-left: 10px; background: rgba(229,65,80,0.10); color: #e07a85;
            border: 1px solid rgba(229,65,80,0.4); border-radius: 4px; padding: 2px 8px;
            font-size: 10px; cursor: pointer; text-transform: none; letter-spacing: 0; font-weight: 600; }
.us-clear:hover { background: rgba(229,65,80,0.18); color: #e54150; }
/* Filtered candidate column heading: green underline cue. */
.us-table th.has-filter { box-shadow: inset 0 -2px 0 rgba(53,167,118,0.6); }
.us-rank { font-weight: 700; color: #bb86fc; }
.us-params { color: #808a9d; max-width: 280px; overflow: hidden; text-overflow: ellipsis; }
.us-sub-row > td { padding: 0 8px 8px 24px; background: #11151f; }
.us-subtable { width: 100%; }
.us-subtable th { font-size: 11px; }
.sym { color: #fff; font-weight: 600; }
.us-raw { margin: 12px 0; }
.us-raw-toggle { background: #131722; color: #808a9d; border: 1px solid #2a2e39; border-radius: 4px; padding: 4px 10px; cursor: pointer; font-size: 11px; }
.us-raw-toggle:hover { color: #d1d4dc; }
.us-raw-copy { margin-left: 6px; background: #131722; color: #808a9d; border: 1px solid #2a2e39; border-radius: 4px; padding: 4px 10px; cursor: pointer; font-size: 11px; }
.us-raw-copy:hover { color: #35a776; border-color: #35a776; }
.us-raw-pre { max-height: 320px; overflow: auto; background: #0e1320; border: 1px solid #1c212e; border-radius: 4px; padding: 8px; font-size: 11px; margin-top: 6px; }
/* Cursor-anchored copy confirmation: fades in, drifts up, fades out (~1.1s). */
.us-copy-toast {
    position: fixed; z-index: 9999; pointer-events: none; white-space: nowrap;
    background: #1f2937; color: #d1fadf; border: 1px solid rgba(53,167,118,0.55);
    border-radius: 5px; padding: 3px 9px; font-size: 11px; font-weight: 600;
    box-shadow: 0 4px 14px rgba(0,0,0,0.45); animation: us-copy-fade 1.1s ease-out forwards;
}
.us-copy-toast.err { color: #f3c1c5; border-color: rgba(229,65,80,0.55); }
@keyframes us-copy-fade {
    0% { opacity: 0; transform: translateY(4px); }
    15% { opacity: 1; transform: translateY(0); }
    70% { opacity: 1; transform: translateY(-2px); }
    100% { opacity: 0; transform: translateY(-8px); }
}
.bt-type { font-size: 10px; padding: 1px 7px; border-radius: 9px; }
.bt-type.t-universe { background: rgba(255,127,0,0.16); color: #ff9f40; }
.pos { color: #23a776; }
.neg { color: #e54150; }
</style>
