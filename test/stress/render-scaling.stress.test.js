// @vitest-environment jsdom
//
// Render-SCALING stress benchmark. The thesis: the chart only ever materialises
// the VISIBLE slice (binary-search bounds → Array.slice → draw), so per-frame
// cost is O(log n + visible), NOT O(total). This measures that directly:
//   1. fast_filter (the per-frame, per-overlay visible-window extractor) across
//      1k → 1,000,000 candles — should stay ~flat.
//   2. The same for many overlays (each overlay slices independently per frame).
//   3. A REAL TradingVue mount at growing N — initial build is O(n) (one-time),
//      but a subsequent redraw (range change) stays cheap.
//
// Assertions are LOOSE (perf, not correctness — must not flake); the value is the
// logged table. Run: `npx vitest run test/stress/render-scaling.stress.test.js`.
import { test, expect, describe, beforeEach, afterEach } from 'vitest'
import { appendFileSync } from 'fs'
import Utils from '../../src/stuff/utils.js'
import TradingVue from '../../src/TradingVue.vue'
import DataCube from '../../src/helpers/datacube.js'
import {
  mount, installCanvasEnv, uninstallCanvasEnv, settle, totalDrawCalls,
} from '../component/_component-harness.js'

// Perf benchmark logs go to a file (vitest captures console). `cat /tmp/scaling.txt`.
const REPORT = process.env.SCALING_REPORT || '/tmp/scaling.txt'
const out = (s) => { try { appendFileSync(REPORT, s + '\n') } catch (_) { /* ignore */ } }

const T0 = 1_600_000_000_000
const TF = 60000

function genCandles(n) {
  const a = new Array(n)
  for (let i = 0; i < n; i++) {
    const t = T0 + i * TF
    const p = 100 + Math.sin(i / 50) * 5
    a[i] = [t, p, p + 1, p - 1, p + 0.5, 100 + i]
  }
  return a
}
function bench(fn, iters) {
  for (let i = 0; i < 5; i++) fn()                // warmup
  const s = performance.now()
  for (let i = 0; i < iters; i++) fn()
  return (performance.now() - s) / iters
}

describe('per-frame visible-slice cost is ~flat as total data grows', () => {
  test('fast_filter: 1k → 1,000,000 candles, fixed ~500-candle visible window', () => {
    const VISIBLE = 500
    const rows = []
    for (const n of [1000, 10000, 100000, 1000000]) {
      const data = genCandles(n)
      const mid = T0 + Math.floor(n / 2) * TF        // middle window = worst-case search depth
      const t1 = mid; const t2 = mid + VISIBLE * TF
      const ms = bench(() => Utils.fast_filter(data, t1, t2), 300)
      const [res] = Utils.fast_filter(data, t1, t2)
      rows.push({ n, ms, visible: res.length })
    }
    out('\nfast_filter (visible≈500), per-call:')
    for (const r of rows) out(`  N=${String(r.n).padStart(9)}  ${r.ms.toFixed(4)} ms  (sliced ${r.visible})`)
    // O(log n): 1000× the data must NOT be anywhere near 1000× slower.
    const ratio = rows[3].ms / Math.max(rows[0].ms, 1e-4)
    out(`  → 1M vs 1k slowdown: ${ratio.toFixed(1)}× (data is 1000× larger)`)
    expect(rows[3].ms).toBeLessThan(rows[0].ms * 40 + 2)
  })

  test('many overlays: 20 series each sliced per frame, 100k points each', () => {
    const N = 100000
    const overlays = Array.from({ length: 20 }, () => genCandles(N))
    const mid = T0 + Math.floor(N / 2) * TF
    const t1 = mid; const t2 = mid + 500 * TF
    const ms = bench(() => { for (const ov of overlays) Utils.fast_filter(ov, t1, t2) }, 100)
    out(`\n20 overlays × 100k pts, slice ALL per frame: ${ms.toFixed(3)} ms/frame (${(ms / 20).toFixed(4)} ms/overlay)`)
    expect(ms).toBeLessThan(50)                      // ~real-time even with 20 heavy overlays
  })
})

describe('real TradingVue: build is O(n) once, redraw stays cheap', () => {
  let wrapper
  beforeEach(() => installCanvasEnv())
  afterEach(() => { if (wrapper) wrapper.unmount(); uninstallCanvasEnv() })

  test('mount + first render + a range-change redraw across growing N', async () => {
    const rows = []
    for (const n of [1000, 20000, 100000]) {
      const dc = new DataCube({ ohlcv: genCandles(n) }, { scripts: false, validation: 'off' })
      const tMount0 = performance.now()
      wrapper = mount(TradingVue, { props: { data: dc, width: 800, height: 500 }, attachTo: document.body })
      await settle()
      const mountMs = performance.now() - tMount0
      const drewMount = totalDrawCalls()
      // A redraw: shift the visible range (pan) and settle.
      const tv = wrapper.vm
      const tRedraw0 = performance.now()
      const r = tv.getRange ? tv.getRange() : null
      if (r && tv.setRange) tv.setRange(r[0] + 50 * TF, r[1] + 50 * TF)
      await settle()
      const redrawMs = performance.now() - tRedraw0
      rows.push({ n, mountMs, redrawMs, drewMount })
      wrapper.unmount(); wrapper = null
    }
    out('\nReal TradingVue mount (jsdom, recording ctx):')
    for (const r of rows) {
      out(`  N=${String(r.n).padStart(7)}  mount+firstRender=${r.mountMs.toFixed(0)}ms  redraw(pan)=${r.redrawMs.toFixed(0)}ms  (draws=${r.drewMount})`)
    }
    // Redraw cost should NOT scale ~linearly with N (visible window is constant).
    const redrawSmall = rows[0].redrawMs
    const redrawBig = rows[rows.length - 1].redrawMs
    out(`  → redraw 100k vs 1k: ${(redrawBig / Math.max(redrawSmall, 1)).toFixed(1)}× (data 100× larger)`)
    expect(redrawBig).toBeLessThan(redrawSmall * 25 + 200)
  }, 60000)
})
