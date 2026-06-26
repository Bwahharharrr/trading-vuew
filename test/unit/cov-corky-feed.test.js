// @vitest-environment jsdom
//
// Coverage push for the corky-feed cluster. ONE file (jsdom — the Node-only
// CorkyClient assertions run fine under jsdom; the two .vue panels need the DOM).
//
//   1. src/helpers/feed/corky-client.js  — the strategy/backtest senders, the
//      optional-field branches of subscribe/upsert/patch/history, the onerror
//      and off() observers, the _send "no socket" throw, the _request synchronous
//      throw→reject path, _resultFor slices, and the mid-stream error fan-out
//      that the existing FakeClient-stubbed feed tests never reach.
//   2. src/components/feed/CorkyPositionsPanel.vue  — the multi-account <select>,
//      sideClass/signClass/pctText/fmtTime formatters, runDetailTitle, resize
//      handle, selectTab no-op, account-change emit.
//   3. src/components/feed/SearchSignalsForm.vue  — removeRow, the validation
//      error paths (no venue/symbol/timeframe/condition, bad latest limit, bad
//      date range), timeframe reconciliation when the symbol's options change.
//
// A FakeSocket (mirrors the slice of the WebSocket API the client touches) drives
// request/stream routing with no network and deterministic ids.

import { describe, it, test, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { CorkyClient, CorkyError } from '../../src/helpers/feed/corky-client.js'
import CorkyPositionsPanel from '../../src/components/feed/CorkyPositionsPanel.vue'
import SearchSignalsForm from '../../src/components/feed/SearchSignalsForm.vue'

// ── FakeSocket ────────────────────────────────────────────────────────────────
// No readyState → CorkyClient treats it as always-OPEN (per _send comment). Test
// drivers replay gateway events and simulate open/error/close.
class FakeSocket {
    constructor(url) {
        this.url = url
        this.sent = []          // parsed outbound frames
        this.onopen = this.onmessage = this.onerror = this.onclose = null
        FakeSocket.instances.push(this)
    }
    send(raw) { this.sent.push(JSON.parse(raw)) }
    close() { this.closed = true; if (this.onclose) this.onclose({ code: 1000 }) }
    open() { if (this.onopen) this.onopen({}) }
    error(err) { if (this.onerror) this.onerror(err) }
    push(envelope) { if (this.onmessage) this.onmessage({ data: JSON.stringify(envelope) }) }
    drop(code = 1006) { this.closed = true; if (this.onclose) this.onclose({ code }) }
    static reset() { FakeSocket.instances = [] }
}
FakeSocket.instances = []

function makeClient(opts = {}) {
    FakeSocket.reset()
    const client = new CorkyClient({
        url: 'ws://fake/corky',
        socketFactory: (url) => new FakeSocket(url),
        backoff: false,
        ...opts,
    })
    client.connect()
    const sock = () => FakeSocket.instances[FakeSocket.instances.length - 1]
    sock().open()
    return { client, sock }
}

// Resolve a one-shot command and return its frame + a push helper bound to its id.
function lastFrame(sock) { return sock().sent[sock().sent.length - 1] }

beforeEach(() => FakeSocket.reset())

// ═══════════════════════════════════════════════════════════════════════════════
// CorkyClient — strategy / backtest senders (real client; the feed tests stub it)
// ═══════════════════════════════════════════════════════════════════════════════
describe('CorkyClient — strategy/backtest sender framing', () => {
    it('listStrategies sends a bare list_strategies command', () => {
        const { client, sock } = makeClient()
        client.listStrategies()
        expect(lastFrame(sock).command).toEqual({ type: 'list_strategies' })
    })

    it('getStrategy requires a strategy and frames it', () => {
        const { client, sock } = makeClient()
        expect(() => client.getStrategy()).toThrow(/strategy is required/)
        client.getStrategy('ema_cross_all_in_v1')
        expect(lastFrame(sock).command).toEqual({ type: 'get_strategy', strategy: 'ema_cross_all_in_v1' })
    })

    it('listBacktestRuns omits unset filters and includes set ones', () => {
        const { client, sock } = makeClient()
        client.listBacktestRuns()
        expect(lastFrame(sock).command).toEqual({ type: 'list_backtest_runs' })
        client.listBacktestRuns({ strategy: 'ema', symbol: 'tBTCUSD', venue: 'BITFINEX', status: 'completed' })
        expect(lastFrame(sock).command).toEqual({
            type: 'list_backtest_runs', strategy: 'ema', symbol: 'tBTCUSD', venue: 'BITFINEX', status: 'completed',
        })
    })

    it('getBacktestRun requires run_id and passes compact only when set', () => {
        const { client, sock } = makeClient()
        expect(() => client.getBacktestRun()).toThrow(/run_id is required/)
        client.getBacktestRun('r1')
        expect(lastFrame(sock).command).toEqual({ type: 'get_backtest_run', run_id: 'r1' })
        client.getBacktestRun('r1', { compact: true })
        expect(lastFrame(sock).command).toEqual({ type: 'get_backtest_run', run_id: 'r1', compact: true })
    })

    it('getBacktestProgress requires run_id and frames it', () => {
        const { client, sock } = makeClient()
        expect(() => client.getBacktestProgress()).toThrow(/run_id is required/)
        client.getBacktestProgress('r1')
        expect(lastFrame(sock).command).toEqual({ type: 'get_backtest_progress', run_id: 'r1' })
    })

    it('subscribeBacktestProgress validates subscription_id then run_id', () => {
        const { client, sock } = makeClient()
        expect(() => client.subscribeBacktestProgress({})).toThrow(/subscription_id is required/)
        expect(() => client.subscribeBacktestProgress({ subscription_id: 's' })).toThrow(/run_id is required/)
        client.subscribeBacktestProgress({ subscription_id: 'bt-sub', run_id: 'r1' })
        expect(lastFrame(sock).command).toEqual({ type: 'subscribe_backtest_progress', subscription_id: 'bt-sub', run_id: 'r1' })
    })

    it('getBacktestChartOverlays requires run_id and threads every optional window field', () => {
        const { client, sock } = makeClient()
        expect(() => client.getBacktestChartOverlays({})).toThrow(/run_id is required/)
        client.getBacktestChartOverlays({ run_id: 'r1' })
        expect(lastFrame(sock).command).toEqual({ type: 'get_backtest_chart_overlays', run_id: 'r1' })
        client.getBacktestChartOverlays({
            run_id: 'r1', timeframe: '1h', before_bars: 10, after_bars: 20,
            start_ms: 100, end_ms: 200, run_index: 1, fold_index: 2,
        })
        expect(lastFrame(sock).command).toEqual({
            type: 'get_backtest_chart_overlays', run_id: 'r1', timeframe: '1h',
            before_bars: 10, after_bars: 20, start_ms: 100, end_ms: 200, run_index: 1, fold_index: 2,
        })
    })

    it('getBacktestReportOverlays requires run_id and threads window/downsample fields', () => {
        const { client, sock } = makeClient()
        expect(() => client.getBacktestReportOverlays({})).toThrow(/run_id is required/)
        client.getBacktestReportOverlays({ run_id: 'r1' })
        expect(lastFrame(sock).command).toEqual({ type: 'get_backtest_report_overlays', run_id: 'r1' })
        client.getBacktestReportOverlays({
            run_id: 'r1', start_ms: 100, end_ms: 200, max_points: 500, run_index: 0, fold_index: 3,
        })
        expect(lastFrame(sock).command).toEqual({
            type: 'get_backtest_report_overlays', run_id: 'r1',
            start_ms: 100, end_ms: 200, max_points: 500, run_index: 0, fold_index: 3,
        })
    })
})

describe('CorkyClient — strategy/backtest resolution & _resultFor slices', () => {
    it('listStrategies resolves event.strategies (the array slice)', async () => {
        const { client, sock } = makeClient()
        const p = client.listStrategies()
        const reqId = lastFrame(sock).request_id
        sock().push({ schema_version: 1, request_id: reqId, event: { type: 'strategies', strategies: [{ name: 'ema' }] } })
        await expect(p).resolves.toEqual([{ name: 'ema' }])
    })

    it('getStrategy resolves event.strategy (the descriptor slice)', async () => {
        const { client, sock } = makeClient()
        const p = client.getStrategy('ema')
        const reqId = lastFrame(sock).request_id
        sock().push({ schema_version: 1, request_id: reqId, event: { type: 'strategy', strategy: { name: 'ema', params: {} } } })
        await expect(p).resolves.toEqual({ name: 'ema', params: {} })
    })

    it('listBacktestRuns resolves event.runs (the array slice)', async () => {
        const { client, sock } = makeClient()
        const p = client.listBacktestRuns({ status: 'completed' })
        const reqId = lastFrame(sock).request_id
        sock().push({ schema_version: 1, request_id: reqId, event: { type: 'backtest_runs', runs: [{ run_id: 'r1' }] } })
        await expect(p).resolves.toEqual([{ run_id: 'r1' }])
    })

    it('getBacktestRun resolves the FULL event (run_id + artifact kept)', async () => {
        const { client, sock } = makeClient()
        const p = client.getBacktestRun('r1')
        const reqId = lastFrame(sock).request_id
        const ev = { type: 'backtest_run', run_id: 'r1', artifact: { metrics: { profit_factor: '1.33' } } }
        sock().push({ schema_version: 1, request_id: reqId, event: ev })
        await expect(p).resolves.toEqual(ev)
    })

    it('getBacktestProgress resolves the FULL event (events list kept)', async () => {
        const { client, sock } = makeClient()
        const p = client.getBacktestProgress('r1')
        const reqId = lastFrame(sock).request_id
        const ev = { type: 'backtest_progress', run_id: 'r1', events: [{ seq: 1 }] }
        sock().push({ schema_version: 1, request_id: reqId, event: ev })
        await expect(p).resolves.toEqual(ev)
    })

    it('get*Overlays resolve the FULL event', async () => {
        const { client, sock } = makeClient()
        const pc = client.getBacktestChartOverlays({ run_id: 'r1' })
        let reqId = lastFrame(sock).request_id
        const evc = { type: 'backtest_chart_overlays', run_id: 'r1', trades: [{ ts: 1 }] }
        sock().push({ schema_version: 1, request_id: reqId, event: evc })
        await expect(pc).resolves.toEqual(evc)

        const pr = client.getBacktestReportOverlays({ run_id: 'r1' })
        reqId = lastFrame(sock).request_id
        const evr = { type: 'backtest_report_overlays', run_id: 'r1', series_descriptors: [{ id: 'equity' }] }
        sock().push({ schema_version: 1, request_id: reqId, event: evr })
        await expect(pr).resolves.toEqual(evr)
    })

    it('a backtest read error rejects with the catalog retryability', async () => {
        const { client, sock } = makeClient()
        const p = client.getBacktestRun('r1')
        const reqId = lastFrame(sock).request_id
        // backtest_artifact_not_ready is RETRYABLE per the catalog.
        sock().push({ schema_version: 1, request_id: reqId, event: { type: 'error', code: 'backtest_artifact_not_ready', message: 'still writing' } })
        await expect(p).rejects.toMatchObject({ code: 'backtest_artifact_not_ready', retryable: true })
    })

    it('subscribeBacktestProgress resolves on the FIRST progress update and fans out the rest', async () => {
        const { client, sock } = makeClient()
        const seen = []
        const p = client.subscribeBacktestProgress({
            subscription_id: 'bt-sub', run_id: 'r1',
            onEvent: ({ event }) => seen.push(['onEvent', event.sequence]),
        })
        // first update (null request_id) resolves the subscribe with the FULL event.
        sock().push({ schema_version: 1, event: { type: 'backtest_progress_update', subscription_id: 'bt-sub', sequence: 1, events: [{ seq: 1 }] } })
        const first = await p
        expect(first).toEqual({ type: 'backtest_progress_update', subscription_id: 'bt-sub', sequence: 1, events: [{ seq: 1 }] })
        expect(seen).toEqual([['onEvent', 1]])
        // subsequent updates fan out to onSubscription only.
        client.onSubscription('bt-sub', ({ event }) => seen.push(['fanout', event.sequence]))
        sock().push({ schema_version: 1, event: { type: 'backtest_progress_update', subscription_id: 'bt-sub', sequence: 2, events: [] } })
        expect(seen).toContainEqual(['fanout', 2])
    })
})

// ═══════════════════════════════════════════════════════════════════════════════
// CorkyClient — optional-field branches of subscribe/upsert/patch/history
// ═══════════════════════════════════════════════════════════════════════════════
describe('CorkyClient — optional-field framing branches', () => {
    it('subscribeCandles threads funding_period / indicators / ack_mode / historical_format', () => {
        const { client, sock } = makeClient()
        client.subscribeCandles({
            subscription_id: 'sub-1', venue: 'BITFINEX', symbol: 'tBTCUSD', timeframe: '1m',
            funding_period: '8h', indicators: [{ kind: 'sma' }],
            ack_mode: 'summary', historical_format: 'columnar',
        })
        const cmd = lastFrame(sock).command
        expect(cmd.funding_period).toBe('8h')
        expect(cmd.indicators).toEqual([{ kind: 'sma' }])
        expect(cmd.ack_mode).toBe('summary')
        expect(cmd.historical_format).toBe('columnar')
        // include_indicators / range / chunk_rows / target_runtime_id were unset → omitted
        expect('include_indicators' in cmd).toBe(false)
        expect('range' in cmd).toBe(false)
        expect('chunk_rows' in cmd).toBe(false)
        expect('target_runtime_id' in cmd).toBe(false)
    })

    it('subscribeCandles requires a subscription_id', () => {
        const { client } = makeClient()
        expect(() => client.subscribeCandles({})).toThrow(/subscription_id is required/)
    })

    it('unsubscribe requires a subscription_id', () => {
        const { client } = makeClient()
        expect(() => client.unsubscribe()).toThrow(/subscription_id is required/)
    })

    it('upsertCandleState threads target_runtime_id / funding_period and defaults timeframes to []', () => {
        const { client, sock } = makeClient()
        client.upsertCandleState({
            venue: 'BITFINEX', symbol: 'tBTCUSD',
            target_runtime_id: 'rt-1', funding_period: '8h',
        })
        const cmd = lastFrame(sock).command
        expect(cmd).toEqual({
            type: 'upsert_candle_state', venue: 'BITFINEX', symbol: 'tBTCUSD',
            timeframes: [], target_runtime_id: 'rt-1', funding_period: '8h',
        })
    })

    it('patchCandleState threads only the provided optional fields', () => {
        const { client, sock } = makeClient()
        client.patchCandleState({
            venue: 'BITFINEX', symbol: 'tBTCUSD',
            target_runtime_id: 'rt-1', funding_period: '8h',
            timeframes: ['1m', '5m'], indicators: [{ kind: 'rsi' }], buffer: 300,
        })
        const cmd = lastFrame(sock).command
        expect(cmd).toEqual({
            type: 'patch_candle_state', venue: 'BITFINEX', symbol: 'tBTCUSD',
            target_runtime_id: 'rt-1', funding_period: '8h',
            timeframes: ['1m', '5m'], indicators: [{ kind: 'rsi' }], buffer: 300,
        })
    })

    it('patchCandleState with no optionals carries only venue/symbol', () => {
        const { client, sock } = makeClient()
        client.patchCandleState({ venue: 'BITFINEX', symbol: 'tBTCUSD' })
        expect(lastFrame(sock).command).toEqual({ type: 'patch_candle_state', venue: 'BITFINEX', symbol: 'tBTCUSD' })
    })

    it('listAuthPositionHistory threads symbol / limit / cursor when set', () => {
        const { client, sock } = makeClient()
        client.listAuthPositionHistory({
            venue: 'BITFINEX', account_id: 'paper-a', symbol: 'tBTCUSD', limit: 25, cursor: 'opaque-cur',
        })
        expect(lastFrame(sock).command).toEqual({
            type: 'list_auth_position_history', venue: 'BITFINEX', account_id: 'paper-a',
            symbol: 'tBTCUSD', limit: 25, cursor: 'opaque-cur',
        })
    })

    it('subscribeAuthPositions threads venue/account_id/symbol/include_historical', () => {
        const { client, sock } = makeClient()
        client.subscribeAuthPositions({
            subscription_id: 'ap', venue: 'BITFINEX', account_id: 'paper-a',
            symbol: 'tBTCUSD', include_historical: true,
        })
        expect(lastFrame(sock).command).toEqual({
            type: 'subscribe_auth_positions', subscription_id: 'ap',
            venue: 'BITFINEX', account_id: 'paper-a', symbol: 'tBTCUSD', include_historical: true,
        })
    })
})

// ═══════════════════════════════════════════════════════════════════════════════
// CorkyClient — observers, send-path, request-throw, mid-stream error fan-out
// ═══════════════════════════════════════════════════════════════════════════════
describe('CorkyClient — observers & low-level plumbing', () => {
    it('socket onerror surfaces as a socket-error event', () => {
        const { client, sock } = makeClient()
        const seen = []
        client.on('socket-error', (e) => seen.push(e))
        const err = new Error('boom')
        sock().error(err)
        expect(seen).toEqual([err])
    })

    it('off(type, cb) detaches a listener registered with on()', () => {
        const { client, sock } = makeClient()
        const cb = vi.fn()
        client.on('control_ack', cb)
        sock().push({ schema_version: 1, request_id: null, event: { type: 'control_ack', status: 'Applied' } })
        expect(cb).toHaveBeenCalledTimes(1)
        client.off('control_ack', cb)
        sock().push({ schema_version: 1, request_id: null, event: { type: 'control_ack', status: 'Applied' } })
        expect(cb).toHaveBeenCalledTimes(1) // not called again
    })

    it('onSubscription disposer is a no-op once the subscription set is gone', () => {
        const { client } = makeClient()
        const dispose = client.onSubscription('sub-x', () => {})
        dispose()                          // removes the last cb → deletes the key
        expect(client._subscribers.has('sub-x')).toBe(false)
        expect(() => dispose()).not.toThrow() // second call hits the `if (!s) return` guard
    })

    it('_send throws when there is no socket at all (never connected)', () => {
        FakeSocket.reset()
        const client = new CorkyClient({
            url: 'ws://fake/corky',
            socketFactory: (url) => new FakeSocket(url),
            backoff: false,
        })
        // no connect() → _socket is null. _request catches the throw and rejects.
        return expect(client.listCandleStates()).rejects.toThrow(/not connected/)
    })

    it('a synchronous _send failure rejects the request and removes it from _pending', async () => {
        FakeSocket.reset()
        const client = new CorkyClient({
            url: 'ws://fake/corky',
            socketFactory: (url) => new FakeSocket(url),
            backoff: false,
        })
        client.connect()
        // Force send() to throw AFTER the pending entry is registered.
        FakeSocket.instances[0].open()
        FakeSocket.instances[0].send = () => { throw new Error('wire exploded') }
        const before = client._pending.size
        await expect(client.listCandleStates()).rejects.toThrow(/wire exploded/)
        // the failed request must not leak into _pending
        expect(client._pending.size).toBe(before)
    })

    it('a mid-stream error (runtime dies after historical_complete) fans out to the subscription', async () => {
        const { client, sock } = makeClient()
        const seen = []
        const corkyErrors = []
        const p = client.subscribeCandles({
            subscription_id: 'sub-1', venue: 'BITFINEX', symbol: 'tBTCUSD', timeframe: '1m',
        })
        const reqId = lastFrame(sock).request_id
        client.onSubscription('sub-1', ({ event }) => seen.push(event))
        client.on('corky-error', (e) => corkyErrors.push(e))
        // resolve the subscribe so the pending entry is deleted...
        sock().push({ schema_version: 1, request_id: reqId, event: { type: 'historical_complete', subscription_id: 'sub-1', chunks: 0, rows: 0 } })
        await p
        // ...now a subscription-scoped error arrives with NO matching pending → it
        // must still fan out (line 665), so the feed's error handler can fire.
        sock().push({
            schema_version: 1, request_id: null,
            event: { type: 'error', subscription_id: 'sub-1', code: 'runtime_control_rejected', message: 'control gone' },
        })
        // the historical_complete then the error reached the subscriber, in order,
        // and the error carried its full payload (not just a bare type marker).
        expect(seen.map((e) => e.type)).toEqual(['historical_complete', 'error'])
        const fannedError = seen[1]
        expect(fannedError).toMatchObject({
            type: 'error', subscription_id: 'sub-1',
            code: 'runtime_control_rejected', message: 'control gone',
        })
        // the error channel also fires with the catalog retryability resolved.
        expect(corkyErrors).toHaveLength(1)
        expect(corkyErrors[0]).toMatchObject({ retryable: true, event: { code: 'runtime_control_rejected' } })
    })

    it('queues a frame (rather than throwing) while a reconnect timer is pending', () => {
        vi.useFakeTimers()
        try {
            FakeSocket.reset()
            const client = new CorkyClient({
                url: 'ws://fake/corky',
                socketFactory: (url) => new FakeSocket(url),
                backoff: { base: 100, factor: 2, max: 1000, maxRetries: 3 },
            })
            client.connect()
            const s0 = FakeSocket.instances[0]
            // Give it a readyState so _send takes the non-OPEN branch; CLOSED with
            // a pending reconnect timer → _reconnectPossible() short-circuits true
            // on `_reconnectTimer != null` (line 239) and the frame is QUEUED.
            s0.readyState = 1
            s0.open()
            s0.readyState = 3 // CLOSED
            s0.drop()         // schedules a reconnect timer
            expect(client._reconnectTimer).not.toBe(null)

            const id = client.searchCandles({ search_id: 'S1' }) // fire-and-forget; goes to the queue
            expect(id).toBe('corky-req-1')
            expect(client._sendQueue).toHaveLength(1)

            // the reconnect fires → onopen flushes the queued frame
            vi.advanceTimersByTime(100)
            const s1 = FakeSocket.instances[FakeSocket.instances.length - 1]
            s1.open()
            expect(s1.sent).toHaveLength(1)
            expect(s1.sent[0].command).toEqual({ type: 'search_candles', query: { search_id: 'S1' } })
        } finally {
            vi.useRealTimers()
        }
    })

    it('subscribeCandles resolves on historical_complete and delivers lifecycle events to onEvent in order', async () => {
        const { client, sock } = makeClient()
        const seen = []
        const p = client.subscribeCandles({
            subscription_id: 'sub-1', venue: 'BITFINEX', symbol: 'tBTCUSD', timeframe: '1m',
            onEvent: ({ event }) => seen.push(event.type),
        })
        const reqId = lastFrame(sock).request_id
        // an interim accept event is delivered to onEvent but does NOT resolve.
        sock().push({ schema_version: 1, request_id: reqId, event: { type: 'subscription_accepted', subscription_id: 'sub-1' } })
        // historical_complete resolves the subscribe with the FULL event.
        const complete = { type: 'historical_complete', subscription_id: 'sub-1', chunks: 2, rows: 480 }
        sock().push({ schema_version: 1, request_id: reqId, event: complete })
        await expect(p).resolves.toEqual(complete)
        expect(seen).toEqual(['subscription_accepted', 'historical_complete'])
    })

    it('a parse-error is emitted for non-JSON frames and nothing settles', () => {
        const { client, sock } = makeClient()
        const errs = []
        client.on('parse-error', (e) => errs.push(e))
        const p = client.listCandleStates()
        if (sock().onmessage) sock().onmessage({ data: 'not-json{{{' })
        expect(errs).toHaveLength(1)
        // the observer gets the offending raw frame + the underlying parse error
        expect(errs[0].raw).toBe('not-json{{{')
        expect(errs[0].error).toBeInstanceOf(Error)
        // request is still pending (un-settled) — resolve it to avoid a dangling promise.
        sock().push({ schema_version: 1, request_id: lastFrame(sock).request_id, event: { type: 'candle_states', states: [] } })
        return expect(p).resolves.toEqual([])
    })
})

// ═══════════════════════════════════════════════════════════════════════════════
// CorkyPositionsPanel — formatters, multi-account select, runDetailTitle, resize
// ═══════════════════════════════════════════════════════════════════════════════
describe('CorkyPositionsPanel — formatters & controls', () => {
    const baseRow = {
        venue: 'BITFINEX', account_id: 'paper-a', symbol: 'tBTCUSD', position_id: 1,
        source: 'current', side: 'long', amount: '0.25', base_price: '63000',
        pl: '12.75', pl_perc: '0.03', opened_at_ms: 1781953200000,
    }

    function mountPanel(props = {}) {
        return mount(CorkyPositionsPanel, {
            props: { open: true, activeTab: 'open', openPositions: [baseRow], ...props },
        })
    }

    test('sideClass colours long/short and leaves unknown sides unstyled', () => {
        const vm = mountPanel().vm
        expect(vm.sideClass({ side: 'long' })).toBe('side-long')
        expect(vm.sideClass({ side: 'SHORT' })).toBe('side-short')
        expect(vm.sideClass({ side: 'flat' })).toBe('')
        expect(vm.sideClass({})).toBe('')
        expect(vm.sideClass(null)).toBe('')
    })

    test('signClass keys off the textual sign of a decimal string (never float-parsed)', () => {
        const vm = mountPanel().vm
        expect(vm.signClass('12.75')).toBe('pos')
        expect(vm.signClass('-0.0001')).toBe('neg')
        expect(vm.signClass('0')).toBe('pos')
        // leading whitespace is trimmed before the sign test (isNeg trims)
        expect(vm.signClass('  -5')).toBe('neg')
        // a textual minus far from the front is NOT a negative (no float parse)
        expect(vm.signClass('1-2')).toBe('pos')
        expect(vm.signClass('')).toBe('')
        expect(vm.signClass(null)).toBe('')
        expect(vm.signClass(undefined)).toBe('')
    })

    test('pctText suffixes % and renders an em-dash for missing values', () => {
        const vm = mountPanel().vm
        expect(vm.pctText('0.03')).toBe('0.03%')
        expect(vm.pctText('-1.5')).toBe('-1.5%')
        expect(vm.pctText(null)).toBe('—')
        expect(vm.pctText('')).toBe('—')
    })

    test('fmtTime renders a local Y-M-D H:M, and an em-dash for 0 / negative / NaN', () => {
        const vm = mountPanel().vm
        expect(vm.fmtTime(0)).toBe('—')
        expect(vm.fmtTime(-5)).toBe('—')
        expect(vm.fmtTime(NaN)).toBe('—')
        const out = vm.fmtTime(1781953200000)
        expect(out).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/)
        // NaN Date (e.g. an out-of-range ms) → em-dash via the isNaN guard
        expect(vm.fmtTime(8.64e15 * 2)).toBe('—')
    })

    test('rowKey delegates to positionKey (stable composite identity)', () => {
        const vm = mountPanel().vm
        expect(vm.rowKey(baseRow)).toBe('bitfinex|paper-a|tbtcusd|current|1')
    })

    test('isActiveRow matches the charted ticker case-insensitively; false without a key', () => {
        const vm = mountPanel({ currentSymbolKey: 'bitfinex|tbtcusd' }).vm
        expect(vm.isActiveRow({ venue: 'BITFINEX', symbol: 'tBTCUSD' })).toBe(true)
        expect(vm.isActiveRow({ venue: 'BITFINEX', symbol: 'tETHUSD' })).toBe(false)
        const vm2 = mountPanel({ currentSymbolKey: '' }).vm
        expect(vm2.isActiveRow(baseRow)).toBe(false)
        expect(vm2.isActiveRow(null)).toBe(false)
    })

    test('runDetailTitle: "Run" with no selection, else strategy · symbol · TF', () => {
        const vm = mountPanel().vm
        expect(vm.runDetailTitle).toBe('Run')
        const w = mountPanel({ backtests: { selectedRun: { strategy: 'ema', symbols: ['tBTCUSD'], trade_timeframe: '1h' } } })
        expect(w.vm.runDetailTitle).toBe('ema · tBTCUSD · 1h')
        // missing symbols/tf → just the strategy (filter(Boolean) drops empties)
        const w2 = mountPanel({ backtests: { selectedRun: { strategy: 'ema' } } })
        expect(w2.vm.runDetailTitle).toBe('ema')
    })

    test('activeAccountKey is the folded account key or empty when no active account', () => {
        const acct = { venue: 'BITFINEX', account_id: 'paper-a' }
        const w = mountPanel({ accounts: [acct], activeAccount: acct })
        expect(w.vm.activeAccountKey).toBe('bitfinex|paper-a')
        expect(mountPanel().vm.activeAccountKey).toBe('')
    })

    test('selectTab only emits when the target differs from the active tab', async () => {
        const w = mountPanel({ activeTab: 'open' })
        w.vm.selectTab('open')                     // same → no emit
        expect(w.emitted('update:active-tab')).toBeFalsy()
        w.vm.selectTab('historical')               // different → emit
        expect(w.emitted('update:active-tab')[0]).toEqual(['historical'])
    })

    test('the account <select> appears only with >1 account and emits update:active-account on change', async () => {
        const a = { venue: 'BITFINEX', account_id: 'paper-a' }
        const b = { venue: 'BITFINEX', account_id: 'paper-b' }
        // single account → no select
        expect(mountPanel({ accounts: [a], activeAccount: a }).find('.pd-account').exists()).toBe(false)
        // two accounts → select rendered with both options
        const w = mountPanel({ accounts: [a, b], activeAccount: a })
        const sel = w.find('.pd-account')
        expect(sel.exists()).toBe(true)
        expect(sel.findAll('option')).toHaveLength(2)
        await sel.setValue('bitfinex|paper-b')
        expect(w.emitted('update:active-account')[0]).toEqual([b])
    })

    test('onAccountChange ignores a value that matches no known account', () => {
        const a = { venue: 'BITFINEX', account_id: 'paper-a' }
        const b = { venue: 'BITFINEX', account_id: 'paper-b' }
        const w = mountPanel({ accounts: [a, b], activeAccount: a })
        w.vm.onAccountChange({ target: { value: 'nope|nobody' } })
        expect(w.emitted('update:active-account')).toBeFalsy()
    })

    test('the resize handle emits resize-start with the mousedown event (only when open)', async () => {
        const w = mountPanel({ open: true })
        const handle = w.find('.pd-resizer')
        expect(handle.exists()).toBe(true)
        await handle.trigger('mousedown')
        // fired exactly once, carrying the actual DOM event as its payload
        const events = w.emitted('resize-start')
        expect(events).toHaveLength(1)
        expect(events[0][0]).toBeInstanceOf(Event)
        expect(events[0][0].type).toBe('mousedown')
        // collapsed → no resize handle
        expect(mountPanel({ open: false }).find('.pd-resizer').exists()).toBe(false)
    })

    test('error state takes precedence over the table', () => {
        const w = mountPanel({ error: 'gateway exploded' })
        expect(w.find('.pd-error').text()).toBe('gateway exploded')
        expect(w.find('.pd-table').exists()).toBe(false)
    })

    test('loading with no rows shows the Loading… message', () => {
        const w = mountPanel({ openPositions: [], loading: true })
        expect(w.find('.pd-msg').text()).toContain('Loading')
    })
})

// ═══════════════════════════════════════════════════════════════════════════════
// SearchSignalsForm — removeRow, validation error paths, timeframe reconciliation
// ═══════════════════════════════════════════════════════════════════════════════
describe('SearchSignalsForm — conditions & validation', () => {
    const context = {
        venue: 'BITFINEX', symbol: 'tBTCUSD', timeframe: '1h',
        timeframes: ['1h', '2h'],
        indicators: [{ label: 'MACD(12,26,9)', fields: ['histogram', 'macd'] }],
    }
    const mountForm = (props = {}) => mount(SearchSignalsForm, { props: { context, ...props } })

    async function fillFirstCondition(w, { indicator, field, value }) {
        const cond = w.findAll('.ssf-cond')[0]
        const selects = cond.findAll('select')
        await selects[0].setValue(indicator)
        await selects[1].setValue(field)
        await cond.find('input[step="any"]').setValue(value)
    }

    test('addRow / removeRow add and drop condition rows but never below one', async () => {
        const w = mountForm()
        expect(w.findAll('.ssf-cond')).toHaveLength(1)
        await w.find('.ssf-addcond').trigger('click')
        expect(w.findAll('.ssf-cond')).toHaveLength(2)
        // removeRow drops the targeted row
        w.vm.removeRow(0)
        await w.vm.$nextTick()
        expect(w.findAll('.ssf-cond')).toHaveLength(1)
        // the last row cannot be removed (guard)
        w.vm.removeRow(0)
        await w.vm.$nextTick()
        expect(w.findAll('.ssf-cond')).toHaveLength(1)
    })

    test('the remove button is disabled while exactly one condition remains', async () => {
        const w = mountForm()
        const btn = () => w.findAll('.ssf-cond')[0].find('.ssf-iconbtn')
        // single row → the disabled attribute is present (empty-string value)
        expect(btn().attributes('disabled')).toBe('')
        await w.find('.ssf-addcond').trigger('click')
        expect(btn().attributes('disabled')).toBeUndefined() // two rows → enabled
    })

    test('error: missing venue', async () => {
        const w = mountForm()
        await w.find('.ssf-grid2 input').setValue('')       // clear venue
        await w.find('.ssf-run').trigger('click')
        expect(w.emitted('run')).toBeUndefined()
        expect(w.find('.ssf-error').text()).toMatch(/Venue is required/)
    })

    test('error: missing symbol', async () => {
        const w = mountForm()
        const inputs = w.findAll('.ssf-grid2 input')
        await inputs[1].setValue('')                        // clear symbol
        await w.find('.ssf-run').trigger('click')
        expect(w.find('.ssf-error').text()).toMatch(/At least one symbol/)
    })

    test('error: no timeframe selected', async () => {
        const w = mountForm()
        // toggle the only on-chip off so tfs becomes empty
        const onChip = w.find('.ssf-chip.on')
        await onChip.trigger('click')
        await fillFirstCondition(w, { indicator: 'MACD(12,26,9)', field: 'histogram', value: '0' })
        await w.find('.ssf-run').trigger('click')
        expect(w.find('.ssf-error').text()).toMatch(/at least one timeframe/i)
    })

    test('error: no complete condition (incomplete row is filtered out)', async () => {
        const w = mountForm()
        // pick an indicator + field but leave the value empty → filtered → none complete
        const cond = w.findAll('.ssf-cond')[0]
        await cond.findAll('select')[0].setValue('MACD(12,26,9)')
        await cond.findAll('select')[1].setValue('histogram')
        await w.find('.ssf-run').trigger('click')
        expect(w.find('.ssf-error').text()).toMatch(/complete condition/)
    })

    test('error: a non-finite value disqualifies the condition', async () => {
        const w = mountForm()
        const cond = w.findAll('.ssf-cond')[0]
        await cond.findAll('select')[0].setValue('MACD(12,26,9)')
        await cond.findAll('select')[1].setValue('histogram')
        // number inputs coerce non-numerics to '' so set the model directly
        w.vm.rows[0].value = 'abc'
        await w.find('.ssf-run').trigger('click')
        expect(w.find('.ssf-error').text()).toMatch(/complete condition/)
    })

    test('error: latest limit must be positive', async () => {
        const w = mountForm()
        await fillFirstCondition(w, { indicator: 'MACD(12,26,9)', field: 'histogram', value: '0' })
        w.vm.latestLimit = 0
        await w.find('.ssf-run').trigger('click')
        expect(w.find('.ssf-error').text()).toMatch(/positive number/)
    })

    test('error: date-range with no dates picked', async () => {
        const w = mountForm()
        await fillFirstCondition(w, { indicator: 'MACD(12,26,9)', field: 'histogram', value: '0' })
        await w.findAll('input[type="radio"]')[1].setValue() // start_end mode
        await w.find('.ssf-run').trigger('click')
        expect(w.find('.ssf-error').text()).toMatch(/start and end date/)
    })

    test('error: date-range end must be after start', async () => {
        const w = mountForm()
        await fillFirstCondition(w, { indicator: 'MACD(12,26,9)', field: 'histogram', value: '0' })
        await w.findAll('input[type="radio"]')[1].setValue()
        const dates = w.findAll('input[type="datetime-local"]')
        await dates[0].setValue('2024-06-10T00:00')
        await dates[1].setValue('2024-06-01T00:00') // end before start
        await w.find('.ssf-run').trigger('click')
        expect(w.find('.ssf-error').text()).toMatch(/End must be after start/)
    })

    test('a valid date-range emits a start_end range with the parsed ms', async () => {
        const w = mountForm()
        await fillFirstCondition(w, { indicator: 'MACD(12,26,9)', field: 'histogram', value: '1.5' })
        await w.findAll('input[type="radio"]')[1].setValue()
        const dates = w.findAll('input[type="datetime-local"]')
        await dates[0].setValue('2024-06-01T00:00')
        await dates[1].setValue('2024-06-10T12:30')
        await w.find('.ssf-run').trigger('click')
        const payload = w.emitted('run')[0][0]
        expect(payload.range.type).toBe('start_end')
        expect(payload.range.end_ms).toBeGreaterThan(payload.range.start_ms)
        // decimal value is coerced to a finite number for the condition
        expect(payload.conditionRows[0].value).toBe(1.5)
    })

    test('changing an indicator clears the field selection (@change handler)', async () => {
        const w = mountForm()
        const selects = w.findAll('.ssf-cond')[0].findAll('select')
        await selects[0].setValue('MACD(12,26,9)')
        await selects[1].setValue('histogram')
        expect(w.vm.rows[0].field).toBe('histogram')
        // re-select the same indicator fires @change → field reset to ''
        await selects[0].trigger('change')
        expect(w.vm.rows[0].field).toBe('')
    })

    test('fieldsFor returns the indicator outputs, or [] for an unknown label', () => {
        const vm = mountForm().vm
        expect(vm.fieldsFor('MACD(12,26,9)')).toEqual(['histogram', 'macd'])
        expect(vm.fieldsFor('NOPE')).toEqual([])
    })
})

describe('SearchSignalsForm — timeframe reconciliation', () => {
    const mountForm = (context) => mount(SearchSignalsForm, { props: { context } })

    test('seeds the context timeframe when offered, else the first available', () => {
        const a = mountForm({ venue: 'V', symbol: 'S', timeframe: '2h', timeframes: ['1h', '2h'] })
        expect(a.vm.tfs).toEqual(['2h'])
        // context.timeframe not in the list → fall back to the first available
        const b = mountForm({ venue: 'V', symbol: 'S', timeframe: '4h', timeframes: ['1h', '2h'] })
        expect(b.vm.tfs).toEqual(['1h'])
    })

    test('dropping the symbol\'s offered timeframes prunes a now-invalid selection', async () => {
        const w = mountForm({ venue: 'V', symbol: 'S', timeframe: '2h', timeframes: ['1h', '2h'] })
        // select both
        await w.findAll('.ssf-chip')[0].trigger('click')
        expect(w.vm.tfs.sort()).toEqual(['1h', '2h'])
        // a context where only 1h survives → 2h is pruned, 1h kept
        await w.setProps({ context: { venue: 'V', symbol: 'S', timeframe: '1h', timeframes: ['1h'] } })
        expect(w.vm.tfs).toEqual(['1h'])
    })

    test('with no timeframes discovered the hint shows and tfs stays empty', () => {
        const w = mountForm({ venue: 'V', symbol: 'S', timeframe: '', timeframes: [] })
        expect(w.vm.tfs).toEqual([])
        expect(w.find('.ssf-hint').text()).toMatch(/No timeframes discovered/)
    })

    test('symbolOptions overrides timeframes/indicators when the searched symbol has its own descriptors', async () => {
        const ctx = {
            venue: 'BITFINEX', symbol: 'tBTCUSD', timeframe: '1h', timeframes: ['1h'],
            indicators: [{ label: 'BASE', fields: ['x'] }],
            symbols: [
                { venue: 'BITFINEX', symbol: 'tETHUSD', timeframes: ['5m', '15m'], indicators: [{ label: 'ETHIND', fields: ['y'] }] },
            ],
        }
        const w = mountForm(ctx)
        // charted symbol has no per-symbol descriptor → falls back to context-level
        expect(w.vm.availableTimeframes).toEqual(['1h'])
        expect(w.vm.indicators.map((i) => i.label)).toEqual(['BASE'])
        // switch the form's symbol to the one with its own descriptors
        await w.findAll('.ssf-grid2 input')[1].setValue('tETHUSD')
        expect(w.vm.availableTimeframes).toEqual(['5m', '15m'])
        expect(w.vm.indicators.map((i) => i.label)).toEqual(['ETHIND'])
    })
})
