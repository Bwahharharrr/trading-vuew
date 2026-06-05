// @vitest-environment jsdom
//
// CorkyDiscoveryPanel (C4) — a PRESENTATIONAL, controlled discovery component.
// It renders the venue → symbol → timeframe → indicator tree from `states`,
// derives ready/stale badges from each state's ranges[], highlights the
// `current` selection, shows a loading/progress bar + error banner, and EMITS
// intents (select / add-timeframe / toggle-indicator / retry). It owns no client.
import { test, expect, describe } from 'vitest'
import { mount } from '@vue/test-utils'
import CorkyDiscoveryPanel from '../../src/components/feed/CorkyDiscoveryPanel.vue'
import { candleStatesEvent } from '../fixtures/corky/index.js'

const states = candleStatesEvent.event.states

function mountPanel(props = {}) {
    return mount(CorkyDiscoveryPanel, {
        props: { states, ...props },
    })
}

describe('CorkyDiscoveryPanel', () => {
    test('renders the venue and symbol from the fixture', () => {
        const w = mountPanel()
        const text = w.text()
        expect(text).toContain('BITFINEX')   // venue
        expect(text).toContain('tBTCUSD')    // symbol (ticker)
    })

    test('renders one chip per available_timeframe with ready/stale class', () => {
        const w = mountPanel()
        const chips = w.findAll('.corky-tf-chip')
        const st = states[0]
        // One chip per available timeframe.
        expect(chips.length).toBe(st.available_timeframes.length)

        // Each chip carries the readiness class derived from ranges[].
        for (const tf of st.available_timeframes) {
            const chip = chips.find((c) => c.text().includes(tf))
            expect(chip).toBeTruthy()
            const range = st.ranges.find((r) => r.timeframe === tf)
            if (range.ready) {
                expect(chip.classes()).toContain('ready')
                expect(chip.classes()).not.toContain('not-ready')
            }
            if (range.stale) {
                expect(chip.classes()).toContain('stale')
            }
        }
    })

    test('renders indicator rows from indicators[]', () => {
        const w = mountPanel()
        const rows = w.findAll('.corky-indicator-row')
        const st = states[0]
        // The fixture's single SMA(20) indicator is on the 5m timeframe; it
        // shows under the active (first/default) timeframe only if it matches.
        // Selecting that timeframe is covered below — here we just assert the
        // indicator's display_label is reachable from the rendered tree once
        // its timeframe is active.
        const w5 = mountPanel({
            current: { venue: 'BITFINEX', symbol: 'tBTCUSD', timeframe: '5m', indicators: [] },
        })
        const rows5 = w5.findAll('.corky-indicator-row')
        expect(rows5.length).toBe(st.indicators.length)
        expect(w5.text()).toContain(st.indicators[0].display_label) // SMA(20)
        // and the indicator's ready badge is shown
        expect(w5.find('.badge-ready').exists()).toBe(true)
        // rows count for the non-5m default may be 0 (SMA is 5m-scoped)
        expect(Array.isArray(rows)).toBe(true)
    })

    test('clicking a timeframe chip emits select with the right payload', async () => {
        const w = mountPanel()
        const chips = w.findAll('.corky-tf-chip')
        const chip5m = chips.find((c) => c.text().includes('5m'))
        await chip5m.trigger('click')

        const emitted = w.emitted('select')
        expect(emitted).toBeTruthy()
        const payload = emitted[0][0]
        expect(payload.venue).toBe('BITFINEX')
        expect(payload.symbol).toBe('tBTCUSD')
        expect(payload.timeframe).toBe('5m')
        // candles-only by default: indicators are toggled on client-side later
        expect(payload.indicators).toEqual([])
    })

    test('highlights the current selection with aria-pressed', () => {
        const w = mountPanel({
            current: { venue: 'BITFINEX', symbol: 'tBTCUSD', timeframe: '1m', indicators: [] },
        })
        const chips = w.findAll('.corky-tf-chip')
        const chip1m = chips.find((c) => c.text().includes('1m'))
        expect(chip1m.classes()).toContain('active')
        expect(chip1m.attributes('aria-pressed')).toBe('true')
    })

    test('renders a progress bar when loading with progress', () => {
        const w = mountPanel({
            loading: true,
            progress: { phase: 'history', current: 50, total: 200 },
        })
        const bar = w.find('.corky-progress')
        expect(bar.exists()).toBe(true)
        const fill = w.find('.corky-progress-fill')
        expect(fill.attributes('style')).toContain('width: 25%')
        expect(w.text()).toContain('50/200')
    })

    test('renders an error banner with retry when retryable', async () => {
        const w = mountPanel({
            error: { message: 'connection lost', retryable: true },
        })
        const banner = w.find('.corky-error')
        expect(banner.exists()).toBe(true)
        expect(banner.text()).toContain('connection lost')
        const retry = w.find('.corky-retry-btn')
        expect(retry.exists()).toBe(true)
        await retry.trigger('click')
        expect(w.emitted('retry')).toBeTruthy()
    })

    test('omits retry affordance when error is not retryable', () => {
        const w = mountPanel({
            error: { message: 'fatal', retryable: false },
        })
        expect(w.find('.corky-error').exists()).toBe(true)
        expect(w.find('.corky-retry-btn').exists()).toBe(false)
    })

    test('toggling an OFF indicator emits a client-side toggle (enabled:true)', async () => {
        const w = mountPanel({
            current: { venue: 'BITFINEX', symbol: 'tBTCUSD', timeframe: '5m', indicators: [] },
        })
        const toggle = w.find('.corky-ind-toggle')
        expect(toggle.exists()).toBe(true)
        // currently OFF (not in current.indicators)
        expect(toggle.text()).toBe('○')
        await toggle.trigger('click')
        // no resubscribe path
        expect(w.emitted('add-indicator')).toBeFalsy()
        const emitted = w.emitted('toggle-indicator')
        expect(emitted).toBeTruthy()
        expect(emitted[0][0]).toMatchObject({
            venue: 'BITFINEX', symbol: 'tBTCUSD', timeframe: '5m',
            kind: 'sma', display_label: 'SMA(20)', enabled: true,
        })
    })

    test('toggling an ON indicator emits enabled:false', async () => {
        const w = mountPanel({
            current: {
                venue: 'BITFINEX', symbol: 'tBTCUSD', timeframe: '5m',
                indicators: ['SMA(20)'],
            },
        })
        const toggle = w.find('.corky-ind-toggle')
        expect(toggle.text()).toBe('●') // shown as ON
        await toggle.trigger('click')
        const emitted = w.emitted('toggle-indicator')
        expect(emitted[0][0]).toMatchObject({
            kind: 'sma', display_label: 'SMA(20)', enabled: false,
        })
    })

    test('an indicator row shows its timeframe as a badge', () => {
        const w = mountPanel({
            current: { venue: 'BITFINEX', symbol: 'tBTCUSD', timeframe: '5m', indicators: [] },
        })
        const row = w.find('.corky-indicator-row')
        expect(row.exists()).toBe(true)
        const tfBadge = row.find('.corky-ind-tf')
        expect(tfBadge.exists()).toBe(true)
        // SMA(20) is on the 5m timeframe.
        expect(tfBadge.text()).toBe('5m')
    })
})

// ── Search + category filtering, category badges ─────────────────────────────
// Hand-built states exercising the three Bitfinex symbol shapes so we drive the
// derived symbolCategories() heuristic through the real component.
function makeState(symbol) {
    return {
        venue: 'BITFINEX',
        symbol,
        state: 'Ready',
        available_timeframes: ['1m'],
        requested_timeframes: ['1m'],
        ranges: [{ timeframe: '1m', ready: true, stale: false }],
        indicators: [],
    }
}

const multiStates = [
    makeState('tBTCUSD'),      // exchange + margin
    makeState('tBTCF0:USTF0'), // derivative + margin
    makeState('fUSD:p30'),     // funding
]

function mountMulti(props = {}) {
    return mount(CorkyDiscoveryPanel, {
        props: { states: multiStates, ...props },
    })
}

describe('CorkyDiscoveryPanel — search + categories', () => {
    test('renders category badges derived from the symbol naming', () => {
        const w = mountMulti()
        const text = w.text()
        // tBTCUSD → Exch + Margin, tBTCF0 → Deriv + Margin, fUSD → Fund
        expect(text).toContain('Exch')
        expect(text).toContain('Margin')
        expect(text).toContain('Deriv')
        expect(text).toContain('Fund')
        // funding row carries the funding badge class
        expect(w.find('.corky-cat-badge-funding').exists()).toBe(true)
        expect(w.find('.corky-cat-badge-derivative').exists()).toBe(true)
    })

    test('typing in the search filters the rendered symbols', async () => {
        const w = mountMulti()
        expect(w.findAll('.corky-symbol').length).toBe(3)

        const input = w.find('.corky-search-input')
        await input.setValue('f0')
        // case-insensitive substring on venue+symbol → only tBTCF0:USTF0
        const symbols = w.findAll('.corky-symbol')
        expect(symbols.length).toBe(1)
        expect(w.text()).toContain('tBTCF0:USTF0')
        expect(w.text()).not.toContain('fUSD:p30')
        // live count reflects the filter
        expect(w.find('.corky-symbol-count').text()).toContain('1 symbol')
    })

    test('a category filter narrows the visible symbols', async () => {
        const w = mountMulti()
        const chips = w.findAll('.corky-cat-chip')
        const funding = chips.find((c) => c.text() === 'Fund')
        expect(funding).toBeTruthy()
        await funding.trigger('click')
        expect(funding.attributes('aria-pressed')).toBe('true')

        const symbols = w.findAll('.corky-symbol')
        expect(symbols.length).toBe(1)
        expect(w.text()).toContain('fUSD:p30')
        expect(w.text()).not.toContain('tBTCUSD')
    })

    test('Margin filter keeps both exchange and derivative symbols', async () => {
        const w = mountMulti()
        const chips = w.findAll('.corky-cat-chip')
        const margin = chips.find((c) => c.text() === 'Margin')
        await margin.trigger('click')
        const symbols = w.findAll('.corky-symbol')
        expect(symbols.length).toBe(2)
        expect(w.text()).toContain('tBTCUSD')
        expect(w.text()).toContain('tBTCF0:USTF0')
        expect(w.text()).not.toContain('fUSD:p30')
    })

    test('search + category combine (AND)', async () => {
        const w = mountMulti()
        const margin = w.findAll('.corky-cat-chip').find((c) => c.text() === 'Margin')
        await margin.trigger('click')
        await w.find('.corky-search-input').setValue('btcusd')
        const symbols = w.findAll('.corky-symbol')
        expect(symbols.length).toBe(1)
        expect(w.text()).toContain('tBTCUSD')
    })

    test('clear affordance resets the query', async () => {
        const w = mountMulti()
        await w.find('.corky-search-input').setValue('zzz')
        expect(w.findAll('.corky-symbol').length).toBe(0)
        const clear = w.find('.corky-search-clear')
        expect(clear.exists()).toBe(true)
        await clear.trigger('click')
        expect(w.findAll('.corky-symbol').length).toBe(3)
    })

    test('filtering preserves the select emit payload unchanged', async () => {
        const w = mountMulti()
        await w.find('.corky-search-input').setValue('btcusd')
        const chip = w.findAll('.corky-tf-chip').find((c) => c.text().includes('1m'))
        await chip.trigger('click')
        const emitted = w.emitted('select')
        expect(emitted).toBeTruthy()
        expect(emitted[0][0]).toEqual({
            venue: 'BITFINEX',
            symbol: 'tBTCUSD',
            timeframe: '1m',
            indicators: [],
        })
    })
})
