// @vitest-environment jsdom
import { test, expect, describe, afterEach } from 'vitest'
import TradingVue from '../../src/TradingVue.vue'
import DataCube from '../../src/helpers/datacube.js'
import { defineOverlay } from '../../src/api/defineOverlay.js'
import { defineTool } from '../../src/api/defineTool.js'
import { mount, installCanvasEnv, uninstallCanvasEnv, settle } from './_component-harness.js'

describe('defineOverlay / defineTool (Phase 4.1)', () => {
  let wrapper
  afterEach(() => { if (wrapper) { wrapper.unmount(); wrapper = null } uninstallCanvasEnv() })

  test('config is validated at definition time (clear errors)', () => {
    expect(() => defineOverlay({})).toThrow(/useFor/)
    expect(() => defineOverlay({ useFor: [] , draw() {} })).toThrow(/useFor/)
    expect(() => defineOverlay({ useFor: ['X'] })).toThrow(/draw/)
    expect(() => defineTool({ useFor: ['X'], draw() {} })).toThrow(/type/)
  })

  test('produces a registry-compatible component (use_for/draw/meta)', () => {
    const o = defineOverlay({ name: 'O', useFor: ['EMA', 'SMA'], meta: { author: 'a', version: '1.0.0' }, draw() {} })
    expect(o.name).toBe('O')
    expect(o.methods.use_for()).toEqual(['EMA', 'SMA'])
    expect(typeof o.methods.draw).toBe('function')
    expect(o.methods.meta_info()).toEqual({ author: 'a', version: '1.0.0' })
  })

  test('a defineOverlay overlay renders in a mounted chart (no mixin, config only)', async () => {
    installCanvasEnv()
    let drew = 0
    const MyLine = defineOverlay({
      name: 'MyLine',
      useFor: ['MYLINE'],
      meta: { author: 't', version: '1.0.0' },
      draw(ctx, $) {
        drew++
        $.setupStroke(ctx, 1, $.colors.colorCandleUp || '#fff')
        ctx.beginPath()
        $.drawDataLine(ctx, $.data, 1)
        ctx.stroke()
      },
    })
    const T0 = 1_600_000_000_000
    const ohlcv = Array.from({ length: 30 }, (_, i) => [T0 + i * 60000, 100 + i, 101 + i, 99 + i, 100.5 + i, 10])
    const onchart = [{ name: 'My line', type: 'MYLINE', data: ohlcv.map((c) => [c[0], c[4]]), settings: {} }]
    const dc = new DataCube({ ohlcv, onchart }, { scripts: false, validation: 'off' })

    wrapper = mount(TradingVue, {
      props: { data: dc, width: 600, height: 400, overlays: [MyLine] },
      attachTo: document.body,
    })
    await settle()
    // The custom overlay's draw fired → it was registered, matched, and rendered.
    expect(drew).toBeGreaterThan(0)
  })

  test('defineTool produces a tool() descriptor + Tool wiring', () => {
    const t = defineTool({ name: 'Seg', type: 'MySeg', hint: 'My segment', icon: 'x', draw() {} })
    expect(t.methods.use_for()).toEqual(['MySeg'])
    const desc = t.methods.tool()
    expect(desc.type).toBe('MySeg')
    expect(desc.hint).toBe('My segment')
  })

  test('defineTool routes init_tool → init (does NOT clobber the Tool mixin wiring)', () => {
    let ran = false
    const t = defineTool({ name: 'T', type: 'T', icon: 'x', draw() {}, init_tool() { ran = true } })
    // The mixin's init_tool must NOT be overridden at the component level…
    expect(t.methods.init_tool).toBeUndefined()
    // …and the author's hook runs via init instead.
    expect(typeof t.methods.init).toBe('function')
    t.methods.init.call({})
    expect(ran).toBe(true)
  })

  test('defineOverlay def.settings provides defaults in the RenderContext', () => {
    let seen
    const o = defineOverlay({
      name: 'D', useFor: ['D'], draw(ctx, $) { seen = $.settings },
      settings: { lineWidth: 2, color: '#abc' },
    })
    // Simulate a mounted overlay: live prop settings override the defaults.
    const fakeVm = { $props: { settings: { color: '#fff' } }, sett: { color: '#fff' } }
    const ctx = o.methods.$ctx.call(fakeVm)
    expect(ctx.settings.lineWidth).toBe(2)        // default applied
    expect(ctx.settings.color).toBe('#fff')        // live prop wins
  })
})

describe('M31 — tool() returns a fresh descriptor (preset merges must not pollute the config)', () => {
  test('mutating one call result leaves the next call pristine', async () => {
    const { defineTool } = await import('../../src/api/defineTool.js')
    const Tool = defineTool({
      name: 'PT', type: 'PT', icon: 'i.png',
      settings: { color: '#f00' },
      mods: { Extended: { settings: { ray: true } } },
      draw() {},
    })
    const a = Tool.methods.tool()
    // register_tools-style preset merge mutates the returned descriptor
    Object.assign(a.settings, { color: '#0f0', preset: 1 })
    a.mods.Extended.settings.polluted = true
    const b = Tool.methods.tool()
    expect(b.settings).toEqual({ color: '#f00' })          // author config intact
    expect(b.mods.Extended.settings).toEqual({ ray: true })
  })
})
