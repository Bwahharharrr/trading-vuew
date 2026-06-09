// Regression tests for corky-ingest.js bug fixes (feedfix batch).
//
// Each test drives the REAL exported functions, not a reimplementation.

import { describe, it, expect } from 'vitest'

import {
  decimalToNumber,
  buildChartData,
  applyLiveUpdate,
} from '../../src/helpers/feed/corky-ingest.js'

// ── tiny row/event builders (no fixtures needed) ─────────────────────────────

function candleRow(ts, { close = '100', indicators } = {}) {
  return {
    timeframe: '1m',
    candle: {
      timestamp_ms: ts,
      open: '100', high: '101', low: '99', close, volume: '1',
    },
    ...(indicators ? { indicators } : {}),
  }
}

function liveEvent(ts, { seq = 1, indicators, candleOverrides } = {}) {
  return {
    subscription_id: 'sub-1',
    sequence: seq,
    row: {
      timeframe: '1m',
      candle: {
        timestamp_ms: ts,
        open: '100', high: '101', low: '99', close: '100', volume: '1',
        ...candleOverrides,
      },
      ...(indicators ? { indicators } : {}),
    },
  }
}

// A view descriptor with one multi-field offchart pane layer (Splines) so we
// can exercise corkyFields column indexing, plus a candle_color layer.
function viewWith(layers) {
  return new Map([['demo:1', { kind: 'demo', layers }]])
}

// ── decimalToNumber ──────────────────────────────────────────────────────────

describe('decimalToNumber hardening', () => {
  it('rejects Infinity / 1e999 → NaN (would otherwise blank panes)', () => {
    expect(decimalToNumber('Infinity')).toBeNaN()
    expect(decimalToNumber('1e999')).toBeNaN()
    expect(decimalToNumber(Infinity)).toBeNaN()
    expect(decimalToNumber(-Infinity)).toBeNaN()
  })
  it('treats whitespace-only as a gap (NaN), not a real 0', () => {
    expect(decimalToNumber(' ')).toBeNaN()
    expect(decimalToNumber('\t')).toBeNaN()
    expect(decimalToNumber('')).toBeNaN()
  })
  it('still parses real decimals exactly', () => {
    expect(decimalToNumber('77865.25')).toBe(77865.25)
    expect(decimalToNumber('-0.5')).toBe(-0.5)
    expect(decimalToNumber(0)).toBe(0)
  })
})

// ── pane-name tagging (build side of the pane-grid bug) ──────────────────────

describe('pane overlays carry stable pane-name + anchor tags', () => {
  it('stamps corkyPaneName on anchor + siblings, corkyPaneAnchor distinguishes', () => {
    const layers = [
      // anchor (first pane layer for pane "p1")
      { id: 'L1', kind: 'line', target: { surface: 'pane', pane: 'p1' }, fields: ['a'] },
      // sibling (same pane → carries grid.id)
      { id: 'L2', kind: 'line', target: { surface: 'pane', pane: 'p1' }, fields: ['b'] },
    ]
    const rows = [
      candleRow(1000, { indicators: { 'demo:1': { a: '1', b: '2' } } }),
      candleRow(2000, { indicators: { 'demo:1': { a: '3', b: '4' } } }),
    ]
    const built = buildChartData(rows, { views: viewWith(layers) })

    expect(built.offchart.length).toBe(2)
    for (const ov of built.offchart) {
      expect(ov.settings.corkyPaneName).toBe('p1')
    }
    const anchor = built.offchart.find((o) => o.settings.corkyPaneAnchor === true)
    const sibling = built.offchart.find((o) => o.settings.corkyPaneAnchor === false)
    expect(anchor).toBeTruthy()
    expect(sibling).toBeTruthy()
    // The anchor spawns the grid (no grid.id); the sibling merges in (grid.id).
    expect(anchor.grid).toBeUndefined()
    expect(sibling.grid && sibling.grid.id).toBeGreaterThanOrEqual(1)
  })
})

// ── corkyFields stores the FILTERED survivor list ────────────────────────────

describe('corkyFields agrees with built columns when a declared field is absent', () => {
  it('drops absent non-final fields so live writes hit the right column', () => {
    // Declare fields [a, b, c] but history only carries a and c (b absent).
    const layers = [
      { id: 'L1', kind: 'line', target: { surface: 'price' }, fields: ['a', 'b', 'c'] },
    ]
    const rows = [
      candleRow(1000, { indicators: { 'demo:1': { a: '1', c: '3' } } }),
      candleRow(2000, { indicators: { 'demo:1': { a: '4', c: '6' } } }),
    ]
    const built = buildChartData(rows, { views: viewWith(layers) })
    const ov = built.onchart[0]
    // Only surviving fields are recorded — b is gone.
    expect(ov.settings.corkyFields).toEqual(['a', 'c'])
    // Columns are [ts, a, c] → width 3.
    expect(ov.data[0].length).toBe(3)

    // Live write of `c` must land in column 2 (corkyFields.indexOf('c')+1), not 3.
    const lastSeq = {}
    applyLiveUpdate(
      { ...built, timeframe: '1m', chart: built.chart },
      liveEvent(2000, { seq: 5, indicators: { 'demo:1': { a: '40', c: '60' } } }),
      lastSeq,
    )
    const rowAt2000 = ov.data.find((r) => r[0] === 2000)
    expect(rowAt2000).toEqual([2000, 40, 60])
  })
})

// ── candle_color byTs updated even while the kind is disabled ─────────────────

describe('candle_color byTs accumulates live bars while disabled', () => {
  it('a disabled candle_color kind still records byTs so a later enable colours it', () => {
    const layers = [
      { id: 'CC', kind: 'candle_color', target: { surface: 'price' }, fields: ['sig'] },
    ]
    const rows = [
      candleRow(1000, { indicators: { 'demo:1': { sig: '1' } } }),
    ]
    const built = buildChartData(rows, { views: viewWith(layers) })
    built.timeframe = '1m'
    const cc = built._candleColor[0]
    expect(cc).toBeTruthy()
    // Disabled: _candleColorActive is empty (nothing enabled yet).
    expect(built._candleColorActive.size).toBe(0)

    const lastSeq = {}
    applyLiveUpdate(built, liveEvent(2000, { seq: 1, indicators: { 'demo:1': { sig: '1' } } }), lastSeq)

    // byTs now carries the live bar even though the kind is disabled.
    expect(cc.byTs.has(2000)).toBe(true)
    // But the candle slot-6 colour was NOT stamped (kind not active).
    const candle = built.chart.data.find((c) => c[0] === 2000)
    expect(candle[6]).toBeUndefined()
  })
})

// ── malformed live row (missing/NaN timestamp) is skipped ────────────────────

describe('applyLiveUpdate guards a malformed timestamp', () => {
  it('skips a row with non-finite timestamp_ms instead of prepending [undefined,...]', () => {
    const rows = [candleRow(1000), candleRow(2000)]
    const built = buildChartData(rows)
    built.timeframe = '1m'
    const before = built.chart.data.length
    const lastSeq = {}

    const res = applyLiveUpdate(
      built,
      liveEvent(undefined, { seq: 1, candleOverrides: { timestamp_ms: undefined } }),
      lastSeq,
    )
    expect(res.applied).toBe(false)
    expect(res.reason).toBe('bad-timestamp')
    // No corrupt tuple spliced at the head.
    expect(built.chart.data.length).toBe(before)
    expect(built.chart.data[0][0]).toBe(1000)
    // lastSeq NOT bumped → a valid later message still applies.
    expect(lastSeq['sub-1']).toBeUndefined()

    const ok = applyLiveUpdate(
      built,
      liveEvent(3000, { seq: 1 }),
      lastSeq,
    )
    expect(ok.applied).toBe(true)
  })

  it('buildChartData filters malformed history rows', () => {
    const rows = [
      candleRow(1000),
      { timeframe: '1m', candle: { timestamp_ms: undefined } }, // garbage
      candleRow(2000),
    ]
    const built = buildChartData(rows)
    expect(built.chart.data.map((c) => c[0])).toEqual([1000, 2000])
  })
})

// ── signed_slope_histogram out-of-order backfill uses correct prev bar ───────

describe('signed_slope_histogram backfill picks prev bar by position', () => {
  it('an older-ts live tick derives slope from the bar before its insert index', () => {
    const layers = [
      {
        id: 'H', kind: 'histogram',
        target: { surface: 'pane', pane: 'h' },
        fields: ['v'],
        style: {
          color_rule: 'signed_slope_histogram', value_field: 'v',
          positive_rising_color: '#R', positive_falling_color: '#F',
          negative_falling_color: '#nf', negative_rising_color: '#nr',
        },
      },
    ]
    // History bars at ts 1000 (v=10) and 3000 (v=1) — note the gap at 2000.
    const rows = [
      candleRow(1000, { indicators: { 'demo:1': { v: '10' } } }),
      candleRow(3000, { indicators: { 'demo:1': { v: '1' } } }),
    ]
    const built = buildChartData(rows, { views: viewWith(layers) })
    built.timeframe = '1m'
    const ov = built.offchart.find((o) => o.settings.corkyColorRule === 'signed_slope_histogram')
    expect(ov).toBeTruthy()

    const lastSeq = {}
    // Backfill an OLDER ts (2000) with v=5. Insert index is between 1000 and
    // 3000 → prev bar is 1000 (v=10) → slope = 5 - 10 = -5 (FALLING), value>0 →
    // positive_falling '#F'. The buggy append-assumption used the LAST bar
    // (3000, v=1) → slope = 5 - 1 = +4 (RISING) → positive_rising '#R'.
    applyLiveUpdate(
      built,
      liveEvent(2000, { seq: 1, indicators: { 'demo:1': { v: '5' } } }),
      lastSeq,
    )
    const bar = ov.data.find((r) => r[0] === 2000)
    expect(bar).toBeTruthy()
    expect(bar[1]).toBe(5)          // value
    expect(bar[2]).toBe('#F')       // positive_falling — proves prev = bar 1000
    // Ordering preserved (ascending by ts).
    expect(ov.data.map((r) => r[0])).toEqual([1000, 2000, 3000])
  })
})
