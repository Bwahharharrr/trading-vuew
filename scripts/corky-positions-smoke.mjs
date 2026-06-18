#!/usr/bin/env node
// ───────────────────────────────────────────────────────────────────────────
// Corky AUTH-POSITION smoke — protocol + transform layer (no browser, no DOM).
//
// Connects the REAL CorkyClient + CorkyPositionsFeed to a running gateway and
// exercises the read-only auth-position flows that the bottom positions dock
// depends on:
//   list_auth_positions  → open + historical snapshot
//   subscribe_auth_positions → one live full-replacement update (best-effort)
//   list_auth_position_history → first cursor page (per account)
//   get_auth_position_audit → audit bundle for the first position
//
// PREREQUISITES: the corky stack running (see corky-gateway-smoke.mjs) AND a
// PRIVATE-account runtime publishing position snapshots for the account below.
//
// USAGE:
//   node scripts/corky-positions-smoke.mjs [ws://host:port] \
//        [--venue BITFINEX] [--account paper-a] [--symbol tBTCUSD] \
//        [--live-wait 10] [--no-subscribe]
//   CORKY_URL=ws://127.0.0.1:7070 node scripts/corky-positions-smoke.mjs
//
// EXIT: 0 = list_auth_positions answered (even with zero rows); 1 = failure.
// ───────────────────────────────────────────────────────────────────────────

import { CorkyClient } from '../src/helpers/feed/corky-client.js'
import { CorkyPositionsFeed } from '../src/helpers/feed/corky-positions-feed.js'

const argv = process.argv.slice(2)
const urlArg = argv.find((a) => a.startsWith('ws://') || a.startsWith('wss://'))
const URL = urlArg || process.env.CORKY_URL || 'ws://127.0.0.1:7070'
const flag = (name, def) => { const i = argv.indexOf(name); return i !== -1 && argv[i + 1] ? argv[i + 1] : def }
const VENUE = flag('--venue', 'BITFINEX')
const ACCOUNT = flag('--account', 'paper-a')
const EXPLICIT_ACCOUNT = argv.includes('--account')   // else auto-derive from rows
const SYMBOL = flag('--symbol', null)        // optional filter
const LIVE_WAIT_S = Number(flag('--live-wait', '10'))
const DO_SUBSCRIBE = !argv.includes('--no-subscribe')

const log = (...a) => console.log(...a)
const fail = (msg) => { console.error('\n✗ FAIL:', msg); process.exitCode = 1 }
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

if (typeof WebSocket === 'undefined') {
  fail('global WebSocket is not available in this Node. Use Node >= 22.')
  process.exit(1)
}

function waitOpen(client, timeoutMs = 8000) {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error(`open timeout after ${timeoutMs}ms`)), timeoutMs)
    const off = client.on('open', () => { clearTimeout(t); off && off(); resolve() })
    if (client._socket && client._socket.readyState === 1) { clearTimeout(t); resolve() }
  })
}

function rowLine(p) {
  return `      [${p.source}] ${p.symbol} ${p.side} amount=${p.amount} base=${p.base_price}` +
    (p.pl != null ? ` pl=${p.pl}` : '') + ` id=${p.position_id} acct=${p.account_id}`
}

async function main() {
  log(`→ connecting to ${URL}`)
  const client = new CorkyClient({ url: URL, backoff: false })
  client.connect()
  await waitOpen(client).catch((e) => { fail(`could not connect: ${e.message}`); process.exit(1) })
  log('  socket open ✓')

  const feed = new CorkyPositionsFeed({ client })

  // 1) LIST open + historical snapshot.
  let snap
  try {
    snap = await feed.listOpen({ venue: VENUE, symbol: SYMBOL, include_historical: true })
  } catch (e) {
    fail(`list_auth_positions rejected: ${e.code || ''} ${e.message}`)
    return cleanup(client)
  }
  log(`\n● list_auth_positions: ${snap.positions.length} row(s) — ` +
      `${snap.current.length} open, ${snap.historical.length} historical`)
  for (const p of snap.positions.slice(0, 10)) log(rowLine(p))

  // 2) SUBSCRIBE — wait for one live full-replacement update (best-effort).
  if (DO_SUBSCRIBE) {
    log(`\n● subscribe_auth_positions: waiting up to ${LIVE_WAIT_S}s for an update…`)
    let updates = 0
    const handle = feed.subscribeOpen(
      { subscription_id: 'corky-pos-smoke', venue: VENUE, include_historical: true },
      {
        onData: (out) => { updates++; if (updates === 1) log(`    update #1: ${out.positions.length} row(s) ✓`) },
        onError: (err) => log(`    [subscribe error] ${err.code || ''} ${err.message || err}` +
          (err && err.code === 'stateful_websocket_required' ? ' (socket not stateful → dock falls back to polling)' : '')),
      })
    const deadline = Date.now() + LIVE_WAIT_S * 1000
    while (Date.now() < deadline && updates === 0) await sleep(500)
    if (!updates) log('    ⚠ no update within the window (positions may be idle)')
    feed.unsubscribe(handle)
  }

  // 3) HISTORY — first cursor page for the account. Auto-derive the account from
  // the snapshot rows (history is per-account; the live account isn't known a
  // priori) unless --account was given explicitly.
  const histRow = snap.positions.find((p) => p.account_id)
  const ACCT = EXPLICIT_ACCOUNT ? ACCOUNT : ((histRow && histRow.account_id) || ACCOUNT)
  try {
    const page = await feed.listHistory({ venue: VENUE, account_id: ACCT })
    log(`\n● list_auth_position_history (${VENUE}/${ACCT}): ` +
        `${page.positions.length} row(s), total=${page.total_count}, next_cursor=${page.next_cursor ?? 'null'}`)
    for (const p of page.positions.slice(0, 5)) log(rowLine(p))
  } catch (e) {
    log(`\n● list_auth_position_history: ${e.code || ''} ${e.message}` +
        (e.code === 'auth_position_history_unavailable' ? ' (history store not loaded)' : ''))
  }

  // 4) AUDIT — bundle for the first available position.
  const target = snap.positions[0]
  if (target) {
    try {
      const audit = await feed.getAudit({
        venue: target.venue, account_id: target.account_id,
        symbol: target.symbol, position_id: target.position_id,
      })
      const s = audit && audit.summary
      log(`\n● get_auth_position_audit (${target.symbol} #${target.position_id}): ` +
          `status=${s ? s.status : '?'} orders=${s ? s.order_count : '?'} trades=${s ? s.trade_count : '?'}`)
      if (s && s.reasons && s.reasons.length) log(`    reasons: ${s.reasons.join('; ')}`)
    } catch (e) {
      log(`\n● get_auth_position_audit: ${e.code || ''} ${e.message}`)
    }
  } else {
    log('\n● get_auth_position_audit: skipped (no positions to audit)')
  }

  log('\n────────────────────────────────────────')
  log('AUTH-POSITION SMOKE SUMMARY')
  log(`  connected:  ✓ ${URL}`)
  log(`  open:       ${snap.current.length}`)
  log(`  historical: ${snap.historical.length}`)
  log('────────────────────────────────────────')
  log('✓ PASS — list_auth_positions answered.')

  feed.destroy()
  cleanup(client)
}

function cleanup(client) {
  try { client.close() } catch (_) { /* noop */ }
  setTimeout(() => process.exit(process.exitCode || 0), 250)
}

main().catch((e) => { fail(e && e.stack || String(e)); setTimeout(() => process.exit(1), 100) })
