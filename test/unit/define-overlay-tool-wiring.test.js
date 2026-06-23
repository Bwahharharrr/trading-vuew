// defineOverlay / defineTool optional-method WIRING (pure node).
//
// These exercise the FACTORY wiring of src/api/defineOverlay.js +
// src/api/defineTool.js directly: how def.* hooks map onto the produced
// component's `methods`, the curated RenderContext threading, the method-spread
// order guard, tool() descriptor defaults, and the init/init_tool composition.
// Distinct from test/component/define-overlay.test.js (which mounts a chart and
// covers validation/rendering); here we bind methods to a fake `this` so no DOM
// is needed — see test/component/position-plot-select.test.js for the pattern.

import { test, expect, describe, vi } from 'vitest'
import { defineOverlay } from '../../src/api/defineOverlay.js'
import { defineTool } from '../../src/api/defineTool.js'

// A minimal stand-in for the mounted overlay vm. The factory-wired methods reach
// for `this.$props`, `this.sett`, and `this.$ctx()` — provide all three, and
// hand back the real `$ctx` so the curated RenderContext is built for us.
function vmFor(component, { settings = {}, sett = {}, colors = {} } = {}) {
  const vm = {
    $props: { settings, colors },
    sett,
  }
  vm.$ctx = component.methods.$ctx.bind(vm)
  return vm
}

describe('defineOverlay optional-method wiring', () => {
  // CASE 1 — dataColors → data_colors, yRange → y_range, both fed the RenderContext.
  test('def.dataColors/def.yRange wired and invoked with the curated RenderContext', () => {
    let dcArgs
    let yrArgs
    const o = defineOverlay({
      useFor: ['X'],
      draw() {},
      settings: { width: 3 },
      dataColors(...a) { dcArgs = a; return ['#111', '#222'] },
      yRange(...a) { yrArgs = a; return [10, 20] },
    })

    expect(typeof o.methods.data_colors).toBe('function')
    expect(typeof o.methods.y_range).toBe('function')

    const vm = vmFor(o, { settings: { color: '#z' }, sett: { color: '#z' }, colors: { u: '#u' } })

    const colors = o.methods.data_colors.call(vm)
    expect(colors).toEqual(['#111', '#222'])
    // Single curated-context arg; def.settings DEFAULTS merged under live sett; colors threaded.
    expect(dcArgs).toHaveLength(1)
    expect(dcArgs[0].settings).toEqual({ width: 3, color: '#z' })
    expect(dcArgs[0].colors).toEqual({ u: '#u' })

    const range = o.methods.y_range.call(vm)
    expect(range).toEqual([10, 20])
    expect(yrArgs).toHaveLength(1)
    expect(yrArgs[0].settings.width).toBe(3)
  })

  // CASE 2 — calc passthrough (verbatim); init/destroy only present when supplied.
  test('def.calc passed verbatim; def.init/def.destroy attached only when supplied', () => {
    const factory = function calcFactory() { return {} }
    const withCalc = defineOverlay({ useFor: ['X'], draw() {}, calc: factory })
    expect(withCalc.methods.calc).toBe(factory)
    // Omitted hooks must not even be keys on the methods object.
    expect('init' in withCalc.methods).toBe(false)
    expect('destroy' in withCalc.methods).toBe(false)

    const withLifecycle = defineOverlay({ useFor: ['X'], draw() {}, init() {}, destroy() {} })
    expect('init' in withLifecycle.methods).toBe(true)
    expect('destroy' in withLifecycle.methods).toBe(true)
    expect(withLifecycle.methods.init).not.toBe(undefined)
    // calc not supplied → not wired.
    expect('calc' in withLifecycle.methods).toBe(false)
  })

  // CASE 3 — name default; computed + extra mixins merged behind [Overlay, CanvasDrawing].
  test('def.name omitted → CustomOverlay; computed + mixins merged in order', () => {
    const extraMixin = { name: 'ExtraMixin' }
    const o = defineOverlay({
      useFor: ['X'],
      draw() {},
      computed: { foo() { return 7 } },
      mixins: [extraMixin],
    })
    expect(o.name).toBe('CustomOverlay')
    // Base Overlay + CanvasDrawing wired first, the author's extra mixin appended last.
    expect(o.mixins).toHaveLength(3)
    expect(o.mixins[o.mixins.length - 1]).toBe(extraMixin)
    // computed keys land on the component.
    expect(typeof o.computed.foo).toBe('function')
    expect(o.computed.foo()).toBe(7)
  })

  // CASE 4 — tool() with NO data/settings/mods → {data:[],settings:{}}, no mods key.
  test('def.tool with no data/settings/mods → empty data/settings and no mods key', () => {
    const o = defineOverlay({ useFor: ['X'], draw() {}, tool: { type: 'T' } })
    const t = o.methods.tool.call({})
    expect(t.data).toEqual([])
    expect(t.settings).toEqual({})
    expect('mods' in t).toBe(false)
    // Carries through the rest of the descriptor verbatim.
    expect(t.type).toBe('T')
  })

  // CASE 5 — method-spread order: a stray def.methods.draw cannot strip the factory draw.
  test('stray def.methods.draw cannot override the factory-wired draw', () => {
    const calls = []
    const o = defineOverlay({
      useFor: ['X'],
      draw(ctx, $) { calls.push({ who: 'factory', ctx, settings: $.settings, colors: $.colors }) },
      methods: { draw() { calls.push({ who: 'stray' }) } },
    })
    const vm = vmFor(o, { settings: { a: 1 }, sett: { a: 1 }, colors: { c: 2 } })
    o.methods.draw.call(vm, 'CTX')
    // Only the factory draw ran; the stray override was clobbered by the factory wiring.
    expect(calls).toHaveLength(1)
    expect(calls[0].who).toBe('factory')
    // Factory draw receives (ctx, RenderContext); the $ exposes settings + colors.
    expect(calls[0].ctx).toBe('CTX')
    expect(calls[0].settings).toEqual({ a: 1 })
    expect(calls[0].colors).toEqual({ c: 2 })
  })
})

describe('defineTool wiring', () => {
  // CASE 6 — no icon warns exactly once (/no .?icon/) and still yields a valid component.
  test('defineTool with no icon warns once and still produces a tool() descriptor', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    try {
      const t = defineTool({ type: 'NoIcon', draw() {} })
      const iconWarns = warn.mock.calls.map(c => String(c[0])).filter(m => /no .?icon/.test(m))
      expect(iconWarns).toHaveLength(1)
      // Still a usable component with a real tool descriptor.
      expect(typeof t.methods.tool).toBe('function')
      const desc = t.methods.tool.call({})
      expect(desc.type).toBe('NoIcon')
      expect(desc.icon).toBeUndefined()
    } finally {
      warn.mockRestore()
    }
  })

  // CASE 7 — init + init_tool compose (init first, then init_tool); init-only is identity.
  test('def.init then def.init_tool compose in order; def.init only → no composition', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    try {
      const order = []
      const composed = defineTool({
        type: 'T',
        icon: 'x',
        draw() {},
        init() { order.push('init') },
        init_tool() { order.push('init_tool') },
      })
      composed.methods.init.call({})
      expect(order).toEqual(['init', 'init_tool'])

      // init only (no init_tool) → methods.init IS def.init verbatim, no wrapper.
      const myInit = function authorInit() {}
      const plain = defineTool({ type: 'T2', icon: 'x', draw() {}, init: myInit })
      expect(plain.methods.init).toBe(myInit)
    } finally {
      warn.mockRestore()
    }
  })

  // CASE 8 — tool() descriptor defaults + mods gating + init_tool clobber guard.
  test('tool() defaults (group/hint/useFor), mods gating, init_tool forced undefined', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    try {
      const t = defineTool({ type: 'D8', icon: 'x', draw() {} })
      const desc = t.methods.tool.call({})
      expect(desc.group).toBe('Custom')   // group omitted → 'Custom'
      expect(desc.hint).toBe('D8')        // hint omitted → def.type
      expect(t.methods.use_for()).toEqual(['D8']) // useFor omitted → [def.type]
      expect('mods' in desc).toBe(false)  // no def.mods → no mods key

      // def.mods present → mods key present on the descriptor.
      const withMods = defineTool({ type: 'D8b', icon: 'x', draw() {}, mods: { Ext: {} } })
      const md = withMods.methods.tool.call({})
      expect('mods' in md).toBe(true)
      expect(md.mods).toEqual({ Ext: {} })

      // The Tool mixin owns init_tool — the factory forces it undefined on the
      // produced component even when the author supplies def.init_tool (it is
      // routed to init instead). Clobber-regression guard.
      const withInitTool = defineTool({ type: 'D8c', icon: 'x', draw() {}, init_tool() {} })
      expect(withInitTool.methods.init_tool).toBeUndefined()
    } finally {
      warn.mockRestore()
    }
  })
})
