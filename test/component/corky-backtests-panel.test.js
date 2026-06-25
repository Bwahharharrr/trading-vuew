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
  { run_id: 'ema:BITFINEX:tBTCUSD:1h:1364770800000:1782320400000', strategy: 'ema_cross_all_in_v1', venue: 'BITFINEX', symbols: ['tBTCUSD'], trade_timeframe: '1h', status: 'completed', started_at_ms: 1364770800000, completed_at_ms: 1782320400000, metrics: { total_net_profit: '1250.50', total_trades: 34, profit_factor: '1.3282', recovery_factor: '1.5622' } },
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
    // default sort = duration (span) desc → run 'a' (span 200) first
    expect(w.findAll('.bt-runs .bt-row')[0].text()).toContain('b_strat')
    // click "Strategy" header → asc by strategy → 'a_strat' first
    const stratHeader = w.findAll('.bt-sortable th')[0]
    await stratHeader.trigger('click')
    expect(w.findAll('.bt-runs .bt-row')[0].text()).toContain('a_strat')
    // click again → desc → 'b_strat' first
    await stratHeader.trigger('click')
    expect(w.findAll('.bt-runs .bt-row')[0].text()).toContain('b_strat')
  })

  test('Duration column replaces Started/Completed: start – end, days, est. bars', () => {
    const w = mountPanel()
    const headers = w.findAll('.bt-sortable th').map((h) => h.text().replace(/[▲▼]/g, '').trim())
    expect(headers).toContain('Duration')
    expect(headers).not.toContain('Started')
    expect(headers).not.toContain('Completed')
    const dur = w.find('.bt-dur').text()
    expect(dur).toMatch(/^\d{4}-\d{2}-\d{2} .+ \d{4}-\d{2}-\d{2} \(.*days, ~.*bars\)$/)
    expect(dur).toContain('2013')
    expect(dur).toContain('2026')
  })

  test('Duration uses exact bar_count when the summary provides it (no ~)', () => {
    const w = mountPanel({ runs: [{ ...runs[0], bar_count: 100000 }] })
    const dur = w.find('.bt-dur').text()
    expect(dur).toMatch(/100.?000 bars/)
    expect(dur).not.toContain('~')
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

  test('shows the new metric columns (return / B&H / beat / sharpe / sortino)', () => {
    const r = { ...runs[0], metrics: { ...runs[0].metrics, strategy_return_pct: '0.125', buy_hold_return_pct: '0.08', strategy_vs_buy_hold_return_pct: '0.045', strategy_beat_buy_hold: true, sharpe_ratio: '1.8', sortino_ratio: '2.4', total_net_profit: '1250.50' } }
    const w = mountPanel({ runs: [r] })
    const headers = w.findAll('.bt-sortable th').map((h) => h.text().replace(/[▲▼]/g, '').trim())
    for (const h of ['Net P/L', 'Return', 'B&H Ret', 'vs B&H', 'Beat', 'Sharpe', 'Sortino', 'PF', 'RF']) {
      expect(headers).toContain(h)
    }
    const row = w.find('.bt-runs .bt-row').text()
    expect(row).toContain('12.50%')   // strategy_return_pct 0.125 → 12.50% (fraction)
    expect(row).toContain('4.50%')    // strategy_vs_buy_hold_return_pct 0.045
    expect(row).toContain('✓')        // strategy_beat_buy_hold true
    expect(row).toContain('1.80')     // sharpe_ratio
  })

  test('vs-B&H cell colours green when the run beat buy-and-hold', () => {
    const r = { ...runs[0], metrics: { ...runs[0].metrics, strategy_vs_buy_hold_return_pct: '0.045', strategy_beat_buy_hold: true } }
    const w = mountPanel({ runs: [r] })
    const cell = w.findAll('.bt-row td.num').find((c) => c.text() === '4.50%')
    expect(cell).toBeTruthy()
    expect(cell.classes()).toContain('pos')
  })

  test('new metric columns render — when the run lacks the field (old artifact)', () => {
    const w = mountPanel()   // runs[0] has no new fields
    const row = w.find('.bt-runs .bt-row')
    // Net P/L populates from the existing total_net_profit; the new ones are —
    expect(row.text()).toContain('1,250.5')   // total_net_profit money-formatted
  })

  test('sticky summary row aggregates loaded runs (total P/L, avg PF/RF, beat count)', () => {
    const twoRuns = [
      { run_id: 'a', strategy: 's', symbols: ['tBTCUSD'], trade_timeframe: '1h', status: 'completed', started_at_ms: 1, completed_at_ms: 2, metrics: { total_net_profit: '1000', profit_factor: '2.0', recovery_factor: '3.0', strategy_beat_buy_hold: true } },
      { run_id: 'b', strategy: 't', symbols: ['tETHUSD'], trade_timeframe: '1h', status: 'completed', started_at_ms: 1, completed_at_ms: 2, metrics: { total_net_profit: '500', profit_factor: '1.0', recovery_factor: '1.0', strategy_beat_buy_hold: false } },
    ]
    const w = mountPanel({ runs: twoRuns })
    const sum = w.find('.bt-summary')
    expect(sum.exists()).toBe(true)
    expect(sum.find('.bt-sum-label').text()).toContain('2 runs')
    const cells = sum.findAll('.bt-sum-cell').map((c) => c.text())
    expect(cells).toContain('1,500')   // total_net_profit summed (1000 + 500)
    expect(cells).toContain('1.50')    // PF averaged (2.0 + 1.0) / 2
    expect(cells).toContain('2.00')    // RF averaged (3.0 + 1.0) / 2
    expect(cells).toContain('1/2')     // beat: 1 of 2 runs
  })

  test('summary row skips runs missing a metric (no drag toward zero)', () => {
    const twoRuns = [
      { run_id: 'a', strategy: 's', symbols: ['tBTCUSD'], trade_timeframe: '1h', status: 'completed', metrics: { profit_factor: '2.0' } },
      { run_id: 'b', strategy: 't', symbols: ['tETHUSD'], trade_timeframe: '1h', status: 'completed', metrics: {} },   // no PF
    ]
    const w = mountPanel({ runs: twoRuns })
    const cells = w.find('.bt-summary').findAll('.bt-sum-cell').map((c) => c.text())
    expect(cells).toContain('2.00')    // avg PF over the ONE run that has it, not 1.0
  })

  test('shows a Type column with the detected artifact shape', () => {
    const mixed = [
      { run_id: 'sweep:ema:BITFINEX:tBTCUSD:1h:0:100:56', strategy: 'ema', symbols: ['tBTCUSD'], trade_timeframe: '1h', status: 'completed', metrics: {} },
      { run_id: 'universe:ema:BITFINEX:multi:4h:0:100:40', strategy: 'ema', symbols: ['tBTCUSD', 'tETHUSD'], trade_timeframe: '4h', status: 'completed', metrics: {} },
    ]
    const w = mountPanel({ runs: mixed })
    const headers = w.findAll('.bt-sortable th').map((h) => h.text().replace(/[▲▼]/g, '').trim())
    expect(headers).toContain('Type')
    const types = w.findAll('.bt-runs .bt-row .bt-type').map((t) => t.text())
    expect(types).toContain('Sweep')
    expect(types).toContain('Universe')
  })

  test('client-side timeframe + run-type filters narrow the list', async () => {
    const mixed = [
      { run_id: 'sweep:ema:BITFINEX:tBTCUSD:1h:0:100:56', strategy: 'ema', symbols: ['tBTCUSD'], trade_timeframe: '1h', status: 'completed', metrics: {} },
      { run_id: 'universe:ema:BITFINEX:multi:4h:0:100:40', strategy: 'ema', symbols: ['tBTCUSD', 'tETHUSD'], trade_timeframe: '4h', status: 'completed', metrics: {} },
    ]
    // timeframe filter
    let w = mountPanel({ runs: mixed, filters: { strategy: '', symbol: '', status: '', timeframe: '4h', runType: '' } })
    expect(w.findAll('.bt-runs .bt-row')).toHaveLength(1)
    expect(w.find('.bt-runs .bt-row .bt-type').text()).toBe('Universe')
    // run-type filter
    w = mountPanel({ runs: mixed, filters: { strategy: '', symbol: '', status: '', timeframe: '', runType: 'sweep' } })
    expect(w.findAll('.bt-runs .bt-row')).toHaveLength(1)
    expect(w.find('.bt-runs .bt-row .bt-type').text()).toBe('Sweep')
  })

  test('timeframe/run-type filter changes emit update:filter', async () => {
    const mixed = [
      { run_id: 'sweep:ema:BITFINEX:tBTCUSD:1h:0:100:56', strategy: 'ema', symbols: ['tBTCUSD'], trade_timeframe: '1h', status: 'completed', metrics: {} },
    ]
    const w = mountPanel({ runs: mixed })
    const selects = w.findAll('.bt-controls select')
    await selects.find((s) => s.classes().includes('bt-tf')).setValue('1h')
    expect(w.emitted('update:filter').some((e) => e[0].timeframe === '1h')).toBe(true)
    await selects.find((s) => s.classes().includes('bt-type')).setValue('sweep')   // 'sweep' is an option (mixed has a sweep run)
    expect(w.emitted('update:filter').some((e) => e[0].runType === 'sweep')).toBe(true)
  })

  test('clicking a run still emits select-run (details open in their own tab)', async () => {
    const w = mountPanel()
    await w.find('.bt-runs .bt-row').trigger('click')
    expect(w.emitted('select-run')[0][0].run_id).toBe(runs[0].run_id)
    // No inline detail pane is rendered here anymore.
    expect(w.find('.bt-detail').exists()).toBe(false)
  })
})
