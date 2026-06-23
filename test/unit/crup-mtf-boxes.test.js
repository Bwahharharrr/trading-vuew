// CRUP_MTF multi-timeframe detection boxes: a `box` layer reads its field names
// from the descriptor style (tf_1h_* / tf_2h_*), and a HIGHER source timeframe is
// deduped/anchored by source_timestamp_field — one box per source bar, spanning the
// source candle's high/low, NOT one per base row. Everything style-driven.
import { describe, it, expect } from 'vitest'
import { buildChartData, applyLiveUpdate } from '../../src/helpers/feed/corky-ingest.js'
import { hexToRgba } from '../../src/helpers/feed/indicator-catalog.js'

const T0 = 1700000000000, H = 3600000
// base = 1h. 2h candle A = rows 0,1 (source ts = row0); 2h candle B = rows 2,3.
function row(i, ohlc, crup) {
  return {
    timeframe: '1h',
    candle: { timestamp_ms: T0 + i * H, open: String(ohlc[0]), high: String(ohlc[1]), low: String(ohlc[2]), close: String(ohlc[3]), volume: '1' },
    indicators: { CRUP: crup },
  }
}
// CRUP_MTF box-layer style for a source timeframe (matches the live descriptor).
const boxStyle = (tf) => ({
  box_rule: 'detection_zone_until_close_breaks', source_timeframe: tf, source_timestamp_field: `tf_${tf}_timestamp`,
  fill_opacity: '0.20', bull_fill_color: '#00e676', bear_fill_color: '#d64545',
  bull_open_field: `tf_${tf}_bull_detected_now`, bear_open_field: `tf_${tf}_bear_detected_now`,
  bull_count_field: `tf_${tf}_bull_box_count`, bear_count_field: `tf_${tf}_bear_box_count`,
  bull_top_field: `tf_${tf}_bull_box_top`, bull_bottom_field: `tf_${tf}_bull_box_bottom`,
  bear_top_field: `tf_${tf}_bear_box_top`, bear_bottom_field: `tf_${tf}_bear_box_bottom`,
})
const crupView = (layers) => ({ CRUP: { kind: 'crup', view: { version: 1, layers } } })
const box1h = { id: 'crup_mtf_detection_boxes_1h', label: 'CRUP 1h', kind: 'box', target: { surface: 'price' }, style: boxStyle('1h'), visible_by_default: true }
const box2h = { id: 'crup_mtf_detection_boxes_2h', label: 'CRUP 2h', kind: 'box', target: { surface: 'price' }, style: boxStyle('2h'), visible_by_default: true }

// 4 1h candles. 2h candle A (rows 0,1) gets a 2h-bull detection (both rows carry
// the flag — projection repeats it); row 1 also gets a 1h-bull detection.
const baseRows = () => [
  row(0, [100, 105, 98, 102], { tf_1h_timestamp: String(T0), tf_2h_timestamp: String(T0), tf_1h_bull_detected_now: '0', tf_2h_bull_detected_now: '1', tf_1h_bear_detected_now: '0', tf_2h_bear_detected_now: '0' }),
  row(1, [102, 110, 101, 108], { tf_1h_timestamp: String(T0 + H), tf_2h_timestamp: String(T0), tf_1h_bull_detected_now: '1', tf_2h_bull_detected_now: '1', tf_1h_bear_detected_now: '0', tf_2h_bear_detected_now: '0' }),
  row(2, [108, 112, 107, 109], { tf_1h_timestamp: String(T0 + 2 * H), tf_2h_timestamp: String(T0 + 2 * H), tf_1h_bull_detected_now: '0', tf_2h_bull_detected_now: '0', tf_1h_bear_detected_now: '0', tf_2h_bear_detected_now: '0' }),
  row(3, [109, 111, 106, 110], { tf_1h_timestamp: String(T0 + 3 * H), tf_2h_timestamp: String(T0 + 2 * H), tf_1h_bull_detected_now: '0', tf_2h_bull_detected_now: '0', tf_1h_bear_detected_now: '0', tf_2h_bear_detected_now: '0' }),
]
const zonesOf = (cd, id) => (cd.onchart.find((o) => o.settings.corkyLayerId === id) || {}).settings?.zones || []

describe('CRUP_MTF detection boxes — descriptor-driven, source-tf dedup', () => {
  it('builds BOTH 1h and 2h box layers on the 1h chart (price surface)', () => {
    const cd = buildChartData(baseRows(), { views: crupView([box1h, box2h]) })
    expect(cd.onchart.map((o) => o.settings.corkyLayerId).sort())
      .toEqual(['crup_mtf_detection_boxes_1h', 'crup_mtf_detection_boxes_2h'])
    expect(cd.onchart.every((o) => o.type === 'Zones')).toBe(true)
  })

  it('1h layer: box from the 1h detection candle (row 1) at its own high/low', () => {
    const cd = buildChartData(baseRows(), { views: crupView([box1h, box2h]) })
    const z = zonesOf(cd, 'crup_mtf_detection_boxes_1h')
    expect(z).toHaveLength(1)
    // [x1, y1(top), x2, y2(bottom), rgba] — anchored at row1 close (T0+2H), 1h high/low 110/101
    expect(z[0][0]).toBe(T0 + 2 * H)
    expect(z[0][1]).toBe(110); expect(z[0][3]).toBe(101)
    expect(z[0][4]).toBe(hexToRgba('#00e676', 0.2))
  })

  it('2h layer: ONE box (deduped by source ts), spanning the 2h candle high/low', () => {
    const cd = buildChartData(baseRows(), { views: crupView([box1h, box2h]) })
    const z = zonesOf(cd, 'crup_mtf_detection_boxes_2h')
    // both row0 AND row1 carry tf_2h_bull_detected_now=1, but they're the SAME 2h
    // bar → exactly ONE box, not two
    expect(z).toHaveLength(1)
    // anchored at the 2h candle's close (T0 + 2h), spanning candle A high/low:
    // high = max(105,110)=110, low = min(98,101)=98
    expect(z[0][0]).toBe(T0 + 2 * H)
    expect(z[0][1]).toBe(110); expect(z[0][3]).toBe(98)
  })

  it('2h chart: only the 2h layer (1h layer absent) — anchored view', () => {
    // a 2h-base chart: each row IS a 2h candle; the descriptor only ships the 2h layer
    const rows2h = [
      { timeframe: '2h', candle: { timestamp_ms: T0, open: '100', high: '110', low: '98', close: '108', volume: '1' }, indicators: { CRUP: { tf_2h_timestamp: String(T0), tf_2h_bull_detected_now: '1', tf_2h_bear_detected_now: '0' } } },
      { timeframe: '2h', candle: { timestamp_ms: T0 + 2 * H, open: '108', high: '112', low: '106', close: '110', volume: '1' }, indicators: { CRUP: { tf_2h_timestamp: String(T0 + 2 * H), tf_2h_bull_detected_now: '0', tf_2h_bear_detected_now: '0' } } },
    ]
    const cd = buildChartData(rows2h, { views: crupView([box2h]) })
    expect(cd.onchart.map((o) => o.settings.corkyLayerId)).toEqual(['crup_mtf_detection_boxes_2h'])
    expect(zonesOf(cd, 'crup_mtf_detection_boxes_2h')).toHaveLength(1)
  })

  it('LIVE: a new 2h source bar with a settled detection anchors a 2h box', () => {
    const cd = buildChartData(baseRows(), { views: crupView([box2h]) })
    cd.timeframe = '1h'
    const before = zonesOf(cd, 'crup_mtf_detection_boxes_2h').length
    // a 2h bull detection settles on 2h candle B (rows 2,3 already loaded as history,
    // det=0). Now a NEW 2h candle C (rows 4,5) opens; row 5 settles tf_2h_bull=1, then
    // a row 6 starts 2h candle D → candle C closed → its box anchors.
    const live = (i, ohlc, tf2ts, bull) => ({
      subscription_id: 's', sequence: i,
      row: { timeframe: '1h', candle: { timestamp_ms: T0 + i * H, open: String(ohlc[0]), high: String(ohlc[1]), low: String(ohlc[2]), close: String(ohlc[3]), volume: '1' },
        indicators: { CRUP: { tf_2h_timestamp: String(tf2ts), tf_2h_bull_detected_now: String(bull), tf_2h_bear_detected_now: '0' } } },
    })
    applyLiveUpdate(cd, live(4, [110, 113, 109, 112], T0 + 4 * H, 0), {}) // candle C row 0
    applyLiveUpdate(cd, live(5, [112, 120, 111, 118], T0 + 4 * H, 1), {}) // candle C row 1 → settled bull
    applyLiveUpdate(cd, live(6, [118, 119, 115, 116], T0 + 6 * H, 0), {}) // candle D row 0 → C closed
    const z = zonesOf(cd, 'crup_mtf_detection_boxes_2h')
    expect(z.length).toBe(before + 1)                  // exactly one new 2h box
    const newBox = z[z.length - 1]
    expect(newBox[0]).toBe(T0 + 4 * H + 2 * H)         // anchored at candle C's close (C open + 2h)
    expect(newBox[1]).toBe(120); expect(newBox[3]).toBe(109) // C high=max(113,120), low=min(109,111)
  })
})

// Confluence counts (bull/bear/net_box_timeframe_count): the gateway ships these as
// their OWN line layers (NOT box_count). The descriptor-driven pipeline renders them
// like any other line — these tests pin that, plus the contract's "missing field =
// not updated yet, NOT zero" rule. Distinct from the box layers' tf_*box_count.
describe('CRUP confluence counts — box_timeframe_count line layers', () => {
  const lineLayer = (id, field) => ({
    id, label: id, kind: 'line', target: { surface: 'pane', pane: 'CRUP Counts' },
    fields: [field], visible_by_default: true,
  })
  it('renders bull/net_box_timeframe_count as line overlays carrying the row values', () => {
    const rows = [
      row(0, [100, 105, 98, 102], { bull_box_timeframe_count: '2', bear_box_timeframe_count: '1', net_box_timeframe_count: '1' }),
      row(1, [102, 110, 101, 108], { bull_box_timeframe_count: '2', bear_box_timeframe_count: '2', net_box_timeframe_count: '0' }),
    ]
    const cd = buildChartData(rows, { views: crupView([
      lineLayer('crup_mtf_value_bull_box_timeframe_count', 'bull_box_timeframe_count'),
      lineLayer('crup_mtf_value_net_box_timeframe_count', 'net_box_timeframe_count'),
    ]) })
    const bull = cd.offchart.find((o) => o.settings.corkyLayerId === 'crup_mtf_value_bull_box_timeframe_count')
    const net = cd.offchart.find((o) => o.settings.corkyLayerId === 'crup_mtf_value_net_box_timeframe_count')
    expect(bull.type).toBe('Spline')
    expect(bull.data).toEqual([[T0, 2], [T0 + H, 2]])
    expect(net.data).toEqual([[T0, 1], [T0 + H, 0]])
  })
  it('a MISSING confluence field draws no line (not updated yet, NOT a zero line)', () => {
    // CRUP present (other output) but the confluence field absent from the rows
    const rows = [row(0, [100, 105, 98, 102], { bullcount: '5' })]
    const cd = buildChartData(rows, { views: crupView([lineLayer('crup_mtf_value_net_box_timeframe_count', 'net_box_timeframe_count')]) })
    const net = cd.offchart.find((o) => o.settings.corkyLayerId === 'crup_mtf_value_net_box_timeframe_count')
    expect(net == null || net.data.length === 0).toBe(true) // empty → no line, never a 0 baseline
  })
})
