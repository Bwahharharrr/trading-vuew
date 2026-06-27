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
    corkyClient: {},   // corkySelect/enterGatewayMode guard on the client being up
    corkyStates: [],
    corkyCurrent: null,
    corkyEnabled: {},
    corkyHandle: null,
    corkyFeed: null,
    corkyDiscoverFeed: null,
    corkyLast: null,
    corkyLoading: false,
    corkyError: null,
    corkyProgress: null,
    // Per-tab control epoch + tab identity — corkySelect now targets this.activeTab
    // (= ctx, set below), so these flat fields ARE this tab's; isActive() holds.
    _stream: { gen: 0, retryOpts: null, retryTimer: null, retries: 0, retryKeepSpinner: false },
    id: 'ct-1',
    activeChartTabId: 'ct-1',
    title: '',
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
  Object.assign(ctx, over)
  if (!ctx.activeTab) ctx.activeTab = ctx   // the tab corkySelect/_corkyUnsub target
  return ctx
}

// A controllable CorkyFeed stub.
function mkFeed(over = {}) {
  return Object.assign({
    discover: vi.fn(async () => []),
    subscribe: vi.fn(async () => ({ enabledLayers: new Set() })),
    unsubscribe: vi.fn(async () => {}),
    setIndicatorEnabled: vi.fn(() => true),
    setLayerEnabled: vi.fn(() => true),
    dispose: vi.fn(),   // teardown disposes each feed (no per-feed client.close)…
    destroy: vi.fn(),   // …then closes the one shared client itself
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
  // Boot restores the persisted chart-tab SET after discovery (the real restore
  // logic — tab creation + lazy-subscribe — lives in restoreChartTabs, tested in
  // chart-tabs.test.js). Here we pin that enterGatewayMode hands the saved set to
  // restoreChartTabs once discovery resolves.
  test('restores the saved tab set after discovery', async () => {
    const feed = mkFeed({ discover: vi.fn(async () => [STATE]) })
    const saved = { tabs: [{ venue: 'BITFINEX', symbol: 'tBTCUSD', timeframe: '15m' }], activeIndex: 0 }
    const app = mkApp({ corkyDiscoverFeed: feed, _savedCorkyTabs: saved })
    app.restoreChartTabs = vi.fn(() => 1)
    app.enterGatewayMode()
    await new Promise(r => setTimeout(r, 0))
    expect(app.restoreChartTabs).toHaveBeenCalledWith(saved)
  })

  test('does nothing when already charting (corkyCurrent set)', async () => {
    const feed = mkFeed({ discover: vi.fn(async () => [STATE]) })
    const busy = mkApp({
      corkyDiscoverFeed: feed,
      _savedCorkyTabs: { tabs: [{ venue: 'BITFINEX', symbol: 'tBTCUSD', timeframe: '1m' }], activeIndex: 0 },
      corkyCurrent: { venue: 'OTHER', symbol: 'S', timeframe: '1m' },
    })
    busy.restoreChartTabs = vi.fn()
    busy.enterGatewayMode()
    await new Promise(r => setTimeout(r, 0))
    expect(busy.restoreChartTabs).not.toHaveBeenCalled()
  })

  test('no saved set → nothing restored (fresh session shows the empty tab)', async () => {
    const feed = mkFeed({ discover: vi.fn(async () => [STATE]) })
    const app = mkApp({ corkyDiscoverFeed: feed, _savedCorkyTabs: null })
    app.restoreChartTabs = vi.fn()
    app.enterGatewayMode()
    await new Promise(r => setTimeout(r, 0))
    expect(app.restoreChartTabs).not.toHaveBeenCalled()
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

describe('feed mode + error mapping', () => {
  test('_corkyErr normalizes errors to { message, retryable }', () => {
    const app = mkApp()
    expect(app._corkyErr(null)).toEqual({ message: 'Unknown error', retryable: false })
    expect(app._corkyErr({ message: 'boom', retryable: true })).toEqual({ message: 'boom', retryable: true })
    expect(app._corkyErr({ code: 'state_not_found' })).toEqual({ message: 'state_not_found', retryable: false })
  })

  test('setFeedMode is a no-op when unchanged; → gateway enters gateway mode', () => {
    const app = mkApp({ feedMode: 'gateway' })
    app.enterGatewayMode = vi.fn()
    app.setFeedMode('gateway')                 // unchanged
    expect(app.enterGatewayMode).not.toHaveBeenCalled()
    const app2 = mkApp({ feedMode: 'file' })
    app2.enterGatewayMode = vi.fn()
    app2.setFeedMode('gateway')
    expect(app2.enterGatewayMode).toHaveBeenCalled()
  })

  test('setFeedMode → file tears down the gateway and reloads the selected file', () => {
    const app = mkApp({ feedMode: 'gateway', selectedDataFile: 'data_btc.json' })
    app.teardownCorky = vi.fn()
    app.onFileSelected = vi.fn()
    app.setFeedMode('file')
    expect(app.teardownCorky).toHaveBeenCalled()
    expect(app.onFileSelected).toHaveBeenCalledWith('data_btc.json')
  })

  test('setFeedMode → file with no prior file auto-picks the first chart file', () => {
    const app = mkApp({ feedMode: 'gateway', selectedDataFile: '', dataFiles: ['data_alerts_x.json', 'data_btc.json'] })
    app.teardownCorky = vi.fn()
    app.onFileSelected = vi.fn()
    app.setFeedMode('file')
    expect(app.onFileSelected).toHaveBeenCalledWith('data_btc.json')
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

  test('teardownCorky DISPOSES the discover feed + every tab feed, then closes the ONE shared client', () => {
    const discover = mkFeed()
    const tabFeed = mkFeed()
    const client = { close: vi.fn() }
    const app = mkApp({
      corkyClient: client,
      corkyDiscoverFeed: discover,
      chartTabs: [{ id: 'ct-1', chart: {}, corkyFeed: tabFeed }],
    })
    app.teardownCorky()
    // Feeds are DISPOSED (unsubscribe + detach), NOT destroyed — destroy() would
    // each close the shared socket. The App closes the one client exactly once.
    expect(tabFeed.dispose).toHaveBeenCalled()
    expect(tabFeed.destroy).not.toHaveBeenCalled()
    expect(discover.dispose).toHaveBeenCalled()
    expect(client.close).toHaveBeenCalledTimes(1)
    expect(app.chartTabs[0].corkyFeed).toBeNull()   // released
  })
})

describe('runtime-id targeting + ride-through retry', () => {
  const STATES = [{ venue: 'bitfinex', symbol: 'tBTCUSD', runtime_id: 'public-market-main', indicators: [] }]

  test('_corkyRuntimeId resolves the owning runtime from discovery', () => {
    const app = mkApp({ corkyStates: STATES })
    expect(app._corkyRuntimeId('bitfinex', 'tBTCUSD')).toBe('public-market-main')
    expect(app._corkyRuntimeId('bitfinex', 'tETHUSD')).toBeUndefined()
  })

  test('corkySelect does NOT thread target_runtime_id into subscribe (self-threads from cache)', async () => {
    const feed = mkFeed()
    const app = mkApp({ corkyStates: STATES, corkyFeed: feed })
    await app.corkySelect({ venue: 'bitfinex', symbol: 'tBTCUSD', timeframe: '1m', indicators: [] })
    // subscribe_candles self-threads the runtime; forcing it onto the control
    // path (target_runtime_id) breaks loads during a runtime restart.
    expect(feed.subscribe.mock.calls[0][0].target_runtime_id).toBeUndefined()
  })

  test('onCorkyAddTimeframe patches with the owning runtime_id', async () => {
    const patch = vi.fn(async () => ({}))
    const app = mkApp({ corkyStates: STATES, corkyFeed: mkFeed(), corkyClient: { patchCandleState: patch } })
    app.corkyDiscover = vi.fn(async () => STATES)
    await app.onCorkyAddTimeframe({ venue: 'bitfinex', symbol: 'tBTCUSD', timeframe: '5m' })
    expect(patch.mock.calls[0][0].target_runtime_id).toBe('public-market-main')
    expect(patch.mock.calls[0][0].timeframes).toEqual(['5m'])
  })

  test('a retryable subscribe error schedules a ride-through retry (no error surfaced)', async () => {
    vi.useFakeTimers()
    const feed = mkFeed({ subscribe: vi.fn(async () => { throw Object.assign(new Error('stale'), { retryable: true }) }) })
    const app = mkApp({ corkyStates: STATES, corkyFeed: feed })
    await app.corkySelect({ venue: 'bitfinex', symbol: 'tBTCUSD', timeframe: '1m', indicators: [] })
    expect(app.corkyError).toBeNull()
    expect(app.corkyProgress.phase).toBe('retrying')
    expect(app._stream.retries).toBe(1)
    app._corkyCancelSelectRetry()
    vi.useRealTimers()
  })

  test('a non-retryable error surfaces immediately', async () => {
    const feed = mkFeed({ subscribe: vi.fn(async () => { throw Object.assign(new Error('bad'), { retryable: false }) }) })
    const app = mkApp({ corkyStates: STATES, corkyFeed: feed })
    await app.corkySelect({ venue: 'bitfinex', symbol: 'tBTCUSD', timeframe: '1m', indicators: [] })
    expect(app.corkyError).toEqual({ message: 'bad', retryable: false })
  })

  test('after the fast attempts it surfaces a CLEAR error but keeps retrying in the background', async () => {
    vi.useFakeTimers()
    const feed = mkFeed({ subscribe: vi.fn(async () => { throw Object.assign(new Error('stale'), { retryable: true }) }) })
    const app = mkApp({ corkyStates: STATES, corkyFeed: feed })
    app._stream.retries = 3   // past the FAST phase → slow (clear error, keep retrying)
    await app.corkySelect({ venue: 'bitfinex', symbol: 'tBTCUSD', timeframe: '1m', indicators: [] })
    // slow phase: visible actionable error (not an endless spinner), retry still armed
    expect(app.corkyProgress).toBeNull()
    expect(app.corkyError.retryable).toBe(true)
    expect(app.corkyError.message).toMatch(/gateway\/runtime issue/i)
    expect(app.corkyError.message).toContain('stale')   // surfaces the real reason
    expect(app._stream.retryKeepSpinner).toBe(false)   // spinner off, error shown
    expect(app._stream.retryTimer).toBeTruthy()         // background retry scheduled
    app._corkyCancelSelectRetry()
    vi.useRealTimers()
  })

  test('onCorkyRetry re-discovers AND re-selects the pending selection', async () => {
    const feed = mkFeed()
    const app = mkApp({ corkyStates: STATES, corkyFeed: feed })
    app._stream.retryOpts = { venue: 'bitfinex', symbol: 'tBTCUSD', timeframe: '1m' }   // active tab's remembered retry
    app.corkyDiscover = vi.fn(async () => STATES)
    app.onCorkyRetry()
    await Promise.resolve(); await Promise.resolve()
    expect(app.corkyDiscover).toHaveBeenCalledWith('bitfinex')
    expect(feed.subscribe).toHaveBeenCalled()
  })

  test('_corkyCancelSelectRetry clears a pending retry + counter', () => {
    const app = mkApp()
    app._stream.retries = 2
    app._stream.retryKeepSpinner = true
    app._stream.retryTimer = setTimeout(() => {}, 9999)
    app._corkyCancelSelectRetry()
    expect(app._stream.retries).toBe(0)
    expect(app._stream.retryKeepSpinner).toBe(false)
    expect(app._stream.retryTimer).toBeNull()
  })
})

describe('corkySelect staleness epoch (M27)', () => {
  test('a superseded select resolving LATE cannot overwrite the live selection', async () => {
    let resolveA
    const feed = mkFeed({
      subscribe: vi.fn()
        .mockImplementationOnce(() => new Promise((res) => { resolveA = res })) // A hangs
        .mockImplementationOnce(async () => ({ enabledLayers: new Set(), sub: 'B' })),
    })
    const app = mkApp({ corkyStates: [], corkyFeed: feed })
    const pA = app.corkySelect({ venue: 'v', symbol: 'A', timeframe: '1m', indicators: [] })
    await new Promise((r) => setTimeout(r, 0))   // let A reach its (hanging) subscribe
    const pB = app.corkySelect({ venue: 'v', symbol: 'B', timeframe: '1m', indicators: [] })
    await pB
    expect(app.corkyLast.symbol).toBe('B')
    const handleB = app.corkyHandle
    resolveA({ enabledLayers: new Set(), sub: 'A' })  // A resolves late
    await pA
    expect(app.corkyHandle).toBe(handleB)             // not clobbered by stale A
    expect(app.corkyLast.symbol).toBe('B')
  })

  test('teardown invalidates an in-flight select (no retry re-arm, no error)', async () => {
    let rejectA
    const feed = mkFeed({ subscribe: vi.fn(() => new Promise((_, rej) => { rejectA = rej })) })
    const app = mkApp({ corkyStates: [], corkyFeed: feed })
    app.chartTabs = [app]   // teardownCorky bumps each tab's epoch + cancels its retry
    const p = app.corkySelect({ venue: 'v', symbol: 'A', timeframe: '1m', indicators: [] })
    await new Promise((r) => setTimeout(r, 0))   // let the select reach its subscribe
    app.teardownCorky()
    rejectA(Object.assign(new Error('conn lost'), { retryable: true }))
    await p
    expect(app._stream.retryTimer).toBeFalsy()   // no post-teardown retry armed
    expect(app.corkyError).toBeNull()
  })
})
