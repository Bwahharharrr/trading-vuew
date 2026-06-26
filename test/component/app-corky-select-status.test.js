// @vitest-environment jsdom
//
// App.corkySelect onStatus/onError handler wiring. corkySelect awaits
// _corkyUnsub() then corkyFeed.subscribe(opts, {onStatus,onError}); we capture
// those callbacks from a FAKE corkyFeed and invoke them directly to exercise:
//   • history-complete range refit (discovery latest vs nav-window vs plot-window)
//   • _corkyPendingRange consume-once semantics
//   • overlay re-apply (price-alarm / position / signal-marker) on history-complete
//   • search-nav status messaging + loading/error transitions
//   • the superseded-generation guard (a newer _corkyGen freezes the handlers)
//   • _navStatusLabel phase mapping
// Exercised against App.methods bound to a lightweight fake `this` — the same
// technique as position-plot-select.test.js / search-signal-marker.test.js
// (no full mount).
import { test, expect, describe, beforeEach, vi } from 'vitest'
import App from '../../src/App.vue'

const M = App.methods

function mkCtx() {
    const ctx = {
        corkyStates: [{ venue: 'BITFINEX', symbol: 'tBTCUSD', available_timeframes: ['1h'], indicators: [] }],
        corkyCurrent: null,
        corkyEnabled: {},
        corkyLoading: false,
        corkyError: null,
        corkyProgress: null,
        corkyHandle: null,
        corkyLast: null,
        searchNav: null,
        positionPlot: null,
        priceAlarms: [],
        _corkyPendingRange: null,
        _corkyGen: 0,
        _corkyRetryKeepSpinner: false,
        chart: { data: { onchart: [], offchart: [] } },
        corkyClient: {},   // corkySelect guards on the client being up
        // A fake feed whose subscribe captures the status/error callbacks so the
        // test can drive them. Returns a non-null handle so corkySelect commits.
        corkyFeed: {
            unsubscribe: vi.fn(),
            subscribe: vi.fn(async (opts, cbs) => {
                ctx._captured = cbs
                return { id: 'handle-1' }
            }),
        },
        // nextTick runs synchronously so the history-complete refit body executes
        // inline within the handler call (no real microtask/timer scheduling).
        $nextTick: (fn) => { if (fn) fn() },
        $refs: { tradingVue: { setRange: vi.fn(), resetChart: vi.fn() } },
        ensurePriceAlarmOverlay: vi.fn(),
        syncPositionOverlays: vi.fn(),
        syncSignalMarker: vi.fn(),
        syncBarrierOverlay: vi.fn(),
        syncBacktestOverlays: vi.fn(),
        saveStateToStorage: vi.fn(),
    }
    for (const m of ['corkySelect', '_corkyUnsub', '_corkyMem', '_corkyErr',
        '_navStatusLabel', '_corkyScheduleSelectRetry', '_corkyBindActiveCube']) {
        ctx[m] = M[m]
    }
    return ctx
}

// Subscribe, then hand back the captured {onStatus,onError} plus the tv stub.
async function arm(ctx, opts = { venue: 'BITFINEX', symbol: 'tBTCUSD', timeframe: '1h' }) {
    await ctx.corkySelect(opts)
    return { onStatus: ctx._captured.onStatus, onError: ctx._captured.onError, tv: ctx.$refs.tradingVue }
}

let ctx
beforeEach(() => { ctx = mkCtx() })

describe('onStatus history-complete → range refit', () => {
    test('no positionPlot, no pending range → resetChart(true) (discovery latest view)', async () => {
        const { onStatus, tv } = await arm(ctx)
        onStatus({ phase: 'history-complete' })
        expect(tv.resetChart).toHaveBeenCalledWith(true)
        expect(tv.setRange).not.toHaveBeenCalled()
    })

    test('_corkyPendingRange present → setRange(start,end) + resetChart(false), consumed once', async () => {
        ctx._corkyPendingRange = { start: 900, end: 1100 }
        const { onStatus, tv } = await arm(ctx)
        onStatus({ phase: 'history-complete' })
        expect(tv.setRange).toHaveBeenCalledWith(900, 1100)
        expect(tv.resetChart).toHaveBeenLastCalledWith(false)
        expect(ctx._corkyPendingRange).toBeNull()                  // consumed
        // a second history-complete now has no pending range → latest view
        onStatus({ phase: 'history-complete' })
        expect(tv.resetChart).toHaveBeenLastCalledWith(true)
    })

    test('positionPlot.window for the charted symbol → setRange(window)+resetChart(false)', async () => {
        ctx.positionPlot = { symbol: 'tBTCUSD', window: { start: 500, end: 800 } }
        const { onStatus, tv } = await arm(ctx)
        onStatus({ phase: 'history-complete' })
        expect(tv.setRange).toHaveBeenCalledWith(500, 800)
        expect(tv.resetChart).toHaveBeenLastCalledWith(false)
    })

    test('navWindow takes precedence over plotWindow when both are set', async () => {
        ctx.positionPlot = { symbol: 'tBTCUSD', window: { start: 500, end: 800 } }
        ctx._corkyPendingRange = { start: 900, end: 1100 }
        const { onStatus, tv } = await arm(ctx)
        onStatus({ phase: 'history-complete' })
        expect(tv.setRange).toHaveBeenCalledTimes(1)
        expect(tv.setRange).toHaveBeenCalledWith(900, 1100)        // nav, not plot
        expect(tv.resetChart).toHaveBeenLastCalledWith(false)
    })

    test('plotWindow for a DIFFERENT symbol is ignored → latest view', async () => {
        ctx.positionPlot = { symbol: 'tETHUSD', window: { start: 500, end: 800 } }
        const { onStatus, tv } = await arm(ctx)
        onStatus({ phase: 'history-complete' })
        expect(tv.setRange).not.toHaveBeenCalled()
        expect(tv.resetChart).toHaveBeenCalledWith(true)
    })
})

describe('onStatus history-complete → overlay re-apply', () => {
    test('re-runs ensurePriceAlarmOverlay (when alarms present), syncPositionOverlays, syncSignalMarker', async () => {
        ctx.priceAlarms = [{ id: 'a1', side: 'above' }]
        const { onStatus } = await arm(ctx)
        onStatus({ phase: 'history-complete' })
        expect(ctx.ensurePriceAlarmOverlay).toHaveBeenCalledTimes(1)
        expect(ctx.syncPositionOverlays).toHaveBeenCalledTimes(1)
        expect(ctx.syncSignalMarker).toHaveBeenCalledTimes(1)
    })

    test('no alarms → ensurePriceAlarmOverlay is NOT called, but overlay sync still runs', async () => {
        ctx.priceAlarms = []
        const { onStatus } = await arm(ctx)
        onStatus({ phase: 'history-complete' })
        expect(ctx.ensurePriceAlarmOverlay).not.toHaveBeenCalled()
        expect(ctx.syncPositionOverlays).toHaveBeenCalledTimes(1)
        expect(ctx.syncSignalMarker).toHaveBeenCalledTimes(1)
    })
})

describe('onStatus → search-nav messaging + loading flags', () => {
    test('a non-terminal phase while loading sets searchNav.message = _navStatusLabel', async () => {
        ctx.searchNav = { tabId: 'search-1', index: 0, loading: true, message: '' }
        const { onStatus } = await arm(ctx)
        onStatus({ phase: 'history', chunk_index: 2 })
        expect(ctx.searchNav.message).toBe('Loading history… (chunk 3)')
        expect(ctx.searchNav.loading).toBe(true)                   // still loading
    })

    test('history-complete clears searchNav.loading=false + message="" and corkyLoading=false', async () => {
        ctx.searchNav = { tabId: 'search-1', index: 0, loading: true, message: 'Loading history…' }
        ctx.corkyLoading = true
        const { onStatus } = await arm(ctx)
        onStatus({ phase: 'history-complete' })
        expect(ctx.searchNav.loading).toBe(false)
        expect(ctx.searchNav.message).toBe('')
        expect(ctx.corkyLoading).toBe(false)
    })

    test('live phase sets corkyLoading=false and does NOT message the nav', async () => {
        ctx.searchNav = { tabId: 'search-1', index: 0, loading: true, message: 'x' }
        ctx.corkyLoading = true
        const { onStatus } = await arm(ctx)
        onStatus({ phase: 'live' })
        expect(ctx.corkyLoading).toBe(false)
        expect(ctx.searchNav.message).toBe('x')                    // unchanged
        expect(ctx.searchNav.loading).toBe(true)                   // live ≠ history-complete
    })
})

describe('onError', () => {
    test('while loading → searchNav {loading:false,error:true,message} and corkyError mapped', async () => {
        ctx.searchNav = { tabId: 'search-1', index: 0, loading: true, error: false, message: 'x' }
        const { onError } = await arm(ctx)
        onError({ message: 'boom', retryable: false })
        expect(ctx.searchNav).toMatchObject({ loading: false, error: true, message: 'Failed to load on chart' })
        expect(ctx.corkyError).toEqual({ message: 'boom', retryable: false })
    })

    test('with no active nav → only corkyError is set', async () => {
        const { onError } = await arm(ctx)
        onError({ code: 'NOPE', retryable: true })
        expect(ctx.searchNav).toBeNull()
        expect(ctx.corkyError).toEqual({ message: 'NOPE', retryable: true })
    })
})

describe('superseded-generation guard', () => {
    test('a newer _corkyGen freezes onStatus (no state mutation)', async () => {
        ctx.searchNav = { tabId: 'search-1', index: 0, loading: true, message: 'orig' }
        ctx.priceAlarms = [{ id: 'a1' }]
        const { onStatus, tv } = await arm(ctx)
        ctx._corkyGen += 1                                         // a later select superseded us
        onStatus({ phase: 'history-complete' })
        expect(tv.resetChart).not.toHaveBeenCalled()
        expect(ctx.ensurePriceAlarmOverlay).not.toHaveBeenCalled()
        expect(ctx.syncPositionOverlays).not.toHaveBeenCalled()
        expect(ctx.searchNav.message).toBe('orig')                // untouched
        expect(ctx.searchNav.loading).toBe(true)
    })

    test('a newer _corkyGen freezes onError (no corkyError, no nav mutation)', async () => {
        ctx.searchNav = { tabId: 'search-1', index: 0, loading: true, error: false }
        const { onError } = await arm(ctx)
        ctx._corkyGen += 1
        onError({ message: 'boom' })
        expect(ctx.corkyError).toBeNull()
        expect(ctx.searchNav.error).toBe(false)
        expect(ctx.searchNav.loading).toBe(true)
    })
})

describe('_navStatusLabel', () => {
    test('accepted → "Connecting…"', () => {
        expect(M._navStatusLabel.call(ctx, { phase: 'accepted' })).toBe('Connecting…')
    })
    test('history with chunk_index → "Loading history… (chunk N+1)"', () => {
        expect(M._navStatusLabel.call(ctx, { phase: 'history', chunk_index: 4 })).toBe('Loading history… (chunk 5)')
    })
    test('history without chunk_index → "Loading history…"', () => {
        expect(M._navStatusLabel.call(ctx, { phase: 'history' })).toBe('Loading history…')
    })
    test('unknown phase falls back to status.message', () => {
        expect(M._navStatusLabel.call(ctx, { phase: 'whatever', message: 'custom' })).toBe('custom')
    })
    test('unknown phase with no message → "Loading onto chart…"', () => {
        expect(M._navStatusLabel.call(ctx, { phase: 'whatever' })).toBe('Loading onto chart…')
    })
    test('null status → "Loading onto chart…"', () => {
        expect(M._navStatusLabel.call(ctx, null)).toBe('Loading onto chart…')
    })
})
