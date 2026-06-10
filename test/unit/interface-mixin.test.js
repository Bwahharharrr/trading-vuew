// mixins/interface.js — the HTML-interface (UX panel) mixin (0% covered).
import { test, expect, describe, vi } from 'vitest'
import iface from '../../src/mixins/interface.js'

function mkCtx(over = {}) {
  const emits = []
  const ctx = {
    $emit: (e, p) => emits.push([e, p]),
    emits,
    $props: { ux: { uuid: 'ux-1', overlay: { layout: { width: 100 } } } },
  }
  Object.assign(ctx, iface.methods)
  return Object.assign(ctx, over)
}

describe('interface mixin', () => {
  test('close / modify route through custom_event with the ux uuid', () => {
    const ctx = mkCtx()
    ctx.close()
    expect(ctx.emits.pop()).toEqual(['custom-event', { event: 'close-interface', args: ['ux-1'] }])
    ctx.modify({ a: 1 })
    expect(ctx.emits.pop()).toEqual(['custom-event', { event: 'modify-interface', args: ['ux-1', { a: 1 }] }])
  })

  test('custom_event swallows hook: events but forwards the rest', () => {
    const ctx = mkCtx()
    ctx.custom_event('hook:x', 1)
    expect(ctx.emits.length).toBe(0)
    ctx.custom_event('do-thing', 1, 2)
    expect(ctx.emits.pop()).toEqual(['custom-event', { event: 'do-thing', args: [1, 2] }])
  })

  test('computed overlay/layout/uxr read off the ux prop', () => {
    const ctx = mkCtx()
    const C = iface.computed
    // install the computeds as getters so `layout` can read sibling `overlay`
    for (const k of Object.keys(C)) Object.defineProperty(ctx, k, { get: C[k], configurable: true })
    expect(ctx.overlay).toBe(ctx.$props.ux.overlay)
    expect(ctx.layout).toBe(ctx.$props.ux.overlay.layout)
    expect(ctx.uxr).toBe(ctx.$props.ux)
  })
})
