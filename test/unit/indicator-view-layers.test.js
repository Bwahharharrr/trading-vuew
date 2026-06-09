// Golden tests for view.layers-driven indicator rendering in buildChartData.
// Prefer descriptor.view.layers over plot-every-output; fallback byte-identical.
import { test, expect, describe } from 'vitest'
import { buildChartData } from '../../src/helpers/feed/corky-ingest.js'

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
    const [hist, lines, bull] = cd.offchart
    // pane 'macd': histogram is the anchor (no grid.id → spawns grid 1); lines merge into it
    expect(hist.type).toBe('Histogram'); expect(hist.grid).toBeUndefined()
    expect(lines.type).toBe('Splines'); expect(lines.grid).toEqual({ id: 1 })
    expect(lines.data[0]).toEqual([T0, 1, 0.5]) // zipped multi-field [ts, macd, signal]
    // pane 'macd_strength': separate pane (anchor, grid 2)
    expect(bull.type).toBe('Histogram'); expect(bull.grid).toBeUndefined()
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
    // candle colour stamped on slot 6 (tuple padded to 9)
    expect(cd.chart.data[0].length).toBe(9)
    expect(cd.chart.data[0][6]).toBe('#23a776') // bull
    expect(cd.chart.data[1][6]).toBe('#e54150') // bear
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
    expect(cd.chart.data[0][6]).toBe('#23a776') // score 2 >= 0 → green
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

  test('empty view.layers → fallback for that instance', () => {
    const rows = [row(0, { 'SMA(20)': { sma: '100' } })]
    const cd = buildChartData(rows, { views: { 'SMA(20)': view('sma', []) } })
    expect(cd.onchart).toHaveLength(1)
    expect(cd.onchart[0].settings.corkyOutput).toBe('sma') // fallback per-output overlay
    expect(cd.onchart[0].settings.corkyView).toBeUndefined()
  })
})
