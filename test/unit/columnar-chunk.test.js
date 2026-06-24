// columnarChunkToRows — reconstruct row-format historical chunks from the
// gateway's compact `historical_chunk_columnar` payload, and prove the rebuilt
// rows drive byte-identical chart data vs the equivalent row-format chunk.
import { describe, it, expect } from 'vitest'
import {
  columnarChunkToRows, assembleChunks, buildChartData,
} from '../../src/helpers/feed/corky-ingest.js'

// A 3-row columnar chunk: OHLCV decimal strings + a MACD indicator whose
// `histogram` is null on the middle row (absent for that bar).
function columnarEvent(over = {}) {
  return {
    type: 'historical_chunk_columnar',
    subscription_id: 'sub-1',
    chunk_index: 0,
    timeframe: '1h',
    columns: {
      timestamp_ms: [1000, 2000, 3000],
      open: ['10', '11', '12'],
      high: ['12', '13', '14'],
      low: ['9', '10', '11'],
      close: ['11', '12', '9'],
      volume: ['100', '250', '175'],
      status: ['confirmed', 'confirmed', 'provisional'],
      source: ['historical_query', 'historical_query', 'live'],
      updated_at_ms: [null, null, 3001],
      confirmed_at_ms: [null, null, null],
      indicators: {
        'MACD(12,26,9)': {
          histogram: ['0.5', null, '-0.3'], // middle row absent
          macd: ['1.0', '1.1', '0.9'],
        },
      },
      ...over,
    },
  }
}

// The SAME data as row-format rows (what historical_chunk would carry).
function rowEvent() {
  return {
    type: 'historical_chunk', subscription_id: 'sub-1', chunk_index: 0, timeframe: '1h',
    rows: [
      { timeframe: '1h', candle: { timestamp_ms: 1000, open: '10', high: '12', low: '9', close: '11', volume: '100' }, indicators: { 'MACD(12,26,9)': { histogram: '0.5', macd: '1.0' } } },
      { timeframe: '1h', candle: { timestamp_ms: 2000, open: '11', high: '13', low: '10', close: '12', volume: '250' }, indicators: { 'MACD(12,26,9)': { macd: '1.1' } } },
      { timeframe: '1h', candle: { timestamp_ms: 3000, open: '12', high: '14', low: '11', close: '9', volume: '175' }, indicators: { 'MACD(12,26,9)': { histogram: '-0.3', macd: '0.9' } } },
    ],
  }
}

describe('columnarChunkToRows', () => {
  it('rebuilds one row per index with OHLCV kept as strings', () => {
    const { rows } = columnarChunkToRows(columnarEvent())
    expect(rows).toHaveLength(3)
    expect(rows[0].candle).toEqual({ timestamp_ms: 1000, open: '10', high: '12', low: '9', close: '11', volume: '100' })
    expect(typeof rows[0].candle.close).toBe('string') // NOT float-parsed
    expect(rows[2].candle.timestamp_ms).toBe(3000)
  })

  it('nests indicators as indicators[label][field] and OMITS null fields (absent, not 0)', () => {
    const { rows } = columnarChunkToRows(columnarEvent())
    expect(rows[0].indicators['MACD(12,26,9)']).toEqual({ histogram: '0.5', macd: '1.0' })
    // middle row: histogram was null → absent (key missing), macd present
    expect(rows[1].indicators['MACD(12,26,9)']).toEqual({ macd: '1.1' })
    expect('histogram' in rows[1].indicators['MACD(12,26,9)']).toBe(false)
    expect(rows[2].indicators['MACD(12,26,9)']).toEqual({ histogram: '-0.3', macd: '0.9' })
  })

  it('preserves chunk_index + timeframe and reports the row-chunk shape', () => {
    const out = columnarChunkToRows(columnarEvent({}))
    expect(out.type).toBe('historical_chunk')
    expect(out.chunk_index).toBe(0)
    expect(out.timeframe).toBe('1h')
    expect(out.subscription_id).toBe('sub-1')
  })

  it('falls back to the provided timeframe when the event omits it', () => {
    const ev = columnarEvent()
    delete ev.timeframe
    const out = columnarChunkToRows(ev, '4h')
    expect(out.timeframe).toBe('4h')
    expect(out.rows[0].timeframe).toBe('4h')
  })

  it('handles an empty / indicator-less chunk', () => {
    const empty = columnarChunkToRows({ type: 'historical_chunk_columnar', chunk_index: 1, timeframe: '1h', columns: { timestamp_ms: [] } })
    expect(empty.rows).toEqual([])
    const noInd = columnarChunkToRows({
      chunk_index: 0, timeframe: '1h',
      columns: { timestamp_ms: [1000], open: ['1'], high: ['1'], low: ['1'], close: ['1'], volume: ['1'] },
    })
    expect(noInd.rows[0].indicators).toEqual({})
  })

  it('a row whose every indicator field is null gets indicators:{} (no label)', () => {
    const ev = columnarEvent({ indicators: { 'MACD(12,26,9)': { histogram: [null], macd: [null] } }, timestamp_ms: [1000], open: ['1'], high: ['1'], low: ['1'], close: ['1'], volume: ['1'] })
    const { rows } = columnarChunkToRows(ev)
    expect(rows[0].indicators).toEqual({})
  })
})

describe('columnar → identical chart data as row format', () => {
  it('buildChartData over reconstructed columnar rows === over native row chunk', () => {
    const fromCol = buildChartData(assembleChunks([columnarChunkToRows(columnarEvent())]), { timeframe: '1h' })
    const fromRows = buildChartData(assembleChunks([rowEvent()]), { timeframe: '1h' })
    expect(fromCol.chart.data).toEqual(fromRows.chart.data)        // candles identical
    expect(fromCol.offchart.length).toBe(fromRows.offchart.length) // same overlays
    // the MACD overlay series match point-for-point
    const colMacd = fromCol.offchart.map((o) => o.data)
    const rowMacd = fromRows.offchart.map((o) => o.data)
    expect(colMacd).toEqual(rowMacd)
  })
})
