import { describe, expect, test } from 'vitest'
import {
  balanceChartPoints, splitBalanceSegments, strategyBalanceChartData,
} from '../../src/helpers/feed/strategy-balance-chart.js'

describe('strategy balance chart helpers', () => {
  test('parses decimal strings only at the rendering boundary and orders points', () => {
    const points = balanceChartPoints({ points: [
      { timestamp_ms: 2, booked_balance: '990', equity: null, mark_status: 'partial' },
      { timestamp_ms: 1, booked_balance: '1000.25', equity: '1001.5', mark_status: 'complete' },
    ] })
    expect(points).toEqual([
      { timestamp: 1, booked: 1000.25, equity: 1001.5, markStatus: 'complete' },
      { timestamp: 2, booked: 990, equity: null, markStatus: 'partial' },
    ])
  })

  test('splits a line exactly where it crosses the starting balance', () => {
    const segments = splitBalanceSegments([
      { timestamp: 0, booked: 110 },
      { timestamp: 10, booked: 90 },
      { timestamp: 20, booked: 120 },
    ], 'booked', 100)
    expect(segments.map((segment) => segment.tone)).toEqual(['profit', 'loss', 'profit'])
    expect(segments[0].points.at(-1)).toEqual({ timestamp: 5, value: 100 })
    expect(segments[1].points.at(-1).timestamp).toBeCloseTo(10 + 10 / 3)
    expect(segments[1].points.at(-1).value).toBe(100)
  })

  test('describes balance lines with the native main chart and Spline overlays', () => {
    const data = strategyBalanceChartData({
      starting_balance: '100',
      points: [
        { timestamp_ms: 10, booked_balance: '110', equity: '112', mark_status: 'complete' },
        { timestamp_ms: 20, booked_balance: '90', equity: null, mark_status: 'partial' },
        { timestamp_ms: 30, booked_balance: '95', equity: '92', mark_status: 'complete' },
      ],
    }, { strategyName: 'EMA V8' })

    expect(data.chart).toMatchObject({
      name: 'EMA V8 · Booked balance (banked)',
      type: 'Spline',
      settings: { color: '#f5f7fa', lineWidth: 2, showVolume: false },
    })
    // Main-grid native scaling reads row[2]/row[3]; both booked and marked
    // equity, plus the starting balance, are included in that range.
    expect(data.chart.data).toEqual([
      [10, 110, 112, 100],
      [20, 90, 100, 90],
      [30, 95, 100, 92],
    ])
    expect(data.offchart).toEqual([])
    expect(data.onchart.every((overlay) => overlay.type === 'Spline')).toBe(true)

    const bookedLoss = data.onchart.find((overlay) => overlay.settings.$uuid === 'strategy-balance-booked-loss')
    expect(bookedLoss.settings).toMatchObject({ color: '#ff5c6c', legend: false })
    expect(bookedLoss.data[0]).toEqual([15, 100])

    const equity = data.onchart.find((overlay) => overlay.settings.$uuid === 'strategy-balance-equity')
    expect(equity.data).toEqual([[10, 112], [20, null], [30, 92]])
    expect(equity.settings.lineDash).toEqual([4, 6])

    const baseline = data.onchart.find((overlay) => overlay.settings.$uuid === 'strategy-balance-baseline')
    expect(baseline.data).toEqual([[10, 100], [20, 100], [30, 100]])
    expect(baseline.settings.lineDash).toEqual([7, 5])
  })

  test('keeps partial marked-equity gaps disconnected in native spline data', () => {
    const data = strategyBalanceChartData({
      starting_balance: '100',
      points: [
        { timestamp_ms: 1, booked_balance: '100', equity: '101', mark_status: 'complete' },
        { timestamp_ms: 2, booked_balance: '99', equity: null, mark_status: 'partial' },
        { timestamp_ms: 3, booked_balance: '98', equity: '97', mark_status: 'complete' },
      ],
    })
    const loss = data.onchart.find((overlay) => overlay.settings.$uuid === 'strategy-balance-equity-loss')
    expect(loss.data).toEqual([[3, 97]])
    expect(loss.settings.skipNaN).toBe(true)
  })
})
