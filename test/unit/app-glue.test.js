// @vitest-environment jsdom
// App.vue glue methods — the layer where this week's real bugs lived (boot
// include_indicators, pane-[x] desync, alarm rules). Drives the REAL App
// methods with a crafted `this` (same direct-invocation pattern as the
// file-manager tests); no full mount needed.
import { test, expect, describe, beforeEach, vi } from 'vitest'
import App from '../../src/App.vue'

const M = App.methods

// Minimal App context: every method runs with `this = ctx`.
function mkApp(over = {}) {
  const ctx = {
    feedMode: 'gateway',
    corkyStates: [],
    corkyCurrent: null,
    corkyEnabled: {},
    corkyHandle: null,
    corkyFeed: null,
    corkyLast: null,
    corkyLoading: false,
    corkyError: null,
    corkyProgress: null,
    priceAlarms: [],
    chart: {
      data: {
        chart: { type: 'Candles', data: [[1000, 100, 101, 99, 100, 5]] },
        onchart: [], offchart: [],
      },
      add(pane, ov) { this.data[pane].push(ov); return `${pane}.${ov.type}0` },
      touchData: vi.fn(),
    },
    saveStateToStorage: vi.fn(),
    $nextTick: (fn) => fn && fn(),
    $refs: { tradingVue: { resetChart: vi.fn() } },
    wsDisconnect: vi.fn(), // ws-manager mixin method (File-feed pause)
    _alarmSound: {
      unlock: vi.fn(), start: vi.fn(), stop: vi.fn(), stopAll: vi.fn(), destroy: vi.fn(),
    },
  }
  Object.assign(ctx, M) // real App methods, bound by call-site `this`
  return Object.assign(ctx, over)
}

// A controllable CorkyFeed stub.
function mkFeed(over = {}) {
  return Object.assign({
    discover: vi.fn(async () => []),
    subscribe: vi.fn(async () => ({ enabledLayers: new Set() })),
    unsubscribe: vi.fn(async () => {}),
    setIndicatorEnabled: vi.fn(() => true),
    setLayerEnabled: vi.fn(() => true),
    destroy: vi.fn(),
  }, over)
}

const STATE = {
  venue: 'BITFINEX', symbol: 'tBTCUSD',
  available_timeframes: ['1m', '15m'],
  indicators: [
    { kind: 'macd', display_label: 'MACD', view: { layers: [] } },
    { kind: 'scmr', display_label: 'SCMR', view: { layers: [] } },
  ],
}

describe('corkySelect', () => {
  test('normalizes a missing indicators field to [] (the boot-restore bug)', async () => {
    const feed = mkFeed()
    const app = mkApp({ corkyFeed: feed, corkyStates: [STATE] })
    await app.corkySelect({ venue: 'BITFINEX', symbol: 'tBTCUSD', timeframe: '1m' })
    const opts = feed.subscribe.mock.calls[0][0]
    expect(opts.indicators).toEqual([])
  })

  test('passes views (from discovery) + persisted enabled incl. hiddenLayers', async () => {
    const feed = mkFeed()
    const app = mkApp({ corkyFeed: feed, corkyStates: [STATE] })
    app.corkyEnabled['BITFINEX|tBTCUSD'] = {
      kinds: [{ display_label: 'MACD', kind: 'macd' }],
      layers: ['hist'], hiddenLayers: ['bull'],
    }
    await app.corkySelect({ venue: 'BITFINEX', symbol: 'tBTCUSD', timeframe: '1m' })
    const opts = feed.subscribe.mock.calls[0][0]
    expect(Object.keys(opts.views)).toEqual(['MACD', 'SCMR'])
    expect(opts.enabled).toEqual({
      kinds: [{ display_label: 'MACD', kind: 'macd' }],
      layers: ['hist'], hiddenLayers: ['bull'],
    })
    // panel state reflects the persisted memory optimistically
    expect(app.corkyCurrent.indicators).toEqual(['MACD'])
    expect(app.corkyCurrent.layers).toEqual(['hist'])
  })

  test('on success: records corkyLast + persists; on reject: error + current null', async () => {
    const feed = mkFeed()
    const app = mkApp({ corkyFeed: feed, corkyStates: [STATE] })
    await app.corkySelect({ venue: 'BITFINEX', symbol: 'tBTCUSD', timeframe: '15m' })
    expect(app.corkyLast).toEqual({ venue: 'BITFINEX', symbol: 'tBTCUSD', timeframe: '15m' })
    expect(app.saveStateToStorage).toHaveBeenCalled()
    expect(app.corkyHandle).toBeTruthy()

    const bad = mkApp({
      corkyFeed: mkFeed({ subscribe: vi.fn(async () => { throw new Error('nope') }) }),
      corkyStates: [STATE],
    })
    await bad.corkySelect({ venue: 'BITFINEX', symbol: 'tBTCUSD', timeframe: '1m' })
    expect(bad.corkyError).toBeTruthy()
    expect(bad.corkyCurrent).toBeNull()
    expect(bad.corkyLast).toBeNull() // failure must not become the restore target
  })
})

describe('enterGatewayMode auto-restore', () => {
  test('re-selects corkyLast after discovery when the state still exists', async () => {
    const feed = mkFeed({ discover: vi.fn(async () => [STATE]) })
    const app = mkApp({ corkyFeed: feed, corkyLast: { venue: 'BITFINEX', symbol: 'tBTCUSD', timeframe: '15m' } })
    app.corkySelect = vi.fn(async () => {})
    app.enterGatewayMode()
    await new Promise(r => setTimeout(r, 0))
    expect(app.corkySelect).toHaveBeenCalledWith(
      { venue: 'BITFINEX', symbol: 'tBTCUSD', timeframe: '15m' })
  })

  test('falls back to the first timeframe when the remembered one is gone', async () => {
    const feed = mkFeed({ discover: vi.fn(async () => [STATE]) })
    const app = mkApp({ corkyFeed: feed, corkyLast: { venue: 'BITFINEX', symbol: 'tBTCUSD', timeframe: '4h' } })
    app.corkySelect = vi.fn(async () => {})
    app.enterGatewayMode()
    await new Promise(r => setTimeout(r, 0))
    expect(app.corkySelect.mock.calls[0][0].timeframe).toBe('1m')
  })

  test('does nothing without a match or when something is already selected', async () => {
    const feed = mkFeed({ discover: vi.fn(async () => [STATE]) })
    const noMatch = mkApp({ corkyFeed: feed, corkyLast: { venue: 'X', symbol: 'Y', timeframe: '1m' } })
    noMatch.corkySelect = vi.fn()
    noMatch.enterGatewayMode()
    await new Promise(r => setTimeout(r, 0))
    expect(noMatch.corkySelect).not.toHaveBeenCalled()

    const busy = mkApp({
      corkyFeed: feed, corkyLast: { venue: 'BITFINEX', symbol: 'tBTCUSD', timeframe: '1m' },
      corkyCurrent: { venue: 'OTHER', symbol: 'S', timeframe: '1m' },
    })
    busy.corkySelect = vi.fn()
    busy.enterGatewayMode()
    await new Promise(r => setTimeout(r, 0))
    expect(busy.corkySelect).not.toHaveBeenCalled()
  })
})

describe('toggle handlers keep mem + handle.enabled in sync (reconnect fix)', () => {
  function toggledApp() {
    const feed = mkFeed()
    const handle = { enabledLayers: new Set(['hist']), enabled: null }
    const app = mkApp({
      corkyFeed: feed, corkyHandle: handle,
      corkyCurrent: { venue: 'BITFINEX', symbol: 'tBTCUSD', timeframe: '1m', indicators: [], layers: [] },
    })
    return { app, feed, handle }
  }

  test('indicator toggle: mem.kinds + handle.enabled snapshot + persistence', () => {
    const { app, handle } = toggledApp()
    app.onCorkyToggleIndicator({
      venue: 'BITFINEX', symbol: 'tBTCUSD', timeframe: '1m',
      kind: 'macd', display_label: 'MACD', enabled: true,
    })
    const mem = app.corkyEnabled['BITFINEX|tBTCUSD']
    expect(mem.kinds).toEqual([{ display_label: 'MACD', kind: 'macd' }])
    expect(handle.enabled.kinds).toEqual([{ display_label: 'MACD', kind: 'macd' }])
    expect(app.corkyCurrent.indicators).toEqual(['MACD'])
    expect(app.saveStateToStorage).toHaveBeenCalled()
    // toggle off cleans up
    app.onCorkyToggleIndicator({
      venue: 'BITFINEX', symbol: 'tBTCUSD', timeframe: '1m',
      kind: 'macd', display_label: 'MACD', enabled: false,
    })
    expect(app.corkyEnabled['BITFINEX|tBTCUSD'].kinds).toEqual([])
    expect(handle.enabled.kinds).toEqual([])
  })

  test('applied=false (unknown kind) mutates nothing', () => {
    const { app } = toggledApp()
    app.corkyFeed.setIndicatorEnabled = vi.fn(() => false)
    app.onCorkyToggleIndicator({
      venue: 'BITFINEX', symbol: 'tBTCUSD', timeframe: '1m',
      kind: 'nope', display_label: 'NOPE', enabled: true,
    })
    expect(app.corkyEnabled['BITFINEX|tBTCUSD']).toBeUndefined()
    expect(app.saveStateToStorage).not.toHaveBeenCalled()
  })

  test('layer toggle: hiddenLayers records an explicit hide; re-enable clears it', () => {
    const { app, handle } = toggledApp()
    app.onCorkyToggleLayer({
      venue: 'BITFINEX', symbol: 'tBTCUSD', timeframe: '1m',
      layerId: 'bull', enabled: false,
    })
    let mem = app.corkyEnabled['BITFINEX|tBTCUSD']
    expect(mem.hiddenLayers).toEqual(['bull'])
    expect(handle.enabled.hiddenLayers).toEqual(['bull'])
    app.onCorkyToggleLayer({
      venue: 'BITFINEX', symbol: 'tBTCUSD', timeframe: '1m',
      layerId: 'bull', enabled: true,
    })
    mem = app.corkyEnabled['BITFINEX|tBTCUSD']
    expect(mem.hiddenLayers).toEqual([])
  })
})

describe('closeCorkyIndicator (pane [x])', () => {
  function closerApp() {
    const app = mkApp({
      corkyCurrent: { venue: 'BITFINEX', symbol: 'tBTCUSD', timeframe: '1m', indicators: [], layers: [] },
      corkyHandle: { enabledLayers: new Set() },
      corkyFeed: mkFeed(),
      corkyStates: [STATE],
    })
    app.onCorkyToggleLayer = vi.fn()
    app.onCorkyToggleIndicator = vi.fn()
    return app
  }

  test('resolves by settings IDENTITY (names collide across SCMR instances)', () => {
    const app = closerApp()
    const sA = { corkyLayerId: 'main', corkyKind: 'SCMR', corkyInstance: 'SCMR' }
    const sB = { corkyLayerId: 'main', corkyKind: 'SCMR', corkyInstance: 'SCMR(INV)' }
    app.chart.data.onchart.push(
      { name: 'main', settings: sA }, { name: 'main', settings: sB })
    // [x] on the SECOND instance's pane: identical name, distinct settings ref
    expect(app.closeCorkyIndicator({ name: 'main', settings: sB })).toBe(true)
    expect(app.onCorkyToggleLayer).toHaveBeenCalledWith(expect.objectContaining({
      layerId: 'main', enabled: false,
    }))
  })

  test('identity hit on a NON-corky overlay falls through to the File path', () => {
    const app = closerApp()
    const s = { display: true } // not corky
    app.chart.data.offchart.push({ name: 'RSI', settings: s })
    expect(app.closeCorkyIndicator({ name: 'RSI', settings: s })).toBe(false)
  })

  test('fallback overlay (no layer id) toggles the whole indicator with the descriptor label', () => {
    const app = closerApp()
    const s = { corkyKind: 'macd', corkyKey: 'macd:12.macd' }
    app.chart.data.offchart.push({ name: 'macd:12', settings: s })
    expect(app.closeCorkyIndicator({ name: 'macd:12', settings: s })).toBe(true)
    expect(app.onCorkyToggleIndicator).toHaveBeenCalledWith(expect.objectContaining({
      kind: 'macd', display_label: 'MACD', enabled: false,
    }))
  })

  test('not in gateway mode / nothing selected → false (File path handles it)', () => {
    const app = closerApp()
    app.feedMode = 'file'
    expect(app.closeCorkyIndicator({ name: 'x' })).toBe(false)
  })
})

describe('price-alarm glue', () => {
  test('axis click above/below price sets side; gesture unlocks audio', () => {
    const app = mkApp()
    app.onSidebarClick({ grid_id: 0, y: 10, price: 110 })
    app.onSidebarClick({ grid_id: 0, y: 90, price: 90 })
    expect(app.priceAlarms.map(a => a.side)).toEqual(['above', 'below'])
    expect(app._alarmSound.unlock).toHaveBeenCalled()
    expect(app.chart.data.onchart.some(o => o.type === 'PriceAlarms')).toBe(true)
  })

  test('one alarm per side: a repeat click MOVES the alarm (and silences it)', () => {
    const app = mkApp()
    app.onSidebarClick({ grid_id: 0, y: 10, price: 110 })
    app.priceAlarms[0].triggered = true
    app.onSidebarClick({ grid_id: 0, y: 12, price: 115 })
    expect(app.priceAlarms.length).toBe(1)
    expect(app.priceAlarms[0].price).toBe(115)
    expect(app.priceAlarms[0].triggered).toBe(false)
    expect(app._alarmSound.stop).toHaveBeenCalledWith(app.priceAlarms[0].id)
  })

  test('non-price-pane / bad clicks are ignored', () => {
    const app = mkApp()
    app.onSidebarClick({ grid_id: 1, y: 10, price: 110 })
    app.onSidebarClick({ grid_id: 0, y: 10, price: NaN })
    app.onSidebarClick(null)
    expect(app.priceAlarms.length).toBe(0)
  })

  test('onAlarmMoved re-arms, re-derives side, and dedupes the target side (dragged wins)', () => {
    const app = mkApp()
    app.priceAlarms.push(
      { id: 'a1', price: 110, side: 'above', triggered: true },
      { id: 'b1', price: 90, side: 'below', triggered: false },
    )
    // drag the ABOVE alarm under the price (close=100) → side flips to below,
    // the old below alarm is removed, ringing stops
    app.onAlarmMoved({ id: 'a1', price: 95 })
    expect(app.priceAlarms.length).toBe(1)
    expect(app.priceAlarms[0]).toMatchObject({ id: 'a1', side: 'below', triggered: false })
    expect(app._alarmSound.stop).toHaveBeenCalledWith('a1')
    expect(app._alarmSound.stop).toHaveBeenCalledWith('b1')
  })

  test('onAlarmCleared removes + silences; clearAllAlarms keeps the ARRAY REF', () => {
    const app = mkApp()
    const ref = app.priceAlarms
    app.priceAlarms.push({ id: 'a1', price: 110, side: 'above', triggered: true })
    app.onAlarmCleared({ id: 'a1' })
    expect(app.priceAlarms.length).toBe(0)
    expect(app._alarmSound.stop).toHaveBeenCalledWith('a1')
    app.priceAlarms.push({ id: 'a2', price: 90, side: 'below', triggered: false })
    app.clearAllAlarms()
    expect(app._alarmSound.stopAll).toHaveBeenCalled()
    expect(app.priceAlarms.length).toBe(0)
    expect(app.priceAlarms).toBe(ref) // the overlay renders this exact array
  })

  test('checkPriceAlarms rings on cross + repaints; ensure overlay is idempotent', () => {
    const app = mkApp()
    app.priceAlarms.push({ id: 'a1', price: 99.5, side: 'below', triggered: false })
    app.checkPriceAlarms() // close = 100 → below 99.5 not reached
    expect(app.priceAlarms[0].triggered).toBe(false)
    app.chart.data.chart.data[0][4] = 99 // price falls
    app.checkPriceAlarms()
    expect(app.priceAlarms[0].triggered).toBe(true)
    expect(app._alarmSound.start).toHaveBeenCalledWith('a1', 'below')
    expect(app.chart.touchData).toHaveBeenCalled()
    app.ensurePriceAlarmOverlay()
    app.ensurePriceAlarmOverlay()
    expect(app.chart.data.onchart.filter(o => o.type === 'PriceAlarms').length).toBe(1)
  })
})

describe('_corkyMem + _corkyUnsub + teardown', () => {
  test('_corkyMem normalizes malformed restored entries', () => {
    const app = mkApp()
    app.corkyEnabled['V|S'] = { kinds: 'bad', layers: null } // old/corrupt shape
    const mem = app._corkyMem('V', 'S')
    expect(mem.kinds).toEqual([])
    expect(mem.layers).toEqual([])
    expect(mem.hiddenLayers).toEqual([])
  })

  test('_corkyUnsub clears the handle and swallows teardown failures', async () => {
    const feed = mkFeed({ unsubscribe: vi.fn(async () => { throw new Error('gone') }) })
    const app = mkApp({ corkyFeed: feed, corkyHandle: { subscription_id: 's1' } })
    await app._corkyUnsub()
    expect(app.corkyHandle).toBeNull()
    expect(feed.unsubscribe).toHaveBeenCalled()
  })

  test('teardownCorky destroys the feed', () => {
    const feed = mkFeed()
    const app = mkApp({ corkyFeed: feed })
    app.teardownCorky()
    expect(feed.destroy).toHaveBeenCalled()
  })
})
