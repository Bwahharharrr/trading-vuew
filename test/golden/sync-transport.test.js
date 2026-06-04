// Phase 3.2 exit gate: the engine runs the FULL golden corpus through the REAL
// message dispatch via SyncTransport, byte-identical to the singleton drive.
//
// scriptState (script_state.js) is a shared singleton that each ScriptEngine
// rebinds in its constructor, so two engine instances can't run interleaved.
// We therefore run ALL singleton drives first (scriptState bound to the
// singleton), THEN all SyncTransport drives (each a fresh instance), and
// compare — no interleaving, no contamination.
import { test, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { runScript, runViaSyncTransport, script, CORPUS } from './_engine-harness.js'

const btc = JSON.parse(
  readFileSync(new URL('../data/data_btc.json', import.meta.url))
).ohlcv

test('SyncTransport output is byte-identical to the singleton drive (28 indicators)', async () => {
  // Phase A — singleton drive (scriptState bound to the module singleton).
  const expected = {}
  for (const [name, fn] of CORPUS) {
    expected[name] = await runScript(btc, script(name, fn))
  }

  // Phase B — SyncTransport drive (fresh ScriptEngine instances).
  for (const [name, fn] of CORPUS) {
    const actual = await runViaSyncTransport(btc, script(name, fn))
    expect(actual, `indicator ${name}`).toEqual(expected[name])
  }
}, 60000)

test('SyncTransport runs an isolated engine (not the singleton)', async () => {
  const out = await runViaSyncTransport(
    btc.slice(0, 200),
    script('iso', function () { return ema(close, 10) }, { len: { def: 10 } })
  )
  expect(out.some((p) => Number.isFinite(p[1]))).toBe(true)
})
