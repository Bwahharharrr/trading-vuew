// @vitest-environment jsdom
// chart-state mixin: File-mode timeframe selection (the DataCube SWAP — the
// highest-risk untested app function), right-panel width clamping, and the
// panel-resize drag lifecycle.
import { test, expect, describe, vi } from 'vitest'
import chartState from '../../src/mixins/app/chart-state.js'
import viewManager from '../../src/mixins/app/view-manager.js'

const CS = chartState.methods
const VM = viewManager.methods

// FakeDataCube records what selectTimeframe builds it from.
class FakeDataCube {
  constructor(data) { this.data = data }
}

function mkCtx(over = {}) {
  const ctx = {
    charts: {},
    currentTimeframe: null,
    selectedTimeframe: 0,
    selectedView: '',
    displayedView: '',
    candleColoringOptions: [],
    originalChartData: null,
    chart: null,
    DataCubeClass: FakeDataCube,
    width: 1000,
    height: 800,
    panelWidth: 300,
    config: { RIGHTBAR: 250 },
    saveStateToStorage: vi.fn(),
    $nextTick: (fn) => fn && fn(),
    $refs: { tradingVue: { resetChart: vi.fn() } },
  }
  Object.assign(ctx, VM, CS)
  // Spies AFTER the real methods so they take precedence (applyCurrentColoring
  // is a real view-manager method we intentionally stub here).
  ctx.clipPersistentIndicators = vi.fn()
  ctx.applyCurrentColoring = vi.fn()
  // the real computed (endPanelResize persists through it)
  Object.defineProperty(ctx, 'rightPanelWidth', {
    get() { return chartState.computed.rightPanelWidth.call(this) },
  })
  return Object.assign(ctx, over)
}

const TF_DATA = {
  chart: { type: 'Candles', data: [[1000, 1, 2, 0, 1, 5], [2000, 1, 2, 0, 1, 5]] },
  onchart: [{ name: 'EMA', type: 'Spline', data: [[1000, 1]] }],
  offchart: [],
  views: { SCMR: { colors: ['#fff'] } },
}

describe('selectTimeframe (File-mode DataCube swap)', () => {
  test('replaces this.chart with a fresh cube: views stripped, tf stamped, deep-copied', () => {
    const ctx = mkCtx({ charts: { '15m': TF_DATA } })
    ctx.selectTimeframe('15m', 1)
    expect(ctx.currentTimeframe).toBe('15m')
    expect(ctx.selectedTimeframe).toBe(1)
    expect(ctx.chart).toBeInstanceOf(FakeDataCube)
    const d = ctx.chart.data
    expect(d.views).toBeUndefined()              // views never reach the cube
    expect(d.chart.tf).toBe('15m')               // tf stamped from the key
    expect(d.onchart[0].name).toBe('EMA')
    expect(d.onchart[0]).not.toBe(TF_DATA.onchart[0]) // deep copy, no aliasing
    // originalChartData snapshot is a COPY of the candles (coloring source)
    expect(ctx.originalChartData).toEqual(TF_DATA.chart.data)
    expect(ctx.originalChartData).not.toBe(TF_DATA.chart.data)
    expect(ctx.clipPersistentIndicators).toHaveBeenCalled()
    expect(ctx.applyCurrentColoring).toHaveBeenCalled()
  })

  test('displayedView: keeps a still-available selection, else falls back to first view', () => {
    const ctx = mkCtx({ charts: { '1h': TF_DATA }, selectedView: 'SCMR' })
    ctx.selectTimeframe('1h', 0)
    expect(ctx.displayedView).toBe('SCMR')
    const ctx2 = mkCtx({ charts: { '1h': TF_DATA }, selectedView: 'GONE' })
    ctx2.selectTimeframe('1h', 0)
    expect(ctx2.displayedView).toBe('SCMR')   // fallback to first available
    expect(ctx2.selectedView).toBe('GONE')    // persistent selection preserved
    const noViews = { ...TF_DATA, views: undefined }
    const ctx3 = mkCtx({ charts: { '5m': noViews }, selectedView: 'SCMR' })
    ctx3.selectTimeframe('5m', 0)
    expect(ctx3.displayedView).toBe('')
  })
})

describe('rightPanelWidth clamping', () => {
  const get = (ctx) => chartState.computed.rightPanelWidth.call(ctx)

  test('clamps to [220, 60% of window]; falls back to RIGHTBAR on garbage', () => {
    expect(get(mkCtx({ panelWidth: 300 }))).toBe(300)
    expect(get(mkCtx({ panelWidth: 50 }))).toBe(220)            // min
    expect(get(mkCtx({ panelWidth: 5000 }))).toBe(600)          // 60% of 1000
    expect(get(mkCtx({ panelWidth: 'junk' }))).toBe(250)        // RIGHTBAR fallback
    expect(get(mkCtx({ panelWidth: 'junk', config: {} }))).toBe(250)
  })
})

describe('panel resize drag', () => {
  test('drag updates width from the pointer; end clamps, persists, and cleans up', () => {
    const ctx = mkCtx()
    const innerWidth = window.innerWidth
    ctx.startPanelResize({ preventDefault: vi.fn() })
    expect(document.body.style.cursor).toBe('col-resize')
    document.dispatchEvent(new MouseEvent('mousemove', { clientX: innerWidth - 350 }))
    expect(ctx.panelWidth).toBe(350)
    document.dispatchEvent(new MouseEvent('mouseup'))
    expect(ctx._panelResizing).toBe(false)
    expect(document.body.style.cursor).toBe('')
    expect(ctx.saveStateToStorage).toHaveBeenCalled()
    // listeners removed: further moves change nothing
    document.dispatchEvent(new MouseEvent('mousemove', { clientX: innerWidth - 500 }))
    expect(ctx.panelWidth).toBe(350)
  })

  test('endPanelResize persists the CLAMPED width; idempotent when not resizing', () => {
    const ctx = mkCtx()
    ctx.startPanelResize({ preventDefault: vi.fn() })
    document.dispatchEvent(new MouseEvent('mousemove', { clientX: window.innerWidth - 10 }))
    document.dispatchEvent(new MouseEvent('mouseup'))
    expect(ctx.panelWidth).toBe(220) // clamped to the minimum
    ctx.saveStateToStorage.mockClear()
    ctx.endPanelResize() // no active drag → no-op
    expect(ctx.saveStateToStorage).not.toHaveBeenCalled()
  })
})

describe('computeds + simple methods', () => {
  const C = chartState.computed

  test('colors palette + derived chart dimensions', () => {
    const ctx = mkCtx()
    // install sibling computeds as getters (chartHeight reads bottomPanelHeight
    // and bottomDockHeight)
    for (const k of ['bottomPanelHeight', 'bottomDockHeight', 'chartWidth', 'chartHeight'])
      Object.defineProperty(ctx, k, { get: C[k], configurable: true })
    expect(C.colors.call(ctx).back).toBe('#121827')
    expect(ctx.bottomPanelHeight).toBe(44)
    // file mode → no positions dock, so it steals no height
    expect(ctx.bottomDockHeight).toBe(0)
    // chartWidth = width - rightPanelWidth; chartHeight = height - bottomPanel - dock
    expect(ctx.chartWidth).toBe(ctx.width - ctx.rightPanelWidth)
    expect(ctx.chartHeight).toBe(ctx.height - 44)
  })

  test('bottomDockHeight: gateway-mode header-only collapsed, header+body open', () => {
    const ctx = mkCtx({ feedMode: 'gateway', positionsDockOpen: false, positionsDockHeight: 240 })
    Object.defineProperty(ctx, 'bottomDockHeight', { get: C.bottomDockHeight, configurable: true })
    Object.defineProperty(ctx, 'chartHeight', { get: C.chartHeight, configurable: true })
    Object.defineProperty(ctx, 'bottomPanelHeight', { get: C.bottomPanelHeight, configurable: true })
    expect(ctx.bottomDockHeight).toBe(34)               // collapsed = header bar only
    ctx.positionsDockOpen = true
    expect(ctx.bottomDockHeight).toBe(34 + 240)         // open = header + body
    expect(ctx.chartHeight).toBe(ctx.height - 44 - (34 + 240))
    // body is clamped to <= 60% of viewport height
    ctx.positionsDockHeight = 100000
    expect(ctx.bottomDockHeight).toBe(34 + Math.floor(ctx.height * 0.6))
  })

  test('timeframes lists the loaded chart keys', () => {
    const ctx = mkCtx({ charts: { '1m': {}, '15m': {} } })
    expect(C.timeframes.call(ctx)).toEqual(['1m', '15m'])
  })

  test('data() initial state defaults', () => {
    const d = chartState.data.call({})
    expect(d.log_scale).toBe(true)
    expect(d.selectedTimeframe).toBe(0)
    expect(d.charts).toEqual({})
  })

  test('onResize syncs width/height from the window', () => {
    const ctx = mkCtx()
    window.innerWidth = 1234; window.innerHeight = 567
    ctx.onResize()
    expect(ctx.width).toBe(1234)
    expect(ctx.height).toBe(567)
  })

  test('resetView delegates to the TradingVue ref', () => {
    const ctx = mkCtx()
    ctx.resetView()
    expect(ctx.$refs.tradingVue.resetChart).toHaveBeenCalled()
  })

  test('resetView uses TradingVue for strategy balance tabs too', () => {
    const ctx = mkCtx({
      activeTab: { kind: 'strategy_balance' },
      $refs: { tradingVue: { resetChart: vi.fn() } },
    })
    ctx.resetView()
    expect(ctx.$refs.tradingVue.resetChart).toHaveBeenCalled()
  })

  test('log_scale watcher writes grid.logScale and persists', () => {
    const ctx = mkCtx({ chart: { data: { chart: {} } } })
    chartState.watch.log_scale.call(ctx, false)
    expect(ctx.chart.data.chart.grid).toEqual({ logScale: false })
    expect(ctx.saveStateToStorage).toHaveBeenCalled()
  })
})
