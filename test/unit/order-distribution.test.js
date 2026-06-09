// Golden tests for the OrderBox distribution math (src/stuff/order-distribution.js).
import { test, expect, describe } from 'vitest'
import { distributeOrders } from '../../src/stuff/order-distribution.js'

const sum = (os) => os.reduce((a, o) => a + o.size, 0)

describe('distributeOrders', () => {
  test('flat: even sizes at evenly spaced prices; Σ === size', () => {
    const os = distributeOrders({ low: 100, high: 200, qty: 5, size: 10, dist: 'flat' })
    expect(os).toHaveLength(5)
    expect(os.map(o => o.price)).toEqual([100, 125, 150, 175, 200])
    // even within one rounding unit (drift absorbed into the last order)
    const sizes = os.map(o => o.size)
    expect(Math.max(...sizes) - Math.min(...sizes)).toBeLessThanOrEqual(0.01)
    expect(sum(os)).toBeCloseTo(10, 10)
  })

  test('Σ(size) === size across dist/qty/precision', () => {
    for (const dist of ['flat', 'asc', 'desc']) {
      for (const qty of [1, 2, 3, 7, 13]) {
        for (const size of [10, 12.5, 0.3, 999.99]) {
          const os = distributeOrders({ low: 50, high: 60, qty, size, dist })
          expect(os).toHaveLength(qty)
          expect(sum(os)).toBeCloseTo(size, 6)
        }
      }
    }
  })

  test('asc: size non-decreasing with price (more toward HIGH)', () => {
    const os = distributeOrders({ low: 100, high: 110, qty: 6, size: 100, dist: 'asc' })
    for (let i = 1; i < os.length; i++) {
      expect(os[i].price).toBeGreaterThan(os[i - 1].price)
      expect(os[i].size).toBeGreaterThanOrEqual(os[i - 1].size - 0.01)
    }
    expect(os[os.length - 1].size).toBeGreaterThan(os[0].size) // overall direction
  })

  test('desc: size non-increasing with price (more toward LOW)', () => {
    const os = distributeOrders({ low: 100, high: 110, qty: 6, size: 100, dist: 'desc' })
    for (let i = 1; i < os.length; i++) {
      expect(os[i].size).toBeLessThanOrEqual(os[i - 1].size + 0.01)
    }
    expect(os[0].size).toBeGreaterThan(os[os.length - 1].size)
  })

  test('qty=1: single order at midprice with size === total', () => {
    const os = distributeOrders({ low: 100, high: 200, qty: 1, size: 7.5, dist: 'asc' })
    expect(os).toHaveLength(1)
    expect(os[0].price).toBe(150)
    expect(os[0].size).toBe(7.5)
  })

  test('swapped low>high is normalized', () => {
    const a = distributeOrders({ low: 200, high: 100, qty: 3, size: 9, dist: 'flat' })
    const b = distributeOrders({ low: 100, high: 200, qty: 3, size: 9, dist: 'flat' })
    expect(a.map(o => o.price)).toEqual(b.map(o => o.price))
  })

  test('deterministic ids', () => {
    const os = distributeOrders({ low: 1, high: 2, qty: 3, size: 3, dist: 'flat' })
    expect(os.map(o => o.id)).toEqual(['ord-1', 'ord-2', 'ord-3'])
  })

  test('sizePrec honored', () => {
    const os = distributeOrders({ low: 1, high: 2, qty: 3, size: 1, dist: 'flat', sizePrec: 4 })
    expect(sum(os)).toBeCloseTo(1, 10)
    // 4-decimal rounding present
    expect(String(os[0].size).split('.')[1]?.length).toBeLessThanOrEqual(4)
  })
})
