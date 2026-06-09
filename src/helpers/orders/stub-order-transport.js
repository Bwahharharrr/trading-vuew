// Local stub transport for the order-submission seam (prototype).
//
// Mirrors the shape of a real ws transport ({ send(msg), onevent }) but runs
// fully in-process: a `submit_orders` command is echoed straight back as an
// `orders_confirmed` event. Swapping this for a WsOrderTransport (wrapping a
// CorkyClient-style socket) is the only change needed to go live — the
// OrderAgent + rendering are transport-agnostic (they key off order.status).

export class StubOrderTransport {
    constructor(opts = {}) {
        this.onevent = () => {}
        // 'confirmed' (default) | 'rejected' — for testing both outcomes.
        this.outcome = opts.outcome || 'confirmed'
    }

    send(msg) {
        if (!msg || msg.type !== 'submit_orders') return
        // Echo a terminal event with the same request_id (synchronous so the
        // prototype works with no real socket).
        this.onevent({
            type: this.outcome === 'rejected' ? 'orders_rejected' : 'orders_confirmed',
            request_id: msg.request_id,
            orders: (msg.orders || []).map(o => ({ id: o.id }))
        })
    }

    destroy() { this.onevent = () => {} }
}
