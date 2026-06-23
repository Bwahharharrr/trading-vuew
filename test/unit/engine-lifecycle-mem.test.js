// ScriptEngine lifecycle + memory management — pure-node unit tests that drive
// the engine's bookkeeping methods directly (no worker, no transport), since the
// golden/dispatch corpus only exercises them transitively.
//
// Covered (src/helpers/script_engine.js):
//   - remove_scripts: map + _outputCache purge, queue/delta_queue scrubbing,
//     empty-delta drop, send_state + _updateTemplate nulling
//   - restarted(): one-shot _restart flag + running/_aborted/perf side effects
//   - drain_queues: last-write-per-key delta merge, queue/exec_all priority
//   - limit_size: never evicts ohlcv; evicts the side dataset; no-victim no-op
//   - recalc_size: ram-limit eviction loop, data_size rounding, send_state
//
// Each test builds a FRESH ScriptEngine and stubs the externally-wired `send`
// (the constructor never defines it). No real network/timers/randomness.
import { test, expect, describe } from 'vitest'
import { ScriptEngine } from '../../src/helpers/script_engine.js'

// Fresh engine with a no-op `send` (normally wired after construction by the
// worker/transport bridge). Returns the engine plus counters for state pushes.
function mkEngine() {
  const se = new ScriptEngine()
  const calls = { send_state: 0 }
  se.send = () => {}
  // Wrap send_state so we can assert it fires WITHOUT pulling in format/send.
  const orig = se.send_state.bind(se)
  se.send_state = () => { calls.send_state++ ; /* skip orig: avoids send wiring */ }
  void orig
  return { se, calls }
}

// A 500-row OHLCV-shaped dataset; used to give recalc_size something to measure.
const rows = (n) => Array.from({ length: n }, (_, i) => [i, 1, 2, 3, 4, 5])

describe('remove_scripts: map + output-cache purge', () => {
  test('deletes the id from map AND from _outputCache', () => {
    const { se } = mkEngine()
    se.map = { rsi: { uuid: 'rsi' }, ema: { uuid: 'ema' } }
    se._outputCache.set('rsi', { data: [1, 2, 3] })
    se._outputCache.set('ema', { data: [4, 5] })

    se.remove_scripts(['rsi'])

    expect(se.map.rsi).toBeUndefined()
    expect(se.map.ema).toBeDefined()
    expect(se._outputCache.has('rsi')).toBe(false)
    expect(se._outputCache.has('ema')).toBe(true)
  })
})

describe('remove_scripts: queue + delta_queue scrubbing', () => {
  test('purges queued exec-script, strips dead ids from deltas, drops empties, nulls template, sends state', () => {
    const { se, calls } = mkEngine()
    se.map = { rsi: { uuid: 'rsi' }, ema: { uuid: 'ema' } }
    // A still-queued exec-script for the about-to-be-removed id.
    se.queue = [{ uuid: 'rsi' }, { uuid: 'ema' }]
    se.delta_queue = [
      { rsi: { len: 5 }, ema: { len: 3 } }, // -> { ema: { len: 3 } }
      { rsi: { c: 'x' } },                  // -> {} (becomes empty -> dropped)
      { ema: { c: 'y' } },                  // -> unchanged
    ]
    se._updateTemplate = [{ id: 'rsi', src: [] }]

    se.remove_scripts(['rsi'])

    // The dead exec-script is gone; the live one stays.
    expect(se.queue).toEqual([{ uuid: 'ema' }])
    // Dead id stripped from every delta; the entry that emptied out is dropped.
    expect(se.delta_queue).toEqual([{ ema: { len: 3 } }, { ema: { c: 'y' } }])
    // Update template invalidated and state re-broadcast.
    expect(se._updateTemplate).toBeNull()
    expect(calls.send_state).toBe(1)
  })
})

describe('restarted(): one-shot restart guard', () => {
  test('returns true once, clears _restart, sets running=false/_aborted=true/perf=0, then false', () => {
    const { se } = mkEngine()
    se._restart = true
    se.running = true
    se._aborted = false
    se.perf = 42

    expect(se.restarted()).toBe(true)
    expect(se._restart).toBe(false)
    expect(se.running).toBe(false)
    expect(se._aborted).toBe(true)
    expect(se.perf).toBe(0)

    // Second call: the flag is consumed, so no restart reported.
    expect(se.restarted()).toBe(false)
  })

  test('with _restart falsy, returns false and leaves running untouched', () => {
    const { se } = mkEngine()
    se._restart = false
    se.running = true
    expect(se.restarted()).toBe(false)
    expect(se.running).toBe(true)
  })
})

describe('drain_queues: delta merge + priority', () => {
  test('merges multiple delta entries last-write-per-key and empties delta_queue', () => {
    const { se } = mkEngine()
    let captured = null
    se.exec_sel = (m) => { captured = m }
    se.queue = []
    se._execAllPending = false
    se.update_queue = []
    se.delta_queue = [
      { rsi: { len: 5 } },
      { rsi: { len: 9 }, ema: { len: 3 } }, // rsi.len 9 wins over 5
    ]

    se.drain_queues()

    expect(captured).toEqual({ rsi: { len: 9 }, ema: { len: 3 } })
    expect(se.delta_queue).toEqual([])
  })

  test('queue / _execAllPending (exec_all) is prioritised over delta_queue', () => {
    const { se } = mkEngine()
    let execAll = 0
    let execSel = 0
    se.exec_all = () => { execAll++ }
    se.exec_sel = () => { execSel++ }
    se.queue = []
    se._execAllPending = true       // exec-all arrived while busy
    se.delta_queue = [{ rsi: { len: 5 } }]
    se.update_queue = []

    se.drain_queues()

    expect(execAll).toBe(1)
    expect(execSel).toBe(0)
    // delta_queue is left intact (not drained) when exec_all takes priority.
    expect(se.delta_queue).toEqual([{ rsi: { len: 5 } }])
    expect(se._execAllPending).toBe(false)
  })

  test('delta_queue is prioritised over update_queue', () => {
    const { se } = mkEngine()
    let execSel = 0
    let updated = 0
    se.exec_all = () => { throw new Error('exec_all should not run') }
    se.exec_sel = () => { execSel++ }
    se.update = () => { updated++ }
    se.queue = []
    se._execAllPending = false
    se.delta_queue = [{ rsi: { len: 5 } }]
    se.update_queue = [[1, 2]]

    se.drain_queues()

    expect(execSel).toBe(1)
    expect(updated).toBe(0)             // update_queue not drained this pass
    expect(se.update_queue).toEqual([[1, 2]])
  })
})

describe('limit_size: never evicts ohlcv', () => {
  test('evicts the SIDE dataset even when ohlcv sorts oldest by last_upd', () => {
    const { se } = mkEngine()
    se.data = {
      // ohlcv has the OLDEST last_upd -> sorts first, but must NOT be evicted.
      ohlcv: { id: 'ohlcv', last_upd: 1, data: [[1, 2]] },
      side: { id: 'side', last_upd: 5, data: [[1, 2]] },
    }

    se.limit_size()

    expect(se.data.ohlcv).toBeDefined()
    expect(se.data.side).toBeUndefined()
  })

  test('when only ohlcv exists, victim is undefined and nothing is deleted', () => {
    const { se } = mkEngine()
    se.data = { ohlcv: { id: 'ohlcv', last_upd: 1, data: [[1, 2]] } }

    se.limit_size()

    expect(Object.keys(se.data)).toEqual(['ohlcv'])
  })
})

describe('recalc_size: ram-limit eviction loop', () => {
  test('loops limit_size until under the cap, sets rounded data_size, sends state', () => {
    const { se, calls } = mkEngine()
    se.sett = { ww_ram_limit: 0.001 } // ~1KB cap forces eviction of the side ds
    se.data = {
      ohlcv: { id: 'ohlcv', last_upd: 1, data: rows(500) },
      side: { id: 'side', last_upd: 5, data: rows(500) },
    }

    se.recalc_size()

    // The side dataset is evicted; ohlcv (the main) is preserved by limit_size.
    expect(se.data.side).toBeUndefined()
    expect(se.data.ohlcv).toBeDefined()
    // data_size is the rounded MB value of what remains, a finite number.
    expect(typeof se.data_size).toBe('number')
    expect(Number.isFinite(se.data_size)).toBe(true)
    expect(se.data_size).toBeGreaterThan(0)
    expect(calls.send_state).toBe(1)
  })

  test('with no ww_ram_limit, evicts nothing but still records size and sends state', () => {
    const { se, calls } = mkEngine()
    se.sett = {} // no limit
    se.data = {
      ohlcv: { id: 'ohlcv', last_upd: 1, data: rows(500) },
      side: { id: 'side', last_upd: 5, data: [[1, 2]] },
    }

    se.recalc_size()

    expect(Object.keys(se.data).sort()).toEqual(['ohlcv', 'side'])
    expect(Number.isFinite(se.data_size)).toBe(true)
    expect(se.data_size).toBeGreaterThan(0)
    expect(calls.send_state).toBe(1)
  })
})
