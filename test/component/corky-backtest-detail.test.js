// @vitest-environment jsdom
//
// CorkyBacktestDetail — a single run's details rendered in its own dock tab:
// the grouped metrics grid (3 label + 3 value columns per row), progress,
// trades, and period returns. Presentational; emits plot-run/select-trade/close.
import { test, expect, describe } from 'vitest'
import { mount } from '@vue/test-utils'
import CorkyBacktestDetail from '../../src/components/feed/CorkyBacktestDetail.vue'

const RUN = {
  run_id: 'ema:BITFINEX:tBTCUSD:1h:0:7200000', strategy: 'ema_cross_all_in_v1',
  venue: 'BITFINEX', symbols: ['tBTCUSD'], trade_timeframe: '1h', status: 'completed',
  started_at_ms: 3600000, completed_at_ms: 7200000,
  metrics: {
    total_net_profit: '1250.50', strategy_return_pct: '0.125', gross_profit: '2000', gross_loss: '749.50',
    profit_factor: '1.3282', recovery_factor: '1.5622', max_equity_drawdown: '800.25',
    sharpe_ratio: '1.8', sortino_ratio: '2.4',
    strategy_vs_buy_hold_return_pct: '0.04', strategy_beat_buy_hold: true, buy_hold_quantity: '0.25000000',
    total_trades: 34, positive_trade_pct: '0.58', top_1_trade_profit_share: '0.32', top_5_trade_profit_share: '0.61',
    positive_period_pct: '0.55', period_return_consistency: '0.50', equity_curve_r2: '0.91',
    custom_extra_metric: '7',
  },
}
const DETAIL = {
  progress: [{ kind: 'completed', completed_steps: 1, total_steps: 1, message: 'done' }],
  plottedRunId: null,
  report: {
    trades: [{ symbol: 'tBTCUSD', timestamp_ms: 3600000, side: 'Buy', quantity: '0.25', price: '40000' }],
    period_returns: [{ period: 'all', starting_equity: '10000', ending_equity: '10125.50', return_amount: '125.50', return_pct: '0.01255' }],
    metric_descriptors: [
      { name: 'total_net_profit', unit: 'currency', precision: 2, description: 'Net' },
      { name: 'profit_factor', unit: 'ratio', precision: 4, description: 'PF' },
      { name: 'top_1_trade_profit_share', unit: 'percent', precision: 2, description: 'Top-1' },
      { name: 'strategy_vs_buy_hold_return_pct', unit: 'percent', precision: 2, description: 'vs B&H' },
      { name: 'strategy_beat_buy_hold', unit: 'boolean', description: 'Beat?' },
      { name: 'buy_hold_quantity', unit: 'quantity', precision: 8, description: 'B&H qty' },
      { name: 'sharpe_ratio', unit: 'ratio', precision: 2, description: 'Sharpe' },
    ],
  },
}

function mountDetail(props = {}) {
  return mount(CorkyBacktestDetail, { props: { run: RUN, detail: DETAIL, ...props } })
}

describe('CorkyBacktestDetail', () => {
  test('renders grouped metric sections (per the gateway display groups)', () => {
    const w = mountDetail()
    const titles = w.findAll('.btd-msection').map((t) => t.text())
    expect(titles).toContain('Performance')
    expect(titles).toContain('Risk / Drawdown')
    expect(titles).toContain('Buy & Hold')
    expect(titles).toContain('Profit Distribution')
    expect(titles).toContain('Period Consistency')
    // unknown metric → trailing "Other" group (never dropped)
    expect(titles).toContain('Other')
  })

  test('grid uses descriptor formatting (percent fraction, ratio precision, boolean, quantity)', () => {
    const w = mountDetail()
    const text = w.find('.btd-mtable').text()
    expect(text).toContain('Profit Factor')
    expect(text).toContain('1.3282')      // ratio precision 4
    expect(text).toContain('32.00%')      // 0.32 fraction → 32%
    expect(text).toContain('4.00%')       // strategy_vs_buy_hold_return_pct 0.04 → 4%
    expect(text).toContain('✓ Yes')       // strategy_beat_buy_hold boolean true
    expect(text).toContain('Sharpe')
    expect(text).toContain('1.80')        // sharpe ratio precision 2
    expect(text).toContain('0.25')        // buy_hold_quantity
    // short labels, not the long descriptor sentences
    expect(text).toContain('Net Profit')
  })

  test('renders a candidate (run_index) selector for sweep studies + emits select-candidate', async () => {
    const w = mountDetail({ detail: { ...DETAIL, shape: { kind: 'sweep', label: 'Sweep', multiCandidate: true, chartable: true }, candidateCount: 5, runIndex: null } })
    expect(w.find('.btd-candidate').exists()).toBe(true)
    const opts = w.find('.btd-cselect').findAll('option').map((o) => o.text())
    expect(opts[0]).toContain('Top-ranked')
    expect(opts).toContain('#3')
    await w.find('.btd-cselect').setValue('3')
    expect(w.emitted('select-candidate')[0][0]).toBe(3)
    await w.find('.btd-cselect').setValue('')
    expect(w.emitted('select-candidate')[1][0]).toBe(null)   // back to default
  })

  test('no candidate selector for a normal single-candidate run', () => {
    const w = mountDetail()   // DETAIL has no shape/candidateCount
    expect(w.find('.btd-candidate').exists()).toBe(false)
  })

  test('beat-buy-hold boolean cell is coloured green when true', () => {
    const w = mountDetail()
    const beatCell = w.findAll('.btd-mval').find((c) => c.text() === '✓ Yes')
    expect(beatCell).toBeTruthy()
    expect(beatCell.classes()).toContain('pos')
  })

  test('each rendered metric has a label + value cell, in one aligned table', () => {
    const w = mountDetail()
    const labels = w.findAll('.btd-mlabel').length
    const values = w.findAll('.btd-mval').length
    expect(labels).toBeGreaterThan(0)
    expect(labels).toBe(values)            // one value per label
    expect(w.findAll('.btd-mtable')).toHaveLength(1)   // single table → columns align across sections
    expect(w.findAll('.btd-mrow.alt').length).toBeGreaterThan(0)   // zebra rows present
  })

  test('plot button + trade click + close emit; period returns render', async () => {
    const w = mountDetail()
    await w.find('.bt-plot').trigger('click')
    expect(w.emitted('plot-run')[0][0].run_id).toBe(RUN.run_id)
    const tradeRow = w.findAll('.bt-trades .bt-row')
    expect(tradeRow).toHaveLength(1)
    await tradeRow[0].trigger('click')
    expect(w.emitted('select-trade')[0][0].price).toBe('40000')
    await w.find('.btd-close').trigger('click')
    expect(w.emitted('close')).toBeTruthy()
    expect(w.find('.bt-periods').text()).toContain('0.01255')
    expect(w.text()).toContain('done')   // progress message
  })

  test('plot button reflects busy + plotted state', () => {
    const busy = mountDetail({ detail: { ...DETAIL, plotting: true } })
    expect(busy.find('.bt-plot').text()).toContain('Loading onto chart')
    const done = mountDetail({ detail: { ...DETAIL, plottedRunId: RUN.run_id } })
    expect(done.find('.bt-plot').text()).toContain('Re-plot')
  })
})
