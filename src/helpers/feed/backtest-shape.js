// Feature-detect the SHAPE of a Corky backtest run/artifact so the UI can adapt:
// which runs are chartable, which expose multiple parameter candidates
// (run_index), and which are compact metric-only universe studies.
//
// Detection is LAYERED and never hard-codes one schema (per the gateway
// contract): a fast path from the run SUMMARY (run_id pattern + symbol count)
// for the list, refined by the raw get_backtest_run.artifact when available.
// Every probe is feature-detected and optional.

export const RUN_SHAPES = ['normal', 'portfolio', 'sweep', 'optimize', 'universe']

const RUN_SHAPE_LABELS = {
  normal: 'Backtest', portfolio: 'Portfolio', sweep: 'Sweep',
  optimize: 'Optimized', universe: 'Universe',
}
export function runShapeLabel(kind) { return RUN_SHAPE_LABELS[kind] || 'Backtest' }

// Trailing ":<N>" candidate/grid count baked into sweep/optimize run_ids
// (e.g. "sweep:…:1782388800000:56" → 56 candidates).
function trailingCount(runId) {
  const m = /:(\d+)$/.exec(String(runId || ''))
  if (!m) return null
  const n = Number(m[1])
  return Number.isFinite(n) && n > 1 ? n : null
}

/**
 * @param {object} run        - run summary ({ run_id, symbols, ... }).
 * @param {object} [artifact] - raw get_backtest_run.artifact (authoritative).
 * @returns {{ kind:string, label:string, chartable:boolean,
 *            multiCandidate:boolean, candidateCount:(number|null) }}
 */
export function detectRunShape(run = {}, artifact = null) {
  const id = String(run.run_id || '')
  const symbols = Array.isArray(run.symbols) ? run.symbols : []
  let kind

  if (artifact && typeof artifact === 'object') {
    // Artifact-first (authoritative).
    const plan = artifact.plan || {}
    const opt = artifact.optimization || plan.optimization || null
    const universeMark = artifact.universe || artifact.metric_study
      || /universe/i.test(String(artifact.kind || plan.kind || (opt && (opt.kind || opt.objective)) || ''))
    if (universeMark) kind = 'universe'
    else if (opt) kind = 'optimize'
    else if (/sweep/i.test(String(plan.mode || '')) || Number(plan.parameter_grid_count) > 1) kind = 'sweep'
    else if (symbols.length > 1) kind = 'portfolio'
    else kind = 'normal'
  } else {
    // Fast path from the run_id + summary (no artifact fetch).
    if (/universe/i.test(id)) kind = 'universe'
    else if (/optimi[sz]e/i.test(id)) kind = 'optimize'
    else if (/sweep/i.test(id)) kind = 'sweep'
    else if (symbols.length > 1) kind = 'portfolio'
    else kind = 'normal'
  }

  const multiCandidate = kind === 'sweep' || kind === 'optimize' || kind === 'universe'
  let candidateCount = null
  const gridCount = artifact && artifact.plan ? Number(artifact.plan.parameter_grid_count) : NaN
  if (Number.isFinite(gridCount) && gridCount > 1) candidateCount = gridCount
  else candidateCount = trailingCount(id)

  // Universe = a compact metric study: it stores candidate rankings + aggregate
  // robustness + per-symbol metrics, NOT full fill/equity timelines, so its
  // chart/report overlays won't plot unless a candidate is materialized.
  const chartable = kind !== 'universe'

  return { kind, label: runShapeLabel(kind), chartable, multiCandidate, candidateCount }
}
