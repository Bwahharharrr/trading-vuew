// @vitest-environment jsdom
//
// Guard for the Y-axis last-price TAG shader registration (fix #3).
//
// price.js registers a target:'sidebar' shader via the overlay mixin's
// custom_event (NOT raw $emit, which had no listener after the Vue-3 migration).
// This pins that EXACTLY ONE sidebar price-tag shader is registered, and that it
// does not duplicate across live ticks (init_shader's one-shot guard + matching
// register/remove ids).
import { test, expect, describe, beforeEach, afterEach } from 'vitest'
import TradingVue from '../../src/TradingVue.vue'
import DataCube from '../../src/helpers/datacube.js'
import { mount, installCanvasEnv, uninstallCanvasEnv, settle } from './_component-harness.js'

function seed() {
  const T0 = 1_600_000_000_000
  const ohlcv = Array.from({ length: 40 }, (_, i) => {
    const t = T0 + i * 60000
    const base = 100 + Math.sin(i / 5) * 5
    return [t, base, base + 3, base - 3, base + 0.5, 100 + i]
  })
  return new DataCube({ ohlcv })
}

function sidebarShaders(wrapper) {
  const sections = wrapper.findAllComponents({ name: 'GridSection' })
  let count = 0
  for (const s of sections) {
    const sh = s.vm.shaders || []
    count += sh.filter(x => x && x.target === 'sidebar' && typeof x.draw === 'function').length
  }
  return count
}

describe('sidebar last-price tag shader registration', () => {
  let wrapper, dc
  beforeEach(() => { installCanvasEnv() })
  afterEach(() => { if (wrapper) wrapper.unmount(); uninstallCanvasEnv() })

  test('registers exactly one sidebar shader and never duplicates on ticks', async () => {
    dc = seed()
    wrapper = mount(TradingVue, { props: { data: dc, width: 600, height: 400 }, attachTo: document.body })
    await settle(6)

    // The price line's first static draw lazily registers the sidebar tag shader.
    expect(sidebarShaders(wrapper)).toBe(1)

    // Several in-place ticks must NOT re-register / duplicate it.
    const arr = dc.data.chart.data
    for (let k = 0; k < 5; k++) {
      const i = arr.length - 1
      const [t, o, h, l, , v] = arr[i]
      arr[i] = [t, o, h, l, l + (k % 3) + 0.5, v]
      dc.touchData()
      await settle(4)
    }
    expect(sidebarShaders(wrapper)).toBe(1)
  })
})
