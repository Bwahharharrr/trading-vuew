// @vitest-environment jsdom
//
// vr-3 "Strategy B" proxy-count micro-bench / gate.
//
// THESIS: the DataCube's LARGE inner ROW arrays — dc.data.chart.data (the OHLCV
// tuple array) and every overlay's .data / .raw — are made NON-reactive with
// markRaw at creation, so Vue never allocates the ~6N per-row reactive proxies
// (one Array proxy + a get-trap per accessed row). The cube ROOT, the chart
// OBJECT, the onchart / offchart CONTAINER arrays and all settings objects MUST
// stay reactive (they drive Chart.vue structure computeds + the dc_core $watch-es).
//
// What this file pins:
//   1. After Vue makes `dc.data` reactive (exactly what passing it as a prop to
//      <trading-vue> does — reactive() recursively proxies nested objects), the
//      inner row arrays report isReactive === false, while the cube root / chart
//      object / container arrays / settings report isReactive === true.
//   2. Reading individual rows out of a reactive cube returns the RAW row object
//      (=== the source row, isReactive false) — i.e. NO per-row get-trap proxy is
//      ever materialised, even for a freshly mounted reactive cube.
//   3. The NEW-array creation sites (chart.data via init_data, overlay add,
//      bootstrap onchart/offchart, in-place replacement of chart.data) all hand
//      back markRaw'd arrays, so a later in-place write can't re-proxy them.
//   4. A LOOSE perf assertion: building the reactive N=50k cube touches ~0 row
//      proxies (we instrument with a Proxy-trap counter) and stays well within a
//      generous wall-clock budget — guards against a regression that re-proxies
//      rows. Assertions are deliberately slack (perf, must not flake); the value
//      is the logged table.
//
// Run: `npx vitest run test/stress/markraw-proxy-count.stress.test.js`.
import { test, expect, describe } from 'vitest'
import { reactive, isReactive, toRaw } from 'vue'
import { appendFileSync } from 'fs'
import DataCube from '../../src/helpers/datacube.js'

const REPORT = process.env.MARKRAW_REPORT || '/tmp/markraw.txt'
const out = (s) => { try { appendFileSync(REPORT, s + '\n') } catch (_) { /* ignore */ } }

const T0 = 1_600_000_000_000
const TF = 60_000

function genCandles(n) {
  const a = new Array(n)
  for (let i = 0; i < n; i++) {
    const t = T0 + i * TF
    const p = 100 + Math.sin(i / 50) * 5
    a[i] = [t, p, p + 1, p - 1, p + 0.5, 100 + i]
  }
  return a
}
function genLine(n) {
  const a = new Array(n)
  for (let i = 0; i < n; i++) a[i] = [T0 + i * TF, 100 + Math.sin(i / 30) * 3]
  return a
}

// Mirror what mounting <trading-vue :data="dc"> does: Vue makes the data PROP
// reactive, recursively proxying nested objects — but it must STOP at markRaw'd
// arrays. (We can't mount a real component just to read isReactive cheaply at
// N=50k, and reactive() is the exact same operation Vue applies to the prop.)
function makeMounted(dc) {
  // init_data is what wires chart.data / onchart / offchart + markRaw's the rows.
  if (typeof dc.init_data === 'function') dc.init_data()
  // reactive() returns a proxy of dc.data; nested non-raw objects get proxied.
  dc.data = reactive(dc.data)
  return dc.data
}

describe('vr-3 Strategy B: large row arrays are non-reactive (markRaw)', () => {
  test('row arrays NOT reactive; cube root / chart / containers / settings ARE', () => {
    const dc = new DataCube(
      {
        ohlcv: genCandles(2000),
        // Overlays carry their own settings object (as real overlays do) so we
        // can pin that settings stay reactive — the boundary line.
        onchart: [{ name: 'EMA', type: 'EMA', data: genLine(2000), settings: { color: '#f00' } }],
        offchart: [{ name: 'RSI', type: 'RSI', data: genLine(2000), settings: { color: '#0f0' } }],
      },
      { scripts: false, validation: 'off' }
    )
    const data = makeMounted(dc)

    // --- STAY REACTIVE (structure / settings drivers) ---
    expect(isReactive(data)).toBe(true)               // cube root (dc.data)
    expect(isReactive(data.chart)).toBe(true)         // chart OBJECT
    expect(isReactive(data.onchart)).toBe(true)       // onchart CONTAINER array
    expect(isReactive(data.offchart)).toBe(true)      // offchart CONTAINER array
    expect(isReactive(data.chart.settings)).toBe(true)
    expect(isReactive(data.onchart[0])).toBe(true)    // overlay OBJECT (wrapper)
    expect(isReactive(data.onchart[0].settings)).toBe(true)
    expect(isReactive(data.offchart[0])).toBe(true)
    expect(isReactive(data.offchart[0].settings)).toBe(true)

    // --- NON-REACTIVE (the large inner ROW arrays) ---
    expect(isReactive(data.chart.data)).toBe(false)
    expect(isReactive(data.onchart[0].data)).toBe(false)
    expect(isReactive(data.offchart[0].data)).toBe(false)
  })

  test('reading rows out of a reactive cube returns RAW rows (no per-row proxy)', () => {
    const dc = new DataCube(
      { ohlcv: genCandles(1000), onchart: [{ name: 'EMA', type: 'EMA', data: genLine(1000) }] },
      { scripts: false, validation: 'off' }
    )
    const srcChart = dc.data.ohlcv          // grab source refs BEFORE init_data deletes ohlcv
    const data = makeMounted(dc)

    const arr = data.chart.data
    // The row array itself is the raw source array (markRaw is identity-preserving).
    expect(toRaw(arr)).toBe(arr)
    // Individual rows are NOT proxied: reading [i] gives back the original tuple
    // (=== identity) and is not reactive — i.e. no get-trap proxy materialised.
    for (const i of [0, 1, 499, 999]) {
      expect(isReactive(arr[i])).toBe(false)
      expect(arr[i]).toBe(srcChart[i])
    }
    const ov = data.onchart[0].data
    expect(isReactive(ov[0])).toBe(false)
    expect(isReactive(ov[ov.length - 1])).toBe(false)
  })

  test('every NEW-array creation/replacement site hands back a markRaw array', () => {
    const dc = new DataCube({ ohlcv: genCandles(500) }, { scripts: false, validation: 'off' })
    const data = makeMounted(dc)

    // (a) init_data created chart.data raw (covered above) — re-assert post-mount.
    expect(isReactive(data.chart.data)).toBe(false)

    // (b) WHOLE-array REPLACEMENT of chart.data (the chunk-load / tf-switch / merge
    //     path). set('chart.data', newArr) lands the NEW array via the chart-data
    //     store's markRaw guard (chart-data.js set()), so it must arrive raw — and
    //     a later IN-PLACE write on it must NOT re-proxy (the one gap the migration
    //     closes). The onchart/offchart CONTAINER arrays must stay reactive.
    expect(typeof dc.set).toBe('function')
    dc.set('chart.data', genCandles(700))
    expect(isReactive(data.chart.data)).toBe(false)
    expect(isReactive(data.onchart)).toBe(true)        // container stays reactive
    expect(isReactive(data.offchart)).toBe(true)

    // In-place push on the (markRaw'd) array keeps both the array and its rows raw.
    data.chart.data.push([T0 + 9_999 * TF, 1, 2, 0.5, 1.5, 1])
    expect(isReactive(data.chart.data)).toBe(false)
    expect(isReactive(data.chart.data[data.chart.data.length - 1])).toBe(false)

    // (c) An in-place ROW REPLACEMENT (live current-candle upsert) on the raw
    //     array also stays raw — no re-proxy of the slot.
    const last = data.chart.data.length - 1
    data.chart.data[last] = [data.chart.data[last][0], 9, 10, 8, 9.5, 7]
    expect(isReactive(data.chart.data[last])).toBe(false)
  })

  test('N=50k: building the reactive cube allocates ~0 ROW proxies (loose perf)', () => {
    const N = 50_000

    // Instrument: count how many of OUR row tuples Vue tries to wrap in a reactive
    // proxy. We seed the cube with rows that are themselves tiny Proxies whose
    // `get`/`has` traps bump a counter ONLY when Vue probes them for reactivity
    // (Vue reads `__v_skip` / `__v_isReadonly` / `__v_raw` on the target before
    // proxying). If the row arrays are markRaw'd, Vue never descends into them, so
    // these traps fire ~0 times for the rows. (A handful of probes on the row
    // ARRAYS themselves is fine — that's O(#arrays), not O(N).)
    let rowProbes = 0
    const REACTIVE_KEYS = new Set(['__v_skip', '__v_isReactive', '__v_isReadonly', '__v_raw', '__v_isRef'])
    const wrapRow = (tuple) => new Proxy(tuple, {
      get(t, k) {
        if (typeof k === 'string' && k.startsWith('__v_')) rowProbes++
        return Reflect.get(t, k)
      },
    })

    const ohlcv = new Array(N)
    for (let i = 0; i < N; i++) {
      ohlcv[i] = wrapRow([T0 + i * TF, 100, 101, 99, 100.5, 100 + i])
    }

    const tBuild0 = performance.now()
    const dc = new DataCube({ ohlcv }, { scripts: false, validation: 'off' })
    const data = makeMounted(dc)
    const buildMs = performance.now() - tBuild0

    // Touch the structure the way the render path / computeds would, forcing Vue
    // to materialise any lazy nested proxies it WOULD create.
    expect(isReactive(data)).toBe(true)
    expect(isReactive(data.chart)).toBe(true)
    expect(isReactive(data.chart.data)).toBe(false)
    const arr = data.chart.data
    // Walk every row once (this is where ~6N per-row proxies WOULD be created if
    // the array were reactive). With markRaw, reads go straight through.
    let acc = 0
    for (let i = 0; i < arr.length; i++) acc += arr[i][4]
    expect(acc).toBeGreaterThan(0)
    // Each row read returns the RAW wrapped tuple — never a reactive proxy of it.
    expect(isReactive(arr[0])).toBe(false)
    expect(isReactive(arr[N - 1])).toBe(false)

    out(`\nN=${N}: build+reactive(cube)+walk = ${buildMs.toFixed(1)} ms, rowProbes=${rowProbes}`)

    // --- ASSERTIONS ---
    // The whole point: Vue did NOT probe our N rows for reactivity (it stopped at
    // the markRaw'd array). Allow a tiny constant slack for any incidental probe.
    expect(rowProbes).toBeLessThan(100)
    // Loose wall-clock budget (perf regression guard, generous to avoid flakes).
    expect(buildMs).toBeLessThan(5000)
    // sanity: REACTIVE_KEYS is referenced (documents which probes we watch for).
    expect(REACTIVE_KEYS.has('__v_skip')).toBe(true)
  }, 30000)
})
