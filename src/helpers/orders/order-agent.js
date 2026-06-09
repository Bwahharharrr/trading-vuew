// OrderAgent — the order-submission lifecycle seam (prototype, local stub).
//
// Mirrors CorkyFeed's shape: constructed with a transport + the DataCube. submit()
// flips a box's orders from 'local' -> 'pending' (one repaint), sends the command,
// and on the transport's terminal event flips the SAME canonical order objects to
// 'confirmed' / 'rejected' (one repaint). Rendering keys off order.status only, so
// swapping the stub transport for a real ws is the only change to go live.
//
// Status flips MUTATE the canonical order objects in data.onchart by IDENTITY
// (not a clone) + touchData() — reactivity-by-reference, per the CorkyFeed rule.

let REQ_SEQ = 0

export class OrderAgent {
    constructor({ transport, dataCube }) {
        this.transport = transport
        this.dc = dataCube
        this._pending = {}            // request_id -> the exact order objects sent
        if (this.transport) this.transport.onevent = (e) => this._on_event(e)
    }

    // Submit one box's orders. `boxSettings` is the overlay's settings object
    // (data.onchart[i].settings); its `orders` array holds the canonical objects.
    submit(boxSettings) {
        const orders = boxSettings && boxSettings.orders
        if (!orders || !orders.length || !this.transport) return null

        for (const o of orders) {
            if (o.status === 'local' || o.status === 'rejected') o.status = 'pending'
        }
        this._touch()

        const request_id = `oreq-${++REQ_SEQ}`
        this._pending[request_id] = orders   // by identity
        this.transport.send({
            type: 'submit_orders',
            request_id,
            side: boxSettings.side,
            orders: orders.map(o => ({ id: o.id, price: o.price, size: o.size }))
        })
        return request_id
    }

    _on_event(e) {
        if (!e || !e.request_id) return
        const orders = this._pending[e.request_id]
        if (!orders) return                  // unknown / already handled
        const status = e.type === 'orders_rejected' ? 'rejected' : 'confirmed'
        // Match within THIS request's order set (ids are box-scoped, not global).
        const ids = e.orders ? new Set(e.orders.map(o => o.id)) : null
        let changed = false
        for (const o of orders) {
            if (!ids || ids.has(o.id)) { o.status = status; changed = true }
        }
        delete this._pending[e.request_id]
        if (changed) this._touch()
    }

    _touch() {
        if (this.dc && typeof this.dc.touchData === 'function') this.dc.touchData()
    }

    destroy() {
        this._pending = {}
        if (this.transport && this.transport.destroy) this.transport.destroy()
    }
}
