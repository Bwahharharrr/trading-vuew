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
    total_net_profit: '1250.50', gross_profit: '2000', gross_loss: '749.50',
    profit_factor: '1.3282', recovery_factor: '1.5622', max_equity_drawdown: '800.25',
    total_trades: 34, top_1_trade_profit_share: '0.32',
    equity_curve_r2: '0.91', custom_extra_metric: '7',
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
    ],
  },
}

function mountDetail(props = {}) {
  return mount(CorkyBacktestDetail, { props: { run: RUN, detail: DETAIL, ...props } })
}

describe('CorkyBacktestDetail', () => {
  test('renders grouped metric sections', () => {
    const w = mountDetail()
    const titles = w.findAll('.btd-mgroup-title').map((t) => t.text())
    expect(titles).toContain('P&L')
    expect(titles).toContain('Ratios / Risk')
    expect(titles).toContain('Trades')
    expect(titles).toContain('Equity Curve')
    // unknown metric → trailing "Other" group (never dropped)
    expect(titles).toContain('Other')
  })

  test('grid uses descriptor formatting (percent is a fraction; ratio precision)', () => {
    const w = mountDetail()
    const text = w.find('.btd-metrics').text()
    expect(text).toContain('Profit Factor')
    expect(text).toContain('1.3282')   // ratio precision 4
    expect(text).toContain('32.00%')   // 0.32 fraction → 32%
    // short labels, not the long descriptor sentences
    expect(text).toContain('Net Profit')
    expect(text).not.toContain('Final account equity')
  })

  test('each rendered metric has a label + value cell (3 pairs / 6 cols per row)', () => {
    const w = mountDetail()
    const labels = w.findAll('.btd-mlabel').length
    const values = w.findAll('.btd-mval').length
    expect(labels).toBeGreaterThan(0)
    expect(labels).toBe(values)   // one value per label
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
