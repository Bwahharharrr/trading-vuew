// @vitest-environment jsdom
import { beforeEach, describe, expect, test } from 'vitest'
import { mount } from '@vue/test-utils'
import CorkyStrategyPanel from '../../src/components/feed/CorkyStrategyPanel.vue'
import fixture from '../fixtures/corky/strategy/strategy-ux-scenarios.json'

const scenario = (id) => fixture.scenarios.find((row) => row.id === id)

beforeEach(() => window.localStorage.clear())

describe('strategy runtime semantic rendering', () => {
    test('renders a healthy observer as monitoring-only without internal vocabulary', async () => {
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
        expect(banner.text()).toContain('EMA Regime Breakout V8')
        expect(banner.text()).toContain('Monitoring only')
        expect(banner.text()).toContain('Runtime healthy')
        expect(banner.text()).toContain('Updated just now')
        expect(banner.text()).toContain('cannot place orders or change balances')
        expect(banner.text()).not.toContain('Origin Observer')
        expect(banner.text()).not.toContain('origin_observer_money_mutations_fenced')
        expect(wrapper.find('.sr-hier').exists()).toBe(false)
        const latest = wrapper.find('.sr-recent-decision')
        expect(latest.text()).toContain('Order not sent')
        expect(latest.text()).toContain('Expected while monitoring only')
        expect(latest.text()).not.toContain('intent_denied')
        expect(latest.text()).not.toContain('origin_observer_money_mutations_fenced')
        const details = wrapper.find('.sr-technical')
        expect(details.text()).toContain('origin_observer')
        expect(details.text()).toContain('observer-main')
        const capital = wrapper.findAll('.sr-tab').find((button) => button.text() === 'Capital')
        await capital.trigger('click')
        expect(wrapper.text()).toContain('monitoring-only strategies cannot allocate or change money')
    })

    test('translates decision codes while retaining the raw payload in technical details', async () => {
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
        expect(wrapper.find('.sr-activity-kind').text()).toBe('Order not sent')
        expect(wrapper.find('.sr-decision-reason').text()).toBe('Expected while monitoring only — this runtime cannot place orders or change balances.')
        expect(wrapper.find('.sr-payload pre').text()).toContain('origin_observer_money_mutations_fenced')
    })

    test('renders a shadow-live duplicate exit as an informational local queue hold', () => {
        const row = scenario('ready_executable')
        const reason = 'tTESTADA:TESTUSD: sell quantity 23.81686873 exceeds sellable quantity 0.00000000 (tracked long 23.81686873 minus 23.81686873 pending sell)'
        const runtime = {
            ...row.runtime,
            mode: 'shadow_live',
            mutations_halted_reason: reason,
            recent_decisions: [{
                decision_id: 'decision-shadow-exit-held',
                ticker_id: 'BITFINEX:tTESTADA:TESTUSD',
                symbol: 'tTESTADA:TESTUSD',
                decision_ts_ms: row.runtime.generated_at_ms - 1_000,
                timeframe: '1m',
                outcome: 'intent_denied',
                reason,
                intent_count: 1,
                queued_order_count: 0,
                rejected_order_count: 0,
            }],
        }
        const wrapper = mount(CorkyStrategyPanel, {
            props: {
                runtimes: [runtime],
                selectedRuntimeId: runtime.runtime_id,
                streaming: true,
                now: runtime.generated_at_ms + 1_000,
            },
        })

        expect(wrapper.find('.sr-service-health').text()).toBe('Runtime healthy')
        expect(wrapper.find('.sr-status-reason').text()).toContain('already queued locally')
        expect(wrapper.find('.sr-status-reason').text()).toContain('not sent to the exchange')
        expect(wrapper.find('.sr-status-reason').text()).not.toContain('exceeds sellable quantity')
        const latest = wrapper.find('.sr-recent-decision')
        expect(latest.text()).toContain('Exit already queued locally')
        expect(latest.text()).toContain('repeated exit signals are being safely suppressed')
        expect(latest.text()).not.toContain('Strategy action blocked')
        expect(latest.find('.sr-outcome').classes()).toContain('tone-neutral')
    })

    test('does not present last-reported Ready health as current while disconnected', () => {
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
        expect(banner).toContain('Status unknown')
        expect(banner).toContain('Updates disconnected')
        expect(banner).toContain('Last reported: Runtime healthy')
        expect(banner).not.toContain('● live')
    })
})
