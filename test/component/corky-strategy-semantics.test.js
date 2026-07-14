// @vitest-environment jsdom
import { beforeEach, describe, expect, test } from 'vitest'
import { mount } from '@vue/test-utils'
import CorkyStrategyPanel from '../../src/components/feed/CorkyStrategyPanel.vue'
import fixture from '../fixtures/corky/strategy/strategy-ux-scenarios.json'

const scenario = (id) => fixture.scenarios.find((row) => row.id === id)

beforeEach(() => window.localStorage.clear())

describe('strategy runtime semantic rendering', () => {
    test('renders a Ready observer as read-only with N/A financial dependencies', async () => {
        const row = scenario('ready_observer')
        const wrapper = mount(CorkyStrategyPanel, {
            props: {
                runtimes: [row.runtime],
                selectedRuntimeId: row.runtime.runtime_id,
                streaming: true,
                now: row.runtime.generated_at_ms + 1_000,
                control: { available: true },
            },
        })
        const banner = wrapper.find('.sr-status-banner')
        expect(banner.text()).toContain('Ready')
        expect(banner.text()).toContain('Origin Observer')
        expect(banner.text()).toContain('Money mutations fenced')
        expect(banner.text()).toContain('origin_observer_money_mutations_fenced')
        expect(wrapper.text()).toContain('N/A — not configured')
        const capital = wrapper.findAll('.sr-tab').find((button) => button.text() === 'Capital')
        await capital.trigger('click')
        expect(wrapper.text()).toContain('This runtime has no financial allocation authority.')
    })

    test('shows published decision reasons as table content, not tooltip-only text', async () => {
        const row = scenario('ready_observer')
        const decisions = [{
            ticker_id: 'BITFINEX:tTESTADA:TESTUSD',
            symbol: 'tTESTADA:TESTUSD',
            decision_ts_ms: row.runtime.generated_at_ms - 1_000,
            timeframe: '1m',
            outcome: 'intent_denied',
            reason: 'origin_observer_money_mutations_fenced',
            intents: [], risk_checks: [], ledger_deltas: [], claim_states: [],
        }]
        const wrapper = mount(CorkyStrategyPanel, {
            props: { runtimes: [row.runtime], decisions, streaming: true, now: row.runtime.generated_at_ms },
        })
        const audit = wrapper.findAll('.sr-tab').find((button) => button.text() === 'Activity')
        await audit.trigger('click')
        expect(wrapper.find('.sr-decision-reason').text()).toBe('origin_observer_money_mutations_fenced')
    })

    test('keeps stale/disconnected presentation separate from Ready health', () => {
        const row = scenario('stale_disconnected')
        const wrapper = mount(CorkyStrategyPanel, {
            props: {
                runtimes: [row.runtime],
                selectedRuntimeId: row.runtime.runtime_id,
                streaming: false,
                now: row.client.now_ms,
            },
        })
        const banner = wrapper.find('.sr-status-banner').text()
        expect(banner).toContain('Ready')
        expect(banner).toContain('Disconnected')
        expect(banner).not.toContain('● live')
    })
})
