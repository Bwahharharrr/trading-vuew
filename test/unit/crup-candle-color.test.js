// CRUP bull/bear-detection candle colouring (color_rule: bull_bear_detection).
//
// The layer drives candle colour from TWO boolean-ish outputs (bull_field +
// bear_field, named in the style — never hardcoded). The old code had no such
// rule: the layer fell through to single-field THRESHOLD mode reading only
// fields[0] (the bull field), so bear candles were NEVER painted red — the
// user-visible bug this suite pins. Wire values are STRINGS ("1"/"0"/"1.0").
import { test, expect, describe } from 'vitest'
import {
  candleColorBullBear, bullBearColorOf,
} from '../../src/helpers/feed/indicator-catalog.js'
import { buildChartData, applyLiveUpdate } from '../../src/helpers/feed/corky-ingest.js'

// The layer spec EXACTLY as the gateway publishes it for CRUP (MTF form; the
// single-tf form differs only in id — the handler is rule-generic).
const CRUP_LAYER = {
  id: 'crup_mtf_candle_color',
  label: 'CRUP candle color',
  kind: 'candle_color',
  target: { surface: 'price' },
  fields: ['bull_detected_now', 'bear_detected_now'],
  visible_by_default: true,
  style: {
    color_rule: 'bull_bear_detection',
    bull_field: 'bull_detected_now',
    bear_field: 'bear_detected_now',
    bull_color: '#00e676',
    bear_color: '#d64545',
    both_color: '#d97706',
  },
}
const views = () => ({ CRUP: { kind: 'crup', view: { version: 1, layers: [CRUP_LAYER] } } })

describe('rule parse + resolve (style-driven, nothing hardcoded)', () => {
  const bb = candleColorBullBear(CRUP_LAYER.style)

  test('parses fields + colours from the style map', () => {
    expect(bb).toEqual({
      bullField: 'bull_detected_now', bearField: 'bear_detected_now',
      bullColor: '#00e676', bearColor: '#d64545', bothColor: '#d97706',
    })
    // not this rule → null so the caller falls through to palette/threshold
    expect(candleColorBullBear({ color_field: 'x', color_1: '#fff' })).toBeNull()
    expect(candleColorBullBear(undefined)).toBeNull()
  })

  test('bull only → bull_color', () => {
    expect(bullBearColorOf('1', '0', bb)).toBe('#00e676')
  })

  test('bear only → bear_color (THE bug: this never painted before)', () => {
    expect(bullBearColorOf('0', '1', bb)).toBe('#d64545')
  })

  test('both → both_color', () => {
    expect(bullBearColorOf('1', '1', bb)).toBe('#d97706')
  })

  test('neither → null (candle keeps its default colouring)', () => {
    expect(bullBearColorOf('0', '0', bb)).toBeNull()
    expect(bullBearColorOf(null, undefined, bb)).toBeNull()
  })

  test('string-typed wire values: "1.0", floats, junk, missing', () => {
    expect(bullBearColorOf('1.0', '0', bb)).toBe('#00e676')
    expect(bullBearColorOf('0', '1.0', bb)).toBe('#d64545')
    expect(bullBearColorOf('0.5', '0', bb)).toBe('#00e676')   // >0 counts
    expect(bullBearColorOf('abc', '1', bb)).toBe('#d64545')   // unparseable → 0
    expect(bullBearColorOf(undefined, '1', bb)).toBe('#d64545') // missing → 0
  })
})

// ── ground truth (Bitfinex tBTCUSD 1h, verified on the wire) ────────────────
const TRUTH = [
  // [ts, bull, bear, expected paint]
  [1780934400000, '0', '1', '#d64545'],   // Jun 8 16:00 — bear → red
  [1780988400000, '0', '1', '#d64545'],   // Jun 9 07:00 — bear → red
  [1781074800000, '1', '0', '#00e676'],   // Jun 10 07:00 — bull → green
  [1781096400000, '1', '0', '#00e676'],   // Jun 10 13:00 — bull → green
  [1781136000000, '1', '0', '#00e676'],   // Jun 11 00:00 — bull → green
  [1781139600000, '0', '0', null],        // neither → untouched
]

function rows() {
  return TRUTH.map(([ts, bull, bear]) => ({
    timeframe: '1h',
    candle: { timestamp_ms: ts, open: '10', high: '12', low: '9', close: '11', volume: '5' },
    indicators: {
      CRUP: { bull_detected_now: bull, bear_detected_now: bear },
    },
  }))
}

describe('build: historical CRUP colours (acceptance ground truth)', () => {
  test('bear candles red, bull candles green, neither untouched', () => {
    const built = buildChartData(rows(), { views: views() })
    const cc = built._candleColor
    expect(cc.length).toBe(1)
    expect(cc[0].bullBear).toBeTruthy()
    expect(cc[0].layerId).toBe('crup_mtf_candle_color')
    for (const [ts, , , expected] of TRUTH) {
      if (expected === null) {
        expect(cc[0].byTs.has(ts)).toBe(false)
      } else {
        expect(cc[0].byTs.get(ts)).toBe(expected)
      }
    }
  })
})

describe('live: CRUP colours on live_update', () => {
  function liveRow(ts, bull, bear, seq) {
    return {
      subscription_id: 's', sequence: seq,
      row: {
        timeframe: '1h',
        candle: { timestamp_ms: ts, open: '10', high: '12', low: '9', close: '11', volume: '5' },
        indicators: { CRUP: { bull_detected_now: bull, bear_detected_now: bear } },
      },
    }
  }

  test('active CRUP stamps the live candle red on a bear detection', () => {
    const built = buildChartData(rows(), { views: views() })
    built._candleColorActive = new Set([built._candleColor[0].instanceKey])
    const nextTs = 1781143200000
    applyLiveUpdate(built, liveRow(nextTs, '0', '1', 1), {})
    const candle = built.chart.data.find((c) => c[0] === nextTs)
    expect(candle).toBeTruthy()
    expect(candle[6]).toBe('#d64545')                       // slot-6 stamp
    expect(built._candleColor[0].byTs.get(nextTs)).toBe('#d64545')
  })

  test('a neither-detected live candle clears any prior colour (no carry-over)', () => {
    const built = buildChartData(rows(), { views: views() })
    built._candleColorActive = new Set([built._candleColor[0].instanceKey])
    const nextTs = 1781143200000
    applyLiveUpdate(built, liveRow(nextTs, '0', '1', 1), {})    // red first
    applyLiveUpdate(built, liveRow(nextTs, '0', '0', 2), {})    // detection withdrawn
    expect(built._candleColor[0].byTs.has(nextTs)).toBe(false)
  })
})

describe('layer toggle keying (regression: toggling totalcount must not hit bullcount)', () => {
  test('setLayerEnabled affects EXACTLY the layer id it is given', async () => {
    const { CorkyFeed } = await import('../../src/helpers/feed/corky-feed.js')
    const { default: DataCube } = await import('../../src/helpers/datacube.js')
    const dc = new DataCube(
      { chart: { type: 'Candles', data: [] }, onchart: [], offchart: [] },
      { scripts: false, validation: 'off' })
    const feed = new CorkyFeed({
      client: { listCandleStates: async () => [], onSubscription: () => () => {}, on: () => () => {}, close() {} },
      dataCube: dc, subscribeTimeoutMs: 0,
    })
    const mkOv = (layerId) => ({
      name: layerId, type: 'Spline', data: [],
      settings: {
        corkyKind: 'CRUP', corkyInstance: 'CRUP', corkyLayerId: layerId,
        corkyKey: `CRUP#${layerId}`, corkyView: true, corkyVisibleDefault: true,
      },
    })
    const bull = mkOv('crup_mtf_value_bullcount')
    const total = mkOv('crup_mtf_value_totalcount')
    const handle = {
      built: { onchart: [], offchart: [bull, total] },
      addedOverlays: new Set([bull, total]),
      enabledLayers: new Set(['CRUP#crup_mtf_value_bullcount', 'CRUP#crup_mtf_value_totalcount']),
      enabledKinds: new Set(['CRUP']), hiddenLayers: new Set(),
    }
    dc.data.offchart.push(bull, total)
    // toggle TOTALCOUNT off — bullcount must remain untouched
    const applied = feed.setLayerEnabled(handle, 'crup_mtf_value_totalcount', false, 'CRUP')
    expect(applied).toBe(true)
    expect(handle.addedOverlays.has(bull)).toBe(true)     // untouched
    expect(handle.addedOverlays.has(total)).toBe(false)   // removed
    expect(dc.data.offchart).toContain(bull)
    expect(dc.data.offchart).not.toContain(total)
    expect(handle.enabledLayers.has('CRUP#crup_mtf_value_bullcount')).toBe(true)
    expect(handle.hiddenLayers.has('CRUP#crup_mtf_value_totalcount')).toBe(true)
    expect(handle.hiddenLayers.has('CRUP#crup_mtf_value_bullcount')).toBe(false)
  })
})
