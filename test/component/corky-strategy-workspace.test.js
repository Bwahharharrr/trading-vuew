// @vitest-environment jsdom
import { beforeEach, describe, expect, test } from 'vitest'
import { mount } from '@vue/test-utils'
import CorkyStrategyPanel from '../../src/components/feed/CorkyStrategyPanel.vue'
import fixture from '../fixtures/corky/strategy/examples/strategy-runtimes-ux-contract.event.json'

const runtimes = fixture.event.runtimes

function mountPanel(props = {}) {
    return mount(CorkyStrategyPanel, {
        props: {
            runtimes,
            selectedRuntimeId: runtimes[0].runtime_id,
            streaming: true,
            now: runtimes[0].generated_at_ms,
            ...props,
        },
    })
}

async function task(wrapper, label) {
    const button = wrapper.findAll('.sr-tab').find((row) => row.text() === label)
    await button.trigger('click')
}

beforeEach(() => window.localStorage.clear())

describe('responsive strategy task workspace', () => {
    test('compact and maximized presentations share the same selected runtime', () => {
        const compact = mountPanel({ maximized: false })
        const expanded = mountPanel({ maximized: true })
        expect(compact.find('.sr').classes()).not.toContain('maximized')
        expect(expanded.find('.sr').classes()).toContain('maximized')
        expect(compact.find('.sr-rt.active').text()).toContain(runtimes[0].runtime_id)
        expect(expanded.find('.sr-rt.active').text()).toContain(runtimes[0].runtime_id)
        expect(expanded.find('.sr-hier').exists()).toBe(true)
        expect(expanded.find('.sr-body').exists()).toBe(true)
    })

    test('persists the active task across a panel remount', async () => {
        const first = mountPanel()
        await task(first, 'Orders')
        expect(first.find('.sr-tab.active').text()).toBe('Orders')
        first.unmount()
        const restored = mountPanel({ maximized: true })
        expect(restored.find('.sr-tab.active').text()).toBe('Orders')
        expect(restored.find('.sr-body').text()).toContain('Local journal only')
    })

    test('assigns evidence to task-specific views without duplicating it in Overview', async () => {
        const wrapper = mountPanel()
        expect(wrapper.find('.sr-body').text()).not.toContain('Audit provenance')
        expect(wrapper.find('.sr-body').text()).not.toContain('Local journal only')
        await task(wrapper, 'Configuration')
        expect(wrapper.find('.sr-body').text()).toContain('Audit provenance')
        expect(wrapper.find('.sr-body').text()).toContain('Lineage')
        await task(wrapper, 'Administration')
        expect(wrapper.find('.sr-body').text()).toContain('Runtime administration')
        expect(wrapper.find('.sr-body').text()).toContain('Approval')
    })

    test('Tickers renders exact status reasons and selects its command target', async () => {
        const wrapper = mountPanel()
        await task(wrapper, 'Tickers')
        const cards = wrapper.findAll('.sr-ticker-card')
        expect(cards).toHaveLength(runtimes[0].tickers.length)
        expect(cards[0].text()).toContain(runtimes[0].tickers[0].status_reason)
        await cards[0].trigger('click')
        expect(cards[0].classes()).toContain('active')
        await wrapper.setProps({ maximized: true })
        await task(wrapper, 'Administration')
        expect(wrapper.find('.sr').classes()).toContain('maximized')
        expect(wrapper.find('.sr-body').text()).toContain(runtimes[0].tickers[0].ticker_id)
    })
})
