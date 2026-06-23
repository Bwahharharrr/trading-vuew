// @vitest-environment jsdom
//
// App.vue positions data layer, exercised against a lightweight `this`
// (App.methods bound to a fake ctx), the same technique used by
// test/component/position-plot-select.test.js and search-run.test.js.
// No full mount: each ctx carries only the data fields + the methods under
// test, so the assertions pin the real branch behaviour of the open/history
// snapshot plumbing without any network, timers, or randomness.
import { test, expect, describe, beforeEach, vi } from 'vitest'
import App from '../../src/App.vue'

const M = App.methods

// Build a fake `this` with the positions data defaults (mirrors App data())
// plus the named methods bound to the real implementations. `stubs` overrides
// any method/field (e.g. replace _positionsSyncStreams with a spy) so a case
// can isolate the unit under test from its collaborators.
function mkCtx(stubs = {}) {
    const ctx = {
        positionsFeed: null,
        openPositions: [],
        historicalPositions: [],
        positionsAccounts: [],
        positionsActiveAccount: null,
        positionsActiveTab: 'open',
        positionsLoading: false,
        positionsError: null,
        positionsHistoryCursor: null,
        positionsHistoryTotal: 0,
        feedMode: 'gateway',
        positionsDockOpen: false,
        // collaborators that the targeted methods call; default to spies so a
        // focused test can assert call args without dragging in stream wiring.
        _positionsSyncStreams: vi.fn(),
        _ensureHistoryLoaded: vi.fn(),
    }
    for (const m of ['refreshPositions', '_applyOpenPositions', '_positionsDeriveAccounts',
        '_positionsErrText', 'loadHistoryPage', 'setPositionsAccount']) {
        ctx[m] = M[m]
    }
    return Object.assign(ctx, stubs)
}

describe('_applyOpenPositions', () => {
    test('sets openPositions to out.current and derives accounts from out.positions', () => {
        const derive = vi.fn()
        const ctx = mkCtx({ _positionsDeriveAccounts: derive })
        const current = [{ symbol: 'tBTCUSD' }]
        const positions = [{ venue: 'BITFINEX', account_id: 'a1' }]
        ctx._applyOpenPositions({ current, positions })
        expect(ctx.openPositions).toBe(current)
        expect(derive).toHaveBeenCalledTimes(1)
        expect(derive).toHaveBeenCalledWith(positions)
    })

    test('null out → openPositions=[] and derive called with []', () => {
        const derive = vi.fn()
        const ctx = mkCtx({ _positionsDeriveAccounts: derive })
        ctx._applyOpenPositions(null)
        expect(ctx.openPositions).toEqual([])
        expect(derive).toHaveBeenCalledWith([])
    })

    test('out present but no positions → derive called with []', () => {
        const derive = vi.fn()
        const ctx = mkCtx({ _positionsDeriveAccounts: derive })
        ctx._applyOpenPositions({ current: [{ x: 1 }] })
        expect(ctx.openPositions).toEqual([{ x: 1 }])
        expect(derive).toHaveBeenCalledWith([])
    })
})

describe('_positionsDeriveAccounts', () => {
    test('dedupes by lowercased venue|account_id and skips rows with no account_id', () => {
        const ctx = mkCtx()
        ctx._positionsDeriveAccounts([
            { venue: 'BITFINEX', account_id: 'a1' },
            { venue: 'bitfinex', account_id: 'a1' },   // dup (case-insensitive venue)
            { venue: 'KRAKEN', account_id: 'a2' },
            { venue: 'KRAKEN' },                        // no account_id → skipped
            null,                                       // falsy row → skipped
            { venue: 'KRAKEN', account_id: 'a2' },     // dup
        ])
        expect(ctx.positionsAccounts).toEqual([
            { venue: 'BITFINEX', account_id: 'a1' },
            { venue: 'KRAKEN', account_id: 'a2' },
        ])
    })

    test('keeps the current activeAccount when it still appears in the rows', () => {
        const active = { venue: 'KRAKEN', account_id: 'a2' }
        const ctx = mkCtx({ positionsActiveAccount: active })
        ctx._positionsDeriveAccounts([
            { venue: 'BITFINEX', account_id: 'a1' },
            { venue: 'kraken', account_id: 'a2' },   // matches active (case-insensitive)
        ])
        expect(ctx.positionsActiveAccount).toBe(active)   // unchanged reference
        expect(ctx.positionsAccounts).toHaveLength(2)
    })

    test('defaults to the first account when the prior active is gone', () => {
        const ctx = mkCtx({ positionsActiveAccount: { venue: 'GONE', account_id: 'zzz' } })
        ctx._positionsDeriveAccounts([
            { venue: 'BITFINEX', account_id: 'a1' },
            { venue: 'KRAKEN', account_id: 'a2' },
        ])
        expect(ctx.positionsActiveAccount).toEqual({ venue: 'BITFINEX', account_id: 'a1' })
    })

    test('defaults to null when there are no usable rows', () => {
        const ctx = mkCtx({ positionsActiveAccount: { venue: 'GONE', account_id: 'zzz' } })
        ctx._positionsDeriveAccounts([{ venue: 'NOID' }, null])
        expect(ctx.positionsAccounts).toEqual([])
        expect(ctx.positionsActiveAccount).toBeNull()
    })
})

describe('_positionsErrText', () => {
    const ctx = mkCtx()
    test('null → "Positions unavailable"', () => {
        expect(ctx._positionsErrText(null)).toBe('Positions unavailable')
    })
    test('{message} → message', () => {
        expect(ctx._positionsErrText({ message: 'boom', code: 'X' })).toBe('boom')
    })
    test('{code} only → code', () => {
        expect(ctx._positionsErrText({ code: 'rate_limited' })).toBe('rate_limited')
    })
    test('an Error object still resolves via its .message (precedence over String)', () => {
        // an Error carries .message, so the `err.message ||` branch wins before
        // the String(err) fallback is ever reached.
        expect(ctx._positionsErrText(new Error('explode'))).toBe('explode')
    })
    test('no message/code → falls back to String(err)', () => {
        expect(ctx._positionsErrText({})).toBe('[object Object]')
        // a falsy-but-non-null message/code skips both `||` branches → String(err)
        expect(ctx._positionsErrText({ message: '', code: 0 })).toBe('[object Object]')
    })
})

describe('refreshPositions', () => {
    test('no feed → returns early, leaves loading false', async () => {
        const ctx = mkCtx({ positionsFeed: null })
        await ctx.refreshPositions()
        expect(ctx.positionsLoading).toBe(false)
        expect(ctx._positionsSyncStreams).not.toHaveBeenCalled()
    })

    test('listOpen resolves → applies snapshot, syncs streams, clears error, toggles loading', async () => {
        const out = { current: [{ s: 1 }], positions: [{ venue: 'V', account_id: 'a1' }] }
        let loadingDuringCall = null
        const apply = vi.fn()
        const ctx = mkCtx({
            positionsFeed: { listOpen: vi.fn(async () => { loadingDuringCall = ctx.positionsLoading; return out }) },
            positionsError: 'stale',
            _applyOpenPositions: apply,
        })
        await ctx.refreshPositions()
        expect(ctx.positionsFeed.listOpen).toHaveBeenCalledWith({ include_historical: false })
        expect(loadingDuringCall).toBe(true)            // flipped true before the await
        expect(apply).toHaveBeenCalledWith(out)
        expect(ctx._positionsSyncStreams).toHaveBeenCalledTimes(1)
        expect(ctx.positionsError).toBeNull()
        expect(ctx.positionsLoading).toBe(false)        // cleared in finally
    })

    test('listOpen rejects → positionsError via _positionsErrText, loading cleared in finally', async () => {
        const ctx = mkCtx({
            positionsFeed: { listOpen: vi.fn(async () => { throw { code: 'denied' } }) },
        })
        await ctx.refreshPositions()
        expect(ctx.positionsError).toBe('denied')
        expect(ctx.positionsLoading).toBe(false)
        expect(ctx._positionsSyncStreams).not.toHaveBeenCalled()   // threw before sync
    })

    test('calls _ensureHistoryLoaded({silent:true}) only when an active account is set', async () => {
        // active account present (set by the real derive via the resolved snapshot)
        const withAcct = mkCtx({
            positionsFeed: { listOpen: vi.fn(async () => ({ current: [], positions: [{ venue: 'V', account_id: 'a1' }] })) },
        })
        await withAcct.refreshPositions()
        expect(withAcct.positionsActiveAccount).toEqual({ venue: 'V', account_id: 'a1' })
        expect(withAcct._ensureHistoryLoaded).toHaveBeenCalledWith({ silent: true })

        // no account derived → not called
        const noAcct = mkCtx({
            positionsFeed: { listOpen: vi.fn(async () => ({ current: [], positions: [] })) },
        })
        await noAcct.refreshPositions()
        expect(noAcct.positionsActiveAccount).toBeNull()
        expect(noAcct._ensureHistoryLoaded).not.toHaveBeenCalled()
    })
})

describe('loadHistoryPage', () => {
    const acct = { venue: 'BITFINEX', account_id: 'a1' }

    test('reset=true clears history/cursor/total then stores the first page', async () => {
        const out = { positions: [{ id: 1 }, { id: 2 }], next_cursor: 'cur-2', total_count: 7 }
        const ctx = mkCtx({
            positionsActiveAccount: acct,
            historicalPositions: [{ stale: true }],
            positionsHistoryCursor: 'old',
            positionsHistoryTotal: 99,
            positionsFeed: { listHistory: vi.fn(async () => out) },
        })
        await ctx.loadHistoryPage(true)
        expect(ctx.positionsFeed.listHistory).toHaveBeenCalledWith({
            venue: 'BITFINEX', account_id: 'a1', cursor: undefined,
        })
        expect(ctx.historicalPositions).toEqual([{ id: 1 }, { id: 2 }])
        expect(ctx.positionsHistoryCursor).toBe('cur-2')
        expect(ctx.positionsHistoryTotal).toBe(7)
        expect(ctx.positionsLoading).toBe(false)
        expect(ctx.positionsError).toBeNull()
    })

    test('a second call (reset=false) appends and advances the cursor in listHistory args', async () => {
        const page1 = { positions: [{ id: 1 }], next_cursor: 'cur-2', total_count: 3 }
        const page2 = { positions: [{ id: 2 }, { id: 3 }], next_cursor: null, total_count: 3 }
        const listHistory = vi.fn()
            .mockImplementationOnce(async () => page1)
            .mockImplementationOnce(async () => page2)
        const ctx = mkCtx({ positionsActiveAccount: acct, positionsFeed: { listHistory } })

        await ctx.loadHistoryPage(true)
        await ctx.loadHistoryPage(false)

        expect(listHistory).toHaveBeenCalledTimes(2)
        expect(listHistory.mock.calls[0][0].cursor).toBeUndefined()     // first page, no cursor
        expect(listHistory.mock.calls[1][0].cursor).toBe('cur-2')        // advanced from page1.next_cursor
        expect(ctx.historicalPositions).toEqual([{ id: 1 }, { id: 2 }, { id: 3 }])   // appended
        expect(ctx.positionsHistoryCursor).toBeNull()                    // exhausted
    })

    test('no feed → returns early without touching state', async () => {
        const ctx = mkCtx({ positionsFeed: null, positionsActiveAccount: acct })
        await ctx.loadHistoryPage(true)
        expect(ctx.positionsLoading).toBe(false)
        expect(ctx.positionsError).toBeNull()
    })

    test('no activeAccount, not silent → banner error, never calls listHistory', async () => {
        const listHistory = vi.fn()
        const ctx = mkCtx({ positionsActiveAccount: null, positionsFeed: { listHistory } })
        await ctx.loadHistoryPage(true)
        expect(ctx.positionsError).toBe('Select an account to view history')
        expect(listHistory).not.toHaveBeenCalled()
    })

    test('no activeAccount, silent:true → stays silent (no banner), never calls listHistory', async () => {
        const listHistory = vi.fn()
        const ctx = mkCtx({ positionsActiveAccount: null, positionsFeed: { listHistory } })
        await ctx.loadHistoryPage(true, { silent: true })
        expect(ctx.positionsError).toBeNull()
        expect(listHistory).not.toHaveBeenCalled()
    })

    test('error path: silent:true suppresses the banner, loading still cleared', async () => {
        const ctx = mkCtx({
            positionsActiveAccount: acct,
            positionsFeed: { listHistory: vi.fn(async () => { throw new Error('history down') }) },
        })
        await ctx.loadHistoryPage(true, { silent: true })
        expect(ctx.positionsError).toBeNull()
        expect(ctx.positionsLoading).toBe(false)
    })

    test('error path: silent:false surfaces _positionsErrText', async () => {
        const ctx = mkCtx({
            positionsActiveAccount: acct,
            positionsFeed: { listHistory: vi.fn(async () => { throw { message: 'history down' } }) },
        })
        await ctx.loadHistoryPage(true, { silent: false })
        expect(ctx.positionsError).toBe('history down')
        expect(ctx.positionsLoading).toBe(false)
    })
})

describe('setPositionsAccount', () => {
    const acct = { venue: 'KRAKEN', account_id: 'a2' }

    test('resets history/cursor/total and reloads ONLY on the historical tab', () => {
        const load = vi.fn()
        const ctx = mkCtx({
            positionsActiveTab: 'historical',
            historicalPositions: [{ old: 1 }],
            positionsHistoryCursor: 'cur',
            positionsHistoryTotal: 12,
            loadHistoryPage: load,
        })
        ctx.setPositionsAccount(acct)
        expect(ctx.positionsActiveAccount).toBe(acct)
        expect(ctx.historicalPositions).toEqual([])
        expect(ctx.positionsHistoryCursor).toBeNull()
        expect(ctx.positionsHistoryTotal).toBe(0)
        expect(load).toHaveBeenCalledTimes(1)
        expect(load).toHaveBeenCalledWith(true)
    })

    test('on the open tab: resets state but does NOT reload', () => {
        const load = vi.fn()
        const ctx = mkCtx({
            positionsActiveTab: 'open',
            historicalPositions: [{ old: 1 }],
            positionsHistoryCursor: 'cur',
            positionsHistoryTotal: 12,
            loadHistoryPage: load,
        })
        ctx.setPositionsAccount(acct)
        expect(ctx.positionsActiveAccount).toBe(acct)
        expect(ctx.historicalPositions).toEqual([])
        expect(ctx.positionsHistoryCursor).toBeNull()
        expect(ctx.positionsHistoryTotal).toBe(0)
        expect(load).not.toHaveBeenCalled()
    })
})

describe('_ensureHistoryLoaded', () => {
    // use the REAL _ensureHistoryLoaded here (mkCtx stubs it by default for the
    // refreshPositions cases, so rebind it explicitly)
    function ctxFor(stubs) {
        const ctx = mkCtx(stubs)
        ctx._ensureHistoryLoaded = M._ensureHistoryLoaded
        return ctx
    }

    test('loads (reset, forwarding opts) when history is empty and not already loading', () => {
        const load = vi.fn()
        const ctx = ctxFor({ historicalPositions: [], positionsLoading: false, loadHistoryPage: load })
        ctx._ensureHistoryLoaded({ silent: true })
        expect(load).toHaveBeenCalledWith(true, { silent: true })
    })

    test('defaults opts to {} when called with no args', () => {
        const load = vi.fn()
        const ctx = ctxFor({ historicalPositions: [], positionsLoading: false, loadHistoryPage: load })
        ctx._ensureHistoryLoaded()
        expect(load).toHaveBeenCalledWith(true, {})
    })

    test('does NOT load when history is already populated', () => {
        const load = vi.fn()
        const ctx = ctxFor({ historicalPositions: [{ id: 1 }], positionsLoading: false, loadHistoryPage: load })
        ctx._ensureHistoryLoaded()
        expect(load).not.toHaveBeenCalled()
    })

    test('does NOT load when already loading', () => {
        const load = vi.fn()
        const ctx = ctxFor({ historicalPositions: [], positionsLoading: true, loadHistoryPage: load })
        ctx._ensureHistoryLoaded()
        expect(load).not.toHaveBeenCalled()
    })
})
