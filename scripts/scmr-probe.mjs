#!/usr/bin/env node
// SCMR vs SCMR-INV feed probe (read-only).
// Connects to the Corky gateway, discovers the SCMR / SCMR-INV indicators, dumps
// their candle_color palette, and prints the candle_type_color id sequence for
// each side by side — to confirm whether the FEED sends the same or inverse data.
//
//   node scripts/scmr-probe.mjs [ws://host:port] [--tf 1m]
//   CORKY_URL=ws://127.0.0.1:7070 node scripts/scmr-probe.mjs

import { CorkyClient } from '../src/helpers/feed/corky-client.js'
import { assembleChunks } from '../src/helpers/feed/corky-ingest.js'

const argv = process.argv.slice(2)
const URL = argv.find(a => a.startsWith('ws')) || process.env.CORKY_URL || 'ws://127.0.0.1:7070'
const flag = (n, d) => { const i = argv.indexOf(n); return i !== -1 && argv[i + 1] ? argv[i + 1] : d }
const PREFER_TF = flag('--tf', null)
const asArray = x => Array.isArray(x) ? x : (x ? [x] : [])
const sleep = ms => new Promise(r => setTimeout(r, ms))
const isScmr = s => /scmr/i.test(String(s || ''))

function waitOpen(client) {
  return new Promise((res, rej) => {
    const off = client.on('open', () => { off(); res() })
    const offc = client.on('close', () => { offc(); rej(new Error('socket closed before open')) })
    setTimeout(() => rej(new Error('open timed out (is the gateway up on ' + URL + '?)')), 8000)
  })
}

async function main() {
  console.log(`→ connecting ${URL}`)
  const client = new CorkyClient({ url: URL, backoff: false })
  client.connect()
  await waitOpen(client)
  console.log('  open ✓')

  const states = asArray(await client.listCandleStates())
  // Find every (state, SCMR-ish indicator) pair.
  const hits = []
  for (const st of states) {
    for (const ind of (st.indicators || [])) {
      if (isScmr(ind.display_label) || isScmr(ind.kind) || isScmr(ind.instance)) {
        hits.push({ st, ind })
      }
    }
  }
  if (!hits.length) {
    console.log('No SCMR indicators found in discovery. States/indicators seen:')
    for (const st of states) {
      console.log(`  ${st.venue}:${st.symbol}  [${(st.indicators || []).map(i => i.display_label || i.kind).join(', ')}]`)
    }
    return cleanup(client)
  }

  console.log('\n=== SCMR indicator descriptors ===')
  for (const { st, ind } of hits) {
    console.log(`\n• ${st.venue}:${st.symbol}  display_label="${ind.display_label}"  kind="${ind.kind}"  instance="${ind.instance}"  tf="${ind.timeframe || '*'}"`)
    const layers = (ind.view && ind.view.layers) || []
    const cc = layers.find(l => l && l.id === 'scmr_candle_color') || layers.find(l => l && l.kind === 'candle_color')
    if (cc) {
      const s = cc.style || {}
      const palette = Object.keys(s).filter(k => /^color_\d+$/.test(k)).sort((a, b) => +a.slice(6) - +b.slice(6))
        .map(k => `${k.slice(6)}:${s[k]}`).join(' ')
      console.log(`    candle_color layer: color_field=${s.color_field}  palette=[${palette}]`)
    } else {
      console.log('    (no scmr_candle_color layer in view)')
    }
  }

  // Pick the state that carries the MOST SCMR indicators (ideally both).
  const byState = new Map()
  for (const h of hits) {
    const key = `${h.st.venue}|${h.st.symbol}`
    if (!byState.has(key)) byState.set(key, { st: h.st, inds: [] })
    byState.get(key).inds.push(h.ind)
  }
  const chosen = [...byState.values()].sort((a, b) => b.inds.length - a.inds.length)[0]
  const st = chosen.st
  const tfs = st.available_timeframes || []
  const timeframe = (PREFER_TF && tfs.includes(PREFER_TF)) ? PREFER_TF : (tfs.includes('1m') ? '1m' : tfs[0])
  console.log(`\n=== Subscribing ${st.venue}:${st.symbol} ${timeframe} (include_indicators) ===`)

  const sid = 'scmr-probe-1'
  const chunks = []
  let complete = false
  const off = client.onSubscription(sid, ({ event }) => {
    if (!event) return
    if (event.type === 'historical_chunk') chunks.push(event)
    else if (event.type === 'historical_complete') complete = true
    else if (event.type === 'error') console.log('  [sub error]', event.code, event.message)
  })

  await client.subscribeCandles({
    subscription_id: sid, venue: st.venue, symbol: st.symbol, timeframe,
    include_indicators: true, range: { type: 'latest', limit: 60 },
  }).catch(e => console.log('  subscribe rejected:', e.code, e.message))

  for (let i = 0; i < 40 && !complete; i++) await sleep(100)

  const rows = assembleChunks(chunks)
  console.log(`  assembled ${rows.length} rows`)
  if (!rows.length) return cleanup(client, off, sid)

  // Discover the actual instance KEYS used inside row.indicators that are SCMR-ish.
  const keySet = new Set()
  for (const r of rows) for (const k of Object.keys(r.indicators || {})) if (isScmr(k)) keySet.add(k)
  const keys = [...keySet]
  console.log(`\n=== SCMR instance keys present in rows: [${keys.join(', ')}] ===`)
  if (keys.length < 2) {
    console.log('  ⚠ Fewer than 2 SCMR instances in the rows — the second may not be a maintained indicator on this state.')
  }

  // Print candle_type_color id per row, per SCMR instance key, side by side.
  console.log(`\n${'ts'.padEnd(16)}${keys.map(k => k.padEnd(22)).join('')}`)
  const last = rows.slice(-20)
  let sameCount = 0, diffCount = 0, bothPresent = 0
  for (const r of last) {
    const ts = r.candle && r.candle.timestamp_ms
    const cells = keys.map(k => {
      const v = r.indicators && r.indicators[k] && r.indicators[k].candle_type_color
      return v == null ? '·' : String(v)
    })
    if (keys.length >= 2) {
      const a = cells[0], b = cells[1]
      if (a !== '·' && b !== '·') { bothPresent++; if (a === b) sameCount++; else diffCount++ }
    }
    console.log(`${String(ts).padEnd(16)}${cells.map(c => c.padEnd(22)).join('')}`)
  }
  if (keys.length >= 2) {
    console.log(`\n=== VERDICT (last 20 rows, both present in ${bothPresent}) ===`)
    console.log(`  identical candle_type_color: ${sameCount}`)
    console.log(`  different candle_type_color: ${diffCount}`)
    console.log(diffCount > 0
      ? '  → The FEED sends DIFFERENT ids for SCMR vs SCMR-INV (inverse data exists).'
      : '  → The FEED sends the SAME ids for both (the two indicators are identical on the wire).')
  }

  cleanup(client, off, sid)
}

function cleanup(client, off, sid) {
  try { if (off) off() } catch (_) { /* noop */ }
  try { if (sid) client.unsubscribe(sid) } catch (_) { /* noop */ }
  setTimeout(() => { try { client.close() } catch (_) { /* noop */ } process.exit(process.exitCode || 0) }, 200)
}

main().catch(e => { console.error('✗', e.message); process.exit(1) })
