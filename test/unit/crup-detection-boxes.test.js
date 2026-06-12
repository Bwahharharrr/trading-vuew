// CRUP detection-zone boxes (box_rule: detection_zone_until_close_breaks).
//
// One box per detection candle: span = that candle's low..high, LEFT edge =
// its CLOSE time (the detection candle is never inside its own box). A bull
// box dies when a later candle CLOSES strictly below its bottom (wicks don't
// invalidate); the invalidating candle is still covered. Boxes render as
// individual translucent rects (no merging) so overlaps stack k×.
import { test, expect, describe } from 'vitest'
import {
  detectionBoxRule, hexToRgba, detectionSet,
} from '../../src/helpers/feed/indicator-catalog.js'
import {
  buildChartData, applyLiveUpdate, buildDetectionBoxes, detectionBoxRows,
  detectionBoxCountAt,
} from '../../src/helpers/feed/corky-ingest.js'

const TF = 3_600_000
const T = (i) => 1_780_000_000_000 + i * TF

const BOX_LAYER = {
  id: 'crup_detection_boxes', label: 'CRUP boxes', kind: 'box',
  target: { surface: 'price' },
  fields: ['bull_detected_now', 'bear_detected_now'],
  visible_by_default: true,
  style: {
    box_rule: 'detection_zone_until_close_breaks',
    bull_field: 'bull_detected_now',
    bear_field: 'bear_detected_now',
    bull_fill_color: '#00e676',
    bear_fill_color: '#d64545',
    fill_opacity: '0.15',
  },
}
const views = () => ({ CRUP: { kind: 'crup', view: { version: 1, layers: [BOX_LAYER] } } })
const GREEN15 = hexToRgba('#00e676', 0.15)

// bar = [o, h, l, c, flags?]
function mkRows(bars, extraFields = {}) {
  return bars.map((b, i) => ({
    timeframe: '1h',
    candle: {
      timestamp_ms: T(i),
      open: String(b[0]), high: String(b[1]), low: String(b[2]),
      close: String(b[3]), volume: '5',
    },
    indicators: {
      CRUP: {
        bull_detected_now: String((b[4] && b[4].bull) || 0),
        bear_detected_now: String((b[4] && b[4].bear) || 0),
        ...(extraFields[i] || {}),
      },
    },
  }))
}

// The protocol's worked example:
// T1 detects bull (low 101, high 111); T2 closes 106 (covered); T3 wicks to 95
// but CLOSES 103 (survives); T4 closes 100.5 (< 101 → dies, still covered);
// T5 onward count 0.
const WORKED = [
  [104, 110, 100, 105],                       // T0 setup
  [105, 111, 101, 110, { bull: 1 }],          // T1 detection
  [110, 107, 104, 106],                       // T2 covered
  [106, 107, 95, 103],                        // T3 wick-through survives
  [103, 104, 99, 100.5],                      // T4 close-break dies (covered)
  [100.5, 103, 100, 102],                     // T5 free
]

describe('rule parse', () => {
  test('detectionBoxRule reads everything from style; non-rule → null', () => {
    const r = detectionBoxRule(BOX_LAYER.style)
    expect(r.bullField).toBe('bull_detected_now')
    expect(r.bullFill).toBe('#00e676')
    expect(r.bearFill).toBe('#d64545')
    expect(r.fillOpacity).toBe(0.15)
    expect(detectionBoxRule({ box_rule: 'other' })).toBeNull()
    expect(detectionBoxRule(undefined)).toBeNull()
  })

  test('detectionSet: >= 0.5 is set; strings/floats/junk handled', () => {
    expect(detectionSet('1')).toBe(true)
    expect(detectionSet('0.5')).toBe(true)
    expect(detectionSet('0.49')).toBe(false)
    expect(detectionSet('0')).toBe(false)
    expect(detectionSet(undefined)).toBe(false)
    expect(detectionSet('abc')).toBe(false)
  })
})

describe('build: the worked example', () => {
  test('box geometry + lifetime exactly as specified', () => {
    const built = buildChartData(mkRows(WORKED), { views: views() })
    const db = built._detectionBoxes
    expect(db.length).toBe(1)
    const boxes = db[0].boxes
    expect(boxes.length).toBe(1)
    const b = boxes[0]
    expect(b.side).toBe('bull')
    expect(b.top).toBe(111)
    expect(b.bottom).toBe(101)
    expect(b.t0).toBe(T(1) + TF)   // left edge = T1's CLOSE time (= T2 open)
    expect(b.t1).toBe(T(4) + TF)   // right edge = T4's close (invalidator covered)
    expect(b.alive).toBe(false)    // killed by T4's 100.5 close

    // overlay: one borderless translucent rect in settings.zones
    const ov = built.onchart.find((o) => o.settings && o.settings.corkyLayerId === 'crup_detection_boxes')
    expect(ov).toBeTruthy()
    expect(ov.type).toBe('Zones')
    expect(ov.data).toEqual([])    // rows live in settings.zones (no x1 clipping)
    expect(ov.settings.zones).toEqual([[T(1) + TF, 111, T(4) + TF, 101, GREEN15]])
  })

  test('per-bar coverage counts match the server truth columns', () => {
    // server publishes bull_box_count per bar: T0..T5 → 0,0,1,1,1,0
    const serverCounts = [0, 0, 1, 1, 1, 0]
    const extra = {}
    serverCounts.forEach((c, i) => { extra[i] = { bull_box_count: String(c) } })
    const built = buildChartData(mkRows(WORKED, extra), { views: views() })
    const { boxes, tf } = built._detectionBoxes[0]
    serverCounts.forEach((c, i) => {
      expect(detectionBoxCountAt(boxes, T(i), tf, 'bull')).toBe(c)
    })
  })

  test('wick through the level does NOT invalidate (T3 wicks 95 < 101)', () => {
    const built = buildChartData(mkRows(WORKED.slice(0, 4)), { views: views() })
    const b = built._detectionBoxes[0].boxes[0]
    expect(b.alive).toBe(true)               // survived the wick
    expect(b.t1).toBe(T(3) + TF)             // extended through T3
  })
})

describe('build: overlap stacking (second detection at T2)', () => {
  const OVERLAP = WORKED.map((b, i) =>
    i === 2 ? [110, 115, 103, 106, { bull: 1 }] : b)

  test('two separate boxes (never merged); both die on T4', () => {
    const built = buildChartData(mkRows(OVERLAP), { views: views() })
    const { boxes, tf } = built._detectionBoxes[0].boxes ? built._detectionBoxes[0] : {}
    expect(boxes.length).toBe(2)
    const [b1, b2] = boxes
    expect([b1.top, b1.bottom]).toEqual([111, 101])
    expect([b2.top, b2.bottom]).toEqual([115, 103])
    // T4 close 100.5 breaks BOTH bottoms (101 and 103)
    expect(b1.alive).toBe(false)
    expect(b2.alive).toBe(false)
    // T4 shows count 2 with envelope top 115 / bottom 101
    expect(detectionBoxCountAt(boxes, T(4), tf, 'bull')).toBe(2)
    const covering = boxes.filter((b) => b.t0 <= T(4) && b.t1 >= T(4) + TF)
    expect(Math.max(...covering.map((b) => b.top))).toBe(115)
    expect(Math.min(...covering.map((b) => b.bottom))).toBe(101)
    // rendered as TWO stacked 15%-opacity rects
    const rows = detectionBoxRows(boxes, detectionBoxRule(BOX_LAYER.style))
    expect(rows.length).toBe(2)
    expect(rows.every((r) => r[4] === GREEN15)).toBe(true)
  })
})

describe('build: seed boxes (window starts inside an off-screen anchor)', () => {
  test('first bar count>0 → one seed rect from the envelope, opacity × count', () => {
    const bars = [
      [104, 110, 100, 105],
      [105, 108, 102, 106],
      [106, 108, 95, 96],     // closes below seed bottom → seed dies here
      [96, 99, 94, 97],
    ]
    const extra = { 0: { bull_box_count: '2', bull_box_top: '115', bull_box_bottom: '101' } }
    const built = buildChartData(mkRows(bars, extra), { views: views() })
    const { boxes } = built._detectionBoxes[0]
    expect(boxes.length).toBe(1)
    const seed = boxes[0]
    expect(seed.seed).toBe(true)
    expect([seed.top, seed.bottom]).toEqual([115, 101])
    expect(seed.t0).toBe(T(0))               // anchored at the window's left edge
    expect(seed.alive).toBe(false)           // T2 closed 96 < 101
    expect(seed.t1).toBe(T(2) + TF)
    const rows = detectionBoxRows(boxes, detectionBoxRule(BOX_LAYER.style))
    expect(rows[0][4]).toBe(hexToRgba('#00e676', 0.3))   // 0.15 × 2, under the cap
  })

  test('count 0 envelope values are "no boxes", not price levels', () => {
    const extra = { 0: { bull_box_count: '0', bull_box_top: '0', bull_box_bottom: '0' } }
    const built = buildChartData(mkRows(WORKED.slice(0, 2), extra), { views: views() })
    expect(built._detectionBoxes[0].boxes.filter((b) => b.seed)).toHaveLength(0)
  })
})

describe('live: close-only re-evaluation', () => {
  function liveRow(i, bar, seq) {
    return {
      subscription_id: 's', sequence: seq,
      row: mkRows([[...bar.slice(0, 4), bar[4]]])[0],
    }
  }
  function liveRowAt(ts, bar, seq) {
    const r = liveRow(0, bar, seq)
    r.row.candle.timestamp_ms = ts
    return r
  }

  function boot() {
    // history through T2 (box anchored at T1 close, alive)
    const built = buildChartData(mkRows(WORKED.slice(0, 3)), { views: views() })
    expect(built._detectionBoxes[0].boxes).toHaveLength(1)
    return built
  }

  test('a provisional close below the bottom does NOT kill the box', () => {
    const built = boot()
    const b = built._detectionBoxes[0].boxes[0]
    // T3 forming with a provisional close of 95 — far below bottom 101
    applyLiveUpdate(built, liveRowAt(T(3), [106, 107, 95, 95], 1), {})
    expect(b.alive).toBe(true)               // never retract on provisional
    expect(b.t1).toBe(T(3) + TF)             // extended to the live edge
    // T3 settles at 103 (same-ts update), then T4 opens → T3's CLOSE is final
    applyLiveUpdate(built, liveRowAt(T(3), [106, 107, 95, 103], 2), {})
    applyLiveUpdate(built, liveRowAt(T(4), [103, 104, 99, 100], 3), {})
    expect(b.alive).toBe(true)               // 103 ≥ 101: survived for real
  })

  test('the bar CLOSE kills the box; the invalidator stays covered', () => {
    const built = boot()
    const b = built._detectionBoxes[0].boxes[0]
    applyLiveUpdate(built, liveRowAt(T(3), [106, 107, 95, 103], 1), {})
    applyLiveUpdate(built, liveRowAt(T(4), [103, 104, 99, 100.5], 2), {})  // forming
    expect(b.alive).toBe(true)               // provisional 100.5 doesn't kill
    applyLiveUpdate(built, liveRowAt(T(5), [100.5, 103, 100, 102], 3), {}) // T4 closed
    expect(b.alive).toBe(false)              // 100.5 < 101 final → dead
    expect(b.t1).toBe(T(4) + TF)             // right edge at the invalidator's close
    // overlay rows regenerated in place
    const ov = built.onchart.find((o) => o.settings.corkyLayerId === 'crup_detection_boxes')
    expect(ov.settings.zones[0][2]).toBe(T(4) + TF)
  })

  test('a detection on a live bar anchors its box when the NEXT bar opens', () => {
    const built = boot()
    // T3: flags flip intrabar — 1 then 0 then 1; the LAST value before close wins
    applyLiveUpdate(built, liveRowAt(T(3), [106, 109, 102, 108, { bull: 1 }], 1), {})
    applyLiveUpdate(built, liveRowAt(T(3), [106, 109, 102, 107, { bull: 0 }], 2), {})
    applyLiveUpdate(built, liveRowAt(T(3), [106, 110, 102, 109, { bull: 1 }], 3), {})
    expect(built._detectionBoxes[0].boxes).toHaveLength(1)   // not anchored yet
    applyLiveUpdate(built, liveRowAt(T(4), [109, 111, 107, 110], 4), {})   // T3 closed
    const boxes = built._detectionBoxes[0].boxes
    expect(boxes).toHaveLength(2)
    const nb = boxes[1]
    expect(nb.t0).toBe(T(3) + TF)            // anchored at T3's close
    expect([nb.top, nb.bottom]).toEqual([110, 102])   // T3's final high/low
  })
})
