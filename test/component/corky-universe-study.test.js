// @vitest-environment jsdom
//
// CorkyUniverseStudy — renders a compact universe-optimization artifact: the
// "metric study only" note, optimization metadata, the candidate ranking table
// (feature-detected fields), a per-symbol breakdown on expand, and a raw-JSON
// fallback. The artifact schema is NOT hard-coded — these tests pin the
// feature-detection across two differently-shaped artifacts.
import { test, expect, describe } from 'vitest'
import { mount } from '@vue/test-utils'
import CorkyUniverseStudy from '../../src/components/feed/CorkyUniverseStudy.vue'

const ARTIFACT = {
  optimization: { sampler: 'adaptive_tpe', objective: 'robust_cross_symbol_score_v1' },
  universe: {
    candidates: [
      { run_index: 0, parameters: { fast: 10, slow: 50 }, robust_cross_symbol_score_v1: '0.82', profitable_symbol_count: 7, median_return_pct: '0.34', max_drawdown_pct: '0.18', recovery_factor: '2.1', profit_factor: '1.6',
        per_symbol: [{ symbol: 'tBTCUSD', return_pct: '0.5', profit_factor: '1.8', max_drawdown_pct: '0.12', total_trades: 30 }] },
      { run_index: 1, parameters: { fast: 12, slow: 60 }, robust_cross_symbol_score_v1: '0.71', profitable_symbol_count: 5, median_return_pct: '-0.05', max_drawdown_pct: '0.30', recovery_factor: '0.9', profit_factor: '0.95',
        per_symbol: { tETHUSD: { return_pct: '-0.1', profit_factor: '0.8' } } },   // MAP form, not array
    ],
  },
}

const mountStudy = (props = {}) => mount(CorkyUniverseStudy, { props: { run: { run_id: 'universe:x' }, artifact: ARTIFACT, ...props } })

describe('CorkyUniverseStudy', () => {
  test('shows the metric-study-only note + optimization metadata', () => {
    const w = mountStudy()
    expect(w.find('.us-note').text()).toContain('Metric study only')
    const meta = w.find('.us-meta').text()
    expect(meta).toContain('adaptive_tpe')
    expect(meta).toContain('robust_cross_symbol_score_v1')
  })

  test('renders ranked candidate rows with detected metrics + params', () => {
    const w = mountStudy()
    const rows = w.findAll('.us-table tbody .bt-row')
    expect(rows).toHaveLength(2)
    const r0 = rows[0].text()
    expect(r0).toContain('0.82')      // robustness score
    expect(r0).toContain('7')         // profitable symbols
    expect(r0).toContain('34.00%')    // median_return_pct fraction → %
    expect(r0).toContain('1.60')      // profit factor
    expect(r0).toContain('fast=10')   // params
  })

  test('expanding a candidate shows the per-symbol breakdown (array + map forms)', async () => {
    const w = mountStudy()
    const rows = w.findAll('.us-table tbody .bt-row')
    await rows[0].trigger('click')
    expect(w.find('.us-subtable').text()).toContain('tBTCUSD')
    expect(w.find('.us-subtable').text()).toContain('50.00%')   // per-symbol return
    await rows[1].trigger('click')                              // map-form per_symbol
    expect(w.find('.us-subtable').text()).toContain('tETHUSD')
  })

  test('feature-detects an alternate artifact shape (rankings / score)', () => {
    const alt = { rankings: [{ index: 0, params: { p: 1 }, score: '0.5', return_pct: '0.2', profit_factor: '1.1' }] }
    const w = mountStudy({ artifact: alt })
    const r = w.find('.us-table tbody .bt-row')
    expect(r.exists()).toBe(true)
    expect(r.text()).toContain('0.50')    // score under a different key
    expect(r.text()).toContain('20.00%')  // return
  })

  test('raw JSON fallback is always available', async () => {
    const w = mountStudy({ artifact: { weird_unknown_shape: true } })
    expect(w.find('.us-table').exists()).toBe(false)   // no candidates parsed
    expect(w.text()).toContain('No ranked candidates')
    await w.find('.us-raw-toggle').trigger('click')
    expect(w.find('.us-raw-pre').text()).toContain('weird_unknown_shape')
  })

  test('loading + error states', () => {
    expect(mountStudy({ loading: true, artifact: null }).text()).toContain('Loading study artifact')
    expect(mountStudy({ error: 'boom', artifact: null }).find('.us-err').text()).toContain('boom')
  })
})
