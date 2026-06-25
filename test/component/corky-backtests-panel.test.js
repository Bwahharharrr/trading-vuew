// @vitest-environment jsdom
//
// CorkyBacktestsPanel — presentational Strategies/Backtests view. Renders the
// strategy catalog + filters and the run LIST (with Profit/Recovery factor
// columns), and emits intents. A run's full details open in their own dock tab
// (CorkyBacktestDetail), not inline here. Decimal strings shown verbatim.
import { test, expect, describe } from 'vitest'
import { mount } from '@vue/test-utils'
import CorkyBacktestsPanel from '../../src/components/feed/CorkyBacktestsPanel.vue'

const strategies = [
  { name: 'ema_cross_all_in_v1', display_name: 'EMA Cross', default_trade_timeframe: '1h', default_context_timeframes: [], default_indicators: [{ kind: 'ema', timeframe: '1h', params: { period: '50' } }], parameters: [{ name: 'fast_period', type: 'integer', default_value: 50, description: 'Fast EMA' }] },
]
const runs = [
  { run_id: 'ema:BITFINEX:tBTCUSD:1h:0:1782320400000', strategy: 'ema_cross_all_in_v1', venue: 'BITFINEX', symbols: ['tBTCUSD'], trade_timeframe: '1h', status: 'completed', started_at_ms: 0, completed_at_ms: 1782320400000, metrics: { total_net_profit: '1250.50', total_trades: 34, profit_factor: '1.3282', recovery_factor: '1.5622' } },
]

function mountPanel(props = {}) {
  return mount(CorkyBacktestsPanel, {
    props: { strategies, runs, filters: { strategy: '', symbol: '', status: '' }, selectedRun: null, ...props },
  })
}

describe('CorkyBacktestsPanel', () => {
  test('renders the strategy options + run rows', () => {
    const w = mountPanel()
    expect(w.findAll('select')[0].findAll('option').map((o) => o.text())).toContain('EMA Cross')
    const rows = w.findAll('.bt-runs .bt-row')
    expect(rows).toHaveLength(1)
    expect(rows[0].text()).toContain('tBTCUSD')
    expect(rows[0].text()).toContain('completed')
  })

  test('Load runs + refresh + filter changes emit intents', async () => {
    const w = mountPanel()
    await w.find('.bt-btn').trigger('click')
    expect(w.emitted('list-runs')).toBeTruthy()
    await w.find('.bt-icon').trigger('click')
    expect(w.emitted('refresh-strategies')).toBeTruthy()
    await w.findAll('select')[1].setValue('completed')   // status filter (strategy=0, status=1)
    expect(w.emitted('update:filter').pop()[0]).toEqual({ status: 'completed' })
  })

  test('selecting a strategy emits update:filter + inspect-strategy', async () => {
    const w = mountPanel()
    await w.findAll('select')[0].setValue('ema_cross_all_in_v1')
    expect(w.emitted('update:filter').some((e) => e[0].strategy === 'ema_cross_all_in_v1')).toBe(true)
    expect(w.emitted('inspect-strategy')[0]).toEqual(['ema_cross_all_in_v1'])
  })

  test('shows selected-strategy params + indicators', () => {
    const w = mountPanel({ filters: { strategy: 'ema_cross_all_in_v1', symbol: '', status: '' } })
    expect(w.find('.bt-strategy').text()).toContain('fast_period')
    expect(w.find('.bt-strategy').text()).toContain('ema(50)@1h')
  })

  test('clicking a run emits select-run', async () => {
    const w = mountPanel()
    await w.find('.bt-runs .bt-row').trigger('click')
    expect(w.emitted('select-run')[0][0].run_id).toContain('ema')
  })

  test('selecting a strategy also emits list-runs (one action)', async () => {
    const w = mountPanel()
    await w.findAll('select')[0].setValue('ema_cross_all_in_v1')
    expect(w.emitted('list-runs')).toBeTruthy()
  })

  test('columns are sortable: clicking a header reorders the rows', async () => {
    const twoRuns = [
      { run_id: 'a', strategy: 'b_strat', symbols: ['tBTCUSD'], trade_timeframe: '1h', status: 'completed', completed_at_ms: 200 },
      { run_id: 'b', strategy: 'a_strat', symbols: ['tETHUSD'], trade_timeframe: '1h', status: 'failed', completed_at_ms: 100 },
    ]
    const w = mountPanel({ runs: twoRuns })
    // default sort = completed desc → run 'a' (200) first
    expect(w.findAll('.bt-runs .bt-row')[0].text()).toContain('b_strat')
    // click "Strategy" header → asc by strategy → 'a_strat' first
    const stratHeader = w.findAll('.bt-sortable th')[0]
    await stratHeader.trigger('click')
    expect(w.findAll('.bt-runs .bt-row')[0].text()).toContain('a_strat')
    // click again → desc → 'b_strat' first
    await stratHeader.trigger('click')
    expect(w.findAll('.bt-runs .bt-row')[0].text()).toContain('b_strat')
  })

  test('shows Profit/Recovery factor columns from run.metrics', () => {
    const w = mountPanel()
    const headers = w.findAll('.bt-sortable th').map((h) => h.text().replace(/[▲▼]/g, '').trim())
    expect(headers).toContain('PF')
    expect(headers).toContain('RF')
    const row = w.find('.bt-runs .bt-row')
    expect(row.text()).toContain('1.33')   // profit_factor formatted to 2dp
    expect(row.text()).toContain('1.56')   // recovery_factor formatted to 2dp
  })

  test('PF/RF show — when the metric is absent (missing sorts last)', async () => {
    const twoRuns = [
      { run_id: 'a', strategy: 'a', symbols: ['tBTCUSD'], trade_timeframe: '1h', status: 'completed', completed_at_ms: 200, metrics: { profit_factor: '2.50' } },
      { run_id: 'b', strategy: 'b', symbols: ['tETHUSD'], trade_timeframe: '1h', status: 'completed', completed_at_ms: 100, metrics: {} },   // no PF
    ]
    const w = mountPanel({ runs: twoRuns })
    const pfHeader = w.findAll('.bt-sortable th').find((h) => h.text().includes('PF'))
    await pfHeader.trigger('click')   // asc → the run WITH a value first, missing last
    const rows = w.findAll('.bt-runs .bt-row')
    expect(rows[0].text()).toContain('2.50')
    expect(rows[1].text()).toContain('—')   // missing metric renders an em dash
  })

  test('clicking a run still emits select-run (details open in their own tab)', async () => {
    const w = mountPanel()
    await w.find('.bt-runs .bt-row').trigger('click')
    expect(w.emitted('select-run')[0][0].run_id).toBe(runs[0].run_id)
    // No inline detail pane is rendered here anymore.
    expect(w.find('.bt-detail').exists()).toBe(false)
  })
})
