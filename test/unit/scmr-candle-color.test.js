// SCMR / SCMR-INV palette candle colouring.
//
// Candle colour is resolved from the view spec's PUBLISHED palette — the
// scmr_candle_color layer's style names the id-carrying output (color_field) and
// maps each numeric type-id to color_{id}/label_{id}. Nothing is hardcoded; the
// palette is re-read from the layer style on every build. Warmup / NaN / unknown
// ids fall back to the default (uncoloured) candle and never inherit a neighbour.
import { test, expect, describe } from 'vitest'
import {
  candleColorPalette, paletteColorOf, paletteLabelOf
} from '../../src/helpers/feed/indicator-catalog.js'
import { buildChartData, applyLiveUpdate } from '../../src/helpers/feed/corky-ingest.js'
import { CorkyFeed } from '../../src/helpers/feed/corky-feed.js'
import DataCube from '../../src/helpers/datacube.js'

// The palette exactly as the layer publishes it (a representative subset).
const SCMR_STYLE = {
  color_field: 'candle_type_color', label_field: 'candle_type_name',
  color_0: '#9FB4B4', label_0: 'Neutral',
  color_1: '#FFFF00', label_1: 'Breakout',
  color_2: '#800080', label_2: 'Breakdown',
  color_6: '#FF00FF', label_6: 'Bearish Unconfirmed Reversal',
  color_7: '#FF00FF', label_7: 'Bearish Pivot Down',
  color_10: '#00FF00', label_10: 'Green',
  color_11: '#FF0000', label_11: 'Red'
}

const scmrLayer = (style = SCMR_STYLE) => ({
  id: 'scmr_candle_color', kind: 'candle_color', target: { surface: 'price' },
  fields: ['candle_type_color', 'candle_type_name', 'candle_type'],
  visible_by_default: true, style
})
const views = (style) => ({ SCMR: { kind: 'scmr', view: { version: 1, layers: [scmrLayer(style)] } } })

const T0 = 1_700_000_000_000; const TF = 60_000

// ids[i] → row i; id null = warmup (instance present, no outputs).
function makeRows(ids, instance = 'SCMR') {
  return ids.map((id, i) => ({
    timeframe: '1m',
    candle: { timestamp_ms: T0 + i * TF, open: '10', high: '12', low: '9', close: '11', volume: '5' },
    indicators: {
      [instance]: id == null ? {}
        : { candle_type_color: String(id), candle_type_name: String(id), candle_type: String(id) }
    }
  }))
}

describe('palette parse + resolve', () => {
  test('parses color_field + color_{id}/label_{id} from style', () => {
    const p = candleColorPalette(SCMR_STYLE)
    expect(p.colorField).toBe('candle_type_color')
    expect(p.labelField).toBe('candle_type_name')
    expect(p.colors['10']).toBe('#00FF00')
    expect(p.labels['10']).toBe('Green')
  })

  test('not a palette → null (caller falls back to threshold mode)', () => {
    expect(candleColorPalette({ neutral_band: '0.5' })).toBeNull() // no color_field
    expect(candleColorPalette({ color_field: 'x' })).toBeNull()    // color_field but no color_{id}
    expect(candleColorPalette(undefined)).toBeNull()
  })

  test('id → colour; decimal string truncates to int id', () => {
    const p = candleColorPalette(SCMR_STYLE)
    expect(paletteColorOf('10', p)).toBe('#00FF00')
    expect(paletteColorOf(11, p)).toBe('#FF0000')
    expect(paletteColorOf('10.9', p)).toBe('#00FF00')
    expect(paletteColorOf('0', p)).toBe('#9FB4B4')
  })

  test('missing / NaN / unknown id → null (default, never guess)', () => {
    const p = candleColorPalette(SCMR_STYLE)
    expect(paletteColorOf(null, p)).toBeNull()
    expect(paletteColorOf('', p)).toBeNull()
    expect(paletteColorOf('NaN', p)).toBeNull()
    expect(paletteColorOf('abc', p)).toBeNull()
    expect(paletteColorOf('5', p)).toBeNull() // no color_5 in this palette
  })

  test('ids 6 & 7 share a colour but are distinguished by label', () => {
    const p = candleColorPalette(SCMR_STYLE)
    expect(paletteColorOf('6', p)).toBe('#FF00FF')
    expect(paletteColorOf('7', p)).toBe('#FF00FF')
    expect(paletteLabelOf('6', p)).toBe('Bearish Unconfirmed Reversal')
    expect(paletteLabelOf('7', p)).toBe('Bearish Pivot Down')
  })
})

describe('build: historical candle colours from the palette', () => {
  test('byTs maps each candle ts → palette hex; source field is color_field', () => {
    const built = buildChartData(makeRows(['10', '11', '0']), { views: views() })
    const cc = built._candleColor
    expect(cc.length).toBe(1)
    expect(cc[0].field).toBe('candle_type_color') // reads style.color_field, not fields[0] blindly
    expect(cc[0].palette).toBeTruthy()
    const ts = built.chart.data.map(c => c[0])
    expect(cc[0].byTs.get(ts[0])).toBe('#00FF00') // id 10 → Green
    expect(cc[0].byTs.get(ts[1])).toBe('#FF0000') // id 11 → Red
    expect(cc[0].byTs.get(ts[2])).toBe('#9FB4B4') // id 0  → Neutral
    expect(cc[0].byTsLabel.get(ts[0])).toBe('Green') // label resolved for tooltip/legend
  })

  test('warmup (missing) and unknown id are NOT coloured (no carry-over)', () => {
    const built = buildChartData(makeRows(['10', null, '5']), { views: views() })
    const cc = built._candleColor[0]
    const ts = built.chart.data.map(c => c[0])
    expect(cc.byTs.get(ts[0])).toBe('#00FF00')
    expect(cc.byTs.has(ts[1])).toBe(false) // warmup → default, not the previous candle's colour
    expect(cc.byTs.has(ts[2])).toBe(false) // unknown id → default, no guess
  })

  test('palette comes from the layer style — a revised palette wins', () => {
    const revised = { color_field: 'candle_type_color', color_10: '#123456' }
    const built = buildChartData(makeRows(['10']), { views: views(revised) })
    expect(built._candleColor[0].byTs.get(built.chart.data[0][0])).toBe('#123456')
  })
})

describe('live: candle colours from the palette', () => {
  function liveRow(id, i) {
    return {
      subscription_id: 's', sequence: i,
      row: {
        timeframe: '1m',
        candle: { timestamp_ms: T0 + i * TF, open: '10', high: '12', low: '9', close: '11', volume: '5' },
        indicators: {
          SCMR: id == null ? {}
            : { candle_type_color: String(id), candle_type_name: String(id), candle_type: String(id) }
        }
      }
    }
  }
  function activeBuilt() {
    const built = buildChartData(makeRows(['10', '11']), { views: views() })
    built._candleColorActive = new Set([built._candleColor[0].instanceKey]) // SCMR enabled (by instance)
    return built
  }

  test('an active SCMR colours the live candle from the palette', () => {
    const built = activeBuilt()
    applyLiveUpdate(built, liveRow('1', 2), {}) // new candle, id 1 → Breakout #FFFF00
    const c = built.chart.data.find(x => x[0] === T0 + 2 * TF)
    expect(c[6]).toBe('#FFFF00')
  })

  test('warmup live row leaves the candle uncoloured (no previous colour reused)', () => {
    const built = activeBuilt()
    applyLiveUpdate(built, liveRow(null, 2), {})
    const c = built.chart.data.find(x => x[0] === T0 + 2 * TF)
    expect(c[6] == null || c[6] === '').toBe(true)
  })

  test('disabled SCMR does not colour the candle, but keeps byTs current for a later toggle', () => {
    const built = buildChartData(makeRows(['10']), { views: views() })
    built._candleColorActive = new Set() // disabled
    applyLiveUpdate(built, liveRow('11', 2), {})
    const c = built.chart.data.find(x => x[0] === T0 + 2 * TF)
    expect(c[6] == null || c[6] === '').toBe(true)                       // not stamped (disabled)
    expect(built._candleColor[0].byTs.get(T0 + 2 * TF)).toBe('#FF0000')  // but tracked
  })
})

// THE BUG: SCMR and SCMR(INV) are distinct instances (rows key them by
// display_label) but kindOf collapses BOTH to kind 'SCMR', and they share the
// layer id 'scmr_candle_color'. Keying candle colour by kind/layer-id let one
// overwrite the other → both candles showed the same colour. Fixed by keying the
// active-set + matching on the UNIQUE instance (display_label).
describe('SCMR vs SCMR(INV) must not collapse (the inverse bug)', () => {
  class FakeClient {
    onSubscription() { return () => {} }
    async listCandleStates() { return [] }
    async subscribeCandles() { return {} }
    async unsubscribe() {}
    close() {}
  }
  // Same palette/layer-id for both; the INVERSE instance emits inverse IDS
  // (id 11 Red ↔ id 10 Green) — exactly what the runtime publishes.
  function rows2(scmrIds, invIds) {
    return scmrIds.map((id, i) => ({
      timeframe: '1m',
      candle: { timestamp_ms: T0 + i * TF, open: '10', high: '12', low: '9', close: '11', volume: '5' },
      indicators: {
        SCMR: { candle_type_color: String(id), candle_type_name: String(id), candle_type: String(id) },
        'SCMR(INV)': { candle_type_color: String(invIds[i]), candle_type_name: String(invIds[i]), candle_type: String(invIds[i]) }
      }
    }))
  }
  const views2 = () => ({
    SCMR: { kind: 'scmr', view: { version: 1, layers: [scmrLayer()] } },
    'SCMR(INV)': { kind: 'scmr', view: { version: 1, layers: [scmrLayer()] } } // same kind + layer id
  })
  function buildTwo() {
    return buildChartData(rows2(['11'], ['10']), { views: views2() }) // SCMR=Red, INV=Green
  }
  function mkFeed(built) {
    const dc = new DataCube({ chart: { type: 'Candles', data: built.chart.data }, onchart: [], offchart: [] }, { scripts: false, validation: 'off' })
    const feed = new CorkyFeed({ client: new FakeClient(), dataCube: dc })
    const handle = { built, addedOverlays: new Set(), enabledKinds: new Set(), enabledLayers: new Set(), hiddenLayers: new Set() }
    return { feed, handle }
  }

  test('build keeps the two instances distinct (same kind, same layer id)', () => {
    const cc = buildTwo()._candleColor
    expect(cc.length).toBe(2)
    const byInst = Object.fromEntries(cc.map(e => [e.instanceKey, e]))
    expect(byInst.SCMR).toBeTruthy()
    expect(byInst['SCMR(INV)']).toBeTruthy()
    const ts = buildTwo().chart.data[0][0]
    expect(byInst.SCMR.byTs.get(ts)).toBe('#FF0000')        // id 11 → Red
    expect(byInst['SCMR(INV)'].byTs.get(ts)).toBe('#00FF00') // id 10 → Green (inverse)
  })

  test('enabling SCMR vs SCMR(INV) colours the candle with their OWN (inverse) colours', () => {
    const built = buildTwo()
    const ts = built.chart.data[0][0]
    const { feed, handle } = mkFeed(built)
    feed.setIndicatorEnabled(handle, 'scmr', true, 'SCMR')          // display_label SCMR
    expect(built.chart.data.find(c => c[0] === ts)[6]).toBe('#FF0000') // Red
    feed.setIndicatorEnabled(handle, 'scmr', false, 'SCMR')
    feed.setIndicatorEnabled(handle, 'scmr', true, 'SCMR(INV)')     // display_label SCMR(INV)
    expect(built.chart.data.find(c => c[0] === ts)[6]).toBe('#00FF00') // Green — distinct ✓ (pre-fix: same as SCMR)
  })

  test('live: only the ACTIVE instance stamps; the inverse twin does not bleed in', () => {
    const built = buildTwo()
    built._candleColorActive = new Set(['SCMR(INV)']) // only the inverse is enabled
    // New live candle carrying BOTH instances' inverse ids (SCMR 11 Red, INV 10 Green).
    applyLiveUpdate(built, {
      subscription_id: 's', sequence: 1,
      row: {
        timeframe: '1m',
        candle: { timestamp_ms: T0 + 5 * TF, open: '10', high: '12', low: '9', close: '11', volume: '5' },
        indicators: {
          SCMR: { candle_type_color: '11', candle_type_name: '11', candle_type: '11' },
          'SCMR(INV)': { candle_type_color: '10', candle_type_name: '10', candle_type: '10' }
        }
      }
    }, {})
    const c = built.chart.data.find(x => x[0] === T0 + 5 * TF)
    expect(c[6]).toBe('#00FF00') // INV (active) Green — NOT SCMR's Red
  })
})
