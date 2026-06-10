// @vitest-environment jsdom
// view-manager mixin (File-mode candle coloring views — previously unloaded):
// applyCurrentColoring stamps colors/below/above from the displayed view onto
// a FRESH copy of the pristine candles; clearing restores plain candles.
import { test, expect, describe, vi } from 'vitest'
import viewManager from '../../src/mixins/app/view-manager.js'

const M = viewManager.methods

function mkCtx(over = {}) {
  const ctx = {
    originalChartData: [
      [1000, 1, 2, 0, 1, 5],
      [2000, 1, 2, 0, 1.5, 5],
      [3000, 1, 2, 0, 2, 5],
    ],
    chart: {
      data: { chart: { type: 'Candles', data: [] }, onchart: [], offchart: [] },
      touchData: vi.fn(),
    },
    charts: {},
    currentTimeframe: null,
    displayedView: '',
    selectedView: '',
    candleColoringOptions: [],
    persistentIndicatorsClipped: [],
    indicatorVisibility: {},
    persistentIndicatorVisibility: {},
    saveStateToStorage: vi.fn(),
    $nextTick: (fn) => fn && fn(),
    $refs: {},
  }
  Object.assign(ctx, M)
  ctx.applyViewOffchart = vi.fn() // offchart assembly tested separately
  return Object.assign(ctx, over)
}

describe('applyCurrentColoring', () => {
  test('stamps colors + below/above markers from the displayed view', () => {
    const ctx = mkCtx({
      displayedView: 'SCMR',
      candleColoringOptions: [{
        title: 'SCMR',
        viewData: {
          colors: ['#0f0', '', '#f00'],
          below: ['B', '', ''],
          above: { values: ['', '', 'A'] }, // extended object format
        },
      }],
    })
    ctx.applyCurrentColoring()
    const d = ctx.chart.data.chart.data
    expect(d[0][6]).toBe('#0f0')
    expect(d[1][6]).toBe('')      // empty color → untouched slot stays ''
    expect(d[2][6]).toBe('#f00')
    expect(d[0][7]).toBe('B')     // below marker
    expect(d[2][8]).toBe('A')     // above marker (object format)
    // pristine source not mutated
    expect(ctx.originalChartData[0].length).toBe(6)
    expect(ctx.chart.touchData).toHaveBeenCalled()
  })

  test('no displayed view → colors and markers cleared', () => {
    const ctx = mkCtx({ displayedView: '' })
    // simulate previously-colored data of full width
    ctx.originalChartData = ctx.originalChartData.map(c => [...c, '#0f0', 'B', 'A'])
    ctx.applyCurrentColoring()
    const d = ctx.chart.data.chart.data
    expect(d[0][6]).toBe('')
    expect(d[0][7]).toBe('')
    expect(d[0][8]).toBe('')
  })

  test('bails safely without pristine data', () => {
    const ctx = mkCtx({ originalChartData: null })
    expect(() => ctx.applyCurrentColoring()).not.toThrow()
    expect(ctx.chart.touchData).not.toHaveBeenCalled()
  })
})

describe('onViewSelected + extractCandleColoringOptions', () => {
  test('selecting a view updates both selections and recolors', () => {
    const ctx = mkCtx()
    ctx.applyCurrentColoring = vi.fn()
    ctx.onViewSelected('SCMR')
    expect(ctx.selectedView).toBe('SCMR')
    expect(ctx.displayedView).toBe('SCMR')
    expect(ctx.applyCurrentColoring).toHaveBeenCalled()
  })

  test('extractCandleColoringOptions reads the views object (and resets prior options)', () => {
    const ctx = mkCtx({ candleColoringOptions: [{ title: 'stale' }] })
    ctx.extractCandleColoringOptions({ views: { SCMR: { colors: [] }, ALT: { colors: [] } } })
    expect(ctx.candleColoringOptions.map(o => o.title)).toEqual(['SCMR', 'ALT'])
    ctx.extractCandleColoringOptions({})
    expect(ctx.candleColoringOptions).toEqual([])
  })
})

describe('prepareChartData', () => {
  test('strips views, stamps tf, deep-copies panes', () => {
    const src = {
      chart: { type: 'Candles', data: [[1, 2, 3, 4, 5, 6]] },
      onchart: [{ name: 'X', settings: {} }],
      offchart: [],
      views: { SCMR: {} },
      datasets: [{ id: 'ds' }],
    }
    const ctx = mkCtx()
    const out = ctx.prepareChartData(src, '15m')
    expect(out.views).toBeUndefined()
    expect(out.chart.tf).toBe('15m')
    expect(out.datasets).toEqual(src.datasets)
    expect(out.onchart[0]).not.toBe(src.onchart[0])
    // originalChartData fast-path: reuses the provided candles by REFERENCE
    const orig = [[9, 9, 9, 9, 9, 9]]
    const out2 = ctx.prepareChartData(src, 'default', orig)
    expect(out2.chart.data).toBe(orig)
    expect(out2.chart.tf).toBeUndefined() // 'default' tf is not stamped
  })
})

describe('buildOffchartData / applyViewOffchart', () => {
  const persist = [
    { name: 'MACD', type: 'Splines', data: [], settings: { display: true } },
    { name: 'Hidden', type: 'Spline', data: [], settings: { display: false } },
  ]

  test('buildOffchartData keeps only visible persistent indicators', () => {
    const ctx = mkCtx({ displayedView: '' })
    delete ctx.applyViewOffchart
    Object.assign(ctx, M)
    const out = ctx.buildOffchartData(persist)
    expect(out).toHaveLength(1)
    expect(out[0].name).toBe('MACD')
    expect(out[0]).not.toBe(persist[0]) // deep-copied
  })

  test('buildOffchartData appends view offchart when a view is active', () => {
    const ctx = mkCtx({ displayedView: 'SCMR' })
    Object.assign(ctx, M)
    const viewData = { offchart: [{ name: 'SCMR osc', type: 'Histogram', data: [] }] }
    const out = ctx.buildOffchartData(persist, viewData)
    expect(out.map((x) => x.name)).toEqual(['MACD', 'SCMR osc'])
  })

  test('applyViewOffchart writes the combined offchart onto the live chart', () => {
    const ctx = mkCtx({
      displayedView: '', currentTimeframe: '1m',
      charts: { '1m': { offchart: [{ name: 'Base', type: 'Spline', data: [] }] } },
      persistentIndicatorsClipped: persist,
      lastIndicatorSet: [],
    })
    Object.assign(ctx, M)
    ctx.applyViewOffchart()
    const names = ctx.chart.data.offchart.map((x) => x.name)
    expect(names).toContain('MACD')   // visible persistent
    expect(names).toContain('Base')   // base offchart merged (no view)
    expect(names).not.toContain('Hidden')
  })
})
