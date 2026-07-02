// Phase 1 (new-contract) transforms for the strategy-runtime gateway, driven by
// BOTH the new-contract fixtures (examples/*.event.json — wallet_allocations[],
// runtime.tickers[], dependencies[], lineage variants) AND the live gateway
// fixtures (live_*.json — mid-migration: no wallet_allocations, so the FALLBACK
// path renders). Pins: the wallet→ticker allocation tree (new + legacy-tagged),
// the ticker status model (every status incl. entering/adoption_required/unknown
// + duration source + missing-timing→no-duration), the order blocker, lineage
// classification, process grouping, and dependency normalization. Money/quantity
// stays a decimal STRING throughout (never float-parsed).
import { describe, it, expect } from 'vitest'
import {
  buildWalletAllocationTree,
  classifyTickerStatus, fmtDuration,
  orderBlocker, classifyLineage,
  groupRuntimesByProcess, normalizeDependencies,
  strategyTickerControlActions,
} from '../../src/helpers/feed/corky-strategy-transforms.js'

import uxContract from '../fixtures/corky/strategy/examples/strategy-runtimes-ux-contract.event.json'
import lineageStates from '../fixtures/corky/strategy/examples/strategy-runtimes-lineage-states.event.json'
import liveRuntimeFx from '../fixtures/corky/strategy/live_get_strategy_runtime.json'
import liveRuntimesFx from '../fixtures/corky/strategy/live_list_strategy_runtimes.json'
import oldRuntimesFx from '../fixtures/corky/strategy/list_strategy_runtimes.json'

// new-contract runtimes: [0] verified/live (wallet_allocations), [1] mismatch/degraded (no wallet_allocations)
const NEW_LIVE = uxContract.event.runtimes[0]
const NEW_MATRIX = uxContract.event.runtimes[1]
// the runtime `generated_at_ms` is the as_of clock the reference transcript used
const AS_OF = NEW_LIVE.generated_at_ms   // 1782953400000
const LIVE_FALLBACK = liveRuntimeFx.event.runtime   // no wallet_allocations → legacy tree

const tickerBy = (rt, id) => rt.tickers.find((t) => t.ticker_id === id)
const allocBy = (rt, id) => rt.ticker_allocations.find((t) => t.ticker_id === id)

// ── wallet → strategy → ticker allocation tree ────────────────────────────────
describe('buildWalletAllocationTree — new wallet_allocations[] path', () => {
  it('nests server-computed allocation VERBATIM (no float math, no currency inference)', () => {
    const tree = buildWalletAllocationTree(NEW_LIVE)
    expect(tree.legacy).toBe(false)
    expect(tree.wallets).toHaveLength(1)
    const w = tree.wallets[0]
    expect(w).toMatchObject({
      account_id: 'primary-account', wallet_type: 'exchange', currency: 'TESTUSD', class: 'exchange',
      observed_balance: '9800', observed_available: '9775',
      allocated_to_strategy: '9800', unallocated_available: '0', legacy: false,
    })
    // server-computed allocation is a VERBATIM string — never Number()-parsed
    expect(typeof w.allocated_to_strategy).toBe('string')
    expect(w.ticker_ids).toEqual(['BITFINEX:tTESTADA:TESTUSD', 'BITFINEX:tTESTBTC:TESTUSD'])
    // nested ticker rows pass through untouched (decimal strings intact)
    expect(w.tickers).toHaveLength(2)
    expect(w.tickers[0].status).toBe('waiting')
    expect(w.tickers[1]).toMatchObject({ status: 'long', position_avg_price: '60000', unrealized_pnl: '2.40' })
  })
})

describe('buildWalletAllocationTree — legacy fallback (wallet_allocations ABSENT)', () => {
  it('synthesizes ONE legacy wallet from the flat allocation_* pool + ticker_allocations[]', () => {
    const tree = buildWalletAllocationTree(LIVE_FALLBACK)
    expect(tree.legacy).toBe(true)
    expect(tree.wallets).toHaveLength(1)
    const w = tree.wallets[0]
    expect(w.legacy).toBe(true)
    expect(w).toMatchObject({
      account_id: 'primary-account', wallet_type: 'exchange', currency: 'TESTUSD', class: null,
      observed_balance: '8000.000330571827200000000000',
      observed_available: '8000.000330571827200000000000',
      unallocated_available: '0.000000001827200000000000',
    })
    // the flat shape does NOT publish allocated_to_strategy → never inferred
    expect(w.allocated_to_strategy).toBeNull()
    // long-precision decimals survive verbatim
    expect(typeof w.observed_balance).toBe('string')
    expect(w.ticker_ids).toEqual(['BITFINEX:tTESTADA:TESTUSD', 'BITFINEX:tTESTBTC:TESTUSD'])
    expect(w.tickers).toHaveLength(2)
  })

  it('falls back for a partial pool (no observed balances) but with ticker_allocations', () => {
    const tree = buildWalletAllocationTree(NEW_MATRIX)   // mismatch runtime: no wallet_allocations
    expect(tree.legacy).toBe(true)
    const w = tree.wallets[0]
    expect(w).toMatchObject({ currency: 'TESTUSD', wallet_type: 'exchange', class: null, allocated_to_strategy: null })
    expect(w.observed_balance).toBeNull()
    expect(w.tickers.map((t) => t.status)).toEqual(['short', 'paused', 'bust_locked', 'degraded'])
  })

  it('returns an empty legacy tree when there is no allocation data at all', () => {
    expect(buildWalletAllocationTree({})).toEqual({ legacy: true, wallets: [] })
    expect(buildWalletAllocationTree(null)).toEqual({ legacy: true, wallets: [] })
  })
})

// ── ticker status model (field-map + ticker-status render transcript) ─────────
describe('classifyTickerStatus — matches the reference ticker-status transcript', () => {
  it('waiting → muted-grey, duration from status_since_ms', () => {
    const t = tickerBy(NEW_LIVE, 'BITFINEX:tTESTADA:TESTUSD')
    expect(classifyTickerStatus(t.status, t, AS_OF)).toMatchObject({
      status: 'waiting', style: 'muted-grey', attention: false, position: false,
      durationSource: 'status_since_ms', durationMs: 1260000, label: 'waiting for 21m',
      reason: 'no entry signal',
    })
  })

  it('long → positive-green, duration from position_opened_at_ms', () => {
    const t = tickerBy(NEW_LIVE, 'BITFINEX:tTESTBTC:TESTUSD')
    expect(classifyTickerStatus(t.status, t, AS_OF)).toMatchObject({
      status: 'long', style: 'positive-green', position: true, attention: false,
      durationSource: 'position_opened_at_ms', durationMs: 1140000, label: 'long for 19m',
    })
  })

  it('short → short-distinct (distinct from long), duration from position_opened_at_ms', () => {
    const t = allocBy(NEW_MATRIX, 'BITFINEX:tTESTXLM:TESTUSD')
    expect(classifyTickerStatus(t.status, t, AS_OF)).toMatchObject({
      status: 'short', style: 'short-distinct', position: true,
      durationSource: 'position_opened_at_ms', durationMs: 3000000, label: 'short for 50m',
    })
  })

  it('paused / degraded → attention, duration from status_since_ms', () => {
    const paused = allocBy(NEW_MATRIX, 'BITFINEX:tTESTDOT:TESTUSD')
    expect(classifyTickerStatus(paused.status, paused, AS_OF)).toMatchObject({
      status: 'paused', style: 'attention', attention: true, durationMs: 2400000, label: 'paused for 40m',
      reason: 'operator paused before repair',
    })
    const degraded = allocBy(NEW_MATRIX, 'BITFINEX:tTESTLTC:TESTUSD')
    expect(classifyTickerStatus(degraded.status, degraded, AS_OF)).toMatchObject({
      status: 'degraded', style: 'attention', attention: true, durationMs: 1500000, label: 'degraded for 25m',
    })
  })

  it('bust_locked → lockout style (attention family) with the lockout reason surfaced', () => {
    const t = allocBy(NEW_MATRIX, 'BITFINEX:tTESTSOL:TESTUSD')
    const c = classifyTickerStatus(t.status, t, AS_OF)
    expect(c).toMatchObject({
      status: 'bust_locked', style: 'lockout', attention: true, lockout: true,
      durationSource: 'status_since_ms', durationMs: 1800000, label: 'bust_locked for 30m',
      reason: 'ticker claim exhausted', lockoutReason: 'requires manual reapproval',
    })
  })

  it("'entering' → transitional style (the live mid-migration status)", () => {
    const t = tickerBy(LIVE_FALLBACK, 'BITFINEX:tTESTADA:TESTUSD')
    expect(t.status).toBe('entering')
    const c = classifyTickerStatus(t.status, t, t.status_since_ms + 60_000)
    expect(c).toMatchObject({ status: 'entering', style: 'transitional', known: true, attention: false })
    expect(c.label).toBe('entering for 1m')
  })

  it("'adoption_required' → attention with its reason (adoption-only rows may carry no allocation/orders)", () => {
    const c = classifyTickerStatus('adoption_required',
      { status_since_ms: AS_OF - 120_000, status_reason: 'operator adoption required' }, AS_OF)
    expect(c).toMatchObject({
      status: 'adoption_required', style: 'attention', attention: true,
      durationMs: 120_000, label: 'adoption_required for 2m', reason: 'operator adoption required',
    })
  })

  it('unknown / missing status → neutral, never implies a trading state', () => {
    expect(classifyTickerStatus('mystery', {}, AS_OF)).toMatchObject({ known: false, style: 'neutral', status: 'mystery' })
    expect(classifyTickerStatus(null, {}, AS_OF)).toMatchObject({ known: false, style: 'neutral', status: 'unknown' })
  })

  it('OMITS the duration when the timing field is missing (never invents from wall-clock)', () => {
    const c = classifyTickerStatus('waiting', {}, AS_OF)
    expect(c.durationMs).toBeNull()
    expect(c.durationSource).toBeNull()
    expect(c.label).toBe('waiting')            // no "for <dur>"
  })

  it('long falls back to status_since_ms when position_opened_at_ms is absent', () => {
    const c = classifyTickerStatus('long', { status_since_ms: AS_OF - 300_000 }, AS_OF)
    expect(c).toMatchObject({ durationSource: 'status_since_ms', durationMs: 300_000, label: 'long for 5m' })
  })
})

describe('fmtDuration', () => {
  it('compact humanized units, dropping zero sub-units', () => {
    expect(fmtDuration(1260000)).toBe('21m')
    expect(fmtDuration(3_600_000)).toBe('1h')
    expect(fmtDuration(3_660_000)).toBe('1h 1m')
    expect(fmtDuration(90_000_000)).toBe('1d 1h')
    expect(fmtDuration(45_000)).toBe('45s')
    expect(fmtDuration(0)).toBe('0s')
  })
  it('null / negative / non-finite → empty string', () => {
    expect(fmtDuration(null)).toBe('')
    expect(fmtDuration(-5)).toBe('')
    expect(fmtDuration(undefined)).toBe('')
  })
})

// ── submitted-nonterminal order blocker ───────────────────────────────────────
describe('orderBlocker', () => {
  it('flags the runtime-level submitted-nonterminal blocker with its oldest ts', () => {
    expect(orderBlocker(NEW_LIVE)).toEqual({
      blocked: true, submittedNonterminal: 1, oldestSubmittedTsMs: 1782952200000,
    })
  })

  it('flags a per-ticker blocker (ADA) but not a clear ticker (BTC)', () => {
    const ada = NEW_LIVE.ticker_orders.find((t) => t.ticker_id === 'BITFINEX:tTESTADA:TESTUSD')
    const btc = NEW_LIVE.ticker_orders.find((t) => t.ticker_id === 'BITFINEX:tTESTBTC:TESTUSD')
    expect(orderBlocker(ada)).toMatchObject({ blocked: true, submittedNonterminal: 1, oldestSubmittedTsMs: 1782952200000 })
    expect(orderBlocker(btc)).toMatchObject({ blocked: false, submittedNonterminal: 0, oldestSubmittedTsMs: null })
  })

  it('a runtime with zero submitted-nonterminal orders is not blocked', () => {
    expect(orderBlocker(NEW_MATRIX)).toEqual({ blocked: false, submittedNonterminal: 0, oldestSubmittedTsMs: null })
    expect(orderBlocker(LIVE_FALLBACK)).toMatchObject({ blocked: false, submittedNonterminal: 0 })
  })

  it('tolerates null and the shorter oldest_submitted_ts_ms key', () => {
    expect(orderBlocker(null)).toEqual({ blocked: false, submittedNonterminal: 0, oldestSubmittedTsMs: null })
    expect(orderBlocker({ orders_submitted_nonterminal: 2, oldest_submitted_ts_ms: 5 }))
      .toEqual({ blocked: true, submittedNonterminal: 2, oldestSubmittedTsMs: 5 })
  })
})

// ── backtest lineage classification ───────────────────────────────────────────
describe('classifyLineage — only verified may read as running', () => {
  it('verified → running', () => {
    expect(classifyLineage('verified')).toMatchObject({ status: 'verified', tone: 'verified', running: true })
    expect(classifyLineage(NEW_LIVE.lineage_status)).toMatchObject({ status: 'verified', running: true })
  })

  it('mismatch + missing/unsupported artifact → attention, NEVER running', () => {
    expect(classifyLineage(NEW_MATRIX.lineage_status)).toMatchObject({ status: 'mismatch', tone: 'attention', running: false })
    const byId = Object.fromEntries(lineageStates.event.runtimes.map((r) => [r.runtime_id, r.lineage_status]))
    expect(classifyLineage(byId['strategy-runtime-lineage-artifact-missing']))
      .toMatchObject({ status: 'mismatch', tone: 'attention', running: false })
    expect(classifyLineage(byId['strategy-runtime-lineage-unsupported-artifact']))
      .toMatchObject({ status: 'mismatch', tone: 'attention', running: false })
  })

  it("'unknown' (older payload) → neutral unsupported, never verified/running; declared → pending", () => {
    expect(classifyLineage('unknown')).toMatchObject({ status: 'unknown', tone: 'neutral', running: false, known: true })
    expect(classifyLineage('declared')).toMatchObject({ status: 'unknown', tone: 'pending', running: false })
    expect(classifyLineage(null)).toMatchObject({ status: 'unknown', tone: 'neutral', running: false, known: false })
  })

  it('no non-verified lineage is ever running (mismatch/unknown integrity)', () => {
    for (const s of ['mismatch', 'artifact_missing', 'unsupported_artifact', 'unknown', 'declared', null, 'garbage']) {
      expect(classifyLineage(s).running).toBe(false)
      expect(classifyLineage(s).status).not.toBe('verified')
    }
  })
})

// ── process grouping ──────────────────────────────────────────────────────────
describe('groupRuntimesByProcess', () => {
  it('groups new-contract + live runtimes under corky-strategy-runtime', () => {
    const g = groupRuntimesByProcess(uxContract.event.runtimes)
    expect(g).toHaveLength(1)
    expect(g[0].process_kind).toBe('corky-strategy-runtime')
    expect(g[0].runtimes).toHaveLength(2)

    const gl = groupRuntimesByProcess(liveRuntimesFx.event.runtimes)
    expect(gl.map((x) => x.process_kind)).toEqual(['corky-strategy-runtime'])
    expect(gl[0].runtimes.map((r) => r.runtime_id)).toEqual(['strategy-runtime-main', 'v8-tail-repair-live-main'])
  })

  it('defaults a missing process_kind to corky-strategy-runtime (older list fixture)', () => {
    const g = groupRuntimesByProcess(oldRuntimesFx.event.runtimes)
    expect(g).toHaveLength(1)
    expect(g[0].process_kind).toBe('corky-strategy-runtime')
    expect(g[0].runtimes).toHaveLength(2)
  })

  it('keeps first-seen process order and preserves in-group order', () => {
    const g = groupRuntimesByProcess([
      { runtime_id: 'a', process_kind: 'x' },
      { runtime_id: 'b', process_kind: 'y' },
      { runtime_id: 'c', process_kind: 'x' },
      null,
    ])
    expect(g.map((x) => x.process_kind)).toEqual(['x', 'y'])
    expect(g[0].runtimes.map((r) => r.runtime_id)).toEqual(['a', 'c'])
    expect(g[1].runtimes.map((r) => r.runtime_id)).toEqual(['b'])
  })

  it('returns [] for empty / non-array input', () => {
    expect(groupRuntimesByProcess(undefined)).toEqual([])
    expect(groupRuntimesByProcess([])).toEqual([])
  })
})

// ── per-ticker direct-control actions ─────────────────────────────────────────
describe('strategyTickerControlActions — status + blocker → the offered control set', () => {
  const NO_BLOCK = { blocked: false, submittedNonterminal: 0 }
  const BLOCK = { blocked: true, submittedNonterminal: 1 }
  const kinds = (s, b) => strategyTickerControlActions(s, b).map((a) => a.kind)
  const intents = (s, b) => strategyTickerControlActions(s, b).map((a) => a.intent)

  it('running states (waiting/long/short/entering) → pause only', () => {
    for (const s of ['waiting', 'long', 'short', 'entering']) {
      expect(kinds(s, NO_BLOCK)).toEqual(['pause'])
      expect(intents(s, NO_BLOCK)).toEqual(['pause-ticker'])
    }
  })

  it('paused → resume; bust_locked / capital_shortfall → unlock (needs allocation)', () => {
    expect(kinds('paused', NO_BLOCK)).toEqual(['resume'])
    expect(intents('paused', NO_BLOCK)).toEqual(['resume-ticker'])
    for (const s of ['bust_locked', 'capital_shortfall']) {
      const a = strategyTickerControlActions(s, NO_BLOCK)
      expect(a.map((x) => x.kind)).toEqual(['unlock'])
      expect(a[0]).toMatchObject({ intent: 'unlock-ticker', allocation: true, reason: true })
    }
  })

  it('adoption_required → adopt (needs position_id)', () => {
    const a = strategyTickerControlActions('adoption_required', NO_BLOCK)
    expect(a.map((x) => x.kind)).toEqual(['adopt'])
    expect(a[0]).toMatchObject({ intent: 'adopt-position', position: true, reason: true })
  })

  it('a submitted-nonterminal blocker prepends cancel (highest priority) on top of the status action', () => {
    expect(kinds('long', BLOCK)).toEqual(['cancel', 'pause'])
    expect(intents('waiting', BLOCK)).toEqual(['cancel-ticker-orders', 'pause-ticker'])
    const cancel = strategyTickerControlActions('waiting', BLOCK)[0]
    expect(cancel).toMatchObject({ kind: 'cancel', intent: 'cancel-ticker-orders', reason: true, danger: true })
  })

  it('every offered action requires a visible operator reason', () => {
    for (const s of ['waiting', 'long', 'short', 'entering', 'paused', 'bust_locked', 'capital_shortfall', 'adoption_required']) {
      expect(strategyTickerControlActions(s, BLOCK).every((a) => a.reason === true)).toBe(true)
    }
  })

  it('capitalBlocked (unverified lineage) WITHHOLDS capital/position controls but keeps halt/safety ones', () => {
    // unlock (bust_locked) + adopt (adoption_required) are capital-committing → gone.
    expect(strategyTickerControlActions('bust_locked', NO_BLOCK, { capitalBlocked: true }).map((a) => a.kind)).toEqual([])
    expect(strategyTickerControlActions('adoption_required', NO_BLOCK, { capitalBlocked: true }).map((a) => a.kind)).toEqual([])
    // pause/resume/cancel are halt/safety → still available so an operator can STOP
    // a misbehaving unverified runtime.
    expect(strategyTickerControlActions('waiting', BLOCK, { capitalBlocked: true }).map((a) => a.kind)).toEqual(['cancel', 'pause'])
    expect(strategyTickerControlActions('paused', NO_BLOCK, { capitalBlocked: true }).map((a) => a.kind)).toEqual(['resume'])
    // capital actions carry the capital flag (drives the App-side CAPITAL_CONTROL_METHODS guard).
    expect(strategyTickerControlActions('bust_locked', NO_BLOCK)[0].capital).toBe(true)
  })

  it('degraded / unknown statuses expose only the blocker action (no invented pause)', () => {
    expect(kinds('degraded', NO_BLOCK)).toEqual([])
    expect(kinds('mystery', NO_BLOCK)).toEqual([])
    expect(kinds(null, NO_BLOCK)).toEqual([])
    expect(kinds('degraded', BLOCK)).toEqual(['cancel'])   // still cancel a stuck order
  })
})

// ── dependency normalization ──────────────────────────────────────────────────
describe('normalizeDependencies', () => {
  it('reads the new dependencies[] (public/private) verbatim', () => {
    expect(normalizeDependencies(NEW_LIVE)).toEqual([
      { kind: 'public', runtime_id: 'public-market-main', legacy: false },
      { kind: 'private', runtime_id: 'private-account-main', legacy: false },
    ])
  })

  it('falls back to target_public/private_runtime_id (older list fixture), tagged legacy', () => {
    const older = oldRuntimesFx.event.runtimes[0]
    expect('dependencies' in older).toBe(false)
    expect(normalizeDependencies(older)).toEqual([
      { kind: 'public', runtime_id: 'public-market-main', legacy: true },
      { kind: 'private', runtime_id: 'private-account-main', legacy: true },
    ])
  })

  it('accepts a raw dependencies array and keeps a missing runtime id as null', () => {
    expect(normalizeDependencies([{ kind: 'public', dependency_runtime_id: 'p' }, { kind: 'private' }])).toEqual([
      { kind: 'public', runtime_id: 'p', legacy: false },
      { kind: 'private', runtime_id: null, legacy: false },
    ])
  })

  it('returns [] when neither dependencies nor target ids are present', () => {
    expect(normalizeDependencies({})).toEqual([])
    expect(normalizeDependencies(null)).toEqual([])
  })
})
