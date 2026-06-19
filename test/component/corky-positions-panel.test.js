// @vitest-environment jsdom
//
// CorkyPositionsPanel — a PRESENTATIONAL, controlled bottom-dock component with
// Open / Historical tabs. It renders position rows from props, highlights the
// charted ticker, and EMITS intents (select-position / load-more / refresh /
// update:open / update:active-tab / update:active-account). It owns no feed.
//
// Also pins the App-level onPositionSelect timeframe rule (keep → 1h → lowest)
// driving the existing corkySelect() — exercised against a plain `this` context,
// the same lightweight technique used in chart-state.test.js.
import { test, expect, describe, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import CorkyPositionsPanel from '../../src/components/feed/CorkyPositionsPanel.vue'
import { authPositionsEvent } from '../fixtures/corky/index.js'
import { pickTimeframe } from '../../src/helpers/feed/pick-timeframe.js'

const rows = authPositionsEvent.event.positions
const openRows = rows.filter((r) => r.source === 'current')
const histRows = rows.filter((r) => r.source === 'historical')

function mountPanel(props = {}) {
    return mount(CorkyPositionsPanel, {
        props: {
            height: 274, open: true, activeTab: 'open',
            openPositions: openRows, historicalPositions: histRows,
            accounts: [{ venue: 'BITFINEX', account_id: 'paper-a' }],
            activeAccount: { venue: 'BITFINEX', account_id: 'paper-a' },
            historyTotal: histRows.length,
            ...props,
        },
    })
}

describe('CorkyPositionsPanel — rendering', () => {
    test('shows both tabs with counts', () => {
        const w = mountPanel()
        const tabs = w.findAll('.pd-tab')
        expect(tabs).toHaveLength(2)
        expect(tabs[0].text()).toContain('Open Positions')
        expect(tabs[0].text()).toContain(String(openRows.length))
        expect(tabs[1].text()).toContain('Historical')
    })

    test('renders open rows with the ticker symbol', () => {
        const w = mountPanel()
        const trs = w.findAll('.pd-row')
        expect(trs).toHaveLength(openRows.length)
        expect(w.text()).toContain('tBTCUSD')
    })

    test('switching activeTab prop swaps the row set to historical', async () => {
        const w = mountPanel({ activeTab: 'historical' })
        expect(w.findAll('.pd-row')).toHaveLength(histRows.length)
        // historical rows expose a Closed column
        expect(w.text()).toContain('Closed')
    })

    test('collapsed dock hides the body but keeps the header', () => {
        const w = mountPanel({ open: false, height: 34 })
        expect(w.find('.pd-body').exists()).toBe(false)
        expect(w.find('.pd-header').exists()).toBe(true)
    })

    test('highlights the row matching the charted ticker', () => {
        const w = mountPanel({ currentSymbolKey: 'bitfinex|tbtcusd' })
        expect(w.find('.pd-row.active').exists()).toBe(true)
    })

    test('colours PnL by the textual sign of the decimal string', () => {
        const w = mountPanel()
        // fixture open row pl = "12.75" → positive
        expect(w.find('.pd-row .pos').exists()).toBe(true)
    })
})

describe('CorkyPositionsPanel — events', () => {
    test('clicking a row emits select-position with the row', async () => {
        const w = mountPanel()
        await w.find('.pd-row').trigger('click')
        const ev = w.emitted('select-position')
        expect(ev).toBeTruthy()
        expect(ev[0][0].symbol).toBe('tBTCUSD')
        expect(ev[0][0].source).toBe('current')
    })

    test('the per-row details button emits audit-position (not select)', async () => {
        const w = mountPanel()
        await w.find('.pd-details').trigger('click')
        expect(w.emitted('audit-position')).toBeTruthy()
        expect(w.emitted('audit-position')[0][0].symbol).toBe('tBTCUSD')
        // the row click (select) must NOT also fire from the details button (@click.stop)
        expect(w.emitted('select-position')).toBeFalsy()
    })

    test('tab buttons emit update:active-tab', async () => {
        const w = mountPanel()
        await w.findAll('.pd-tab')[1].trigger('click')
        expect(w.emitted('update:active-tab')[0]).toEqual(['historical'])
    })

    test('refresh + collapse icons emit', async () => {
        const w = mountPanel()
        const icons = w.findAll('.pd-icon')
        await icons[0].trigger('click')   // refresh
        await icons[1].trigger('click')   // collapse
        expect(w.emitted('refresh')).toBeTruthy()
        expect(w.emitted('update:open')[0]).toEqual([false])
    })

    test('Load more shows when more history is available and emits', async () => {
        const w = mountPanel({ activeTab: 'historical', historyHasMore: true, historyTotal: 99 })
        const more = w.find('.pd-more button')
        expect(more.exists()).toBe(true)
        await more.trigger('click')
        expect(w.emitted('load-more')).toBeTruthy()
    })

    test('empty state when no rows', () => {
        const w = mountPanel({ openPositions: [] })
        expect(w.find('.pd-msg').text()).toContain('No open positions')
    })
})

// ── App.onPositionSelect timeframe rule (keep → 1h → lowest) ──────────────────
// Replicate App.methods.onPositionSelect against a controllable `this`.
async function runSelect(ctx, pos) {
    // mirror of App.methods.onPositionSelect (kept in lockstep with App.vue)
    if (!pos || !pos.symbol) return
    const { venue, symbol } = pos
    let state = (ctx.corkyStates || []).find((s) => s && s.venue === venue && s.symbol === symbol)
    if (!state) {
        await ctx.corkyDiscover(venue)
        state = (ctx.corkyStates || []).find((s) => s && s.venue === venue && s.symbol === symbol)
    }
    const tfs = (state && state.available_timeframes) || []
    const current = ctx.corkyCurrent && ctx.corkyCurrent.timeframe
    const timeframe = pickTimeframe(current, tfs, { fallback: '1h' }) || current || '1h'
    ctx.corkySelect({ venue, symbol, timeframe })
}

describe('onPositionSelect — switch ticker + timeframe rule', () => {
    const pos = { venue: 'BITFINEX', symbol: 'tETHUSD' }

    test('keeps the current timeframe when the target offers it', async () => {
        const corkySelect = vi.fn()
        await runSelect({
            corkyStates: [{ venue: 'BITFINEX', symbol: 'tETHUSD', available_timeframes: ['1m', '1h', '1D'] }],
            corkyCurrent: { timeframe: '1D' },
            corkyDiscover: vi.fn(), corkySelect,
        }, pos)
        expect(corkySelect).toHaveBeenCalledWith({ venue: 'BITFINEX', symbol: 'tETHUSD', timeframe: '1D' })
    })

    test('falls back to 1h when current is unavailable', async () => {
        const corkySelect = vi.fn()
        await runSelect({
            corkyStates: [{ venue: 'BITFINEX', symbol: 'tETHUSD', available_timeframes: ['5m', '1H', '1D'] }],
            corkyCurrent: { timeframe: '4h' },
            corkyDiscover: vi.fn(), corkySelect,
        }, pos)
        expect(corkySelect).toHaveBeenCalledWith({ venue: 'BITFINEX', symbol: 'tETHUSD', timeframe: '1H' })
    })

    test('falls back to the lowest available when neither current nor 1h offered', async () => {
        const corkySelect = vi.fn()
        await runSelect({
            corkyStates: [{ venue: 'BITFINEX', symbol: 'tETHUSD', available_timeframes: ['1D', '1W', '15m'] }],
            corkyCurrent: { timeframe: '4h' },
            corkyDiscover: vi.fn(), corkySelect,
        }, pos)
        expect(corkySelect).toHaveBeenCalledWith({ venue: 'BITFINEX', symbol: 'tETHUSD', timeframe: '15m' })
    })

    test('discovers the venue first when the symbol is unknown', async () => {
        const corkySelect = vi.fn()
        const ctx = {
            corkyStates: [],
            corkyCurrent: { timeframe: '1h' },
            corkySelect,
            corkyDiscover: vi.fn(async () => {
                ctx.corkyStates = [{ venue: 'BITFINEX', symbol: 'tETHUSD', available_timeframes: ['1h', '1D'] }]
            }),
        }
        await runSelect(ctx, pos)
        expect(ctx.corkyDiscover).toHaveBeenCalledWith('BITFINEX')
        expect(corkySelect).toHaveBeenCalledWith({ venue: 'BITFINEX', symbol: 'tETHUSD', timeframe: '1h' })
    })
})
