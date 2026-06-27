// @vitest-environment jsdom
//
// ChartTabBar — branch/handler coverage the base spec leaves open: the keyboard
// select paths (enter/space @9-10), the close-button @click.stop / @mousedown.stop
// isolation, the props default factory (@32), the tabs.length>1 guards, and the
// aria-selected/title attributes. Each test pins exactly ONE branch.
import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import ChartTabBar from '../../src/components/ChartTabBar.vue'

const TABS = [
    { id: 'ct-1', title: 'BTC · 1h' },
    { id: 'ct-2', title: 'ETH · 4h' },
]
const mountBar = (props = {}) =>
    mount(ChartTabBar, { props: { tabs: TABS, activeId: 'ct-1', max: 8, ...props } })

describe('ChartTabBar — branch coverage', () => {
    // @9: keydown.enter on a tab is a select intent (keyboard a11y parity w/ click).
    it('emits select(id) on Enter keydown', async () => {
        const w = mountBar()
        await w.findAll('.ctab')[1].trigger('keydown.enter')
        expect(w.emitted('select')[0]).toEqual(['ct-2'])
    })

    // @10: keydown.space mirrors Enter — both are the activation keys for a role=tab.
    it('emits select(id) on Space keydown', async () => {
        const w = mountBar()
        await w.findAll('.ctab')[0].trigger('keydown.space')
        expect(w.emitted('select')[0]).toEqual(['ct-1'])
    })

    // @14 .stop: clicking × must close WITHOUT also bubbling to the tab's @click select.
    // (base spec asserts this for ct-2; pin ct-0 too so the stop isn't index-specific.)
    it('close × @click.stop emits close but never select', async () => {
        const w = mountBar()
        await w.findAll('.ctab-close')[0].trigger('click')
        expect(w.emitted('close')[0]).toEqual(['ct-1'])
        expect(w.emitted('select')).toBeFalsy()
    })

    // @15 @mousedown.stop: pressing on × must not reach the tab's @mousedown.middle
    // handler. A non-middle mousedown emits nothing at all (no close, no select).
    it('mousedown on × is swallowed — no emits', async () => {
        const w = mountBar()
        await w.findAll('.ctab-close')[0].trigger('mousedown', { button: 0 })
        expect(w.emitted('close')).toBeFalsy()
        expect(w.emitted('select')).toBeFalsy()
    })

    // @11 guard (tabs.length > 1 === false): middle-click on the ONLY tab must NOT
    // close it — you can't be left with zero charts.
    it('middle-click on a single tab does not emit close', async () => {
        const w = mountBar({ tabs: [TABS[0]] })
        await w.find('.ctab').trigger('mousedown', { button: 1 })
        expect(w.emitted('close')).toBeFalsy()
    })

    // @18-20: '+' at exactly max is disabled AND swallows the create intent.
    it('"+" at exactly max is disabled and emits no create', async () => {
        const w = mountBar({ max: 2 })           // 2 tabs, max 2 → at the ceiling
        const add = w.find('.ctab-add')
        expect(add.attributes('disabled')).toBeDefined()
        await add.trigger('click')
        expect(w.emitted('create')).toBeFalsy()  // disabled button → no emit
    })

    // @18 false branch: below max the button is enabled and the create flows.
    it('"+" below max is enabled and emits create', async () => {
        const w = mountBar({ max: 3 })           // 2 tabs, max 3 → room left
        const add = w.find('.ctab-add')
        expect(add.attributes('disabled')).toBeUndefined()
        await add.trigger('click')
        expect(w.emitted('create')).toHaveLength(1)
    })

    // @7: aria-selected tracks activeId — the active tab is 'true', the rest 'false'.
    it('aria-selected reflects activeId', () => {
        const w = mountBar({ activeId: 'ct-2' })
        const tabs = w.findAll('.ctab')
        expect(tabs[0].attributes('aria-selected')).toBe('false')
        expect(tabs[1].attributes('aria-selected')).toBe('true')
    })

    // @19 add-button title flips with the disabled state (the ternary's two arms).
    it('"+" title reports max when disabled, else the new-tab affordance', () => {
        expect(mountBar({ max: 2 }).find('.ctab-add').attributes('title'))
            .toBe('Maximum 2 chart tabs')
        expect(mountBar({ max: 5 }).find('.ctab-add').attributes('title'))
            .toBe('New chart tab')
    })

    // @6 + @13: per-tab title attr and the close button's static title.
    it('tab carries its title attr and the × has a Close tab title', () => {
        const w = mountBar()
        expect(w.findAll('.ctab')[0].attributes('title')).toBe('BTC · 1h')
        expect(w.findAll('.ctab-close')[0].attributes('title')).toBe('Close tab')
    })

    // @32: tabs prop default factory (() => []) — mount with NO tabs prop so the
    // default runs: empty list, no tabs, '+' still enabled under the default max(8).
    it('defaults to an empty tab list when tabs prop is omitted', () => {
        const w = mount(ChartTabBar)
        expect(w.findAll('.ctab')).toHaveLength(0)
        expect(w.find('.ctab-add').attributes('disabled')).toBeUndefined()
    })
})
