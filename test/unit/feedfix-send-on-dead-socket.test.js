// Regression: _send on a CLOSING/CLOSED socket must NOT silently drop the frame
// and strand the request promise. For a non-OPEN socket the frame is queued (and
// flushed by a reconnected socket's onopen); when reconnect is disabled or
// exhausted, the request rejects instead of hanging forever.
//
// Drives the real CorkyClient via a fake socket that models WebSocket.readyState.

import { describe, it, expect, vi } from 'vitest'
import { CorkyClient } from '../../src/helpers/feed/corky-client.js'

// Fake socket modelling readyState transitions: 0 CONNECTING → 1 OPEN → (drop) 3.
class StatefulSocket {
    constructor(url) {
        this.url = url
        this.readyState = 0
        this.sent = []
        this.onopen = this.onmessage = this.onclose = this.onerror = null
        StatefulSocket.instances.push(this)
    }
    send(raw) {
        // Mirror the WS spec: a real socket throws in CONNECTING and silently
        // discards in CLOSING/CLOSED. If CorkyClient ever calls send() in a
        // non-OPEN state, surface it as a dropped frame the test can detect.
        if (this.readyState !== 1) { this.dropped = (this.dropped || 0) + 1; return }
        this.sent.push(raw)
    }
    close() { this.readyState = 3; if (this.onclose) this.onclose({ code: 1000 }) }
    // ── drivers ──
    open() { this.readyState = 1; if (this.onopen) this.onopen({}) }
    drop(code = 1006) { this.readyState = 3; if (this.onclose) this.onclose({ code }) }
}
StatefulSocket.instances = []

function makeClient(backoff) {
    StatefulSocket.instances = []
    const client = new CorkyClient({
        url: 'ws://fake/corky',
        socketFactory: (url) => new StatefulSocket(url),
        backoff,
    })
    return { client, sockets: StatefulSocket.instances }
}

describe('CorkyClient — _send on a non-OPEN socket', () => {
    it('rejects (does not hang) when the socket is CLOSED and reconnect is disabled', async () => {
        const { client, sockets } = makeClient(false) // reconnect disabled
        client.connect()
        sockets[0].open()
        sockets[0].drop(1006) // socket now CLOSED, no reconnect coming

        // A request fired now would historically call send() on a dead socket and
        // be silently dropped → promise hangs. It must reject instead.
        await expect(client.listCandleStates()).rejects.toMatchObject({ code: 'not_connected' })
        expect(sockets[0].dropped).toBeUndefined() // never silently send()
    })

    it('queues a frame for a CLOSED socket while a reconnect is pending, then flushes it on reopen', async () => {
        vi.useFakeTimers()
        try {
            const { client, sockets } = makeClient({ base: 10, factor: 2, max: 100, maxRetries: 3 })
            client.connect()
            sockets[0].open()
            sockets[0].drop(1006) // schedules a reconnect; socket[0] CLOSED

            // Fire a request DURING the backoff window — socket is CLOSED but a
            // reconnect is pending, so the frame must be queued (not dropped, not
            // rejected). The promise stays pending until a reply arrives.
            const pending = client.listCandleStates()
            expect(sockets[0].dropped).toBeUndefined()

            // Advance to fire the reconnect → a new socket opens and flushes.
            vi.advanceTimersByTime(50)
            const fresh = sockets[sockets.length - 1]
            expect(fresh).not.toBe(sockets[0])
            fresh.open() // onopen flushes the queued frame
            expect(fresh.sent).toHaveLength(1)
            const frame = JSON.parse(fresh.sent[0])
            expect(frame.command.type).toBe('list_candle_states')

            // Reply settles the still-pending request.
            const { request_id } = frame
            fresh.onmessage({ data: JSON.stringify({
                schema_version: 1, request_id,
                event: { type: 'candle_states', states: [] },
            }) })
            await expect(pending).resolves.toEqual([])
        } finally {
            vi.useRealTimers()
        }
    })

    it('emits open on EVERY (re)open (initial + reconnect)', () => {
        vi.useFakeTimers()
        try {
            const { client, sockets } = makeClient({ base: 10, factor: 2, max: 100, maxRetries: 3 })
            const opens = vi.fn()
            client.on('open', opens)

            client.connect()
            sockets[0].open()          // initial open
            expect(opens).toHaveBeenCalledTimes(1)

            sockets[0].drop(1006)      // schedules reconnect
            vi.advanceTimersByTime(10) // reconnect fires → fresh CONNECTING socket
            const s1 = sockets[sockets.length - 1]
            expect(s1).not.toBe(sockets[0])
            s1.open()                  // reconnect open → 'open' fires AGAIN
            expect(opens).toHaveBeenCalledTimes(2)
        } finally {
            vi.useRealTimers()
        }
    })

    it('fires reconnect-exhausted and never leaves requests hanging once backoff is spent', async () => {
        vi.useFakeTimers()
        try {
            const { client, sockets } = makeClient({ base: 10, factor: 2, max: 100, maxRetries: 3 })
            const exhausted = vi.fn()
            client.on('reconnect-exhausted', exhausted)

            client.connect()
            sockets[0].open()

            // Drop WITHOUT a successful open in between so retries escalate to
            // exhaustion (an onopen would reset the counter). After a reconnect
            // timer fires we have a fresh CONNECTING socket; fire a request there
            // → it is QUEUED (CONNECTING + reconnect still possible), never
            // silently send()-dropped on the dead socket.
            sockets[0].drop(1006)      // retries → 1
            vi.advanceTimersByTime(10) // → s1 (CONNECTING)
            const s1 = sockets[sockets.length - 1]
            const pending = client.listCandleStates() // queued (retries 1 < 3)
            expect(s1.dropped).toBeUndefined()

            const settled = vi.fn()
            pending.then(() => settled('resolved'), () => settled('rejected'))

            s1.drop(1006)              // retries → 2 (fails 'pending' w/ connection_lost)
            vi.advanceTimersByTime(20) // → s2 (CONNECTING)
            const s2 = sockets[sockets.length - 1]
            s2.drop(1006)              // retries → 3
            vi.advanceTimersByTime(40) // → s3 (CONNECTING)
            const s3 = sockets[sockets.length - 1]
            s3.drop(1006)              // retries(3) >= maxRetries(3) → exhausted
            await Promise.resolve()    // let rejection microtasks run

            expect(exhausted).toHaveBeenCalledOnce()
            await expect(pending).rejects.toBeInstanceOf(Error) // settled, not hung
            expect(settled).toHaveBeenCalledWith('rejected')

            // After exhaustion the socket stays dead and no reconnect is coming,
            // so a brand-new request rejects (not_connected) rather than being
            // silently dropped on the CLOSED socket.
            await expect(client.listCandleStates()).rejects.toMatchObject({ code: 'not_connected' })
        } finally {
            vi.useRealTimers()
        }
    })

    it('treats a fake socket with undefined readyState as OPEN (sends immediately)', () => {
        // Mirrors the existing FakeSockets used across the suite that omit
        // readyState entirely — must keep sending now, not queue or throw.
        class NoReadyState {
            constructor(url) { this.url = url; this.sent = []; this.onopen = null }
            send(raw) { this.sent.push(raw) }
            close() {}
            open() { if (this.onopen) this.onopen({}) }
        }
        let sock
        const client = new CorkyClient({
            url: 'ws://fake/corky',
            socketFactory: (url) => (sock = new NoReadyState(url)),
            backoff: false,
        })
        client.connect()
        sock.open()
        client.listCandleStates()
        expect(sock.sent).toHaveLength(1)
    })
})
