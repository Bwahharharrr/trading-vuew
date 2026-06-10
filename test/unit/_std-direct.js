// Direct-invocation harness for the ScriptStd source modules.
//
// ScriptStd._index_tracking() recompiles every TS method via new Function(), so
// driving indicators through the engine never executes the SOURCE lines (the
// golden suite pins their VALUES but not their coverage). Here we bind the raw
// *Fns objects onto a plain `this` with a working ts()/env.tss and drive bars
// the way the engine does (unshift every buffer per bar) — so the actual source
// functions run and are covered.
import {
  mathFns, timeFns, chartFns, utilsFns, analysisFns, indicatorFns, timeseriesFns,
} from '../../src/helpers/std/index.js'
import se from '../../src/helpers/script_state.js'

// A ScriptStd-shaped context whose methods are the UN-rewritten source fns.
export function mkStd(shared = {}) {
  const env = { tss: {}, shared, onchart: {}, offchart: {} }
  const ctx = { env, SWMA: [1 / 6, 2 / 6, 2 / 6, 1 / 6], STDEV_EPS: 1e-10, STDEV_Z: 1e-4 }
  Object.assign(ctx, mathFns, timeFns, chartFns, utilsFns, analysisFns, indicatorFns, timeseriesFns)
  return ctx
}

// A TS-like array (newest at [0]); tagged so the source `__id__` checks pass.
export function ts(arr, id = 'src') {
  const a = arr.slice()
  a.__id__ = id
  return a
}

// Drive `run(std, inputs)` across bars. `bars` is an array of {close, high,
// low, vol} (or just a number = close). env.shared.{open,high,low,close,vol} and
// the local series are advanced (unshift) each bar exactly like the engine, so
// indicators see real history; returns the per-bar output value ([0]).
export function runBars(bars, run) {
  const std = mkStd()
  const series = {}
  const SH = ['open', 'high', 'low', 'close', 'vol']
  for (const k of SH) { const a = []; a.__id__ = k; series[k] = a; std.env.shared[k] = a }
  // Some indicators (e.g. sar) read the engine's bar counter / current time off
  // the script-state singleton. Drive them here (and on the std env too).
  const TF = 60_000
  const out = []
  for (let b = 0; b < bars.length; b++) {
    const raw = bars[b]
    const bar = typeof raw === 'number'
      ? { open: raw, high: raw + 1, low: raw - 1, close: raw, vol: 1 }
      : raw
    se.iter = b
    se.t = b * TF
    se.tf = TF
    std.env.iter = b
    std.env.t = se.t
    // New bar: every existing TS buffer shifts down one slot.
    for (const id in std.env.tss) std.env.tss[id].unshift(undefined)
    for (const k of SH) series[k].unshift(bar[k] != null ? bar[k] : bar.close)
    const r = run(std, series)
    out.push(Array.isArray(r) ? r[0] : r)
  }
  return out
}

export const lastFinite = (xs) => {
  for (let i = xs.length - 1; i >= 0; i--) if (Number.isFinite(xs[i])) return xs[i]
  return undefined
}
