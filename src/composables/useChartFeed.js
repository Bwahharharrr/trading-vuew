// useChartFeed — a Vue 3 composable that drives a FeedSource for the UI.
//
//   const feed = new CorkyFeed({ client, dataCube })
//   const { states, loading, error, current, progress,
//           discover, select, clear } = useChartFeed(feed)
//
//   await discover()                       // populate `states` from the catalog
//   await select({ venue, symbol, timeframe, indicators })
//
// It is SOURCE-AGNOSTIC: it talks only to the FeedSource contract (discover /
// subscribe / unsubscribe / destroy), so CorkyFeed today and FileFeed later
// drop in unchanged. The source may be passed directly OR as a 0-arg factory
// (so the composable owns the source's lifetime and tears it down on dispose).
//
// Reactive surface mirrors the house style of useChart.js — plain refs the UI
// renders, plus null-safe imperative actions. Selecting a new stream first
// unsubscribes any previous one (single active subscription), wires the feed's
// onStatus → progress/loading and onError → error, and updates `current`.

import { ref, shallowRef, onScopeDispose } from 'vue'

// Resolve the input to a concrete FeedSource: accept an instance, or call a
// 0-arg factory to mint one. (A factory lets the composable own teardown.)
function resolveSource(sourceOrFactory) {
    if (typeof sourceOrFactory === 'function') return sourceOrFactory()
    return sourceOrFactory
}

/**
 * Drive a FeedSource (CorkyFeed / FileFeed) from a Vue component.
 *
 * @param {object|(() => object)} sourceOrFactory - a FeedSource instance, or a
 *   0-arg factory returning one. A factory hands lifetime ownership (destroy on
 *   scope dispose) to the composable.
 * @returns {{
 *   states: import('vue').Ref<any[]>,
 *   loading: import('vue').Ref<boolean>,
 *   error: import('vue').Ref<any|null>,
 *   current: import('vue').Ref<object|null>,
 *   progress: import('vue').Ref<any|null>,
 *   discover: () => Promise<any[]>,
 *   select: (opts: object) => Promise<any>,
 *   clear: () => Promise<void>,
 *   source: object,
 * }}
 */
export function useChartFeed(sourceOrFactory) {
    const source = resolveSource(sourceOrFactory)
    if (!source || typeof source.subscribe !== 'function') {
        throw new Error('useChartFeed: a FeedSource (or factory) is required')
    }

    // ── reactive state ───────────────────────────────────────────────────────
    const states = shallowRef([])   // discovered catalog (State[]) — opaque rows
    const loading = ref(false)      // a select() is in flight / streaming history
    const error = shallowRef(null)  // last surfaced error (cleared on a new select)
    const current = ref(null)       // active { venue, symbol, timeframe, indicators }
    const progress = shallowRef(null) // last historical_progress / status snapshot

    // The active subscription handle (shallow — opaque, not reactive content).
    const handle = shallowRef(null)

    // ── actions ────────────────────────────────────────────────────────────--

    /** Discover the catalog → populates `states`. */
    async function discover(...args) {
        loading.value = true
        error.value = null
        try {
            const list = await source.discover(...args)
            states.value = Array.isArray(list) ? list : (list ? [list] : [])
            return states.value
        } catch (err) {
            error.value = err
            throw err
        } finally {
            loading.value = false
        }
    }

    /**
     * Select a stream: unsubscribe the previous one, subscribe the new one, and
     * wire status/error back into the reactive state. Resolves with the handle.
     * @param {{ venue: string, symbol: string, timeframe: string, indicators?: string[], range?: any }} opts
     */
    async function select(opts = {}) {
        // Drop any prior subscription first (single active stream invariant).
        await clear()

        loading.value = true
        error.value = null
        progress.value = null
        current.value = {
            venue: opts.venue,
            symbol: opts.symbol,
            timeframe: opts.timeframe,
            indicators: opts.indicators,
        }

        try {
            const h = await source.subscribe(opts, {
                onStatus: (status) => {
                    progress.value = status
                    // History finished streaming → no longer loading.
                    if (status && (status.phase === 'history-complete' ||
                                   status.phase === 'live')) {
                        loading.value = false
                    }
                },
                onError: (err) => { error.value = err },
            })
            handle.value = h
            return h
        } catch (err) {
            error.value = err
            current.value = null
            throw err
        } finally {
            loading.value = false
        }
    }

    /** Tear down the active subscription (if any) and reset selection state. */
    async function clear() {
        const h = handle.value
        handle.value = null
        current.value = null
        progress.value = null
        // Swallow teardown failures: dropping a stream we're replacing is
        // non-actionable, and a rejection here must not abort the new select().
        if (h != null) await Promise.resolve(source.unsubscribe(h)).catch(() => {})
    }

    // ── lifecycle ──────────────────────────────────────────────────────────--
    // On scope teardown: unsubscribe the active stream and destroy the source.
    onScopeDispose(() => {
        const h = handle.value
        handle.value = null
        if (h != null) {
            // Fire-and-forget; we're tearing the scope down. unsubscribe is
            // async — attach a no-op catch so its rejection (e.g. the socket
            // closing under it) doesn't surface as an unhandled rejection.
            Promise.resolve(source.unsubscribe(h)).catch(() => {})
        }
        if (typeof source.destroy === 'function') source.destroy()
    })

    return {
        // state
        states, loading, error, current, progress,
        // actions
        discover, select, clear,
        // escape hatch
        source,
    }
}

export default useChartFeed
