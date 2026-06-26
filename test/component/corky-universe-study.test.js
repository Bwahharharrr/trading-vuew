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

// The REAL universe artifact shape (confirmed live): candidates under
// artifact.runs[], cross-symbol robustness aggregates under `aggregate`, and
// per-symbol standard metrics under symbols[].metrics.
const ARTIFACT = {
  optimization: { sampler: 'low_discrepancy', objective: 'robust_cross_symbol_score_v1', candidate_count: 60 },
  runs: [
    { run_index: 52, rank: 1, parameters: { values: { fast_period: 20, slow_period: 150 } },
      aggregate: { score: '1414.6', median_pf: '1.40', median_recovery: '0.866', median_sharpe: '0.505', median_sortino: '1.75', median_return: '2.256', median_strategy_vs_buy_hold_return_pct: '1.847', profitable: 14, beat_buy_hold: 13, total_trades: 1412 },
      symbols: [{ symbol: 'tAAVE:USD', metrics: { strategy_return_pct: '0.1617', total_net_profit: '1617.08', profit_factor: '1.045', recovery_factor: '1.9', sharpe_ratio: '0.3', sortino_ratio: '0.45', strategy_vs_buy_hold_return_pct: '0.99', expected_payoff: '17.9', positive_trade_pct: '0.37', max_equity_drawdown: '1694.6', total_trades: 90 } }] },
    { run_index: 7, rank: 2, parameters: { values: { fast_period: 25, slow_period: 200 } },
      aggregate: { score: '1200.1', median_pf: '1.10', median_recovery: '0.5', median_sharpe: '0.31', median_sortino: '1.1', median_return: '-0.05', profitable: 9, beat_buy_hold: 6, total_trades: 980 },
      symbols: { tETHBTC: { metrics: { strategy_return_pct: '-0.1', profit_factor: '0.8' } } } },   // MAP form
  ],
}

const mountStudy = (props = {}) => mount(CorkyUniverseStudy, { props: { run: { run_id: 'optimize-universe:x' }, artifact: ARTIFACT, chartable: false, ...props } })

describe('CorkyUniverseStudy', () => {
  test('shows the metric-study-only note + optimization metadata', () => {
    const w = mountStudy()
    expect(w.find('.us-note').text()).toContain('Metric study only')
    const meta = w.find('.us-meta').text()
    expect(meta).toContain('low_discrepancy')
    expect(meta).toContain('robust_cross_symbol_score_v1')
  })

  test('renders universe robustness aggregates (score, med PF/recovery/Sharpe/Sortino, counts)', () => {
    const w = mountStudy()
    const headers = w.findAll('.us-table thead th').map((h) => h.text())
    expect(headers).toContain('Med Sharpe')      // the requested Sharpe column
    expect(headers).toContain('Med Sortino')
    expect(headers).toContain('Score')
    const rows = w.findAll('.us-table tbody .bt-row')
    expect(rows).toHaveLength(2)
    const r0 = rows[0].text()
    expect(r0).toContain('1414.60')    // score (aggregate, ratio)
    expect(r0).toContain('1.40')       // median_pf
    expect(r0).toContain('0.87')       // median_recovery (2dp)
    expect(r0).toContain('0.51')       // median_sharpe
    expect(r0).toContain('1.75')       // median_sortino
    expect(r0).toContain('14')         // profitable count
    expect(r0).toContain('13')         // beat_buy_hold count
    expect(r0).toContain('fast_period=20')   // parameters.values
  })

  test('expanding a candidate shows the per-symbol breakdown (array + map forms) with the full metric set', async () => {
    const w = mountStudy()
    const rows = w.findAll('.us-table tbody .bt-row')
    await rows[0].trigger('click')
    // per-symbol columns now include Recovery + Sortino + vs B&H + Win % etc.
    const hdrs = w.findAll('.us-subtable thead th').map((h) => h.text())
    for (const h of ['Return', 'Net P/L', 'vs B&H', 'PF', 'Recovery', 'Sharpe', 'Sortino', 'Max DD', 'Win %', 'Trades']) {
      expect(hdrs).toContain(h)
    }
    const sub = w.find('.us-subtable').text()
    expect(sub).toContain('tAAVE:USD')
    expect(sub).toContain('16.17%')    // strategy_return_pct
    expect(sub).toContain('1,617.08')  // net profit
    expect(sub).toContain('1.90')      // recovery_factor
    expect(sub).toContain('0.45')      // sortino_ratio
    expect(sub).toContain('99.00%')    // strategy_vs_buy_hold_return_pct (0.99 → %)
    expect(sub).toContain('37.00%')    // positive_trade_pct (win %)
    await rows[1].trigger('click')     // map-form symbols
    expect(w.find('.us-subtable').text()).toContain('tETHBTC')
  })

  test('feature-detects an alternate candidate container (rankings)', () => {
    const alt = { rankings: [{ run_index: 0, parameters: { values: { p: 1 } }, aggregate: { score: '0.5', median_pf: '1.1' } }] }
    const w = mountStudy({ artifact: alt })
    const r = w.find('.us-table tbody .bt-row')
    expect(r.exists()).toBe(true)
    expect(r.text()).toContain('0.50')   // score (aggregate) under the rankings container
    expect(r.text()).toContain('p=1')    // params.values
  })

  test('raw JSON fallback is always available', async () => {
    const w = mountStudy({ artifact: { weird_unknown_shape: true } })
    expect(w.find('.us-table').exists()).toBe(false)   // no candidates parsed
    expect(w.text()).toContain('No ranked candidates')
    await w.find('.us-raw-toggle').trigger('click')
    expect(w.find('.us-raw-pre').text()).toContain('weird_unknown_shape')
  })

  test('renders the real sweep artifact.runs shape (parameters.values + report.metrics)', () => {
    const sweep = { runs: [
      { run_index: 0, rank: 1, parameters: { values: { fast_period: 50, slow_period: 260 } }, report: { metrics: { total_net_profit: '27000', profit_factor: '1.55', recovery_factor: '2.1', max_equity_drawdown: '10000', total_trades: 536 } } },
      { run_index: 1, rank: 2, parameters: { values: { fast_period: 25, slow_period: 140 } }, report: { metrics: { total_net_profit: '12000', profit_factor: '1.2' } } },
    ] }
    const w = mount(CorkyUniverseStudy, { props: { run: { run_id: 'sweep:x' }, artifact: sweep, chartable: true } })
    const rows = w.findAll('.us-table tbody .bt-row')
    expect(rows).toHaveLength(2)
    const r0 = rows[0].text()
    expect(r0).toContain('27,000')          // total_net_profit (money) from report.metrics
    expect(r0).toContain('1.55')            // profit factor
    expect(r0).toContain('536')             // total_trades
    expect(r0).toContain('fast_period=50')  // parameters.values
  })

  test('chartable: clicking a candidate emits select-candidate(run_index); active row highlighted', async () => {
    const sweep = { runs: [{ run_index: 0, parameters: { values: {} } }, { run_index: 1, parameters: { values: {} } }] }
    const w = mount(CorkyUniverseStudy, { props: { run: { run_id: 'x' }, artifact: sweep, chartable: true, selectedRunIndex: 1 } })
    const rows = w.findAll('.us-table tbody .bt-row')
    expect(rows[1].classes()).toContain('active')   // selectedRunIndex=1 highlighted
    await rows[0].trigger('click')
    expect(w.emitted('select-candidate')[0][0]).toBe(0)
  })

  test('the metric-study note only shows for non-chartable (universe) studies', () => {
    expect(mount(CorkyUniverseStudy, { props: { artifact: ARTIFACT, chartable: false } }).find('.us-note').exists()).toBe(true)
    expect(mount(CorkyUniverseStudy, { props: { artifact: { runs: [] }, chartable: true } }).find('.us-note').exists()).toBe(false)
  })

  test('loading + error states', () => {
    expect(mountStudy({ loading: true, artifact: null }).text()).toContain('Loading study artifact')
    expect(mountStudy({ error: 'boom', artifact: null }).find('.us-err').text()).toContain('boom')
  })
})
