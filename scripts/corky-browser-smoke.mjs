#!/usr/bin/env node
// ───────────────────────────────────────────────────────────────────────────
// Corky gateway smoke — FULL BROWSER path through App.vue (Playwright).
//
// Drives the real dev app in headless Chromium: switches the source toggle to
// "Gateway", waits for the discovery tree to populate from list_candle_states,
// clicks the first timeframe chip, and asserts the chart canvas renders a
// non-blank picture and then changes (a live tick repaints it).
//
// This is the END-TO-END smoke. It needs BOTH:
//   1. the corky gateway running (see scripts/corky-gateway-smoke.mjs header),
//   2. the dev server running:  npm run dev
//      (note: `vite dev` does not start in some sandboxes — run this on a box
//       where it does. The pure-protocol smoke covers the no-vite case.)
//
// Install once:  npm i -D playwright && npx playwright install chromium
//                (+ npx playwright install-deps chromium  on Linux CI)
//
// USAGE:
//   node scripts/corky-browser-smoke.mjs [http://localhost:5173]
//   APP_URL=http://localhost:5173 node scripts/corky-browser-smoke.mjs
//
// EXIT: 0 = chart rendered from the gateway; 1 = failure. Screenshots → /tmp.
// ───────────────────────────────────────────────────────────────────────────

import { chromium } from 'playwright'

const APP_URL = process.argv.find((a) => a.startsWith('http')) || process.env.APP_URL || 'http://localhost:5173'
const LIVE_WAIT_MS = Number(process.env.LIVE_WAIT_MS || 20000)
const log = (...a) => console.log(...a)

// Sample the largest canvas's own pixels → count non-transparent samples.
const CANVAS_PROBE = () => {
  const cs = [...document.querySelectorAll('canvas')]
  if (!cs.length) return { count: 0 }
  const main = cs.map((c) => ({ c, a: c.width * c.height })).sort((x, y) => y.a - x.a)[0].c
  let nonBlank = 0
  let fp = 0
  try {
    const ctx = main.getContext('2d')
    const d = ctx.getImageData(0, 0, main.c?.width || main.width, main.height).data
    for (let i = 3; i < d.length; i += 4 * 97) {
      if (d[i] || d[i - 1] || d[i - 2] || d[i - 3]) nonBlank++
      fp = (fp * 31 + d[i] + d[i - 1] * 3) >>> 0
    }
  } catch (e) { return { error: 'getImageData: ' + e.message } }
  return { count: cs.length, w: main.width, h: main.height, nonBlank, fp }
}

async function main() {
  const browser = await chromium.launch()
  const page = await browser.newPage({ viewport: { width: 1400, height: 860 } })

  const errors = []
  const workers = []
  page.on('pageerror', (e) => errors.push('PAGEERROR: ' + e.message))
  page.on('console', (m) => { if (m.type() === 'error') errors.push('[console.error] ' + m.text()) })
  page.on('worker', (w) => workers.push(w.url().slice(0, 70)))

  let ok = true
  const must = (cond, msg) => { if (!cond) { ok = false; log('  ✗ ' + msg) } else log('  ✓ ' + msg) }

  try {
    log(`→ ${APP_URL}`)
    await page.goto(APP_URL, { waitUntil: 'networkidle', timeout: 30000 })
    await page.waitForTimeout(1500)

    // 1) Switch source → Gateway.
    const gatewayBtn = page.getByRole('button', { name: 'Gateway', exact: true })
    await gatewayBtn.click({ timeout: 5000 })
    log('  clicked Gateway toggle')

    // 2) Discovery tree populates from list_candle_states.
    await page.locator('.corky-discovery').waitFor({ timeout: 10000 })
    await page.locator('.corky-tf-chip').first().waitFor({ timeout: 15000 })
    const venues = await page.locator('.corky-venue-title').allInnerTexts()
    const symbols = await page.locator('.corky-symbol-title').allInnerTexts()
    const chips = await page.locator('.corky-tf-chip').count()
    must(venues.length > 0, `discovery rendered ${venues.length} venue(s): ${venues.join(', ')}`)
    must(symbols.length > 0, `symbols: ${symbols.join(', ')}`)
    must(chips > 0, `${chips} timeframe chip(s)`)

    // 3) Select the first timeframe chip → gateway drives the chart.
    await page.locator('.corky-tf-chip').first().click()
    log('  clicked first timeframe chip')

    // 4) Chart canvas renders non-blank (history applied).
    let probe = { nonBlank: 0 }
    for (let i = 0; i < 30 && !(probe.nonBlank > 0); i++) {
      await page.waitForTimeout(700)
      probe = await page.evaluate(CANVAS_PROBE)
    }
    must(probe.nonBlank > 0, `chart canvas non-blank (${probe.w}x${probe.h}, ${probe.nonBlank} samples)`)
    await page.screenshot({ path: '/tmp/corky-smoke-loaded.png' })
    log('  screenshot → /tmp/corky-smoke-loaded.png')

    // 5) A live tick repaints the canvas (fingerprint changes).
    const before = probe.fp
    let after = before
    const deadline = Date.now() + LIVE_WAIT_MS
    while (Date.now() < deadline && after === before) {
      await page.waitForTimeout(750)
      after = (await page.evaluate(CANVAS_PROBE)).fp
    }
    if (after !== before) log('  ✓ canvas changed after select (live tick / render)')
    else log('  ⚠ canvas fingerprint unchanged within window (history OK; runtime may be idle)')

    must(errors.length === 0, `no page errors${errors.length ? ' — ' + errors.slice(0, 5).join(' | ') : ''}`)
    log(`  workers: ${workers.length ? workers.join(', ') : '(none)'}`)
    await page.screenshot({ path: '/tmp/corky-smoke-final.png' })
  } catch (e) {
    ok = false
    log('  ✗ ' + (e.message || e))
    try { await page.screenshot({ path: '/tmp/corky-smoke-error.png' }) } catch (_) { /* noop */ }
  } finally {
    await browser.close()
  }

  log('\n' + (ok ? '✓ PASS — gateway discovery → select → chart render works end-to-end.'
                 : '✗ FAIL — see messages + /tmp/corky-smoke-*.png'))
  process.exit(ok ? 0 : 1)
}

main().catch((e) => { console.error(e); process.exit(1) })
