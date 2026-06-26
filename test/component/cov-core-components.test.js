// @vitest-environment jsdom
//
// Coverage push for CORE COMPONENTS that were under-tested:
//   - src/components/UxWrapper.vue   (interface wrapper window: pin/position/style)
//   - src/components/ToolbarItem.vue (a single drawing-tool toolbar button)
//   - src/components/Sidebar.vue     (price axis; render guard + resize)
//   - src/components/Botbar.vue      (time axis;  render guard + shaders)
//   - src/components/Grid.vue        (overlay registry + event plumbing)
//
// UxWrapper + ToolbarItem are standalone and almost-untested, so they get the
// bulk of the effort (props/events/slots/computed/conditional render). The
// Sidebar/Botbar/Grid components own a canvas renderer; we exercise their
// framework-side logic (render-guard branches, computed hash keys, event
// emission) by mounting the real TradingVue via the component harness where the
// renderer is needed.

import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import mitt from 'mitt'
import { nextTick } from 'vue'

import UxWrapper from '../../src/components/UxWrapper.vue'
import ToolbarItem from '../../src/components/ToolbarItem.vue'
import Sidebar from '../../src/components/Sidebar.vue'
import Botbar from '../../src/components/Botbar.vue'

import TradingVue from '../../src/TradingVue.vue'
import DataCube from '../../src/helpers/datacube.js'
import {
    installCanvasEnv, uninstallCanvasEnv, settle,
} from './_component-harness.js'

// ---------------------------------------------------------------------------
// UxWrapper.vue
// ---------------------------------------------------------------------------
//
// The wrapper consumes a rich `ux` object (the runtime Interface descriptor).
// We build a minimal-but-faithful stub: a mitt emitter for the mouse bus, a
// layout with the coordinate-projection methods the wrapper calls, and the
// overlay/settings/cursor fields the computeds read.

const COLORS = { grid: '#222222', back: '#111111', scale: '#333333' }
const CONFIG = { UX_OPACITY: 0.9, TOOLBAR: 57, TB_ICON: 25, TB_ITEM_M: 6,
    TB_ICON_BRI: 1, TB_ICON_HOLD: 420 }

// A trivial Vue component the wrapper renders as its body. It re-emits a
// custom-event when asked, so we can drive on_custom_event from the child path.
const StubBody = {
    name: 'StubBody',
    props: ['ux', 'updater', 'wrapper', 'colors'],
    template: '<div class="stub-body"></div>',
}

function makeMouse() {
    const bus = mitt()
    return {
        x: 50, y: 60,
        on: (ev, fn) => bus.on(ev, fn),
        off: (ev, fn) => bus.off(ev, fn),
        emit: (ev, payload) => bus.emit(ev, payload),
    }
}

function makeUx(overrides = {}) {
    const mouse = makeMouse()
    const layout = {
        width: 800,
        height: 400,
        t2screen: t => t,            // identity projections keep math obvious
        $2screen: v => v,
        ...(overrides.layout || {}),
    }
    const overlay = {
        id: 'ov-1',
        layout,
        settings: overrides.settings || {},
        mouse,
        cursor: { x: 123, y: 456 },
        ...(overrides.overlay || {}),
    }
    return Object.assign({
        uuid: 'abc',
        component: StubBody,
        overlay,
        hidden: false,
        pin: [10, 20],
        pin_position: '0,0',
        show_pin: false,
        win_header: true,
        win_styling: true,
        pointer_events: 'all',
        pin_color: '#23a776',
        z_index: 0,
        background: undefined,
        background_opacity: undefined,
        inactive_btn_color: undefined,
    }, overrides.ux || {})
}

function mountUx(uxOverrides = {}, props = {}) {
    const ux = makeUx(uxOverrides)
    const wrapper = mount(UxWrapper, {
        attachTo: document.body,
        props: {
            ux,
            updater: 0,
            colors: COLORS,
            config: CONFIG,
            ...props,
        },
        global: { components: { StubBody } },
    })
    return { wrapper, ux }
}

describe('UxWrapper.vue', () => {
    test('renders the body component, head + close button when win_header !== false', () => {
        const { wrapper } = mountUx()
        expect(wrapper.find('.trading-vue-ux-wrapper').exists()).toBe(true)
        expect(wrapper.find('.stub-body').exists()).toBe(true)
        expect(wrapper.find('.tvjs-ux-wrapper-head').exists()).toBe(true)
        expect(wrapper.find('.tvjs-ux-wrapper-close').exists()).toBe(true)
        wrapper.unmount()
    })

    test('id is derived from the ux uuid', () => {
        const { wrapper } = mountUx({ ux: { uuid: 'zed' } })
        expect(wrapper.find('.trading-vue-ux-wrapper').attributes('id'))
            .toBe('tvjs-ux-wrapper-zed')
        wrapper.unmount()
    })

    test('win_header === false hides the head/close chrome', () => {
        const { wrapper } = mountUx({ ux: { win_header: false } })
        expect(wrapper.find('.tvjs-ux-wrapper-head').exists()).toBe(false)
        wrapper.unmount()
    })

    test('show_pin renders the pin element with pin_style offsets', () => {
        // Pin offsets must be px-suffixed: parse_coord only understands %, px,
        // and +/- expressions (a bare "4" returns undefined).
        const { wrapper } = mountUx({
            ux: { show_pin: true, pin_position: '4px,8px', pin_color: '#abcdef' },
        })
        const pin = wrapper.find('.tvjs-ux-wrapper-pin')
        expect(pin.exists()).toBe(true)
        // ox/oy are the negated parsed pin coords; pin_style uses -ox / -oy.
        expect(wrapper.vm.ox).toBe(-4)
        expect(wrapper.vm.oy).toBe(-8)
        expect(pin.attributes('style')).toContain('background-color: rgb(171, 205, 239)')
        wrapper.unmount()
    })

    test('close() emits a close-interface custom-event carrying the uuid', () => {
        const { wrapper } = mountUx({ ux: { uuid: 'kill-me' } })
        wrapper.vm.close()
        const ev = wrapper.emitted('custom-event').pop()[0]
        expect(ev).toEqual({ event: 'close-interface', args: ['kill-me'] })
        wrapper.unmount()
    })

    test('clicking the close button triggers close()', async () => {
        const { wrapper } = mountUx({ ux: { uuid: 'click-close' } })
        await wrapper.find('.tvjs-ux-wrapper-close').trigger('click')
        const ev = wrapper.emitted('custom-event').pop()[0]
        expect(ev.event).toBe('close-interface')
        expect(ev.args).toEqual(['click-close'])
        wrapper.unmount()
    })

    test('on_custom_event re-emits child events and recomputes x/y on modify-interface', () => {
        // Drive REAL repositioning (no spy that suppresses the work): start the
        // wrapper at a stale x/y, move the pin, and prove modify-interface ran
        // update_position by checking the projected coords landed on the new pin.
        const { wrapper, ux } = mountUx({ ux: { pin: [10, 20], pin_position: '0,0' } })
        wrapper.vm.x = -1
        wrapper.vm.y = -1
        ux.pin[0] = 77
        ux.pin[1] = 88
        wrapper.vm.on_custom_event({ event: 'modify-interface', args: [ux.uuid] })
        // identity projections => x = t2screen(77)+ox(0), y = $2screen(88)+oy(0)
        expect(wrapper.vm.x).toBe(77)
        expect(wrapper.vm.y).toBe(88)
        const ev = wrapper.emitted('custom-event').pop()[0]
        expect(ev).toEqual({ event: 'modify-interface', args: [ux.uuid] })
        wrapper.unmount()
    })

    test('on_custom_event re-emits non-modify events without repositioning', () => {
        // A non-modify event must leave the projected coords untouched: seed a
        // sentinel x/y and assert they survive the re-emit unchanged.
        const { wrapper } = mountUx({ ux: { pin: [10, 20], pin_position: '0,0' } })
        wrapper.vm.x = -42
        wrapper.vm.y = -99
        wrapper.vm.on_custom_event({ event: 'something-else', args: [] })
        expect(wrapper.vm.x).toBe(-42)
        expect(wrapper.vm.y).toBe(-99)
        expect(wrapper.emitted('custom-event').pop()[0]).toEqual({ event: 'something-else', args: [] })
        wrapper.unmount()
    })

    test('update_position projects numeric pins through the layout', () => {
        // identity projections => x = t2screen(10)+ox, y = $2screen(20)+oy
        const { wrapper } = mountUx({ ux: { pin: [10, 20], pin_position: '0,0' } })
        wrapper.vm.update_position()
        expect(wrapper.vm.x).toBe(10) // 10 + ox(=-0)
        expect(wrapper.vm.y).toBe(20)
        wrapper.unmount()
    })

    test('update_position honours cursor/mouse pin keywords', () => {
        const { wrapper, ux } = mountUx({ ux: { pin: ['cursor', 'mouse'], pin_position: '0,0' } })
        // x <- overlay.cursor.x ; y <- mouse.y
        wrapper.vm.update_position()
        expect(wrapper.vm.x).toBe(ux.overlay.cursor.x)
        expect(wrapper.vm.y).toBe(ux.overlay.mouse.y)
        wrapper.unmount()
    })

    test('update_position is a no-op when the ux is hidden', () => {
        const { wrapper } = mountUx({ ux: { hidden: true } })
        wrapper.vm.x = 999
        wrapper.vm.y = 888
        wrapper.vm.update_position()
        expect(wrapper.vm.x).toBe(999)
        expect(wrapper.vm.y).toBe(888)
        wrapper.unmount()
    })

    test('mouse "mousemove" event repositions and shows the wrapper', () => {
        const { wrapper, ux } = mountUx({ ux: { pin: ['mouse', 'mouse'], pin_position: '0,0' } })
        wrapper.vm.visible = false
        ux.overlay.mouse.x = 222
        ux.overlay.mouse.y = 333
        ux.overlay.mouse.emit('mousemove')
        expect(wrapper.vm.visible).toBe(true)
        expect(wrapper.vm.x).toBe(222)
        expect(wrapper.vm.y).toBe(333)
        wrapper.unmount()
    })

    test('mouse "mouseout" hides the wrapper only for cursor/mouse pins', () => {
        const cur = mountUx({ ux: { pin: ['cursor', 0], pin_position: '0,0' } })
        cur.wrapper.vm.visible = true
        cur.ux.overlay.mouse.emit('mouseout')
        expect(cur.wrapper.vm.visible).toBe(false)
        cur.wrapper.unmount()

        const fixed = mountUx({ ux: { pin: [10, 20], pin_position: '0,0' } })
        fixed.wrapper.vm.visible = true
        fixed.ux.overlay.mouse.emit('mouseout')
        expect(fixed.wrapper.vm.visible).toBe(true) // fixed pins stay visible
        fixed.wrapper.unmount()
    })

    test('beforeUnmount detaches the mouse listeners', () => {
        const { wrapper, ux } = mountUx({ ux: { pin: ['mouse', 'mouse'], pin_position: '0,0' } })
        wrapper.unmount()
        // After teardown, a mousemove must not throw nor flip visibility.
        const before = wrapper.vm.visible
        ux.overlay.mouse.emit('mousemove')
        expect(wrapper.vm.visible).toBe(before)
    })

    test('updater prop change re-runs update_position via the watcher', async () => {
        // Prove the watcher actually re-projects: move the pin, bump `updater`,
        // and assert the coords followed (rather than only that the method fired).
        const { wrapper, ux } = mountUx({ ux: { pin: [10, 20], pin_position: '0,0' } })
        wrapper.vm.x = 0
        wrapper.vm.y = 0
        ux.pin[0] = 314
        ux.pin[1] = 271
        await wrapper.setProps({ updater: 1 })
        expect(wrapper.vm.x).toBe(314)
        expect(wrapper.vm.y).toBe(271)
        wrapper.unmount()
    })

    describe('parse_coord', () => {
        test('returns 0 for "0" and empty', () => {
            const { wrapper } = mountUx()
            expect(wrapper.vm.parse_coord('0', 100)).toBe(0)
            expect(wrapper.vm.parse_coord('   ', 100)).toBe(0)
            wrapper.unmount()
        })
        test('parses percentages relative to the scale', () => {
            const { wrapper } = mountUx()
            expect(wrapper.vm.parse_coord('50%', 200)).toBe(100)
            wrapper.unmount()
        })
        test('parses pixel offsets', () => {
            const { wrapper } = mountUx()
            expect(wrapper.vm.parse_coord('40px', 999)).toBe(40)
            wrapper.unmount()
        })
        test('parses additive and subtractive expressions', () => {
            const { wrapper } = mountUx()
            expect(wrapper.vm.parse_coord('50%+10px', 200)).toBe(110)
            expect(wrapper.vm.parse_coord('50%-10px', 200)).toBe(90)
            wrapper.unmount()
        })
        test('returns undefined for an unparseable token', () => {
            const { wrapper } = mountUx()
            expect(wrapper.vm.parse_coord('garbage', 100)).toBeUndefined()
            wrapper.unmount()
        })
    })

    describe('style computeds', () => {
        test('style includes border/background when win_styling !== false', () => {
            const { wrapper } = mountUx()
            const st = wrapper.vm.style
            expect(st.border).toBe(`1px solid ${COLORS.grid}`)
            expect(st['border-radius']).toBe('3px')
            expect(st['pointer-events']).toBe('all')
            wrapper.unmount()
        })
        test('win_styling === false drops the border/background chrome', () => {
            const { wrapper } = mountUx({ ux: { win_styling: false } })
            const st = wrapper.vm.style
            expect(st.border).toBeUndefined()
            expect(st.background).toBeUndefined()
            wrapper.unmount()
        })
        test('style display is none when hidden', () => {
            const { wrapper } = mountUx({ ux: { hidden: true } })
            expect(wrapper.vm.style.display).toBe('none')
            wrapper.unmount()
        })
        test('z_index sums settings z-index and ux z_index', () => {
            const { wrapper } = mountUx({
                settings: { 'z-index': 5 },
                ux: { z_index: 3 },
            })
            expect(wrapper.vm.z_index).toBe(8)
            wrapper.unmount()
        })
        test('z_index falls back to camelCase zIndex setting', () => {
            const { wrapper } = mountUx({ settings: { zIndex: 7 } })
            expect(wrapper.vm.z_index).toBe(7)
            wrapper.unmount()
        })
        test('background applies opacity over the configured back color', () => {
            const { wrapper } = mountUx()
            // colors.back = #111111, opacity 0.9 -> alpha 229 -> 'e5'
            expect(wrapper.vm.background).toBe('#111111e5')
            wrapper.unmount()
        })
        test('background honours a per-ux background + opacity override', () => {
            const { wrapper } = mountUx({
                ux: { background: '#abcdef', background_opacity: 1 },
            })
            expect(wrapper.vm.background).toBe('#abcdefff')
            wrapper.unmount()
        })
        test('inactive_btn_color falls back to colors.grid', () => {
            const { wrapper } = mountUx()
            expect(wrapper.vm.inactive_btn_color).toBe(COLORS.grid)
            wrapper.unmount()
        })
        test('inactive_btn_color honours a per-ux override', () => {
            const { wrapper } = mountUx({ ux: { inactive_btn_color: '#ff0000' } })
            expect(wrapper.vm.inactive_btn_color).toBe('#ff0000')
            wrapper.unmount()
        })
        test('wrapper computed exposes x/y plus pin_x/pin_y', () => {
            const { wrapper } = mountUx({ ux: { pin: [10, 20], pin_position: '0,0' } })
            wrapper.vm.update_position()
            const w = wrapper.vm.wrapper
            expect(w.x).toBe(wrapper.vm.x)
            expect(w.pin_x).toBe(wrapper.vm.x - wrapper.vm.ox)
            expect(w.pin_y).toBe(wrapper.vm.y - wrapper.vm.oy)
            wrapper.unmount()
        })
        test('pin_pos splits pin_position and defaults when absent', () => {
            const a = mountUx({ ux: { pin_position: '2,3' } })
            expect(a.wrapper.vm.pin_pos).toEqual(['2', '3'])
            a.wrapper.unmount()
            const b = mountUx({ ux: { pin_position: undefined } })
            expect(b.wrapper.vm.pin_pos).toEqual(['0', '0'])
            b.wrapper.unmount()
        })
        test('ox/oy are undefined when pin_pos is malformed', () => {
            const { wrapper } = mountUx({ ux: { pin_position: '1,2,3' } })
            expect(wrapper.vm.ox).toBeUndefined()
            expect(wrapper.vm.oy).toBeUndefined()
            wrapper.unmount()
        })
    })
})

// ---------------------------------------------------------------------------
// ToolbarItem.vue
// ---------------------------------------------------------------------------

const TB_CONFIG = { TOOLBAR: 57, TB_ICON: 25, TB_ITEM_M: 6, TB_ICON_BRI: 1, TB_ICON_HOLD: 420 }
const TB_COLORS = { grid: '#444444', back: '#222222' }

function mountTbItem(data, props = {}) {
    return mount(ToolbarItem, {
        props: {
            data,
            selected: false,
            colors: TB_COLORS,
            tv_id: 'tv',
            config: TB_CONFIG,
            dc: { tool: null },
            subs: {},
            ...props,
        },
        global: { stubs: { ItemList: true } },
    })
}

describe('ToolbarItem.vue', () => {
    beforeEach(() => { vi.useRealTimers() })
    afterEach(() => { vi.useRealTimers() })

    test('renders an icon with the data.icon background image', () => {
        const w = mountTbItem({ type: 'Cursor', icon: 'cursor.png' })
        const icon = w.find('.trading-vue-tbicon')
        expect(icon.exists()).toBe(true)
        expect(icon.attributes('style')).toContain('cursor.png')
        w.unmount()
    })

    test('applies the selected-item class when selected', () => {
        const w = mountTbItem({ type: 'Cursor', icon: 'c' }, { selected: true })
        expect(w.find('.trading-vue-tbitem').classes()).toContain('selected-item')
        w.unmount()
    })

    test('no expand arrow for a plain (non-group) item', () => {
        const w = mountTbItem({ type: 'Cursor', icon: 'c' })
        expect(w.find('.trading-vue-tbitem-exp').exists()).toBe(false)
        w.unmount()
    })

    test('group items render the expand arrow', () => {
        const w = mountTbItem({
            group: 'Lines', icon: 'l',
            items: [{ type: 'LineTool:seg', icon: 's' }, { type: 'LineTool:ray', icon: 'r' }],
        })
        expect(w.find('.trading-vue-tbitem-exp').exists()).toBe(true)
        w.unmount()
    })

    test('mounted() preselects the sub_item from subs[group]', () => {
        const w = mountTbItem(
            { group: 'Lines', icon: 'l', items: [
                { type: 'LineTool:seg', icon: 's' },
                { type: 'LineTool:ray', icon: 'r' },
            ] },
            { subs: { Lines: 'LineTool:ray' } },
        )
        expect(w.vm.sub_item).toEqual({ type: 'LineTool:ray', icon: 'r' })
        // icon_style then reflects the sub_item icon, not the group icon
        expect(w.vm.icon_style['background-image']).toContain('r')
        w.unmount()
    })

    test('emit_selected emits the plain item directly', () => {
        const w = mountTbItem({ type: 'Cursor', icon: 'c' })
        // click_start defaults to undefined -> now() - NaN is NaN, never > HOLD,
        // so the click goes through.
        w.vm.emit_selected('click')
        expect(w.emitted('item-selected').pop()).toEqual([{ type: 'Cursor', icon: 'c' }])
        w.unmount()
    })

    test('emit_selected for a group emits sub_item, else first item', () => {
        const items = [{ type: 'LineTool:seg', icon: 's' }, { type: 'LineTool:ray', icon: 'r' }]
        // no sub_item -> falls back to items[0]
        const w = mountTbItem({ group: 'Lines', icon: 'l', items })
        w.vm.emit_selected('click')
        expect(w.emitted('item-selected').pop()).toEqual([items[0]])
        // with a chosen sub_item
        w.vm.sub_item = items[1]
        w.vm.emit_selected('click')
        expect(w.emitted('item-selected').pop()).toEqual([items[1]])
        w.unmount()
    })

    test('emit_selected is suppressed when a hold-expand fired (long press)', () => {
        const w = mountTbItem({ type: 'Cursor', icon: 'c' })
        // Simulate a long press: click_start far enough in the past that
        // now() - click_start > TB_ICON_HOLD.
        w.vm.click_start = Date.now() - (TB_CONFIG.TB_ICON_HOLD + 1000)
        w.vm.emit_selected('click')
        expect(w.emitted('item-selected')).toBeUndefined()
        w.unmount()
    })

    test('mousedown schedules the hold-expand after TB_ICON_HOLD', () => {
        vi.useFakeTimers()
        const w = mountTbItem({
            group: 'Lines', icon: 'l',
            items: [{ type: 'LineTool:seg', icon: 's' }],
        })
        w.vm.mousedown({})
        expect(w.vm.show_exp_list).toBe(false)
        vi.advanceTimersByTime(TB_CONFIG.TB_ICON_HOLD + 1)
        expect(w.vm.show_exp_list).toBe(true)
        w.unmount()
        vi.useRealTimers()
    })

    test('emit_selected clears the pending hold timer', () => {
        vi.useFakeTimers()
        const w = mountTbItem({
            group: 'Lines', icon: 'l',
            items: [{ type: 'LineTool:seg', icon: 's' }],
        })
        w.vm.mousedown({})
        w.vm.click_start = Date.now() // fresh => not a long press
        w.vm.emit_selected('click')
        // Advancing past HOLD must NOT expand because the timer was cleared.
        vi.advanceTimersByTime(TB_CONFIG.TB_ICON_HOLD + 1)
        expect(w.vm.show_exp_list).toBe(false)
        w.unmount()
        vi.useRealTimers()
    })

    test('exp_click toggles the fly-out list for a group and stops propagation', () => {
        const w = mountTbItem({
            group: 'Lines', icon: 'l',
            items: [{ type: 'LineTool:seg', icon: 's' }],
        })
        let stopped = false
        const e = { stopPropagation: () => { stopped = true } }
        w.vm.exp_click(e)
        expect(stopped).toBe(true)
        expect(w.vm.show_exp_list).toBe(true)
        w.vm.exp_click(e)
        expect(w.vm.show_exp_list).toBe(false)
        w.unmount()
    })

    test('exp_click is a no-op for a non-group item', () => {
        const w = mountTbItem({ type: 'Cursor', icon: 'c' })
        let stopped = false
        w.vm.exp_click({ stopPropagation: () => { stopped = true } })
        expect(stopped).toBe(false)
        expect(w.vm.show_exp_list).toBe(false)
        w.unmount()
    })

    test('expmousedown stops propagation only while the list is open', () => {
        const w = mountTbItem({
            group: 'Lines', icon: 'l',
            items: [{ type: 'LineTool:seg', icon: 's' }],
        })
        let stopped = false
        const e = { stopPropagation: () => { stopped = true } }
        w.vm.expmousedown(e)            // list closed -> no stop
        expect(stopped).toBe(false)
        w.vm.show_exp_list = true
        w.vm.expmousedown(e)            // list open -> stop
        expect(stopped).toBe(true)
        w.unmount()
    })

    test('expmouseover/expmouseleave toggle exp_hover', () => {
        const w = mountTbItem({ type: 'Cursor', icon: 'c' })
        expect(w.vm.exp_hover).toBe(false)
        w.vm.expmouseover()
        expect(w.vm.exp_hover).toBe(true)
        w.vm.expmouseleave()
        expect(w.vm.exp_hover).toBe(false)
        w.unmount()
    })

    test('emit_selected_sub re-emits and records the chosen sub_item', () => {
        const w = mountTbItem({
            group: 'Lines', icon: 'l',
            items: [{ type: 'LineTool:seg', icon: 's' }],
        })
        const item = { type: 'LineTool:ray', icon: 'r' }
        w.vm.emit_selected_sub(item)
        expect(w.emitted('item-selected').pop()).toEqual([item])
        expect(w.vm.sub_item).toEqual(item)
        w.unmount()
    })

    test('close_list hides the fly-out', () => {
        const w = mountTbItem({
            group: 'Lines', icon: 'l',
            items: [{ type: 'LineTool:seg', icon: 's' }],
        })
        w.vm.show_exp_list = true
        w.vm.close_list()
        expect(w.vm.show_exp_list).toBe(false)
        w.unmount()
    })

    describe('style computeds', () => {
        test('item_style derives width/height from TB_ICON + margins', () => {
            const w = mountTbItem({ type: 'Cursor', icon: 'c' })
            const s = w.vm.item_style
            // s = TB_ICON + TB_ITEM_M*2 = 25 + 12 = 37
            expect(s.width).toBe('37px')
            expect(s.height).toBe('37px')
            expect(s['border-radius']).toContain('3px')
            w.unmount()
        })
        test('item_style uses the splitter style for System:Splitter', () => {
            const w = mountTbItem({ type: 'System:Splitter' })
            const s = w.vm.item_style
            expect(s.height).toBe('1px')
            expect(s['background-color']).toBe(TB_COLORS.grid)
            w.unmount()
        })
        test('icon_style is empty for System:Splitter', () => {
            const w = mountTbItem({ type: 'System:Splitter' })
            expect(w.vm.icon_style).toEqual({})
            w.unmount()
        })
        test('exp_style transform flips when the list is open', () => {
            const w = mountTbItem({
                group: 'Lines', icon: 'l',
                items: [{ type: 'LineTool:seg', icon: 's' }],
            })
            expect(w.vm.exp_style.transform).toBe('scaleX(0.6)')
            w.vm.show_exp_list = true
            expect(w.vm.exp_style.transform).toBe('scale(-0.6, 1)')
            w.unmount()
        })
        test('item_style border-radius collapses while exp_hover is set', () => {
            const w = mountTbItem({
                group: 'Lines', icon: 'l',
                items: [{ type: 'LineTool:seg', icon: 's' }],
            })
            expect(w.vm.item_style['border-radius']).toBe('3px 3px 3px 3px')
            w.vm.exp_hover = true
            expect(w.vm.item_style['border-radius']).toBe('3px 0px 0px 3px')
            w.unmount()
        })
    })

    test('beforeUnmount clears any pending hold timer', () => {
        vi.useFakeTimers()
        const w = mountTbItem({
            group: 'Lines', icon: 'l',
            items: [{ type: 'LineTool:seg', icon: 's' }],
        })
        w.vm.mousedown({})
        w.unmount()
        // The timer was cleared on unmount; advancing must not throw.
        expect(() => vi.advanceTimersByTime(TB_CONFIG.TB_ICON_HOLD + 1)).not.toThrow()
        vi.useRealTimers()
    })

    test('a real click event drives emit_selected via the template handler', async () => {
        const w = mountTbItem({ type: 'Cursor', icon: 'c' })
        await w.find('.trading-vue-tbitem').trigger('click')
        expect(w.emitted('item-selected').pop()).toEqual([{ type: 'Cursor', icon: 'c' }])
        w.unmount()
    })
})

// ---------------------------------------------------------------------------
// Sidebar.vue — render-guard branch (no renderer needed)
// ---------------------------------------------------------------------------

describe('Sidebar.vue (standalone render guards)', () => {
    function mountSidebar(layout) {
        return mount(Sidebar, {
            props: {
                sub: [], layout, range: [0, 10], interval: 60000,
                cursor: {}, colors: COLORS, font: '11px sans',
                width: 60, height: 400, grid_id: 0, rerender: 0,
                y_transform: null, tv_id: 'tv', config: CONFIG, shaders: [],
            },
        })
    }

    test('renders the loading placeholder when the layout grid is absent', () => {
        const w = mountSidebar({ grids: {} }) // no grids[0]
        expect(w.find('.trading-vue-sidebar-loading').exists()).toBe(true)
        expect(w.vm.renderer).toBeFalsy()
        w.unmount()
    })

    test('rangeKey / layoutKey / yTransformKey hash the relevant props', () => {
        const w = mountSidebar({ grids: {} })
        expect(w.vm.rangeKey).toBe('0,10')
        expect(w.vm.layoutKey).toBe('') // no grid yet
        expect(w.vm.yTransformKey).toBe('') // null y_transform
        w.unmount()
    })

    test('rangeKey is empty for a malformed range', async () => {
        const w = mountSidebar({ grids: {} })
        await w.setProps({ range: [5] })
        expect(w.vm.rangeKey).toBe('')
        w.unmount()
    })

    test('layoutKey reflects a present grid', async () => {
        const w = mountSidebar({ grids: {} })
        await w.setProps({ layout: { grids: { 0: { sb: 60, height: 400, offset: 0, width: 700 } } } })
        expect(w.vm.layoutKey).toBe('60,400,0,700')
        w.unmount()
    })

    test('yTransformKey hashes zoom/auto/range', async () => {
        const w = mountSidebar({ grids: {} })
        await w.setProps({ y_transform: { zoom: 1.5, auto: true, range: [10, 20] } })
        expect(w.vm.yTransformKey).toBe('1.5,true,10,20')
        w.unmount()
    })
})

// ---------------------------------------------------------------------------
// Botbar.vue — render-guard branch + bot_shaders filter (no renderer needed)
// ---------------------------------------------------------------------------

describe('Botbar.vue (standalone render guards)', () => {
    function mountBotbar(layout, extra = {}) {
        return mount(Botbar, {
            props: {
                sub: [], layout, range: [0, 10], interval: 60000,
                cursor: {}, colors: COLORS, font: '11px sans',
                width: 800, height: 28, rerender: 0, tv_id: 'tv',
                config: CONFIG, shaders: [], timezone: 0, ...extra,
            },
        })
    }

    test('renders the loading placeholder when botbar layout is absent', () => {
        const w = mountBotbar({})
        expect(w.find('.trading-vue-botbar-loading').exists()).toBe(true)
        expect(w.vm.renderer).toBeFalsy()
        w.unmount()
    })

    test('bot_shaders keeps only target === "botbar" entries', () => {
        const shaders = [
            { target: 'botbar', id: 'a' },
            { target: 'sidebar', id: 'b' },
            { target: 'botbar', id: 'c' },
        ]
        const w = mountBotbar({}, { shaders })
        expect(w.vm.bot_shaders.map(s => s.id)).toEqual(['a', 'c'])
        w.unmount()
    })

    test('bot_shaders tolerates an undefined shaders prop', () => {
        const w = mountBotbar({}, { shaders: undefined })
        expect(w.vm.bot_shaders).toEqual([])
        w.unmount()
    })

    test('rangeKey + layoutKey computed hashes', async () => {
        const w = mountBotbar({})
        expect(w.vm.rangeKey).toBe('0,10')
        expect(w.vm.layoutKey).toBe('') // no botbar yet
        await w.setProps({ layout: { botbar: { width: 800, height: 28, offset: 472 } } })
        expect(w.vm.layoutKey).toBe('800,28,472')
        w.unmount()
    })
})

// ---------------------------------------------------------------------------
// Grid.vue (+ Sidebar/Botbar live renderers) via the full chart harness
// ---------------------------------------------------------------------------
//
// Mount the real TradingVue so the Grid renderer + sidebar/botbar canvases boot.
// We then exercise the framework-side behaviour (tool registration, overlay
// distribution, dblclick events, layer add/remove) on the live Grid instance.

describe('Grid.vue (live, via TradingVue harness)', () => {
    let wrapper
    beforeEach(() => installCanvasEnv())
    afterEach(() => { if (wrapper) wrapper.unmount(); uninstallCanvasEnv() })

    function makeChart() {
        const T0 = 1_600_000_000_000
        const ohlcv = Array.from({ length: 120 }, (_, i) =>
            [T0 + i * 60000, 100, 101, 99, 100, 5])
        const onchart = [{
            name: 'EMA, 20', type: 'Spline',
            data: ohlcv.map(c => [c[0], c[4]]),
            settings: { color: '#35c' },
        }]
        return new DataCube({ ohlcv, onchart }, { scripts: false, validation: 'off' })
    }

    async function mountChart() {
        const dc = makeChart()
        wrapper = mount(TradingVue, {
            props: { data: dc, width: 800, height: 500 },
            attachTo: document.body,
        })
        await settle()
        return dc
    }

    test('the main Grid boots a renderer and distributes overlays', async () => {
        await mountChart()
        const grids = wrapper.findAllComponents({ name: 'Grid' })
        expect(grids.length).toBeGreaterThan(0)
        const grid0 = grids[0]
        expect(grid0.vm.renderer).toBeTruthy()
        // get_overlays() returns VNodes; each carries the resolved overlay
        // component (vnode.type) + the per-overlay props (vnode.props). Assert
        // the registry mapped data.type -> the RIGHT component (Candles for the
        // ohlcv main, Spline for the EMA onchart) and produced unique layer ids.
        const comps = grid0.vm.get_overlays()
        const byType = comps.map(v => ({
            comp: v.type.name, type: v.props.type, id: v.props.id,
        }))
        const candles = byType.find(c => c.type === 'Candles')
        const spline = byType.find(c => c.type === 'Spline')
        expect(candles).toBeTruthy()
        expect(candles.comp).toBe('Candles')
        expect(spline).toBeTruthy()
        expect(spline.comp).toBe('Spline')
        // ids are `${type}_${n}` and must be unique per layer
        const ids = byType.map(c => c.id)
        expect(new Set(ids).size).toBe(ids.length)
        expect(ids).toContain('Candles_0')
        expect(ids).toContain('Spline_0')
    })

    test('Grid registers drawing tools via a custom-event on creation', async () => {
        await mountChart()
        const grid0 = wrapper.findAllComponents({ name: 'Grid' })[0]
        const evs = grid0.emitted('custom-event') || []
        const reg = evs.map(e => e[0]).find(e => e.event === 'register-tools')
        expect(reg).toBeTruthy()
        expect(Array.isArray(reg.args)).toBe(true)
        // The built-in tool overlays (LineTool, RangeTool) expose tool() metadata,
        // so the registration must actually carry their tool descriptors — not be
        // an empty array. Each entry is { use_for: [...], info: {...} }.
        expect(reg.args.length).toBeGreaterThan(0)
        for (const t of reg.args) {
            expect(Array.isArray(t.use_for)).toBe(true)
            expect(t.use_for.length).toBeGreaterThan(0)
            expect(t.info).toBeTruthy()
            // tool() descriptors carry a stable `type` + `group` for the toolbar.
            expect(typeof t.info.type).toBe('string')
            expect(typeof t.info.group).toBe('string')
        }
        // The overlays advertise themselves via use_for(): ['LineTool'] / ['RangeTool'].
        const useFors = reg.args.flatMap(t => t.use_for)
        expect(useFors).toContain('LineTool')
        expect(useFors).toContain('RangeTool')
        // and their toolbar groups come straight from tool().group.
        const line = reg.args.find(t => t.use_for.includes('LineTool'))
        const range = reg.args.find(t => t.use_for.includes('RangeTool'))
        expect(line.info.group).toBe('Lines')
        expect(range.info.group).toBe('Measurements')
    })

    test('is_active reflects cursor presence on this grid', async () => {
        await mountChart()
        const grid0 = wrapper.findAllComponents({ name: 'Grid' })[0]
        expect(grid0.vm.is_active).toBe(false) // cursor.t undefined initially
        const id = grid0.vm.$props.grid_id
        // The cursor prop is a live reactive object shared with the chart;
        // mutate it in place and let Vue recompute the is_active getter.
        const cursor = grid0.vm.$props.cursor
        cursor.t = 123
        cursor.grid_id = id
        await nextTick()
        expect(grid0.vm.is_active).toBe(true)
        cursor.grid_id = id + 99
        await nextTick()
        expect(grid0.vm.is_active).toBe(false) // different grid
    })

    test('dataKey hashes length / first / last / dataVersion', async () => {
        await mountChart()
        const grid0 = wrapper.findAllComponents({ name: 'Grid' })[0]
        const data = grid0.vm.$props.data
        const key = grid0.vm.dataKey
        const parts = key.split(',')
        // 4 comma-separated fields: len,first,last,dataVersion
        expect(parts.length).toBe(4)
        // len === number of overlays distributed to this grid (Candles + Spline).
        const len = data.length
        expect(Number(parts[0])).toBe(len)
        // first/last are the FIRST overlay's first ts and the LAST overlay's last ts.
        const first = data[0].data[0][0]
        const lastOv = data[len - 1].data
        const last = lastOv[lastOv.length - 1][0]
        expect(Number(parts[1])).toBe(first)
        expect(Number(parts[2])).toBe(last)
        expect(parts[3]).toBe('0') // dataVersion defaults to 0
        // Pin the EXACT hash so a refactor that reorders/changes fields is caught.
        expect(key).toBe(`${len},${first},${last},0`)
    })

    test('on_dblclick on the main grid emits minimize-all-offcharts', async () => {
        await mountChart()
        const grid0 = wrapper.findAllComponents({ name: 'Grid' })[0]
        grid0.vm.on_dblclick({})
        const evs = (grid0.emitted('custom-event') || []).map(e => e[0])
        const min = evs.find(e => e.event === 'minimize-all-offcharts')
        expect(min).toBeTruthy()
        // The main grid (id 0) takes the minimize-ALL branch with no args (it is
        // NOT the per-grid 'grid-dblclick' branch reserved for off-chart panes).
        expect(min.args).toEqual([])
        expect(evs.some(e => e.event === 'grid-dblclick')).toBe(false)
    })

    test('new_layer forwards the layer object straight to a ready renderer', async () => {
        await mountChart()
        const grid0 = wrapper.findAllComponents({ name: 'Grid' })[0]
        // Renderer is ready, so the queue path is bypassed and pendingLayers stays
        // empty; the exact layer object must reach renderer.new_layer untouched.
        const spy = vi.spyOn(grid0.vm.renderer, 'new_layer')
        const layer = { name: 'X', type: 'spline', data: [] }
        grid0.vm.new_layer(layer)
        expect(spy).toHaveBeenCalledTimes(1)
        expect(spy.mock.calls[0][0]).toBe(layer)
        expect(grid0.vm.pendingLayers).toEqual([])
        spy.mockRestore()
    })

    test('new_layer QUEUES into pendingLayers when no renderer is present', async () => {
        await mountChart()
        const grid0 = wrapper.findAllComponents({ name: 'Grid' })[0]
        // Drop the renderer to force the deferred-queue branch.
        grid0.vm.renderer = null
        const a = { name: 'A', type: 'spline', data: [] }
        const b = { name: 'B', type: 'spline', data: [] }
        grid0.vm.new_layer(a)
        grid0.vm.new_layer(b)
        expect(grid0.vm.pendingLayers).toEqual([a, b])
    })

    test('del_layer drops the renderer layer + emits scoped cleanup events', async () => {
        await mountChart()
        const grid0 = wrapper.findAllComponents({ name: 'Grid' })[0]
        const gid = grid0.vm.$props.grid_id
        const delSpy = vi.spyOn(grid0.vm.renderer, 'del_layer')
        grid0.vm.del_layer('Spline_0')
        // The live renderer must be asked to remove the named layer...
        expect(delSpy).toHaveBeenCalledWith('Spline_0')
        // ...and the cleanup events must carry [grid_id, layer] so the parent
        // can scope shader/meta removal to the right grid + layer.
        const evs = (grid0.emitted('custom-event') || []).map(e => e[0])
        const shaders = evs.find(e => e.event === 'remove-shaders')
        const meta = evs.find(e => e.event === 'remove-layer-meta')
        expect(shaders).toBeTruthy()
        expect(shaders.args).toEqual([gid, 'Spline_0'])
        expect(meta).toBeTruthy()
        expect(meta.args).toEqual([gid, 'Spline_0'])
        delSpy.mockRestore()
    })

    test('the Sidebar + Botbar boot live renderers under the chart', async () => {
        await mountChart()
        const sb = wrapper.findAllComponents({ name: 'Sidebar' })[0]
        const bb = wrapper.findAllComponents({ name: 'Botbar' })[0]
        expect(sb && sb.vm.renderer).toBeTruthy()
        expect(bb && bb.vm.renderer).toBeTruthy()
        // Botbar tracks the LIVE layout object, not a construction snapshot.
        const chart = wrapper.vm.$refs.chart
        bb.vm.redraw()
        expect(bb.vm.renderer.layout).toBe(chart.chartLayout)
    })
})
