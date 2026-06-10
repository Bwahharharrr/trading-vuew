// @vitest-environment jsdom
// P5 reload-persistence: the per-venue|symbol enabled-indicator/layer memory
// (corkyEnabled) survives a localStorage save→load round-trip.
import { test, expect, beforeEach } from 'vitest'
import fileManager from '../../src/mixins/app/file-manager.js'

const { saveStateToStorage, loadStateFromStorage } = fileManager.methods

function ctx(over) {
  return Object.assign({
    selectedDataFile: null,
    getIndicatorSettings: () => ({}),
    selectedView: '',
    log_scale: true,
    indicatorVisibility: {},
    persistentIndicatorVisibility: {},
    accordionExpandedViews: {},
    corkyEnabled: {},
    corkyLast: null,
  }, over)
}

beforeEach(() => { localStorage.clear(); sessionStorage.clear() })

test('corkyEnabled survives a save→load round-trip', () => {
  const mem = {
    'BITFINEX|tBTCUSD': { kinds: [{ display_label: 'SCMR', kind: 'scmr' }], layers: ['tl', 'th'] },
    'BITFINEX|tETHUSD': { kinds: [{ display_label: 'MACD', kind: 'macd' }], layers: [] },
  }
  saveStateToStorage.call(ctx({ corkyEnabled: mem }))
  const loaded = loadStateFromStorage.call(ctx({}))
  expect(loaded.corkyEnabled).toEqual(mem)
})

test('missing corkyEnabled loads as undefined (App defaults to {})', () => {
  saveStateToStorage.call(ctx({})) // corkyEnabled = {}
  const loaded = loadStateFromStorage.call(ctx({}))
  expect(loaded.corkyEnabled).toEqual({})
})

test('hiddenLayers ([x]-closed default-visible layers) survive the round-trip', () => {
  const mem = {
    'BITFINEX|tBTCUSD': {
      kinds: [{ display_label: 'MACD', kind: 'macd' }],
      layers: ['hist', 'lines'],
      hiddenLayers: ['bull'], // bull-strength pane closed via its [x]
    },
  }
  saveStateToStorage.call(ctx({ corkyEnabled: mem }))
  const loaded = loadStateFromStorage.call(ctx({}))
  expect(loaded.corkyEnabled['BITFINEX|tBTCUSD'].hiddenLayers).toEqual(['bull'])
})

test('corkyLast (last venue/symbol/timeframe) survives the round-trip', () => {
  const last = { venue: 'BITFINEX', symbol: 'tBTCUSD', timeframe: '15m' }
  saveStateToStorage.call(ctx({ corkyLast: last }))
  const loaded = loadStateFromStorage.call(ctx({}))
  expect(loaded.corkyLast).toEqual(last)
})
