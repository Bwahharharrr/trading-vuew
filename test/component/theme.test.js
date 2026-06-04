// @vitest-environment jsdom
import { test, expect, describe, afterEach, vi } from 'vitest'
import TradingVue from '../../src/TradingVue.vue'
import DataCube from '../../src/helpers/datacube.js'
import { defaultTheme } from '../../src/stuff/theme.js'
import { mount, installCanvasEnv, uninstallCanvasEnv, settle } from './_component-harness.js'

function dc() {
  const T0 = 1_600_000_000_000
  const ohlcv = Array.from({ length: 20 }, (_, i) => [T0 + i * 60000, 100, 101, 99, 100, 10])
  return new DataCube({ ohlcv }, { scripts: false, validation: 'off' })
}

async function mountWith(extraProps) {
  installCanvasEnv()
  const wrapper = mount(TradingVue, {
    props: { data: dc(), width: 400, height: 300, ...extraProps },
    attachTo: document.body,
  })
  await settle()
  return wrapper
}

describe('theme object + flat-prop deprecation shims', () => {
  let wrapper
  afterEach(() => { if (wrapper) { wrapper.unmount(); wrapper = null } uninstallCanvasEnv(); vi.restoreAllMocks() })

  test('default mount resolves colours from the default theme', async () => {
    wrapper = await mountWith({})
    const colors = wrapper.vm.chart_props.colors
    expect(colors.back).toBe(defaultTheme.back)
    expect(colors.candleUp).toBe(defaultTheme.candleUp)
  })

  test('theme prop sets colours', async () => {
    wrapper = await mountWith({ theme: { candleUp: '#aabbcc', back: '#010203' } })
    const colors = wrapper.vm.chart_props.colors
    expect(colors.candleUp).toBe('#aabbcc')
    expect(colors.back).toBe('#010203')
  })

  test('flat colorXxx props still work (deprecated shim) + warn once', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    wrapper = await mountWith({ colorBack: '#0a0b0c' })
    const colors = wrapper.vm.chart_props.colors
    expect(colors.back).toBe('#0a0b0c') // flat prop honoured
    // a deprecation warning was emitted
    expect(warn.mock.calls.some((c) => String(c[0]).includes('colorXxx'))).toBe(true)
    // re-reading the computed does not spam the warning
    const before = warn.mock.calls.length
    void wrapper.vm.chart_props
    expect(warn.mock.calls.length).toBe(before)
  })

  test('theme wins over a conflicting flat prop', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    wrapper = await mountWith({ colorCandleUp: '#111111', theme: { candleUp: '#222222' } })
    expect(wrapper.vm.chart_props.colors.candleUp).toBe('#222222')
  })

  test('no deprecation warning when only theme is used', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    wrapper = await mountWith({ theme: { candleUp: '#abc' } })
    void wrapper.vm.chart_props
    expect(warn.mock.calls.some((c) => String(c[0]).includes('colorXxx'))).toBe(false)
  })

  test('defaultTheme matches the flat-prop defaults', () => {
    // sanity: tokens present + are hex/keyword strings
    expect(defaultTheme.candleDw).toBe('#e54150')
    expect(defaultTheme.wickSm).toBe('transparent')
    expect(Object.keys(defaultTheme).length).toBeGreaterThanOrEqual(15)
  })
})
