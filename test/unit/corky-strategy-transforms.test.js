// Pure transforms for the read-only strategy-runtime gateway events, driven by
// the REAL saved fixtures (test/fixtures/corky/strategy/*.json). These pin
// decimal-string safety (money/qty pass through verbatim), the class-grouped
// wallets, strategy-status vs runtime-readiness classification, the
// overlay→marker grouping, the local-journal/dispatched order split, and the
// stale-approval check.
import { describe, it, expect } from 'vitest'
import {
  WALLET_CLASS_ORDER, groupWalletBalancesByClass,
  classifyStrategyStatus, classifyRuntimeReadiness,
  OVERLAY_KINDS, overlaysToMarkers,
  DISPATCHED_STATUS_KEYS, splitOrderStatusCounts,
  isApprovalStale, approvalStatus, fmtDecimal,
} from '../../src/helpers/feed/corky-strategy-transforms.js'

import runtimesFx from '../fixtures/corky/strategy/list_strategy_runtimes.json'
import runtimeFx from '../fixtures/corky/strategy/get_strategy_runtime.json'
import tickerAdaFx from '../fixtures/corky/strategy/get_strategy_ticker_ADA.json'
import tickerBtcFx from '../fixtures/corky/strategy/get_strategy_ticker_BTC.json'
import overlaysFx from '../fixtures/corky/strategy/get_strategy_chart_overlays_ADA_1m.json'

const liveRuntime = runtimesFx.event.runtimes.find((r) => r.runtime_id === 'v8-tail-repair-live-main')
const overlays = overlaysFx.event.overlays

// ── wallet balances grouped by class ──────────────────────────────────────────
describe('fmtDecimal — clean decimal display (never float-parses)', () => {
  it('drops unnecessary trailing precision', () => {
    expect(fmtDecimal('0.0000')).toBe('0')
    expect(fmtDecimal('1.2500')).toBe('1.25')
    expect(fmtDecimal('1617.080000')).toBe('1,617.08')
    expect(fmtDecimal('100.00')).toBe('100')
    expect(fmtDecimal('0.15624')).toBe('0.15624')
  })
  it('groups the integer part with thousands separators (opt-out via group:false)', () => {
    expect(fmtDecimal('10000')).toBe('10,000')
    expect(fmtDecimal('1234567.5')).toBe('1,234,567.5')
    expect(fmtDecimal('10000', { group: false })).toBe('10000')
  })
  it('handles negatives + strips redundant leading zeros', () => {
    expect(fmtDecimal('-5.50')).toBe('-5.5')
    expect(fmtDecimal('-0.0')).toBe('0')          // negative zero → 0
    expect(fmtDecimal('007.10')).toBe('7.1')
    expect(fmtDecimal('.5')).toBe('0.5')
  })
  it('preserves arbitrary precision — no float round-trip', () => {
    // a 28-digit price would lose precision under Number(); string ops keep it.
    expect(fmtDecimal('0.1234567890123456789012345678')).toBe('0.1234567890123456789012345678')
    expect(fmtDecimal('123456789012345678901234567890')).toBe('123,456,789,012,345,678,901,234,567,890')
  })
  it('null / empty → dash; non-numeric values pass through verbatim', () => {
    expect(fmtDecimal(null)).toBe('—')
    expect(fmtDecimal('')).toBe('—')
    expect(fmtDecimal('  ')).toBe('—')
    expect(fmtDecimal(undefined, { dash: 'n/a' })).toBe('n/a')
    expect(fmtDecimal('waiting')).toBe('waiting')     // label → untouched
    expect(fmtDecimal('1-2')).toBe('1-2')             // range → untouched
  })
})

describe('groupWalletBalancesByClass', () => {
  it('groups the live runtime wallets by class in canonical order, verbatim', () => {
    const groups = groupWalletBalancesByClass(liveRuntime.auth_wallet_balances)
    // fixture has exchange×4, margin×3, funding×1 (no derivative/other)
    expect(groups.map((g) => g.class)).toEqual(['exchange', 'margin', 'funding'])
    const byClass = Object.fromEntries(groups.map((g) => [g.class, g.wallets]))
    expect(byClass.exchange).toHaveLength(4)
    expect(byClass.margin).toHaveLength(3)
    expect(byClass.funding).toHaveLength(1)
    // canonical order is exchange < margin < funding (< derivative < other)
    expect(WALLET_CLASS_ORDER.indexOf('exchange')).toBeLessThan(WALLET_CLASS_ORDER.indexOf('margin'))

    // decimals pass through VERBATIM (never float-parsed)
    const usd = byClass.exchange.find((w) => w.currency === 'TESTUSD')
    expect(usd.balance).toBe('7989.6614248')
    expect(usd.available).toBe('7989.6614248')
    expect(typeof usd.balance).toBe('string')
  })

  it('folds an unknown/missing class into `other` and drops empty groups', () => {
    const groups = groupWalletBalancesByClass([
      { class: 'exchange', currency: 'A', balance: '1' },
      { class: 'derivative', currency: 'B', balance: '2' },
      { class: 'weird', currency: 'C', balance: '3' },
      { currency: 'D', balance: '4' },              // no class → other
      null,                                          // skipped
    ])
    expect(groups.map((g) => g.class)).toEqual(['exchange', 'derivative', 'other'])
    const other = groups.find((g) => g.class === 'other').wallets
    expect(other.map((w) => w.currency)).toEqual(['C', 'D'])
  })

  it('returns [] for empty / non-array input', () => {
    expect(groupWalletBalancesByClass(undefined)).toEqual([])
    expect(groupWalletBalancesByClass([])).toEqual([])
  })
})

// ── strategy status classification (distinct from runtime readiness) ──────────
describe('classifyStrategyStatus', () => {
  it('classifies every required strategy status', () => {
    expect(classifyStrategyStatus('waiting')).toMatchObject({ status: 'waiting', known: true, group: 'flat', isPosition: false, isHalted: false })
    expect(classifyStrategyStatus('long')).toMatchObject({ status: 'long', known: true, group: 'position', tone: 'long', isPosition: true, isHalted: false })
    expect(classifyStrategyStatus('short')).toMatchObject({ status: 'short', known: true, group: 'position', tone: 'short', isPosition: true })
    expect(classifyStrategyStatus('paused')).toMatchObject({ status: 'paused', known: true, group: 'halted', isHalted: true })
    expect(classifyStrategyStatus('degraded')).toMatchObject({ status: 'degraded', known: true, group: 'alert', tone: 'warn' })
    expect(classifyStrategyStatus('bust_locked')).toMatchObject({ status: 'bust_locked', known: true, group: 'halted', tone: 'critical', isHalted: true })
    expect(classifyStrategyStatus('capital_shortfall')).toMatchObject({ status: 'capital_shortfall', known: true, group: 'alert', tone: 'critical' })
  })

  it('is case-insensitive and trims', () => {
    expect(classifyStrategyStatus('  LONG ')).toMatchObject({ status: 'long', known: true, isPosition: true })
  })

  it('marks an unknown / null status as known:false (e.g. runtime-level `active`)', () => {
    expect(classifyStrategyStatus('active')).toMatchObject({ known: false, status: 'active', tone: 'unknown', group: 'unknown' })
    expect(classifyStrategyStatus(null)).toMatchObject({ known: false, status: 'unknown' })
    expect(classifyStrategyStatus(undefined)).toMatchObject({ known: false, status: 'unknown' })
  })

  it('matches the live runtime ticker_allocations statuses (waiting + long)', () => {
    const statuses = liveRuntime.ticker_allocations.map((t) => classifyStrategyStatus(t.status))
    expect(statuses.map((s) => s.status)).toEqual(['waiting', 'long'])
    expect(statuses.every((s) => s.known)).toBe(true)
  })
})

describe('classifyRuntimeReadiness (separate axis from strategy status)', () => {
  it('classifies Ready vs not-ready vs unknown', () => {
    expect(classifyRuntimeReadiness('Ready')).toEqual({ state: 'Ready', ready: true, tone: 'ready' })
    expect(classifyRuntimeReadiness('Initializing')).toEqual({ state: 'Initializing', ready: false, tone: 'pending' })
    expect(classifyRuntimeReadiness(null)).toEqual({ state: 'unknown', ready: false, tone: 'unknown' })
  })

  it('the live runtime fixture is Ready but its ticker allocation is waiting — never conflated', () => {
    expect(classifyRuntimeReadiness(liveRuntime.state).ready).toBe(true)
    expect(classifyStrategyStatus(liveRuntime.ticker_allocations[0].status).status).toBe('waiting')
  })
})

// ── overlays → markers, grouped by kind ───────────────────────────────────────
describe('overlaysToMarkers', () => {
  it('groups the ADA overlays by kind (decision/fill/order/allocation) preserving fields', () => {
    const g = overlaysToMarkers(overlays)
    // fixture: fill×2, order×1, decision×47, allocation×1 (51 total)
    expect(g.decision).toHaveLength(47)
    expect(g.fill).toHaveLength(2)
    expect(g.order).toHaveLength(1)
    expect(g.allocation).toHaveLength(1)
    expect(g.other).toHaveLength(0)
    expect(g.control).toHaveLength(0)
    expect(OVERLAY_KINDS).toEqual(['decision', 'fill', 'order', 'allocation', 'control'])

    // timestamp_ms + label + status preserved; label (with money) stays verbatim
    const fill0 = g.fill[0]
    expect(fill0.timestamp_ms).toBe(1782921307806)
    expect(fill0.status).toBe('filled')
    expect(fill0.label).toBe('filled buy 64.84881728 @ 0.15624 trade 1943320037; fee 0 USD')
    expect(fill0.decision_id).toMatch(/target-state-catch-up/)
    expect(fill0.provenance).toMatchObject({
      source: overlays.find((row) => row.timestamp_ms === fill0.timestamp_ms).source,
      decision_id: fill0.decision_id,
    })
    expect(fill0.raw).toEqual(overlays.find((row) => row.timestamp_ms === fill0.timestamp_ms))

    // allocation marker carries the strategy status verbatim
    expect(g.allocation[0]).toMatchObject({ kind: 'allocation', status: 'waiting', label: 'waiting: fill_attributed' })
    // order marker keeps its order_status_counts map
    expect(g.order[0].order_status_counts).toMatchObject({ filled: 2 })
  })

  it('skips rows without timestamp_ms and folds unknown kinds into `other`', () => {
    const g = overlaysToMarkers([
      { kind: 'fill', timestamp_ms: 1, label: 'x', status: 'filled' },
      { kind: 'mystery', timestamp_ms: 2, label: 'y', status: 'z' },
      { kind: 'decision' /* no timestamp */, label: 'skip' },
      null,
    ])
    expect(g.fill).toHaveLength(1)
    expect(g.other).toHaveLength(1)
    expect(g.other[0].kind).toBe('mystery')
    expect(g.decision).toHaveLength(0)
  })

  it('returns empty buckets for empty / non-array input', () => {
    const g = overlaysToMarkers(undefined)
    expect(g).toEqual({ decision: [], fill: [], order: [], allocation: [], control: [], other: [] })
  })

  it('buckets a kind:"control" marker into `control` (the gateway shape) — not dropped to `other`', () => {
    const g = overlaysToMarkers([{ kind: 'control', source: 'strategy_control_audit', timestamp_ms: 9, label: 'manual pause' }])
    expect(g.control).toHaveLength(1)
    expect(g.control[0].label).toBe('manual pause')
    expect(g.other).toHaveLength(0)
  })
})

// ── order-status split: local journal vs dispatched ──────────────────────────
describe('splitOrderStatusCounts', () => {
  it('keeps queued as LOCAL-JOURNAL-ONLY, distinct from dispatched/reconciled', () => {
    const s = splitOrderStatusCounts({
      queued: 3, sent: 1, accepted: 1, open: 2, partially_filled: 0, filled: 4, canceled: 1, rejected: 1,
    })
    expect(s.local).toEqual({ queued: 3 })
    expect(s.localTotal).toBe(3)
    expect(s.dispatched).toEqual({ sent: 1, accepted: 1, open: 2, partially_filled: 0, filled: 4, canceled: 1, rejected: 1 })
    expect(s.dispatchedTotal).toBe(10)
    expect(s.total).toBe(13)
    expect(DISPATCHED_STATUS_KEYS).not.toContain('queued')
  })

  it('splits the live runtime order_status_counts (all filled, none queued)', () => {
    const s = splitOrderStatusCounts(liveRuntime.order_status_counts)
    expect(s.local.queued).toBe(0)
    expect(s.dispatched.filled).toBe(5)
    expect(s.dispatchedTotal).toBe(5)
    expect(s.total).toBe(5)
  })

  it('defaults missing fields to 0 and tolerates null input', () => {
    expect(splitOrderStatusCounts(null)).toEqual({
      local: { queued: 0 },
      dispatched: { sent: 0, accepted: 0, open: 0, partially_filled: 0, filled: 0, canceled: 0, rejected: 0 },
      localTotal: 0, dispatchedTotal: 0, total: 0,
    })
  })
})

// ── live-operator approval ────────────────────────────────────────────────────
describe('approvalStatus / isApprovalStale', () => {
  const approval = runtimeFx.event.runtime.live_operator_approval  // expires_at_ms 1782950129878

  it('surfaces expires_at_ms + max_order_notional (decimal string) and NOT-stale when in the future', () => {
    const now = approval.expires_at_ms - 1000
    const s = approvalStatus(approval, now)
    expect(s.present).toBe(true)
    expect(s.stale).toBe(false)
    expect(s.expiresAtMs).toBe(1782950129878)
    expect(s.maxOrderNotional).toBe('12')        // VERBATIM decimal string
    expect(typeof s.maxOrderNotional).toBe('string')
    expect(s.tradeTimeframe).toBe('1m')
    expect(s.contextTimeframes).toEqual(['1D'])
    expect(s.symbols).toEqual(['tTESTADA:TESTUSD', 'tTESTBTC:TESTUSD'])
  })

  it('flags a stale approval when expires_at_ms < now', () => {
    const now = approval.expires_at_ms + 1
    expect(isApprovalStale(approval, now)).toBe(true)
    expect(approvalStatus(approval, now).stale).toBe(true)
  })

  it('treats a missing approval / missing expiry as present:false / not-stale', () => {
    expect(approvalStatus(null).present).toBe(false)
    expect(approvalStatus(null).stale).toBe(false)
    expect(isApprovalStale(null)).toBe(false)
    expect(isApprovalStale({})).toBe(false)                 // no expires_at_ms
  })
})

// ── decimal-string safety across the ticker fixtures ──────────────────────────
describe('decimal safety (no float parse)', () => {
  it('ticker allocation money/qty fields remain long decimal strings', () => {
    const ada = tickerAdaFx.event.ticker.allocation
    const btc = tickerBtcFx.event.ticker.allocation
    expect(ada.realized_pnl).toBe('-0.2211344669248')
    expect(ada.position_quantity).toBe('0.00000000')
    // 28-significant-digit values would lose precision if Number()-parsed
    expect(btc.locked_margin).toBe('10.111561566751462732129229204')
    expect(btc.position_avg_price).toBe('60281.158738234545917069447978')
    expect(Number(btc.position_avg_price).toString()).not.toBe(btc.position_avg_price)  // proves parsing would corrupt it
  })
})
