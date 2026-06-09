// signed_slope_histogram color rule (generic, style-driven): per-bar colour by
// value sign + slope direction; slope_field → derived diff → sign-only fallback.
import { test, expect, describe } from 'vitest'
import { signedSlopeColor } from '../../src/helpers/feed/indicator-catalog.js'
import { buildChartData, applyLiveUpdate } from '../../src/helpers/feed/corky-ingest.js'

const C = {
  positive_rising_color: 'PR', positive_falling_color: 'PF',
  negative_falling_color: 'NF', negative_rising_color: 'NR'
}
const T0 = 1779465000000, TF = 60000
function row(i, indicators) {
  return {
    timeframe: '1m',
    candle: { timestamp_ms: T0 + i * TF, open: '10', high: '12', low: '9', close: '11', volume: '100' },
    indicators
  }
}
const view = (kind, layers) => ({ kind, view: { version: 1, layers } })
const HIST_STYLE = {
  color_rule: 'signed_slope_histogram', value_field: 'histogram', slope_field: 'hist_slope',
  positive_rising_color: 'PR', positive_falling_color: 'PF',
  negative_falling_color: 'NF', negative_rising_color: 'NR', zero_line: 'true'
}

describe('signedSlopeColor', () => {
  test('the four quadrants', () => {
    expect(signedSlopeColor(1, 0.5, C)).toBe('PR')   // +val +slope
    expect(signedSlopeColor(1, -0.5, C)).toBe('PF')  // +val -slope
    expect(signedSlopeColor(-1, -0.5, C)).toBe('NF') // -val -slope
    expect(signedSlopeColor(-1, 0.5, C)).toBe('NR')  // -val +slope
    expect(signedSlopeColor(0, 0, C)).toBe('PR')     // value>=0 & slope>=0
  })
  test('sign-only fallback when slope is missing', () => {
    expect(signedSlopeColor(2, null, C)).toBe('PR')
    expect(signedSlopeColor(-2, null, C)).toBe('NF')
    expect(signedSlopeColor(2, undefined, C)).toBe('PR')
  })
  test('non-finite value → null', () => {
    expect(signedSlopeColor(NaN, 1, C)).toBeNull()
    expect(signedSlopeColor('x', 1, C)).toBeNull()
  })
})

describe('buildChartData — signed_slope_histogram + macd_averages', () => {
  test('histogram bars coloured by value+slope; lines share the pane', () => {
    const rows = [
      row(0, { MACD: { histogram: '1', hist_slope: '0.5', macd: '2', signal: '1.8' } }),  // PR
      row(1, { MACD: { histogram: '2', hist_slope: '-0.3', macd: '2.1', signal: '1.9' } }), // PF
      row(2, { MACD: { histogram: '-1', hist_slope: '-0.4', macd: '1.5', signal: '1.7' } }), // NF
      row(3, { MACD: { histogram: '-0.5', hist_slope: '0.2', macd: '1.6', signal: '1.65' } }) // NR
    ]
    const views = {
      MACD: view('macd', [
        { id: 'macd_hist', label: 'Histogram', kind: 'histogram', target: { surface: 'pane', pane: 'macd' }, fields: ['histogram'], style: HIST_STYLE, visible_by_default: true },
        { id: 'macd_averages', label: 'MACD', kind: 'line', target: { surface: 'pane', pane: 'macd' }, fields: ['macd', 'signal'], visible_by_default: true }
      ])
    }
    const cd = buildChartData(rows, { views })
    const hist = cd.offchart.find(o => o.settings.corkyLayerId === 'macd_hist')
    expect(hist.type).toBe('Histogram')
    expect(hist.settings).toMatchObject({
      corkyColorRule: 'signed_slope_histogram', valueField: 'histogram',
      slopeField: 'hist_slope', dataIndex: 1, colorIndex: 2, zeroLine: true
    })
    expect(hist.data[0]).toEqual([T0, 1, 'PR'])
    expect(hist.data[1]).toEqual([T0 + TF, 2, 'PF'])
    expect(hist.data[2]).toEqual([T0 + 2 * TF, -1, 'NF'])
    expect(hist.data[3]).toEqual([T0 + 3 * TF, -0.5, 'NR'])

    // macd_averages line overlay co-located in the histogram's pane
    const lines = cd.offchart.find(o => o.settings.corkyLayerId === 'macd_averages')
    expect(lines.type).toBe('Splines')
    expect(hist.grid).toBeUndefined()      // anchor spawns the pane
    expect(lines.grid).toEqual({ id: 1 })  // merged into it
    expect(lines.data[0]).toEqual([T0, 2, 1.8])
  })

  test('slope derived from prev value when slope_field absent; first bar sign-only', () => {
    const style = { ...HIST_STYLE }
    delete style.slope_field
    const rows = [row(0, { MACD: { histogram: '1' } }), row(1, { MACD: { histogram: '2' } }), row(2, { MACD: { histogram: '1.5' } })]
    const views = { MACD: view('macd', [{ id: 'h', label: 'H', kind: 'histogram', target: { surface: 'pane' }, fields: ['histogram'], style, visible_by_default: true }]) }
    const cd = buildChartData(rows, { views })
    const h = cd.offchart.find(o => o.settings.corkyColorRule)
    expect(h.data[0][2]).toBe('PR') // no prev → sign-only (+)
    expect(h.data[1][2]).toBe('PR') // slope 2-1=+1
    expect(h.data[2][2]).toBe('PF') // slope 1.5-2=-0.5, value +
  })
})

describe('live: signed_slope_histogram recompute', () => {
  test('tick recomputes [ts, value, color] from value + slope_field', () => {
    const views = { MACD: view('macd', [{ id: 'h', label: 'H', kind: 'histogram', target: { surface: 'pane' }, fields: ['histogram'], style: HIST_STYLE, visible_by_default: true }]) }
    const built = buildChartData([row(0, { MACD: { histogram: '1', hist_slope: '0.5' } })], { views })
    built.timeframe = '1m'
    const ev = { subscription_id: 's', sequence: 1, row: { timeframe: '1m', candle: { timestamp_ms: T0 + TF, open: '1', high: '1', low: '1', close: '1', volume: '1' }, indicators: { MACD: { histogram: '-2', hist_slope: '-1' } } } }
    applyLiveUpdate(built, ev, {})
    const h = built.offchart.find(o => o.settings.corkyColorRule)
    expect(h.data[h.data.length - 1]).toEqual([T0 + TF, -2, 'NF']) // v<0,s<0
  })

  test('tick derives slope from previous bar when slope_field missing', () => {
    const style = { ...HIST_STYLE }; delete style.slope_field
    const views = { MACD: view('macd', [{ id: 'h', label: 'H', kind: 'histogram', target: { surface: 'pane' }, fields: ['histogram'], style, visible_by_default: true }]) }
    const built = buildChartData([row(0, { MACD: { histogram: '1' } })], { views })
    built.timeframe = '1m'
    const ev = { subscription_id: 's', sequence: 1, row: { timeframe: '1m', candle: { timestamp_ms: T0 + TF, open: '1', high: '1', low: '1', close: '1', volume: '1' }, indicators: { MACD: { histogram: '3' } } } }
    applyLiveUpdate(built, ev, {})
    const h = built.offchart.find(o => o.settings.corkyColorRule)
    // value 3, slope 3-1=+2 → PR
    expect(h.data[h.data.length - 1]).toEqual([T0 + TF, 3, 'PR'])
  })
})
