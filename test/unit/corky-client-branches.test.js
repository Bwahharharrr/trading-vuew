// CorkyClient branch top-ups: exponential backoff progression + exhaustion
// (pending requests must FAIL, not hang), schema-version rejection, and the
// close-during-CONNECTING path. Uses the same StatefulSocket model as the
// send-on-dead-socket regression suite.
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { CorkyClient } from '../../src/helpers/feed/corky-client.js'

class StatefulSocket {
  constructor(url) {
    this.url = url
    this.readyState = 0
    this.sent = []
    this.onopen = this.onmessage = this.onclose = this.onerror = null
    StatefulSocket.instances.push(this)
  }
  send(raw) { if (this.readyState === 1) this.sent.push(raw) }
  close() { this.readyState = 3; if (this.onclose) this.onclose({ code: 1000 }) }
  open() { this.readyState = 1; if (this.onopen) this.onopen({}) }
  drop(code = 1006) { this.readyState = 3; if (this.onclose) this.onclose({ code }) }
  reply(envelope) { this.onmessage({ data: JSON.stringify(envelope) }) }
}
StatefulSocket.instances = []

function makeClient(backoff) {
  StatefulSocket.instances = []
  const client = new CorkyClient({
    url: 'ws://fake/corky',
    socketFactory: (url) => new StatefulSocket(url),
    backoff,
  })
  return { client, sockets: StatefulSocket.instances }
}

beforeEach(() => vi.useFakeTimers())
afterEach(() => vi.useRealTimers())

describe('reconnect backoff', () => {
  it('delays grow base*factor^n and reconnecting events carry the attempt', () => {
    const { client, sockets } = makeClient({ base: 10, factor: 2, max: 1000, maxRetries: 4 })
    const events = []
    client.on('reconnecting', (e) => events.push(e))
    client.connect()
    sockets[0].open()
    sockets[0].drop()                  // → schedule attempt 1 after 10ms
    expect(sockets.length).toBe(1)
    vi.advanceTimersByTime(10)
    expect(sockets.length).toBe(2)     // attempt 1 fired
    sockets[1].drop()                  // → attempt 2 after 20ms
    vi.advanceTimersByTime(19)
    expect(sockets.length).toBe(2)     // not yet
    vi.advanceTimersByTime(1)
    expect(sockets.length).toBe(3)
    expect(events.map(e => e.attempt)).toEqual([1, 2])
    expect(events[0].delay).toBe(10)
    expect(events[1].delay).toBe(20)
  })

  it('exhaustion: emits reconnect-exhausted, FAILS pending requests, drops the queue', async () => {
    const { client, sockets } = makeClient({ base: 1, factor: 1, max: 10, maxRetries: 1 })
    let exhausted = null
    client.on('reconnect-exhausted', (e) => { exhausted = e })
    client.connect()
    sockets[0].open()
    sockets[0].drop()                 // schedules the single allowed retry
    vi.advanceTimersByTime(1)         // retry socket created (CONNECTING)
    // a request fired now queues (socket CONNECTING)
    const pending = client.listCandleStates()
    sockets[1].drop()                 // retry dies too → retries >= maxRetries
    expect(exhausted).toEqual({ retries: 1 })
    await expect(pending).rejects.toMatchObject({ code: expect.stringMatching(/connection_lost|reconnect_exhausted/) })
    expect(client._sendQueue).toEqual([]) // no stale frames for a socket that never comes
  })

  it('user close() cancels a scheduled reconnect', () => {
    const { client, sockets } = makeClient({ base: 10, factor: 2, max: 100, maxRetries: 3 })
    client.connect()
    sockets[0].open()
    sockets[0].drop()
    client.close()
    vi.advanceTimersByTime(10_000)
    expect(sockets.length).toBe(1) // nothing reconnected after a user close
  })
})

describe('inbound guards', () => {
  it('rejects a pending request on schema_version mismatch', async () => {
    const { client, sockets } = makeClient(false)
    client.connect()
    sockets[0].open()
    const p = client.listCandleStates()
    const sent = JSON.parse(sockets[0].sent[0])
    sockets[0].reply({
      schema_version: 99, request_id: sent.request_id,
      event: { type: 'candle_states', states: [] },
    })
    await expect(p).rejects.toMatchObject({ code: 'unsupported_schema_version' })
  })

  it('malformed envelopes emit parse-error and never settle anything', () => {
    const { client, sockets } = makeClient(false)
    client.connect()
    sockets[0].open()
    const errs = []
    client.on('parse-error', (e) => errs.push(e))
    sockets[0].onmessage({ data: 'not-json{{' })
    sockets[0].reply({ no_event: true })
    expect(errs.length).toBe(2)
  })

  it('a request fired while CONNECTING is queued, then flushed on open', async () => {
    const { client, sockets } = makeClient(false)
    client.connect()                  // socket CONNECTING
    const p = client.listCandleStates()
    expect(sockets[0].sent.length).toBe(0)
    sockets[0].open()                 // onopen flushes the queue
    expect(sockets[0].sent.length).toBe(1)
    const sent = JSON.parse(sockets[0].sent[0])
    sockets[0].reply({ request_id: sent.request_id, event: { type: 'candle_states', states: [1] } })
    await expect(p).resolves.toEqual([1])
  })
})
