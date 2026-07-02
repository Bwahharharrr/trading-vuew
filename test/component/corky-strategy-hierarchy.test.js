// @vitest-environment jsdom
//
// CorkyStrategyPanel — Phase 2 HIERARCHY + DRILLDOWN gate. Drives the panel with
// BOTH the new-contract fixture (examples/strategy-runtimes-ux-contract.event.json
// — process→runtime→ticker+dependency hierarchy, server-computed wallet_allocations
// tree, the full ticker-status matrix, and verified-vs-mismatch lineage) AND the
// live gateway fixture (live_get_strategy_runtime.json — mid-migration: NO
// wallet_allocations, so the allocation tree renders via the LEGACY / INFERRED
// fallback and is clearly marked as such).
//
// Contract pins: process grouping + ready/degraded roll-up, selectable runtime
// rows opening the drilldown, ticker status via classifyTickerStatus (style +
// duration-only-when-timing), the submitted-order blocker overlay, dependency
// rows, lineage distinctness (verified may read running; mismatch/unknown must
// NOT), the wallet→strategy→ticker allocation tree from buildWalletAllocationTree
// (server-computed vs legacy), and decimal-string precision preserved throughout.
import { test, expect, describe } from 'vitest'
import { mount } from '@vue/test-utils'
import CorkyStrategyPanel from '../../src/components/feed/CorkyStrategyPanel.vue'

import uxContractFx from '../fixtures/corky/strategy/examples/strategy-runtimes-ux-contract.event.json'
import lineageStatesFx from '../fixtures/corky/strategy/examples/strategy-runtimes-lineage-states.event.json'
import liveRuntimeFx from '../fixtures/corky/strategy/live_get_strategy_runtime.json'

const UX_RUNTIMES = uxContractFx.event.runtimes
const UX_LIVE = UX_RUNTIMES[0]        // verified / Ready / wallet_allocations present
const UX_MATRIX = UX_RUNTIMES[1]      // mismatch / Degraded / no wallet_allocations
const AS_OF = UX_LIVE.generated_at_ms // 1782953400000 — the transcript's as_of clock

const LIVE_RUNTIME = liveRuntimeFx.event.runtime   // single runtime, no wallet_allocations

async function tab(w, label) {
    const btn = w.findAll('.sr-tab').find((b) => b.text() === label)
    await btn.trigger('click')
    return w
}
const tickerRowFor = (w, needle) => w.findAll('.sr-ticker').find((r) => r.text().includes(needle))

// ═══════════════════════════════════════════════════════════════════════════
// NEW-CONTRACT FIXTURE — hierarchy + statuses + lineage + wallet tree
// ═══════════════════════════════════════════════════════════════════════════
describe('new-contract (strategy-runtimes-ux-contract) — process → runtime hierarchy', () => {
    const mountUx = (props = {}) =>
        mount(CorkyStrategyPanel, { props: { runtimes: UX_RUNTIMES, now: AS_OF, ...props } })

    test('groups runtimes under the corky-strategy-runtime process with a ready/degraded roll-up', () => {
        const head = mountUx().find('.sr-proc-head')
        expect(head.text()).toContain('corky-strategy-runtime')
        expect(head.text()).toContain('runtimes=2')
        expect(head.text()).toContain('ready=1')     // v8 live = Ready
        expect(head.text()).toContain('degraded=1')  // status-matrix = Degraded
    })

    test('renders one selectable runtime row per runtime with id/mode/strategy_id/instance/state + lineage badge', () => {
        const rows = mountUx().findAll('.sr-rt')
        expect(rows).toHaveLength(2)
        const live = rows[0]
        expect(live.text()).toContain('v8-tail-repair-live-main')
        expect(live.text()).toContain('live')                                   // mode
        expect(live.text()).toContain('ema_regime_breakout_v8')                 // strategy_id
        expect(live.text()).toContain('v8-tail-repair-testusd-1m-live-20260701T143936Z') // instance
        expect(live.find('.rt-badge').text()).toBe('Ready')                     // readiness axis
        expect(live.find('.lin-badge').text()).toBe('verified')                 // lineage axis
    })

    test('lineage is visually distinct: verified vs mismatch; mismatch never reads as verified', () => {
        const rows = mountUx().findAll('.sr-rt')
        const verified = rows[0].find('.lin-badge')
        const mismatch = rows[1].find('.lin-badge')
        expect(verified.classes()).toContain('lin-verified')
        expect(mismatch.text()).toBe('mismatch')
        expect(mismatch.classes()).toContain('lin-attention')
        expect(mismatch.classes()).not.toContain('lin-verified')
    })

    test('clicking a runtime row emits select-runtime with its runtime_id', async () => {
        const w = mountUx()
        await w.findAll('.sr-rt')[1].trigger('click')
        expect(w.emitted('select-runtime')[0]).toEqual(['strategy-runtime-status-matrix'])
    })

    test('renders ticker child rows under each runtime (symbol + status + reason)', () => {
        const w = mountUx()
        const ada = tickerRowFor(w, 'tTESTADA:TESTUSD')
        expect(ada.find('.sr-tk-sym').text()).toBe('tTESTADA:TESTUSD')
        expect(ada.find('.st-badge').text()).toBe('waiting')
        expect(ada.text()).toContain('no entry signal')      // status_reason
        // all six tickers across both runtimes are present
        expect(w.findAll('.sr-ticker')).toHaveLength(6)
    })

    test('ticker status styles follow classifyTickerStatus (muted/green/short/attention/lockout)', () => {
        const w = mountUx()
        const styleOf = (needle) => tickerRowFor(w, needle).find('.st-badge').classes().find((c) => c.startsWith('sts-'))
        expect(styleOf('tTESTADA:TESTUSD')).toBe('sts-muted-grey')     // waiting
        expect(styleOf('tTESTBTC:TESTUSD')).toBe('sts-positive-green') // long
        expect(styleOf('tTESTXLM:TESTUSD')).toBe('sts-short-distinct') // short
        expect(styleOf('tTESTDOT:TESTUSD')).toBe('sts-attention')      // paused
        expect(styleOf('tTESTSOL:TESTUSD')).toBe('sts-lockout')        // bust_locked
        expect(styleOf('tTESTLTC:TESTUSD')).toBe('sts-attention')      // degraded
    })

    test('duration label shows only when timing is present (long → "for 19m")', () => {
        const w = mountUx()
        // long: duration from position_opened_at_ms (1782952260000) → 19m
        expect(tickerRowFor(w, 'tTESTBTC:TESTUSD').find('.sr-tk-dur').text()).toBe('for 19m')
        // short: duration from position_opened_at_ms → 50m
        expect(tickerRowFor(w, 'tTESTXLM:TESTUSD').find('.sr-tk-dur').text()).toBe('for 50m')
    })

    test('a ticker with NO published timing OMITS the duration (never invents one)', () => {
        const rt = {
            ...UX_LIVE,
            tickers: [{ ticker_id: 'V:tNOW:USD', symbol: 'tNOW:USD', status: 'waiting', status_reason: 'x' }],
            ticker_orders: [],
        }
        const w = mount(CorkyStrategyPanel, { props: { runtimes: [rt], selectedRuntimeId: rt.runtime_id, now: AS_OF } })
        const row = tickerRowFor(w, 'tNOW:USD')
        expect(row.find('.st-badge').text()).toBe('waiting')
        expect(row.find('.sr-tk-dur').exists()).toBe(false)
    })

    test('an orders_submitted_nonterminal ticker shows the submitted-order BLOCKER overlay on top of its status', () => {
        const w = mountUx()
        const ada = tickerRowFor(w, 'tTESTADA:TESTUSD')  // ticker_orders → submitted_nonterminal=1
        const btc = tickerRowFor(w, 'tTESTBTC:TESTUSD')  // submitted_nonterminal=0
        expect(ada.find('.st-badge').text()).toBe('waiting')   // status style preserved
        expect(ada.find('.sr-blocker').exists()).toBe(true)    // AND a blocker overlay
        expect(btc.find('.sr-blocker').exists()).toBe(false)
    })

    test('renders public/private dependency child rows', () => {
        const w = mountUx()
        const deps = w.findAll('.sr-deps')
        expect(deps.length).toBe(2)  // one per runtime
        expect(deps[0].text()).toContain('public')
        expect(deps[0].text()).toContain('public-market-main')
        expect(deps[0].text()).toContain('private')
        expect(deps[0].text()).toContain('private-account-main')
    })
})

describe('new-contract — Summary drilldown (selected runtime)', () => {
    const mountUx = (props = {}) =>
        mount(CorkyStrategyPanel, { props: { runtimes: UX_RUNTIMES, now: AS_OF, ...props } })

    test('verified lineage section shows run_id / candidate rank+index / params hash and reads running', () => {
        const body = mountUx().find('.sr-body').text()
        expect(body).toContain('universe-v8-tail-repair-20260630')   // run_id
        expect(body).toContain('516d5fc6ae94')                       // params hash (truncated)
        expect(body).toContain('running')
        // rank / run_index rendered
        const heads = mountUx().findAll('.sr-sec-head').map((h) => h.text())
        expect(heads.some((h) => h.startsWith('Lineage'))).toBe(true)
    })

    test('mismatch lineage is an attention state — shows "not verified", never "running"', () => {
        const w = mountUx({ selectedRuntimeId: 'strategy-runtime-status-matrix' })
        const lineageHead = w.findAll('.sr-sec-head').find((h) => h.text().startsWith('Lineage'))
        expect(lineageHead.text()).toContain('mismatch')
        expect(lineageHead.text()).toContain('not verified')
        expect(lineageHead.find('.sr-run-tag').exists()).toBe(false)
        expect(lineageHead.find('.lin-badge').classes()).toContain('lin-attention')
    })

    test('approval, auth readiness, allocation pool, and audit provenance all render', () => {
        const w = mountUx()
        const body = w.find('.sr-body').text()
        expect(w.find('.sr-approval').text()).toContain('12')        // max_order_notional (verbatim)
        expect(body).toContain('Auth readiness')
        expect(body).toContain('Allocation pool')
        expect(body).toContain('primary-account')                    // allocation account
        // audit pointers are provenance-only text (paths shown, not fetched)
        expect(body).toContain('Audit provenance')
        expect(body).toContain('v8-tail-repair-decisions.jsonl')
    })

    test('orders section surfaces the runtime submitted-nonterminal blocker', () => {
        const orders = mountUx().findAll('.sr-sec-head').find((h) => h.text().startsWith('Orders'))
        expect(orders.find('.sr-blocker').exists()).toBe(true)
        expect(orders.text()).toContain('submitted')
    })
})

describe('new-contract — Balances drilldown (server-computed wallet_allocations tree)', () => {
    const mountUx = (props = {}) =>
        mount(CorkyStrategyPanel, { props: { runtimes: UX_RUNTIMES, now: AS_OF, ...props } })

    test('renders the wallet allocation tree from wallet_allocations[] — NOT marked legacy', async () => {
        const w = await tab(mountUx(), 'Balances')
        // server-computed path → no legacy/inferred marker in the tree
        expect(w.find('.sr-body .sr-legacy-tag').exists()).toBe(false)
        const wallet = w.find('.sr-wallet.alloc')
        expect(wallet.exists()).toBe(true)
        // server-computed allocated_to_strategy / unallocated_available shown VERBATIM
        expect(wallet.find('.sr-wallet-head').text()).toContain('9,800')  // allocated_to_strategy
        // nested ticker claims (2), with distinct statuses
        const rows = w.findAll('.sr-wallet.alloc .sr-alloc tbody tr')
        expect(rows).toHaveLength(2)
        expect(w.findAll('.sr-wallet.alloc .st-badge').map((b) => b.text())).toEqual(['waiting', 'long'])
    })

    test('mismatch runtime (no wallet_allocations) falls back to the LEGACY / INFERRED tree', async () => {
        const w = await tab(mountUx({ selectedRuntimeId: 'strategy-runtime-status-matrix' }), 'Balances')
        expect(w.find('.sr-body .sr-legacy-tag').text().toLowerCase()).toContain('legacy')
        // four ticker_allocations become the legacy claim rows
        const rows = w.findAll('.sr-wallet.alloc .sr-alloc tbody tr')
        expect(rows).toHaveLength(4)
        // bust_locked claim keeps the lockout style + a realized loss shown verbatim
        const sol = rows.find((r) => r.text().includes('tTESTSOL'))
        expect(sol.find('.st-badge').classes()).toContain('sts-lockout')
        expect(sol.text()).toContain('-1,000')   // realized_pnl -1000 (grouped)
    })
})

// ═══════════════════════════════════════════════════════════════════════════
// LIVE GATEWAY FIXTURE — mid-migration fallback path (no wallet_allocations)
// ═══════════════════════════════════════════════════════════════════════════
describe('live gateway (live_get_strategy_runtime) — fallback path renders + is marked legacy', () => {
    const mountLive = (props = {}) =>
        mount(CorkyStrategyPanel, {
            props: { runtimes: [LIVE_RUNTIME], now: LIVE_RUNTIME.generated_at_ms, ...props },
        })

    test('the single live runtime renders under the process group and is selected by default', () => {
        const w = mountLive()
        expect(w.find('.sr-proc-head').text()).toContain('runtimes=1')
        expect(w.findAll('.sr-rt')).toHaveLength(1)
        expect(w.find('.sr-rt.active').text()).toContain('v8-tail-repair-live-main')
    })

    test('ticker rows render from tickers[] with the entering (transitional) status style', () => {
        const w = mountLive()
        const ada = tickerRowFor(w, 'tTESTADA:TESTUSD')   // status "entering"
        expect(ada.find('.st-badge').text()).toBe('entering')
        expect(ada.find('.st-badge').classes()).toContain('sts-transitional')
    })

    test('Balances allocation tree is the LEGACY / INFERRED fallback (wallet_allocations absent)', async () => {
        const w = await tab(mountLive(), 'Balances')
        expect(w.find('.sr-body .sr-legacy-tag').text().toLowerCase()).toContain('inferred')
        // ticker_allocations become the claim rows; allocated shown as — (not inferred)
        const rows = w.findAll('.sr-wallet.alloc .sr-alloc tbody tr')
        expect(rows).toHaveLength(LIVE_RUNTIME.ticker_allocations.length)  // 2
        // long decimal-string equity preserved verbatim (grouped, precision intact)
        expect(w.text()).toContain('3,999.7574515595762')
    })

    test('auth wallets render grouped by class (exchange / funding / margin)', async () => {
        const w = await tab(mountLive(), 'Balances')
        const authRows = w.findAll('.sr-wtable tbody tr')
        expect(authRows).toHaveLength(LIVE_RUNTIME.auth_wallet_balances.length)  // 7
        expect(w.findAll('.sr-wclass-grp').length).toBeGreaterThanOrEqual(3)
    })

    test('last_error surfaces as degraded operator-attention text', () => {
        const w = mountLive()
        expect(w.find('.sr-lasterr').text()).toContain('missing or stale runtime control session')
    })

    test('verified lineage badge renders for the live runtime', () => {
        expect(mountLive().find('.sr-rt .lin-badge').text()).toBe('verified')
    })
})

// ═══════════════════════════════════════════════════════════════════════════
// LINEAGE STATES — unknown / artifact_missing / unsupported_artifact are neutral
// or attention, never verified/running.
// ═══════════════════════════════════════════════════════════════════════════
describe('lineage states — unknown is neutral, missing/unsupported are attention (none verified)', () => {
    const runtimes = lineageStatesFx.event.runtimes
    const w = mount(CorkyStrategyPanel, { props: { runtimes, now: AS_OF } })

    test('unknown lineage renders a NEUTRAL badge (not verified, not attention)', () => {
        const row = w.findAll('.sr-rt').find((r) => r.text().includes('lineage-unknown'))
        const badge = row.find('.lin-badge')
        expect(badge.text()).toBe('unknown')
        expect(badge.classes()).toContain('lin-neutral')
        expect(badge.classes()).not.toContain('lin-verified')
    })

    test('artifact_missing / unsupported_artifact render as attention (never verified)', () => {
        const missing = w.findAll('.sr-rt').find((r) => r.text().includes('artifact-missing')).find('.lin-badge')
        const unsupported = w.findAll('.sr-rt').find((r) => r.text().includes('unsupported-artifact')).find('.lin-badge')
        expect(missing.text()).toBe('artifact_missing')
        expect(missing.classes()).toContain('lin-attention')
        expect(unsupported.text()).toBe('unsupported_artifact')
        expect(unsupported.classes()).toContain('lin-attention')
        expect(w.findAll('.lin-badge.lin-verified')).toHaveLength(0)
    })

    test('no lineage marks a candidate as running', () => {
        expect(w.findAll('.sr-run-tag')).toHaveLength(0)
    })
})

// ═══════════════════════════════════════════════════════════════════════════
// LINEAGE → BACKTEST CANDIDATE LINK (verified only)
// ═══════════════════════════════════════════════════════════════════════════
describe('CorkyStrategyPanel — lineage → backtest candidate link', () => {
    const mk = (props = {}) => mount(CorkyStrategyPanel, { props: { runtimes: UX_RUNTIMES, now: AS_OF, ...props } })

    test('a VERIFIED runtime shows a clickable link that emits open-lineage-run with the run + candidate', async () => {
        const w = mk()   // Summary tab (default); UX_LIVE (verified) is default-selected
        const open = w.find('.sr-lin-open')
        expect(open.exists()).toBe(true)
        await open.trigger('click')
        expect(w.emitted('open-lineage-run')[0][0]).toEqual({
            run_id: UX_LIVE.universe_backtest_run_id,
            run_index: UX_LIVE.candidate_run_index,
        })
        // the run-id itself is also a clickable link
        expect(w.find('.sr-lin-link').exists()).toBe(true)
    })

    test('a MISMATCHED-lineage runtime shows NO lineage link (never links a non-verified runtime)', () => {
        const mismatch = UX_RUNTIMES.find((r) => r.lineage_status && r.lineage_status !== 'verified')
        const w = mk({ selectedRuntimeId: mismatch.runtime_id })
        expect(w.find('.sr-lin-open').exists()).toBe(false)
        expect(w.find('.sr-lin-link').exists()).toBe(false)
    })
})
