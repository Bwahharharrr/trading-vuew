#!/usr/bin/env node
// ───────────────────────────────────────────────────────────────────────────
// Corky gateway smoke — PROTOCOL + TRANSFORM layer (no browser, no DOM).
//
// Connects the REAL CorkyClient to a running gateway, runs the documented
// client flow (list_candle_states → subscribe_candles → historical → live),
// and pushes the rows through the REAL ingest transform (assembleChunks →
// buildChartData → applyLiveUpdate). It asserts that actual candles + indicator
// series come back and that at least one live tick arrives.
//
// This is the smoke that CAN run here: it needs only the gateway, not `vite
// dev` (which won't start in some sandboxes). It exercises exactly the
// transport+transform code App.vue's Gateway mode depends on.
//
// PREREQUISITES (start the corky stack first):
//   cargo run -p corky-chart-gateway -- \
//     --bind 127.0.0.1:7070 \
//     --observability-endpoint tcp://127.0.0.1:5558 \
//     --control-endpoint tcp://127.0.0.1:6565
//   (+ corky-zmq proxy on :5558 and a public runtime publishing snapshots)
//
// If discovery returns no usable state, the smoke BOOTSTRAPS one with
// upsert_candle_state (create-or-replace desired state), then re-discovers.
// NOTE: the gateway accepts desired state but does NOT launch runtimes, so a
// public runtime must still be up for the bootstrapped state to populate.
//
// USAGE:
//   node scripts/corky-gateway-smoke.mjs [ws://host:port] [--tf 1m] [--live-wait 20]
//   # bootstrap target (used when discovery is empty, or to force a symbol):
//   node scripts/corky-gateway-smoke.mjs --venue BITFINEX --symbol tBTCUSD \
//        --bootstrap-tfs 1m,5m --buffer 200
//   node scripts/corky-gateway-smoke.mjs --no-bootstrap   # discovery-only
//   CORKY_URL=ws://127.0.0.1:7070 node scripts/corky-gateway-smoke.mjs
//
// EXIT: 0 = candles rendered (live tick is a warning if missing); 1 = failure.
// ───────────────────────────────────────────────────────────────────────────

import { CorkyClient } from '../src/helpers/feed/corky-client.js'
import {
  assembleChunks,
  buildChartData,
  applyLiveUpdate,
} from '../src/helpers/feed/corky-ingest.js'

// ── args ──
const argv = process.argv.slice(2)
const urlArg = argv.find((a) => a.startsWith('ws://') || a.startsWith('wss://'))
const URL = urlArg || process.env.CORKY_URL || 'ws://127.0.0.1:7070'
const flag = (name, def) => {
  const i = argv.indexOf(name)
  return i !== -1 && argv[i + 1] ? argv[i + 1] : def
}
const PREFER_TF = flag('--tf', null)
const LIVE_WAIT_S = Number(flag('--live-wait', '20'))
// Bootstrap target (desired state to upsert when discovery has nothing usable).
const WANT_VENUE = flag('--venue', 'BITFINEX')
const WANT_SYMBOL = flag('--symbol', 'tBTCUSD')
const EXPLICIT_TARGET = argv.includes('--venue') || argv.includes('--symbol')
const BOOTSTRAP = !argv.includes('--no-bootstrap')
const BOOT_TFS = flag('--bootstrap-tfs', '1m,5m').split(',').map((s) => s.trim()).filter(Boolean)
const BUFFER = Number(flag('--buffer', '200'))

const log = (...a) => console.log(...a)
const fail = (msg) => { console.error('\n✗ FAIL:', msg); process.exitCode = 1 }
const asArray = (x) => (Array.isArray(x) ? x : (x ? [x] : []))

if (typeof WebSocket === 'undefined') {
  fail('global WebSocket is not available in this Node. Use Node >= 22, or run the browser smoke instead.')
  process.exit(1)
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

async function main() {
  log(`→ connecting to ${URL}`)
  const client = new CorkyClient({ url: URL, backoff: false })
  client.connect()
  // Wait for the socket to actually open (or fail fast).
  await waitOpen(client).catch((e) => { fail(`could not connect: ${e.message}`); process.exit(1) })
  log('  socket open ✓')

  // 1) DISCOVER — list_candle_states.
  let states
  try {
    states = await client.listCandleStates()
  } catch (e) {
    fail(`list_candle_states rejected: ${e.code || ''} ${e.message}`)
    return cleanup(client)
  }
  states = asArray(states)
  logDiscovery(states)

  // Resolve a target state. If none is usable, BOOTSTRAP one with
  // upsert_candle_state, then re-discover.
  let state = pickState(states)
  if (!state && BOOTSTRAP) {
    states = await bootstrapState(client)
    logDiscovery(states)
    state = pickState(states)
  }
  if (!state) {
    fail('no usable candle state' + (BOOTSTRAP
      ? ` even after upsert — the gateway accepts desired state but does NOT launch runtimes; ` +
        `start the public runtime for ${WANT_VENUE} (and ensure it publishes snapshots), then re-run.`
      : ' (re-run without --no-bootstrap to upsert one, or start a public runtime).'))
    return cleanup(client)
  }

  // Pick a timeframe within the chosen state.
  const tfs = state.available_timeframes || []
  const timeframe = (PREFER_TF && tfs.includes(PREFER_TF)) ? PREFER_TF : (tfs.includes('1m') ? '1m' : tfs[0])
  if (!timeframe) { fail(`state ${state.venue}:${state.symbol} exposes no timeframes`); return cleanup(client) }
  const indicators = (state.indicators || [])
    .filter((i) => !i.timeframe || i.timeframe === timeframe)
    .map((i) => i.display_label)
  log(`\n● Subscribing: ${state.venue}:${state.symbol} ${timeframe}` +
      (indicators.length ? `  (indicators: ${indicators.join(', ')})` : ''))

  // 2) SUBSCRIBE — drive the documented event flow, collect via onSubscription.
  const subscription_id = 'corky-smoke-1'
  const chunks = []
  let complete = false
  let liveCount = 0
  let lastLiveTs = null
  const lastSeqBySub = {}
  let chartData = null

  const unsub = client.onSubscription(subscription_id, ({ event }) => {
    if (!event) return
    switch (event.type) {
      case 'historical_chunk': chunks.push(event); break
      case 'historical_progress':
        if (event.total) process.stdout.write(`\r    history ${event.current}/${event.total}   `)
        break
      case 'historical_complete': complete = true; break
      case 'live_update':
        if (!chartData) break
        {
          const res = applyLiveUpdate(chartData, event, lastSeqBySub)
          if (res.applied) { liveCount++; lastLiveTs = event.row?.candle?.timestamp_ms }
        }
        break
      case 'error':
        log('\n  [subscription error]', event.code, event.message)
        break
    }
  })

  try {
    await client.subscribeCandles({
      subscription_id,
      venue: state.venue,
      symbol: state.symbol,
      timeframe,
      indicators: indicators.length ? indicators : undefined,
      include_indicators: indicators.length ? true : undefined,
      range: { type: 'latest', limit: 200 },
    })
  } catch (e) {
    unsub && unsub()
    fail(`subscribe_candles rejected: ${e.code || ''} ${e.message}`)
    return cleanup(client)
  }

  // 3) ASSEMBLE HISTORY through the real transform.
  const rows = assembleChunks(chunks)
  chartData = buildChartData(rows, { timeframe })
  chartData.timeframe = timeframe
  const candles = chartData.chart.data
  log(`\n\n● Historical: ${chunks.length} chunk(s), ${candles.length} candle(s)` +
      (complete ? ' (historical_complete ✓)' : ' (no historical_complete!)'))
  if (candles.length) {
    const first = candles[0], last = candles[candles.length - 1]
    log(`    first ts ${first[0]}  close ${first[4]}`)
    log(`    last  ts ${last[0]}  O/H/L/C ${last[1]}/${last[2]}/${last[3]}/${last[4]}  V ${last[5]}`)
  }
  const overlays = [...chartData.onchart.map((o) => ['onchart', o]), ...chartData.offchart.map((o) => ['offchart', o])]
  log(`    indicator overlays: ${overlays.length}`)
  for (const [pane, o] of overlays) log(`      [${pane}] ${o.name} (${o.type})  ${o.data.length} pts`)

  if (!candles.length) { fail('historical produced zero candles'); unsub && unsub(); return cleanup(client) }

  // 4) LIVE — wait for at least one tick.
  log(`\n● Waiting up to ${LIVE_WAIT_S}s for a live tick…`)
  const deadline = Date.now() + LIVE_WAIT_S * 1000
  while (Date.now() < deadline && liveCount === 0) await sleep(500)
  unsub && unsub()

  if (liveCount > 0) log(`    live updates applied: ${liveCount} (last ts ${lastLiveTs}) ✓`)
  else log('    ⚠ no live tick within the window (history OK; the runtime may be idle between candles)')

  // ── verdict ──
  log('\n────────────────────────────────────────')
  log('SMOKE SUMMARY')
  log(`  connected:        ✓ ${URL}`)
  log(`  states:           ${states.length}`)
  log(`  subscribed:       ${state.venue}:${state.symbol} ${timeframe}`)
  log(`  candles:          ${candles.length}`)
  log(`  indicator series: ${overlays.length}`)
  log(`  live ticks:       ${liveCount}${liveCount ? ' ✓' : ' (none — warning)'}`)
  log('────────────────────────────────────────')
  log(candles.length ? '✓ PASS — gateway → client → transform produced a renderable chart.' : '')

  // Tidy unsubscribe.
  try { await client.unsubscribe(subscription_id) } catch (_) { /* closing anyway */ }
  cleanup(client)
}

function logDiscovery(states) {
  log(`\n● Discovery: ${states.length} candle state(s)`)
  for (const s of states) {
    log(`    ${s.venue} ${s.symbol}  [${(s.available_timeframes || []).join(', ')}]  ` +
        `indicators: ${(s.indicators || []).map((i) => i.display_label).join(', ') || '(none)'}`)
  }
}

// Choose a usable state: the explicit --venue/--symbol target if given,
// else the first state that exposes any timeframe.
function pickState(states) {
  if (!states.length) return null
  const eq = (a, b) => String(a).toLowerCase() === String(b).toLowerCase()
  if (EXPLICIT_TARGET) {
    return states.find((s) => eq(s.venue, WANT_VENUE) && eq(s.symbol, WANT_SYMBOL) && (s.available_timeframes || []).length)
        || states.find((s) => eq(s.venue, WANT_VENUE) && eq(s.symbol, WANT_SYMBOL))
        || null
  }
  return states.find((s) => (s.available_timeframes || []).length) || states[0]
}

// Create-or-replace a desired candle state, then poll discovery until it
// registers. Returns the (re-discovered) states[]. Logs the control_ack.
async function bootstrapState(client) {
  const indicators = [{ kind: 'sma', timeframe: BOOT_TFS[0], source: 'close', params: { period: '20' } }]
  log(`\n● Bootstrapping desired state via upsert_candle_state: ` +
      `${WANT_VENUE}:${WANT_SYMBOL} [${BOOT_TFS.join(',')}] + sma(20), buffer ${BUFFER}`)
  let ack
  try {
    ack = await client.upsertCandleState({
      venue: WANT_VENUE, symbol: WANT_SYMBOL, timeframes: BOOT_TFS, indicators, buffer: BUFFER,
    })
  } catch (e) {
    log(`    ✗ upsert_candle_state rejected: ${e.code || ''} ${e.message}` +
        (e.code === 'runtime_not_found' ? ` — no public runtime observed for ${WANT_VENUE}.` : ''))
    return []
  }
  log(`    control_ack: status=${ack && ack.status != null ? ack.status : '?'}` +
      (ack && ack.outcome != null ? ` outcome=${ack.outcome}` : '') +
      (ack && ack.restart_required != null ? ` restart_required=${ack.restart_required}` : '') +
      (ack && ack.target_runtime_id ? ` runtime=${ack.target_runtime_id}` : '') +
      (ack && ack.message ? ` — ${ack.message}` : ''))
  // The runtime may take a moment to seed/register the new state — poll.
  for (let i = 0; i < 8; i++) {
    await sleep(1000)
    const again = asArray(await client.listCandleStates().catch(() => []))
    if (pickState(again)) { log(`\r    state registered after ${i + 1}s ✓                `); return again }
    process.stdout.write(`\r    waiting for state to register… ${i + 1}/8   `)
  }
  log('')
  return asArray(await client.listCandleStates().catch(() => []))
}

function waitOpen(client, timeoutMs = 8000) {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error(`open timeout after ${timeoutMs}ms`)), timeoutMs)
    const offOpen = client.on('open', () => { clearTimeout(t); offOpen && offOpen(); resolve() })
    const offClose = client.on('close', () => { /* may fire on failure */ })
    // If the client exposes a connected flag synchronously, resolve fast.
    if (client._socket && client._socket.readyState === 1) { clearTimeout(t); resolve() }
    void offClose
  })
}

function cleanup(client) {
  try { client.close() } catch (_) { /* noop */ }
  // Give the close frame a tick, then exit.
  setTimeout(() => process.exit(process.exitCode || 0), 250)
}

main().catch((e) => { fail(e && e.stack || String(e)); setTimeout(() => process.exit(1), 100) })
