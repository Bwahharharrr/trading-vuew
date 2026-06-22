// bar-chart-base.draw honours an opt-in `minBarWidth` floor so sparse bars (e.g.
// a single position trade in a months-long window, where px_step collapses below
// a pixel) stay visible. Default (no setting) keeps the historic 1px floor.

import { describe, it, expect } from 'vitest'
import barChartBase from '../../src/mixins/bar-chart-base.js'

// Minimal host exposing what draw() reads off `this`, plus a recording ctx.
function drawWith({ sett, pxStep }) {
  const widths = []
  const ctx = { fillRect: (x, y, w) => widths.push(w), beginPath() {}, moveTo() {}, lineTo() {}, stroke() {} }
  const host = {
    $props: {
      layout: { px_step: pxStep, t2screen: (t) => t, $2screen: (v) => 100 - v, width: 800 },
      data: [[1000, 0.01]],   // a single bar
    },
    bar_width_ratio: 0.8,
    sett,
    colorUp: '#0f0', colorDown: '#f00',
    baseline: 0, data_index: 1,
  }
  barChartBase.methods.draw.call(host, ctx)
  return widths
}

describe('bar-chart-base minBarWidth', () => {
  it('floors the bar width at minBarWidth when px_step is tiny', () => {
    // px_step 0.1 → 0.1*0.8 = 0.08px; without a floor that is sub-pixel/invisible
    const widths = drawWith({ sett: { minBarWidth: 6 }, pxStep: 0.1 })
    expect(widths).toEqual([6])
  })
  it('uses px_step·ratio when it exceeds the floor (normal zoom unaffected)', () => {
    const widths = drawWith({ sett: { minBarWidth: 6 }, pxStep: 50 })
    expect(widths).toEqual([40])   // 50 * 0.8
  })
  it('defaults to a 1px floor when no minBarWidth is set (back-compat)', () => {
    const widths = drawWith({ sett: {}, pxStep: 0.1 })
    expect(widths).toEqual([1])
  })
})
