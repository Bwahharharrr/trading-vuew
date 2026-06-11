// @vitest-environment jsdom
// indicator-manager mixin (File-mode visibility/settings — previously
// unloaded by any test): display toggles, persistence into this.charts,
// onCloseIndicator routing (incl. the gateway early-return we added), and the
// settings snapshot used for sessionStorage restore.
import { test, expect, describe, vi } from 'vitest'
import indicatorManager from '../../src/mixins/app/indicator-manager.js'

const M = indicatorManager.methods

function mkCtx(over = {}) {
  const offchart = [
    { name: 'RSI', type: 'Range', data: [], settings: { upper: 70 } },
    { name: 'MACD', type: 'Splines', data: [], settings: {} },
  ]
  const ctx = {
    chart: { data: { chart: { data: [] }, onchart: [], offchart } },
    // tf-source entries carry NAMES (the mirror writes resolve by name now —
    // the positional write was the M25 wrong-indicator bug)
    charts: { '15m': { offchart: [{ name: 'RSI', settings: {} }, { name: 'OBV', settings: {} }] } },
    currentTimeframe: '15m',
    indicatorVisibility: {},
    persistentIndicatorVisibility: {},
    accordionExpandedViews: {},
    persistentIndicatorsClipped: [],
    saveStateToStorage: vi.fn(),
    $nextTick: (fn) => fn && fn(),
    $refs: { tradingVue: { refreshOffchartOverlays: vi.fn() } },
  }
  Object.assign(ctx, M)
  // Spies AFTER the real methods (these exist in the mixin too).
  ctx.clipPersistentIndicators = vi.fn()
  ctx.applyCurrentColoring = vi.fn()
  ctx.closeCorkyIndicator = vi.fn(() => false) // gateway handler declines by default
  return Object.assign(ctx, over)
}

describe('toggleIndicatorVisibility', () => {
  test('flips display, remembers by name, persists into this.charts[tf]', () => {
    const ctx = mkCtx()
    ctx.toggleIndicatorVisibility(0)
    expect(ctx.chart.data.offchart[0].settings.display).toBe(false)
    expect(ctx.indicatorVisibility.RSI).toBe(false)
    // mirrored into the tf source so a tf-switch keeps the hide
    expect(ctx.charts['15m'].offchart[0].settings.display).toBe(false)
    ctx.toggleIndicatorVisibility(0)
    expect(ctx.chart.data.offchart[0].settings.display).toBe(true)
  })

  test('out-of-range index is a no-op', () => {
    const ctx = mkCtx()
    expect(() => ctx.toggleIndicatorVisibility(99)).not.toThrow()
  })
})

describe('onCloseIndicator routing', () => {
  test('gateway handler wins when it accepts the close', () => {
    const ctx = mkCtx({ closeCorkyIndicator: vi.fn(() => true) })
    ctx.onCloseIndicator({ name: 'RSI' })
    expect(ctx.chart.data.offchart[0].settings.display).not.toBe(false) // File flip skipped
  })

  test('File path: regular indicator → display flip; persistent → its own toggle', () => {
    const ctx = mkCtx()
    ctx.onCloseIndicator({ name: 'MACD' })
    expect(ctx.chart.data.offchart[1].settings.display).toBe(false)

    const ctx2 = mkCtx({
      persistentIndicatorsClipped: [{ name: 'Alerts' }],
    })
    ctx2.onCloseIndicator({ name: 'Alerts' })
    expect(ctx2.persistentIndicatorVisibility.Alerts).toBe(false)
    expect(ctx2.saveStateToStorage).toHaveBeenCalled()
  })
})

describe('getIndicatorSettings snapshot', () => {
  test('captures name → {type, settings} for every offchart indicator', () => {
    const ctx = mkCtx()
    expect(ctx.getIndicatorSettings()).toEqual({
      RSI: { type: 'Range', settings: { upper: 70 } },
      MACD: { type: 'Splines', settings: {} },
    })
    expect(mkCtx({ chart: null }).getIndicatorSettings()).toEqual({})
  })
})

describe('applyIndicatorSettings', () => {
  test('offchart indicator: updates type + merges settings + persists to charts[tf]', () => {
    const ctx = mkCtx()
    ctx.indicatorSettingsData = { type: 'Range', settings: {} }
    ctx.applyIndicatorSettings({
      gridId: 1, indicatorIndex: 0, newType: 'Spline', newSettings: { color: '#0f0' },
    })
    const ind = ctx.chart.data.offchart[0]
    expect(ind.type).toBe('Spline')
    expect(ind.settings.color).toBe('#0f0')
    expect(ind.settings.upper).toBe(70) // prior setting preserved (merge)
    expect(ctx.charts['15m'].offchart[0].type).toBe('Spline')
    expect(ctx.indicatorSettingsData.type).toBe('Spline')
    expect(ctx.saveStateToStorage).toHaveBeenCalled()
  })

  test('index -1 (attached volume): merges onto the candle overlay + invalidates', () => {
    const invalidate = vi.fn()
    const ctx = mkCtx()
    ctx.chart.data.chart = { settings: {}, data: [] }
    ctx.chart.data.$cd = { invalidate }
    ctx.applyIndicatorSettings({ indicatorIndex: -1, newSettings: { colorVolUp: '#abc' } })
    expect(ctx.chart.data.chart.settings.colorVolUp).toBe('#abc')
    expect(invalidate).toHaveBeenCalled()
  })
})

describe('accordion + persistent visibility state', () => {
  test('toggleAccordion and persistent visibility round-trip', () => {
    const ctx = mkCtx()
    ctx.toggleAccordion('SCMR')
    expect(ctx.accordionExpandedViews.SCMR).toBe(true)
    ctx.togglePersistentIndicatorVisibility('Alerts')
    expect(ctx.persistentIndicatorVisibility.Alerts).toBe(false)
    expect(ctx.clipPersistentIndicators).toHaveBeenCalled()
    expect(ctx.applyCurrentColoring).toHaveBeenCalled()
  })
})

describe('M25 — mirror writes resolve by NAME (combined-index offset bug)', () => {
  test('with a persistent indicator prefixed, toggling hits the RIGHT source entry', () => {
    const ctx = mkCtx()
    // live combined array: [Persistent, RSI, MACD] — indexes shifted by 1
    ctx.chart.data.offchart = [
      { name: 'Persist', type: 'Spline', data: [], settings: {} },
      { name: 'RSI', type: 'Range', data: [], settings: { upper: 70 } },
      { name: 'MACD', type: 'Splines', data: [], settings: {} },
    ]
    ctx.toggleIndicatorVisibility(1)   // RSI in the combined array
    // the OLD positional write would have hidden charts['15m'].offchart[1] (OBV)
    expect(ctx.charts['15m'].offchart[0].settings.display).toBe(false) // RSI ✓
    expect(ctx.charts['15m'].offchart[1].settings.display).toBeUndefined() // OBV untouched
  })
})
