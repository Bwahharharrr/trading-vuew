// @vitest-environment jsdom
import { test, expect, describe, afterEach, vi } from 'vitest'
import TradingVue from '../../src/TradingVue.vue'
import DataCube from '../../src/helpers/datacube.js'
import { mount, installCanvasEnv, uninstallCanvasEnv, settle } from './_component-harness.js'

function seedDc() {
  const T0 = 1_600_000_000_000
  const ohlcv = Array.from({ length: 60 }, (_, i) => [T0 + i * 60000, 100 + i, 101 + i, 99 + i, 100.5 + i, 10])
  return { T0, last: T0 + 59 * 60000, dc: new DataCube({ ohlcv }, { scripts: false, validation: 'off' }) }
}

async function mountChart(props) {
  installCanvasEnv()
  const wrapper = mount(TradingVue, { props: { width: 600, height: 400, ...props }, attachTo: document.body })
  await settle()
  return wrapper
}

describe('accessibility', () => {
  let wrapper
  afterEach(() => { if (wrapper) { wrapper.unmount(); wrapper = null } uninstallCanvasEnv() })

  test('container has ARIA role/label/describedby + is focusable (default a11y on)', async () => {
    const { dc } = seedDc()
    wrapper = await mountChart({ data: dc })
    const root = wrapper.find('.trading-vue')
    expect(root.attributes('role')).toBe('application')
    expect(root.attributes('aria-roledescription')).toBe('interactive financial chart')
    expect(root.attributes('aria-label')).toContain('financial chart')
    expect(root.attributes('tabindex')).toBe('0')
    expect(root.attributes('aria-describedby')).toBeTruthy()
  })

  test('renders a visually-hidden screen-reader data summary', async () => {
    const { dc } = seedDc()
    wrapper = await mountChart({ data: dc })
    const sr = wrapper.find('.tvjs-sr-only')
    expect(sr.exists()).toBe(true)
    expect(sr.text()).toContain('candles')
    expect(sr.text()).toContain('Latest open')
  })

  test('keyboard ←/→ pans the range; Home/End jump to edges', async () => {
    const { dc, T0, last } = seedDc()
    wrapper = await mountChart({ data: dc })
    const root = wrapper.find('.trading-vue')
    const setRange = vi.spyOn(wrapper.vm, 'setRange')
    const goto = vi.spyOn(wrapper.vm, 'goto')

    await root.trigger('keydown', { key: 'ArrowRight' })
    expect(setRange).toHaveBeenCalled() // panned

    await root.trigger('keydown', { key: 'End' })
    expect(goto).toHaveBeenCalledWith(last)

    await root.trigger('keydown', { key: 'Home' })
    expect(goto).toHaveBeenCalledWith(T0)

    // a non-nav key is ignored
    setRange.mockClear()
    await root.trigger('keydown', { key: 'a' })
    expect(setRange).not.toHaveBeenCalled()
  })

  test('a11y=false opts out entirely (no role/tabindex/summary)', async () => {
    const { dc } = seedDc()
    wrapper = await mountChart({ data: dc, a11y: false })
    expect(wrapper.attributes('role')).toBeUndefined()
    expect(wrapper.attributes('tabindex')).toBeUndefined()
    expect(wrapper.find('.tvjs-sr-only').exists()).toBe(false)
  })
})
