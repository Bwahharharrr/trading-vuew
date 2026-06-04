// Golden-master harness for the ScriptEngine.
//
// Drives the singleton engine the same way the web-worker (script_ww.js) does,
// but synchronously in Node and BYPASSING postMessage: upload OHLCV, push a
// script descriptor, run, and capture the `overlay-data` the engine emits via
// `se.send`. This pins the CURRENT numeric semantics (new Function() boxing,
// the FDEFS2 regex rewrite, `_id` lineage, TS buffers) before any Phase 6
// rewrite — exactly the linchpin the plan requires.

import se from '../../src/helpers/script_engine.js'
import { DatasetWW } from '../../src/helpers/dataset.js'
import SyncTransport from '../../src/helpers/transport/sync-transport.js'

// Reset every field the engine mutates so each run is hermetic despite the
// module-level singleton (`export default new ScriptEngine()`).
export function resetEngine() {
  se.map = {}
  se.data = {}
  se.queue = []
  se.delta_queue = []
  se.update_queue = []
  se.tss = {}
  se.mods = {}
  se.std_plus = {}
  se.state = {}
  se.running = false
  se.task = null
  se._restart = false
  se.exec_id = null
  se.custom_main = null
  se._dataHash = null
  se._updateTemplate = null
  se._hooksCache = {}
  se._hooksModsKey = null
  if (se._outputCache && se._outputCache.clear) se._outputCache.clear()
}

// Build a minimal ScriptOverlay descriptor. `update` MUST be a classic
// `function () { ... }` (its source text is extracted via .toString() and
// regex-rewritten) — arrow bodies without braces break get_raw_src().
export function script(uuid, update, props = {}, opts = {}) {
  const useFor = opts.use_for || ['GOLDEN']
  return {
    uuid,
    type: 'ScriptOverlay',
    settings: { $uuid: uuid },
    // ScriptEnv's `this.src` is the whole descriptor; prep() reads
    // `this.src.use_for[0]` and make_box reads `this.src.sett`.
    use_for: useFor,
    sett: {},
    src: {
      use_for: useFor,
      init: opts.init || function () {},
      update,
      post: function () {},
      props,
      sett: {},
      conf: {},
      data: {},
    },
  }
}

// Run one script over `candles`; resolves with the output series (env.data:
// an array of [t, ...values] points), or rejects on timeout.
export function runScript(candles, descriptor, opts = {}) {
  resetEngine()
  const tf = opts.tf || candles[1][0] - candles[0][0]
  const depth = opts.depth || 0
  se.sett = { scripts: true, script_depth: depth }

  return new Promise((resolve, reject) => {
    let done = false
    const timer = setTimeout(() => {
      if (!done) {
        done = true
        reject(new Error(`engine timeout for ${descriptor.uuid}`))
      }
    }, 20000)

    se.send = (type, data) => {
      if (type === 'overlay-data' && !done) {
        done = true
        clearTimeout(timer)
        const entry = data.find((d) => d.id === descriptor.uuid)
        resolve(entry ? entry.data : null)
      }
    }

    se.data.ohlcv = new DatasetWW('ohlcv', candles)
    se.recalc_size()
    se.tf = tf
    se.range = [candles[0][0], candles[candles.length - 1][0]]
    se.queue.push(descriptor)
    se.exec_all()
  })
}

// Round every numeric in the output to a fixed precision so float last-ULP
// jitter across Node/V8 versions does not cause false snapshot failures.
// (FP-tolerance policy: 8 significant decimals — far tighter than any real
// indicator change, loose enough to absorb platform noise.)
export function quantize(series, digits = 8) {
  if (!series) return series
  return series.map((row) =>
    row.map((v) =>
      typeof v === 'number' && Number.isFinite(v)
        ? Number(v.toFixed(digits))
        : v
    )
  )
}

// A compact, snapshot-friendly fingerprint of an output series: length, the
// first/last few fully-quantized points, and an ORDER-SENSITIVE, precision-exact
// hash of ALL values. The hash uses BigInt (no float ULP loss) over values
// quantized to 8 decimals, position-weighted via a rolling polynomial — so an
// interior permutation OR any >1e-8 change in any value is detected (closing
// the additive-checksum permutation/tolerance blind spot).
const HASH_MOD = (2n ** 61n) - 1n // a Mersenne prime
export function fingerprint(series) {
  if (!series) return { series: null }
  const q = quantize(series)
  let h = 0n
  let n = 0n
  for (const row of q) {
    for (const v of row) {
      if (typeof v === 'number' && Number.isFinite(v)) {
        const iv = BigInt(Math.round(v * 1e8)) // 8-decimal precision, integer
        // position-sensitive rolling hash (+HASH_MOD keeps it positive for -ve iv)
        h = ((h * 1000003n + iv) % HASH_MOD + HASH_MOD) % HASH_MOD
        n++
      }
    }
  }
  return {
    length: q.length,
    head: q.slice(0, 3),
    tail: q.slice(-3),
    valueCount: Number(n),
    hash: h.toString(),
  }
}

// The golden indicator corpus — single source of truth, shared by the
// singleton-drive golden test and the SyncTransport equivalence test. Bodies
// MUST stay verbatim: their .toString() source is regex-rewritten by the
// engine, so any edit changes the computed _id lineage (and the snapshots).
export const CORPUS = [
  ['sma', function () { return sma(close, 20) }],
  ['ema', function () { return ema(close, 20) }],
  ['rma', function () { return rma(close, 14) }],
  ['wma', function () { return wma(close, 20) }],
  ['vwma', function () { return vwma(close, 20) }],
  ['hma', function () { return hma(close, 16) }],
  ['swma', function () { return swma(close) }],
  ['alma', function () { return alma(close, 20, 0.85, 6) }],
  ['atr', function () { return atr(14) }],
  ['tr', function () { return tr() }],
  ['rsi', function () { return rsi(close, 14) }],
  ['roc', function () { return roc(close, 10) }],
  ['mom', function () { return mom(close, 10) }],
  ['change', function () { return change(close, 1) }],
  ['dev', function () { return dev(close, 20) }],
  ['stdev', function () { return stdev(close, 20) }],
  ['cci', function () { return cci(close, 20) }],
  ['cmo', function () { return cmo(close, 14) }],
  ['cog', function () { return cog(close, 10) }],
  ['wpr', function () { return wpr(14) }],
  ['highest', function () { return highest(close, 20) }],
  ['lowest', function () { return lowest(close, 20) }],
  ['linreg', function () { return linreg(close, 20, 0) }],
  ['tsi', function () { return tsi(close, 25, 13) }],
  ['mfi', function () { return mfi(close, 14) }],
  ['macd', function () { return macd(close, 12, 26, 9)[0][0] }],
  ['bb_basis', function () { return bb(close, 20, 2)[0][0] }],
  ['stoch', function () { return stoch(close, high, low, 14) }],
]

// Drive a script through the REAL message dispatch via SyncTransport (Phase 3.2)
// — uploads data + execs the script exactly as the worker would, in-process.
// Resolves with the same output series shape as runScript(). Used to prove the
// SyncTransport path is byte-identical to the singleton drive path.
export function runViaSyncTransport(candles, descriptor, opts = {}) {
  const t = new SyncTransport()
  const tf = opts.tf || '1D'
  const range = [candles[0][0], candles[candles.length - 1][0]]
  return new Promise((resolve, reject) => {
    let done = false
    const timer = setTimeout(() => {
      if (!done) { done = true; reject(new Error(`sync timeout ${descriptor.uuid}`)) }
    }, 20000)
    t.onevent = (e) => {
      if (e.data && e.data.type === 'overlay-data' && !done) {
        done = true
        clearTimeout(timer)
        const entry = e.data.data.find((d) => d.id === descriptor.uuid)
        resolve(entry ? entry.data : null)
      }
    }
    ;(async () => {
      try {
        await t.send({ type: 'update-dc-settings', data: { scripts: true, script_depth: 0 } })
        await t.send({ type: 'upload-data', data: { ohlcv: candles } })
        await t.send({ type: 'exec-script', data: { s: descriptor, tf, range } })
      } catch (e) {
        if (!done) { done = true; clearTimeout(timer); reject(e) }
      }
    })()
  })
}
