// @vitest-environment jsdom
import { test, expect, describe, afterEach } from 'vitest'
import { ref } from 'vue'
import TradingVue from '../../src/TradingVue.vue'
import DataCube from '../../src/helpers/datacube.js'
import { useChart, useRange, useCursor, useData } from '../../src/composables/useChart.js'
import { mount, installCanvasEnv, uninstallCanvasEnv, settle } from './_component-harness.js'

function seed() {
  const T0 = 1_600_000_000_000
  const ohlcv = Array.from({ length: 60 }, (_, i) => [T0 + i * 60000, 100 + i, 101 + i, 99 + i, 100.5 + i, 10])
  return { T0, last: T0 + 59 * 60000, ohlcv }
}

describe('goto / setRange bounds validation (resolves the TODO)', () => {
  let wrapper
  afterEach(() => { if (wrapper) { wrapper.unmount(); wrapper = null } uninstallCanvasEnv() })

  async function mountChart() {
    installCanvasEnv()
    const s = seed()
    const dc = new DataCube({ ohlcv: s.ohlcv }, { scripts: false, validation: 'off' })
    wrapper = mount(TradingVue, { props: { data: dc, width: 600, height: 400 }, attachTo: document.body })
    await settle()
    return { vm: wrapper.vm, ...s }
  }

  test('goto out-of-range is clamped + returns a typed diagnostic', async () => {
    const { vm, T0 } = await mountChart()
    const r = vm.goto(T0 - 1_000_000_000) // way before data
    expect(r.ok).toBe(false)
    expect(r.diagnostics[0].code).toBe('nav.goto.out_of_range')
  })

  test('goto in-range succeeds with no diagnostics', async () => {
    const { vm, T0 } = await mountChart()
    const r = vm.goto(T0 + 30 * 60000)
    expect(r.ok).toBe(true)
    expect(r.diagnostics).toEqual([])
  })

  test('setRange reversed is swapped + diagnosed', async () => {
    const { vm, T0, last } = await mountChart()
    const r = vm.setRange(last, T0) // reversed
    expect(r.diagnostics.some((d) => d.code === 'nav.range.reversed')).toBe(true)
  })

  test('setRange over-scrolling past the edge is allowed (no diagnostics)', async () => {
    const { vm, T0, last } = await mountChart()
    const r = vm.setRange(T0 + 40 * 60000, last + 10 * 60000) // partly past the edge
    expect(r.ok).toBe(true)
    expect(r.diagnostics).toEqual([])
  })
})

describe('use*() composables', () => {
  let wrapper
  afterEach(() => { if (wrapper) { wrapper.unmount(); wrapper = null } uninstallCanvasEnv() })

  test('useChart drives the chart off-$refs (goto/getRange delegate)', async () => {
    installCanvasEnv()
    const s = seed()
    const dc = new DataCube({ ohlcv: s.ohlcv }, { scripts: false, validation: 'off' })
    const tv = ref(null)
    wrapper = mount(TradingVue, { props: { data: dc, width: 600, height: 400 }, attachTo: document.body })
    tv.value = wrapper.vm
    await settle()
    const chart = useChart(tv)
    expect(chart.goto(s.T0 + 30 * 60000).ok).toBe(true)
    expect(Array.isArray(chart.getRange())).toBe(true)
    expect(chart.instance()).toBe(wrapper.vm)
  })

  test('useRange exposes a reactive range ref synced via onRangeChanged', () => {
    const { range, onRangeChanged } = useRange(ref(null))
    expect(range.value).toBe(null)
    onRangeChanged([1000, 2000])
    expect(range.value).toEqual([1000, 2000])
  })

  test('useCursor exposes a reactive cursor ref', () => {
    const { cursor, onCursorChanged } = useCursor(ref(null))
    onCursorChanged({ x: 10, t: 1500 })
    expect(cursor.value).toEqual({ x: 10, t: 1500 })
  })

  test('useData wraps the DataCube read/mutate API', () => {
    const dc = new DataCube({
      ohlcv: seed().ohlcv,
      onchart: [{ name: 'EMA, 20', type: 'EMA', data: [], settings: {} }],
      offchart: [],
    }, { scripts: false, validation: 'off' })
    const data = useData(dc)
    expect(data.getOne('EMA').name).toBe('EMA, 20')
    expect(data.dc()).toBe(dc)
  })

  test('useChart is null-safe before mount', () => {
    const chart = useChart(ref(null))
    expect(chart.getRange()).toBe(null)
    expect(() => chart.goto(123)).not.toThrow()
  })
})
