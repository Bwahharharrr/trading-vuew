// CorkyBacktestsFeed — orchestration over a FAKE CorkyClient. One-shot reads
// delegate + return; the progress stream is full-replacement, sequence-guarded,
// re-issued on reconnect, and torn down on unsubscribe/destroy.
import { describe, it, expect, beforeEach } from 'vitest'
import { CorkyBacktestsFeed } from '../../src/helpers/feed/corky-backtests-feed.js'

function makeFakeClient() {
  const subs = new Map()          // subscription_id → Set(cb)
  const openListeners = new Set()
  const client = {
    calls: [],
    _strategies: [{ name: 'ema_cross_all_in_v1', display_name: 'EMA Cross' }],
    _strategy: { name: 'ema_cross_all_in_v1' },
    _runs: [{ run_id: 'r1', status: 'completed' }],
    _run: { run_id: 'r1', artifact: { plan: {} } },
    _progress: { type: 'backtest_progress', run_id: 'r1', events: [{ kind: 'completed', completed_steps: 1, total_steps: 1 }] },
    _chartOv: { type: 'backtest_chart_overlays', overlays: [] },
    _reportOv: { type: 'backtest_report_overlays', trades: [] },
    listStrategies() { this.calls.push(['listStrategies']); return Promise.resolve(this._strategies) },
    getStrategy(s) { this.calls.push(['getStrategy', s]); return Promise.resolve(this._strategy) },
    listBacktestRuns(f) { this.calls.push(['listBacktestRuns', f]); return Promise.resolve(this._runs) },
    getBacktestRun(id) { this.calls.push(['getBacktestRun', id]); return Promise.resolve(this._run) },
    getBacktestProgress(id) { this.calls.push(['getBacktestProgress', id]); return Promise.resolve(this._progress) },
    getBacktestChartOverlays(o) { this.calls.push(['getBacktestChartOverlays', o]); return Promise.resolve(this._chartOv) },
    getBacktestReportOverlays(o) { this.calls.push(['getBacktestReportOverlays', o]); return Promise.resolve(this._reportOv) },
    _subscribeResult: () => Promise.resolve(),
    subscribeBacktestProgress(args) { this.calls.push(['subscribeBacktestProgress', args]); return this._subscribeResult(args) },
    unsubscribe(sid) { this.calls.push(['unsubscribe', sid]) },
    onSubscription(sid, cb) {
      if (!subs.has(sid)) subs.set(sid, new Set())
      subs.get(sid).add(cb)
      return () => { const s = subs.get(sid); if (s) s.delete(cb) }
    },
    on(type, cb) { if (type === 'open') { openListeners.add(cb); return () => openListeners.delete(cb) } return () => {} },
    _pushUpdate(sid, event) { for (const cb of (subs.get(sid) || [])) cb({ request_id: null, event }) },
    _emitOpen() { for (const cb of openListeners) cb() },
    _hasListeners(sid) { return (subs.get(sid) || new Set()).size > 0 },
  }
  return client
}

const progressUpdate = (sid, sequence, events) => ({
  type: 'backtest_progress_update', subscription_id: sid, sequence, run_id: 'r1', events,
})

let client, feed
beforeEach(() => { client = makeFakeClient(); feed = new CorkyBacktestsFeed({ client }) })

describe('one-shot reads delegate', () => {
  it('listStrategies / getStrategy / listRuns / getRun delegate and resolve', async () => {
    expect(await feed.listStrategies()).toHaveLength(1)
    expect(await feed.getStrategy('ema_cross_all_in_v1')).toMatchObject({ name: 'ema_cross_all_in_v1' })
    expect(await feed.listRuns({ status: 'completed' })).toHaveLength(1)
    expect(client.calls).toContainEqual(['listBacktestRuns', { status: 'completed' }])
    expect((await feed.getRun('r1')).artifact).toBeTruthy()
  })

  it('getProgress unwraps the events list', async () => {
    expect(await feed.getProgress('r1')).toEqual([{ kind: 'completed', completed_steps: 1, total_steps: 1 }])
  })

  it('getChartOverlays / getReportOverlays return the full event', async () => {
    expect((await feed.getChartOverlays({ run_id: 'r1' })).type).toBe('backtest_chart_overlays')
    expect((await feed.getReportOverlays({ run_id: 'r1' })).type).toBe('backtest_report_overlays')
  })
})

describe('subscribeProgress — streaming, full-replacement, sequence-guarded', () => {
  it('delivers the full events list per in-order update; drops stale sequences', () => {
    const got = []
    const h = feed.subscribeProgress({ run_id: 'r1' }, { onData: (events, meta) => got.push([meta.sequence, events.length]) })
    const sid = h.subscription_id
    expect(client._hasListeners(sid)).toBe(true)
    client._pushUpdate(sid, progressUpdate(sid, 1, [{ kind: 'progress', completed_steps: 5, total_steps: 10 }]))
    client._pushUpdate(sid, progressUpdate(sid, 1, [{ kind: 'progress' }]))   // stale (<=lastSeq) → dropped
    client._pushUpdate(sid, progressUpdate(sid, 2, [{ kind: 'progress' }, { kind: 'completed' }]))
    expect(got).toEqual([[1, 1], [2, 2]])
    expect(h.lastGood).toHaveLength(2)
  })

  it('routes an inline error event to onError', () => {
    let err = null
    const h = feed.subscribeProgress({ run_id: 'r1' }, { onError: (e) => { err = e } })
    client._pushUpdate(h.subscription_id, { type: 'error', code: 'backtest_artifact_not_ready', message: 'wait' })
    expect(err).toMatchObject({ code: 'backtest_artifact_not_ready' })
  })

  it('re-issues the subscription on reconnect (sequence reset)', () => {
    const h = feed.subscribeProgress({ run_id: 'r1' }, {})
    const before = client.calls.filter((c) => c[0] === 'subscribeBacktestProgress').length
    client._emitOpen()   // first open is the initial connect → no re-issue
    expect(client.calls.filter((c) => c[0] === 'subscribeBacktestProgress').length).toBe(before)
    client._emitOpen()   // a reconnect → re-issue
    expect(client.calls.filter((c) => c[0] === 'subscribeBacktestProgress').length).toBe(before + 1)
    expect(h.lastSeq).toBe(-Infinity)
  })

  it('unsubscribe detaches fan-out + tells the gateway; destroy tears all down', () => {
    const h = feed.subscribeProgress({ run_id: 'r1' }, {})
    const sid = h.subscription_id
    feed.unsubscribe(h)
    expect(client._hasListeners(sid)).toBe(false)
    expect(client.calls).toContainEqual(['unsubscribe', sid])
    const h2 = feed.subscribeProgress({ run_id: 'r2' }, {})
    feed.destroy()
    expect(client._hasListeners(h2.subscription_id)).toBe(false)
  })
})
