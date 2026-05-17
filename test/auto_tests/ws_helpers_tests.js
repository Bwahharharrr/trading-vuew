// Unit tests for the pure WS helpers used by the live-feed mixin.

import test from 'ava'

import { buildWsUrl, msgMatchesMeta } from '../../src/helpers/ws-helpers.js'

// ── buildWsUrl ──────────────────────────────────────────────────────────────

test('buildWsUrl: null meta → null', t => {
    t.is(buildWsUrl(null, 'http:', 'localhost'), null)
})

test('buildWsUrl: undefined meta → null', t => {
    t.is(buildWsUrl(undefined, 'http:', 'localhost'), null)
})

test('buildWsUrl: meta with no ws block → null', t => {
    t.is(buildWsUrl({ exchange: 'X' }, 'http:', 'localhost'), null)
})

test('buildWsUrl: ws.port = 0 → null (websocket disabled)', t => {
    t.is(buildWsUrl({ ws: { port: 0 } }, 'http:', 'localhost'), null)
})

test('buildWsUrl: ws.port missing → null', t => {
    t.is(buildWsUrl({ ws: {} }, 'http:', 'localhost'), null)
})

test('buildWsUrl: localhost default path', t => {
    const url = buildWsUrl({ ws: { port: 8765 } }, 'http:', 'localhost')
    t.is(url, 'ws://localhost:8765/')
})

test('buildWsUrl: meta.ws.host wins over page hostname', t => {
    const url = buildWsUrl(
        { ws: { port: 8766, host: 'charts.example.com' } },
        'http:', 'localhost')
    t.is(url, 'ws://charts.example.com:8766/')
})

test('buildWsUrl: page protocol https → wss', t => {
    const url = buildWsUrl({ ws: { port: 8765 } }, 'https:', 'localhost')
    t.is(url, 'wss://localhost:8765/')
})

test('buildWsUrl: meta.ws.path honoured', t => {
    const url = buildWsUrl(
        { ws: { port: 8765, path: '/live' } },
        'http:', 'localhost')
    t.is(url, 'ws://localhost:8765/live')
})

test('buildWsUrl: distinct ports give distinct URLs (multi-instance)', t => {
    const a = buildWsUrl({ ws: { port: 8765 } }, 'http:', 'localhost')
    const b = buildWsUrl({ ws: { port: 8766 } }, 'http:', 'localhost')
    t.not(a, b)
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
