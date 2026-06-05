// @vitest-environment jsdom
//
// Unit tests for useChartFeed — the Vue composable that drives a FeedSource.
//
// Driven with a FAKE FeedSource (stubbed discover/subscribe/unsubscribe/destroy)
// inside an `effectScope` so onScopeDispose fires deterministically on
// scope.stop(). Asserts:
//   • discover() populates `states` (and toggles loading)
//   • select() unsubscribes the PRIOR handle + subscribes the NEW one
//   • status (history-complete) clears loading; error surfaces via onError
//   • scope dispose unsubscribes the active stream + destroys the source

import { describe, it, expect, beforeEach } from 'vitest'
import { effectScope } from 'vue'
import { useChartFeed } from '../../src/composables/useChartFeed.js'
import * as fx from '../fixtures/corky/index.js'

// ── FakeFeed ──────────────────────────────────────────────────────────────--
// Implements the FeedSource contract and records every call. subscribe() mints
// a unique handle and stashes the handlers so a test can drive onStatus/onError.
class FakeFeed {
    constructor() {
        this.calls = []                       // ordered call log
        this.unsubscribed = []                // handles passed to unsubscribe
        this.destroyed = false
        this._subCounter = 0
        this._states = fx.candleStatesEvent.event.states
        this.lastHandlers = null              // handlers from the latest subscribe
    }

    async discover(venue) {
        this.calls.push({ m: 'discover', venue })
        return this._states
    }

    async subscribe(opts, handlers) {
        this._subCounter += 1
        const handle = { subscription_id: `fake-sub-${this._subCounter}`, opts }
        this.lastHandlers = handlers
        this.calls.push({ m: 'subscribe', opts, handle })
        return handle
    }

    async unsubscribe(handle) {
        this.unsubscribed.push(handle)
        this.calls.push({ m: 'unsubscribe', handle })
    }

    destroy() {
        this.destroyed = true
        this.calls.push({ m: 'destroy' })
    }
}

describe('useChartFeed', () => {
    let feed
    let scope
    let api

    beforeEach(() => {
        feed = new FakeFeed()
        scope = effectScope()
        api = scope.run(() => useChartFeed(feed))
    })

    it('discover() populates states and toggles loading', async () => {
        expect(api.states.value).toEqual([])
        expect(api.loading.value).toBe(false)

        const p = api.discover('BITFINEX')
        expect(api.loading.value).toBe(true)   // in flight

        const list = await p
        expect(api.loading.value).toBe(false)  // settled
        expect(list).toBe(api.states.value)
        expect(api.states.value).toEqual(feed._states)
        expect(api.states.value.length).toBeGreaterThan(0)
        expect(feed.calls[0]).toMatchObject({ m: 'discover', venue: 'BITFINEX' })
    })

    it('select() subscribes and sets current + handle', async () => {
        const opts = { venue: 'BITFINEX', symbol: 'tBTCUSD', timeframe: '1m' }
        const handle = await api.select(opts)

        expect(handle).toMatchObject({ subscription_id: 'fake-sub-1' })
        expect(api.current.value).toMatchObject(opts)
        expect(feed.calls.some(c => c.m === 'subscribe')).toBe(true)
        // No prior subscription → nothing unsubscribed yet.
        expect(feed.unsubscribed.length).toBe(0)
    })

    it('select() unsubscribes the prior stream before subscribing the new one', async () => {
        const first = await api.select({ venue: 'V', symbol: 'A', timeframe: '1m' })
        await api.select({ venue: 'V', symbol: 'B', timeframe: '5m' })

        // The first handle was unsubscribed.
        expect(feed.unsubscribed).toContainEqual(first)
        // Order: subscribe(A) → unsubscribe(A) → subscribe(B).
        const seq = feed.calls.map(c => c.m)
        const subIdx = seq.indexOf('subscribe')
        const unsubIdx = seq.indexOf('unsubscribe')
        const lastSubIdx = seq.lastIndexOf('subscribe')
        expect(subIdx).toBeLessThan(unsubIdx)
        expect(unsubIdx).toBeLessThan(lastSubIdx)
        expect(api.current.value).toMatchObject({ symbol: 'B', timeframe: '5m' })
    })

    it('onStatus history-complete clears loading; onStatus updates progress', async () => {
        const p = api.select({ venue: 'V', symbol: 'A', timeframe: '1m' })
        await p
        // subscribe resolved → loading already false in finally, but drive status too.
        feed.lastHandlers.onStatus({ phase: 'history', chunk_index: 0 })
        expect(api.progress.value).toMatchObject({ phase: 'history', chunk_index: 0 })

        api.loading.value = true
        feed.lastHandlers.onStatus({ phase: 'history-complete' })
        expect(api.loading.value).toBe(false)
        expect(api.progress.value).toMatchObject({ phase: 'history-complete' })
    })

    it('onError surfaces via error ref', async () => {
        await api.select({ venue: 'V', symbol: 'A', timeframe: '1m' })
        expect(api.error.value).toBe(null)

        const boom = fx.errorEvent.event
        feed.lastHandlers.onError(boom)
        // `error` is a shallowRef → the exact object is preserved (identity).
        expect(api.error.value).toBe(boom)
    })

    it('select() rejection surfaces the error and resets current', async () => {
        feed.subscribe = async () => { throw new Error('refused') }
        await expect(api.select({ venue: 'V', symbol: 'X', timeframe: '1m' }))
            .rejects.toThrow('refused')
        expect(api.error.value).toBeInstanceOf(Error)
        expect(api.current.value).toBe(null)
        expect(api.loading.value).toBe(false)
    })

    it('clear() unsubscribes the active stream and resets state', async () => {
        const h = await api.select({ venue: 'V', symbol: 'A', timeframe: '1m' })
        await api.clear()
        expect(feed.unsubscribed).toContainEqual(h)
        expect(api.current.value).toBe(null)
        expect(api.progress.value).toBe(null)
    })

    it('scope dispose unsubscribes the active stream and destroys the source', async () => {
        const h = await api.select({ venue: 'V', symbol: 'A', timeframe: '1m' })
        expect(feed.destroyed).toBe(false)

        scope.stop()

        expect(feed.destroyed).toBe(true)
        expect(feed.unsubscribed).toContainEqual(h)
    })

    it('accepts a factory and owns its lifetime', () => {
        const made = new FakeFeed()
        const s2 = effectScope()
        s2.run(() => useChartFeed(() => made))
        s2.stop()
        expect(made.destroyed).toBe(true)
    })

    it('throws if given a non-FeedSource', () => {
        expect(() => useChartFeed({})).toThrow(/FeedSource/)
    })
})
