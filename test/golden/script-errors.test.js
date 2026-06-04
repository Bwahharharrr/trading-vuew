// Phase 3.x: structured per-indicator errors. Drives the engine via
// SyncTransport with deliberately-broken indicators and asserts the failure is
// surfaced as a typed `script-error` event (with the culprit's identity +
// phase) rather than swallowed — AND that a good indicator alongside a broken
// one still computes (per-indicator isolation).
import { test, expect, describe } from 'vitest'
import { readFileSync } from 'node:fs'
import SyncTransport from '../../src/helpers/transport/sync-transport.js'
import { script } from './_engine-harness.js'

const btc = JSON.parse(
  readFileSync(new URL('../data/data_btc.json', import.meta.url))
).ohlcv.slice(0, 300)

// Drive multiple scripts; collect script-error events; resolve on overlay-data.
function drive(descriptors) {
  const t = new SyncTransport()
  const errors = []
  const range = [btc[0][0], btc[btc.length - 1][0]]
  return new Promise((resolve, reject) => {
    let done = false
    const timer = setTimeout(() => { if (!done) { done = true; resolve({ errors, overlayData: null }) } }, 15000)
    t.onevent = (e) => {
      const m = e.data
      if (!m) return
      if (m.type === 'script-error') errors.push(m.data)
      if (m.type === 'overlay-data' && !done) {
        done = true; clearTimeout(timer); resolve({ errors, overlayData: m.data })
      }
    }
    ;(async () => {
      try {
        await t.send({ type: 'update-dc-settings', data: { scripts: true, script_depth: 0 } })
        await t.send({ type: 'upload-data', data: { ohlcv: btc } })
        for (const d of descriptors) {
          await t.send({ type: 'exec-script', data: { s: d, tf: '1D', range } })
        }
      } catch (e) { if (!done) { done = true; clearTimeout(timer); reject(e) } }
    })()
  })
}

describe('structured indicator errors', () => {
  test('an exec-time throw surfaces a typed script-error (not swallowed)', async () => {
    const { errors } = await drive([
      script('boom', function () { throw new Error('kaboom') }),
    ])
    const err = errors.find((e) => e.uuid === 'boom')
    expect(err).toBeTruthy()
    expect(err.phase).toBe('exec')
    expect(err.message).toContain('kaboom')
  })

  test('a build-time failure (bad source) surfaces phase "build"', async () => {
    // get_raw_src passes a string update through verbatim; this invalid source
    // makes the box Function() throw at compile time → build error.
    const { errors } = await drive([script('bad', 'return (((')])
    const err = errors.find((e) => e.uuid === 'bad')
    expect(err).toBeTruthy()
    expect(err.phase).toBe('build')
  })

  test('a broken indicator is ISOLATED — a good one alongside it still computes', async () => {
    const { errors, overlayData } = await drive([
      script('good', function () { return sma(close, 20) }, { len: { def: 20 } }),
      script('boom', function () { throw new Error('isolate-me') }),
    ])
    // good one produced real output
    const good = overlayData.find((d) => d.id === 'good')
    expect(good).toBeTruthy()
    expect(good.data.some((p) => Number.isFinite(p[1]))).toBe(true)
    // broken one reported
    expect(errors.some((e) => e.uuid === 'boom' && e.phase === 'exec')).toBe(true)
  })
})
