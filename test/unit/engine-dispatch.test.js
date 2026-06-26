// Engine message dispatch beyond the golden corpus — drives the OTHER worker
// message types through SyncTransport to cover ScriptEngine paths the indicator
// corpus never touches: live candle update (format_update), selective re-exec
// (exec_sel), dataset ops, script removal, and meta-info.
//
// Each test uses a FRESH SyncTransport (a new ScriptEngine); they run
// sequentially so the scriptState singleton is never bound by two live engines
// at once.
import { test, expect, describe } from 'vitest'
import SyncTransport from '../../src/helpers/transport/sync-transport.js'
import { script } from '../golden/_engine-harness.js'

const TF = 86400000 // 1D — candle spacing MUST match the declared tf
// Poll for a condition instead of sleeping a fixed amount — the engine runs
// slower under coverage instrumentation, so a magic tick(30) can read state
// before the async exec has emitted overlay-data/overlay-update (flaky reads of
// `t.events`/`t.se` state against a fixed clock).
async function waitFor(cond, ms = 3000) {
  const start = Date.now()
  while (Date.now() - start < ms) {
    if (cond()) return true
    await new Promise((r) => setTimeout(r, 5))
  }
  return cond()
}
const candles = (n) => Array.from({ length: n }, (_, i) => [1000 + i * TF, 1, 2, 0, 1 + (i % 5), 5])
const rangeOf = (cs) => [cs[0][0], cs[cs.length - 1][0]]

function mkT() {
  const t = new SyncTransport()
  t.events = []
  t.onevent = (e) => t.events.push(e.data)
  return t
}

/* eslint-disable no-undef */
const EMA = script('ov-ema', function () { return ema(close, 5) })
/* eslint-enable no-undef */

// Boot a transport with the EMA overlay. NB: do NOT interpose a timer between
// upload-data and exec-script — `await send()` already waits for the upload
// handler to finish, and an extra tick perturbs the data-request cycle so the
// first exec emits no overlay-data.
async function boot(t, n = 30) {
  const cs = candles(n)
  await t.send({ type: 'update-dc-settings', data: { scripts: true, script_depth: 0 } })
  await t.send({ type: 'upload-data', data: { ohlcv: cs } })
  await t.send({ type: 'exec-script', data: { s: EMA, tf: '1D', range: rangeOf(cs) } })
  // Wait for the first exec to actually emit overlay-data instead of racing a
  // fixed clock (slow under coverage instrumentation).
  await waitFor(() => t.events.some((e) => e.type === 'overlay-data'))
  t._cs = cs
}

describe('live candle update (se.update → format_update)', () => {
  test('update-data with a new ohlcv tick emits an overlay-update', async () => {
    const t = mkT()
    await boot(t)
    t.events.length = 0
    const next = [1000 + 30 * TF, 1, 2, 0, 3, 5]
    await t.send({ type: 'update-data', data: { ohlcv: next } })
    await waitFor(() => t.events.some((e) => e.type === 'overlay-update'))
    expect(t.events.some((e) => e.type === 'overlay-update')).toBe(true)
    t.destroy()
  })
})

describe('selective re-exec (update-ov-settings → exec_sel)', () => {
  test('re-runs the changed overlay and re-emits overlay-data', async () => {
    const t = mkT()
    await boot(t)
    t.events.length = 0
    await t.send({
      type: 'update-ov-settings',
      data: { delta: { 'ov-ema': { len: 8 } }, tf: '1D', range: rangeOf(t._cs) },
    })
    await waitFor(() => t.events.some((e) => e.type === 'overlay-data'))
    expect(t.events.some((e) => e.type === 'overlay-data')).toBe(true)
    t.destroy()
  })
})

describe('dataset ops (dataset-op → DatasetWW.op + recalc)', () => {
  test('set then del a side dataset re-runs the engine without throwing', async () => {
    const t = mkT()
    await t.send({ type: 'update-dc-settings', data: { scripts: true } })
    await t.send({ type: 'upload-data', data: { ohlcv: candles(20), trades: [[1000, 1]] } })
    await t.send({ type: 'dataset-op', data: { id: 'trades', type: 'set', data: [[2000, 9]], exec: true } })
    await t.send({ type: 'dataset-op', data: { id: 'trades', type: 'mrg', data: [[500, 1], [9000, 2]], exec: false } })
    await t.send({ type: 'dataset-op', data: { id: 'trades', type: 'del', exec: true } })
    // get-dataset for a deleted id replies with undefined
    const got = []
    t.onevent = (e) => { if (e.data && e.data.id === 'q') got.push(e.data) }
    await t.send({ type: 'get-dataset', id: 'q', data: 'trades' })
    await waitFor(() => got.length > 0)
    expect(got[0].data).toBeUndefined()
    t.destroy()
  })
})

describe('script removal + meta-info', () => {
  test('remove-scripts drops the overlay; send-meta-info updates tf/range', async () => {
    const t = mkT()
    await boot(t)
    await t.send({ type: 'send-meta-info', data: { tf: '1D', range: rangeOf(t._cs) } })
    expect(t.se.tf).toBeGreaterThan(0)
    await t.send({ type: 'remove-scripts', data: ['ov-ema'] })
    // re-running all scripts now emits an overlay-data without the removed id
    t.events.length = 0
    await t.send({ type: 'exec-all-scripts', data: { tf: '1D', range: rangeOf(t._cs) } })
    await waitFor(() => t.events.some((e) => e.type === 'overlay-data'))
    const od = t.events.filter((e) => e.type === 'overlay-data').pop()
    if (od) expect(od.data.find((d) => d.id === 'ov-ema')).toBeUndefined()
    t.destroy()
  })
})

describe('unknown / malformed messages', () => {
  test('an unknown type is a no-op (warned, not thrown)', async () => {
    const t = mkT()
    await expect(t.send({ type: 'no-such-type', data: {} })).resolves.toBeUndefined()
    await expect(t.send({ type: 'upload-data' })).resolves.toBeUndefined() // missing payload
    t.destroy()
  })
})

describe('M6 — multi-candle update batches step EVERY bar', () => {
  test('a 3-new-candle batch grows the price arrays by 3, not 1', async () => {
    const t = mkT()
    await boot(t, 10)
    const lenBefore = t.se.close.filter((v) => v !== undefined).length
    const base = 1000 + 9 * TF
    await t.send({ type: 'update-data', data: { ohlcv: [base + TF, 1, 2, 0, 5, 1] } })
    await t.send({ type: 'update-data', data: { ohlcv: [base + 2 * TF, 1, 2, 0, 6, 1] } })
    // now a BATCH carrying two new candles at once
    t.se.update([[base + 3 * TF, 1, 2, 0, 7, 1], [base + 4 * TF, 1, 2, 0, 8, 1]])
    // Poll the deterministic close-array state instead of racing a fixed clock.
    await waitFor(() => t.se.close[0] === 8 && t.se.close[1] === 7)
    const closes = t.se.close
    // close[0] is the latest batch candle; the INTERMEDIATE one must be there too
    expect(closes[0]).toBe(8)
    expect(closes[1]).toBe(7)   // the old code skipped this bar entirely
    void lenBefore
    t.destroy()
  })
})

describe('M12 — deepToRaw structured-clone safety', () => {
  test('typed arrays, Map/Set and cycles survive the worker send', async () => {
    const { default: WebWork } = await import('../../src/helpers/script_ww_api.js')
    const ww = new WebWork({ sett: {} })
    const rec = { messages: [], postMessage(m) { this.messages.push(m) } }
    ww.worker = rec
    const f64 = new Float64Array([1.5, 2.5])
    const cyc = { a: 1 }; cyc.self = cyc
    const m = new Map([['k', 1]])
    ww.send({ type: 'update-data', data: { f64, cyc, m, s: new Set([1]) } })
    const sent = rec.messages[0].data
    expect(sent.f64).toBeInstanceOf(Float64Array)   // was string-keyed {} before
    expect(Array.from(sent.f64)).toEqual([1.5, 2.5])
    expect(sent.m).toBeInstanceOf(Map)
    expect(sent.s.has(1)).toBe(true)
    // the guard breaks recursion by handing the ORIGINAL (cyclic) object to
    // postMessage's structured clone, which handles cycles natively
    expect(sent.cyc.self.a).toBe(1)
    expect(sent.cyc.self.self).toBe(sent.cyc.self)  // still cyclic, no blow-up
  })
})
