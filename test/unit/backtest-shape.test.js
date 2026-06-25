// detectRunShape — feature-detect a backtest run/artifact shape (normal /
// portfolio / sweep / optimize / universe) from the run_id + summary, refined
// by the raw artifact when available. Drives the list Type badge, filters, the
// run_index candidate selector, and the universe-study view.
import { describe, it, expect } from 'vitest'
import { detectRunShape, runShapeLabel, RUN_SHAPES } from '../../src/helpers/feed/backtest-shape.js'

describe('detectRunShape — fast path (run_id + summary)', () => {
  it('normal single-symbol backtest', () => {
    const s = detectRunShape({ run_id: 'ema_cross_all_in_v1:BITFINEX:tBTCUSD:1h:0:100', symbols: ['tBTCUSD'] })
    expect(s.kind).toBe('normal')
    expect(s.chartable).toBe(true)
    expect(s.multiCandidate).toBe(false)
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
    expect(runShapeLabel('bogus')).toBe('Backtest')   // fallback
  })
})
