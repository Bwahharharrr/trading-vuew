// Golden tests for view.layers-driven indicator rendering in buildChartData.
// Prefer descriptor.view.layers over plot-every-output; fallback byte-identical.
import { test, expect, describe } from 'vitest'
import { buildChartData, applyLiveUpdate } from '../../src/helpers/feed/corky-ingest.js'

const T0 = 1779465000000, TF = 60000
function row(i, indicators) {
  const ts = T0 + i * TF
  return {
    timeframe: '1m',
    candle: { timestamp_ms: ts, open: '10', high: '12', low: '9', close: '11', volume: '100' },
    indicators
  }
}
// views map keyed by display_label (= the row indicators key) → { kind, view }.
const view = (kind, layers) => ({ kind, view: { version: 1, layers } })

describe('buildChartData — view.layers', () => {
  test('SMA single line layer → one price Spline (not plot-every-output)', () => {
    const rows = [row(0, { 'SMA(20)': { sma: '100' } }), row(1, { 'SMA(20)': { sma: '101' } })]
    const views = {
      'SMA(20)': view('sma', [
        { id: 'sma_line', label: 'SMA(20)', kind: 'line', target: { surface: 'price' }, fields: ['sma'], visible_by_default: true }
      ])
    }
    const cd = buildChartData(rows, { views })
    expect(cd.onchart).toHaveLength(1)
    expect(cd.offchart).toHaveLength(0)
    const ov = cd.onchart[0]
    expect(ov.type).toBe('Spline')
    expect(ov.name).toBe('SMA(20)')
    expect(ov.data).toEqual([[T0, 100], [T0 + TF, 101]])
    expect(ov.settings).toMatchObject({ corkyLayerId: 'sma_line', corkyView: true, corkyVisibleDefault: true, display: true })
    expect(ov.raw).toEqual([[T0, '100'], [T0 + TF, '101']]) // raw preserved
  })

  test('MACD → histogram + macd/signal lines in ONE pane, bull in its own pane', () => {
    const rows = [row(0, { MACD: { macd: '1', signal: '0.5', histogram: '0.2', bull: '3' } })]
    const views = {
      MACD: view('macd', [
        { id: 'hist', label: 'Histogram', kind: 'histogram', target: { surface: 'pane', pane: 'macd' }, fields: ['histogram'], visible_by_default: true },
        { id: 'lines', label: 'MACD', kind: 'line', target: { surface: 'pane', pane: 'macd' }, fields: ['macd', 'signal'], visible_by_default: true },
        { id: 'bull', label: 'Bull', kind: 'histogram', target: { surface: 'pane', pane: 'macd_strength' }, fields: ['bull'], visible_by_default: true }
      ])
    }
    const cd = buildChartData(rows, { views })
    expect(cd.onchart).toHaveLength(0)
    expect(cd.offchart).toHaveLength(3)
    const byId = id => cd.offchart.find(o => o.settings.corkyLayerId === id)
    const hist = byId('hist'), lines = byId('lines'), bull = byId('bull')
    // pane 'macd': histogram is the anchor (no grid.id → spawns grid 1); lines merge into it
    expect(hist.type).toBe('Histogram'); expect(hist.grid).toBeUndefined()
    expect(lines.type).toBe('Splines'); expect(lines.grid).toEqual({ id: 1 })
    expect(lines.data[0]).toEqual([T0, 1, 0.5]) // zipped multi-field [ts, macd, signal]
    // pane 'macd_strength': separate pane (anchor, grid 2)
    expect(bull.type).toBe('Histogram'); expect(bull.grid).toBeUndefined()
    // Section indexing invariant: all anchors first, grid:{id} pane-siblings last
    expect(cd.offchart.map(o => o.settings.corkyLayerId)).toEqual(['hist', 'bull', 'lines'])
  })

  test('SCMR → candle_color stamps slot 6; TL/TH lines built but hidden', () => {
    const rows = [
      row(0, { SCMR: { candle_type_color: 'bull', tl: '10', th: '20' } }),
      row(1, { SCMR: { candle_type_color: 'bear', tl: '11', th: '21' } })
    ]
    const views = {
      SCMR: view('scmr', [
        { id: 'color', label: 'Candle', kind: 'candle_color', target: { surface: 'price' }, fields: ['candle_type_color'], visible_by_default: true },
        { id: 'tl', label: 'TL', kind: 'line', target: { surface: 'price' }, fields: ['tl'], visible_by_default: false },
        { id: 'th', label: 'TH', kind: 'diagnostic', target: { surface: 'price' }, fields: ['th'], visible_by_default: false }
      ])
    }
    const cd = buildChartData(rows, { views })
    // candle_color is NOT applied at build (candles-only default) — metadata only,
    // candles stay their natural 6-tuple until the indicator is enabled
    expect(cd.chart.data[0].length).toBe(6)
    expect(cd.chart.data[0][6]).toBeUndefined()
    expect(cd._candleColorActive.size).toBe(0)
    const cc = cd._candleColor.find(e => e.instanceKey === 'SCMR')
    expect(cc.field).toBe('candle_type_color')
    expect(cc.byTs.get(T0)).toBe('#23a776')      // bull
    expect(cc.byTs.get(T0 + TF)).toBe('#e54150') // bear
    // TL/TH are overlays (raw available) but hidden by default
    expect(cd.onchart.map(o => o.settings.corkyLayerId).sort()).toEqual(['th', 'tl'])
    for (const o of cd.onchart) expect(o.settings.display).toBe(false)
    // no candle_color overlay
    expect(cd.onchart.some(o => o.settings.corkyLayerId === 'color')).toBe(false)
  })

  test('CRUP → candle_color (numeric score ramp) + box via Zones', () => {
    const rows = [row(0, { CRUP: { score: '2', gap_lo: '5', gap_hi: '8' } })]
    const views = {
      CRUP: view('crup', [
        { id: 'color', label: 'Color', kind: 'candle_color', target: { surface: 'price' }, fields: ['score'], visible_by_default: true },
        { id: 'box', label: 'Gap', kind: 'box', target: { surface: 'price' }, fields: ['gap_lo', 'gap_hi'], visible_by_default: true }
      ])
    }
    const cd = buildChartData(rows, { views })
    expect(cd.chart.data[0][6]).toBeUndefined() // not applied at build
    const cc = cd._candleColor.find(e => e.instanceKey === 'CRUP')
    expect(cc.byTs.get(T0)).toBe('#23a776') // score 2 >= 0 → green (metadata)
    const box = cd.onchart.find(o => o.settings.corkyLayerId === 'box')
    expect(box.type).toBe('Zones')
    expect(box.data[0]).toEqual([T0, 5, 8]) // zipped [ts, gap_lo, gap_hi]
  })

  test('fallback: no view → plot every output, byte-identical to legacy', () => {
    const rows = [row(0, { 'rsi:14': { rsi: '50' } }), row(1, { 'rsi:14': { rsi: '55' } })]
    const withNull = buildChartData(rows)            // no opts
    const withEmpty = buildChartData(rows, { views: {} }) // empty views map
    expect(withNull).toEqual(withEmpty)
    expect(withNull.offchart).toHaveLength(1)
    expect(withNull.offchart[0].type).toBe('Spline')
    expect(withNull.offchart[0].settings).toEqual({ corkyKey: 'rsi:14.rsi', corkyKind: 'rsi', corkyOutput: 'rsi' })
    expect(withNull.chart.data[0].length).toBe(6) // no candle_color → tuple unchanged
  })

  test('live: candle_color re-stamped + multi-field view overlay column write', () => {
    const views = {
      MACD: view('macd', [
        { id: 'lines', label: 'MACD', kind: 'line', target: { surface: 'pane', pane: 'macd' }, fields: ['macd', 'signal'], visible_by_default: true }
      ]),
      SCMR: view('scmr', [
        { id: 'color', label: 'C', kind: 'candle_color', target: { surface: 'price' }, fields: ['ct'], visible_by_default: true }
      ])
    }
    const built = buildChartData([row(0, { MACD: { macd: '1', signal: '0.5' }, SCMR: { ct: 'bull' } })], { views })
    built.timeframe = '1m'
    // candle_color off by default → not stamped at build
    expect(built.chart.data[0][6]).toBeUndefined()
    // simulate the indicator being enabled (setIndicatorEnabled marks it active)
    for (const e of built._candleColor) built._candleColorActive.add(e.kind)

    const ts1 = T0 + TF
    const ev = {
      subscription_id: 's', sequence: 1,
      row: {
        timeframe: '1m',
        candle: { timestamp_ms: ts1, open: '10', high: '12', low: '9', close: '11', volume: '1' },
        indicators: { MACD: { macd: '2', signal: '1.5' }, SCMR: { ct: 'bear' } }
      }
    }
    const res = applyLiveUpdate(built, ev, {})
    expect(res.applied).toBe(true)
    // candle_color re-stamped on the rebuilt candle tuple (slot 6)
    const c = built.chart.data[built.chart.data.length - 1]
    expect(c[0]).toBe(ts1)
    expect(c[6]).toBe('#e54150') // bear
    // multi-field MACD lines overlay got a new zipped row [ts1, macd, signal]
    const lines = built.offchart.find(o => o.settings.corkyLayerId === 'lines')
    expect(lines.data[lines.data.length - 1]).toEqual([ts1, 2, 1.5])
  })

  test('marker layer → Markers overlay at [ts, y] (signal-only bars)', () => {
    const rows = [
      row(0, { SIG: { buy: '100' } }),
      row(1, { SIG: {} }),            // no output this bar → no marker point
      row(2, { SIG: { buy: '105' } })
    ]
    const views = {
      SIG: view('sig', [
        { id: 'buys', label: 'Buys', kind: 'marker', target: { surface: 'price' }, fields: ['buy'], style: { shape: 'triangle-up', color: '#0f0' }, visible_by_default: true }
      ])
    }
    const cd = buildChartData(rows, { views })
    const m = cd.onchart.find(o => o.settings.corkyLayerId === 'buys')
    expect(m.type).toBe('Markers')
    expect(m.data).toEqual([[T0, 100], [T0 + 2 * TF, 105]]) // only bars carrying the output
    expect(m.settings.color).toBe('#0f0')
    expect(m.settings.style.shape).toBe('triangle-up')
    expect(m.settings.display).toBe(true)
  })

  test('empty view.layers → fallback for that instance', () => {
    const rows = [row(0, { 'SMA(20)': { sma: '100' } })]
    const cd = buildChartData(rows, { views: { 'SMA(20)': view('sma', []) } })
    expect(cd.onchart).toHaveLength(1)
    expect(cd.onchart[0].settings.corkyOutput).toBe('sma') // fallback per-output overlay
    expect(cd.onchart[0].settings.corkyView).toBeUndefined()
  })
})

// SCMR reversal markers: a marker layer with style.marker_rule. The client reads
// glyph/colour/placement from the DESCRIPTOR (symbol_{id}/color_{id}/placement_{id})
// and anchors each marker to the OWNING candle's high/low — nothing hardcoded.
// candle in row(): open 10, high 12, low 9, close 11.
describe('buildChartData — SCMR reversal markers (marker_rule)', () => {
  // placements: { 1, 2, 3 } → 'above_candle' | 'below_candle'
  const scmrView = (placements) => view('scmr', [{
    id: 'scmr_reversal_markers', label: 'SCMR', kind: 'marker', target: { surface: 'price' },
    fields: ['reversal_type', 'reversal_type_name'],
    style: {
      marker_rule: 'scmr_reversal_symbols', value_field: 'reversal_type', label_field: 'reversal_type_name',
      zero_value: '0', hide_zero: 'true', above_anchor: 'candle_high', below_anchor: 'candle_low',
      symbol_1: 'o', color_1: '#00FFFF', placement_1: placements[1],
      symbol_2: 'x', color_2: '#FF0000', placement_2: placements[2],
      symbol_3: 'z', color_3: '#00FF00', placement_3: placements[3],
    },
    visible_by_default: true,
  }])
  const NORMAL = { 1: 'below_candle', 2: 'above_candle', 3: 'below_candle' }
  const findMarkers = (cd) => cd.onchart.find((o) => o.settings.corkyLayerId === 'scmr_reversal_markers')

  test('parses the rule → a visible price Markers overlay', () => {
    const rows = [row(0, { SCMR: { reversal_type: '1', reversal_type_name: 'Bull' } })]
    const cd = buildChartData(rows, { views: { SCMR: scmrView(NORMAL) } })
    const m = findMarkers(cd)
    expect(m).toBeTruthy()
    expect(m.type).toBe('Markers')
    expect(m.settings.corkyMarkerRule).toBe('scmr_reversal_symbols')
    expect(m.settings.corkyView).toBe(true)
    expect(m.settings.display).toBe(true)
    expect(cd.offchart).toHaveLength(0) // price surface, not a pane
  })

  test('normal SCMR ids 1/2/3 → o,x,z · cyan,red,green · below,above,below at low/high/low', () => {
    const rows = [
      row(0, { SCMR: { reversal_type: '1', reversal_type_name: 'Bullish' } }),
      row(1, { SCMR: { reversal_type: '2', reversal_type_name: 'Bearish' } }),
      row(2, { SCMR: { reversal_type: '3', reversal_type_name: 'Strong' } }),
    ]
    const cd = buildChartData(rows, { views: { SCMR: scmrView(NORMAL) } })
    // [ts, y, label, glyph, color, dir] — y = low(9) below, high(12) above
    expect(findMarkers(cd).data).toEqual([
      [T0, 9, 'Bullish', 'o', '#00FFFF', 'below'],
      [T0 + TF, 12, 'Bearish', 'x', '#FF0000', 'above'],
      [T0 + 2 * TF, 9, 'Strong', 'z', '#00FF00', 'below'],
    ])
  })

  test('SCMR(INV) ids 1/2/3 → same glyphs/colours, placements flipped above,below,above', () => {
    const INV = { 1: 'above_candle', 2: 'below_candle', 3: 'above_candle' }
    const rows = [
      row(0, { 'SCMR(INV)': { reversal_type: '1', reversal_type_name: 'Bullish' } }),
      row(1, { 'SCMR(INV)': { reversal_type: '2', reversal_type_name: 'Bearish' } }),
      row(2, { 'SCMR(INV)': { reversal_type: '3', reversal_type_name: 'Strong' } }),
    ]
    const cd = buildChartData(rows, { views: { 'SCMR(INV)': scmrView(INV) } })
    expect(findMarkers(cd).data).toEqual([
      [T0, 12, 'Bullish', 'o', '#00FFFF', 'above'],
      [T0 + TF, 9, 'Bearish', 'x', '#FF0000', 'below'],
      [T0 + 2 * TF, 12, 'Strong', 'z', '#00FF00', 'above'],
    ])
  })

  test('reversal_type 0 / missing / non-numeric → no marker', () => {
    const rows = [
      row(0, { SCMR: { reversal_type: '0', reversal_type_name: 'None' } }),
      row(1, { SCMR: {} }),
      row(2, { SCMR: { reversal_type: 'nope' } }),
      row(3, { SCMR: { reversal_type: '2', reversal_type_name: 'Bearish' } }),
    ]
    const cd = buildChartData(rows, { views: { SCMR: scmrView(NORMAL) } })
    expect(findMarkers(cd).data).toEqual([[T0 + 3 * TF, 12, 'Bearish', 'x', '#FF0000', 'above']])
  })

  test('descriptor-authoritative: NON-default glyph/colour/placement are obeyed (not hardcoded)', () => {
    const custom = view('scmr', [{
      id: 'scmr_reversal_markers', label: 'SCMR', kind: 'marker', target: { surface: 'price' },
      fields: ['reversal_type'],
      style: {
        marker_rule: 'scmr_reversal_symbols', value_field: 'reversal_type',
        symbol_1: 'A', color_1: '#123456', placement_1: 'above_candle', // deliberately NOT the SCMR defaults
      },
      visible_by_default: true,
    }])
    const cd = buildChartData([row(0, { SCMR: { reversal_type: '1' } })], { views: { SCMR: custom } })
    expect(findMarkers(cd).data).toEqual([[T0, 12, null, 'A', '#123456', 'above']])
  })

  test('time alignment: the marker stays on the candle row that owns the value', () => {
    const rows = [
      row(0, { SCMR: {} }),
      row(1, { SCMR: { reversal_type: '1', reversal_type_name: 'Bullish' } }),
      row(2, { SCMR: {} }),
    ]
    const cd = buildChartData(rows, { views: { SCMR: scmrView(NORMAL) } })
    expect(findMarkers(cd).data).toEqual([[T0 + TF, 9, 'Bullish', 'o', '#00FFFF', 'below']])
  })

  test('live: a closing candle with a reversal adds a marker; flipping to 0 removes it', () => {
    // seed carries reversal_type='0' (idle) so the series + overlay exist (the
    // gateway sends the field on every candle); no marker yet (0 is hidden).
    const built = buildChartData([row(0, { SCMR: { reversal_type: '0' } })], { views: { SCMR: scmrView(NORMAL) } })
    built.timeframe = '1m'
    expect(findMarkers(built).data).toEqual([])
    const ts1 = T0 + TF
    const candle = { timestamp_ms: ts1, open: '10', high: '12', low: '9', close: '11', volume: '1' }
    // (a) new bar, reversal_type 2 (Bearish, above) → marker on ts1 at high (12)
    applyLiveUpdate(built, {
      subscription_id: 's', sequence: 1,
      row: { timeframe: '1m', candle, indicators: { SCMR: { reversal_type: '2', reversal_type_name: 'Bearish' } } },
    }, {})
    expect(findMarkers(built).data).toEqual([[ts1, 12, 'Bearish', 'x', '#FF0000', 'above']])
    // (b) the forming bar flips the reversal back to 0 → marker removed
    applyLiveUpdate(built, {
      subscription_id: 's', sequence: 2,
      row: { timeframe: '1m', candle, indicators: { SCMR: { reversal_type: '0', reversal_type_name: 'None' } } },
    }, {})
    expect(findMarkers(built).data).toEqual([])
  })

  test('live: a reversal-field-less tick leaves the existing marker intact', () => {
    const built = buildChartData(
      [row(0, { SCMR: { reversal_type: '1', reversal_type_name: 'Bullish' } })], { views: { SCMR: scmrView(NORMAL) } })
    built.timeframe = '1m'
    expect(findMarkers(built).data).toEqual([[T0, 9, 'Bullish', 'o', '#00FFFF', 'below']])
    // a pure price/volume refinement of the SAME bar (no reversal_type) must not clobber it
    applyLiveUpdate(built, {
      subscription_id: 's', sequence: 1,
      row: { timeframe: '1m', candle: { timestamp_ms: T0, open: '10', high: '12', low: '9', close: '11', volume: '9' }, indicators: { SCMR: {} } },
    }, {})
    expect(findMarkers(built).data).toEqual([[T0, 9, 'Bullish', 'o', '#00FFFF', 'below']])
  })
})
