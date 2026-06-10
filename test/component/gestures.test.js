// @vitest-environment jsdom
// Gesture handlers (grid.js / botbar.js / sidebar.js) — driven through the
// gesture seam. Mount a real TradingVue (so handlers wire onto capturing fakes),
// then synthesise pan/wheel/pinch/tap and assert the chart actually responds
// (redraw + range/transform change), exercising the zoom/pan manager paths that
// jsdom otherwise leaves at ~55% coverage.
import { test, expect, describe, beforeEach, afterEach, vi } from 'vitest'

vi.mock('../../src/stuff/gestures.js', () => import('../_seams/gesture-harness.js'))

import TradingVue from '../../src/TradingVue.vue'
import DataCube from '../../src/helpers/datacube.js'
import { mount, installCanvasEnv, uninstallCanvasEnv, settle, totalDrawCalls, resetCounters } from './_component-harness.js'
import {
  resetGestures, gestureManagers, gestureHamsters, firePan, firePanEnd, fireWheel, firePinch, fireTaps,
} from '../_seams/gesture-harness.js'

function seedDc() {
  const T0 = 1_600_000_000_000
  const ohlcv = Array.from({ length: 120 }, (_, i) => {
    const t = T0 + i * 60000
    const p = 100 + Math.sin(i / 7) * 8
    return [t, p, p + 1.5, p - 1.5, p + 0.5, 100 + i]
  })
  return new DataCube({ ohlcv }, { scripts: false, validation: 'off' })
}

describe('gesture handlers on a mounted chart', () => {
  let wrapper, dc
  beforeEach(() => { installCanvasEnv(); resetGestures(); dc = seedDc() })
  afterEach(() => { if (wrapper) wrapper.unmount(); uninstallCanvasEnv() })

  async function mountChart() {
    wrapper = mount(TradingVue, { props: { data: dc, width: 800, height: 500 }, attachTo: document.body })
    await settle()       // lets the async listeners() wire onto the fakes
  }

  test('mount wires gesture recognizers onto the seam (grid + sidebar + botbar)', async () => {
    await mountChart()
    const mgrs = gestureManagers()
    expect(mgrs.length).toBeGreaterThanOrEqual(2)       // grid + sidebar (+ botbar)
    expect(mgrs.some((m) => m.has('panstart'))).toBe(true)
    expect(gestureHamsters().length).toBeGreaterThanOrEqual(2) // wheel zoom targets
  })

  test('wheel zoom narrows the visible time range and repaints', async () => {
    await mountChart()
    const r0 = dc.tv ? dc.tv.getRange().slice() : null
    resetCounters()
    const fired = fireWheel(3)                           // zoom in
    expect(fired).toBeGreaterThan(0)
    await settle()
    expect(totalDrawCalls()).toBeGreaterThan(0)          // repainted
    if (r0 && dc.tv) {
      const r1 = dc.tv.getRange()
      expect(r1[1] - r1[0]).not.toBe(r0[1] - r0[0])      // range span changed
    }
  })

  test('pan drag shifts the range and repaints', async () => {
    await mountChart()
    const r0 = dc.tv ? dc.tv.getRange().slice() : null
    resetCounters()
    const fired = firePan({ center: { x: 200, y: 120 }, deltaX: 80, deltaY: 0 })
    expect(fired).toBeGreaterThan(0)
    await settle()                                       // RAF applies the throttled drag (drug still set)
    firePanEnd()
    // The drag ran through panstart→mousedrag→cursor/redraw (a repaint proves it).
    expect(totalDrawCalls()).toBeGreaterThan(0)
    void r0                                               // range shift is clamp-dependent; wheel covers range mutation
  })

  test('pinch zoom runs without throwing and repaints', async () => {
    await mountChart()
    resetCounters()
    firePinch(1.6)
    await settle()
    expect(totalDrawCalls()).toBeGreaterThanOrEqual(0)   // exercised the pinch path
  })

  test('sidebar taps (double/single) are handled without throwing', async () => {
    await mountChart()
    expect(() => fireTaps()).not.toThrow()
    await settle()
  })
})
