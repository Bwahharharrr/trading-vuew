// CorkyStrategyFeed direct-control passthroughs: each feed control method is a
// thin delegate to the matching client sender, forwarding opts verbatim and
// returning the client's promise. Uses a fake client (records calls).
import { describe, it, expect, beforeEach } from 'vitest'
import { CorkyStrategyFeed } from '../../src/helpers/feed/corky-strategy-feed.js'

function makeFakeClient() {
  const client = {
    calls: [],
    _ack: Promise.resolve({ type: 'control_ack', outcome: 'accepted' }),
    pauseStrategyTicker(o) { this.calls.push(['pauseStrategyTicker', o]); return this._ack },
    resumeStrategyTicker(o) { this.calls.push(['resumeStrategyTicker', o]); return this._ack },
    unlockStrategyTicker(o) { this.calls.push(['unlockStrategyTicker', o]); return this._ack },
    adoptStrategyPosition(o) { this.calls.push(['adoptStrategyPosition', o]); return this._ack },
    adoptStrategyPositions(o) { this.calls.push(['adoptStrategyPositions', o]); return this._ack },
    cancelStrategyTickerOrders(o) { this.calls.push(['cancelStrategyTickerOrders', o]); return this._ack },
    // read/subscribe surface still required by the constructor path
    on() { return () => {} },
  }
  return client
}

let client, feed
beforeEach(() => { client = makeFakeClient(); feed = new CorkyStrategyFeed({ client }) })

describe('feed control passthrough — delegates verbatim + returns the client promise', () => {
  it('pauseTicker / resumeTicker / cancelTickerOrders forward opts to the client', async () => {
    const opts = { runtime_id: 'rt', ticker_id: 'tk', reason: 'r', target_runtime_id: 'rt' }
    await expect(feed.pauseTicker(opts)).resolves.toMatchObject({ type: 'control_ack' })
    await feed.resumeTicker({ runtime_id: 'rt', ticker_id: 'tk', reason: 'resume' })
    await feed.cancelTickerOrders({ runtime_id: 'rt', ticker_id: 'tk', reason: 'cancel' })
    expect(client.calls).toContainEqual(['pauseStrategyTicker', opts])
    expect(client.calls).toContainEqual(['resumeStrategyTicker', { runtime_id: 'rt', ticker_id: 'tk', reason: 'resume' }])
    expect(client.calls).toContainEqual(['cancelStrategyTickerOrders', { runtime_id: 'rt', ticker_id: 'tk', reason: 'cancel' }])
  })

  it('unlockTicker / adoptPosition / adoptPositions forward opts to the client', async () => {
    const unlock = { runtime_id: 'rt', ticker_id: 'tk', reason: 'r', new_allocation: { currency: 'TESTUSD', amount: '10' } }
    const adopt1 = { runtime_id: 'rt', ticker_id: 'tk', position_id: 77, reason: 'r' }
    const adoptN = { runtime_id: 'rt', positions: [{ ticker_id: 'tk', position_id: 1 }], reason: 'r' }
    await feed.unlockTicker(unlock)
    await feed.adoptPosition(adopt1)
    await feed.adoptPositions(adoptN)
    expect(client.calls).toContainEqual(['unlockStrategyTicker', unlock])
    expect(client.calls).toContainEqual(['adoptStrategyPosition', adopt1])
    expect(client.calls).toContainEqual(['adoptStrategyPositions', adoptN])
  })

  it('the read/subscribe surface is preserved alongside the new control methods', () => {
    for (const m of ['listRuntimes', 'getRuntime', 'getTicker', 'listDecisions', 'getChartOverlays', 'subscribeRuntime',
      'pauseTicker', 'resumeTicker', 'unlockTicker', 'adoptPosition', 'adoptPositions', 'cancelTickerOrders']) {
      expect(typeof feed[m]).toBe('function')
    }
  })
})
