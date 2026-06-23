// ScriptEngine exec_sel display-only short-circuit (cache restore + overlay-data
// emit without re-exec).
//
// Drives a FRESH ScriptEngine per test through the REAL message dispatch via
// SyncTransport (the same path the web worker uses), exactly like
// engine-dispatch.test.js. We boot an EMA overlay whose period comes from a
// `len` PROP (so a `len` delta is a genuine compute-affecting change) and a
// display-only `color` prop, then exercise the exec_sel branches in
// src/helpers/script_engine.js:283.
//
// Each test uses its own SyncTransport (its own engine); they run sequentially
// so the scriptState singleton is never bound by two live engines at once.
import { test, expect, describe } from 'vitest'
import SyncTransport from '../../src/helpers/transport/sync-transport.js'

const TF = 86400000 // 1D — candle spacing MUST match the declared tf
// Poll for a condition instead of sleeping a fixed amount — the engine runs
// slower under coverage instrumentation, so a magic tick(30) can read state
// before the async exec has emitted overlay-data (flaky `before === null`).
async function waitFor(cond, ms = 3000) {
  const start = Date.now()
  while (Date.now() - start < ms) {
    if (cond()) return true
    await new Promise((r) => setTimeout(r, 5))
  }
  return cond()
}
const candles = (n) =>
  Array.from({ length: n }, (_, i) => [1000 + i * TF, 1, 2, 0, 1 + (i % 5), 5])
const rangeOf = (cs) => [cs[0][0], cs[cs.length - 1][0]]

// FRESH overlay descriptor per boot. The body is a classic `function () {}` so
// its .toString() source survives the engine's regex rewrite, and `len` is read
// from a prop baked into the function body — changing `props.len.val` and
// re-execing recomputes the series. We return a NEW object every call because
// exec_sel mutates `src.props[k].val` in place; a shared descriptor would leak
// prop state across tests.
function emaScript() {
  /* eslint-disable no-undef */
  return {
    uuid: 'ov-ema',
    type: 'ScriptOverlay',
    settings: { $uuid: 'ov-ema' },
    use_for: ['GOLDEN'],
    sett: {},
    src: {
      use_for: ['GOLDEN'],
      init: function () {},
      update: function () { return ema(close, len) },
      post: function () {},
      props: { len: { def: 5 }, color: { def: '#000' } },
      sett: {},
      conf: {},
      data: {},
    },
  }
  /* eslint-enable no-undef */
}

function mkT() {
  const t = new SyncTransport()
  t.events = []
  t.onevent = (e) => t.events.push(e.data)
  return t
}

// Boot a transport with the EMA overlay and run it once (populating _outputCache).
// NB: do NOT interpose a timer between upload-data and exec-script.
async function boot(t, n = 30) {
  const cs = candles(n)
  await t.send({ type: 'update-dc-settings', data: { scripts: true, script_depth: 0 } })
  await t.send({ type: 'upload-data', data: { ohlcv: cs } })
  await t.send({ type: 'exec-script', data: { s: emaScript(), tf: '1D', range: rangeOf(cs) } })
  await waitFor(() => latestSeries(t) != null)
  t._cs = cs
}

// Pull the latest overlay-data series for `ov-ema` out of the recorded events.
function latestSeries(t, id = 'ov-ema') {
  const od = t.events.filter((e) => e.type === 'overlay-data').pop()
  if (!od) return null
  const entry = od.data.find((d) => d.id === id)
  return entry ? entry.data : null
}

const last = (series) => series[series.length - 1]

describe('exec_sel — display-only short-circuit (case 1)', () => {
  test('a pure {color} delta restores from cache, updates props[color].val, and does NOT re-run the script', async () => {
    const t = mkT()
    await boot(t)

    const before = latestSeries(t)
    expect(before).toBeTruthy()
    // Sanity: the run populated the cache and it is valid for a display-only change.
    expect(t.se._outputCache.has('ov-ema')).toBe(true)
    expect(t.se._isCacheValid('ov-ema')).toBe(true)
    expect(t.se._isDisplayOnlyChange({ 'ov-ema': { color: '#abc' } }, 'ov-ema')).toBe(true)

    t.events.length = 0
    await t.send({
      type: 'update-ov-settings',
      data: { delta: { 'ov-ema': { color: '#abc' } }, tf: '1D', range: rangeOf(t._cs) },
    })
    await waitFor(() => t.events.some((e) => e.type === 'overlay-data'))

    // overlay-data IS emitted (the display-only branch restores + sends).
    expect(t.events.some((e) => e.type === 'overlay-data')).toBe(true)
    // props[color].val was updated immediately.
    expect(t.se.map['ov-ema'].src.props.color.val).toBe('#abc')

    // No re-exec: the restored series is byte-identical to the pre-change series
    // (a cache hit, not a recompute). Last point + length both unchanged.
    const after = latestSeries(t)
    expect(after.length).toBe(before.length)
    expect(last(after)).toEqual(last(before))
    expect(after).toEqual(before)

    t.destroy()
  })
})

describe('exec_sel — mixed delta (case 2)', () => {
  test('{color, len} applies the display-only part AND re-execs so overlay-data reflects the new len', async () => {
    const t = mkT()
    await boot(t)

    const before = latestSeries(t)
    expect(before).toBeTruthy()
    // A mixed delta is NOT display-only (len is computation-affecting), so the
    // engine must fall through to a real re-exec (needsReExec non-empty).
    expect(
      t.se._isDisplayOnlyChange({ 'ov-ema': { color: '#abc', len: 8 } }, 'ov-ema')
    ).toBe(false)

    t.events.length = 0
    await t.send({
      type: 'update-ov-settings',
      data: { delta: { 'ov-ema': { color: '#abc', len: 8 } }, tf: '1D', range: rangeOf(t._cs) },
    })
    await waitFor(() => t.events.some((e) => e.type === 'overlay-data'))

    // Both props applied (applyComputeProps copies every key in the delta).
    expect(t.se.map['ov-ema'].src.props.color.val).toBe('#abc')
    expect(t.se.map['ov-ema'].src.props.len.val).toBe(8)

    // overlay-data reflects the NEW len: a real EMA(close, 8) differs from EMA(close, 5).
    const after = latestSeries(t)
    expect(after).toBeTruthy()
    expect(after.length).toBe(before.length)
    expect(last(after)).not.toEqual(last(before))

    t.destroy()
  })
})

describe('exec_sel — display-only but cache invalid (case 3)', () => {
  test('a {color} delta with no valid cache re-execs instead of restoring a stale series', async () => {
    const t = mkT()
    await boot(t)

    const before = latestSeries(t)
    expect(t.se._isCacheValid('ov-ema')).toBe(true)

    // Simulate "data changed since last run": invalidate the cache via a stale
    // dataHash, then POISON the cached series. If the engine wrongly took the
    // display-only short-circuit it would restore this poison; a correct
    // re-exec must overwrite it with the freshly computed series.
    const cached = t.se._outputCache.get('ov-ema')
    cached.dataHash = 'STALE'
    cached.data = [[999, -999]]

    // The change is still display-only by KIND, but the cache is now invalid.
    expect(t.se._isDisplayOnlyChange({ 'ov-ema': { color: '#xyz' } }, 'ov-ema')).toBe(true)
    expect(t.se._isCacheValid('ov-ema')).toBe(false)

    t.events.length = 0
    await t.send({
      type: 'update-ov-settings',
      data: { delta: { 'ov-ema': { color: '#xyz' } }, tf: '1D', range: rangeOf(t._cs) },
    })
    await waitFor(() => t.events.some((e) => e.type === 'overlay-data'))

    const after = latestSeries(t)
    expect(after).toBeTruthy()
    // Recomputed, not the 1-point poisoned restore.
    expect(after.length).toBe(before.length)
    expect(last(after)).toEqual(last(before))
    expect(after[0]).not.toEqual([999, -999])
    // The display-only prop is still applied on the re-exec path.
    expect(t.se.map['ov-ema'].src.props.color.val).toBe('#xyz')

    t.destroy()
  })
})

describe('exec_sel — unknown id (case 4)', () => {
  test('a delta for an id NOT in this.map is filtered from `sel` and does not throw', async () => {
    const t = mkT()
    await boot(t)

    t.events.length = 0
    // Mix a real id with a bogus one; the bogus id must be silently dropped.
    await expect(
      t.send({
        type: 'update-ov-settings',
        data: {
          delta: { 'no-such-id': { color: '#f00' }, 'ov-ema': { color: '#0f0' } },
          tf: '1D',
          range: rangeOf(t._cs),
        },
      })
    ).resolves.toBeUndefined()
    await waitFor(() => t.events.some((e) => e.type === 'overlay-data'))

    const od = t.events.filter((e) => e.type === 'overlay-data').pop()
    expect(od).toBeTruthy()
    const ids = od.data.map((d) => d.id)
    expect(ids).toContain('ov-ema')
    expect(ids).not.toContain('no-such-id')
    // The real id's display-only change still applied.
    expect(t.se.map['ov-ema'].src.props.color.val).toBe('#0f0')

    t.destroy()
  })
})

describe('exec_sel — applyComputeProps timing / poisoned-cache guard (case 5)', () => {
  test('a re-exec reflects the new compute prop value (len applied after init_state)', async () => {
    const t = mkT()
    await boot(t)

    const before = latestSeries(t)
    expect(t.se.map['ov-ema'].src.props.len.val).toBeUndefined() // still the default (5)

    t.events.length = 0
    await t.send({
      type: 'update-ov-settings',
      data: { delta: { 'ov-ema': { len: 8 } }, tf: '1D', range: rangeOf(t._cs) },
    })
    await waitFor(() => t.events.some((e) => e.type === 'overlay-data'))

    // The compute prop is applied (only after init_state succeeded) and the
    // re-exec output reflects EMA(close, 8) != EMA(close, 5).
    expect(t.se.map['ov-ema'].src.props.len.val).toBe(8)
    const after = latestSeries(t)
    expect(after).toBeTruthy()
    expect(last(after)).not.toEqual(last(before))
  })

  test('when init_state fails (engine busy) the delta is queued and compute props are NOT yet applied', async () => {
    const t = mkT()
    await boot(t)

    // Engine "busy": init_state returns false → exec_sel must re-queue the
    // delta and must NOT have applied the compute prop yet (the poisoned-cache
    // guard: props are only applied once the re-exec actually starts).
    const beforeLen = t.se.map['ov-ema'].src.props.len.val
    t.se.running = true
    const ret = await t.se.exec_sel({ 'ov-ema': { len: 12 } })

    expect(ret).toBeUndefined()
    expect(t.se.delta_queue.length).toBe(1)
    expect(t.se.delta_queue[0]).toEqual({ 'ov-ema': { len: 12 } })
    // The compute prop value is unchanged at this point — NOT applied early.
    expect(t.se.map['ov-ema'].src.props.len.val).toBe(beforeLen)

    t.destroy()
  })
})
