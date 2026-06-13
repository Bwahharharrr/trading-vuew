// CRUP value-layer toggle independence (regression).
//
// Two value lines of one indicator share an offchart PANE: one is the pane
// ANCHOR (spawns the grid, no grid.id), the other a SIBLING (grid.id set).
// _normalizeOffchartGrids used to force the build-time anchor to be present
// whenever any sibling was present — so enabling a sibling (bull_box_nested_count)
// resurrected the hidden anchor LINE (bullcount) AND re-flagged it enabled, and
// every attempt to hide the anchor was instantly undone (un-deselectable).
// The fix: a present sibling is PROMOTED to anchor; the hidden line stays hidden.
import { test, expect, describe, beforeEach } from 'vitest'
import { CorkyFeed } from '../../src/helpers/feed/corky-feed.js'
import DataCube from '../../src/helpers/datacube.js'

function mkPaneOverlay(layerId, { anchor }) {
  const ov = {
    name: layerId, type: 'Spline', data: [],
    settings: {
      corkyKind: 'CRUP', corkyInstance: 'CRUP', corkyLayerId: layerId,
      corkyKey: `CRUP#${layerId}`, corkyView: true, corkyVisibleDefault: true,
      display: true, corkyPaneName: 'crup_values', corkyPaneAnchor: anchor,
    },
  }
  if (!anchor) ov.grid = { id: 1 } // siblings carry a grid.id; the anchor spawns it
  return ov
}

let dc, feed, handle, bullcount, nested
beforeEach(() => {
  dc = new DataCube(
    { chart: { type: 'Candles', data: [] }, onchart: [], offchart: [] },
    { scripts: false, validation: 'off' })
  feed = new CorkyFeed({
    client: { listCandleStates: async () => [], onSubscription: () => () => {}, on: () => () => {}, close() {} },
    dataCube: dc, subscribeTimeoutMs: 0,
  })
  bullcount = mkPaneOverlay('bullcount', { anchor: true })   // pane anchor (first)
  nested = mkPaneOverlay('bull_box_nested_count', { anchor: false }) // sibling
  // both enabled initially
  dc.data.offchart.push(bullcount, nested)
  handle = {
    built: { onchart: [], offchart: [bullcount, nested] },
    addedOverlays: new Set([bullcount, nested]),
    enabledLayers: new Set(['CRUP#bullcount', 'CRUP#bull_box_nested_count']),
    enabledKinds: new Set(['CRUP']), hiddenLayers: new Set(),
  }
})

const inOffchart = (ov) => dc.data.offchart.includes(ov)

describe('sibling toggle does not resurrect the hidden anchor line', () => {
  test('disable sibling, disable anchor, re-enable sibling → anchor stays hidden', () => {
    // 1) disable the sibling
    expect(feed.setLayerEnabled(handle, 'bull_box_nested_count', false, 'CRUP')).toBe(true)
    expect(inOffchart(nested)).toBe(false)
    expect(inOffchart(bullcount)).toBe(true)           // anchor untouched

    // 2) disable the anchor — pane now empty of CRUP lines
    expect(feed.setLayerEnabled(handle, 'bullcount', false, 'CRUP')).toBe(true)
    expect(inOffchart(bullcount)).toBe(false)
    expect(inOffchart(nested)).toBe(false)

    // 3) re-enable ONLY the sibling
    expect(feed.setLayerEnabled(handle, 'bull_box_nested_count', true, 'CRUP')).toBe(true)
    expect(inOffchart(nested)).toBe(true)
    expect(inOffchart(bullcount)).toBe(false)          // THE BUG: must NOT resurrect
    expect(handle.enabledLayers.has('CRUP#bull_box_nested_count')).toBe(true)
    expect(handle.enabledLayers.has('CRUP#bullcount')).toBe(false)
    // the promoted sibling renders the grid (no grid.id while it's the anchor)
    expect(nested.grid).toBeUndefined()
  })

  test('the anchor line remains DESELECTABLE while a sibling is present', () => {
    // both on → hide nested's sibling status by leaving it; turn anchor off
    expect(feed.setLayerEnabled(handle, 'bullcount', false, 'CRUP')).toBe(true)
    expect(inOffchart(bullcount)).toBe(false)
    expect(inOffchart(nested)).toBe(true)              // sibling promoted, still shown
    expect(handle.enabledLayers.has('CRUP#bullcount')).toBe(false)
    // a normalize pass (e.g. another toggle) must not bring it back
    feed._normalizeOffchartGrids(handle)
    expect(inOffchart(bullcount)).toBe(false)
    expect(handle.hiddenLayers.has('CRUP#bullcount')).toBe(true)
  })

  test('re-enabling the original anchor reclaims the anchor slot (sibling re-id\'d)', () => {
    feed.setLayerEnabled(handle, 'bullcount', false, 'CRUP')   // anchor off → sibling promoted
    expect(nested.grid).toBeUndefined()
    feed.setLayerEnabled(handle, 'bullcount', true, 'CRUP')    // anchor back
    expect(inOffchart(bullcount)).toBe(true)
    expect(bullcount.grid).toBeUndefined()                     // anchor: no grid.id
    expect(nested.grid).toEqual({ id: 1 })                     // sibling re-assigned
  })
})
