// Unit tests for CorkyFeed (Corky → DataCube integration driver).
//
// Drives a REAL headless DataCube through a FAKE CorkyClient. The fake exposes
// the slice of the client surface CorkyFeed touches (listCandleStates /
// subscribeCandles / unsubscribe / onSubscription / close) and lets the test
// replay the canonical fixtures from test/fixtures/corky/ in protocol order:
//   candle_states  → discover()
//   historical_chunk + historical_complete → history pushed into the DataCube
//   live_update    → in-place append + redraw signal (+ dup/out-of-order drop)

import { describe, it, expect, beforeEach } from 'vitest'
import { CorkyFeed } from '../../src/helpers/feed/corky-feed.js'
import DataCube from '../../src/helpers/datacube.js'
import * as fx from '../fixtures/corky/index.js'

// ── FakeClient ──────────────────────────────────────────────────────────────
// Records subscribeCandles calls, registers per-subscription listeners, and
// lets the test push gateway EVENTS (not envelopes) into a subscription.
class FakeClient {
    constructor() {
        this.sent = []                 // outbound command log
        this._subListeners = new Map() // subscription_id → Set<cb>
        this._states = fx.candleStatesEvent.event.states
        this.closed = false
    }

    // discover()
    async listCandleStates(venue) {
        this.sent.push({ type: 'list_candle_states', venue })
        return this._states
    }

    // subscribe() entry — resolves immediately (history arrives via fan-out).
    async subscribeCandles(opts) {
        this.sent.push({ type: 'subscribe_candles', ...opts })
        this._lastSubId = opts.subscription_id
        return { type: 'historical_complete' }
    }

    async unsubscribe(subscription_id) {
        this.sent.push({ type: 'unsubscribe', subscription_id })
        return { type: 'control_ack' }
    }

    onSubscription(subscription_id, cb) {
        let set = this._subListeners.get(subscription_id)
        if (!set) { set = new Set(); this._subListeners.set(subscription_id, set) }
        set.add(cb)
        return () => set.delete(cb)
    }

    close() { this.closed = true }

    // ── test driver ──
    // Push a gateway EVENT to a subscription's listeners, re-tagged with the
    // given subscription_id (the feed mints its own id, so fixtures get retagged).
    emit(subscription_id, event) {
        const set = this._subListeners.get(subscription_id)
        if (!set) return
        const payload = { request_id: null, event: { ...event, subscription_id } }
        for (const cb of [...set]) cb(payload)
    }
}

function emptyData() {
    return { chart: { type: 'Candles', data: [] }, onchart: [], offchart: [] }
}

let client, dc, feed
beforeEach(() => {
    client = new FakeClient()
    dc = new DataCube(emptyData())
    feed = new CorkyFeed({ client, dataCube: dc })
})

describe('CorkyFeed.discover', () => {
    it('returns the candle_states catalog from the client', async () => {
        const states = await feed.discover('BITFINEX')
        expect(Array.isArray(states)).toBe(true)
        expect(states).toBe(fx.candleStatesEvent.event.states)
        // venue forwarded to the client
        expect(client.sent[0]).toEqual({ type: 'list_candle_states', venue: 'BITFINEX' })
        // the catalog the UI renders: state + its indicator descriptor
        expect(states[0].symbol).toBe('tBTCUSD')
        expect(states[0].indicators[0].kind).toBe('sma')
    })
})

describe('CorkyFeed.subscribe — history', () => {
    it('pushes assembled candles only (indicator overlays start hidden)', async () => {
        const handle = await feed.subscribe({
            venue: 'BITFINEX', symbol: 'tBTCUSD', timeframe: '1m',
        })
        const sid = handle.subscription_id

        // Replay history: one chunk, then complete.
        client.emit(sid, fx.historicalChunkEvent.event)
        client.emit(sid, { type: 'historical_complete' })

        // Candles landed in the DataCube.
        const ohlcv = dc.data.chart.data
        expect(ohlcv).toHaveLength(1)
        expect(ohlcv[0][0]).toBe(1779464940000) // ts
        expect(ohlcv[0][4]).toBe(77871)         // close
        expect(dc.data.chart.tf).toBe('1m')     // single-tf tag

        // CANDLES ONLY by default — no indicator overlays added.
        expect(dc.data.onchart).toHaveLength(0)
        expect(dc.data.offchart).toHaveLength(0)

        // …but the FULL structure (with the SMA overlay) is RETAINED on the
        // handle as the live source of truth.
        const built = handle.built
        expect(built).toBeTruthy()
        expect(built.onchart).toHaveLength(1)
        expect(built.onchart[0].settings.corkyKind).toBe('sma')
        expect(built.onchart[0].data).toEqual([[1779464940000, 77865.25]])
        // Nothing enabled yet.
        expect(feed.enabledKinds(handle).size).toBe(0)
    })

    it('enables an indicator client-side: adds exactly that kind\'s overlays', async () => {
        const handle = await feed.subscribe({
            venue: 'BITFINEX', symbol: 'tBTCUSD', timeframe: '1m',
        })
        client.emit(handle.subscription_id, fx.historicalChunkEvent.event)
        client.emit(handle.subscription_id, { type: 'historical_complete' })

        expect(dc.data.onchart).toHaveLength(0)

        feed.setIndicatorEnabled(handle, 'sma', true)
        expect(dc.data.onchart).toHaveLength(1)
        const sma = dc.data.onchart[0]
        expect(sma.settings.corkyKind).toBe('sma')
        expect(sma.id).toMatch(/^onchart\./)
        // The DataCube overlay is the SAME object as on handle.built.
        expect(sma).toBe(handle.built.onchart[0])
        expect(feed.enabledKinds(handle).has('sma')).toBe(true)

        // Idempotent: enabling again doesn't duplicate.
        feed.setIndicatorEnabled(handle, 'sma', true)
        expect(dc.data.onchart).toHaveLength(1)

        // Disable removes it.
        feed.setIndicatorEnabled(handle, 'sma', false)
        expect(dc.data.onchart).toHaveLength(0)
        expect(feed.enabledKinds(handle).has('sma')).toBe(false)

        // Idempotent off.
        feed.setIndicatorEnabled(handle, 'sma', false)
        expect(dc.data.onchart).toHaveLength(0)
    })
})

describe('CorkyFeed.subscribe — live', () => {
    async function primed() {
        const handle = await feed.subscribe({
            venue: 'BITFINEX', symbol: 'tBTCUSD', timeframe: '1m',
        })
        client.emit(handle.subscription_id, fx.historicalChunkEvent.event)
        client.emit(handle.subscription_id, { type: 'historical_complete' })
        return handle
    }

    it('appends a live candle in place and signals a redraw (invalidate)', async () => {
        const handle = await primed()
        const rev0 = dc.cd.revision()

        client.emit(handle.subscription_id, fx.liveUpdateEvent.event)

        const ohlcv = dc.data.chart.data
        expect(ohlcv).toHaveLength(2) // appended, not replaced
        const live = ohlcv[ohlcv.length - 1]
        expect(live[0]).toBe(1779465000000) // new ts
        expect(live[4]).toBe(77890)         // new close

        // The SMA series is kept fresh on handle.built even though it's hidden.
        expect(handle.built.onchart[0].data).toEqual([
            [1779464940000, 77865.25],
            [1779465000000, 77866.2],
        ])

        // redraw was signalled (store revision bumped).
        expect(dc.cd.revision()).toBeGreaterThan(rev0)
    })

    it('ignores a duplicate / out-of-order sequence (no append, no redraw)', async () => {
        const handle = await primed()

        // Apply the live update once (sequence 42).
        client.emit(handle.subscription_id, fx.liveUpdateEvent.event)
        expect(dc.data.chart.data).toHaveLength(2)
        const revAfterFirst = dc.cd.revision()

        // Replay the SAME event (sequence 42 ≤ last 42) → dropped.
        client.emit(handle.subscription_id, fx.liveUpdateEvent.event)
        expect(dc.data.chart.data).toHaveLength(2)        // no second append
        expect(dc.cd.revision()).toBe(revAfterFirst)      // no extra redraw

        // An explicitly older sequence is also dropped.
        const stale = { ...fx.liveUpdateEvent.event, sequence: 1 }
        client.emit(handle.subscription_id, stale)
        expect(dc.data.chart.data).toHaveLength(2)
        expect(dc.cd.revision()).toBe(revAfterFirst)
    })
})

// ── selective overlays + live freshness (hand-built TWO-kind rows) ──────────
// Two indicators of different kinds across a few candles:
//   kind 'MACD' (outputs macd + signal) → MANY overlays sharing corkyKind
//   kind 'SMA'  (output sma)            → one overlay
// Drives the candles-only default, per-kind enable/disable, and the critical
// "still-disabled series stays fresh so a later toggle-on shows latest" path.
function makeRow(ts, close, { macd, signal, sma }) {
    return {
        timeframe: '1D',
        candle: {
            timestamp_ms: ts,
            open: String(close), high: String(close + 1),
            low: String(close - 1), close: String(close), volume: '1',
        },
        indicators: {
            'MACD:12:26:9': { macd: String(macd), signal: String(signal) },
            'SMA:20': { sma: String(sma) },
        },
    }
}

function chunkEvent(sid, rows, chunk_index = 0) {
    return { type: 'historical_chunk', subscription_id: sid,
             chunk_index, timeframe: '1D', rows }
}

function liveEvent(sid, sequence, row) {
    return { type: 'live_update', subscription_id: sid, sequence, row }
}

describe('CorkyFeed — selective overlays + live freshness (two kinds)', () => {
    async function primedTwoKind() {
        const handle = await feed.subscribe({
            venue: 'BITFINEX', symbol: 'tBTCUSD', timeframe: '1D',
        })
        const sid = handle.subscription_id
        const rows = [
            makeRow(1, 100, { macd: 1.0, signal: 0.5, sma: 100.1 }),
            makeRow(2, 101, { macd: 1.2, signal: 0.6, sma: 100.4 }),
        ]
        client.emit(sid, chunkEvent(sid, rows))
        client.emit(sid, { type: 'historical_complete' })
        return handle
    }

    it('loads candles only; built carries every overlay; toggling is per-kind', async () => {
        const handle = await primedTwoKind()

        // Candles only in the DataCube.
        expect(dc.data.chart.data).toHaveLength(2)
        expect(dc.data.onchart).toHaveLength(0)
        expect(dc.data.offchart).toHaveLength(0)

        // built has MACD (2 outputs) + SMA (1 output) = 3 overlays total.
        const allBuilt = [...handle.built.onchart, ...handle.built.offchart]
        expect(allBuilt).toHaveLength(3)
        const macdOverlays = allBuilt.filter(o => o.settings.corkyKind === 'MACD')
        const smaOverlays = allBuilt.filter(o => o.settings.corkyKind === 'SMA')
        expect(macdOverlays).toHaveLength(2)
        expect(smaOverlays).toHaveLength(1)

        // Enable MACD: adds EXACTLY MACD's two overlays, and ONLY those.
        feed.setIndicatorEnabled(handle, 'MACD', true)
        const added = [...dc.data.onchart, ...dc.data.offchart]
        expect(added).toHaveLength(2)
        expect(added.every(o => o.settings.corkyKind === 'MACD')).toBe(true)
        expect(feed.enabledKinds(handle).has('MACD')).toBe(true)
        expect(feed.enabledKinds(handle).has('SMA')).toBe(false)
    })

    it('live update refreshes disabled series so a later toggle-on shows latest', async () => {
        const handle = await primedTwoKind()
        const sid = handle.subscription_id

        // Enable MACD only; SMA stays hidden.
        feed.setIndicatorEnabled(handle, 'MACD', true)
        const macdOverlay = [...dc.data.onchart, ...dc.data.offchart]
            .find(o => o.settings.corkyOutput === 'macd')
        expect(macdOverlay.data).toHaveLength(2)

        // A live tick carrying BOTH kinds (new candle ts=3).
        client.emit(sid, liveEvent(sid, 1, makeRow(3, 102, {
            macd: 1.5, signal: 0.7, sma: 100.9,
        })))

        // Enabled MACD overlay updated in place (3 points now).
        expect(macdOverlay.data).toHaveLength(3)
        expect(macdOverlay.data[2]).toEqual([3, 1.5])

        // Still-disabled SMA series is FRESH on handle.built (3 points).
        const smaBuilt = handle.built.onchart
            .concat(handle.built.offchart)
            .find(o => o.settings.corkyKind === 'SMA')
        expect(smaBuilt.data).toHaveLength(3)
        expect(smaBuilt.data[2]).toEqual([3, 100.9])

        // Enabling SMA AFTER the live tick shows the latest point immediately.
        feed.setIndicatorEnabled(handle, 'SMA', true)
        const smaShown = [...dc.data.onchart, ...dc.data.offchart]
            .find(o => o.settings.corkyKind === 'SMA')
        expect(smaShown).toBe(smaBuilt)             // same object
        expect(smaShown.data[2]).toEqual([3, 100.9]) // latest visible
    })

    it('disable removes exactly that kind; no leaked overlays/ids', async () => {
        const handle = await primedTwoKind()
        feed.setIndicatorEnabled(handle, 'MACD', true)
        feed.setIndicatorEnabled(handle, 'SMA', true)
        expect([...dc.data.onchart, ...dc.data.offchart]).toHaveLength(3)

        feed.setIndicatorEnabled(handle, 'MACD', false)
        const left = [...dc.data.onchart, ...dc.data.offchart]
        expect(left).toHaveLength(1)
        expect(left[0].settings.corkyKind).toBe('SMA')
        // No tracked overlays leaked for the removed kind.
        const trackedKinds = new Set(
            [...handle.addedOverlays].map(o => o.settings.corkyKind))
        expect(trackedKinds.has('MACD')).toBe(false)
        expect(trackedKinds.has('SMA')).toBe(true)

        // Disable SMA too → DataCube back to candles only, no tracked overlays.
        feed.setIndicatorEnabled(handle, 'SMA', false)
        expect([...dc.data.onchart, ...dc.data.offchart]).toHaveLength(0)
        expect(handle.addedOverlays.size).toBe(0)
        expect(feed.enabledKinds(handle).size).toBe(0)
    })

    it('unsubscribe clears the retained model (no leaks)', async () => {
        const handle = await primedTwoKind()
        feed.setIndicatorEnabled(handle, 'MACD', true)
        await feed.unsubscribe(handle)
        expect(handle.built).toBeNull()
        expect(handle.addedOverlays.size).toBe(0)
        expect(handle.enabledKinds.size).toBe(0)
    })
})

// ── same-kind instances must not toggle each other ─────────────────────────
// SCMR and SCMR(INV) are distinct indicator INSTANCES that share kind 'SCMR'
// (kindOf collapses them) AND share layer ids ('scmr_levels', 'scmr_reversal_
// markers', …). setIndicatorEnabled used to match overlays by kind alone, so
// enabling SCMR also drew SCMR(INV)'s overlays (the load-time double-render) and
// disabling SCMR(INV) tore down SCMR's (the cross-disable). It must scope by the
// unique corkyInstance — like setLayerEnabled and the candle_color path do.
describe('CorkyFeed — same-kind instances (SCMR + SCMR(INV)) toggle independently', () => {
    const lineView = () => ({ kind: 'scmr', view: { version: 1, layers: [
        { id: 'scmr_levels', label: 'Levels', kind: 'line', target: { surface: 'price' }, fields: ['lvl'], visible_by_default: true },
    ] } })
    const scmrRow = (ts) => ({
        timeframe: '1D',
        candle: { timestamp_ms: ts, open: '10', high: '12', low: '9', close: '11', volume: '1' },
        indicators: { SCMR: { lvl: '100' }, 'SCMR(INV)': { lvl: '200' } },
    })
    async function primed() {
        const handle = await feed.subscribe({
            venue: 'BITFINEX', symbol: 'tBTCUSD', timeframe: '1D',
            views: { SCMR: lineView(), 'SCMR(INV)': lineView() },
        })
        const sid = handle.subscription_id
        client.emit(sid, chunkEvent(sid, [scmrRow(1), scmrRow(2)]))
        client.emit(sid, { type: 'historical_complete' })
        return handle
    }
    const shown = () => [...dc.data.onchart, ...dc.data.offchart]
        .map(o => o.settings.corkyInstance).sort()

    it('built carries BOTH instances: same corkyKind, distinct corkyInstance, shared layer id', async () => {
        const handle = await primed()
        const ovs = [...handle.built.onchart, ...handle.built.offchart]
            .filter(o => o.settings.corkyLayerId === 'scmr_levels')
        expect(ovs).toHaveLength(2)
        expect(ovs.every(o => o.settings.corkyKind === 'SCMR')).toBe(true)
        expect(ovs.map(o => o.settings.corkyInstance).sort()).toEqual(['SCMR', 'SCMR(INV)'])
    })

    it('enabling SCMR adds ONLY SCMR overlays, not SCMR(INV) (load-time double-render)', async () => {
        const handle = await primed()
        feed.setIndicatorEnabled(handle, 'SCMR', true, 'SCMR')
        expect(shown()).toEqual(['SCMR'])
    })

    it('disabling SCMR(INV) leaves SCMR shown (cross-disable)', async () => {
        const handle = await primed()
        feed.setIndicatorEnabled(handle, 'SCMR', true, 'SCMR')
        feed.setIndicatorEnabled(handle, 'SCMR', true, 'SCMR(INV)')
        expect(shown()).toEqual(['SCMR', 'SCMR(INV)'])
        feed.setIndicatorEnabled(handle, 'SCMR', false, 'SCMR(INV)')
        expect(shown()).toEqual(['SCMR'])
    })
})

// ── live SCMR candle_color + reversal markers must apply on live ticks ──────
// The gateway now ships SCMR in live_update rows (candle_type_color + reversal_type);
// applyLiveUpdate must re-stamp the candle colour AND extend the reversal-marker
// overlay in place, exactly as a history reload would. Mirrors the real SCMR
// descriptor (palette candle_color + scmr_reversal_symbols marker).
describe('CorkyFeed — SCMR candle_color + reversal markers on LIVE ticks', () => {
    const scmrView = () => ({ kind: 'scmr', view: { version: 1, layers: [
        { id: 'scmr_candle_color', label: 'C', kind: 'candle_color', target: { surface: 'price' },
          fields: ['candle_type_color'],
          style: { color_field: 'candle_type_color', label_field: 'candle_type_name',
                   color_0: '#9FB4B4', color_5: '#0066FF', color_11: '#FF0000' },
          visible_by_default: true },
        { id: 'scmr_reversal_markers', label: 'M', kind: 'marker', target: { surface: 'price' },
          fields: ['reversal_type', 'reversal_type_name'],
          style: { marker_rule: 'scmr_reversal_symbols', value_field: 'reversal_type',
                   label_field: 'reversal_type_name', hide_zero: 'true',
                   above_anchor: 'candle_high', below_anchor: 'candle_low',
                   symbol_1: 'o', color_1: '#00FFFF', placement_1: 'below_candle',
                   symbol_2: 'x', color_2: '#FF0000', placement_2: 'above_candle' },
          visible_by_default: true },
    ] } })
    const scmrRow = (ts, color, rev) => ({
        timeframe: '1m',
        candle: { timestamp_ms: ts, open: '10', high: '12', low: '9', close: '11', volume: '1' },
        indicators: { SCMR: { candle_type_color: String(color), reversal_type: String(rev),
                              reversal_type_name: String(rev) } },
    })
    it('a live tick re-stamps the candle colour AND adds the reversal marker', async () => {
        const handle = await feed.subscribe({
            venue: 'BITFINEX', symbol: 'tBTCUSD', timeframe: '1m', views: { SCMR: scmrView() },
        })
        const sid = handle.subscription_id
        client.emit(sid, chunkEvent(sid, [scmrRow(1, 5, 0), scmrRow(2, 5, 1)]))
        client.emit(sid, { type: 'historical_complete' })
        feed.setIndicatorEnabled(handle, 'SCMR', true, 'SCMR')

        // history: candle 2 painted blue (#0066FF), marker 'o' at ts 2 (rev 1, below low 9)
        const candles = dc.data.chart.data
        expect(candles.find(c => c[0] === 2)[6]).toBe('#0066FF')
        const mk = [...dc.data.onchart].find(o => o.settings.corkyMarkerRule)
        expect(mk).toBeTruthy()
        expect(mk.data.find(d => d[0] === 2)).toEqual([2, 9, '1', 'o', '#00FFFF', 'below'])

        // LIVE new candle ts 3: color 5 (blue), rev 1 → must colour + add marker live
        client.emit(sid, liveEvent(sid, 1, scmrRow(3, 5, 1)))
        const c3 = dc.data.chart.data.find(c => c[0] === 3)
        expect(c3[6]).toBe('#0066FF')                                   // live candle coloured
        expect(mk.data.find(d => d[0] === 3)).toEqual([3, 9, '1', 'o', '#00FFFF', 'below']) // live marker

        // LIVE candle 3 flips to color 11 (red), rev 0 → recolour, marker removed
        client.emit(sid, liveEvent(sid, 2, scmrRow(3, 11, 0)))
        expect(dc.data.chart.data.find(c => c[0] === 3)[6]).toBe('#FF0000')
        expect(mk.data.find(d => d[0] === 3)).toBeUndefined()
    })

    it('a LATE confirmed row settles the EARLIER bar it belongs to (after the candle advanced)', async () => {
        // Mirrors the gateway's settlement model: SCMR is provisional on the
        // forming bar (status=forming) and a status=confirmed row is pushed LATER —
        // often after the next bar has started. The confirmed row carries an OLDER
        // ts; applyLiveUpdate must settle THAT bar, not the current one.
        const handle = await feed.subscribe({
            venue: 'BITFINEX', symbol: 'tBTCUSD', timeframe: '1m', views: { SCMR: scmrView() },
        })
        const sid = handle.subscription_id
        client.emit(sid, chunkEvent(sid, [scmrRow(1, 5, 0)]))
        client.emit(sid, { type: 'historical_complete' })
        feed.setIndicatorEnabled(handle, 'SCMR', true, 'SCMR')
        const mk = [...dc.data.onchart].find(o => o.settings.corkyMarkerRule)

        // bar 2 forms (provisional, no reversal), then bar 3 forms → candle advanced
        client.emit(sid, liveEvent(sid, 1, scmrRow(2, 0, 0)))
        client.emit(sid, liveEvent(sid, 2, scmrRow(3, 0, 0)))
        expect(dc.data.chart.data.map(c => c[0])).toEqual([1, 2, 3])
        expect(mk.data.find(d => d[0] === 2)).toBeUndefined() // no marker yet (rev 0)

        // LATE confirmed row for bar 2 (settled blue + reversal 1) lands while bar 3 is current
        client.emit(sid, liveEvent(sid, 3, scmrRow(2, 5, 1)))
        expect(dc.data.chart.data.find(c => c[0] === 2)[6]).toBe('#0066FF')                 // bar 2 settled colour
        expect(mk.data.find(d => d[0] === 2)).toEqual([2, 9, '1', 'o', '#00FFFF', 'below'])  // bar 2 marker added
        expect(dc.data.chart.data.find(c => c[0] === 3)[6]).toBe('#9FB4B4')                 // bar 3 (latest) untouched
    })
})

describe('CorkyFeed.unsubscribe / destroy', () => {
    it('stops routing and sends unsubscribe; destroy closes the client', async () => {
        const handle = await feed.subscribe({
            venue: 'BITFINEX', symbol: 'tBTCUSD', timeframe: '1m',
        })
        client.emit(handle.subscription_id, fx.historicalChunkEvent.event)
        client.emit(handle.subscription_id, { type: 'historical_complete' })

        await feed.unsubscribe(handle)
        expect(client.sent.some(c => c.type === 'unsubscribe'
            && c.subscription_id === handle.subscription_id)).toBe(true)

        // After unsubscribe, further live events are no longer routed.
        client.emit(handle.subscription_id, fx.liveUpdateEvent.event)
        expect(dc.data.chart.data).toHaveLength(1) // unchanged

        feed.destroy()
        expect(client.closed).toBe(true)
    })
})

describe('CorkyFeed.subscribe timeout / failure cleanup', () => {
    it('rejects with subscribe_timeout and cleans up when the gateway never completes', async () => {
        // A client whose subscribeCandles never settles (silent gateway/runtime hang).
        const hangClient = {
            _subs: new Map(),
            async listCandleStates() { return [] },
            subscribeCandles() { return new Promise(() => {}) }, // never resolves
            async unsubscribe() {},
            close() {},
            onSubscription(id, cb) {
                let s = this._subs.get(id); if (!s) { s = new Set(); this._subs.set(id, s) }
                s.add(cb); return () => s.delete(cb)
            },
        }
        const dc2 = new DataCube({ chart: { type: 'Candles', data: [] }, onchart: [], offchart: [] })
        const feed2 = new CorkyFeed({ client: hangClient, dataCube: dc2, subscribeTimeoutMs: 40 })

        await expect(
            feed2.subscribe({ venue: 'BITFINEX', symbol: 'tBTCUSD', timeframe: '1m' })
        ).rejects.toMatchObject({ code: 'subscribe_timeout', retryable: true })

        // No leaked subscription handle / fan-out listener after the timeout.
        expect(feed2._subs.size).toBe(0)
        const onlySub = [...hangClient._subs.values()][0]
        expect(onlySub ? onlySub.size : 0).toBe(0) // fan-out listener detached
    })
})

// Regressions for the post-review fixes (substring-del blocker + re-select leak).
describe('CorkyFeed — toggle correctness regressions', () => {
    it('disabling a kind removes ONLY its overlays, even past id index 9 (no substring del)', async () => {
        // BIG: 11 outputs → 11 overlays of one overlay type (ids …Type0..Type10);
        // KEEP: 1 overlay of the SAME type, enabled LAST → highest index (…Type11).
        // The old dc.del(ov.id) substring-matched, so deleting …Type1 also nuked
        // …Type11 (KEEP). Splice-by-identity must remove only BIG's overlays.
        const handle = await feed.subscribe({ venue: 'X', symbol: 'Y', timeframe: '1D' })
        const sid = handle.subscription_id
        const big = {}
        for (let i = 0; i < 11; i++) big['o' + i] = String(i)
        const row = {
            timeframe: '1D',
            candle: { timestamp_ms: 1, open: '1', high: '1', low: '1', close: '1', volume: '1' },
            indicators: { BIG: big, KEEP: { v: '42' } },
        }
        client.emit(sid, chunkEvent(sid, [row]))
        client.emit(sid, { type: 'historical_complete' })

        feed.setIndicatorEnabled(handle, 'BIG', true)   // 11 overlays
        feed.setIndicatorEnabled(handle, 'KEEP', true)  // 1 overlay (highest index)
        expect(dc.data.onchart.length + dc.data.offchart.length).toBe(12)

        feed.setIndicatorEnabled(handle, 'BIG', false)  // must remove only BIG's 11
        const left = [...dc.data.onchart, ...dc.data.offchart]
        expect(left).toHaveLength(1)
        expect(left[0].settings.corkyKind).toBe('KEEP')
    })

    it('re-selecting a new timeframe resets to candles-only (no orphaned overlays)', async () => {
        const h1 = await feed.subscribe({ venue: 'BITFINEX', symbol: 'tBTCUSD', timeframe: '1D' })
        client.emit(h1.subscription_id, chunkEvent(h1.subscription_id,
            [makeRow(1, 100, { macd: 1, signal: 1, sma: 1 })]))
        client.emit(h1.subscription_id, { type: 'historical_complete' })
        feed.setIndicatorEnabled(h1, 'MACD', true)
        expect(dc.data.onchart.length + dc.data.offchart.length).toBeGreaterThan(0)
        await feed.unsubscribe(h1)

        // New subscription (a different timeframe) → candles only, no stale overlays.
        const h2 = await feed.subscribe({ venue: 'BITFINEX', symbol: 'tBTCUSD', timeframe: '1D' })
        client.emit(h2.subscription_id, chunkEvent(h2.subscription_id,
            [makeRow(5, 200, { macd: 2, signal: 2, sma: 2 })]))
        client.emit(h2.subscription_id, { type: 'historical_complete' })
        expect(dc.data.onchart).toHaveLength(0)
        expect(dc.data.offchart).toHaveLength(0)
    })
})

// Regression: detached volume must not vanish when the gateway re-selects a tf.
describe('CorkyFeed — volume detach state on re-select', () => {
    it('restores candle-pane volume (showVolume=true) on a new history load', async () => {
        const h1 = await feed.subscribe({ venue: 'X', symbol: 'Y', timeframe: '1D' })
        client.emit(h1.subscription_id, chunkEvent(h1.subscription_id,
            [makeRow(1, 100, { macd: 1, signal: 1, sma: 1 })]))
        client.emit(h1.subscription_id, { type: 'historical_complete' })
        // Simulate the user having DETACHED volume (candle-pane copy hidden).
        dc.data.chart.settings = { showVolume: false }
        await feed.unsubscribe(h1)

        const h2 = await feed.subscribe({ venue: 'X', symbol: 'Y', timeframe: '1m' })
        client.emit(h2.subscription_id, chunkEvent(h2.subscription_id,
            [makeRow(5, 200, { macd: 2, signal: 2, sma: 2 })]))
        client.emit(h2.subscription_id, { type: 'historical_complete' })
        // The offchart Volume pane was wiped by the baseline reset; volume must
        // be restored to the candle pane instead of vanishing entirely.
        expect(dc.data.chart.settings.showVolume).toBe(true)
    })
})
