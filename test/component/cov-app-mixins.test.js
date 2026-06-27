// @vitest-environment jsdom
//
// Coverage push for the App.vue / Chart mixins that the existing sibling tests
// only partially reach. We target the UNCOVERED branches/functions, using the
// project's "ctx pattern": bind the mixin's plain methods/computed/watch to a
// fake `this` and drive the real source. Where a mixin is purely a method bag
// (uxlist, tool, chart-range) we bind by name; for component-shaped concerns we
// stub the minimum deps.
//
// Sibling tests already cover (so we deliberately do NOT re-test these):
//   chart-state.test.js          — selectTimeframe, rightPanelWidth, panel drag, computeds
//   screenshot-name.test.js      — screenshotName
//   indicator-manager.test.js    — toggleIndicatorVisibility, onClose, applyIndicatorSettings
//   indicator-manager-clip-load  — clip + loadPersistentIndicators
//   file-manager-flow.test.js    — dataFiles watcher + onFileSelected
//
// New ground covered here:
//   chart-state.js     — captureScreen (+ html2canvas fallback), _saveScreenshot,
//                        initializeChart (single + multi tf, view fallback)
//   indicator-manager  — offchartIndicators / viewIndicatorsAccordion computeds,
//                        toggleViewIndicatorVisibility, isPersistentIndicatorVisible,
//                        openIndicatorSettings/closeIndicatorSettings,
//                        applyRestoredIndicatorSettings
//   file-manager.js    — saveStateToStorage / loadStateFromStorage round-trip,
//                        loadDataFileList
//   chart/chart-range  — range_changed, clamp_range, goto/setRange, default_range,
//                        calc_interval, subset, init_range, common_props,
//                        overlay_subset, update_last_values, dataHashKey, data watcher
//   mixins/tool.js     — init_tool wiring, drag lifecycle, render_pins, set_state,
//                        watch_uuid, pre_draw, remove_tool, beforeUnmount cleanup
//   mixins/uxlist.js   — on_ux_event (new/close/modify/hide/show/passthrough),
//                        modify, remove_all_ux

import { test, expect, describe, vi, beforeEach, afterEach } from 'vitest'

import chartState from '../../src/mixins/app/chart-state.js'
import indicatorManager from '../../src/mixins/app/indicator-manager.js'
import fileManager from '../../src/mixins/app/file-manager.js'
import chartRange from '../../src/mixins/chart/chart-range.js'
import toolMixin from '../../src/mixins/tool.js'
import uxlist from '../../src/mixins/uxlist.js'
import Utils from '../../src/stuff/utils.js'

// ===========================================================================
// chart-state.js — captureScreen / screenshot save / initializeChart
// ===========================================================================
describe('chart-state: captureScreen', () => {
  const CS = chartState.methods
  let infoSpy, warnSpy

  beforeEach(() => {
    infoSpy = vi.spyOn(console, 'info').mockImplementation(() => {})
    warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
  })
  afterEach(() => { vi.restoreAllMocks() })

  function mkCtx(over = {}) {
    const ctx = {
      corkyCurrent: null,
      _captureViaHtml2Canvas: vi.fn(async () => {}),
      _saveScreenshot: vi.fn(async () => {}),
      screenshotName: vi.fn(() => 'chart-x.png'),
      captureScreen: CS.captureScreen,
    }
    return Object.assign(ctx, over)
  }

  test('insecure origin (no mediaDevices) → falls back to html2canvas', async () => {
    const orig = navigator.mediaDevices
    Object.defineProperty(navigator, 'mediaDevices', { value: undefined, configurable: true })
    try {
      const ctx = mkCtx()
      await ctx.captureScreen()
      expect(ctx._captureViaHtml2Canvas).toHaveBeenCalledTimes(1)
      // the native save path was never touched — only the fallback runs
      expect(ctx._saveScreenshot).not.toHaveBeenCalled()
      // the diagnostic names the insecure-origin reason for the fallback
      expect(infoSpy).toHaveBeenCalledWith(expect.stringContaining('html2canvas fallback'))
    } finally {
      Object.defineProperty(navigator, 'mediaDevices', { value: orig, configurable: true })
    }
  })

  test('getDisplayMedia present but no getDisplayMedia fn → html2canvas fallback', async () => {
    const orig = navigator.mediaDevices
    Object.defineProperty(navigator, 'mediaDevices', { value: {}, configurable: true })
    try {
      const ctx = mkCtx()
      await ctx.captureScreen()
      expect(ctx._captureViaHtml2Canvas).toHaveBeenCalledTimes(1)
      expect(ctx._saveScreenshot).not.toHaveBeenCalled()
    } finally {
      Object.defineProperty(navigator, 'mediaDevices', { value: orig, configurable: true })
    }
  })

  // Both NotAllowedError (permission denied) and AbortError (picker/save
  // dialog dismissed) are treated as a silent user-cancel: no fallback, no save,
  // and crucially no warn-level noise in the console.
  test.each(['NotAllowedError', 'AbortError'])(
    'user-dismissed picker (%s) is a silent no-op (no fallback, no warn)', async (name) => {
    const orig = navigator.mediaDevices
    Object.defineProperty(navigator, 'mediaDevices', {
      value: { getDisplayMedia: vi.fn(async () => { throw Object.assign(new Error('x'), { name }) }) },
      configurable: true,
    })
    try {
      const ctx = mkCtx()
      await ctx.captureScreen()
      expect(ctx._captureViaHtml2Canvas).not.toHaveBeenCalled()
      expect(ctx._saveScreenshot).not.toHaveBeenCalled()
      expect(warnSpy).not.toHaveBeenCalled()
    } finally {
      Object.defineProperty(navigator, 'mediaDevices', { value: orig, configurable: true })
    }
  })

  test('a non-abort capture error retries via html2canvas (and warns once)', async () => {
    const orig = navigator.mediaDevices
    Object.defineProperty(navigator, 'mediaDevices', {
      value: { getDisplayMedia: vi.fn(async () => { throw new Error('hardware busy') }) },
      configurable: true,
    })
    try {
      const ctx = mkCtx()
      await ctx.captureScreen()
      // exactly one warn, carrying the original error, then the single fallback
      expect(warnSpy).toHaveBeenCalledTimes(1)
      expect(warnSpy.mock.calls[0].some(a => a instanceof Error && /hardware busy/.test(a.message))).toBe(true)
      expect(ctx._captureViaHtml2Canvas).toHaveBeenCalledTimes(1)
      // the native save path is skipped — only the fallback may save
      expect(ctx._saveScreenshot).not.toHaveBeenCalled()
    } finally {
      Object.defineProperty(navigator, 'mediaDevices', { value: orig, configurable: true })
    }
  })

  test('full success path: decodes a frame, saves a PNG, stops the stream', async () => {
    // A fake MediaStream whose single track records its stop().
    const track = { stop: vi.fn() }
    const stream = { getTracks: () => [track] }
    const getDisplayMedia = vi.fn(async () => stream)
    const orig = navigator.mediaDevices
    Object.defineProperty(navigator, 'mediaDevices', {
      value: { getDisplayMedia },
      configurable: true,
    })
    // Make video.play resolve and rVFC fire a frame. Capture the canvas the
    // method builds so we can assert it was sized to the decoded frame and the
    // frame was actually drawn onto it (not a black/empty canvas).
    const drawImage = vi.fn()
    let madeCanvas = null
    const origCreate = document.createElement.bind(document)
    const createSpy = vi.spyOn(document, 'createElement').mockImplementation((tag) => {
      const el = origCreate(tag)
      if (tag === 'video') {
        el.play = vi.fn(async () => {})
        el.requestVideoFrameCallback = (cb) => { cb() }
        Object.defineProperty(el, 'videoWidth', { value: 320, configurable: true })
        Object.defineProperty(el, 'videoHeight', { value: 240, configurable: true })
      }
      if (tag === 'canvas') {
        el.getContext = () => ({ drawImage })
        el.toBlob = (cb) => cb(new Blob(['x'], { type: 'image/png' }))
        madeCanvas = el
      }
      return el
    })
    try {
      const ctx = mkCtx()
      await ctx.captureScreen()
      // requested the BROWSER surface, current tab, no audio
      expect(getDisplayMedia).toHaveBeenCalledWith(expect.objectContaining({
        audio: false, preferCurrentTab: true,
      }))
      // canvas sized to the decoded frame, frame drawn at the origin
      expect(madeCanvas.width).toBe(320)
      expect(madeCanvas.height).toBe(240)
      expect(drawImage).toHaveBeenCalledWith(expect.anything(), 0, 0)
      expect(ctx._saveScreenshot).toHaveBeenCalledTimes(1)
      const [blob, name] = ctx._saveScreenshot.mock.calls[0]
      expect(blob).toBeInstanceOf(Blob)
      expect(blob.type).toBe('image/png')
      expect(name).toBe('chart-x.png')
      expect(track.stop).toHaveBeenCalledTimes(1) // sharing stopped immediately
      // success → no fallback, no warning
      expect(ctx._captureViaHtml2Canvas).not.toHaveBeenCalled()
      expect(warnSpy).not.toHaveBeenCalled()
    } finally {
      createSpy.mockRestore()
      Object.defineProperty(navigator, 'mediaDevices', { value: orig, configurable: true })
    }
  })
})

describe('chart-state: _saveScreenshot', () => {
  const CS = chartState.methods

  test('uses the File System Access API when showSaveFilePicker exists', async () => {
    const writable = { write: vi.fn(async () => {}), close: vi.fn(async () => {}) }
    const handle = { createWritable: vi.fn(async () => writable) }
    const picker = vi.fn(async () => handle)
    window.showSaveFilePicker = picker
    try {
      const blob = new Blob(['x'])
      await CS._saveScreenshot.call({}, blob, 'foo.png')
      expect(picker).toHaveBeenCalledWith(expect.objectContaining({ suggestedName: 'foo.png' }))
      expect(writable.write).toHaveBeenCalledWith(blob)
      expect(writable.close).toHaveBeenCalled()
    } finally {
      delete window.showSaveFilePicker
    }
  })

  test('falls back to an <a download> link when the picker is absent', async () => {
    delete window.showSaveFilePicker
    const createURL = vi.fn(() => 'blob:zzz')
    const revoke = vi.fn()
    URL.createObjectURL = createURL
    URL.revokeObjectURL = revoke
    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})
    try {
      await CS._saveScreenshot.call({}, new Blob(['y']), 'bar.png')
      expect(createURL).toHaveBeenCalled()
      expect(clickSpy).toHaveBeenCalled()
      expect(revoke).toHaveBeenCalledWith('blob:zzz')
      // the temporary <a> was removed from the DOM
      expect(document.querySelector('a[download="bar.png"]')).toBeNull()
    } finally {
      clickSpy.mockRestore()
    }
  })
})

describe('chart-state: initializeChart', () => {
  const CS = chartState.methods
  class FakeCube { constructor(data) { this.data = data } }

  function mkCtx(over = {}) {
    const ctx = {
      charts: {},
      currentTimeframe: null,
      selectedTimeframe: -1,
      candleColoringOptions: [],
      displayedView: 'STALE',
      originalChartData: null,
      chart: null,
      DataCubeClass: FakeCube,
      extractCandleColoringOptions: vi.fn(),
      prepareChartData: vi.fn((d) => ({ ...d, $prepared: true })),
      applyCurrentColoring: vi.fn(),
      $nextTick: (fn) => { if (fn) fn(); return Promise.resolve() },
      $refs: { tradingVue: { resetChart: vi.fn() } },
      initializeChart: CS.initializeChart,
    }
    return Object.assign(ctx, over)
  }

  test('single-timeframe payload → default key, deep-copied originalChartData', () => {
    const data = { chart: { data: [[1, 1], [2, 2]] }, onchart: [], offchart: [] }
    const ctx = mkCtx()
    ctx.initializeChart(data)
    expect(ctx.charts.default).toBe(data)
    expect(ctx.currentTimeframe).toBe('default')
    expect(ctx.selectedTimeframe).toBe(0)
    expect(ctx.originalChartData).toEqual([[1, 1], [2, 2]])
    expect(ctx.originalChartData).not.toBe(data.chart.data) // copy, not alias
    expect(ctx.chart).toBeInstanceOf(FakeCube)
    expect(ctx.prepareChartData).toHaveBeenCalledWith(data, 'default', ctx.originalChartData)
  })

  test('multi-timeframe payload → first tf selected', () => {
    const data = {
      '5m': { chart: { data: [[10, 1]] }, onchart: [], offchart: [] },
      '1h': { chart: { data: [[20, 2]] }, onchart: [], offchart: [] },
    }
    const ctx = mkCtx()
    ctx.initializeChart(data)
    expect(ctx.charts).toBe(data)
    expect(ctx.currentTimeframe).toBe('5m')
    expect(ctx.selectedTimeframe).toBe(0)
    expect(ctx.originalChartData).toEqual([[10, 1]])
    // coloring/cube were derived from the FIRST tf's payload, not the second
    expect(ctx.extractCandleColoringOptions).toHaveBeenCalledWith(data['5m'], '5m')
    expect(ctx.prepareChartData).toHaveBeenCalledWith(data['5m'], '5m', ctx.originalChartData)
    expect(ctx.chart.data).toEqual({ ...data['5m'], $prepared: true })
  })

  test('sets displayedView to the first available view and applies coloring', () => {
    const ctx = mkCtx({ candleColoringOptions: [{ title: 'SCMR' }, { title: 'INV' }] })
    ctx.initializeChart({ chart: { data: [[1, 1]] }, onchart: [], offchart: [] })
    expect(ctx.displayedView).toBe('SCMR')        // fallback to first
    expect(ctx.applyCurrentColoring).toHaveBeenCalled()
    expect(ctx.$refs.tradingVue.resetChart).toHaveBeenCalled()
  })

  test('no views → displayedView left as-is, no coloring applied', () => {
    const ctx = mkCtx({ candleColoringOptions: [], displayedView: 'STALE' })
    ctx.initializeChart({ chart: { data: [[1, 1]] }, onchart: [], offchart: [] })
    // the no-views branch never enters the colour/redraw block at all
    expect(ctx.displayedView).toBe('STALE')   // untouched sentinel
    expect(ctx.applyCurrentColoring).not.toHaveBeenCalled()
    expect(ctx.$refs.tradingVue.resetChart).not.toHaveBeenCalled()
    // but the chart itself was still built from the single-tf payload
    expect(ctx.chart).toBeInstanceOf(FakeCube)
    expect(ctx.extractCandleColoringOptions).toHaveBeenCalled()
  })

  test('multi-timeframe payload with zero timeframes leaves chart null', () => {
    const ctx = mkCtx({ displayedView: 'STALE' })
    ctx.initializeChart({})        // not single-format, no tf keys
    expect(ctx.chart).toBeNull()
    expect(ctx.currentTimeframe).toBeNull()
    // no tf → no coloring options extracted, no redraw, view sentinel preserved
    expect(ctx.extractCandleColoringOptions).not.toHaveBeenCalled()
    expect(ctx.applyCurrentColoring).not.toHaveBeenCalled()
    expect(ctx.displayedView).toBe('STALE')
  })
})

// ===========================================================================
// indicator-manager.js — computeds + view-indicator toggles + restore
// ===========================================================================
describe('indicator-manager: computeds', () => {
  const IM = indicatorManager
  const get = (name, ctx) => IM.computed[name].call(ctx)

  test('offchartIndicators maps name/type/visible and drops persistent ones', () => {
    const ctx = {
      chart: { data: { offchart: [
        { name: 'RSI', type: 'Range', settings: { display: true } },
        { type: 'Splines' },                                  // unnamed → "Indicator 2"
        { name: 'Persist', type: 'Line', settings: {} },      // excluded (persistent)
        { name: 'Hid', type: 'Line', settings: { display: false } },
      ] } },
      persistentIndicatorsClipped: [{ name: 'Persist' }],
    }
    const out = get('offchartIndicators', ctx)
    expect(out.map(o => o.name)).toEqual(['RSI', 'Indicator 2', 'Hid'])
    expect(out.map(o => o.type)).toEqual(['Range', 'Splines', 'Line'])
    expect(out.map(o => o.visible)).toEqual([true, true, false]) // display:false → not visible
    // `index` is the position in the RAW offchart array (load-bearing: it's how
    // toggleIndicatorVisibility(index) addresses the entry). Dropping the
    // persistent "Persist" at raw index 2 must NOT renumber the survivors, so
    // "Hid" keeps its original index 3, not the post-filter position 2.
    expect(out.map(o => o.index)).toEqual([0, 1, 3])
  })

  test('offchartIndicators returns [] when chart/data missing', () => {
    expect(get('offchartIndicators', { chart: null, persistentIndicatorsClipped: [] })).toEqual([])
    expect(get('offchartIndicators', { chart: { data: {} }, persistentIndicatorsClipped: [] })).toEqual([])
  })

  test('viewIndicatorsAccordion groups persistent indicators by group', () => {
    const ctx = {
      persistentIndicatorsClipped: [
        { name: 'A', type: 'Line', group: 'Trend' },
        { name: 'B', type: 'Line', group: 'Trend' },
        { name: 'C', type: 'Line' },                 // no group → Ungrouped
      ],
      persistentIndicatorVisibility: { B: false },
      accordionExpandedViews: { Trend: true },
    }
    const out = get('viewIndicatorsAccordion', ctx)
    expect(out.map(g => g.title)).toEqual(['Trend', 'Ungrouped'])
    expect(out[0].isExpanded).toBe(true)
    expect(out[1].isExpanded).toBe(false)        // not in accordionExpandedViews
    expect(out[0].indicators.map(i => i.name)).toEqual(['A', 'B'])
    expect(out[0].indicators[0].visible).toBe(true)
    expect(out[0].indicators[1].visible).toBe(false) // B hidden
  })

  test('viewIndicatorsAccordion is [] with no persistent indicators', () => {
    expect(get('viewIndicatorsAccordion', { persistentIndicatorsClipped: [] })).toEqual([])
  })
})

describe('indicator-manager: view toggles + settings modal', () => {
  const IM = indicatorManager.methods

  function mkCtx(over = {}) {
    const ctx = {
      persistentIndicatorVisibility: {},
      indicatorSettingsOpen: false,
      indicatorSettingsData: null,
      saveStateToStorage: vi.fn(),
      $nextTick: (fn) => { if (fn) fn() },
      $refs: { tradingVue: { refreshOffchartOverlays: vi.fn() } },
    }
    Object.assign(ctx, IM)
    // Spies AFTER the real methods so they override the mixin's own copies.
    ctx.clipPersistentIndicators = vi.fn()
    ctx.applyCurrentColoring = vi.fn()
    return Object.assign(ctx, over)
  }

  test('isPersistentIndicatorVisible defaults to visible, false when explicitly hidden', () => {
    const ctx = mkCtx({ persistentIndicatorVisibility: { X: false, Y: true } })
    expect(ctx.isPersistentIndicatorVisible('X')).toBe(false)
    expect(ctx.isPersistentIndicatorVisible('Y')).toBe(true)
    expect(ctx.isPersistentIndicatorVisible('UNKNOWN')).toBe(true) // undefined → visible
  })

  test('toggleViewIndicatorVisibility flips, reclips, recolors, refreshes, persists', () => {
    const ctx = mkCtx()
    ctx.toggleViewIndicatorVisibility('Trend', 'A')
    expect(ctx.persistentIndicatorVisibility.A).toBe(false)
    expect(ctx.clipPersistentIndicators).toHaveBeenCalled()
    expect(ctx.applyCurrentColoring).toHaveBeenCalled()
    expect(ctx.$refs.tradingVue.refreshOffchartOverlays).toHaveBeenCalled()
    expect(ctx.saveStateToStorage).toHaveBeenCalled()
    // flip back
    ctx.toggleViewIndicatorVisibility('Trend', 'A')
    expect(ctx.persistentIndicatorVisibility.A).toBe(true)
  })

  test('openIndicatorSettings / closeIndicatorSettings round-trip', () => {
    const ctx = mkCtx()
    const info = { name: 'RSI', type: 'Range', settings: {} }
    ctx.openIndicatorSettings(info)
    expect(ctx.indicatorSettingsOpen).toBe(true)
    expect(ctx.indicatorSettingsData).toBe(info)
    ctx.closeIndicatorSettings()
    expect(ctx.indicatorSettingsOpen).toBe(false)
    expect(ctx.indicatorSettingsData).toBeNull()
  })
})

describe('indicator-manager: applyRestoredIndicatorSettings', () => {
  const IM = indicatorManager.methods

  function mkCtx(offchart) {
    const ctx = {
      chart: { data: { offchart } },
      $nextTick: (fn) => { if (fn) fn() },
      $refs: { tradingVue: { refreshOffchartOverlays: vi.fn() } },
    }
    Object.assign(ctx, IM)
    return ctx
  }

  test('applies saved type + merges saved settings by name', () => {
    const ctx = mkCtx([
      { name: 'RSI', type: 'Range', settings: { upper: 70 } },
      { name: 'MACD', type: 'Splines', settings: { fast: 12 } },
    ])
    ctx.applyRestoredIndicatorSettings({
      RSI: { type: 'Spline', settings: { color: '#0f0' } },
      MACD: { settings: { slow: 26 } },             // no type → keep type
    })
    expect(ctx.chart.data.offchart[0].type).toBe('Spline')
    expect(ctx.chart.data.offchart[0].settings).toEqual({ upper: 70, color: '#0f0' })
    expect(ctx.chart.data.offchart[1].type).toBe('Splines')  // unchanged
    expect(ctx.chart.data.offchart[1].settings).toEqual({ fast: 12, slow: 26 })
    expect(ctx.$refs.tradingVue.refreshOffchartOverlays).toHaveBeenCalled()
  })

  test('no-op guards: missing chart/data/offchart or null savedSettings', () => {
    expect(() => IM.applyRestoredIndicatorSettings.call({ chart: null }, { X: {} })).not.toThrow()
    // chart + data present but no offchart array → guarded out, no refresh
    const noOff = { chart: { data: {} }, $refs: { tradingVue: { refreshOffchartOverlays: vi.fn() } } }
    Object.assign(noOff, IM)
    expect(() => noOff.applyRestoredIndicatorSettings({ X: { type: 'T' } })).not.toThrow()
    expect(noOff.$refs.tradingVue.refreshOffchartOverlays).not.toHaveBeenCalled()
    // null savedSettings → early return before any mutation/refresh
    const ctx = mkCtx([{ name: 'A', type: 'Line', settings: {} }])
    ctx.applyRestoredIndicatorSettings(null)
    expect(ctx.chart.data.offchart[0].type).toBe('Line')
    expect(ctx.$refs.tradingVue.refreshOffchartOverlays).not.toHaveBeenCalled()
  })

  test('indicator with no saved entry is left untouched', () => {
    const ctx = mkCtx([{ name: 'A', type: 'Line', settings: { x: 1 } }])
    ctx.applyRestoredIndicatorSettings({ OTHER: { type: 'Spline' } })
    expect(ctx.chart.data.offchart[0].type).toBe('Line')
    expect(ctx.chart.data.offchart[0].settings).toEqual({ x: 1 })
  })
})

// ===========================================================================
// file-manager.js — storage round-trip + file list fetch
// ===========================================================================
describe('file-manager: loadDataFileList', () => {
  const FM = fileManager.methods
  afterEach(() => vi.unstubAllGlobals())

  test('ok response populates dataFiles', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, json: async () => ['data_a.json', 'data_b.json'] })))
    const ctx = { dataFiles: [], loadDataFileList: FM.loadDataFileList }
    await ctx.loadDataFileList()
    expect(ctx.dataFiles).toEqual(['data_a.json', 'data_b.json'])
  })

  test('non-ok response leaves dataFiles untouched (no throw)', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: false })))
    const ctx = { dataFiles: ['keep.json'], loadDataFileList: FM.loadDataFileList }
    await ctx.loadDataFileList()
    expect(ctx.dataFiles).toEqual(['keep.json'])
  })

  test('fetch rejection is caught and logged', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => { throw new Error('offline') }))
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const ctx = { dataFiles: ['keep.json'], loadDataFileList: FM.loadDataFileList }
    await expect(ctx.loadDataFileList()).resolves.toBeUndefined()
    expect(ctx.dataFiles).toEqual(['keep.json'])
    expect(errSpy).toHaveBeenCalled()
    errSpy.mockRestore()
  })
})

describe('file-manager: save/load storage round-trip', () => {
  const FM = fileManager.methods

  function mkCtx(over = {}) {
    return Object.assign({
      selectedDataFile: 'data_btc.json',
      getIndicatorSettings: () => ({ RSI: { type: 'Range', settings: {} } }),
      selectedView: 'SCMR',
      log_scale: false,
      indicatorVisibility: { RSI: true },
      persistentIndicatorVisibility: { A: false },
      accordionExpandedViews: { Trend: true },
      corkyEnabled: { 'V|S': { kinds: [] } },
      corkyLast: { venue: 'V', symbol: 'S', timeframe: '1m' },
      panelWidth: 333,
      rightPanelCollapsed: false,
      positionsDockOpen: false,
      positionsDockHeight: 200,
      positionsActiveTab: 'open',
      saveStateToStorage: FM.saveStateToStorage,
      loadStateFromStorage: FM.loadStateFromStorage,
    }, over)
  }

  beforeEach(() => { sessionStorage.clear(); localStorage.clear() })

  test('writes per-tab to sessionStorage and global prefs to localStorage', () => {
    const ctx = mkCtx()
    ctx.saveStateToStorage()
    const tab = JSON.parse(sessionStorage.getItem('trading-vue-state-tab'))
    expect(tab).toEqual({
      selectedDataFile: 'data_btc.json',
      indicatorSettings: { RSI: { type: 'Range', settings: {} } },
    })
    const global = JSON.parse(localStorage.getItem('trading-vue-state'))
    // The global store carries EXACTLY the prefs set (no more, no less) — pin the
    // whole shape so an accidental per-tab/global re-classification is caught.
    expect(global).toEqual({
      selectedView: 'SCMR',
      log_scale: false,
      indicatorVisibility: { RSI: true },
      persistentIndicatorVisibility: { A: false },
      accordionExpandedViews: { Trend: true },
      corkyEnabled: { 'V|S': { kinds: [] } },
      corkyLast: { venue: 'V', symbol: 'S', timeframe: '1m' },
      corkyTabs: null,   // no tab system on the fake ctx → serializeChartTabs absent
      panelWidth: 333,
      rightPanelCollapsed: false,
      positionsDockOpen: false,
      positionsDockHeight: 200,
      positionsActiveTab: 'open',
    })
    // per-tab keys do NOT leak into the global store
    expect(global.selectedDataFile).toBeUndefined()
    expect(global.indicatorSettings).toBeUndefined()
  })

  test('loadStateFromStorage merges global + tab (tab wins for per-tab keys)', () => {
    const ctx = mkCtx()
    ctx.saveStateToStorage()
    const restored = ctx.loadStateFromStorage()
    expect(restored.selectedDataFile).toBe('data_btc.json') // from tab
    expect(restored.selectedView).toBe('SCMR')              // from global
    expect(restored.panelWidth).toBe(333)
  })

  test('loadStateFromStorage returns null when nothing stored', () => {
    expect(mkCtx().loadStateFromStorage()).toBeNull()
  })

  test('loadStateFromStorage tolerates corrupt JSON in either store', () => {
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    sessionStorage.setItem('trading-vue-state-tab', '{not json')
    localStorage.setItem('trading-vue-state', 'also bad')
    const out = mkCtx().loadStateFromStorage()
    expect(out).toBeNull()        // both parses fail → empty merge → null
    expect(errSpy).toHaveBeenCalled()
    errSpy.mockRestore()
  })

  test('loadStateFromStorage survives one corrupt store and returns the other', () => {
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    // tab store corrupt, global store fine → the two try/catch blocks are
    // independent, so the global prefs still come through.
    sessionStorage.setItem('trading-vue-state-tab', '{nope')
    localStorage.setItem('trading-vue-state', JSON.stringify({ selectedView: 'INV', panelWidth: 410 }))
    const out = mkCtx().loadStateFromStorage()
    expect(out).toEqual({ selectedView: 'INV', panelWidth: 410 })
    expect(out.selectedDataFile).toBeUndefined()   // tab parse failed → no per-tab keys
    expect(errSpy).toHaveBeenCalledTimes(1)         // exactly the one (tab) failure logged
    errSpy.mockRestore()
  })

  test('save tolerates a throwing storage backend (logs, no throw)', () => {
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const setItem = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('quota') })
    try {
      expect(() => mkCtx().saveStateToStorage()).not.toThrow()
      // both writes are guarded independently → each failure is logged once
      expect(errSpy).toHaveBeenCalledTimes(2)
      const msgs = errSpy.mock.calls.map(c => c[0])
      expect(msgs).toContain('Failed to write sessionStorage:')
      expect(msgs).toContain('Failed to write localStorage:')
    } finally {
      setItem.mockRestore()
      errSpy.mockRestore()
    }
  })
})

describe('file-manager: onFileSelected range preservation (same-bounds reload)', () => {
  const FM = fileManager.methods
  afterEach(() => vi.unstubAllGlobals())

  // Reloading the SAME instrument (identical first/last candle ts) must keep the
  // user's current view range rather than snapping back to the default window.
  function realCtx(over = {}) {
    const setRange = vi.fn()
    const resetChart = vi.fn()
    const ohlcv = [[1000, 1, 2, 0, 1, 5], [5000, 1, 2, 0, 1, 5]]
    const ctx = Object.assign({}, fileManager.data(), {
      feedMode: 'file', selectedView: '', displayedView: '', candleColoringOptions: [],
      charts: {}, currentTimeframe: null, selectedTimeframe: 0, originalChartData: null,
      chart: null, DataCubeClass: class { constructor(d) { this.data = d } },
      $nextTick: (fn) => { if (fn) fn(); return Promise.resolve() },
      extractCandleColoringOptions: vi.fn(),
      prepareChartData: vi.fn((d) => ({ ...d })),
      buildOffchartData: vi.fn(() => []),
      clipPersistentIndicators: vi.fn(() => []),
      applyCurrentColoring: vi.fn(),
      saveStateToStorage: vi.fn(),
      $refs: {
        tradingVue: {
          getRange: vi.fn(() => [2000, 4000]),     // user's current view
          setRange, resetChart,
          $refs: { chart: { ohlcv } },             // bounds = 1000..5000
        },
      },
      _setRange: setRange, _resetChart: resetChart,
    }, over)
    ctx.onFileSelected = FM.onFileSelected
    return ctx
  }

  test('identical bounds → resetChart(false) and the saved range is restored', async () => {
    // payload has the SAME first/last ts (1000/5000) as the currently-loaded ohlcv
    const payload = {
      chart: { type: 'Candles', data: [[1000, 1, 2, 0, 1, 5], [5000, 1, 2, 0, 1, 5]] },
      onchart: [], offchart: [],
    }
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, json: async () => payload })))
    const ctx = realCtx()
    await ctx.onFileSelected('data_btc.json')
    // sameBounds → don't reset the view (false), then restore the saved range
    expect(ctx._resetChart).toHaveBeenCalledWith(false)
    expect(ctx._setRange).toHaveBeenCalledWith(2000, 4000)
  })

  test('different bounds → resetChart(true) and NO range restore', async () => {
    const payload = {
      chart: { type: 'Candles', data: [[9000, 1, 2, 0, 1, 5], [99000, 1, 2, 0, 1, 5]] },
      onchart: [], offchart: [],
    }
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, json: async () => payload })))
    const ctx = realCtx()
    await ctx.onFileSelected('data_eth.json')
    expect(ctx._resetChart).toHaveBeenCalledWith(true)   // bounds changed → reset
    expect(ctx._setRange).not.toHaveBeenCalled()
  })

  test('multi-timeframe file with zero timeframes bails out cleanly', async () => {
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, json: async () => ({}) })))
    const ctx = realCtx()
    await expect(ctx.onFileSelected('data_empty.json')).resolves.toBeUndefined()
    expect(ctx.chart).toBeNull()         // never built a cube
    expect(errSpy).toHaveBeenCalled()
    errSpy.mockRestore()
  })

  test.each(['../secrets.json', 'a/b.json', 'a\\b.json', '', null])(
    'path-traversal / empty filename %p is rejected before any fetch', async (bad) => {
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const fetchSpy = vi.fn()
    vi.stubGlobal('fetch', fetchSpy)
    const ctx = realCtx()
    await expect(ctx.onFileSelected(bad)).resolves.toBeUndefined()
    expect(fetchSpy).not.toHaveBeenCalled()   // never reached the network
    expect(ctx.chart).toBeNull()              // and never built a cube
    expect(errSpy).toHaveBeenCalledWith('Invalid filename:', bad)
    errSpy.mockRestore()
  })

  test('a non-ok fetch response is caught and logged, leaving chart null', async () => {
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: false })))
    const ctx = realCtx()
    await expect(ctx.onFileSelected('data_btc.json')).resolves.toBeUndefined()
    expect(ctx.chart).toBeNull()
    expect(ctx._resetChart).not.toHaveBeenCalled()
    expect(errSpy).toHaveBeenCalled()
    errSpy.mockRestore()
  })
})

// ===========================================================================
// chart/chart-range.js — range math + layout + subset + overlay subset
// ===========================================================================
describe('chart-range: range math', () => {
  const CR = chartRange.methods

  // Candles span t=1000..5000 (interval 1000).
  const OHLCV = [[1000, 1, 2, 0, 1, 5], [2000, 1, 2, 0, 1, 5], [3000, 1, 2, 0, 1, 5],
    [4000, 1, 2, 0, 1, 5], [5000, 1, 2, 0, 1, 5]]

  function mkCtx(over = {}) {
    const ctx = {
      ohlcv: OHLCV,
      interval: 1000,
      interval_ms: 1000,
      range: [1000, 5000],
      sub: [],
      offsub: [],
      y_transforms: {},
      forced_tf: undefined,
      chart: { tf: null, name: 'BTC' },
      ctx: {},
      layers_meta: {},
      ti_map: null,
      chartLayout: null,
      rerender: 0,
      cursor: {},
      last_values: { onchart: [], offchart: [] },
      onchart: [],
      offchart: [],
      meta: {},
      customGridHeights: {},
      minimizedGrids: {},
      $props: {
        ib: false,
        config: { DEFAULT_LEN: 200, MINIMUM_LEN: 1 },
        data: {},
        colors: {}, font: '', tv_id: 'tv', buttons: [], skin: null, title_txt: 'T',
      },
      filter: Utils.fast_filter,
      $emit: vi.fn(),
      $refs: {},
      update_layout: vi.fn(),
      save_data_t: vi.fn(),
      ce: vi.fn(),
      data_changed: vi.fn(() => false),
    }
    for (const m of ['range_changed', 'clamp_range', 'goto', 'setRange', 'calc_interval',
      'set_ytransform', 'default_range', 'subset', 'init_range', 'common_props',
      'overlay_subset', 'update_last_values']) {
      ctx[m] = CR[m]
    }
    return Object.assign(ctx, over)
  }

  test('clamp_range leaves an overlapping range unchanged', () => {
    const ctx = mkCtx()
    expect(ctx.clamp_range([2000, 4000])).toEqual([2000, 4000])
  })

  test('clamp_range pins a range entirely LEFT of the data back inside', () => {
    const ctx = mkCtx()
    // range ends before the first bar (1000); span 500
    const out = ctx.clamp_range([-1000, -500])
    const span = -500 - -1000  // 500
    // t1 = first - span + interval = 1000 - 500 + 1000 = 1500
    expect(out[0]).toBe(1500)
    expect(out[1]).toBe(1500 + span)
  })

  test('clamp_range pins a range entirely RIGHT of the data back inside', () => {
    const ctx = mkCtx()
    const out = ctx.clamp_range([9000, 9500])
    const span = 500
    // t2 = last + span - interval = 5000 + 500 - 1000 = 4500
    expect(out[1]).toBe(4500)
    expect(out[0]).toBe(4500 - span)
  })

  test('clamp_range is a no-op for empty ohlcv or invalid/inverted ranges', () => {
    expect(mkCtx({ ohlcv: [] }).clamp_range([1, 2])).toEqual([1, 2])
    expect(mkCtx().clamp_range([5, 4])).toEqual([5, 4])           // t1 > t2
    expect(mkCtx().clamp_range([NaN, 2])).toEqual([NaN, 2])       // non-finite t1
    expect(mkCtx().clamp_range([2, NaN])).toEqual([2, NaN])       // non-finite t2
    expect(mkCtx().clamp_range([Infinity, 5])).toEqual([Infinity, 5])
  })

  test('clamp_range index-based (ib) uses index bounds 0..len-1', () => {
    const ctx = mkCtx({ $props: { ...mkCtx().$props, ib: true }, interval: 1 })
    // first=0, last=4; a range entirely right of index 4, span 1
    const out = ctx.clamp_range([10, 11])
    expect(out[1]).toBe(4 + 1 - 1)  // t2 = last + span - interval = 4
    expect(out[0]).toBe(3)          // t1 = t2 - span = 3
    expect(out[1] - out[0]).toBe(1) // span preserved
  })

  test('clamp_range index-based (ib) pins a range entirely LEFT of index 0', () => {
    const ctx = mkCtx({ $props: { ...mkCtx().$props, ib: true }, interval: 1 })
    // first=0; range entirely left, span 2
    const out = ctx.clamp_range([-5, -3])
    expect(out[0]).toBe(0 - 2 + 1) // t1 = first - span + interval = -1
    expect(out[1]).toBe(1)         // t2 = t1 + span
    expect(out[1] - out[0]).toBe(2)
  })

  test('range_changed clamps, recomputes sub, overwrites range, relayouts, emits', () => {
    // Inject a deterministic filter so we can assert sub was recomputed from the
    // CLAMPED range (Utils.fast_filter's IndexedArray boundaries are not the unit
    // under test here — see the subset() block, which stubs filter for the same
    // reason). Returns a sentinel window for the expected [t1-interval, t2] call.
    const win = [[2000, 1, 2, 0, 1, 5], [3000, 1, 2, 0, 1, 5]]
    const filter = vi.fn(() => [win, 0])
    const sub = []
    const ctx = mkCtx({ filter, sub })
    ctx.range_changed([2000, 4000])
    expect(filter).toHaveBeenCalledWith(OHLCV, 1000, 4000) // [t1 - interval, t2]
    expect(ctx.range).toEqual([2000, 4000])
    // sub overwritten IN PLACE (Utils.overwrite mutates the SAME array ref) with
    // the recomputed window
    expect(ctx.sub).toBe(sub)
    expect(ctx.sub.map(c => c[0])).toEqual([2000, 3000])
    expect(ctx.update_layout).toHaveBeenCalledTimes(1)
    expect(ctx.$emit).toHaveBeenCalledWith('range-changed', [2000, 4000])
    // ib false → save_data_t NOT called
    expect(ctx.save_data_t).not.toHaveBeenCalled()
  })

  test('range_changed in ib mode saves data_t', () => {
    const ctx = mkCtx({ $props: { ...mkCtx().$props, ib: true }, interval: 1 })
    ctx.range_changed([1, 3])
    expect(ctx.save_data_t).toHaveBeenCalled()
  })

  test('goto centers the trailing edge keeping the current span', () => {
    const ctx = mkCtx({ range: [2000, 4000] })  // span 2000
    const spy = vi.spyOn(ctx, 'range_changed')
    ctx.goto(9000)
    expect(spy).toHaveBeenCalledWith([7000, 9000])
  })

  test('setRange delegates straight to range_changed', () => {
    const ctx = mkCtx()
    const spy = vi.spyOn(ctx, 'range_changed')
    ctx.setRange(1500, 3500)
    expect(spy).toHaveBeenCalledWith([1500, 3500])
  })
})

describe('chart-range: interval + default_range + subset', () => {
  const CR = chartRange.methods
  const OHLCV = [[1000, 1, 2, 0, 1, 5], [2000, 1, 2, 0, 1, 5], [3000, 1, 2, 0, 1, 5]]

  function mkCtx(over = {}) {
    const ctx = {
      ohlcv: OHLCV,
      interval: 0,
      interval_ms: 0,
      range: [],
      sub: [],
      sub_start: undefined,
      // TI.init destructures `meta` and `ib` off the host `this`.
      meta: { sub_start: undefined },
      ib: false,
      forced_tf: undefined,
      chart: { tf: '1m' },
      ti_map: null,
      last_candle: [],
      last_values: {},
      onchart: [],
      offchart: [],
      $props: { ib: false, config: { DEFAULT_LEN: 200, MINIMUM_LEN: 1 } },
      filter: Utils.fast_filter,
    }
    for (const m of ['calc_interval', 'default_range', 'subset', 'init_range', 'update_last_values']) {
      ctx[m] = CR[m]
    }
    return Object.assign(ctx, over)
  }

  test('calc_interval detects the candle interval from ohlcv', () => {
    const ctx = mkCtx()
    ctx.calc_interval()
    expect(ctx.interval_ms).toBe(1000)
    expect(ctx.interval).toBe(1000)
  })

  test('calc_interval honours a forced_tf string', () => {
    const ctx = mkCtx({ forced_tf: '5m' })
    ctx.calc_interval()
    expect(ctx.interval_ms).toBe(5 * 60 * 1000)
  })

  test('calc_interval bails on <2 candles with no forced tf', () => {
    const ctx = mkCtx({ ohlcv: [[1000, 1]], forced_tf: undefined })
    ctx.calc_interval()
    expect(ctx.interval_ms).toBe(0) // untouched
  })

  test('default_range frames the whole dataset when shorter than DEFAULT_LEN', () => {
    const ctx = mkCtx({ interval: 1000 })
    ctx.default_range()
    // len 3 <= DEFAULT_LEN → s=0, d=MINIMUM_LEN+0.5=1.5
    // range = [ohlcv[0][0] - interval*1.5, ohlcv[last][0] + interval*1.5]
    expect(ctx.range).toEqual([1000 - 1500, 3000 + 1500])
  })

  test('default_range bails on <2 candles', () => {
    const ctx = mkCtx({ ohlcv: [[1000, 1]], interval: 1000 })
    ctx.default_range()
    expect(ctx.range).toEqual([])  // untouched
  })

  test('init_range = calc_interval + default_range', () => {
    const ctx = mkCtx()
    ctx.init_range()
    expect(ctx.interval).toBe(1000)
    expect(ctx.range.length).toBe(2)
  })

  test('subset returns the filtered window, records sub_start, and inits a ti_map', () => {
    // Supply our own `filter` so the assertion does not depend on IndexedArray's
    // boundary behaviour — we are exercising subset()'s body, not fast_filter.
    const windowed = [[2000, 1, 2, 0, 1, 5], [3000, 1, 2, 0, 1, 5]]
    const filter = vi.fn(() => [windowed, 1])   // [result, start index]
    const ctx = mkCtx({ interval: 1000, range: [2000, 3000], filter })
    const sub = ctx.subset()
    // filter called with [t1 - interval, t2]
    expect(filter).toHaveBeenCalledWith(OHLCV, 1000, 3000)
    expect(ctx.sub_start).toBe(1)
    expect(sub).toBe(windowed)        // non-ib mode returns the filtered result
    // ti_map is a real, initialized TI mapping: it captured the windowed result
    // as its `sub`, recorded the start index, and exposes the i<->t helpers.
    // (sub_i is only materialised in ib mode — see the ib subset test below.)
    expect(ctx.ti_map.sub).toBe(windowed)
    expect(ctx.ti_map.ss).toBe(1)
    expect(ctx.ti_map.ib).toBe(false)
    expect(typeof ctx.ti_map.i2t).toBe('function')
    expect(typeof ctx.ti_map.t2i).toBe('function')
  })

  test('subset returns [] when the filter yields no result', () => {
    const filter = vi.fn(() => [null, undefined])  // falsy res → []
    const ctx = mkCtx({ interval: 1000, range: [50000, 60000], filter })
    expect(ctx.subset()).toEqual([])
  })

  test('subset (ib mode) returns the index-mapped sub_i', () => {
    const windowed = [[2000, 1, 2, 0, 1, 5], [3000, 1, 2, 0, 1, 5]]
    const filter = vi.fn(() => [windowed, 0])
    const ctx = mkCtx({
      interval: 1, ib: true, range: [0, 2],
      $props: { ib: true, config: { DEFAULT_LEN: 200, MINIMUM_LEN: 1 } }, filter,
    })
    const sub = ctx.subset()
    // ib mode maps each candle's column 0 to its index → ti_map.sub_i
    expect(sub).toBe(ctx.ti_map.sub_i)
    expect(sub.map(c => c[0])).toEqual([0, 1])
  })

  test('update_last_values captures the last bar + per-overlay tails', () => {
    const ctx = mkCtx({
      onchart: [{ data: [[1000, 9], [2000, 8]] }],
      offchart: [{ data: [[1000, 1]] }, { data: [] }],
    })
    ctx.update_last_values()
    expect(ctx.last_candle).toEqual([3000, 1, 2, 0, 1, 5])
    expect(ctx.last_values.onchart[0]).toEqual([2000, 8])
    expect(ctx.last_values.offchart[0]).toEqual([1000, 1])
    expect(ctx.last_values.offchart[1]).toBeUndefined()  // empty data → no tail
  })
})

describe('chart-range: update_layout guards', () => {
  const CR = chartRange.methods

  // update_layout bails early when there is neither a valid range nor enough
  // data to derive one — the only branch reachable without building a real
  // Layout (which the mounted component tests already exercise).
  test('returns early (no chartLayout) when range is unset and data is too short', () => {
    const ctx = {
      range: [],                       // range[0]/[1] undefined
      ohlcv: [[1000, 1]],              // < 2 candles → cannot init_range
      sub: [],
      chartLayout: null,
      rerender: 0,
      calc_interval: vi.fn(),
      init_range: vi.fn(),
      subset: vi.fn(),
      $refs: {},
      update_layout: CR.update_layout,
    }
    ctx.update_layout()
    expect(ctx.chartLayout).toBeNull()   // never built
    expect(ctx.rerender).toBe(0)         // not bumped
    expect(ctx.init_range).not.toHaveBeenCalled()  // guarded out by the data check
  })

  test('clac_tf=true recalculates the interval before the guard short-circuits', () => {
    const calc = vi.fn()
    const ctx = {
      range: [], ohlcv: [], sub: [], chartLayout: null, rerender: 0,
      calc_interval: calc, init_range: vi.fn(), subset: vi.fn(), $refs: {},
      update_layout: CR.update_layout,
    }
    ctx.update_layout(true)
    expect(calc).toHaveBeenCalled()
    expect(ctx.chartLayout).toBeNull()
  })
})

describe('chart-range: common_props + set_ytransform', () => {
  const CR = chartRange.methods

  test('common_props snapshots the render inputs (title from chart name)', () => {
    const ctx = {
      chart: { name: 'ETH' },
      chartLayout: { grids: [] },
      sub: [1], range: [0, 1], interval: 60, cursor: { x: 1 },
      y_transforms: {}, meta: { a: 1 },
      $props: { title_txt: 'fallback', colors: { back: '#000' }, font: 'Arial',
        tv_id: 'tv1', config: { X: 1 }, buttons: ['b'], skin: 'dark',
        data: { $cd: { revision: () => 7 } } },
      common_props: CR.common_props,
    }
    const p = ctx.common_props()
    expect(p.title_txt).toBe('ETH')           // chart name wins
    expect(p.dataVersion).toBe(7)             // revision threaded through
    expect(p.colors).toBe(ctx.$props.colors)
    expect(p.skin).toBe('dark')
  })

  test('common_props falls back to title_txt prop + revision 0 when no $cd', () => {
    const ctx = {
      chart: {}, chartLayout: null, sub: [], range: [], interval: 0, cursor: {},
      y_transforms: {}, meta: {},
      $props: { title_txt: 'TITLE', colors: {}, font: '', tv_id: 't', config: {},
        buttons: [], skin: null, data: {} },
      common_props: CR.common_props,
    }
    const p = ctx.common_props()
    expect(p.title_txt).toBe('TITLE')
    expect(p.dataVersion).toBe(0)
  })

  test('set_ytransform merges into a fresh object and copies the range array', () => {
    const ctx = { y_transforms: {}, update_layout: vi.fn(), set_ytransform: CR.set_ytransform }
    const range = [0, 100]
    ctx.set_ytransform({ grid_id: 0, range, zoom: 1 })
    expect(ctx.y_transforms[0]).toEqual({ grid_id: 0, range: [0, 100], zoom: 1 })
    expect(ctx.y_transforms[0].range).not.toBe(range)   // new array, not aliased
    expect(ctx.update_layout).toHaveBeenCalled()
    // a second merge keeps prior keys
    ctx.set_ytransform({ grid_id: 0, offset: 5 })
    expect(ctx.y_transforms[0]).toMatchObject({ zoom: 1, offset: 5 })
  })
})

describe('chart-range: dataHashKey computed + overlay_subset', () => {
  const CR = chartRange

  test('dataHashKey returns "" for missing data, else a compact fingerprint', () => {
    expect(CR.computed.dataHashKey.call({ $props: { data: null } })).toBe('')
    const data = {
      ohlcv: [[1000, 1, 2, 0, 9], [2000, 1, 2, 0, 8]],
      scrollLock: true,
      $cd: { revision: () => 3 },
    }
    const key = CR.computed.dataHashKey.call({ $props: { data } })
    // `${len},${firstTs},${lastTs},${lastClose},${scrollLock},${revision}`
    expect(key).toBe('2,1000,2000,8,1,3')
  })

  test('dataHashKey falls back to chart.data when no top-level ohlcv', () => {
    const data = { chart: { data: [[5, 1, 2, 0, 4]] } }
    const key = CR.computed.dataHashKey.call({ $props: { data } })
    expect(key).toBe('1,5,5,4,0,0')
  })

  test('dataHashKey on data with no candles at all → all-empty fingerprint', () => {
    // present but empty data object: ohlcv and chart.data both absent → []
    // len 0, ts/close fields default to '' (the ?? '' branch), scrollLock 0, rev 0
    const key = CR.computed.dataHashKey.call({ $props: { data: {} } })
    expect(key).toBe('0,,,,0,0')
  })

  test('overlay_subset brackets a sparse line so it stays continuous', () => {
    // ti_map provides the i2t_mode/parse glue overlay_subset relies on.
    const ti_map = {
      i2t_mode: (t) => t,                 // identity mapping for the test
      parse: (arr) => arr,                // pass-through
    }
    const ctx = {
      interval: 1000,
      range: [2500, 3500],
      ti_map,
      last_values: { onchart: [] },
      settings_ov: {},
      overlay_subset: CR.methods.overlay_subset,
    }
    const source = [{
      type: 'Spline',
      name: 'POS',
      data: [[1000, 1], [3000, 2], [5000, 3]], // only 3000 is strictly in-window
      settings: { color: '#f00' },
      indexSrc: 'map',
    }]
    const out = ctx.overlay_subset(source, 'onchart')
    expect(out).toHaveLength(1)
    // bracketing pulls in the neighbours on either side of [3000] → 1000..5000
    const ts = out[0].data.map(p => p[0])
    expect(ts).toEqual([1000, 3000, 5000])
    expect(out[0].i0).toBe(0)            // lead pulled the index back to the array start
    expect(out[0].type).toBe('Spline')
    expect(out[0].name).toBe('POS')      // format_name passthrough (no $-tokens)
    expect(out[0].settings).toEqual({ color: '#f00' })
    expect(out[0].grid).toEqual({})      // defaulted
  })

  test('overlay_subset: no bracketing needed when the whole series is in-window', () => {
    // fast_filter returns the in-range slice; every point is inside, and the
    // window touches both ends of the data → no lead/tail to splice on.
    const ti_map = { i2t_mode: (t) => t, parse: (arr) => arr }
    const ctx = {
      interval: 1000,
      range: [1000, 3000],
      ti_map,
      last_values: { offchart: [[3000, 7]] },   // per-overlay tail threaded as `last`
      settings_ov: { fallback: true },
      overlay_subset: CR.methods.overlay_subset,
    }
    const source = [{
      type: 'Line',
      name: 'ALL',
      data: [[1000, 1], [2000, 2], [3000, 3]],
      // no settings → falls back to settings_ov; no grid/tf → defaults
      indexSrc: 'map',
    }]
    const out = ctx.overlay_subset(source, 'offchart')
    expect(out[0].data.map(p => p[0])).toEqual([1000, 2000, 3000]) // unchanged
    expect(out[0].i0).toBe(0)
    expect(out[0].settings).toBe(ctx.settings_ov)  // settings || this.settings_ov branch
    expect(out[0].last).toEqual([3000, 7])         // last_values[side][i]
  })
})

// ===========================================================================
// mixins/tool.js — drawing-tool drag/selection state machine
// ===========================================================================
describe('tool mixin', () => {
  const T = toolMixin.methods

  // A minimal mouse EventEmitter (the real one is Hamster-backed).
  function mkMouse() {
    const h = {}
    return {
      x: 0, y: 0, pressed: false,
      on: (e, f) => { (h[e] = h[e] || []).push(f) },
      emit: (e, ev) => { (h[e] || []).forEach(f => f(ev)) },
      _h: h,
    }
  }

  function mkCtx(over = {}) {
    const events = []
    const ctx = {
      mouse: mkMouse(),
      pins: [],
      collisions: [],
      drag: null,
      show_pins: false,
      selected: false,
      custom_event: (e, ...a) => events.push([e, a[0]]),
      events,
      $props: {
        settings: {},
        cursor: { t: 10, y$: 20 },
      },
    }
    Object.assign(ctx, T)
    return Object.assign(ctx, over)
  }

  afterEach(() => vi.restoreAllMocks())

  test('init_tool wires mouse + keys and seeds default state', () => {
    const ctx = mkCtx()
    ctx.init_tool()
    expect(ctx.collisions).toEqual([])
    expect(ctx.pins).toEqual([])
    expect(ctx.show_pins).toBe(false)
    expect(ctx.drag).toBeNull()
    expect(ctx.keys).toBeTruthy()
    expect(ctx._win_mouseup).toBeInstanceOf(Function)
    // listeners registered for the three mouse events
    expect(ctx.mouse._h.mousemove).toHaveLength(1)
    expect(ctx.mouse._h.mousedown).toHaveLength(1)
    expect(ctx.mouse._h.mouseup).toHaveLength(1)
    // Delete + Backspace are bound to remove_tool (not just "keys is truthy")
    expect(ctx.keys.map.Delete).toHaveLength(1)
    expect(ctx.keys.map.Backspace).toHaveLength(1)
    expect(ctx.keys.map.Delete[0]).toBe(ctx.remove_tool)
    expect(ctx.keys.map.Backspace[0]).toBe(ctx.remove_tool)
  })

  test('Delete / Backspace keys route through init_tool wiring to remove_tool', () => {
    // Drives the real Keys instance init_tool built — a selected tool emits
    // remove-tool on either key, an unselected one stays put. Vue auto-binds
    // component methods to the instance; mirror that for remove_tool so the
    // bare reference init_tool registers keeps its `this`.
    for (const key of ['Delete', 'Backspace']) {
      const sel = mkCtx({ selected: true })
      sel.remove_tool = sel.remove_tool.bind(sel)
      sel.init_tool()
      sel.keys.emit(key)
      expect(sel.events).toContainEqual(['remove-tool', undefined])

      const unsel = mkCtx({ selected: false })
      unsel.remove_tool = unsel.remove_tool.bind(unsel)
      unsel.init_tool()
      unsel.keys.emit(key)
      expect(unsel.events.find(e => e[0] === 'remove-tool')).toBeUndefined()
    }
  })

  test('mousemove sets show_pins true when a collision fn hits, else false', () => {
    const ctx = mkCtx()
    ctx.init_tool()
    ctx.collisions = [() => true]
    ctx.mouse.x = 5; ctx.mouse.y = 5
    ctx.mouse.emit('mousemove', {})
    expect(ctx.show_pins).toBe(true)
    ctx.collisions = [() => false]
    ctx.mouse.emit('mousemove', {})
    expect(ctx.show_pins).toBe(false)
  })

  test('mousedown on a collision selects (when not selected) and starts a drag', () => {
    const pin = { mousedown: vi.fn(), rec_position: vi.fn() }
    const ctx = mkCtx({ selected: false })
    ctx.init_tool()
    ctx.pins = [pin]
    ctx.collisions = [() => true]
    const ev = { preventDefault: vi.fn() }
    ctx.mouse.emit('mousedown', ev)
    expect(ctx.events).toContainEqual(['object-selected', undefined])
    // start_drag fired scroll-lock + seeded drag from the cursor
    expect(ctx.events).toContainEqual(['scroll-lock', true])
    expect(ctx.drag).toEqual({ t: 10, y$: 20 })
    expect(ev.preventDefault).toHaveBeenCalled()
    expect(pin.mousedown).toHaveBeenCalledWith(ev, true)
    expect(pin.rec_position).toHaveBeenCalled()
  })

  test('mousedown does not re-select an already-selected tool', () => {
    const ctx = mkCtx({ selected: true })
    ctx.init_tool()
    ctx.collisions = [() => true]
    ctx.mouse.emit('mousedown', { preventDefault: vi.fn() })
    expect(ctx.events.find(e => e[0] === 'object-selected')).toBeUndefined()
    expect(ctx.events).toContainEqual(['scroll-lock', true]) // still drags
  })

  test('mousedown is ignored when default was prevented', () => {
    const ctx = mkCtx()
    ctx.init_tool()
    ctx.collisions = [() => true]
    ctx.mouse.emit('mousedown', { defaultPrevented: true })
    expect(ctx.drag).toBeNull()
    expect(ctx.events).toHaveLength(0)
  })

  test('mouseup clears the drag and releases the scroll lock', () => {
    const ctx = mkCtx()
    ctx.init_tool()
    ctx.drag = { t: 1, y$: 2 }
    ctx.mouse.emit('mouseup', {})
    expect(ctx.drag).toBeNull()
    expect(ctx.events).toContainEqual(['scroll-lock', false])
  })

  test('drag move during a held drag updates pins from the cursor delta', () => {
    const pin = { update_from: vi.fn(), t1: 100, y$1: 200 }
    const ctx = mkCtx()
    ctx.init_tool()
    ctx.pins = [pin]
    ctx.drag = { t: 10, y$: 20 }
    ctx.$props.cursor = { t: 13, y$: 25 } // dt=3, dy=5
    ctx.mouse.emit('mousemove', {})
    expect(pin.update_from).toHaveBeenCalledWith([103, 205], true)
  })

  test('render_pins draws pins only when selected or hovering', () => {
    const pin = { draw: vi.fn() }
    const fctx = {}
    const ctx = mkCtx({ pins: [pin], selected: false, show_pins: false })
    ctx.render_pins(fctx)
    expect(pin.draw).not.toHaveBeenCalled()
    ctx.show_pins = true
    ctx.render_pins(fctx)
    expect(pin.draw).toHaveBeenCalledWith(fctx)
  })

  test('set_state emits change-settings with the named $state', () => {
    const ctx = mkCtx()
    ctx.set_state('finished')
    expect(ctx.events).toContainEqual(['change-settings', { $state: 'finished' }])
  })

  test('pre_draw resets the collision list', () => {
    const ctx = mkCtx({ collisions: [() => true] })
    ctx.pre_draw()
    expect(ctx.collisions).toEqual([])
  })

  test('remove_tool emits only when selected', () => {
    const sel = mkCtx({ selected: true })
    sel.remove_tool()
    expect(sel.events).toContainEqual(['remove-tool', undefined])
    const unsel = mkCtx({ selected: false })
    unsel.remove_tool()
    expect(unsel.events).toHaveLength(0)
  })

  test('watch_uuid re-inits pins/collisions only when $uuid changed', () => {
    const pin = { re_init: vi.fn() }
    const ctx = mkCtx({ pins: [pin], collisions: [() => true], show_pins: true, drag: {} })
    ctx.watch_uuid({ $uuid: 'b' }, { $uuid: 'a' })
    expect(pin.re_init).toHaveBeenCalled()
    expect(ctx.collisions).toEqual([])
    expect(ctx.show_pins).toBe(false)
    expect(ctx.drag).toBeNull()
    // unchanged uuid → no-op
    pin.re_init.mockClear()
    ctx.watch_uuid({ $uuid: 'b' }, { $uuid: 'b' })
    expect(pin.re_init).not.toHaveBeenCalled()
  })

  test('computed selected/state read off settings', () => {
    const ctx = { $props: { settings: { $selected: true, $state: 'tracking' } } }
    expect(toolMixin.computed.selected.call(ctx)).toBe(true)
    expect(toolMixin.computed.state.call(ctx)).toBe('tracking')
  })

  test('the window mouseup fallback re-dispatches an in-flight drag through the pipeline', () => {
    const ctx = mkCtx()
    ctx.init_tool()
    const emitSpy = vi.spyOn(ctx.mouse, 'emit')
    // pressed/drag both clear → no-op (in-canvas release already handled)
    ctx.mouse.pressed = false; ctx.drag = null
    ctx._win_mouseup({})
    expect(emitSpy).not.toHaveBeenCalled()
    // an active drag → re-route the release
    ctx.drag = { t: 1, y$: 2 }
    ctx._win_mouseup({ kind: 'win' })
    expect(emitSpy).toHaveBeenCalledWith('mouseup', { kind: 'win' })
  })

  test('beforeUnmount removes the window mouseup fallback', () => {
    const ctx = mkCtx()
    ctx.init_tool()
    const removeSpy = vi.spyOn(window, 'removeEventListener')
    const fn = ctx._win_mouseup
    toolMixin.beforeUnmount.call(ctx)
    expect(removeSpy).toHaveBeenCalledWith('mouseup', fn)
    expect(ctx._win_mouseup).toBeNull()
  })

  test('beforeUnmount is a no-op when no fallback was registered', () => {
    const ctx = mkCtx()
    const removeSpy = vi.spyOn(window, 'removeEventListener')
    toolMixin.beforeUnmount.call(ctx)  // _win_mouseup undefined
    expect(removeSpy).not.toHaveBeenCalled()
  })
})

// ===========================================================================
// mixins/uxlist.js — HTML-interface (UX) list manager
// ===========================================================================
describe('uxlist mixin: on_ux_event', () => {
  const UX = uxlist.methods

  function mkCtx(uxs = []) {
    const ctx = { uxs }
    Object.assign(ctx, UX)
    return ctx
  }

  test('new-interface appends when the target matches, stamping grid/overlay ids', () => {
    const ctx = mkCtx()
    const ux = { uuid: 'u1', target: 'gridA' }
    const ret = ctx.on_ux_event({ event: 'new-interface', args: [ux, 'g0', 'ov0'] }, 'gridA')
    expect(ctx.uxs).toHaveLength(1)
    expect(ctx.uxs[0].grid_id).toBe('g0')
    expect(ctx.uxs[0].overlay_id).toBe('ov0')
    expect(ctx.uxs[0].vars).toEqual({})       // defaulted
    expect(ret).toBeUndefined()
  })

  test('new-interface ignores a mismatched target', () => {
    const ctx = mkCtx()
    ctx.on_ux_event({ event: 'new-interface', args: [{ uuid: 'u1', target: 'other' }, 'g0', 'ov0'] }, 'gridA')
    expect(ctx.uxs).toHaveLength(0)
  })

  test('new-interface preserves an existing vars object', () => {
    const ctx = mkCtx()
    const vars = { keep: 1 }
    ctx.on_ux_event({ event: 'new-interface', args: [{ uuid: 'u1', target: 'g', vars }, 'g0', 'ov0'] }, 'g')
    expect(ctx.uxs[0].vars).toBe(vars)
  })

  test('close-interface filters the matching uuid out', () => {
    const ctx = mkCtx([{ uuid: 'a' }, { uuid: 'b' }])
    ctx.on_ux_event({ event: 'close-interface', args: ['a'] }, 'g')
    expect(ctx.uxs.map(x => x.uuid)).toEqual(['b'])
  })

  test('modify-interface applies allowed keys onto the matching ux', () => {
    const ux = { uuid: 'a', color: 'red', extra: 1 }
    const ctx = mkCtx([ux])
    ctx.on_ux_event({ event: 'modify-interface', args: ['a', { color: 'blue', nope: 9 }] }, 'g')
    expect(ux.color).toBe('blue')
    expect('nope' in ux).toBe(false)     // unknown key is not introduced
  })

  test('modify-interface for a missing uuid is a no-op', () => {
    const ctx = mkCtx([{ uuid: 'a', color: 'red' }])
    expect(() => ctx.on_ux_event({ event: 'modify-interface', args: ['zzz', { color: 'x' }] }, 'g')).not.toThrow()
    expect(ctx.uxs[0].color).toBe('red')
  })

  test('hide-interface flags hidden true and modifies', () => {
    const ux = { uuid: 'a', hidden: false }
    const ctx = mkCtx([ux])
    ctx.on_ux_event({ event: 'hide-interface', args: ['a'] }, 'g')
    expect(ux.hidden).toBe(true)
  })

  test('show-interface flips hidden back to false', () => {
    const ux = { uuid: 'a', hidden: true }
    const ctx = mkCtx([ux])
    ctx.on_ux_event({ event: 'show-interface', args: ['a'] }, 'g')
    expect(ux.hidden).toBe(false)
  })

  test('an unknown event is passed through (returned verbatim)', () => {
    const ctx = mkCtx()
    const d = { event: 'something-else', args: [1] }
    expect(ctx.on_ux_event(d, 'g')).toBe(d)
  })

  test('modify only copies keys that already exist on the ux', () => {
    const ctx = mkCtx()
    const ux = { a: 1 }
    ctx.modify(ux, { a: 2, b: 3 })
    expect(ux.a).toBe(2)
    expect('b' in ux).toBe(false)
  })

  test('modify with no obj is a safe no-op', () => {
    const ctx = mkCtx()
    const ux = { a: 1 }
    expect(() => ctx.modify(ux)).not.toThrow()
    expect(ux.a).toBe(1)
  })

  test('remove_all_ux drops every ux belonging to an overlay id', () => {
    const ctx = mkCtx([
      { uuid: '1', overlay: { id: 'ovA' } },
      { uuid: '2', overlay: { id: 'ovB' } },
      { uuid: '3', overlay: { id: 'ovA' } },
    ])
    ctx.remove_all_ux('ovA')
    expect(ctx.uxs.map(x => x.uuid)).toEqual(['2'])
  })
})
