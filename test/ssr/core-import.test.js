// SSR-safe-import gate (review-added cross-cutting concern).
//
// A Vue 3 library must not crash merely on import in a server/Node context.
// The full <TradingVue> component is legitimately browser-only (canvas +
// hammerjs/hamsterjs gesture libs touch `window` at module-eval, like every
// canvas charting lib), but the DATA/LOGIC CORE must import and run with no
// DOM. This test pins that invariant so a future change that leaks top-level
// `window`/`document` access into a core module is caught immediately.
//
// (Full-component lazy-gesture SSR support is tracked for Phase 4, where the
// component is restructured behind defineOverlay/composables.)
//
// @vitest-environment node
import { test, expect, describe } from 'vitest'

describe('SSR-safe import of the logic core', () => {
  test('no DOM globals present in this environment', () => {
    expect(typeof window).toBe('undefined')
    expect(typeof document).toBe('undefined')
  })

  test('Utils imports and computes without a DOM', async () => {
    const { default: Utils } = await import('../../src/stuff/utils.js')
    expect(typeof Utils.uuid()).toBe('string')
    expect(Utils.now()).toBeGreaterThan(0)
  })

  test('Constants import without a DOM', async () => {
    const { default: Constants } = await import('../../src/stuff/constants.js')
    expect(Constants).toBeTruthy()
  })

  test('RenderMetrics imports and runs without a DOM', async () => {
    const { default: RenderMetrics } = await import('../../src/stuff/metrics.js')
    const m = new RenderMetrics()
    m.frame(() => m.drawCall())
    expect(m.snapshot().frames).toBe(1)
  })

  test('ws-helpers (pure live-feed helpers) import without a DOM', async () => {
    const ws = await import('../../src/helpers/ws-helpers.js')
    expect(ws.buildWsUrl({ ws: { port: 8765 } }, 'http:', 'localhost', '10850'))
      .toBe('ws://localhost:10850/live-ws/8765')
  })

  test('the gesture loader imports without evaluating hammerjs/hamsterjs (SSR-safe)', async () => {
    // hammerjs/hamsterjs touch `window` at module-eval; the lazy loader must
    // NOT pull them in just by being imported (only on loadGestures()). This is
    // what unblocked bare-import of the full library in Node/SSR.
    const g = await import('../../src/stuff/gestures.js')
    expect(typeof g.loadGestures).toBe('function')
    expect(g.loadedGestures()).toBe(null) // nothing loaded just from importing
  })

  test('ScriptEngine core imports and computes headless (no worker/DOM)', async () => {
    // Drives the engine directly, proving indicator computation needs no DOM.
    const { runScript, script } = await import('../golden/_engine-harness.js')
    const { readFileSync } = await import('node:fs')
    const btc = JSON.parse(
      readFileSync(new URL('../data/data_btc.json', import.meta.url))
    ).ohlcv
    const out = await runScript(
      btc.slice(0, 200),
      script('sma', function () { return sma(close, 20) }, { len: { def: 20 } })
    )
    expect(out.some((p) => Number.isFinite(p[1]))).toBe(true)
  })
})
