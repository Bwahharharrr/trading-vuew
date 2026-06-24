// Barrier Symmetric target enrichment: spec builder, query wiring, the
// causal-only guard, and match projection (plan/outcome/analytics + pending).
import { describe, it, expect } from 'vitest'
import {
  barrierTargetSpec, buildSearchQuery, projectTargetEvaluation, projectMatchRow,
} from '../../src/helpers/feed/search-query.js'

const DESCRIPTORS = [
  { display_label: 'MACD(12,26,9)', kind: 'MACD', timeframe: '1h', source: 'close', params: { fast: '12', slow: '26', signal: '9' } },
]
const baseQuery = {
  search_id: 's1', venue: 'bitfinex', symbols: ['tBTCUSD'],
  range: { type: 'latest', limit: 120 }, timeframes: ['1h'], descriptors: DESCRIPTORS,
  condition: { type: 'compare', field: { indicator: 'MACD(12,26,9)', field: 'histogram', bar_offset: 0 }, op: 'gt', value: 0 },
}

describe('barrierTargetSpec', () => {
  it('tags type + applies version default; coerces numeric fields', () => {
    const t = barrierTargetSpec({ timeframe: '1h', window_fwd: '12', window_atr: 14, k_take: 0.9, k_stop: '0.9', guard_use_close: true, post_hit_policy: 'stop', guard_min_consecutive_closes: 1 })
    expect(t.type).toBe('barrier_symmetric')
    expect(t.spec).toEqual({
      version: 1, timeframe: '1h', window_fwd: 12, window_atr: 14, k_take: 0.9, k_stop: 0.9,
      guard_min_consecutive_closes: 1, post_hit_policy: 'stop', guard_use_close: true,
    })
  })
  it('omits blank/non-finite fields (gateway applies its own defaults)', () => {
    const t = barrierTargetSpec({ window_fwd: '', k_take: 'abc' })
    expect('window_fwd' in t.spec).toBe(false)
    expect('k_take' in t.spec).toBe(false)
    expect(t.spec.version).toBe(1)
  })
})

describe('buildSearchQuery + target_specs', () => {
  it('includes target_specs on the query when provided', () => {
    const { query } = buildSearchQuery({ ...baseQuery, target_specs: [barrierTargetSpec({ timeframe: '1h', window_fwd: 12 })] })
    expect(query.target_specs).toHaveLength(1)
    expect(query.target_specs[0].type).toBe('barrier_symmetric')
    expect(query.target_specs[0].spec.window_fwd).toBe(12)
  })
  it('omits target_specs entirely when none given', () => {
    const { query } = buildSearchQuery(baseQuery)
    expect('target_specs' in query).toBe(false)
  })
  it('REJECTS a condition that references a Barrier Symmetric outcome field', () => {
    expect(() => buildSearchQuery({
      ...baseQuery,
      condition: { type: 'compare', field: { indicator: 'BARRIER_SYMMETRIC', field: 'bull_hit' }, op: 'eq', value: 1 },
    })).toThrow(/outcome field|causal/i)
  })
  it('REJECTS an outcome field nested inside an all() tree', () => {
    expect(() => buildSearchQuery({
      ...baseQuery,
      condition: { type: 'all', conditions: [
        { type: 'compare', field: { indicator: 'MACD(12,26,9)', field: 'histogram' }, op: 'gt', value: 0 },
        { type: 'compare', field: { indicator: 'X', field: 'evaluable_outcome' }, op: 'eq', value: 1 },
      ] },
    })).toThrow(/evaluable_outcome/)
  })
})

const matured = {
  type: 'barrier_symmetric',
  evaluation: {
    target_spec_hash: 'h1',
    plan: { kind: 'BARRIER_SYMMETRIC', target_spec_hash: 'h1', entry_price: '70125', take_up_price: '71783.72', stop_up_price: '68466.28', take_dn_price: '68466.28', stop_dn_price: '71783.72', expiry_timestamp_ms: 1720137600000, reward_risk_ratio: 1, evaluable_outcome: true },
    outcome: { target_spec_hash: 'h1', matured_at_ms: 1720137600000, evaluable_outcome: true, bull_hit: true, bear_hit: false, strength_up: 1.18 },
    analytics_summary: { target_spec_hash: 'h1', sample_count: 1840, bull_hit_count: 1036, bear_hit_count: 731, bull_hit_rate: 0.563, bull_full_kelly: 0.08 },
  },
}
const pending = {
  type: 'barrier_symmetric',
  evaluation: {
    target_spec_hash: 'h1',
    plan: { kind: 'BARRIER_SYMMETRIC', target_spec_hash: 'h1', entry_price: '63160', reward_risk_ratio: 1, expiry_timestamp_ms: 1781931600000, evaluable_outcome: false },
    analytics_summary: { target_spec_hash: 'h1', sample_count: 95, bull_hit_count: 35, bear_hit_count: 32 },
  },
}

describe('projectTargetEvaluation', () => {
  it('matured evaluation → pending:false with plan/outcome/analytics + hash', () => {
    const t = projectTargetEvaluation(matured)
    expect(t.type).toBe('barrier_symmetric')
    expect(t.hash).toBe('h1')
    expect(t.pending).toBe(false)
    expect(t.outcome.bull_hit).toBe(true)
    expect(t.plan.take_up_price).toBe('71783.72') // kept as string
    expect(t.analytics.sample_count).toBe(1840)
  })
  it('plan.evaluable_outcome:false (or outcome absent) → pending:true (NOT a miss)', () => {
    const t = projectTargetEvaluation(pending)
    expect(t.pending).toBe(true)
    expect(t.outcome).toBeNull()
    expect(t.plan.entry_price).toBe('63160')
  })
  it('outcome present but evaluable_outcome false is still pending', () => {
    const t = projectTargetEvaluation({ type: 'barrier_symmetric', evaluation: {
      target_spec_hash: 'h', plan: { evaluable_outcome: false, entry_price: '1' }, outcome: { bull_hit: false, bear_hit: false },
    } })
    expect(t.pending).toBe(true)
  })
})

describe('projectMatchRow with target_evaluations', () => {
  const result = {
    venue: 'bitfinex', symbol: 'tBTCUSD', timeframe: '1h', timestamp_ms: 1718064000000,
    candle: { timestamp_ms: 1718064000000, open: '69500', high: '70420', low: '68210', close: '70125', volume: '153' },
    indicators: {}, observations: [], side: 'bull', crup_context: null,
    chart_window: { timeframe: '1h', start_ms: 1, end_ms: 2, before_bars: 200, after_bars: 600 },
    target_evaluations: [matured],
  }
  it('surfaces targets[] and a convenience barrier (first barrier_symmetric)', () => {
    const row = projectMatchRow(result)
    expect(row.targets).toHaveLength(1)
    expect(row.barrier).toBeTruthy()
    expect(row.barrier.pending).toBe(false)
    expect(row.barrier.outcome.bull_hit).toBe(true)
  })
  it('no target_evaluations → empty targets, null barrier', () => {
    const row = projectMatchRow({ ...result, target_evaluations: undefined })
    expect(row.targets).toEqual([])
    expect(row.barrier).toBeNull()
  })
})
