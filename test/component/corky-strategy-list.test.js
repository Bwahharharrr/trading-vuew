// @vitest-environment jsdom
import { describe, expect, test } from 'vitest'
import { mount } from '@vue/test-utils'
import CorkyStrategyList from '../../src/components/feed/CorkyStrategyList.vue'

const NOW = 2_000_000
const runtimes = [
    {
        runtime_id: 'strategy-live', strategy_id: 'ema_regime_breakout_v8',
        state: 'Ready', mode: 'live', generated_at_ms: NOW - 1000,
        tickers: [{ ticker_id: 'BITFINEX:tBTCUSD' }, { ticker_id: 'BITFINEX:tETHUSD' }],
    },
    {
        runtime_id: 'strategy-observer', strategy_id: 'range_observer_v2',
        state: 'Degraded', mode: 'origin_observer', generated_at_ms: NOW - 30_000,
        mutations_halted_reason: 'origin_observer_money_mutations_fenced',
        tickers: [{ ticker_id: 'BITFINEX:tSOLUSD' }],
    },
]

describe('CorkyStrategyList', () => {
    test('shows every strategy with user-facing mode, health, ticker count, and freshness', () => {
        const wrapper = mount(CorkyStrategyList, { props: { runtimes, streaming: true, now: NOW } })
        expect(wrapper.findAll('.strategy-list-row')).toHaveLength(2)
        expect(wrapper.text()).toContain('2 active · 1 healthy · 1 status unknown')
        expect(wrapper.text()).toContain('EMA Regime Breakout V8')
        expect(wrapper.text()).toContain('Live trading')
        expect(wrapper.text()).toContain('2 tickers')
        expect(wrapper.text()).toContain('Range Observer V2')
        expect(wrapper.text()).toContain('Monitoring only')
        expect(wrapper.text()).toContain('Status unknown')
        expect(wrapper.text()).toContain('Runtime status update is stale')
        expect(wrapper.text()).not.toContain('Needs attention')
    })

    test('opens the clicked runtime without exposing an ambiguous selected state', async () => {
        const wrapper = mount(CorkyStrategyList, { props: { runtimes, streaming: true, now: NOW } })
        await wrapper.findAll('.strategy-list-row')[1].trigger('click')
        expect(wrapper.emitted('open-runtime')).toEqual([['strategy-observer']])
    })

    test('explains a shadow-live duplicate exit as a local unsent queue hold', () => {
        const reason = 'tTESTADA:TESTUSD: sell quantity 23.81686873 exceeds sellable quantity 0.00000000 (tracked long 23.81686873 minus 23.81686873 pending sell)'
        const runtime = {
            runtime_id: 'strategy-shadow',
            strategy_id: 'ema_regime_breakout_v8',
            state: 'Ready',
            mode: 'shadow_live',
            generated_at_ms: NOW - 1_000,
            mutations_halted_reason: reason,
            tickers: [{ ticker_id: 'BITFINEX:tTESTADA:TESTUSD' }],
        }
        const wrapper = mount(CorkyStrategyList, {
            props: { runtimes: [runtime], streaming: true, now: NOW },
        })

        expect(wrapper.text()).toContain('Healthy')
        expect(wrapper.text()).toContain('already queued locally')
        expect(wrapper.text()).toContain('not sent to the exchange')
        expect(wrapper.text()).not.toContain('exceeds sellable quantity')
        expect(wrapper.text()).not.toContain('Needs attention')
    })
})
