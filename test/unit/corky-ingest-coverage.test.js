// Coverage tests for the Corky ingestion transforms (pure helpers, node env).
//
// Focuses on the out-of-order live-merge column writer (`upsertColumn`, exercised
// via applyLiveUpdate on a multi-field view overlay) and the empty / NaN edges of
// buildChartData / rowToOhlcv / assembleChunks. These branches are not covered by
// corky-ingest.test.js (which pins the in-order append happy path).
//
// All inputs are hand-built (no fixtures, no network, no timers) so the asserted
// values are derived purely from reading the source — see corky-ingest.js.

import { describe, it, expect } from 'vitest'

import {
  buildChartData,
  applyLiveUpdate,
  rowToOhlcv,
  assembleChunks,
} from '../../src/helpers/feed/corky-ingest.js'

// A row carrying a multi-field `band` indicator instance (`bbands:20`) with the
// two outputs `a`/`b`. Omit a field by passing `undefined` for it.
function bbRow(ts, a, b) {
  const outputs = {}
  if (a !== undefined) outputs.a = a
  if (b !== undefined) outputs.b = b
  return {
    timeframe: '1m',
    candle: { timestamp_ms: ts, open: '1', high: '1', low: '1', close: '1', volume: '0' },
    indicators: { 'bbands:20': outputs },
  }
}

// A `band` view over the `a`/`b` fields → a multi-column Channel overlay whose
// data rows are [ts, a, b]. corkyFields=[a,b] is what the live writer indexes on.
const bandViews = {
  'bbands:20': {
    kind: 'bbands',
    view: { layers: [{ id: 'band1', kind: 'band', label: 'BB', fields: ['a', 'b'] }] },
  },
}

function live(ts, a, b, sequence) {
  return { type: 'live_update', subscription_id: 'sub-bb', sequence, row: bbRow(ts, a, b) }
}

describe('applyLiveUpdate — out-of-order upsertColumn into a multi-field view overlay', () => {
  // Shared starting point: history at ts 1000 and 3000, both fields present.
  function fresh() {
    const cd = buildChartData([bbRow(1000, '10', '20'), bbRow(3000, '30', '40')], { views: bandViews })
    // Sanity: the view resolved to a multi-column Channel keyed for live writes.
    const ov = cd.onchart[0]
    expect(cd.onchart).toHaveLength(1)
    expect(ov.type).toBe('Channel')
    expect(ov.settings.corkyView).toBe(true)
    expect(ov.settings.corkyInstance).toBe('bbands:20')
    expect(ov.settings.corkyFields).toEqual(['a', 'b'])
    expect(ov.data).toEqual([[1000, 10, 20], [3000, 30, 40]])
    return { cd, ov, lastSeq: {} }
  }

  it('1) inserts an OLDER mid tick at the ascending position (binary-search insert, not append)', () => {
    const { cd, ov, lastSeq } = fresh()
    const res = applyLiveUpdate(cd, live(2000, '25', '35', 1), lastSeq)
    expect(res.applied).toBe(true)
    // 2000 lands BETWEEN 1000 and 3000 — not appended at the end.
    expect(ov.data).toEqual([[1000, 10, 20], [2000, 25, 35], [3000, 30, 40]])
  })

  it('2) an out-of-order tick matching an existing MIDDLE ts updates only the written column', () => {
    const { cd, ov, lastSeq } = fresh()
    // First backfill 2000 with both fields, then a same-ts tick carrying only `a`.
    applyLiveUpdate(cd, live(2000, '25', '35', 1), lastSeq)
    applyLiveUpdate(cd, live(2000, '99', undefined, 2), lastSeq)
    // Column a overwritten to 99; column b (35) preserved — same-ts in-place edit.
    expect(ov.data).toEqual([[1000, 10, 20], [2000, 99, 35], [3000, 30, 40]])
  })

  it('3) a backfilled ts older than ALL rows inserts at index 0 and keeps ascending order', () => {
    const { cd, ov, lastSeq } = fresh()
    const res = applyLiveUpdate(cd, live(500, '5', '6', 1), lastSeq)
    expect(res.applied).toBe(true)
    expect(ov.data[0]).toEqual([500, 5, 6])
    expect(ov.data).toEqual([[500, 5, 6], [1000, 10, 20], [3000, 30, 40]])
  })

  it('4) an older NEW ts providing only the 2nd field yields [ts, null, value] (first column stays null)', () => {
    const { cd, ov, lastSeq } = fresh()
    const res = applyLiveUpdate(cd, live(700, undefined, '77', 1), lastSeq)
    expect(res.applied).toBe(true)
    // Fresh inserted row is [ts, null, null] then column b (index 2) is written.
    expect(ov.data).toEqual([[700, null, 77], [1000, 10, 20], [3000, 30, 40]])
  })
})

describe('buildChartData — empty input', () => {
  it('5) returns the empty Candles skeleton with non-enumerable empty candle-colour metadata (no throw)', () => {
    const cd = buildChartData([])

    // Only enumerable keys are the three lists; the skeleton is exactly this.
    expect(cd).toEqual({ chart: { type: 'Candles', data: [] }, onchart: [], offchart: [] })

    // _candleColor / _candleColorActive exist but are NON-enumerable sidecars.
    const ccDesc = Object.getOwnPropertyDescriptor(cd, '_candleColor')
    expect(ccDesc.enumerable).toBe(false)
    expect(cd._candleColor).toEqual([])

    expect(Object.getOwnPropertyDescriptor(cd, '_candleColorActive').enumerable).toBe(false)
    expect(cd._candleColorActive).toBeInstanceOf(Set)
    expect(cd._candleColorActive.size).toBe(0)
  })
})

describe('buildChartData — unknown/empty view falls back to plot-every-output', () => {
  it('6) an instance with an empty-layers view plots every output via indicatorPlacement', () => {
    const rows = [
      { timeframe: '1m', candle: { timestamp_ms: 1000, open: '1', high: '1', low: '1', close: '1', volume: '0' }, indicators: { 'mystery:7': { out: '5' } } },
      { timeframe: '1m', candle: { timestamp_ms: 2000, open: '1', high: '1', low: '1', close: '1', volume: '0' }, indicators: { 'mystery:7': { out: '6' } } },
    ]
    // layers: [] → viewOf() returns null → byte-identical legacy fallback.
    const views = { 'mystery:7': { kind: 'mystery', view: { layers: [] } } }
    const cd = buildChartData(rows, { views })

    // Unknown kind places offchart as a Spline; nothing on the price pane.
    expect(cd.onchart).toEqual([])
    expect(cd.offchart).toHaveLength(1)
    const ov = cd.offchart[0]
    // name is the full series key (output differs from kind/instanceKey).
    expect(ov.name).toBe('mystery:7.out')
    expect(ov.type).toBe('Spline')
    expect(ov.data).toEqual([[1000, 5], [2000, 6]])
    expect(ov.settings).toEqual({ corkyKey: 'mystery:7.out', corkyKind: 'mystery', corkyOutput: 'out' })
    // No corkyView marker on a fallback overlay (would be present on a view overlay).
    expect(ov.settings.corkyView).toBeUndefined()
  })
})

describe('rowToOhlcv — NaN edges (never throws, never coerces empty to 0)', () => {
  it('7) open:"" / high:"not-a-number" become NaN; valid slots stay numeric', () => {
    const tuple = rowToOhlcv({
      candle: { timestamp_ms: 111, open: '', high: 'not-a-number', low: '5', close: '6', volume: '7' },
    })
    expect(tuple[0]).toBe(111)
    expect(tuple[1]).toBeNaN()      // '' → NaN, NOT 0 (Number('') === 0 would be a bug)
    expect(tuple[2]).toBeNaN()      // 'not-a-number' → NaN
    expect(tuple[3]).toBe(5)
    expect(tuple[4]).toBe(6)
    expect(tuple[5]).toBe(7)
  })
})

describe('assembleChunks — guards & numeric ordering', () => {
  it('8) a chunk event with no `rows` property returns [] (rows||[] guard, no throw)', () => {
    expect(assembleChunks([{ chunk_index: 0 }])).toEqual([])
  })

  it('9) orders numerically by chunk_index even when it arrives as a STRING ("10" after "2")', () => {
    const rows = assembleChunks([
      { chunk_index: '10', rows: [{ timeframe: '1m', candle: { timestamp_ms: 10, open: 'ten' } }] },
      { chunk_index: '2', rows: [{ timeframe: '1m', candle: { timestamp_ms: 2, open: 'two' } }] },
    ])
    // Number() coercion: 2 before 10. Lexical sort would put "10" before "2".
    expect(rows.map((r) => r.candle.timestamp_ms)).toEqual([2, 10])
    expect(rows.map((r) => r.candle.open)).toEqual(['two', 'ten'])
  })
})
