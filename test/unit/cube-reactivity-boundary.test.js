// vr-3 Strategy B — DataCube reactivity boundary.
//
// Pins the markRaw migration: the LARGE inner ROW arrays (the OHLCV tuple array
// chart.data + every overlay .data/.raw) are NON-reactive (markRaw), killing
// ~6N row proxies + per-row get-traps, while EVERYTHING that drives Vue
// structure/watcher reactivity stays reactive (the cube root dc.data, the
// onchart/offchart CONTAINER arrays, the chart object, and all settings).
//
// Two ingestion paths are checked:
//   1. The bootstrap path — `new DataCube({chart, onchart, offchart})` reached
//      through a reactive() parent (what Vue does when dc.data is a prop).
//   2. The live corky-feed path — subscribe → history → enable → live tick,
//      which exercises buildChartData + applyLiveUpdate's in-place upserts.
//
// markRaw is honoured THROUGH a reactive parent: a reactive overlay object can
// hold a markRaw'd .data and Vue will not re-proxy it — that is exactly the
// invariant this test locks down (redraw stays revision-driven, not deep).

import { describe, it, expect, beforeEach } from 'vitest'
import { reactive, isReactive } from 'vue'
import DataCube from '../../src/helpers/datacube.js'
import { CorkyFeed } from '../../src/helpers/feed/corky-feed.js'
import * as fx from '../fixtures/corky/index.js'

describe('vr-3 cube reactivity boundary — bootstrap (new DataCube(...))', () => {
    it('row arrays are raw; cube root + containers + settings stay reactive', () => {
        const data = {
            chart: { type: 'Candles', data: [[1, 10, 12, 9, 11, 100], [2, 11, 13, 10, 12, 120]] },
            onchart: [
                { name: 'SMA', type: 'Spline', data: [[1, 10.5], [2, 11.5]], raw: [[1, '10.5'], [2, '11.5']], settings: { color: '#f00' } },
            ],
            offchart: [
                { name: 'VOL', type: 'Histogram', data: [[1, 100], [2, 120]], raw: [[1, '100'], [2, '120']], settings: { color: '#0f0' } },
            ],
        }

        // init_data runs the bootstrap normalization (markRaw the row arrays). It
        // does not touch this.tv, so it is safe to call standalone.
        const dc = new DataCube(data)
        dc.init_data()

        // Simulate Vue taking ownership of dc.data as a reactive prop. markRaw'd
        // row arrays must survive being reached through a reactive parent.
        const r = reactive(dc.data)

        // ── inner ROW arrays: NON-reactive ──
        expect(isReactive(r.chart.data)).toBe(false)
        for (const ov of r.onchart) {
            expect(isReactive(ov.data)).toBe(false)
            expect(isReactive(ov.raw)).toBe(false)
        }
        for (const ov of r.offchart) {
            expect(isReactive(ov.data)).toBe(false)
            expect(isReactive(ov.raw)).toBe(false)
        }

        // ── structure-driving objects: REACTIVE (boundary line — must NOT break) ──
        expect(isReactive(r)).toBe(true)                 // cube root (dc.data)
        expect(isReactive(r.onchart)).toBe(true)         // CONTAINER array
        expect(isReactive(r.offchart)).toBe(true)        // CONTAINER array
        expect(isReactive(r.chart)).toBe(true)           // chart OBJECT
        expect(isReactive(r.chart.settings)).toBe(true)  // settings object
        expect(isReactive(r.onchart[0])).toBe(true)      // overlay OBJECT
        expect(isReactive(r.onchart[0].settings)).toBe(true)
        expect(isReactive(r.offchart[0].settings)).toBe(true)
    })

    it('a fresh row array set() into the cube is wrapped (no re-proxy on later push)', () => {
        const dc = new DataCube({ chart: { type: 'Candles', data: [] }, onchart: [], offchart: [] })
        dc.init_data()
        const r = reactive(dc.data)
        // set replaces the slot by reference; the boundary requires it lands raw.
        dc.cd.set('chart.data', [[1, 10, 12, 9, 11, 100]])
        expect(isReactive(r.chart.data)).toBe(false)
    })
})

describe('vr-3 cube reactivity boundary — live corky-feed ingest', () => {
    class FakeClient {
        constructor() {
            this.sent = []
            this._subListeners = new Map()
            this._states = fx.candleStatesEvent.event.states
        }
        async listCandleStates(venue) { this.sent.push({ type: 'list_candle_states', venue }); return this._states }
        async subscribeCandles(opts) { this.sent.push({ type: 'subscribe_candles', ...opts }); this._lastSubId = opts.subscription_id; return { type: 'historical_complete' } }
        async unsubscribe(subscription_id) { this.sent.push({ type: 'unsubscribe', subscription_id }); return { type: 'control_ack' } }
        onSubscription(subscription_id, cb) {
            let set = this._subListeners.get(subscription_id)
            if (!set) { set = new Set(); this._subListeners.set(subscription_id, set) }
            set.add(cb)
            return () => set.delete(cb)
        }
        close() {}
        emit(subscription_id, event) {
            const set = this._subListeners.get(subscription_id)
            if (!set) return
            const payload = { request_id: null, event: { ...event, subscription_id } }
            for (const cb of [...set]) cb(payload)
        }
    }

    let client, dc, feed
    beforeEach(() => {
        client = new FakeClient()
        // Empty cube reached through reactive() (mirrors Chart.vue's prop).
        dc = new DataCube({ chart: { type: 'Candles', data: [] }, onchart: [], offchart: [] })
        dc.init_data()
        feed = new CorkyFeed({ client, dataCube: dc })
    })

    it('history + enabled overlay + live tick keep row arrays raw, structure reactive', async () => {
        const r = reactive(dc.data)

        const handle = await feed.subscribe({ venue: 'BITFINEX', symbol: 'tBTCUSD', timeframe: '1m' })
        const sid = handle.subscription_id
        client.emit(sid, fx.historicalChunkEvent.event)
        client.emit(sid, { type: 'historical_complete' })

        // Enable the SMA indicator → its overlay (built by buildChartData, .data/
        // .raw markRaw'd at creation) is added to the reactive onchart container.
        feed.setIndicatorEnabled(handle, 'sma', true)
        expect(r.onchart.length).toBe(1)

        // One live tick → applyLiveUpdate upserts the candle + overlay rows in
        // place and the feed signals a redraw (revision-driven, not deep).
        client.emit(sid, fx.liveUpdateEvent.event)
        expect(r.chart.data.length).toBe(2) // appended, not replaced

        // ── inner ROW arrays after live ingest: still NON-reactive ──
        expect(isReactive(r.chart.data)).toBe(false)
        const allOverlays = [...r.onchart, ...r.offchart]
        expect(allOverlays.length).toBeGreaterThan(0)
        for (const ov of allOverlays) {
            expect(isReactive(ov.data)).toBe(false)
            if (ov.raw) expect(isReactive(ov.raw)).toBe(false)
        }

        // ── structure stays reactive (overlay add/del + settings flips depend on it) ──
        expect(isReactive(r)).toBe(true)
        expect(isReactive(r.onchart)).toBe(true)
        expect(isReactive(r.offchart)).toBe(true)
        expect(isReactive(r.chart)).toBe(true)
        for (const ov of allOverlays) {
            expect(isReactive(ov)).toBe(true)          // overlay OBJECT
            expect(isReactive(ov.settings)).toBe(true) // settings object
        }
    })
})
