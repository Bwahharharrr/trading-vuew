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
    // (data.onchart[i].settings). Only orders not already in-flight/done are
    // sent (local/rejected → pending), so a confirmed order is never re-sent.
    submit(boxSettings) {
        const orders = boxSettings && boxSettings.orders
        if (!orders || !orders.length || !this.transport) return null

        const flipped = []
        for (const o of orders) {
            if (o.status === 'local' || o.status === 'rejected') {
                o.status = 'pending'
                flipped.push(o)
            }
        }
        if (!flipped.length) return null     // nothing new to submit
        this._touch()

        const request_id = `oreq-${++REQ_SEQ}`
        // Track by box $uuid + the submitted ids — NOT the array reference: an
        // edit (drag/delete) replaces settings.orders with a fresh array
        // (mergeObjects swaps the object), so on confirm we re-resolve the live
        // orders by $uuid and flip only the still-'pending' ones in this set.
        this._pending[request_id] = { uuid: boxSettings.$uuid, ids: new Set(flipped.map(o => o.id)) }
        this.transport.send({
            type: 'submit_orders',
            request_id,
            side: boxSettings.side,
            orders: flipped.map(o => ({ id: o.id, price: o.price, size: o.size }))
        })
        return request_id
    }

    _on_event(e) {
        if (!e || !e.request_id) return
        const rec = this._pending[e.request_id]
        if (!rec) return                     // unknown / already handled
        delete this._pending[e.request_id]
        const status = e.type === 'orders_rejected' ? 'rejected' : 'confirmed'
        const confirmIds = e.orders ? new Set(e.orders.map(o => o.id)) : null
        // Re-resolve the CURRENT order objects by box $uuid (settings may have
        // been replaced by an edit since submit). Flip only those still pending
        // in this request's set — immune to array replacement + double-confirm.
        let changed = false
        for (const o of this._orders_for(rec.uuid)) {
            if (o.status === 'pending' && rec.ids.has(o.id) &&
                (!confirmIds || confirmIds.has(o.id))) {
                o.status = status
                changed = true
            }
        }
        if (changed) this._touch()
    }

    _orders_for(uuid) {
        const onchart = this.dc && this.dc.data && this.dc.data.onchart
        if (!onchart) return []
        for (const ov of onchart) {
            if (ov.settings && ov.settings.$uuid === uuid) return ov.settings.orders || []
        }
        return []
    }

    _touch() {
        if (this.dc && typeof this.dc.touchData === 'function') this.dc.touchData()
    }

    destroy() {
        this._pending = {}
        if (this.transport && this.transport.destroy) this.transport.destroy()
    }
}
