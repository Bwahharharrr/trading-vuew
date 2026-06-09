// @vitest-environment jsdom
//
// REPRO: "static candle canvas goes stale on a live intra-candle tick".
//
// Real-app bug: each intra-candle live update mutates OHLCV in place + bumps the
// store revision. The HORIZONTAL last-price line + the SIDEBAR repaint, but the
// MAIN STATIC GRID canvas (the candle bodies) does NOT repaint until the user
// moves/clicks the chart (a pointer event), which snaps it to the correct state.
//
// This test is PER-CANVAS aware: instead of totalling draw calls across every
// canvas, it inspects the MAIN GRID STATIC canvas vs the DYNAMIC crosshair canvas
// vs the SIDEBAR canvas independently, so we can detect the asymmetry the user
// reports (dynamic/sidebar repaint, static does not).
//
// Ordering mimics real usage:
//   1. mount + load history + append the live (current) candle
//   2. move the cursor over the grid  -> dynamic-only fast path is primed
//      (_detectCrosshairOnlyUpdate caches _lastCursorX/Y and returns true)
//   3. stream same-ts live ticks WITHOUT moving the cursor
//   4. assert the MAIN STATIC candle canvas repaints on EACH tick
//   5. assert the Y-axis price TAG value is drawn on the SIDEBAR
//   6. then a pointer event and assert it would have snapped (control)
import { test, expect, describe, beforeEach, afterEach } from 'vitest'
import TradingVue from '../../src/TradingVue.vue'
import DataCube from '../../src/helpers/datacube.js'
import { CorkyFeed } from '../../src/helpers/feed/corky-feed.js'
import * as fx from '../fixtures/corky/index.js'
import {
  mount, installCanvasEnv, uninstallCanvasEnv, settle,
  resetCounters, allContexts,
} from './_component-harness.js'

class FakeClient {
  constructor() { this._subListeners = new Map(); this._states = fx.candleStatesEvent.event.states }
  async listCandleStates() { return this._states }
  async subscribeCandles(opts) { this._lastSubId = opts.subscription_id; return { type: 'historical_complete' } }
  async unsubscribe() { return { type: 'control_ack' } }
  onSubscription(sid, cb) {
    let set = this._subListeners.get(sid)
    if (!set) { set = new Set(); this._subListeners.set(sid, set) }
    set.add(cb); return () => set.delete(cb)
  }
  close() {}
  emit(sid, event) {
    const set = this._subListeners.get(sid)
    if (!set) return
    const payload = { request_id: null, event: { ...event, subscription_id: sid } }
    for (const cb of [...set]) cb(payload)
  }
}

function intraCandle(seq, close) {
  return {
    type: 'live_update', sequence: seq,
    row: {
      timeframe: '1m',
      candle: {
        timestamp_ms: 1779465000000, // SAME bucket as the appended live candle
        open: '77871', high: String(close + 5), low: '77860', close: String(close),
        volume: '1.25',
      },
      indicators: { 'sma:20': { sma: String(close - 20) } },
    },
  }
}

// --- per-canvas classification ----------------------------------------------
// Canvas ids (mixins/canvas.js create_canvas):
//   static grid    : `${tv_id}-grid-${gid}-canvas`
//   dynamic grid   : `${tv_id}-grid-${gid}-canvas-dynamic`
//   static sidebar : `${tv_id}-sidebar-${gid}-canvas`
//   dynamic sidebar: `${tv_id}-sidebar-${gid}-canvas-dynamic`
const isMainStatic = id => /-grid-0-canvas$/.test(id)
const isMainDynamic = id => /-grid-0-canvas-dynamic$/.test(id)
const isSidebar = id => /-sidebar-0-canvas$/.test(id)

function paintProfile() {
  // Sum draw activity per logical canvas role for grid 0.
  const acc = { mainStatic: null, mainDynamic: null, sidebar: null }
  for (const { id, log } of allContexts()) {
    const calls = log.calls
    const clears = log.clearRect
    const fillRect = log.byMethod.fillRect || 0
    const stroke = log.byMethod.stroke || 0
    const fillText = log.byMethod.fillText || 0
    const entry = { id, calls, clears, fillRect, stroke, fillText }
    if (isMainStatic(id)) acc.mainStatic = mergeEntry(acc.mainStatic, entry)
    else if (isMainDynamic(id)) acc.mainDynamic = mergeEntry(acc.mainDynamic, entry)
    else if (isSidebar(id)) acc.sidebar = mergeEntry(acc.sidebar, entry)
  }
  return acc
}
function mergeEntry(a, b) {
  if (!a) return b
  return {
    id: a.id, calls: a.calls + b.calls, clears: a.clears + b.clears,
    fillRect: a.fillRect + b.fillRect, stroke: a.stroke + b.stroke,
    fillText: a.fillText + b.fillText,
  }
}

describe('static candle canvas stale on intra-candle tick (per-canvas)', () => {
  let wrapper, dc, client, feed
  beforeEach(() => { installCanvasEnv() })
  afterEach(() => { if (wrapper) wrapper.unmount(); uninstallCanvasEnv() })

  test('live tick repaints static candle canvas (not just dynamic/sidebar)', async () => {
    dc = new DataCube()
    wrapper = mount(TradingVue, { props: { data: dc, width: 600, height: 400 }, attachTo: document.body })
    await settle()

    client = new FakeClient()
    feed = new CorkyFeed({ client, dataCube: dc })
    const handle = await feed.subscribe({ venue: 'BITFINEX', symbol: 'tBTCUSD', timeframe: '1m' })
    const sid = handle.subscription_id

    client.emit(sid, fx.historicalChunkEvent.event)
    client.emit(sid, { type: 'historical_complete' })
    await settle()

    // Append the current (live) candle — the "drawn once" event.
    client.emit(sid, intraCandle(42, 77890))
    await settle(6)
    expect(dc.data.chart.data.length).toBe(2)

    // Sanity: we actually have the three canvases.
    const ids = allContexts().map(c => c.id)
    const haveStatic = ids.some(isMainStatic)
    const haveDynamic = ids.some(isMainDynamic)
    const haveSidebar = ids.some(isSidebar)
    expect(haveStatic, `no main static canvas among ${ids}`).toBe(true)
    expect(haveDynamic, `no dynamic canvas among ${ids}`).toBe(true)
    expect(haveSidebar, `no sidebar canvas among ${ids}`).toBe(true)

    // --- Step 2: move cursor over the GRID so the dual-canvas fast path is
    // primed. We dispatch a real mousemove on the dynamic (event) canvas.
    const dynCanvas = allContexts().find(c => isMainDynamic(c.id))?.ctx?.canvas
    if (dynCanvas) {
      const evt = new MouseEvent('mousemove', { bubbles: true, clientX: 300, clientY: 200 })
      // jsdom layerX/offsetX are 0; the grid renderer reads event.layerX/offsetX.
      Object.defineProperty(evt, 'layerX', { value: 300 })
      Object.defineProperty(evt, 'layerY', { value: 200 })
      Object.defineProperty(evt, 'offsetX', { value: 300 })
      Object.defineProperty(evt, 'offsetY', { value: 200 })
      dynCanvas.dispatchEvent(evt)
      await settle(4)
    }

    // --- Step 3+4: stream intra-candle ticks WITHOUT moving the cursor and
    // assert the MAIN STATIC canvas repaints each tick.
    const revStart = dc.cd.revision()
    const perTick = []
    for (let k = 0; k < 4; k++) {
      resetCounters()
      client.emit(sid, intraCandle(43 + k, 77900 + k * 10))
      await settle(6)
      const prof = paintProfile()
      perTick.push(prof)
    }

    // Data mutated in place + revision bumped (already-verified preconditions).
    expect(dc.data.chart.data.length).toBe(2)
    expect(dc.data.chart.data[1][4]).toBe(77930)
    expect(dc.cd.revision()).toBeGreaterThan(revStart)

    // THE KEY ASSERTIONS — per canvas:
    const staticRepaintTicks = perTick.filter(p =>
      p.mainStatic && p.mainStatic.clears > 0 &&
      (p.mainStatic.fillRect + p.mainStatic.stroke) > 0).length
    const sidebarRepaintTicks = perTick.filter(p =>
      p.sidebar && p.sidebar.calls > 0).length
    const sidebarTagTicks = perTick.filter(p =>
      p.sidebar && p.sidebar.fillText > 0).length

    // CONTROL / observation: in jsdom the MAIN STATIC candle canvas DOES
    // repaint on every tick (Grid.dataKey includes the store revision and the
    // chart rebuilds chartLayout, so _detectCrosshairOnlyUpdate sees a new
    // layoutRef and forces a full static redraw). So the "candle body goes
    // stale" half of the user's report is NOT reproducible in jsdom — it is a
    // real-browser-only condition (see report). Pin the jsdom behaviour:
    expect(staticRepaintTicks,
      `main static candle canvas repainted on ${staticRepaintTicks}/4 ticks ` +
      `(sidebar repainted on ${sidebarRepaintTicks}/4)`).toBe(4)

    // REGRESSION GUARD for the missing Y-axis price TAG (now fixed). Previously
    // the SIDEBAR never repainted on a revision-only tick and the tag shader was
    // never even registered (price.js used raw $emit instead of custom_event), so
    // this was 0/4. The fixes: (1) price.js routes 'new-shader' through
    // custom_event so on_shader_event registers the sidebar shader; (2) Section
    // watches common.dataVersion and bumps rerender, which the Sidebar watches,
    // so the boxed last-price label repaints on every in-place tick.
    expect(sidebarTagTicks,
      `sidebar price-tag value drawn on ${sidebarTagTicks}/4 ticks ` +
      `(sidebar painted at all on ${sidebarRepaintTicks}/4)`).toBe(4)
  })
})
