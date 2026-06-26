// @vitest-environment jsdom
//
// ChartTabBar — presentational top-level chart-tab strip. App owns the lifecycle;
// this pins the render + the three intents it emits (select/create/close) and the
// guards (close hidden with one tab, '+' disabled at max).
import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import ChartTabBar from '../../src/components/ChartTabBar.vue'

const TABS = [
    { id: 'ct-1', title: 'BTC · 1h' },
    { id: 'ct-2', title: 'ETH · 4h' },
]
const mountBar = (props = {}) =>
    mount(ChartTabBar, { props: { tabs: TABS, activeId: 'ct-1', max: 8, ...props } })

describe('ChartTabBar', () => {
    it('renders a tab per entry and marks the active one', () => {
        const w = mountBar()
        const tabs = w.findAll('.ctab')
        expect(tabs).toHaveLength(2)
        expect(tabs[0].text()).toContain('BTC · 1h')
        expect(tabs[0].classes()).toContain('active')
        expect(tabs[1].classes()).not.toContain('active')
    })

    it('emits select(id) when a tab is clicked', async () => {
        const w = mountBar()
        await w.findAll('.ctab')[1].trigger('click')
        expect(w.emitted('select')[0]).toEqual(['ct-2'])
    })

    it('emits create when "+" is clicked', async () => {
        const w = mountBar()
        await w.find('.ctab-add').trigger('click')
        expect(w.emitted('create')).toHaveLength(1)
    })

    it('emits close(id) when the × is clicked (and not select)', async () => {
        const w = mountBar()
        await w.findAll('.ctab-close')[1].trigger('click')
        expect(w.emitted('close')[0]).toEqual(['ct-2'])
        expect(w.emitted('select')).toBeFalsy()       // @click.stop kept it isolated
    })

    it('middle-click on a tab closes it', async () => {
        const w = mountBar()
        await w.findAll('.ctab')[0].trigger('mousedown', { button: 1 })
        expect(w.emitted('close')[0]).toEqual(['ct-1'])
    })

    it('hides the close button when only one tab remains', () => {
        const w = mountBar({ tabs: [TABS[0]] })
        expect(w.find('.ctab-close').exists()).toBe(false)
    })

    it('disables "+" at the max tab count', () => {
        const w = mountBar({ max: 2 })
        expect(w.find('.ctab-add').attributes('disabled')).toBeDefined()
    })
})
