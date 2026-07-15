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
    const firstSymbol = page.locator('.corky-symbol-title:visible').first()
    await firstSymbol.waitFor({ timeout: 15000 })
    await firstSymbol.click()
    const firstTimeframe = page.locator('.corky-tf-chip:visible').first()
    await firstTimeframe.waitFor({ timeout: 15000 })
    const venues = await page.locator('.corky-venue-name').allInnerTexts()
    const symbols = await page.locator('.corky-symbol-title').allInnerTexts()
    const chips = await page.locator('.corky-tf-chip').count()
    must(venues.length > 0, `discovery rendered ${venues.length} venue(s): ${venues.join(', ')}`)
    must(symbols.length > 0, `symbols: ${symbols.join(', ')}`)
    must(chips > 0, `${chips} timeframe chip(s)`)

    // 3) Select the first timeframe chip → gateway drives the chart.
    await firstTimeframe.click()
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

    // 6) Strategy is a catalog. Open one running strategy, verify the contextual
    // `S: <name>` tab, then inspect its complete task navigation. This is a
    // read-only smoke: it never opens or submits an administrative mutation.
    const strategyTab = page.locator('.pd-tab').filter({ hasText: 'Strategy' }).first()
    await strategyTab.click()
    await page.locator('.strategy-list').waitFor({ timeout: 15000 })
    const strategyRows = page.locator('.strategy-list-row')
    const strategyCount = await strategyRows.count()
    must(strategyCount > 0, `Strategy catalog rendered ${strategyCount} running strategy row(s)`)
    if (!strategyCount) throw new Error('no running strategy available for contextual workspace smoke')
    const contradictoryStrategyRows = await strategyRows.evaluateAll((rows) => rows
      .map((row) => row.textContent || '')
      .filter((text) => /Healthy/.test(text) && /(stale|disconnected)/i.test(text)))
    must(contradictoryStrategyRows.length === 0,
      'Strategy catalog never presents stale/disconnected status as currently Healthy')
    // Prefer the strategy with a known ledger-backed balance history when it is
    // present; otherwise retain the catalog smoke's first-row fallback.
    const emaRows = strategyRows.filter({ hasText: /EMA Regime Breakout/i })
    const strategyRow = (await emaRows.count()) ? emaRows.first() : strategyRows.first()
    await strategyRow.click()
    const contextualStrategyTab = page.locator('.pd-tab-strategy').first()
    await contextualStrategyTab.waitFor({ timeout: 15000 })
    must((await contextualStrategyTab.innerText()).trim().startsWith('S:'),
      `contextual strategy tab: ${(await contextualStrategyTab.innerText()).trim()}`)
    await page.locator('.sr-tabs').waitFor({ timeout: 15000 })
    const strategyTasks = await page.locator('.sr-tab').allInnerTexts()
    must(strategyTasks.join('|') === 'Overview|Tickers|Activity|Capital|Orders|Configuration|Administration',
      `Strategy workspace task tabs: ${strategyTasks.join(', ')}`)
    const strategyStateVisible = await page.locator('.sr-status-banner, .sr-empty').first().isVisible()
    must(strategyStateVisible, 'Strategy workspace rendered a runtime or explicit empty state')
    await page.screenshot({ path: '/tmp/corky-smoke-strategy.png' })
    log('  screenshot → /tmp/corky-smoke-strategy.png')

    // 7) Balance history is another native TradingVue/DataCube chart. The old
    // bespoke `.sbc` SVG renderer must not exist; the established canvas,
    // axes/range machinery, and the right-aligned timeframe selector must.
    await page.getByRole('button', { name: 'View balance over time', exact: true }).click()
    const activeChartTab = page.locator('.ctab.active')
    await activeChartTab.waitFor({ timeout: 15000 })
    must((await activeChartTab.innerText()).includes('Balance ·'),
      `balance chart tab opened: ${(await activeChartTab.innerText()).trim()}`)
    await page.locator('.strategy-balance-state').waitFor({ state: 'hidden', timeout: 15000 })
    const balanceProbe = await page.evaluate(CANVAS_PROBE)
    must(balanceProbe.nonBlank > 0,
      `native balance chart canvas rendered (${balanceProbe.w}x${balanceProbe.h}, ${balanceProbe.nonBlank} samples)`)
    must(await page.locator('.chart-wrapper > .trading-vue').count() === 1,
      'balance tab uses the shared TradingVue component')
    must(await page.locator('.sbc, .sbc-svg').count() === 0,
      'no bespoke strategy-balance SVG renderer remains')
    must(await page.locator('.balance-timeframe-control select').isVisible(),
      'balance timeframe selector remains available')
    await page.screenshot({ path: '/tmp/corky-smoke-balance.png' })
    log('  screenshot → /tmp/corky-smoke-balance.png')

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
