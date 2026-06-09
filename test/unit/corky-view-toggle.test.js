// Pins the view-layer visibility gating in the feed: enabling an indicator KIND
// auto-adds only visible_by_default layers; hidden layers are opt-in via
// setLayerEnabled; remove is by object identity (no dc.del substring hazard).
import { test, expect, describe, beforeEach } from 'vitest'
import { CorkyFeed } from '../../src/helpers/feed/corky-feed.js'
import DataCube from '../../src/helpers/datacube.js'

class FakeClient {
  onSubscription() { return () => {} }
  async listCandleStates() { return [] }
  async subscribeCandles() { return {} }
  async unsubscribe() {}
  close() {}
}

function handleWithViewOverlays() {
  const ov = (layerId, visible) => ({
    name: layerId, type: 'Spline', data: [], raw: [],
    settings: { corkyKind: 'SCMR', corkyInstance: 'SCMR', corkyLayerId: layerId, corkyView: true, corkyVisibleDefault: visible }
  })
  return {
    built: {
      chart: { type: 'Candles', data: [] },
      onchart: [ov('main', true), ov('tl', false), ov('th', false)],
      offchart: []
    },
    addedOverlays: new Set(),
    enabledKinds: new Set(),
    enabledLayers: new Set()
  }
}

describe('view-layer visibility gating', () => {
  let dc, feed
  beforeEach(() => {
    dc = new DataCube({ chart: { type: 'Candles', data: [] }, onchart: [], offchart: [] }, { scripts: false, validation: 'off' })
    feed = new CorkyFeed({ client: new FakeClient(), dataCube: dc })
  })

  test('enabling the kind auto-adds only visible_by_default layers', () => {
    const h = handleWithViewOverlays()
    feed.setIndicatorEnabled(h, 'SCMR', true)
    expect(dc.data.onchart.map(o => o.settings.corkyLayerId)).toEqual(['main'])
    expect([...h.enabledLayers]).toEqual(['main'])
  })

  test('setLayerEnabled opts a hidden layer in/out (object identity)', () => {
    const h = handleWithViewOverlays()
    feed.setIndicatorEnabled(h, 'SCMR', true)
    expect(feed.setLayerEnabled(h, 'tl', true)).toBe(true)
    expect(dc.data.onchart.map(o => o.settings.corkyLayerId).sort()).toEqual(['main', 'tl'])
    expect([...h.enabledLayers].sort()).toEqual(['main', 'tl'])
    // turning the other hidden one on keeps both, removes neither (no substring del)
    feed.setLayerEnabled(h, 'th', true)
    expect(dc.data.onchart.map(o => o.settings.corkyLayerId).sort()).toEqual(['main', 'th', 'tl'])
    // off
    feed.setLayerEnabled(h, 'tl', false)
    expect(dc.data.onchart.map(o => o.settings.corkyLayerId).sort()).toEqual(['main', 'th'])
    expect([...h.enabledLayers].sort()).toEqual(['main', 'th'])
  })

  test('setLayerEnabled returns false for an unknown layer', () => {
    const h = handleWithViewOverlays()
    expect(feed.setLayerEnabled(h, 'nope', true)).toBe(false)
  })

  test('disabling the kind clears its layers from enabledLayers', () => {
    const h = handleWithViewOverlays()
    feed.setIndicatorEnabled(h, 'SCMR', true)
    feed.setLayerEnabled(h, 'tl', true)
    expect([...h.enabledLayers].sort()).toEqual(['main', 'tl'])
    feed.setIndicatorEnabled(h, 'SCMR', false)
    expect([...h.enabledLayers]).toEqual([])
    expect(dc.data.onchart).toHaveLength(0)
  })

  test('P5: _reapplyEnabled restores indicators + hidden layers after a rebuild', () => {
    // tf-switch: a fresh handle (new built, wiped DC) + the persisted enabled state
    const h = handleWithViewOverlays()
    h.enabled = { kinds: [{ display_label: 'SCMR', kind: 'SCMR' }], layers: ['main', 'tl'] }
    feed._reapplyEnabled(h)
    // visible 'main' (via setIndicatorEnabled) + opted-in hidden 'tl'; 'th' stays off
    expect(dc.data.onchart.map(o => o.settings.corkyLayerId).sort()).toEqual(['main', 'tl'])
    expect([...h.enabledLayers].sort()).toEqual(['main', 'tl'])
  })

  test('P5: _reapplyEnabled with null enabled is a no-op', () => {
    const h = handleWithViewOverlays()
    h.enabled = null
    feed._reapplyEnabled(h)
    expect(dc.data.onchart).toHaveLength(0)
  })

  test('candle_color: applied on enable, cleared on disable (not at build)', () => {
    const data = [[1000, 1, 2, 0, 1.5, 10], [2000, 1, 2, 0, 1.5, 10]]
    const built = { chart: { type: 'Candles', data }, onchart: [], offchart: [] }
    Object.defineProperty(built, '_candleColor', {
      value: [{ kind: 'SCMR', instanceKey: 'SCMR', field: 'ct', byTs: new Map([[1000, '#23a776'], [2000, '#e54150']]) }],
      enumerable: false
    })
    Object.defineProperty(built, '_candleColorActive', { value: new Set(), enumerable: false })
    const h = { built, addedOverlays: new Set(), enabledKinds: new Set(), enabledLayers: new Set() }

    expect(data[0][6]).toBeUndefined() // candles-only default: not coloured
    // enable (no overlays for the kind, but candle_color makes it meaningful → true)
    expect(feed.setIndicatorEnabled(h, 'scmr', true)).toBe(true)
    expect(data[0][6]).toBe('#23a776')
    expect(data[1][6]).toBe('#e54150')
    expect([...built._candleColorActive]).toEqual(['SCMR'])
    // disable → cleared
    feed.setIndicatorEnabled(h, 'scmr', false)
    expect(data[0][6]).toBe('')
    expect(data[1][6]).toBe('')
    expect(built._candleColorActive.size).toBe(0)
  })
})
