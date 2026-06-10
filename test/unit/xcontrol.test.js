// mixins/xcontrol.js — the extensions/skins controller mixin (35% → up).
// Direct-invocation of methods/computeds with a crafted `this`.
import { test, expect, describe, vi } from 'vitest'
import xcontrol from '../../src/mixins/xcontrol.js'

function fakeExt(name, { widgets, skins, colors } = {}) {
  class Main {
    constructor(tv, dc, settings) {
      this.tv = tv; this.dc = dc; this.settings = settings; this.widgets = widgets
      this.update = vi.fn()
      this.post_update = vi.fn()
      this.destroy = vi.fn()
    }
  }
  Main.__name__ = name
  return { Main, skins: skins || {} }
}

function mkCtx(extensions = []) {
  const ctx = {
    xSettings: {}, controllers: [], data: { dc: true },
    $props: { extensions, skin: 'dark' },
  }
  Object.assign(ctx, xcontrol.methods)
  // Install computeds as getters so they can read each other (skin_proto → skins).
  for (const k of Object.keys(xcontrol.computed)) {
    Object.defineProperty(ctx, k, { get: xcontrol.computed[k], configurable: true })
  }
  return ctx
}

describe('ctrllist — build/rebuild controllers', () => {
  test('instantiates one controller per extension and seeds xSettings', () => {
    const ctx = mkCtx([fakeExt('A'), fakeExt('B')])
    const list = ctx.ctrllist()
    expect(list).toHaveLength(2)
    expect(list[0].name).toBe('A')
    expect(ctx.xSettings.A).toEqual({})
    expect(ctx.xSettings.B).toEqual({})
    expect(list[0].tv).toBe(ctx)         // wired with the tv inst
    expect(list[0].dc).toBe(ctx.data)
  })

  test('rebuild destroys the previous controllers first', () => {
    const ctx = mkCtx([fakeExt('A')])
    const first = ctx.ctrllist()[0]
    ctx.ctrllist() // rebuild
    expect(first.destroy).toHaveBeenCalled()
  })
})

describe('pre_dc / post_dc fan events out to controllers', () => {
  test('call update / post_update on each controller that defines them', () => {
    const ctx = mkCtx([fakeExt('A'), fakeExt('B')])
    ctx.ctrllist()
    const ev = { type: 'x' }
    ctx.pre_dc(ev)
    ctx.post_dc(ev)
    for (const c of ctx.controllers) {
      expect(c.update).toHaveBeenCalledWith(ev)
      expect(c.post_update).toHaveBeenCalledWith(ev)
    }
  })
})

describe('computeds', () => {
  test('ws aggregates controller widgets and back-references the ctrl', () => {
    const ctx = mkCtx([fakeExt('A', { widgets: { w1: {} } })])
    ctx.ctrllist()
    const ws = xcontrol.computed.ws.call(ctx)
    expect(ws.w1).toBeTruthy()
    expect(ws.w1.ctrl).toBe(ctx.controllers[0])
  })

  test('skins / skin_proto / colorpack resolve from the selected skin', () => {
    const sk = { dark: { styles: '.x{}', colors: { back: '#000' } } }
    const ctx = mkCtx([fakeExt('A', { skins: sk })])
    expect(xcontrol.computed.skins.call(ctx).dark).toBe(sk.dark)
    expect(xcontrol.computed.skin_proto.call(ctx)).toBe(sk.dark)
    expect(xcontrol.computed.colorpack.call(ctx)).toEqual({ back: '#000' })
  })

  test('colorpack is undefined when the skin is missing', () => {
    const ctx = mkCtx([fakeExt('A')])
    ctx.$props.skin = 'nope'
    expect(xcontrol.computed.colorpack.call(ctx)).toBeUndefined()
  })

  test('xSettingsKey hashes nested-key counts, order-independent', () => {
    const ctx = mkCtx()
    ctx.xSettings = { B: { a: 1, b: 2 }, A: 'x' }
    expect(xcontrol.computed.xSettingsKey.call(ctx)).toBe('A:x|B:2')
    expect(xcontrol.computed.xSettingsKey.call({ xSettings: null })).toBe('')
  })
})

describe('xSettingsKey watcher pushes settings to controllers', () => {
  test('calls onsettings when the key changes', () => {
    const ctx = mkCtx([fakeExt('A')])
    ctx.ctrllist()
    ctx.controllers[0].onsettings = vi.fn()
    xcontrol.watch.xSettingsKey.call(ctx, 'new', 'old')
    expect(ctx.controllers[0].onsettings).toHaveBeenCalledWith(ctx.xSettings, null)
    // no-op when unchanged
    ctx.controllers[0].onsettings.mockClear()
    xcontrol.watch.xSettingsKey.call(ctx, 'same', 'same')
    expect(ctx.controllers[0].onsettings).not.toHaveBeenCalled()
  })
})
