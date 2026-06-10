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
const tick = (ms = 20) => new Promise((r) => setTimeout(r, ms))
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
  await tick(30)
  t._cs = cs
}

describe('live candle update (se.update → format_update)', () => {
  test('update-data with a new ohlcv tick emits an overlay-update', async () => {
    const t = mkT()
    await boot(t)
    t.events.length = 0
    const next = [1000 + 30 * TF, 1, 2, 0, 3, 5]
    await t.send({ type: 'update-data', data: { ohlcv: next } })
    await tick(30)
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
    await tick(30)
    expect(t.events.some((e) => e.type === 'overlay-data')).toBe(true)
    t.destroy()
  })
})

describe('dataset ops (dataset-op → DatasetWW.op + recalc)', () => {
  test('set then del a side dataset re-runs the engine without throwing', async () => {
    const t = mkT()
    await t.send({ type: 'update-dc-settings', data: { scripts: true } })
    await t.send({ type: 'upload-data', data: { ohlcv: candles(20), trades: [[1000, 1]] } })
    await tick()
    await t.send({ type: 'dataset-op', data: { id: 'trades', type: 'set', data: [[2000, 9]], exec: true } })
    await tick()
    await t.send({ type: 'dataset-op', data: { id: 'trades', type: 'mrg', data: [[500, 1], [9000, 2]], exec: false } })
    await t.send({ type: 'dataset-op', data: { id: 'trades', type: 'del', exec: true } })
    await tick()
    // get-dataset for a deleted id replies with undefined
    const got = []
    t.onevent = (e) => { if (e.data && e.data.id === 'q') got.push(e.data) }
    await t.send({ type: 'get-dataset', id: 'q', data: 'trades' })
    await tick()
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
    await tick()
    // re-running all scripts now emits an overlay-data without the removed id
    t.events.length = 0
    await t.send({ type: 'exec-all-scripts', data: { tf: '1D', range: rangeOf(t._cs) } })
    await tick(20)
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
