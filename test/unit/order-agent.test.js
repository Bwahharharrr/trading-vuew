// Pins the order-submission seam (OrderAgent + StubOrderTransport): submit flips
// local→pending→confirmed (or rejected) on the canonical order objects + touchData;
// confirmations are re-resolved by box $uuid from the live DataCube (robust to
// settings-array replacement) and scoped per request (no cross-box flip, no
// re-submit of already-confirmed orders).
import { test, expect, describe } from 'vitest'
import { OrderAgent } from '../../src/helpers/orders/order-agent.js'
import { StubOrderTransport } from '../../src/helpers/orders/stub-order-transport.js'

// Minimal DataCube stand-in with the fields the agent reads.
function fakeDc(boxes) {
  return {
    ticks: 0,
    touchData() { this.ticks++ },
    update_ids() {},
    data: {
      onchart: boxes.map((orders, i) => ({
        settings: { $uuid: `u${i}`, side: 'buy', orders }
      }))
    }
  }
}
const box = (dc, i) => dc.data.onchart[i].settings

describe('OrderAgent + StubOrderTransport', () => {
  test('submit flips local→confirmed by identity, repaints twice', () => {
    const orders = [
      { id: 'ord-1', price: 1, size: 1, status: 'local' },
      { id: 'ord-2', price: 2, size: 1, status: 'local' }
    ]
    const dc = fakeDc([orders])
    const ref0 = orders[0]
    new OrderAgent({ transport: new StubOrderTransport(), dataCube: dc }).submit(box(dc, 0))
    expect(orders.map(o => o.status)).toEqual(['confirmed', 'confirmed'])
    expect(orders[0]).toBe(ref0)               // identity preserved (no clone)
    expect(dc.ticks).toBeGreaterThanOrEqual(2) // pending + confirmed repaints
  })

  test('rejected outcome marks orders rejected', () => {
    const orders = [{ id: 'ord-1', price: 1, size: 1, status: 'local' }]
    const dc = fakeDc([orders])
    new OrderAgent({ transport: new StubOrderTransport({ outcome: 'rejected' }), dataCube: dc }).submit(box(dc, 0))
    expect(orders[0].status).toBe('rejected')
  })

  test('confirmation is scoped to the submitted box (same id elsewhere untouched)', () => {
    const a = [{ id: 'ord-1', price: 1, size: 1, status: 'local' }]
    const b = [{ id: 'ord-1', price: 9, size: 1, status: 'local' }] // same id, other box
    const dc = fakeDc([a, b])
    new OrderAgent({ transport: new StubOrderTransport(), dataCube: dc }).submit(box(dc, 0))
    expect(a[0].status).toBe('confirmed')
    expect(b[0].status).toBe('local')          // not collateral-flipped
  })

  test('does not re-submit already-confirmed orders', () => {
    const orders = [{ id: 'ord-1', price: 1, size: 1, status: 'local' }]
    const dc = fakeDc([orders])
    const agent = new OrderAgent({ transport: new StubOrderTransport(), dataCube: dc })
    expect(agent.submit(box(dc, 0))).toBeTruthy()
    expect(orders[0].status).toBe('confirmed')
    // second submit: nothing local/rejected left → no-op
    expect(agent.submit(box(dc, 0))).toBe(null)
  })

  test('re-resolves orders by $uuid on confirm (robust to array replacement)', () => {
    const orders = [{ id: 'ord-1', price: 1, size: 1, status: 'local' }]
    const dc = fakeDc([orders])
    // Async transport that lets us swap the orders array between submit & confirm.
    let fire
    const transport = { onevent: () => {}, send(m) { fire = () => transport.onevent({ type: 'orders_confirmed', request_id: m.request_id, orders: m.orders }) }, destroy() {} }
    const agent = new OrderAgent({ transport, dataCube: dc })
    agent.submit(box(dc, 0))
    expect(orders[0].status).toBe('pending')
    // Simulate an edit: settings.orders replaced with a NEW array (same ids/status).
    dc.data.onchart[0].settings = { $uuid: 'u0', side: 'buy', orders: [{ id: 'ord-1', price: 1.5, size: 1, status: 'pending' }] }
    fire() // confirm arrives AFTER the edit
    expect(dc.data.onchart[0].settings.orders[0].status).toBe('confirmed') // live object updated
  })

  test('cancel: live orders → cancelling → cancelled, then box removed (sync stub)', () => {
    const orders = [
      { id: 'ord-1', price: 1, size: 1, status: 'confirmed' },
      { id: 'ord-2', price: 2, size: 1, status: 'pending' }
    ]
    const dc = fakeDc([orders])
    new OrderAgent({ transport: new StubOrderTransport(), dataCube: dc }).cancel(box(dc, 0))
    expect(dc.data.onchart.length).toBe(0) // all cancelled → box removed
  })

  test('cancel with no live orders is a no-op (box stays)', () => {
    const orders = [{ id: 'ord-1', price: 1, size: 1, status: 'local' }]
    const dc = fakeDc([orders])
    expect(new OrderAgent({ transport: new StubOrderTransport(), dataCube: dc }).cancel(box(dc, 0))).toBe(null)
    expect(dc.data.onchart.length).toBe(1)
    expect(orders[0].status).toBe('local')
  })

  test('cancel keeps the box until the engine confirms (async)', () => {
    const orders = [{ id: 'ord-1', price: 1, size: 1, status: 'confirmed' }]
    const dc = fakeDc([orders])
    let fire
    const transport = {
      onevent: () => {},
      send(m) { fire = () => transport.onevent({ type: 'orders_cancelled', request_id: m.request_id, orders: m.orders }) },
      destroy() {}
    }
    new OrderAgent({ transport, dataCube: dc }).cancel(box(dc, 0))
    expect(orders[0].status).toBe('cancelling') // requested…
    expect(dc.data.onchart.length).toBe(1)      // …box still present
    fire()
    expect(orders[0].status).toBe('cancelled')
    expect(dc.data.onchart.length).toBe(0)      // removed only after confirm
  })

  test('empty / no-transport submit is a safe no-op', () => {
    const dc = fakeDc([[]])
    const agent = new OrderAgent({ transport: new StubOrderTransport(), dataCube: dc })
    expect(agent.submit(box(dc, 0))).toBe(null)
    expect(dc.ticks).toBe(0)
  })
})
