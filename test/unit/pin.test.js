// components/primitives/pin.js — the draggable stretch-pin state machine
// (settled ↔ dragging ↔ tracking). 51% → up.
import { test, expect, describe, vi } from 'vitest'
import Pin from '../../src/components/primitives/pin.js'

function mkMouse() {
  const h = {}
  return {
    x: 0, y: 0,
    on: (e, f) => { (h[e] = h[e] || []).push(f) },
    off: (e, f) => { h[e] = (h[e] || []).filter((x) => x !== f) },
    count: (e) => (h[e] || []).length,
  }
}

function mkComp(over = {}) {
  const emits = []
  return Object.assign({
    emits,
    layout: { t2screen: (t) => t, $2screen: ($) => $ },
    mouse: mkMouse(),
    state: 'creating',
    selected: false,
    $emit: (e, p) => emits.push([e, p]),
    $props: {
      config: { PIN_RADIUS: 5.5 },
      colors: { back: '#fff', text: '#000' },
      settings: {},
      cursor: { x: 10, y: 20, t: 10, y$: 20 },
    },
  }, over)
}

function recCtx() {
  const calls = []
  return new Proxy({}, {
    get: (_t, prop) => prop === '_calls' ? calls : (...a) => calls.push([prop, ...a]),
    set: () => true,
  })
}

describe('Pin construction', () => {
  test('creating mode → update() seeds from cursor and emits change-settings', () => {
    const comp = mkComp()
    const pin = new Pin(comp, 'p1')
    expect(pin.t).toBe(10)
    expect(pin.y$).toBe(20)
    expect(comp.emits.find((e) => e[0] === 'change-settings')[1]).toEqual({ p1: [10, 20] })
    expect(comp.mouse.count('mousemove')).toBe(1) // listeners wired
  })

  test('finished mode → update_from(settings[name]) instead of cursor', () => {
    const comp = mkComp({ state: 'finished', $props: { ...mkComp().$props, settings: { p1: [99, 7] } } })
    const pin = new Pin(comp, 'p1')
    expect(pin.state).toBe('settled')
    expect(pin.t).toBe(99)
    expect(pin.y$).toBe(7)
  })

  test('a non-settled initial state locks scrolling', () => {
    const comp = mkComp()
    new Pin(comp, 'p1', { state: 'tracking' })
    expect(comp.emits).toContainEqual(['scroll-lock', true])
  })
})

describe('Pin drag state machine', () => {
  function settledPin() {
    const comp = mkComp({ state: 'finished', $props: { ...mkComp().$props, settings: { p1: [10, 20] } } })
    const pin = new Pin(comp, 'p1')
    pin.x = 10; pin.y = 20
    return { comp, pin }
  }

  test('hover() is true when the mouse is within the radius', () => {
    const { comp, pin } = settledPin()
    comp.mouse.x = 11; comp.mouse.y = 21
    expect(pin.hover()).toBe(true)
    comp.mouse.x = 500; comp.mouse.y = 500
    expect(pin.hover()).toBe(false)
  })

  test('mousedown on a hovered settled pin → dragging + locks + selects', () => {
    const { comp, pin } = settledPin()
    comp.mouse.x = 10; comp.mouse.y = 20
    pin.mousedown({ preventDefault() {} }, true)
    expect(pin.state).toBe('dragging')
    expect(comp.emits).toContainEqual(['scroll-lock', true])
    expect(comp.emits.some((e) => e[0] === 'object-selected')).toBe(true)
  })

  test('mousemove while dragging updates position; mouseup settles + unlocks', () => {
    const { comp, pin } = settledPin()
    pin.state = 'dragging'
    comp.$props.cursor = { x: 5, y: 9, t: 5, y$: 9 }
    pin.mousemove({})
    expect(pin.moved).toBe(true)
    expect(pin.t).toBe(5)
    pin.mouseup({})
    expect(pin.state).toBe('settled')
    expect(comp.emits).toContainEqual(['scroll-lock', false])
  })

  test('mousedown while tracking settles and fires on_settled', () => {
    const comp = mkComp()
    const pin = new Pin(comp, 'p1', { state: 'tracking' })
    const settled = vi.fn()
    pin.on('settled', settled)
    pin.mousedown({ preventDefault() {} }, true)
    expect(pin.state).toBe('settled')
    expect(settled).toHaveBeenCalled()
    expect(comp.emits).toContainEqual(['scroll-lock', false])
  })
})

describe('Pin draw / lifecycle', () => {
  test('settled pin draws a circle; hidden pin draws nothing', () => {
    const comp = mkComp({ state: 'finished', $props: { ...mkComp().$props, settings: { p1: [10, 20] } } })
    const pin = new Pin(comp, 'p1')
    const ctx = recCtx()
    pin.draw(ctx)
    expect(ctx._calls.some((c) => c[0] === 'arc')).toBe(true) // circle drawn
    pin.hidden = true
    const ctx2 = recCtx()
    pin.draw(ctx2)
    expect(ctx2._calls.length).toBe(0)
  })

  test('rec_position snapshots t/y$; destroy unwires mouse listeners', () => {
    const comp = mkComp()
    const pin = new Pin(comp, 'p1')
    pin.t = 42; pin.y$ = 8
    pin.rec_position()
    expect(pin.t1).toBe(42)
    expect(pin.y$1).toBe(8)
    pin.destroy()
    expect(comp.mouse.count('mousemove')).toBe(0)
    expect(comp.mouse.count('mouseup')).toBe(0)
  })

  test('re_init reloads position from settings', () => {
    const comp = mkComp()
    const pin = new Pin(comp, 'p1')
    comp.$props.settings.p1 = [77, 3]
    pin.re_init()
    expect(pin.t).toBe(77)
    expect(pin.y$).toBe(3)
  })
})
