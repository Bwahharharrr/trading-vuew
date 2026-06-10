// @vitest-environment jsdom
// Overlay smoke harness: mount EVERY drawable overlay type on a real
// TradingVue with minimal plausible data, and assert it renders without
// throwing and actually paints. Catches draw-path crashes across the whole
// overlay zoo in one parameterized sweep (most of these were at 0% coverage).
import { test, expect, describe, beforeEach, afterEach } from 'vitest'
import TradingVue from '../../src/TradingVue.vue'
import DataCube from '../../src/helpers/datacube.js'
import Balance from '../../src/components/overlays/Balance.js'
import BuysAndSells from '../../src/components/overlays/BuysAndSells.js'
import LineTracker from '../../src/components/overlays/LineTracker.js'
import TradeHistory from '../../src/components/overlays/TradeHistory.js'
import {
  mount, installCanvasEnv, uninstallCanvasEnv, settle, resetCounters, totalDrawCalls,
} from './_component-harness.js'

const T0 = 1_600_000_000_000
const TF = 60_000
const ts = (i) => T0 + i * TF

// Per-type minimal fixtures. pane: where the overlay belongs.
const CASES = [
  { type: 'Spline', pane: 'onchart', data: [[ts(0), 100], [ts(1), 101], [ts(2), 102]] },
  { type: 'Splines', pane: 'offchart', data: [[ts(0), 1, 2], [ts(1), 1.5, 2.5]] },
  { type: 'Histogram', pane: 'offchart', data: [[ts(0), 5], [ts(1), -3], [ts(2), 8]] },
  { type: 'Channel', pane: 'onchart', data: [[ts(0), 102, 100, 98], [ts(1), 103, 101, 99]] },
  { type: 'Zones', pane: 'onchart', data: [[ts(0), 99, ts(2), 101, 'rgba(0,255,0,0.2)']] },
  { type: 'Markers', pane: 'onchart', data: [[ts(1), 100, { shape: 'circle', color: '#f0f' }]] },
  { type: 'StepLine', pane: 'offchart', data: [[ts(0), 1], [ts(1), 2], [ts(2), 1]] },
  { type: 'Range', pane: 'offchart', data: [[ts(0), 55], [ts(1), 60]], settings: { upper: 70, lower: 30 } },
  { type: 'Trades', pane: 'onchart', data: [[ts(1), 1, 100, 'buy']] },
  { type: 'Splitters', pane: 'onchart', data: [[ts(1), 'split', '#999']] },
  { type: 'Segment', pane: 'onchart', data: [], settings: { p1: [ts(0), 99], p2: [ts(2), 101], $state: 'finished' } },
  { type: 'LineTool', pane: 'onchart', data: [], settings: { p1: [ts(0), 99], p2: [ts(2), 101], $state: 'finished' } },
  { type: 'RangeTool', pane: 'onchart', data: [], settings: { p1: [ts(0), 99], p2: [ts(2), 101], $state: 'finished' } },
  { type: 'Balance', pane: 'offchart', data: [[ts(0), 1000], [ts(1), 1010], [ts(2), 1005]] },
  { type: 'BuysAndSells', pane: 'onchart', data: [[ts(1), 1, 100], [ts(2), 0, 101]] },
  { type: 'LineTracker', pane: 'onchart', data: [[ts(0), 100], [ts(2), 102]] },
  { type: 'TradeHistory', pane: 'onchart', data: [[ts(0), 1, 100, ts(2), 102]] },
]

function seedDc(c) {
  const ohlcv = Array.from({ length: 30 }, (_, i) =>
    [ts(i), 100, 102, 98, 100 + Math.sin(i / 3), 50])
  const entry = {
    name: `${c.type} smoke`, type: c.type, data: c.data,
    settings: Object.assign({ 'z-index': 5 }, c.settings || {}),
  }
  const d = { ohlcv, onchart: [], offchart: [] }
  d[c.pane].push(c.pane === 'offchart' ? entry : Object.assign({ grid: { id: 0 } }, entry))
  return new DataCube(d, { scripts: false, validation: 'off' })
}

describe('overlay draw smoke (every registered type)', () => {
  let wrapper
  beforeEach(() => installCanvasEnv())
  afterEach(() => { if (wrapper) { wrapper.unmount(); wrapper = null } uninstallCanvasEnv() })

  for (const c of CASES) {
    test(`${c.type} mounts + draws without throwing`, async () => {
      const dc = seedDc(c)
      wrapper = mount(TradingVue, {
        props: {
          data: dc, width: 700, height: 500,
          overlays: [Balance, BuysAndSells, LineTracker, TradeHistory],
        },
        attachTo: document.body,
      })
      await settle(6)
      resetCounters()
      dc.touchData()
      await settle(6)
      expect(totalDrawCalls()).toBeGreaterThan(0) // something painted post-mount
    })
  }
})
