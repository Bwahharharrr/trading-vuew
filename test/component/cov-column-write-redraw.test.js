// @vitest-environment jsdom
//
// COLUMN-write redraw gate (vr-3 Strategy B / markRaw boundary).
//
// applyLiveUpdate's `upsertColumn` path writes ONE field of a MULTI-column view
// overlay (Splines/Channel/Zones built from a view.layers layer with >1 field):
// it mutates the existing `[ts, c1..cn]` row IN PLACE (rowArr[col] = value)
// rather than replacing the array. After Strategy B made the inner row arrays
// non-reactive (markRaw), that in-place column write is invisible to Vue's deep
// reactivity — so the redraw MUST come from the explicit revision signal
// (dc.touchData -> cd.invalidate -> rev++), exactly as for OHLCV in-place writes.
//
// This pins: a same-ts column write (a) actually lands in the right column of the
// right row, (b) bumps the revision, and (c) repaints the mounted chart. It also
// asserts the boundary invariant directly — the overlay row arrays are markRaw'd
// (non-reactive) while the cube root / onchart container stay reactive — so a
// regression that re-proxies the rows (or fails to wrap a freshly-created array)
// is caught here, not silently.
import { test, expect, describe, beforeEach, afterEach } from 'vitest'
import { isReactive, toRaw } from 'vue'
import TradingVue from '../../src/TradingVue.vue'
import DataCube from '../../src/helpers/datacube.js'
import { buildChartData, applyLiveUpdate } from '../../src/helpers/feed/corky-ingest.js'
import {
  mount, installCanvasEnv, uninstallCanvasEnv, settle,
  totalClearRects, methodTotal, resetCounters,
} from './_component-harness.js'

const T0 = 1_700_000_000_000
const TF = 60_000

// History rows carrying a 2-field MACD instance (macd + signal lines share an
// overlay → a multi-COLUMN `[ts, macd, signal]` row array) plus a 2-field
// channel-like instance (upper + lower → `[ts, upper, lower]`). Both exercise
// upsertColumn (ncol === 2).
function makeRows(n) {
  return Array.from({ length: n }, (_, i) => {
    const t = T0 + i * TF
    return {
      timeframe: '1m',
      candle: { timestamp_ms: t, open: '100', high: '102', low: '98', close: '101', volume: '5' },
      indicators: {
        MACD: { macd: String(1 + i * 0.01), signal: String(0.5 + i * 0.01) },
        'bb:20': { upper: String(110 + i), lower: String(90 - i) },
      },
    }
  })
}

const view = (kind, layers) => ({ kind, view: { version: 1, layers } })

const VIEWS = {
  // MACD: two fields on ONE onchart line overlay → multi-column rows.
  MACD: view('macd', [
    { id: 'lines', label: 'MACD', kind: 'line', fields: ['macd', 'signal'], visible_by_default: true },
  ]),
  // Bollinger-ish band: two fields on ONE Channel overlay → multi-column rows
  // (layer kind 'band' → Channel; the upsertColumn shape is still [ts, c1, c2]).
  'bb:20': view('bb', [
    { id: 'band', label: 'Band', kind: 'band', fields: ['upper', 'lower'], visible_by_default: true },
  ]),
}

// Find a built view overlay by its corkyLayerId across onchart+offchart.
function overlayByLayerId(cd, layerId) {
  for (const pane of ['onchart', 'offchart']) {
    for (const ov of cd[pane] || []) {
      if (ov.settings && ov.settings.corkyLayerId === layerId) return ov
    }
  }
  return null
}

// A live_update carrying only ONE field of a multi-field instance, at the GIVEN
// (already-present) ts — forces upsertColumn down its replace-existing-row,
// in-place `rowArr[col] = value` branch.
function liveColumnUpdate(seq, ts, instanceKey, field, value) {
  return {
    type: 'live_update', sequence: seq,
    subscription_id: 'sub-1',
    row: {
      timeframe: '1m',
      candle: { timestamp_ms: ts, open: '100', high: '103', low: '97', close: '101', volume: '6' },
      indicators: { [instanceKey]: { [field]: String(value) } },
    },
  }
}

describe('column-write redraw (multi-field overlay, in-place upsertColumn)', () => {
  let wrapper, dc, cd

  beforeEach(() => {
    installCanvasEnv()
    cd = buildChartData(makeRows(40), { views: VIEWS })
    dc = new DataCube(cd, { scripts: false, validation: 'off' })
  })
  afterEach(() => { if (wrapper) wrapper.unmount(); uninstallCanvasEnv() })

  async function mountChart() {
    wrapper = mount(TradingVue, { props: { data: dc, width: 800, height: 600 }, attachTo: document.body })
    await settle(8)
  }

  test('multi-field overlays really are multi-COLUMN (preconditions)', async () => {
    await mountChart()
    const macd = overlayByLayerId(dc.data, 'lines')
    const band = overlayByLayerId(dc.data, 'band')
    expect(macd).toBeTruthy()
    expect(band).toBeTruthy()
    // corkyFields drives the column index used by upsertColumn.
    expect(macd.settings.corkyFields).toEqual(['macd', 'signal'])
    expect(band.settings.corkyFields).toEqual(['upper', 'lower'])
    // Rows are [ts, c1, c2] (one slot per field) — the upsertColumn shape.
    expect(macd.data[0].length).toBe(3)
    expect(band.data[0].length).toBe(3)
  })

  test('BOUNDARY: overlay row arrays are markRaw (non-reactive); container stays reactive', async () => {
    await mountChart()
    // Read through the COMPONENT's reactive view of the cube (Vue wraps the
    // DataCube data object when it becomes a prop) — that is where reactivity
    // actually lives, and where the markRaw boundary must hold: the cube root
    // and the onchart CONTAINER array are reactive proxies (they drive Chart.vue
    // structure computeds + the dc_core $watch-es), but the inner row arrays are
    // NOT — that is the whole point of Strategy B (no ~6N per-row proxies).
    const reactiveData = wrapper.vm.$refs.chart.data
    expect(isReactive(reactiveData)).toBe(true)
    expect(isReactive(reactiveData.onchart)).toBe(true)

    const macd = overlayByLayerId(reactiveData, 'lines')
    const band = overlayByLayerId(reactiveData, 'band')
    expect(macd).toBeTruthy()
    expect(band).toBeTruthy()
    // The overlay OBJECT is reactive (settings flips etc. must react)...
    expect(isReactive(macd)).toBe(true)
    // ...but its inner .data/.raw ROW arrays must NOT be reactive proxies.
    expect(isReactive(macd.data)).toBe(false)
    expect(isReactive(macd.raw)).toBe(false)
    expect(isReactive(band.data)).toBe(false)
    // markRaw is irreversible: toRaw is an identity on an already-raw array.
    expect(toRaw(macd.data)).toBe(macd.data)
  })

  test('in-place COLUMN write (macd field) repaints + bumps the revision', async () => {
    await mountChart()
    const macd = overlayByLayerId(dc.data, 'lines')
    const i = macd.data.length - 1
    const ts = macd.data[i][0]
    const beforeMacd = macd.data[i][1]   // col 1 = 'macd'
    const beforeSignal = macd.data[i][2] // col 2 = 'signal' — must be untouched
    const sameLength = macd.data.length

    const revStart = dc.cd.revision()
    resetCounters()

    // Write ONLY the macd column of the current (existing) row.
    const lastSeq = {}
    const res = applyLiveUpdate(dc.data, liveColumnUpdate(1, ts, 'MACD', 'macd', 999), lastSeq)
    dc.touchData()
    await settle(6)

    // (a) The write LANDED in the right column of the right row, in place.
    expect(res.applied).toBe(true)
    expect(macd.data.length).toBe(sameLength)       // replaced in place, no append
    expect(macd.data[i][0]).toBe(ts)
    expect(macd.data[i][1]).toBe(999)               // macd column updated
    expect(macd.data[i][1]).not.toBe(beforeMacd)
    expect(macd.data[i][2]).toBe(beforeSignal)      // signal column preserved

    // (b) Revision bumped — the explicit invalidation Strategy B relies on.
    expect(dc.cd.revision()).toBeGreaterThan(revStart)

    // (c) The chart actually repainted (clear + candle/line draws).
    expect(totalClearRects()).toBeGreaterThan(0)
    expect(methodTotal('fillRect') + methodTotal('stroke')).toBeGreaterThan(0)
  })

  test('in-place COLUMN write on a SECOND multi-field overlay (channel) repaints', async () => {
    await mountChart()
    const band = overlayByLayerId(dc.data, 'band')
    const i = band.data.length - 1
    const ts = band.data[i][0]
    const beforeUpper = band.data[i][1]
    const beforeLower = band.data[i][2]

    const revStart = dc.cd.revision()
    resetCounters()

    // Write ONLY the 'lower' column (col index 2) of the existing last row.
    const lastSeq = {}
    applyLiveUpdate(dc.data, liveColumnUpdate(1, ts, 'bb:20', 'lower', -42), lastSeq)
    dc.touchData()
    await settle(6)

    expect(band.data[i][2]).toBe(-42)               // lower column written
    expect(band.data[i][2]).not.toBe(beforeLower)
    expect(band.data[i][1]).toBe(beforeUpper)       // upper column preserved
    expect(dc.cd.revision()).toBeGreaterThan(revStart)
    expect(totalClearRects()).toBeGreaterThan(0)
  })

  test('streamed column writes each bump the revision (markRaw rows stay live)', async () => {
    await mountChart()
    const macd = overlayByLayerId(dc.data, 'lines')
    const i = macd.data.length - 1
    const ts = macd.data[i][0]

    const lastSeq = {}
    let prevRev = dc.cd.revision()
    let bumpedTicks = 0
    for (let k = 0; k < 4; k++) {
      resetCounters()
      applyLiveUpdate(dc.data, liveColumnUpdate(k + 1, ts, 'MACD', 'macd', 100 + k), lastSeq)
      dc.touchData()
      await settle(6)
      const rev = dc.cd.revision()
      if (rev > prevRev) bumpedTicks++
      prevRev = rev
    }

    // The last write is the value living in the column now (in-place, no append).
    expect(macd.data.length).toBe(40)
    expect(macd.data[i][1]).toBe(103)
    // Every streamed column write triggered an invalidation.
    expect(bumpedTicks).toBe(4)
  })
})
