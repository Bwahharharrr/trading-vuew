// Unit tests for the FeedSource base class + asFeedSource duck-type guard.
//
// FeedSource is the chart-feed abstraction: a tiny abstract base whose
// discover/subscribe/unsubscribe throw `not implemented` until overridden, with
// a no-op destroy() default. asFeedSource() lightly enforces the same contract
// on plain (non-`extends`) objects. Pure-node, no DOM.

import { describe, it, expect } from 'vitest'
import { FeedSource, asFeedSource } from '../../src/helpers/feed/feed-source.js'
import FeedSourceDefault from '../../src/helpers/feed/feed-source.js'

describe('FeedSource abstract contract', () => {
    it('discover/subscribe/unsubscribe reject with named "not implemented" errors', async () => {
        const fs = new FeedSource()
        await expect(fs.discover())
            .rejects.toThrow(/FeedSource\.discover: not implemented/)
        await expect(fs.subscribe({}, {}))
            .rejects.toThrow(/subscribe: not implemented/)
        await expect(fs.unsubscribe('h'))
            .rejects.toThrow(/unsubscribe: not implemented/)
    })

    it('destroy() is a no-op: returns undefined and does not throw', () => {
        const fs = new FeedSource()
        let result
        expect(() => { result = fs.destroy() }).not.toThrow()
        expect(result).toBeUndefined()
    })

    it('a subclass overriding the abstract methods does NOT throw (override wins)', async () => {
        class ConcreteFeed extends FeedSource {
            async discover() { return ['state-A'] }
            async subscribe(opts) { return { handle: opts.symbol } }
            async unsubscribe(handle) { return handle }
        }
        const feed = new ConcreteFeed()
        await expect(feed.discover()).resolves.toEqual(['state-A'])
        await expect(feed.subscribe({ symbol: 'BTC' }, {}))
            .resolves.toEqual({ handle: 'BTC' })
        await expect(feed.unsubscribe('h1')).resolves.toBe('h1')
        // inherited no-op destroy still works
        expect(feed.destroy()).toBeUndefined()
    })

    it('default export is the FeedSource class', () => {
        expect(FeedSourceDefault).toBe(FeedSource)
    })
})

describe('asFeedSource duck-type guard', () => {
    function makeValidFeed() {
        return {
            discover() { return [] },
            subscribe() { return {} },
            unsubscribe() {},
        }
    }

    it('returns the SAME object unchanged when all 3 required methods exist', () => {
        const feed = makeValidFeed()
        const returned = asFeedSource(feed)
        expect(returned).toBe(feed)
        // required methods untouched
        expect(returned.discover).toBe(feed.discover)
        expect(returned.subscribe).toBe(feed.subscribe)
        expect(returned.unsubscribe).toBe(feed.unsubscribe)
    })

    it('throws naming the missing method (discover/subscribe/unsubscribe)', () => {
        const noDiscover = makeValidFeed(); delete noDiscover.discover
        expect(() => asFeedSource(noDiscover))
            .toThrow(/missing required method 'discover'/)

        const noSubscribe = makeValidFeed(); delete noSubscribe.subscribe
        expect(() => asFeedSource(noSubscribe))
            .toThrow(/missing required method 'subscribe'/)

        const noUnsubscribe = makeValidFeed(); delete noUnsubscribe.unsubscribe
        expect(() => asFeedSource(noUnsubscribe))
            .toThrow(/missing required method 'unsubscribe'/)
    })

    it('throws when a required method is present but not a function', () => {
        const feed = makeValidFeed()
        feed.discover = 42
        expect(() => asFeedSource(feed))
            .toThrow(/missing required method 'discover'/)
    })

    it('back-fills a no-op destroy when none is provided', () => {
        const feed = makeValidFeed()
        expect(feed.destroy).toBeUndefined()
        const returned = asFeedSource(feed)
        expect(typeof returned.destroy).toBe('function')
        // back-filled destroy is a no-op
        let result
        expect(() => { result = returned.destroy() }).not.toThrow()
        expect(result).toBeUndefined()
    })

    it('preserves an existing destroy (does not overwrite a provided fn)', () => {
        const feed = makeValidFeed()
        const provided = () => 'torn-down'
        feed.destroy = provided
        const returned = asFeedSource(feed)
        expect(returned.destroy).toBe(provided)
        expect(returned.destroy()).toBe('torn-down')
    })
})
