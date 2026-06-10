// Unit tests for CorkyClient (Corky chart-client-interface v1 protocol client).
//
// Drives the client through a FakeSocket — no real network. The FakeSocket
// captures every outbound frame and lets the test push gateway events back,
// replaying the canonical fixtures from test/fixtures/corky/.

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { CorkyClient, isRetryable, KNOWN_ERROR_CODES } from '../../src/helpers/feed/corky-client.js'
import * as fx from '../fixtures/corky/index.js'

// ── FakeSocket ────────────────────────────────────────────────────────────────
// Mimics the slice of the WebSocket API CorkyClient touches. Records sent
// frames (parsed) and exposes helpers to simulate open/message/close.
class FakeSocket {
    constructor(url) {
        this.url = url
        this.sent = []          // parsed outbound frames
        this.rawSent = []       // raw strings
        this.closed = false
        this.onopen = null
        this.onmessage = null
        this.onerror = null
        this.onclose = null
        FakeSocket.instances.push(this)
    }
    send(raw) {
        this.rawSent.push(raw)
        this.sent.push(JSON.parse(raw))
    }
    close() {
        this.closed = true
        if (this.onclose) this.onclose({ code: 1000 })
    }
    // ── test drivers ──
    open() { if (this.onopen) this.onopen({}) }
    push(envelope) {
        if (this.onmessage) this.onmessage({ data: JSON.stringify(envelope) })
    }
    pushRaw(raw) { if (this.onmessage) this.onmessage({ data: raw }) }
    drop(code = 1006) { this.closed = true; if (this.onclose) this.onclose({ code }) }
    static reset() { FakeSocket.instances = [] }
}
FakeSocket.instances = []

// Build a client wired to a single FakeSocket, already connected + opened.
function makeClient(opts = {}) {
    FakeSocket.reset()
    const client = new CorkyClient({
        url: 'ws://fake/corky',
        socketFactory: (url) => new FakeSocket(url),
        backoff: false, // reconnect disabled by default in tests
        ...opts,
    })
    client.connect()
    const sock = () => FakeSocket.instances[FakeSocket.instances.length - 1]
    sock().open()
    return { client, sock }
}

// Echo a fixture event back under a chosen request_id.
function withRequestId(fixture, request_id) {
    return { ...fixture, request_id }
}

beforeEach(() => FakeSocket.reset())

describe('CorkyClient — request framing', () => {
    it('wraps commands in a v1 envelope with a unique, deterministic request_id', () => {
        const { client, sock } = makeClient()
        client.listCandleStates('BITFINEX')
        client.listCandleStates()

        expect(sock().sent).toHaveLength(2)
        const [a, b] = sock().sent
        expect(a.schema_version).toBe(1)
        expect(a.command).toEqual({ type: 'list_candle_states', venue: 'BITFINEX' })
        expect(b.command).toEqual({ type: 'list_candle_states' })
        // deterministic, incrementing, unique
        expect(a.request_id).toBe('corky-req-1')
        expect(b.request_id).toBe('corky-req-2')
        expect(a.request_id).not.toBe(b.request_id)
    })

    it('builds subscribe / unsubscribe / upsert / patch frames matching the fixtures', () => {
        const { client, sock } = makeClient()

        client.subscribeCandles({
            subscription_id: 'chart-sub-tbtc-1m',
            target_runtime_id: 'public-market-main',
            venue: 'BITFINEX', symbol: 'tBTCUSD', timeframe: '1m',
            range: { type: 'latest', limit: 200 },
            include_indicators: true, chunk_rows: 200,
        })
        const subFrame = sock().sent[0]
        expect(subFrame.command).toEqual(fx.subscribeLatestRequest.command)

        client.upsertCandleState({
            target_runtime_id: 'public-market-main',
            venue: 'BITFINEX', symbol: 'tBTCUSD',
            timeframes: ['1m', '5m', '1D'],
            indicators: [{ kind: 'sma', timeframe: '5m', source: 'close', params: { period: '20' } }],
            buffer: 200,
        })
        expect(sock().sent[1].command).toEqual(fx.upsertCandleStateRequest.command)

        client.unsubscribe('chart-sub-tbtc-1m')
        expect(sock().sent[2].command).toEqual({ type: 'unsubscribe', subscription_id: 'chart-sub-tbtc-1m' })

        client.patchCandleState({ venue: 'BITFINEX', symbol: 'tBTCUSD', buffer: 300 })
        expect(sock().sent[3].command).toEqual({ type: 'patch_candle_state', venue: 'BITFINEX', symbol: 'tBTCUSD', buffer: 300 })
    })
})

describe('CorkyClient — correlation & resolution', () => {
    it('resolves listCandleStates() with states[] when candle_states is pushed', async () => {
        const { client, sock } = makeClient()
        const p = client.listCandleStates('BITFINEX')
        const reqId = sock().sent[0].request_id

        sock().push(withRequestId(fx.candleStatesEvent, reqId))

        const states = await p
        expect(Array.isArray(states)).toBe(true)
        expect(states[0].venue).toBe('BITFINEX')
        expect(states[0].symbol).toBe('tBTCUSD')
        expect(states[0].indicators[0].display_label).toBe('SMA(20)')
    })

    it('ignores events whose request_id does not match any pending request', async () => {
        const { client, sock } = makeClient()
        const p = client.listCandleStates('BITFINEX')
        const reqId = sock().sent[0].request_id

        // wrong id — must NOT resolve
        sock().push(withRequestId(fx.candleStatesEvent, 'some-other-id'))
        // correct id — resolves
        sock().push(withRequestId(fx.candleStatesEvent, reqId))

        const states = await p
        expect(states[0].symbol).toBe('tBTCUSD')
    })

    it('resolves control commands on control_ack', async () => {
        const { client, sock } = makeClient()
        const p = client.upsertCandleState({ venue: 'BITFINEX', symbol: 'tBTCUSD', timeframes: ['1m'] })
        const reqId = sock().sent[0].request_id

        sock().push(withRequestId(fx.controlAckEvent, reqId))

        const ack = await p
        expect(ack.type).toBe('control_ack')
        expect(ack.status).toBe('Applied')
        expect(ack.outcome).toBe('applied_hot')
    })
})

describe('CorkyClient — subscription streaming', () => {
    it('routes historical_chunk and live_update to the subscription callback in order', async () => {
        const { client, sock } = makeClient()
        const events = []
        const p = client.subscribeCandles({
            subscription_id: 'chart-sub-tbtc-1m',
            venue: 'BITFINEX', symbol: 'tBTCUSD', timeframe: '1m',
            range: { type: 'latest', limit: 200 }, include_indicators: true,
            onEvent: ({ event }) => events.push(event.type),
        })
        const reqId = sock().sent[0].request_id

        // lifecycle: accepted -> chunk -> complete (resolves) -> live updates
        sock().push(withRequestId(fx.historicalChunkEvent, reqId))
        sock().push({
            schema_version: 1, request_id: reqId,
            event: { type: 'historical_complete', subscription_id: 'chart-sub-tbtc-1m', chunks: 1, rows: 1, timeframes: ['1m'] },
        })

        const result = await p
        expect(result.type).toBe('historical_complete')
        expect(events).toEqual(['historical_chunk', 'historical_complete'])

        // After resolution, live_update (request_id may be null) still fans out
        // to a subscription observer registered via onSubscription.
        const live = []
        client.onSubscription('chart-sub-tbtc-1m', ({ event }) => live.push(event))
        sock().push(fx.liveUpdateEvent) // request_id absent
        expect(live).toHaveLength(1)
        expect(live[0].type).toBe('live_update')
        expect(live[0].sequence).toBe(42)
        expect(live[0].row.candle.close).toBe('77890')
    })

    it('indexes live_update by subscription_id even with a null request_id', () => {
        const { client, sock } = makeClient()
        const seen = []
        client.onSubscription('chart-sub-tbtc-1m', (p) => seen.push(p.event.sequence))
        // a foreign subscription must not leak in
        client.onSubscription('other-sub', () => { throw new Error('must not fire') })

        sock().push(fx.liveUpdateEvent)
        expect(seen).toEqual([42])
    })
})

describe('CorkyClient — errors', () => {
    it('rejects the correlated request and flags retryable from the catalog', async () => {
        const { client, sock } = makeClient()
        const p = client.subscribeCandles({
            subscription_id: 'chart-sub-tbtc-1m', venue: 'BITFINEX', symbol: 'tBTCUSD', timeframe: '1m',
        })
        const reqId = sock().sent[0].request_id

        sock().push(withRequestId(fx.errorEvent, reqId)) // state_not_found, retryable:false

        await expect(p).rejects.toMatchObject({
            code: 'state_not_found',
            retryable: false,
        })
    })

    it('maps a retryable error code (runtime_not_found)', async () => {
        const { client, sock } = makeClient()
        const p = client.listCandleStates()
        const reqId = sock().sent[0].request_id
        sock().push({
            schema_version: 1, request_id: reqId,
            event: { type: 'error', code: 'runtime_not_found', message: 'no runtime', retryable: true },
        })
        await expect(p).rejects.toMatchObject({ code: 'runtime_not_found', retryable: true })
    })

    it('isRetryable falls back to the catalog and defaults unknown codes to false', () => {
        expect(isRetryable('runtime_not_found')).toBe(true)
        expect(isRetryable('state_not_found')).toBe(false)
        expect(isRetryable('totally_unknown_code')).toBe(false)
        // wire flag wins over catalog
        expect(isRetryable('state_not_found', true)).toBe(true)
        expect(KNOWN_ERROR_CODES.historical_query_failed.retryable).toBe(false)
        // runtime_control_rejected (gateway↔runtime control session down) is
        // retryable so the chart self-heals when the control channel returns.
        expect(isRetryable('runtime_control_rejected')).toBe(true)
    })
})

describe('CorkyClient — schema guard', () => {
    it('rejects events whose schema_version is not 1', async () => {
        const { client, sock } = makeClient()
        const schemaErr = vi.fn()
        client.on('schema-error', schemaErr)

        const p = client.listCandleStates()
        const reqId = sock().sent[0].request_id

        sock().push({ schema_version: 2, request_id: reqId, event: { type: 'candle_states', states: [] } })

        await expect(p).rejects.toMatchObject({ code: 'unsupported_schema_version' })
        expect(schemaErr).toHaveBeenCalledOnce()
    })

    it('treats an omitted schema_version as 1 (per contract default)', async () => {
        const { client, sock } = makeClient()
        const p = client.listCandleStates()
        const reqId = sock().sent[0].request_id
        sock().push({ request_id: reqId, event: { type: 'candle_states', states: [{ venue: 'X', symbol: 'Y' }] } })
        const states = await p
        expect(states[0].venue).toBe('X')
    })
})

describe('CorkyClient — reconnect / backoff', () => {
    it('does not reconnect when backoff is disabled', () => {
        const { client, sock } = makeClient({ backoff: false })
        const reconnecting = vi.fn()
        client.on('reconnecting', reconnecting)
        sock().drop()
        expect(reconnecting).not.toHaveBeenCalled()
        expect(FakeSocket.instances).toHaveLength(1)
    })

    it('reconnects with bounded, capped backoff and stops after maxRetries', () => {
        vi.useFakeTimers()
        try {
            FakeSocket.reset()
            const client = new CorkyClient({
                url: 'ws://fake/corky',
                socketFactory: (url) => new FakeSocket(url),
                backoff: { base: 100, factor: 2, max: 500, maxRetries: 3 },
            })
            client.connect()
            const delays = []
            client.on('reconnecting', ({ delay }) => delays.push(delay))
            const exhausted = vi.fn()
            client.on('reconnect-exhausted', exhausted)

            // drive: each drop (WITHOUT a successful open in between, so the
            // backoff does not reset) schedules an escalating reconnect; advance
            // timers to materialise the next socket, then drop that too.
            for (let i = 0; i < 4; i++) {
                const s = FakeSocket.instances[FakeSocket.instances.length - 1]
                s.drop()
                vi.advanceTimersByTime(10_000)
            }

            // bounded + capped: base 100 ×2 each attempt, capped at max=500,
            // exactly maxRetries=3 attempts then exhausted.
            expect(delays).toEqual([100, 200, 400])
            expect(exhausted).toHaveBeenCalledOnce()
        } finally {
            vi.useRealTimers()
        }
    })

    it('user close() stops reconnection and fails pending requests', async () => {
        const { client, sock } = makeClient({ backoff: { base: 1, factor: 2, max: 10, maxRetries: 5 } })
        const reconnecting = vi.fn()
        client.on('reconnecting', reconnecting)
        const p = client.listCandleStates()
        client.close()
        await expect(p).rejects.toMatchObject({ code: 'client_closed' })
        // closing triggers onclose, but _closedByUser must suppress reconnect
        expect(reconnecting).not.toHaveBeenCalled()
    })
})
