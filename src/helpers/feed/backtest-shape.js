// Feature-detect the SHAPE of a Corky backtest run/artifact so the UI can adapt:
// which runs are chartable, which expose multiple parameter candidates
// (run_index), and which are compact metric-only universe studies.
//
// Detection is LAYERED and never hard-codes one schema (per the gateway
// contract): the AUTHORITATIVE `run.run_kind` + `run.optimization` summary
// fields first (v2 gateway), then the raw artifact, then a fast path from the
// run_id pattern + symbol count for older runs that lack the new fields. Every
// probe is feature-detected and optional.

export const RUN_SHAPES = [
  'normal', 'portfolio', 'sweep', 'portfolio_sweep',
  'optimize', 'portfolio_optimize', 'universe', 'walk_forward',
]

const RUN_SHAPE_LABELS = {
  normal: 'Backtest', portfolio: 'Portfolio',
  sweep: 'Sweep', portfolio_sweep: 'Portfolio Sweep',
  optimize: 'Optimized', portfolio_optimize: 'Portfolio Opt.',
  universe: 'Universe', walk_forward: 'Walk-Forward',
}
const humanize = (k) => String(k).replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
export function runShapeLabel(kind) { return RUN_SHAPE_LABELS[kind] || humanize(kind || 'normal') }

// CSS-class slug for a kind badge (collapse portfolio_* / walk_forward variants).
export function runShapeClass(kind) {
  if (/universe/.test(kind)) return 'universe'
  if (/optim/.test(kind)) return 'optimize'
  if (/sweep/.test(kind)) return 'sweep'
  if (/walk/.test(kind)) return 'walk'
  if (/portfolio/.test(kind)) return 'portfolio'
  return 'normal'
}

const num = (v) => { const n = Number(v); return Number.isFinite(n) && n > 0 ? n : null }

// Trailing ":<N>" candidate/grid count baked into older sweep/optimize run_ids
// (e.g. "sweep:…:1782388800000:56" → 56). NOT used for normal runs, where the
// trailing segment is an END TIMESTAMP.
function trailingCount(runId) {
  const m = /:(\d+)$/.exec(String(runId || ''))
  if (!m) return null
  const n = Number(m[1])
  return Number.isFinite(n) && n > 1 ? n : null
}

/**
 * @param {object} run        - run summary ({ run_id, symbols, run_kind?, optimization?, … }).
 * @param {object} [artifact] - raw get_backtest_run.artifact (authoritative for older runs).
 * @returns {{ kind:string, label:string, klass:string, chartable:boolean,
 *            multiCandidate:boolean, candidateCount:(number|null) }}
 */
export function detectRunShape(run = {}, artifact = null) {
  const id = String(run.run_id || '')
  const symbols = Array.isArray(run.symbols) ? run.symbols : []
  let kind = (run.run_kind && String(run.run_kind)) || null   // v2 authoritative field

  if (!kind && artifact && typeof artifact === 'object') {
    const plan = artifact.plan || {}
    const opt = artifact.optimization || plan.optimization || null
    const universeMark = artifact.universe || artifact.metric_study
      || /universe/i.test(String(artifact.kind || plan.kind || (opt && (opt.kind || opt.objective)) || ''))
    if (universeMark) kind = 'universe'
    else if (opt) kind = symbols.length > 1 ? 'portfolio_optimize' : 'optimize'
    else if (/sweep/i.test(String(plan.mode || '')) || Number(plan.parameter_grid_count) > 1) kind = symbols.length > 1 ? 'portfolio_sweep' : 'sweep'
    else if (symbols.length > 1) kind = 'portfolio'
    else kind = 'normal'
  }
  if (!kind) {
    // Fast path from the run_id + summary (no run_kind, no artifact).
    if (/universe/i.test(id)) kind = 'universe'
    else if (/optimi[sz]e/i.test(id)) kind = symbols.length > 1 ? 'portfolio_optimize' : 'optimize'
    else if (/sweep/i.test(id)) kind = symbols.length > 1 ? 'portfolio_sweep' : 'sweep'
    else if (symbols.length > 1) kind = 'portfolio'
    else kind = 'normal'
  }

  // Universe = a compact metric study (rankings + aggregate robustness +
  // per-symbol metrics, no fill/equity timelines) → nothing to plot.
  const chartable = !/universe/i.test(kind)
  const multiCandidate = /sweep|optim|universe|walk/i.test(kind)

  let candidateCount = null
  if (multiCandidate) {
    const opt = run.optimization || (artifact && (artifact.optimization || (artifact.plan && artifact.plan.optimization))) || {}
    candidateCount = num(opt.candidate_count) || num(opt.full_grid_count) || num(opt.selected_parameter_set_count)
      || (artifact && artifact.plan && num(artifact.plan.parameter_grid_count))
      || (artifact && Array.isArray(artifact.runs) && artifact.runs.length > 1 ? artifact.runs.length : null)
      || trailingCount(id)
  }

  return { kind, label: runShapeLabel(kind), klass: runShapeClass(kind), chartable, multiCandidate, candidateCount }
}
