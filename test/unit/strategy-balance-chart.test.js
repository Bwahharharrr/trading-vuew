import { describe, expect, test } from 'vitest'
import {
  balanceChartDomain, balanceChartPoints, splitBalanceSegments,
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

  test('breaks marked-equity segments at partial marks and guards log scale', () => {
    const points = [
      { timestamp: 1, booked: 100, equity: 101 },
      { timestamp: 2, booked: 99, equity: null },
      { timestamp: 3, booked: 98, equity: 97 },
    ]
    expect(splitBalanceSegments(points, 'equity', 100)).toHaveLength(2)
    expect(balanceChartDomain(points, 100, true).useLog).toBe(true)
    expect(balanceChartDomain([{ timestamp: 1, booked: -1, equity: null }], 100, true).useLog).toBe(false)
  })
})
