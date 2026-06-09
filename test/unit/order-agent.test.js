// Pins the order-submission seam (OrderAgent + StubOrderTransport): submit flips
// local→pending→confirmed (or rejected) on the SAME canonical order objects
// (identity, not clone) + touchData; confirmations are scoped to the submitted
// box so same-id orders in other boxes aren't touched.
import { test, expect, describe } from 'vitest'
import { OrderAgent } from '../../src/helpers/orders/order-agent.js'
import { StubOrderTransport } from '../../src/helpers/orders/stub-order-transport.js'

function fakeDc() {
  return { data: { onchart: [] }, ticks: 0, touchData() { this.ticks++ } }
}

describe('OrderAgent + StubOrderTransport', () => {
  test('submit flips local→confirmed by identity, repaints twice', () => {
    const dc = fakeDc()
    const agent = new OrderAgent({ transport: new StubOrderTransport(), dataCube: dc })
    const orders = [
      { id: 'ord-1', price: 1, size: 1, status: 'local' },
      { id: 'ord-2', price: 2, size: 1, status: 'local' }
    ]
    const ref0 = orders[0]
    agent.submit({ side: 'buy', orders })
    expect(orders.map(o => o.status)).toEqual(['confirmed', 'confirmed'])
    expect(orders[0]).toBe(ref0)               // identity preserved (no clone)
    expect(dc.ticks).toBeGreaterThanOrEqual(2) // pending + confirmed repaints
  })

  test('rejected outcome marks orders rejected', () => {
    const dc = fakeDc()
    const agent = new OrderAgent({ transport: new StubOrderTransport({ outcome: 'rejected' }), dataCube: dc })
    const orders = [{ id: 'ord-1', price: 1, size: 1, status: 'local' }]
    agent.submit({ side: 'sell', orders })
    expect(orders[0].status).toBe('rejected')
  })

  test('confirmation is scoped to the submitted box (same id elsewhere untouched)', () => {
    const dc = fakeDc()
    const agent = new OrderAgent({ transport: new StubOrderTransport(), dataCube: dc })
    const boxA = [{ id: 'ord-1', price: 1, size: 1, status: 'local' }]
    const boxB = [{ id: 'ord-1', price: 9, size: 1, status: 'local' }] // same id, other box
    agent.submit({ side: 'buy', orders: boxA })
    expect(boxA[0].status).toBe('confirmed')
    expect(boxB[0].status).toBe('local')        // not collateral-flipped
  })

  test('empty / no-transport submit is a safe no-op', () => {
    const dc = fakeDc()
    const agent = new OrderAgent({ transport: new StubOrderTransport(), dataCube: dc })
    expect(agent.submit({ side: 'buy', orders: [] })).toBe(null)
    expect(dc.ticks).toBe(0)
  })
})
