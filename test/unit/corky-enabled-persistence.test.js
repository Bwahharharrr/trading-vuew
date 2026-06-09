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
