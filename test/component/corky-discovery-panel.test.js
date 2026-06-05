// @vitest-environment jsdom
//
// CorkyDiscoveryPanel (C4) — a PRESENTATIONAL, controlled discovery component.
// It renders the venue → symbol → timeframe → indicator tree from `states`,
// derives ready/stale badges from each state's ranges[], highlights the
// `current` selection, shows a loading/progress bar + error banner, and EMITS
// intents (select / add-timeframe / add-indicator / retry). It owns no client.
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
        // default indicator display set = all available for that tf (SMA(20))
        expect(payload.indicators).toEqual(['SMA(20)'])
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

    test('toggling an indicator emits add-indicator', async () => {
        const w = mountPanel({
            current: { venue: 'BITFINEX', symbol: 'tBTCUSD', timeframe: '5m', indicators: [] },
        })
        const toggle = w.find('.corky-ind-toggle')
        expect(toggle.exists()).toBe(true)
        await toggle.trigger('click')
        const emitted = w.emitted('add-indicator')
        expect(emitted).toBeTruthy()
        expect(emitted[0][0]).toMatchObject({
            venue: 'BITFINEX', symbol: 'tBTCUSD', timeframe: '5m', indicator: 'SMA(20)',
        })
    })
})
