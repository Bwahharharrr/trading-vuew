// indicator-manager mixin (persistent-indicator side — distinct from the
// File-mode visibility/settings tests in indicator-manager.test.js): the
// clipPersistentIndicators twin-binary-search range clipping and the
// loadPersistentIndicators fetch / path-traversal guard / watcher. Bound to a
// fake `this` (no jsdom needed — pure helpers + a stubbed global fetch).
import { test, expect, describe, vi, afterEach } from 'vitest'
import indicatorManager from '../../src/mixins/app/indicator-manager.js'

const M = indicatorManager.methods
const WATCHER = indicatorManager.watch['currentFileMeta.indicators_url']

// Candles spanning 1000..3000 (ts is column 0).
function candles1to3k() {
  return [[1000, 1], [1500, 1], [2000, 1], [2500, 1], [3000, 1]]
}

// An indicator whose data straddles both ends of the candle window.
function straddleIndicator(over = {}) {
  return {
    name: 'SCMR',
    type: 'Splines',
    data: [[500, 1], [1000, 2], [1500, 3], [2000, 4], [3000, 5], [3500, 6]],
    settings: { color: '#f00' },
    ...over,
  }
}

function mkClipCtx(over = {}) {
  return {
    currentTimeframe: '15m',
    chart: { data: { chart: { data: candles1to3k() } } },
    persistentIndicatorsRaw: {},
    persistentIndicatorVisibility: {},
    persistentIndicatorsClipped: null, // sentinel: prove the method assigns it
    clipPersistentIndicators: M.clipPersistentIndicators,
    ...over,
  }
}

describe('clipPersistentIndicators — twin binary search range clip', () => {
  test('clips an indicator straddling both ends to the inclusive [firstTs..lastTs] slice', () => {
    const ctx = mkClipCtx({
      persistentIndicatorsRaw: { '15m': { indicators: [straddleIndicator()] } },
    })
    const out = ctx.clipPersistentIndicators()
    expect(out).toHaveLength(1)
    const d = out[0].data
    // 500 dropped (below firstTs), 3500 dropped (above lastTs); keep 1000..3000.
    expect(d).toHaveLength(4)
    expect(d[0][0]).toBe(1000)
    expect(d[d.length - 1][0]).toBe(3000)
    // method also stores the result on the instance
    expect(ctx.persistentIndicatorsClipped).toBe(out)
  })

  test('both bounds are inclusive; one ms past lastTs is excluded', () => {
    // points exactly on firstTs (1000) and lastTs (3000) must be kept;
    // 3001 (one ms past lastTs) must be dropped.
    const ind = straddleIndicator({
      data: [[999, 0], [1000, 1], [2000, 2], [3000, 3], [3001, 4]],
    })
    const ctx = mkClipCtx({
      persistentIndicatorsRaw: { '15m': { indicators: [ind] } },
    })
    const d = ctx.clipPersistentIndicators()[0].data
    const tsList = d.map(p => p[0])
    expect(tsList).toEqual([1000, 2000, 3000]) // 999 and 3001 excluded
  })

  test('empty candles → clipped=[] and returns [] without throwing; absent candles likewise', () => {
    const empty = mkClipCtx({ chart: { data: { chart: { data: [] } } } })
    expect(empty.clipPersistentIndicators()).toEqual([])
    expect(empty.persistentIndicatorsClipped).toEqual([])

    const absent = mkClipCtx({ chart: { data: { chart: {} } } })
    expect(() => absent.clipPersistentIndicators()).not.toThrow()
    expect(absent.clipPersistentIndicators()).toEqual([])
  })

  test('indicator with no in-range points yields an empty slice (not the whole array)', () => {
    const ind = straddleIndicator({ data: [[100, 1], [200, 2], [300, 3]] }) // all below firstTs
    const ctx = mkClipCtx({
      persistentIndicatorsRaw: { '15m': { indicators: [ind] } },
    })
    const out = ctx.clipPersistentIndicators()
    expect(out).toHaveLength(1)
    expect(out[0].data).toEqual([]) // empty slice, original 3-pt array NOT returned
  })

  test('group defaults to "Ungrouped" when absent and is preserved when present', () => {
    const ctx = mkClipCtx({
      persistentIndicatorsRaw: {
        '15m': { indicators: [
          straddleIndicator({ name: 'NoGroup' }),                 // no group field
          straddleIndicator({ name: 'Grouped', group: 'Trend' }), // explicit group
        ] },
      },
    })
    const out = ctx.clipPersistentIndicators()
    expect(out[0].group).toBe('Ungrouped')
    expect(out[1].group).toBe('Trend')
  })

  test('settings.display follows persistentIndicatorVisibility and preserves original settings keys', () => {
    const ctx = mkClipCtx({
      persistentIndicatorsRaw: {
        '15m': { indicators: [
          straddleIndicator({ name: 'A' }),                     // undefined → visible
          straddleIndicator({ name: 'B' }),                     // explicit true → visible
          straddleIndicator({ name: 'C' }),                     // explicit false → hidden
        ] },
      },
      persistentIndicatorVisibility: { B: true, C: false },
    })
    const out = ctx.clipPersistentIndicators()
    expect(out[0].settings.display).toBe(true)  // undefined visibility
    expect(out[1].settings.display).toBe(true)  // true
    expect(out[2].settings.display).toBe(false) // false
    // original settings keys merged, not replaced
    expect(out[0].settings.color).toBe('#f00')
  })

  test('honours the timeframe + chartData arguments over this.currentTimeframe / this.chart.data', () => {
    const ctx = mkClipCtx({
      currentTimeframe: '15m',
      // this.chart.data candles would be 1000..3000, but we override with a
      // tighter window via the chartData arg → only 2000 survives.
      persistentIndicatorsRaw: {
        '15m': { indicators: [straddleIndicator({ name: 'SHOULD_NOT_USE' })] },
        '1h': { indicators: [straddleIndicator({ name: 'USED', data: [[1500, 1], [2000, 2], [2500, 3]] })] },
      },
    })
    const out = ctx.clipPersistentIndicators('1h', [[2000, 1]]) // single-candle window @ 2000
    expect(out).toHaveLength(1)
    expect(out[0].name).toBe('USED')               // tf arg selected '1h', not '15m'
    expect(out[0].data.map(p => p[0])).toEqual([2000]) // chartData arg framed [2000..2000]
  })
})

// ---------------------------------------------------------------------------

function mkLoadCtx(over = {}) {
  return {
    currentFileMeta: { indicators_url: null },
    persistentIndicatorsRaw: null,   // sentinel
    persistentIndicatorsClipped: null,
    loadPersistentIndicators: M.loadPersistentIndicators,
    clipPersistentIndicators: vi.fn(), // spy: prove the happy path invokes it
    ...over,
  }
}

describe('loadPersistentIndicators — fetch / path-traversal guard', () => {
  afterEach(() => vi.unstubAllGlobals())

  test('no indicators_url → resets raw={} / clipped=[] and never fetches', async () => {
    const fetchSpy = vi.fn()
    vi.stubGlobal('fetch', fetchSpy)
    const ctx = mkLoadCtx({ currentFileMeta: { indicators_url: null } })
    await ctx.loadPersistentIndicators()
    expect(fetchSpy).not.toHaveBeenCalled()
    expect(ctx.persistentIndicatorsRaw).toEqual({})
    expect(ctx.persistentIndicatorsClipped).toEqual([])

    // also covers the no-currentFileMeta-at-all case
    const ctx2 = mkLoadCtx({ currentFileMeta: undefined })
    await ctx2.loadPersistentIndicators()
    expect(fetchSpy).not.toHaveBeenCalled()
    expect(ctx2.persistentIndicatorsRaw).toEqual({})
  })

  test('refuses suspicious urls (/, \\, ..) — fetch NOT called, state reset', async () => {
    const fetchSpy = vi.fn()
    vi.stubGlobal('fetch', fetchSpy)
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    try {
      for (const bad of ['sub/dir.json', 'a\\b.json', '..secret.json']) {
        const ctx = mkLoadCtx({ currentFileMeta: { indicators_url: bad } })
        await ctx.loadPersistentIndicators()
        expect(ctx.persistentIndicatorsRaw).toEqual({})
        expect(ctx.persistentIndicatorsClipped).toEqual([])
      }
      expect(fetchSpy).not.toHaveBeenCalled()
    } finally {
      errSpy.mockRestore()
    }
  })

  test('happy path: ok JSON → raw set + clipPersistentIndicators invoked', async () => {
    const body = { '15m': { indicators: [] } }
    const fetchSpy = vi.fn(async () => ({ ok: true, json: async () => body }))
    vi.stubGlobal('fetch', fetchSpy)
    const ctx = mkLoadCtx({ currentFileMeta: { indicators_url: 'indicators_BFX_BTC_15m.json' } })
    await ctx.loadPersistentIndicators()
    expect(fetchSpy).toHaveBeenCalledWith('/data/indicators_BFX_BTC_15m.json')
    expect(ctx.persistentIndicatorsRaw).toBe(body)
    expect(ctx.clipPersistentIndicators).toHaveBeenCalledTimes(1)
  })

  test('response.ok===false → treated as absent (raw/clipped reset, clip NOT called)', async () => {
    const fetchSpy = vi.fn(async () => ({ ok: false, json: async () => ({ x: 1 }) }))
    vi.stubGlobal('fetch', fetchSpy)
    const ctx = mkLoadCtx({ currentFileMeta: { indicators_url: 'indicators.json' } })
    await ctx.loadPersistentIndicators()
    expect(ctx.persistentIndicatorsRaw).toEqual({})
    expect(ctx.persistentIndicatorsClipped).toEqual([])
    expect(ctx.clipPersistentIndicators).not.toHaveBeenCalled()
  })

  test('network rejection is caught → state reset, no rethrow', async () => {
    const fetchSpy = vi.fn(async () => { throw new Error('boom') })
    vi.stubGlobal('fetch', fetchSpy)
    const ctx = mkLoadCtx({ currentFileMeta: { indicators_url: 'indicators.json' } })
    await expect(ctx.loadPersistentIndicators()).resolves.toBeUndefined()
    expect(ctx.persistentIndicatorsRaw).toEqual({})
    expect(ctx.persistentIndicatorsClipped).toEqual([])
  })

  test('response.json() throwing is caught → state reset, no rethrow', async () => {
    const fetchSpy = vi.fn(async () => ({ ok: true, json: async () => { throw new Error('bad json') } }))
    vi.stubGlobal('fetch', fetchSpy)
    const ctx = mkLoadCtx({ currentFileMeta: { indicators_url: 'indicators.json' } })
    await expect(ctx.loadPersistentIndicators()).resolves.toBeUndefined()
    expect(ctx.persistentIndicatorsRaw).toEqual({})
    expect(ctx.persistentIndicatorsClipped).toEqual([])
  })
})

describe('currentFileMeta.indicators_url watcher', () => {
  test('new===old is a no-op; a changed value triggers loadPersistentIndicators once', () => {
    const ctx = { loadPersistentIndicators: vi.fn() }
    WATCHER.call(ctx, 'same.json', 'same.json')
    expect(ctx.loadPersistentIndicators).not.toHaveBeenCalled()
    WATCHER.call(ctx, 'new.json', 'old.json')
    expect(ctx.loadPersistentIndicators).toHaveBeenCalledTimes(1)
  })
})
