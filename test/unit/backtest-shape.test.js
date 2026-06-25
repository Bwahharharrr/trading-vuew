// detectRunShape — feature-detect a backtest run/artifact shape (normal /
// portfolio / sweep / optimize / universe) from the run_id + summary, refined
// by the raw artifact when available. Drives the list Type badge, filters, the
// run_index candidate selector, and the universe-study view.
import { describe, it, expect } from 'vitest'
import { detectRunShape, runShapeLabel, RUN_SHAPES } from '../../src/helpers/feed/backtest-shape.js'

describe('detectRunShape — fast path (run_id + summary)', () => {
  it('normal single-symbol backtest', () => {
    // trailing :N here is an END TIMESTAMP, not a candidate count.
    const s = detectRunShape({ run_id: 'ema_cross_all_in_v1:BITFINEX:tBTCUSD:1h:1388534400000:1782352800000', symbols: ['tBTCUSD'] })
    expect(s.kind).toBe('normal')
    expect(s.chartable).toBe(true)
    expect(s.multiCandidate).toBe(false)
    expect(s.candidateCount).toBe(null)   // not the end timestamp
  })
  it('portfolio = multi-symbol normal run', () => {
    const s = detectRunShape({ run_id: 'strat:BITFINEX:multi:1h:0:100', symbols: ['tBTCUSD', 'tETHUSD'] })
    expect(s.kind).toBe('portfolio')
    expect(s.chartable).toBe(true)
  })
  it('sweep from run_id prefix + trailing candidate count', () => {
    const s = detectRunShape({ run_id: 'sweep:ema:BITFINEX:tBTCUSD:1h:0:100:56', symbols: ['tBTCUSD'] })
    expect(s.kind).toBe('sweep')
    expect(s.multiCandidate).toBe(true)
    expect(s.candidateCount).toBe(56)   // trailing :56
    expect(s.chartable).toBe(true)
  })
  it('optimize from run_id', () => {
    expect(detectRunShape({ run_id: 'optimize:ema:BITFINEX:tBTCUSD:1h:0:100:12', symbols: ['tBTCUSD'] }).kind).toBe('optimize')
  })
  it('universe study → NOT chartable', () => {
    const s = detectRunShape({ run_id: 'universe:ema:BITFINEX:multi:1h:0:100:40', symbols: ['tBTCUSD', 'tETHUSD'] })
    expect(s.kind).toBe('universe')
    expect(s.chartable).toBe(false)
    expect(s.candidateCount).toBe(40)
  })
})

describe('detectRunShape — v2 summary fields (authoritative)', () => {
  it('run.run_kind wins over the run_id pattern', () => {
    // run_id looks normal, but run_kind says portfolio_sweep
    const s = detectRunShape({ run_id: 'ema:BITFINEX:tBTCUSD:1h:0:100', symbols: ['tBTCUSD'], run_kind: 'portfolio_sweep' })
    expect(s.kind).toBe('portfolio_sweep')
    expect(s.label).toBe('Portfolio Sweep')
    expect(s.klass).toBe('sweep')          // CSS bucket
    expect(s.multiCandidate).toBe(true)
    expect(s.chartable).toBe(true)
  })
  it('walk_forward kind is recognised + chartable', () => {
    const s = detectRunShape({ run_id: 'wf:x', symbols: ['tBTCUSD'], run_kind: 'walk_forward' })
    expect(s.kind).toBe('walk_forward')
    expect(s.multiCandidate).toBe(true)
    expect(s.chartable).toBe(true)
    expect(s.klass).toBe('walk')
  })
  it('candidate count from run.optimization.candidate_count', () => {
    const s = detectRunShape({ run_id: 'sweep:x:0:100:7', symbols: ['tBTCUSD'], run_kind: 'sweep', optimization: { candidate_count: 24, full_grid_count: 100 } })
    expect(s.candidateCount).toBe(24)      // optimization wins over the run_id :7
  })
  it('candidate count falls back to artifact.runs length', () => {
    const s = detectRunShape({ run_id: 'sweep:x', symbols: ['tBTCUSD'], run_kind: 'sweep' }, { runs: [{}, {}, {}] })
    expect(s.candidateCount).toBe(3)
  })
})

describe('detectRunShape — artifact-first (authoritative)', () => {
  it('plan.mode=sweep + parameter_grid_count drives sweep + count', () => {
    const s = detectRunShape({ run_id: 'x:1h:0:1', symbols: ['tBTCUSD'] }, { plan: { mode: 'sweep', parameter_grid_count: 24 } })
    expect(s.kind).toBe('sweep')
    expect(s.candidateCount).toBe(24)   // artifact overrides the run_id
  })
  it('optimization metadata → optimize', () => {
    const s = detectRunShape({ run_id: 'x', symbols: ['tBTCUSD'] }, { optimization: { sampler: 'adaptive_tpe' }, plan: {} })
    expect(s.kind).toBe('optimize')
  })
  it('universe artifact marker → universe (not chartable)', () => {
    const s = detectRunShape({ run_id: 'x', symbols: ['a', 'b'] }, { universe: { candidates: [] }, plan: {} })
    expect(s.kind).toBe('universe')
    expect(s.chartable).toBe(false)
  })
  it('optimization objective naming universe → universe', () => {
    const s = detectRunShape({ run_id: 'x', symbols: ['a'] }, { optimization: { objective: 'robust_cross_symbol_score_v1', kind: 'universe' }, plan: {} })
    expect(s.kind).toBe('universe')
  })
})

describe('labels', () => {
  it('every shape has a label', () => {
    for (const k of RUN_SHAPES) expect(typeof runShapeLabel(k)).toBe('string')
    expect(runShapeLabel('universe')).toBe('Universe')
    expect(runShapeLabel('portfolio_sweep')).toBe('Portfolio Sweep')
    expect(runShapeLabel('walk_forward')).toBe('Walk-Forward')
    expect(runShapeLabel('some_new_kind')).toBe('Some New Kind')   // humanized fallback
  })
})
