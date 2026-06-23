// CorkyClient protocol senders: search frames, auth-audit subscribe validation,
// subscription/listener disposers, reconnect & isDead state.
//
// Drives the real CorkyClient through an INJECTED fake socket (no network, no
// real timers). The StatefulSocket models WebSocket.readyState so we can test
// the CONNECTING/OPEN/CLOSED branches of _send (queue vs flush vs throw) and the
// lifecycle (connect / drop / reconnect / isDead). Search fires-and-forgets
// (it routes by search_id off the emitter, not request correlation), so these
// tests assert the exact outbound FRAMES and returned request_ids.

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { CorkyClient, CorkyError } from '../../src/helpers/feed/corky-client.js'

// ── StatefulSocket ───────────────────────────────────────────────────────────
// Mimics the slice of the WebSocket API CorkyClient touches, WITH a readyState
// so _send's non-OPEN branches are exercised. Records sent frames (parsed).
class StatefulSocket {
    constructor(url) {
        this.url = url
        this.readyState = 0 // CONNECTING
        this.sent = []      // parsed outbound frames
        this.onopen = this.onmessage = this.onclose = this.onerror = null
        StatefulSocket.instances.push(this)
    }
    send(raw) { if (this.readyState === 1) this.sent.push(JSON.parse(raw)) }
    close() { this.readyState = 3; if (this.onclose) this.onclose({ code: 1000 }) }
    open() { this.readyState = 1; if (this.onopen) this.onopen({}) }
    drop(code = 1006) { this.readyState = 3; if (this.onclose) this.onclose({ code }) }
    reply(envelope) { if (this.onmessage) this.onmessage({ data: JSON.stringify(envelope) }) }
    static reset() { StatefulSocket.instances = [] }
}
StatefulSocket.instances = []

// Build a client + factory; not auto-connected (some tests need the pre-connect
// state). `backoff` defaults to disabled to match the suite convention.
function makeClient(opts = {}) {
    StatefulSocket.reset()
    const client = new CorkyClient({
        url: 'ws://fake/corky',
        socketFactory: (url) => new StatefulSocket(url),
        backoff: false,
        ...opts,
    })
    return { client, sockets: StatefulSocket.instances }
}

// Connected + opened, ready to take frames synchronously.
function makeOpenClient(opts = {}) {
    const ctx = makeClient(opts)
    ctx.client.connect()
    ctx.sockets[0].open()
    return ctx
}

const tick = () => new Promise((r) => setTimeout(r, 0))

beforeEach(() => StatefulSocket.reset())

// ── search senders: framing + deterministic ids ───────────────────────────────
describe('searchCandles / cancelSearch framing', () => {
    it('searchCandles sends exactly one v1 frame with the query and deterministic incrementing request_id', () => {
        const { client, sockets } = makeOpenClient()
        const query = { search_id: 'S1', venue: 'BITFINEX', symbol: 'tBTCUSD', timeframe: '1h' }

        const id1 = client.searchCandles(query)
        expect(id1).toBe('corky-req-1')
        expect(sockets[0].sent).toHaveLength(1)
        const frame = sockets[0].sent[0]
        expect(frame.schema_version).toBe(1)
        expect(frame.request_id).toBe('corky-req-1')
        expect(frame.command.type).toBe('search_candles')
        expect(frame.command.query).toEqual(query)

        // ids increment across calls
        const id2 = client.searchCandles({ search_id: 'S2' })
        expect(id2).toBe('corky-req-2')
        expect(sockets[0].sent).toHaveLength(2)
        expect(sockets[0].sent[1].request_id).toBe('corky-req-2')
    })

    it('cancelSearch sends a cancel_search command with a fresh deterministic request_id and returns it', () => {
        const { client, sockets } = makeOpenClient()
        const returned = client.cancelSearch('S1')
        expect(returned).toBe('corky-req-1')
        expect(sockets[0].sent).toHaveLength(1)
        const frame = sockets[0].sent[0]
        expect(frame.schema_version).toBe(1)
        expect(frame.request_id).toBe('corky-req-1')
        expect(frame.command).toEqual({ type: 'cancel_search', search_id: 'S1' })
    })
})

// ── search senders: input guards ───────────────────────────────────────────────
describe('searchCandles / cancelSearch input guards', () => {
    it('searchCandles without a search_id throws and sends nothing', () => {
        const { client, sockets } = makeOpenClient()
        expect(() => client.searchCandles()).toThrow(/search_id is required/)
        expect(() => client.searchCandles({})).toThrow(/search_id is required/)
        expect(() => client.searchCandles({ foo: 1 })).toThrow(/search_id is required/)
        expect(sockets[0].sent).toHaveLength(0)
        // a throwing guard must not consume a request id
        expect(client.searchCandles({ search_id: 'S1' })).toBe('corky-req-1')
    })

    it('cancelSearch without a search_id throws and sends nothing', () => {
        const { client, sockets } = makeOpenClient()
        expect(() => client.cancelSearch()).toThrow(/search_id is required/)
        expect(() => client.cancelSearch(undefined)).toThrow(/search_id is required/)
        expect(sockets[0].sent).toHaveLength(0)
    })
})

// ── search senders: send-path branches (queue / throw) ─────────────────────────
describe('searchCandles send-path against socket state', () => {
    it('queues a search fired while CONNECTING, then flushes it verbatim on open', () => {
        const { client, sockets } = makeClient()
        client.connect() // socket[0] is CONNECTING (readyState 0)
        const query = { search_id: 'S1', venue: 'BITFINEX' }
        const id = client.searchCandles(query)

        // nothing on the wire yet — frame sits in the send queue
        expect(id).toBe('corky-req-1')
        expect(sockets[0].sent).toHaveLength(0)

        sockets[0].open() // onopen flushes the queue verbatim
        expect(sockets[0].sent).toHaveLength(1)
        expect(sockets[0].sent[0]).toEqual({
            schema_version: 1,
            request_id: 'corky-req-1',
            command: { type: 'search_candles', query },
        })
    })

    it('throws CorkyError(not_connected) when the socket is CLOSED and reconnect is disabled', () => {
        const { client, sockets } = makeOpenClient({ backoff: false })
        sockets[0].drop() // CLOSED, no reconnect scheduled
        let thrown
        try { client.searchCandles({ search_id: 'S1' }) } catch (e) { thrown = e }
        expect(thrown).toBeInstanceOf(CorkyError)
        expect(thrown.code).toBe('not_connected')
        // it threw rather than silently dropping the frame
        expect(sockets[0].sent).toHaveLength(0)
    })
})

// ── subscribeAuthPositionAudit validation ──────────────────────────────────────
describe('subscribeAuthPositionAudit validation', () => {
    it('throws when required position fields are missing (subscription_id present)', () => {
        const { client } = makeOpenClient()
        expect(() => client.subscribeAuthPositionAudit({ subscription_id: 'a' }))
            .toThrow(/venue, account_id, symbol, position_id are required/)
    })

    it('the subscription_id guard is checked first and wins on an empty opts object', () => {
        const { client } = makeOpenClient()
        expect(() => client.subscribeAuthPositionAudit({})).toThrow(/subscription_id is required/)
    })

    it('accepts position_id:0 (guard uses == null) and emits position_id===0; optional flags only when passed', () => {
        const { client, sockets } = makeOpenClient()
        client.subscribeAuthPositionAudit({
            subscription_id: 'a', venue: 'V', account_id: 'acc', symbol: 'sym', position_id: 0,
        })
        const cmd = sockets[0].sent[0].command
        expect(cmd).toEqual({
            type: 'subscribe_auth_position_audit',
            subscription_id: 'a', venue: 'V', account_id: 'acc', symbol: 'sym', position_id: 0,
        })
        expect(cmd.position_id).toBe(0)
        // include_orders / include_trades omitted unless explicitly provided
        expect('include_orders' in cmd).toBe(false)
        expect('include_trades' in cmd).toBe(false)

        client.subscribeAuthPositionAudit({
            subscription_id: 'b', venue: 'V', account_id: 'acc', symbol: 'sym', position_id: 0,
            include_orders: true, include_trades: false,
        })
        const cmd2 = sockets[0].sent[1].command
        expect(cmd2.include_orders).toBe(true)
        expect(cmd2.include_trades).toBe(false)
    })
})

// ── onSubscription / on disposers ──────────────────────────────────────────────
describe('subscription & listener disposers', () => {
    function liveUpdate(subscription_id, sequence) {
        return { schema_version: 1, event: { type: 'live_update', subscription_id, sequence } }
    }

    it('onSubscription returns a disposer that stops further live_update delivery', () => {
        const { client, sockets } = makeOpenClient()
        const seen = []
        const dispose = client.onSubscription('sub-1', ({ event }) => seen.push(event.sequence))

        sockets[0].reply(liveUpdate('sub-1', 1))
        expect(seen).toEqual([1])

        dispose()
        sockets[0].reply(liveUpdate('sub-1', 2)) // no longer delivered
        expect(seen).toEqual([1])
    })

    it('removing the last cb deletes the subscription key; sibling cb survives; double-dispose is idempotent', () => {
        const { client } = makeOpenClient()
        const cbA = vi.fn()
        const cbB = vi.fn()

        const dA = client.onSubscription('sub-1', cbA)
        const dB = client.onSubscription('sub-1', cbB)
        expect(client._subscribers.has('sub-1')).toBe(true)
        expect(client._subscribers.get('sub-1').size).toBe(2)

        // dispose one of two: key stays, sibling still live
        dA()
        expect(client._subscribers.has('sub-1')).toBe(true)
        expect(client._subscribers.get('sub-1').size).toBe(1)
        expect(client._subscribers.get('sub-1').has(cbB)).toBe(true)

        // disposing the same one again is a no-op (no throw, no state change)
        expect(() => dA()).not.toThrow()
        expect(client._subscribers.get('sub-1').size).toBe(1)

        // dispose the last cb: empty Set is deleted, not left behind
        dB()
        expect(client._subscribers.has('sub-1')).toBe(false)
    })

    it('on(type, cb) returns a disposer that removes the emitter listener', () => {
        const { client, sockets } = makeOpenClient()
        const cb = vi.fn()
        const dispose = client.on('control_ack', cb)

        sockets[0].reply({ schema_version: 1, request_id: null, event: { type: 'control_ack', status: 'Applied' } })
        expect(cb).toHaveBeenCalledTimes(1)

        dispose()
        sockets[0].reply({ schema_version: 1, request_id: null, event: { type: 'control_ack', status: 'Applied' } })
        expect(cb).toHaveBeenCalledTimes(1) // not called again after dispose
    })
})

// ── connect() handler-detach & retry/timer reset ───────────────────────────────
describe('connect() lifecycle: handler detach, retry reset, timer clear', () => {
    it('a second connect() while socket[0] is OPEN spawns socket[1], closes & detaches socket[0]', async () => {
        const { client, sockets } = makeClient()
        client.connect()
        sockets[0].open()
        expect(sockets).toHaveLength(1)

        client.connect() // reconnect over a live socket
        expect(sockets).toHaveLength(2)
        expect(sockets[0].readyState).toBe(3)      // socket[0] was closed
        expect(sockets[0].onclose).toBe(null)      // and its onclose detached

        sockets[1].open()
        const pending = client.listCandleStates() // pending on socket[1]

        let rejected = false
        pending.catch(() => { rejected = true })
        sockets[0].drop()           // a late drop on the dead socket[0]
        await tick()
        expect(rejected).toBe(false) // must NOT fail a request belonging to socket[1]
    })

    it('connect() resets _retries to 0 even after a prior exhaustion', () => {
        vi.useFakeTimers()
        try {
            const { client, sockets } = makeClient({ backoff: { base: 10, factor: 2, max: 100, maxRetries: 2 } })
            client.connect()
            sockets[0].open()
            // burn through the retry budget without an intervening successful open
            for (let i = 0; i < 3; i++) {
                sockets[sockets.length - 1].drop()
                vi.advanceTimersByTime(10_000)
            }
            expect(client._retries).toBe(2)        // exhausted at maxRetries
            expect(client._reconnectTimer).toBe(null) // budget spent: no timer armed

            // a fresh connect() restores a full backoff budget
            client.connect()
            expect(client._retries).toBe(0)
        } finally {
            vi.useRealTimers()
        }
    })

    it('connect() clears a pending reconnect timer so no second concurrent socket can open', () => {
        vi.useFakeTimers()
        try {
            const { client, sockets } = makeClient({ backoff: { base: 100, factor: 2, max: 1000, maxRetries: 5 } })
            client.connect()
            sockets[0].open()
            sockets[0].drop()                          // schedules a (not-yet-fired) reconnect timer
            expect(client._reconnectTimer).not.toBe(null)
            const before = sockets.length

            client.connect()                            // must cancel the pending timer
            expect(client._reconnectTimer).toBe(null)
            const afterConnect = sockets.length
            expect(afterConnect).toBe(before + 1)       // exactly connect()'s own fresh socket

            // the cancelled timer must NOT materialise a second concurrent socket
            vi.advanceTimersByTime(10_000)
            expect(sockets.length).toBe(afterConnect)
        } finally {
            vi.useRealTimers()
        }
    })
})

// ── isDead() ───────────────────────────────────────────────────────────────────
describe('isDead()', () => {
    it('is true before any connect (no socket) and after a drop with backoff disabled', () => {
        const { client, sockets } = makeClient({ backoff: false })
        expect(client.isDead()).toBe(true) // no socket yet

        client.connect()
        sockets[0].open()
        expect(client.isDead()).toBe(false) // OPEN

        sockets[0].drop()
        expect(client.isDead()).toBe(true) // CLOSED, no reconnect timer
    })

    it('is false while a reconnect timer is pending (drop with backoff enabled, before it fires)', () => {
        vi.useFakeTimers()
        try {
            const { client, sockets } = makeClient({ backoff: { base: 100, factor: 2, max: 1000, maxRetries: 3 } })
            client.connect()
            sockets[0].open()
            sockets[0].drop() // schedules a reconnect timer
            expect(client._reconnectTimer).not.toBe(null)
            expect(client.isDead()).toBe(false) // a reconnect is still coming
        } finally {
            vi.useRealTimers()
        }
    })
})
