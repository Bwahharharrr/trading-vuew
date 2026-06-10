// @vitest-environment jsdom
// file-manager mixin: the boot dataFiles watcher (pending restore vs auto-
// select vs gateway no-op) and onFileSelected's validation + format handling.
import { test, expect, describe, vi, beforeEach, afterEach } from 'vitest'
import fileManager from '../../src/mixins/app/file-manager.js'
import viewManager from '../../src/mixins/app/view-manager.js'

const watcher = fileManager.watch.dataFiles
const M = fileManager.methods

function mkCtx(over = {}) {
  const ctx = Object.assign({}, fileManager.data(), {
    feedMode: 'file',
    selectedView: '',
    displayedView: '',
    candleColoringOptions: [],
    charts: {},
    currentTimeframe: null,
    selectedTimeframe: 0,
    originalChartData: null,
    chart: null,
    $refs: {},
    $nextTick: (fn) => fn && fn(),
    applyRestoredIndicatorSettings: vi.fn(),
    selectTimeframe: vi.fn(),
  })
  Object.assign(ctx, viewManager.methods, M)
  ctx.onFileSelected = over.onFileSelected || vi.fn(async () => {})
  return Object.assign(ctx, over)
}

describe('dataFiles watcher (boot file pick)', () => {
  test('honours a pending restore when the file still exists, then clears it', async () => {
    const ctx = mkCtx({
      pendingFileLoad: 'data_x.json',
      pendingIndicatorSettings: { foo: 1 },
    })
    watcher.call(ctx, ['data_a.json', 'data_x.json'])
    await new Promise(r => setTimeout(r, 0))
    expect(ctx.onFileSelected).toHaveBeenCalledWith('data_x.json')
    expect(ctx.applyRestoredIndicatorSettings).toHaveBeenCalledWith({ foo: 1 })
    expect(ctx.pendingFileLoad).toBeNull()
  })

  test('drops a vanished pending file and auto-selects the first MAIN chart file', () => {
    const ctx = mkCtx({ pendingFileLoad: 'gone.json' })
    watcher.call(ctx, [
      'data_alerts_x.json', 'data_scorers_x.json', 'data_tf.json', // skipped prefixes
      'data_btc.json', 'data_eth.json',
    ])
    expect(ctx.pendingFileLoad).toBeNull()
    expect(ctx.onFileSelected).toHaveBeenCalledWith('data_btc.json')
  })

  test('GATEWAY mode never auto-loads a file under the gateway feed', () => {
    const ctx = mkCtx({ feedMode: 'gateway' })
    watcher.call(ctx, ['data_btc.json'])
    expect(ctx.onFileSelected).not.toHaveBeenCalled()
  })

  test('no auto-select when a file is already loaded', () => {
    const ctx = mkCtx({ currentDataFile: 'data_eth.json' })
    watcher.call(ctx, ['data_btc.json'])
    expect(ctx.onFileSelected).not.toHaveBeenCalled()
  })
})

describe('onFileSelected', () => {
  let fetchSpy
  beforeEach(() => { fetchSpy = vi.fn(); vi.stubGlobal('fetch', fetchSpy) })
  afterEach(() => vi.unstubAllGlobals())

  function realCtx(over) {
    const ctx = mkCtx(over)
    ctx.onFileSelected = M.onFileSelected // the REAL method
    return ctx
  }

  test('rejects path traversal without fetching', async () => {
    const ctx = realCtx()
    await ctx.onFileSelected('../etc/passwd')
    await ctx.onFileSelected('a/b.json')
    await ctx.onFileSelected('a\\b.json')
    await ctx.onFileSelected('')
    expect(fetchSpy).not.toHaveBeenCalled()
  })

  test('multi-timeframe file: charts keyed by tf, first tf selected, _meta extracted', async () => {
    const payload = {
      '15m': {
        chart: { type: 'Candles', data: [[1000, 1, 2, 0, 1, 5], [2000, 1, 2, 0, 1, 5]] },
        onchart: [], offchart: [],
        _meta: { ws: { port: 7071 } },
      },
      '1h': { chart: { type: 'Candles', data: [[1000, 1, 2, 0, 1, 5]] }, onchart: [], offchart: [] },
    }
    fetchSpy.mockResolvedValue({ ok: true, json: async () => payload })
    const ctx = realCtx()
    await ctx.onFileSelected('data_btc.json')
    expect(fetchSpy).toHaveBeenCalledWith('/data/data_btc.json')
    expect(ctx.currentDataFile).toBe('data_btc.json')
    expect(ctx.currentTimeframe).toBe('15m')
    expect(Object.keys(ctx.charts)).toEqual(['15m', '1h'])
    expect(ctx.currentFileMeta).toEqual({ ws: { port: 7071 } })
    expect(ctx.originalChartData).toEqual(payload['15m'].chart.data)
  })

  test('single-timeframe (legacy) file maps to the default key; no _meta → null', async () => {
    const payload = {
      chart: { type: 'Candles', data: [[1000, 1, 2, 0, 1, 5], [2000, 1, 2, 0, 1, 5]] },
      onchart: [], offchart: [],
    }
    fetchSpy.mockResolvedValue({ ok: true, json: async () => payload })
    const ctx = realCtx()
    await ctx.onFileSelected('data.json')
    expect(ctx.currentTimeframe).toBe('default')
    expect(ctx.charts.default).toBe(payload)
    expect(ctx.currentFileMeta).toBeNull()
  })

  test('HTTP failure is contained (no throw, no partial state)', async () => {
    fetchSpy.mockResolvedValue({ ok: false })
    const ctx = realCtx()
    await expect(ctx.onFileSelected('data_x.json')).resolves.toBeUndefined()
    expect(ctx.currentDataFile).toBe('')
  })
})
