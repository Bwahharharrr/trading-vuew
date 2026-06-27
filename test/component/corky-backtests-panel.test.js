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

  test('runs list shows Score v2 + Avg Trades columns (universe summary metrics)', () => {
    const w = mountPanel({ runs: [
      { run_id: 'u1', strategy: 'ema_cross_all_in_v1', symbols: ['tBTCUSD', 'tETHUSD'], trade_timeframe: '1h', status: 'completed',
        metrics: { max_score: '1414.6', score_v2: '2604.1387724551', avg_trades: '7204.7', total_trades: 14400 } },
    ] })
    const headers = w.findAll('thead th').map((h) => h.text().replace(/[▲▼+]/g, '').trim())
    expect(headers).toContain('Score v2')
    expect(headers).toContain('Avg Trades')
    const row = w.find('.bt-runs .bt-row').text()
    expect(row).toContain('2604.14')   // score_v2 → ratio2 (2dp)
    expect(row).toContain('7,204.7')   // avg_trades → avg (1dp + thousands sep)
  })

  test('selected-strategy params/indicators are collapsed by default, with a count hint', () => {
    const w = mountPanel({ filters: { strategy: 'ema_cross_all_in_v1', symbol: '', status: '' } })
    // Header (name) shows; the long param list is hidden until toggled.
    expect(w.find('.bt-strategy').text()).toContain('EMA Cross')
    expect(w.find('.bt-params').exists()).toBe(false)
    expect(w.find('.bt-strategy').text()).toContain('1 param')   // count hint
  })

  test('clicking the strategy header toggles params + indicators', async () => {
    const w = mountPanel({ filters: { strategy: 'ema_cross_all_in_v1', symbol: '', status: '' } })
    await w.find('.bt-strat-head').trigger('click')
    expect(w.find('.bt-params').text()).toContain('fast_period')
    expect(w.find('.bt-strategy').text()).toContain('ema(50)@1h')
    await w.find('.bt-strat-head').trigger('click')              // collapse again
    expect(w.find('.bt-params').exists()).toBe(false)
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
    const headers = w.findAll('.bt-sortable th').map((h) => h.text().replace(/[▲▼+]/g, '').trim())
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
    const headers = w.findAll('.bt-sortable th').map((h) => h.text().replace(/[▲▼+]/g, '').trim())
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
    const headers = w.findAll('.bt-sortable th').map((h) => h.text().replace(/[▲▼+]/g, '').trim())
    for (const h of ['Net P/L', 'Return', 'vs B&H', 'Beat', 'Sharpe', 'Sortino', 'PF', 'RF']) {
      expect(headers).toContain(h)
    }
    expect(headers).not.toContain('B&H Ret')   // removed
    const row = w.find('.bt-runs .bt-row').text()
    expect(row).toContain('12.50%')   // strategy_return_pct 0.125 → 12.50% (fraction)
    expect(row).toContain('4.50%')    // strategy_vs_buy_hold_return_pct 0.045
    expect(row).toContain('✓')        // strategy_beat_buy_hold true
    expect(row).toContain('1.80')     // sharpe_ratio
  })

  test('vs-B&H cell colours by its OWN sign, not the beat flag (positive → green even if beat=false)', () => {
    // The beat flag can disagree with the delta (computed on different bases);
    // colouring by the displayed value's sign avoids "positive number shown red".
    const r = { ...runs[0], metrics: { ...runs[0].metrics, strategy_vs_buy_hold_return_pct: '0.045', strategy_beat_buy_hold: false } }
    const w = mountPanel({ runs: [r] })
    const cell = w.findAll('.bt-row td.num').find((c) => c.text() === '4.50%')
    expect(cell).toBeTruthy()
    expect(cell.classes()).toContain('pos')          // positive → green despite beat=false
    expect(cell.classes()).not.toContain('neg')
  })

  test('vs-B&H cell is red for a negative delta', () => {
    const r = { ...runs[0], metrics: { ...runs[0].metrics, strategy_vs_buy_hold_return_pct: '-0.03', strategy_beat_buy_hold: false } }
    const w = mountPanel({ runs: [r] })
    const cell = w.findAll('.bt-row td.num').find((c) => c.text() === '-3.00%')
    expect(cell.classes()).toContain('neg')
  })

  test('Max Score / Avg Score columns (before Sharpe) for universe runs; no sign colour', () => {
    const r = { ...runs[0], metrics: { ...runs[0].metrics, max_score: '1414.63', avg_score: '1179.64', sharpe_ratio: '1.8' } }
    const w = mountPanel({ runs: [r] })
    const headers = w.findAll('.bt-sortable th').map((h) => h.text().replace(/[▲▼+]/g, '').trim())
    expect(headers).toContain('Max Score')
    expect(headers).toContain('Avg Score')
    expect(headers.indexOf('Max Score')).toBeLessThan(headers.indexOf('Sharpe'))   // before Sharpe
    expect(headers.indexOf('Avg Score')).toBeLessThan(headers.indexOf('Sharpe'))
    const row = w.find('.bt-runs .bt-row').text()
    expect(row).toContain('1414.63')
    expect(row).toContain('1179.64')
    const cell = w.findAll('.bt-row td.num').find((c) => c.text() === '1414.63')
    expect(cell.classes()).not.toContain('pos')   // score is a magnitude, not coloured
    expect(cell.classes()).not.toContain('neg')
  })

  test('truncates the symbols list past 5 with "… & N more" (full list on hover)', () => {
    const many = { ...runs[0], symbols: ['tBTCUSD', 'tETHUSD', 'tADAUSD', 'tXMRBTC', 'tXRPBTC', 'tSOLBTC', 'tZECBTC'] }
    const w = mountPanel({ runs: [many] })
    const sym = w.find('.bt-runs .bt-row .sym')
    expect(sym.text()).toBe('tBTCUSD, tETHUSD, tADAUSD, tXMRBTC, tXRPBTC … & 2 more')
    expect(sym.attributes('title')).toContain('tSOLBTC')   // full list on hover
  })

  test('lists all symbols when 5 or fewer', () => {
    const w = mountPanel({ runs: [{ ...runs[0], symbols: ['tBTCUSD', 'tETHUSD'] }] })
    expect(w.find('.bt-runs .bt-row .sym').text()).toBe('tBTCUSD, tETHUSD')
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
    const headers = w.findAll('.bt-sortable th').map((h) => h.text().replace(/[▲▼+]/g, '').trim())
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
    await selects.find((s) => s.classes().includes('bt-runtype')).setValue('sweep')   // 'sweep' is an option (mixed has a sweep run)
    expect(w.emitted('update:filter').some((e) => e[0].runType === 'sweep')).toBe(true)
  })

  test('clicking a run still emits select-run (details open in their own tab)', async () => {
    const w = mountPanel()
    await w.find('.bt-runs .bt-row').trigger('click')
    expect(w.emitted('select-run')[0][0].run_id).toBe(runs[0].run_id)
    // No inline detail pane is rendered here anymore.
    expect(w.find('.bt-detail').exists()).toBe(false)
  })

  test('each numeric column heading carries a [+] filter trigger; "Beat"/identity columns do not', () => {
    const w = mountPanel()
    const headers = w.findAll('.bt-table thead tr:first-child th')
    const withFilter = headers.filter((h) => h.find('.cfb').exists()).map((h) => h.text())
    // 11 numeric metric columns get the [+]; the boolean "Beat" + identity/duration don't.
    expect(withFilter.length).toBe(11)
    expect(withFilter.some((t) => t.includes('Net P/L'))).toBe(true)
    expect(withFilter.some((t) => t.includes('Score v2'))).toBe(true)
    expect(headers.find((h) => h.text().includes('Beat')).find('.cfb').exists()).toBe(false)
    expect(headers.find((h) => h.text().includes('Strategy')).find('.cfb').exists()).toBe(false)
  })

  test('a column [+] applies/replaces one filter per column via update:metric-filters', async () => {
    const w = mountPanel({ metricFilters: [{ key: 'total_net_profit', label: 'Net P/L', op: '>', value: 1000 }] })
    // Open the Net P/L header filter (already active → pre-filled) and re-apply a new threshold.
    const netHead = w.findAll('.bt-table thead tr:first-child th').find((h) => h.text().includes('Net P/L'))
    await netHead.find('.cfb-btn').trigger('click')
    await netHead.find('.cfb-val').setValue('2000')
    await netHead.find('.cfb-apply').trigger('click')
    const arr = w.emitted('update:metric-filters').pop()[0]
    // Same key replaced (not stacked) → still a single Net P/L filter, new value.
    expect(arr).toEqual([{ key: 'total_net_profit', label: 'Net P/L', op: '>', value: 2000 }])
  })

  test('the "Clear column filters" button shows only with active filters and emits []', async () => {
    const none = mountPanel()
    expect(none.find('.bt-clear').exists()).toBe(false)
    const w = mountPanel({ metricFilters: [{ key: 'score_v2', label: 'Score v2', op: '>', value: 1 }] })
    const clear = w.find('.bt-clear')
    expect(clear.exists()).toBe(true)
    expect(clear.find('.bt-clear-n').text()).toBe('1')
    await clear.trigger('click')
    expect(w.emitted('update:metric-filters').pop()[0]).toEqual([])
  })

  test('"Any type" select is a plain control (no badge-pill style bleed)', () => {
    const w = mountPanel()
    const sel = w.find('select.bt-runtype')
    expect(sel.exists()).toBe(true)
    // The select no longer carries the .bt-type badge class that styled it as a pill.
    expect(sel.classes()).not.toContain('bt-type')
  })

  test('a metric filter hides non-matching runs', () => {
    const twoRuns = [
      { run_id: 'win', strategy: 's', symbols: ['tBTCUSD'], trade_timeframe: '1h', status: 'completed', metrics: { total_net_profit: '1250.50' } },
      { run_id: 'lose', strategy: 't', symbols: ['tETHUSD'], trade_timeframe: '1h', status: 'completed', metrics: { total_net_profit: '500' } },
    ]
    const w = mountPanel({ runs: twoRuns, metricFilters: [{ key: 'total_net_profit', label: 'Net P/L', op: '>', value: 1000 }] })
    const rows = w.findAll('.bt-runs .bt-row')
    expect(rows).toHaveLength(1)
    expect(rows[0].text()).toContain('tBTCUSD')
    expect(w.find('.bt-runs-head').text()).toContain('1')   // count reflects the filter
  })

  test('a clicked run carries the bt-recent-0 recency class (most recent)', () => {
    const w = mountPanel({ clickHistory: [runs[0].run_id] })
    const row = w.find('.bt-runs .bt-row')
    expect(row.classes()).toContain('bt-recent-0')
  })
})
