import { describe, it, expect } from 'vitest'

import {
  decimalToNumber,
  rowToOhlcv,
  pivotIndicators,
  buildChartData,
  assembleChunks,
  applyLiveUpdate,
} from '../../src/helpers/feed/corky-ingest.js'
import { indicatorPlacement } from '../../src/helpers/feed/indicator-catalog.js'

import {
  historicalChunkEvent,
  liveUpdateEvent,
} from '../fixtures/corky/index.js'

const chunkRows = historicalChunkEvent.event.rows
const liveEvent = liveUpdateEvent.event

describe('decimalToNumber', () => {
  it('parses decimal strings exactly', () => {
    expect(decimalToNumber('77865.25')).toBe(77865.25)
    expect(decimalToNumber('0.48485427')).toBe(0.48485427)
    expect(decimalToNumber(77871)).toBe(77871)
  })
  it('is NaN-safe for empty / null / garbage', () => {
    expect(decimalToNumber('')).toBeNaN()
    expect(decimalToNumber(null)).toBeNaN()
    expect(decimalToNumber(undefined)).toBeNaN()
    expect(decimalToNumber('not-a-number')).toBeNaN()
  })
})

describe('rowToOhlcv', () => {
  it('golden-pins the chunk row to a numeric OHLCV tuple', () => {
    expect(rowToOhlcv(chunkRows[0])).toEqual([
      1779464940000, 77880, 77884, 77867, 77871, 0.48485427,
    ])
  })
})

describe('indicatorPlacement', () => {
  it('places sma onchart with an existing line overlay type', () => {
    expect(indicatorPlacement('sma')).toEqual({ pane: 'onchart', overlayType: 'Spline' })
  })
  it('places momentum kinds offchart', () => {
    expect(indicatorPlacement('rsi').pane).toBe('offchart')
    expect(indicatorPlacement('volume')).toEqual({ pane: 'offchart', overlayType: 'Histogram' })
  })
  it('falls back to an offchart line for unknown kinds', () => {
    expect(indicatorPlacement('mystery')).toEqual({ pane: 'offchart', overlayType: 'Spline' })
  })
})

describe('pivotIndicators', () => {
  it('accumulates [ts, value] per instanceKey.output, ascending', () => {
    const series = pivotIndicators(chunkRows)
    expect(series).toHaveLength(1)
    expect(series[0].key).toBe('sma:20.sma')
    expect(series[0].instanceKey).toBe('sma:20')
    expect(series[0].output).toBe('sma')
    expect(series[0].data).toEqual([[1779464940000, 77865.25]])
    expect(series[0].raw).toEqual([[1779464940000, '77865.25']])
  })
})

describe('buildChartData', () => {
  it('golden-pins OHLCV + an onchart SMA overlay', () => {
    const cd = buildChartData(chunkRows)

    expect(cd.chart.type).toBe('Candles')
    expect(cd.chart.data).toEqual([
      [1779464940000, 77880, 77884, 77867, 77871, 0.48485427],
    ])

    expect(cd.offchart).toEqual([])
    expect(cd.onchart).toHaveLength(1)
    const sma = cd.onchart[0]
    expect(sma.name).toBe('sma:20')
    expect(sma.type).toBe('Spline')
    expect(sma.data).toEqual([[1779464940000, 77865.25]])
    // raw decimal strings preserved as sidecar for tooltips
    expect(sma.raw).toEqual([[1779464940000, '77865.25']])
  })
})

describe('assembleChunks', () => {
  it('orders by chunk_index then row order and dedupes by [timeframe, ts]', () => {
    const events = [
      {
        chunk_index: 1,
        timeframe: '1m',
        rows: [
          { timeframe: '1m', candle: { timestamp_ms: 2000, open: '2', high: '2', low: '2', close: '2', volume: '0' } },
        ],
      },
      {
        chunk_index: 0,
        timeframe: '1m',
        rows: [
          { timeframe: '1m', candle: { timestamp_ms: 1000, open: '1', high: '1', low: '1', close: '1', volume: '0' } },
          // duplicate [tf, ts] later in stream replaces the earlier value
          { timeframe: '1m', candle: { timestamp_ms: 1000, open: '9', high: '9', low: '9', close: '9', volume: '0' } },
        ],
      },
    ]
    const rows = assembleChunks(events)
    expect(rows.map((r) => r.candle.timestamp_ms)).toEqual([1000, 2000])
    // last-write-wins for the duplicate ts
    expect(rows[0].candle.open).toBe('9')
  })

  it('dedupes the same ts across different timeframes independently', () => {
    const events = [
      {
        chunk_index: 0,
        timeframe: 'mixed',
        rows: [
          { timeframe: '1m', candle: { timestamp_ms: 5000, open: '1', high: '1', low: '1', close: '1', volume: '0' } },
          { timeframe: '5m', candle: { timestamp_ms: 5000, open: '2', high: '2', low: '2', close: '2', volume: '0' } },
        ],
      },
    ]
    const rows = assembleChunks(events)
    expect(rows).toHaveLength(2)
  })
})

describe('applyLiveUpdate', () => {
  it('appends a newer live row and updates the SMA overlay', () => {
    const cd = buildChartData(chunkRows)
    const lastSeq = {}

    const res = applyLiveUpdate(cd, liveEvent, lastSeq)
    expect(res.applied).toBe(true)
    expect(res.sequence).toBe(42)
    expect(lastSeq['chart-sub-tbtc-1m']).toBe(42)

    // candle appended (1779465000000 after 1779464940000)
    expect(cd.chart.data).toEqual([
      [1779464940000, 77880, 77884, 77867, 77871, 0.48485427],
      [1779465000000, 77871, 77895, 77860, 77890, 1.25],
    ])

    // SMA overlay got its new point appended
    expect(cd.onchart[0].data).toEqual([
      [1779464940000, 77865.25],
      [1779465000000, 77866.2],
    ])
    expect(cd.onchart[0].raw).toEqual([
      [1779464940000, '77865.25'],
      [1779465000000, '77866.20'],
    ])
  })

  it('rejects an out-of-order / duplicate sequence', () => {
    const cd = buildChartData(chunkRows)
    const lastSeq = {}

    expect(applyLiveUpdate(cd, liveEvent, lastSeq).applied).toBe(true)

    // same sequence again → dropped
    const dup = applyLiveUpdate(cd, liveEvent, lastSeq)
    expect(dup.applied).toBe(false)
    expect(dup.sequence).toBe(42)

    // a strictly-lower sequence → dropped
    const older = applyLiveUpdate(
      cd,
      { ...liveEvent, sequence: 10 },
      lastSeq
    )
    expect(older.applied).toBe(false)

    // chart untouched by the rejected updates (still 2 candles)
    expect(cd.chart.data).toHaveLength(2)
    expect(lastSeq['chart-sub-tbtc-1m']).toBe(42)
  })

  it('replaces a same-ts live row (upsert by timestamp)', () => {
    const cd = buildChartData(chunkRows)
    const lastSeq = {}
    applyLiveUpdate(cd, liveEvent, lastSeq)

    // a higher sequence carrying the SAME ts replaces in place (no append)
    const revised = {
      ...liveEvent,
      sequence: 43,
      row: {
        ...liveEvent.row,
        candle: { ...liveEvent.row.candle, close: '77999' },
      },
    }
    applyLiveUpdate(cd, revised, lastSeq)

    expect(cd.chart.data).toHaveLength(2)
    expect(cd.chart.data[1]).toEqual([1779465000000, 77871, 77895, 77860, 77999, 1.25])
  })
})
