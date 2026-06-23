// @vitest-environment jsdom
// useChart/useData public delegates + useIndicatorVisibility persistence state.
//
// Covers the thin delegation layer of src/composables/useChart.js (useData
// → DataCube method forwarding incl. snake_case get_one; useChart → instance
// forwarding incl. null-safety + the `'value' in tvRef` raw-component branch)
// and the persistence/state surface of
// src/composables/useIndicatorVisibility.js (setVisibility per-bucket,
// toggleAccordion, getState snapshot isolation, restore round-trip) — branches
// not exercised by composables.test.js (which only covers toggle()).

import { test, expect, describe } from 'vitest'
import { ref } from 'vue'
import { useChart, useData } from '../../src/composables/useChart.js'
import { useIndicatorVisibility } from '../../src/composables/useIndicatorVisibility.js'

// Recording DataCube fake: each method records its args and returns a sentinel
// so we can assert both forwarding and pass-through of the underlying value.
function makeRecordingDC() {
  const calls = []
  const ret = (name) => (...args) => { calls.push([name, ...args]); return `ret:${name}` }
  return {
    calls,
    get: ret('get'),
    get_one: ret('get_one'), // snake_case on DataCube; getOne() must call THIS
    set: ret('set'),
    merge: ret('merge'),
    del: ret('del'),
    add: ret('add'),
    update: ret('update'),
    show: ret('show'),
    hide: ret('hide'),
  }
}

describe('useData() delegates to the DataCube', () => {
  test('forwards every call to the matching DataCube method and returns its value', () => {
    const dc = makeRecordingDC()
    const api = useData(dc)

    expect(api.get('q1')).toBe('ret:get')
    expect(api.getOne('q2')).toBe('ret:get_one') // snake_case method name
    expect(api.set('q3', { a: 1 })).toBe('ret:set')
    expect(api.merge('q4', { b: 2 })).toBe('ret:merge')
    expect(api.del('q5')).toBe('ret:del')
    expect(api.add('onchart', { type: 'X' })).toBe('ret:add')
    expect(api.update({ t: 1 })).toBe('ret:update')
    expect(api.show('q6')).toBe('ret:show')
    expect(api.hide('q7')).toBe('ret:hide')

    expect(dc.calls).toEqual([
      ['get', 'q1'],
      ['get_one', 'q2'],
      ['set', 'q3', { a: 1 }],
      ['merge', 'q4', { b: 2 }],
      ['del', 'q5'],
      ['add', 'onchart', { type: 'X' }],
      ['update', { t: 1 }],
      ['show', 'q6'],
      ['hide', 'q7'],
    ])

    // dc() returns the passed instance
    expect(api.dc()).toBe(dc)
  })

  test('useData(null) wrappers are null-safe (all return undefined, no throw)', () => {
    const api = useData(null)
    expect(() => {
      expect(api.get('q')).toBeUndefined()
      expect(api.getOne('q')).toBeUndefined()
      expect(api.set('q', {})).toBeUndefined()
      expect(api.merge('q', {})).toBeUndefined()
      expect(api.del('q')).toBeUndefined()
      expect(api.add('s', {})).toBeUndefined()
      expect(api.update({})).toBeUndefined()
      expect(api.show('q')).toBeUndefined()
      expect(api.hide('q')).toBeUndefined()
    }).not.toThrow()
    expect(api.dc()).toBeNull()
  })
})

// Recording TradingVue instance fake.
function makeRecordingInstance() {
  const calls = []
  return {
    calls,
    getCursor() { calls.push(['getCursor']); return { x: 5 } },
    getRange() { calls.push(['getRange']); return [10, 20] },
    goto(t) { calls.push(['goto', t]); return { ok: true } },
    toggleOverlayVisibility(g, o, d) { calls.push(['toggleOverlayVisibility', g, o, d]) },
    updateLayout(force) { calls.push(['updateLayout', force]) },
    refreshOffchartOverlays() { calls.push(['refreshOffchartOverlays']) },
  }
}

describe('useChart() delegates to the instance', () => {
  test('forwards getCursor/toggleOverlayVisibility/updateLayout/refreshOffchartOverlays', () => {
    const inst = makeRecordingInstance()
    const tvRef = ref(inst)
    const c = useChart(tvRef)

    expect(c.getCursor()).toEqual({ x: 5 })
    c.toggleOverlayVisibility('g1', 'o1', false)
    c.updateLayout(true)
    c.refreshOffchartOverlays()

    expect(inst.calls).toEqual([
      ['getCursor'],
      ['toggleOverlayVisibility', 'g1', 'o1', false],
      ['updateLayout', true],
      ['refreshOffchartOverlays'],
    ])
  })

  test('updateLayout() defaults force to false', () => {
    const inst = makeRecordingInstance()
    const c = useChart(ref(inst))
    c.updateLayout()
    expect(inst.calls).toEqual([['updateLayout', false]])
  })

  test('null-safe before mount: getCursor() is null; others do not throw', () => {
    const c = useChart(ref(null))
    expect(c.getCursor()).toBeNull()
    expect(() => {
      c.toggleOverlayVisibility('g', 'o', true)
      c.updateLayout(true)
      c.updateLayout()
      c.refreshOffchartOverlays()
    }).not.toThrow()
  })

  test('resolve() accepts a raw component without a `value` key (getRange/goto hit it)', () => {
    // A plain object with no `value` property → the `'value' in tvRef` branch
    // is false, so resolve() returns the object itself.
    const inst = makeRecordingInstance()
    expect('value' in inst).toBe(false)
    const c = useChart(inst)

    expect(c.getRange()).toEqual([10, 20])
    expect(c.goto(123)).toEqual({ ok: true })
    expect(inst.calls).toEqual([['getRange'], ['goto', 123]])
    // instance escape hatch resolves to the same raw object
    expect(c.instance()).toBe(inst)
  })
})

describe('useIndicatorVisibility — persistence/state surface', () => {
  test('setVisibility writes regular and persistent buckets independently', () => {
    const v = useIndicatorVisibility()

    v.setVisibility('RSI', false)
    expect(v.isVisible('RSI')).toBe(false)

    v.setVisibility('SCMR', false, true) // persistent bucket only
    expect(v.isVisible('SCMR', true)).toBe(false)
    expect(v.isVisible('SCMR', false)).toBe(true) // regular bucket untouched

    v.setVisibility('RSI', true) // re-show
    expect(v.isVisible('RSI')).toBe(true)
  })

  test('toggleAccordion flips an unknown group and back; isAccordionExpanded is strict ===true', () => {
    const v = useIndicatorVisibility()
    expect(v.isAccordionExpanded('grp')).toBe(false) // missing → not expanded
    v.toggleAccordion('grp')
    expect(v.isAccordionExpanded('grp')).toBe(true)
    v.toggleAccordion('grp')
    expect(v.isAccordionExpanded('grp')).toBe(false)
  })

  test('getState returns a plain-object snapshot decoupled from live state', () => {
    const v = useIndicatorVisibility()
    v.setVisibility('A', false)
    v.setVisibility('B', false, true)
    v.toggleAccordion('G')

    const snap = v.getState()
    expect(snap).toEqual({
      visibility: { A: false },
      persistentVisibility: { B: false },
      accordionExpanded: { G: true },
    })

    // Mutating the snapshot must NOT mutate live state.
    snap.visibility.A = true
    snap.persistentVisibility.B = true
    snap.accordionExpanded.G = false
    snap.visibility.NEW = 999

    expect(v.isVisible('A')).toBe(false)
    expect(v.isVisible('B', true)).toBe(false)
    expect(v.isAccordionExpanded('G')).toBe(true)
    expect(v.getState().visibility.NEW).toBeUndefined()
  })

  test('restore() Object.assigns into the three buckets and round-trips via getState', () => {
    const v = useIndicatorVisibility()
    v.restore({ A: false }, { P: false }, { G: true })

    expect(v.isVisible('A')).toBe(false)
    expect(v.isVisible('P', true)).toBe(false)
    expect(v.isAccordionExpanded('G')).toBe(true)

    expect(v.getState()).toEqual({
      visibility: { A: false },
      persistentVisibility: { P: false },
      accordionExpanded: { G: true },
    })
  })

  test('restore() with no args is a no-op that leaves existing state intact', () => {
    const v = useIndicatorVisibility()
    v.setVisibility('A', false)
    v.toggleAccordion('G')

    v.restore() // defaults to empty objects → Object.assign is a no-op

    expect(v.isVisible('A')).toBe(false)
    expect(v.isAccordionExpanded('G')).toBe(true)
    expect(v.getState()).toEqual({
      visibility: { A: false },
      persistentVisibility: {},
      accordionExpanded: { G: true },
    })
  })
})
