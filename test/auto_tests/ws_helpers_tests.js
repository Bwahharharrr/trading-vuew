// Unit tests for the pure WS helpers used by the live-feed mixin.

import test from 'ava'

import { buildWsUrl, msgMatchesMeta } from '../../src/helpers/ws-helpers.js'

// ── buildWsUrl ──────────────────────────────────────────────────────────────
//
// Two modes:
//   1. Default (meta.ws.host empty): proxy-via-page →
//      ws://<page-host>:<page-port>/live-ws/<backend-port>
//   2. Direct (meta.ws.host non-empty): legacy direct →
//      ws://<meta.ws.host>:<meta.ws.port><meta.ws.path>
//
// Signature: buildWsUrl(meta, pageProtocol, pageHostname, pagePort)
// pagePort is window.location.port — '' for default 80/443.

test('buildWsUrl: null meta → null', t => {
    t.is(buildWsUrl(null, 'http:', 'localhost', '10850'), null)
})

test('buildWsUrl: undefined meta → null', t => {
    t.is(buildWsUrl(undefined, 'http:', 'localhost', '10850'), null)
})

test('buildWsUrl: meta with no ws block → null', t => {
    t.is(buildWsUrl({ exchange: 'X' }, 'http:', 'localhost', '10850'), null)
})

test('buildWsUrl: ws.port = 0 → null (websocket disabled)', t => {
    t.is(buildWsUrl({ ws: { port: 0 } }, 'http:', 'localhost', '10850'), null)
})

test('buildWsUrl: ws.port missing → null', t => {
    t.is(buildWsUrl({ ws: {} }, 'http:', 'localhost', '10850'), null)
})

// ── Proxy mode (default) ────────────────────────────────────────────────────

test('buildWsUrl: proxy mode uses page host:port and /live-ws/<port> path', t => {
    const url = buildWsUrl({ ws: { port: 8765 } }, 'http:', 'localhost', '10850')
    t.is(url, 'ws://localhost:10850/live-ws/8765')
})

test('buildWsUrl: proxy mode preserves backend port distinct per file', t => {
    const a = buildWsUrl({ ws: { port: 8765 } }, 'http:', 'localhost', '10850')
    const b = buildWsUrl({ ws: { port: 8766 } }, 'http:', 'localhost', '10850')
    t.is(a, 'ws://localhost:10850/live-ws/8765')
    t.is(b, 'ws://localhost:10850/live-ws/8766')
    t.not(a, b)
})

test('buildWsUrl: proxy mode with no page port (default 80/443)', t => {
    const url = buildWsUrl({ ws: { port: 8765 } }, 'http:', 'localhost', '')
    t.is(url, 'ws://localhost/live-ws/8765')
})

test('buildWsUrl: page protocol https → wss for proxy mode', t => {
    const url = buildWsUrl({ ws: { port: 8765 } }, 'https:', 'localhost', '10850')
    t.is(url, 'wss://localhost:10850/live-ws/8765')
})

test('buildWsUrl: proxy mode uses the page hostname (not localhost)', t => {
    // User's setup: page is loaded from a remote / port-forwarded host.
    const url = buildWsUrl(
        { ws: { port: 34523 } }, 'http:', '50.35.34.14', '10850')
    t.is(url, 'ws://50.35.34.14:10850/live-ws/34523')
})

// ── Direct mode (operator opt-in via meta.ws.host) ──────────────────────────

test('buildWsUrl: meta.ws.host non-empty → direct mode, bypasses proxy', t => {
    const url = buildWsUrl(
        { ws: { port: 8766, host: 'charts.example.com' } },
        'http:', 'localhost', '10850')
    t.is(url, 'ws://charts.example.com:8766/')
})

test('buildWsUrl: direct mode honours meta.ws.path', t => {
    const url = buildWsUrl(
        { ws: { port: 8765, host: 'feed.example.com', path: '/live' } },
        'http:', 'localhost', '10850')
    t.is(url, 'ws://feed.example.com:8765/live')
})

test('buildWsUrl: direct mode + https → wss', t => {
    const url = buildWsUrl(
        { ws: { port: 8766, host: 'charts.example.com' } },
        'https:', 'localhost', '10850')
    t.is(url, 'wss://charts.example.com:8766/')
})


// ── msgMatchesMeta ──────────────────────────────────────────────────────────

const META = {
    exchange: 'BITFINEX',
    ticker:   'tBTCUSD',
    tf:       '1m',
    instance_id: '',
}

test('msgMatchesMeta: exact match → true', t => {
    const msg = { exchange: 'BITFINEX', ticker: 'tBTCUSD', tf: '1m', instance_id: '' }
    t.true(msgMatchesMeta(msg, META))
})

test('msgMatchesMeta: tf mismatch → false (cross-talk)', t => {
    const msg = { exchange: 'BITFINEX', ticker: 'tBTCUSD', tf: '1h', instance_id: '' }
    t.false(msgMatchesMeta(msg, META))
})

test('msgMatchesMeta: ticker mismatch → false', t => {
    const msg = { exchange: 'BITFINEX', ticker: 'tETHUSD', tf: '1m', instance_id: '' }
    t.false(msgMatchesMeta(msg, META))
})

test('msgMatchesMeta: exchange mismatch → false', t => {
    const msg = { exchange: 'COINBASE', ticker: 'tBTCUSD', tf: '1m', instance_id: '' }
    t.false(msgMatchesMeta(msg, META))
})

test('msgMatchesMeta: instance_id mismatch → false', t => {
    const msg = { exchange: 'BITFINEX', ticker: 'tBTCUSD', tf: '1m', instance_id: 'runA' }
    t.false(msgMatchesMeta(msg, META))
})

test('msgMatchesMeta: missing instance_id normalized to ""', t => {
    // msg lacks instance_id; meta has "" → should match
    const msg = { exchange: 'BITFINEX', ticker: 'tBTCUSD', tf: '1m' }
    t.true(msgMatchesMeta(msg, META))
})

test('msgMatchesMeta: null instance_id normalized to ""', t => {
    const msg = { exchange: 'BITFINEX', ticker: 'tBTCUSD', tf: '1m', instance_id: null }
    t.true(msgMatchesMeta(msg, META))
})

test('msgMatchesMeta: null meta → false (no file loaded)', t => {
    const msg = { exchange: 'BITFINEX', ticker: 'tBTCUSD', tf: '1m', instance_id: '' }
    t.false(msgMatchesMeta(msg, null))
})

test('msgMatchesMeta: null msg → false', t => {
    t.false(msgMatchesMeta(null, META))
})

test('msgMatchesMeta: with instance_id on both sides', t => {
    const meta = { ...META, instance_id: 'runA' }
    const ok = { exchange: 'BITFINEX', ticker: 'tBTCUSD', tf: '1m', instance_id: 'runA' }
    const wrong = { exchange: 'BITFINEX', ticker: 'tBTCUSD', tf: '1m', instance_id: 'runB' }
    t.true(msgMatchesMeta(ok, meta))
    t.false(msgMatchesMeta(wrong, meta))
})
