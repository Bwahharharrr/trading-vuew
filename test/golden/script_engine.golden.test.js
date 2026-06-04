// GOLDEN MASTER — ScriptEngine numeric output.
//
// Pins the exact computed series of the std indicator library as produced by
// the CURRENT engine (new Function() boxing + FDEFS2 regex rewrite + `_id`
// lineage). ANY diff here after a Phase 3/6 engine refactor is a behavioural
// change that must be explained and the snapshot updated deliberately — never
// auto-accepted. Snapshots store a compact fingerprint (length + quantized
// head/tail + checksum) under the FP-tolerance policy (8 decimals).
import { test, expect, describe } from 'vitest'
import { readFileSync } from 'node:fs'
import { runScript, script, fingerprint, CORPUS } from './_engine-harness.js'

const load = (f) =>
  JSON.parse(readFileSync(new URL(`../data/${f}`, import.meta.url))).ohlcv

const btc = load('data_btc.json')

// CORPUS (28 indicators spanning every std family) is defined in the harness so
// the SyncTransport equivalence test shares the exact same function sources.

describe('ScriptEngine golden (BTC, 4200 candles)', () => {
  for (const [name, fn] of CORPUS) {
    test(name, async () => {
      const out = await runScript(btc, script(name, fn))
      const fp = fingerprint(out)
      // Sanity: every indicator must compute at least one finite value.
      expect(fp.length).toBeGreaterThan(0)
      expect(out.some((p) => Number.isFinite(p[1]))).toBe(true)
      expect(fp).toMatchSnapshot()
    })
  }
})

describe('ScriptEngine nested lineage', () => {
  // root <- alma(20) <- sma(50): exercises the string `_id` lineage that the
  // Phase 6 DAG rewrite replaces. Pin its exact output now.
  test('alma-of-sma', async () => {
    const out = await runScript(
      btc,
      script('lineage', function () { return alma(sma(close, 50), 20, 0.85, 6) })
    )
    const fp = fingerprint(out)
    expect(out.some((p) => Number.isFinite(p[1]))).toBe(true)
    expect(fp).toMatchSnapshot()
  })
})

describe('ScriptEngine determinism', () => {
  // The exit gate: re-running the unchanged engine yields byte-identical output.
  test('sma is reproducible across runs', async () => {
    const a = await runScript(btc, script('d1', function () { return sma(close, 20) }))
    const b = await runScript(btc, script('d2', function () { return sma(close, 20) }))
    expect(a).toEqual(b)
  })
})
