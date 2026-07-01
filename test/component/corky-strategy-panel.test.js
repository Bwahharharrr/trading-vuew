// @vitest-environment jsdom
//
// CorkyStrategyPanel — presentational Strategy-runtime view in the bottom dock.
// App owns the CorkyStrategyFeed + selection/subscription; this renders props
// and emits intents (select-runtime / refresh). Driven by the REAL saved
// fixtures so the exact gateway shapes are exercised.
//
// Pins: the runtime selector (default v8-tail-repair-live-main, others
// selectable), the readiness-vs-strategy-status distinction, the DISTINCT
// per-status allocation badges, the queued=LOCAL-JOURNAL framing kept apart from
// dispatched, wallets grouped BY CLASS, the per-ticker allocation rows (decimal
// strings verbatim), the decision-audit table, and the stale-approval flag.
import { test, expect, describe } from 'vitest'
import { mount } from '@vue/test-utils'
import CorkyStrategyPanel from '../../src/components/feed/CorkyStrategyPanel.vue'

import runtimesFx from '../fixtures/corky/strategy/list_strategy_runtimes.json'
import decisionsFx from '../fixtures/corky/strategy/list_strategy_decisions_ADA.json'

const runtimes = runtimesFx.event.runtimes
const liveRuntime = runtimes.find((r) => r.runtime_id === 'v8-tail-repair-live-main')
const decisions = decisionsFx.event.decisions

// approved_at 1782935729878, expires_at 1782950129878 → a `now` before expiry.
const NOW_FRESH = 1782937600019
const NOW_STALE = 1782950129878 + 1

function mountPanel(props = {}) {
    return mount(CorkyStrategyPanel, {
        props: { runtimes, decisions, now: NOW_FRESH, ...props },
    })
}

describe('CorkyStrategyPanel — runtime selector', () => {
    test('lists every runtime in the set as a selectable row', () => {
        const w = mountPanel()
        const rows = w.findAll('.sr-rt')
        expect(rows).toHaveLength(runtimes.length)              // 2 runtimes
        expect(rows[0].text()).toContain('v8-tail-repair-live-main')
        expect(rows[1].text()).toContain('v8-tail-repair-status-main')
    })

    test('default-selects v8-tail-repair-live-main when no selection is given', () => {
        const w = mountPanel({ selectedRuntimeId: '' })
        const active = w.find('.sr-rt.active')
        expect(active.exists()).toBe(true)
        expect(active.text()).toContain('v8-tail-repair-live-main')
    })

    test('honours an explicit selectedRuntimeId (other runtime selectable)', () => {
        const w = mountPanel({ selectedRuntimeId: 'v8-tail-repair-status-main' })
        expect(w.find('.sr-rt.active').text()).toContain('v8-tail-repair-status-main')
    })

    test('clicking a runtime row emits select-runtime with its id', async () => {
        const w = mountPanel()
        await w.findAll('.sr-rt')[1].trigger('click')
        expect(w.emitted('select-runtime')[0]).toEqual(['v8-tail-repair-status-main'])
    })

    test('refresh icon emits refresh', async () => {
        const w = mountPanel()
        await w.find('.sr-icon').trigger('click')
        expect(w.emitted('refresh')).toBeTruthy()
    })

    test('shows the ● live indicator only while streaming', () => {
        expect(mountPanel({ streaming: false }).find('.sr-live').exists()).toBe(false)
        expect(mountPanel({ streaming: true }).find('.sr-live').exists()).toBe(true)
    })
})

describe('CorkyStrategyPanel — status block (readiness vs strategy status)', () => {
    test('renders the readiness state (Ready) as its own badge, distinct from strategy status', () => {
        const w = mountPanel()
        const rt = w.find('.sr-sec-head .rt-badge')
        expect(rt.text()).toBe('Ready')
        expect(rt.classes()).toContain('tone-ready')
    })

    test('shows mode, strategy, public/private runtime ids and gate readiness', () => {
        const w = mountPanel()
        const body = w.find('.sr-body').text()
        expect(body).toContain('ema_regime_breakout_v8')
        expect(body).toContain('public-market-main')
        expect(body).toContain('private-account-main')
        expect(body).toContain('2 / 2 ready')          // features_ready / feature_requirements
    })

    test('renders the allocation balances verbatim (decimal strings, never float-parsed)', () => {
        const w = mountPanel()
        const body = w.find('.sr-body').text()
        expect(body).toContain('8000.000330571827200000000000')     // observed balance
        expect(body).toContain('0.000000001827200000000000')        // unallocated available
    })
})

describe('CorkyStrategyPanel — live-operator approval', () => {
    test('shows max_order_notional (verbatim) + expiry; NOT stale before expiry', () => {
        const w = mountPanel({ now: NOW_FRESH })
        const appr = w.find('.sr-approval')
        expect(appr.exists()).toBe(true)
        expect(appr.text()).toContain('12')                 // max_order_notional verbatim
        expect(appr.classes()).not.toContain('stale')
        expect(w.find('.sr-stale').exists()).toBe(false)
    })

    test('flags a STALE approval when expires_at_ms < now', () => {
        const w = mountPanel({ now: NOW_STALE })
        const appr = w.find('.sr-approval')
        expect(appr.classes()).toContain('stale')
        expect(w.find('.sr-stale').text()).toContain('STALE')
    })
})

describe('CorkyStrategyPanel — order status framing (queued = local journal only)', () => {
    test('keeps the local journal (queued) VISUALLY DISTINCT from dispatched/reconciled', () => {
        const w = mountPanel()
        const local = w.find('.sr-order-local')
        const dispatched = w.find('.sr-order-dispatched')
        expect(local.exists()).toBe(true)
        expect(dispatched.exists()).toBe(true)
        // The local group explicitly frames queued as NOT sent to the exchange.
        expect(local.text().toLowerCase()).toContain('local journal')
        expect(local.text().toLowerCase()).toContain('not sent')
        expect(local.attributes('title').toLowerCase()).toContain('not sent to the exchange')
        // Dispatched states live in the OTHER group, not the local one.
        expect(local.text()).not.toContain('filled')
        expect(dispatched.text()).toContain('filled')
    })
})

describe('CorkyStrategyPanel — wallet balances grouped by class', () => {
    test('renders one group per wallet class in canonical order, with balances verbatim', () => {
        const w = mountPanel()
        const classes = w.findAll('.sr-wclass').map((c) => c.text())
        // fixture live runtime: exchange, margin, funding (no derivative/other)
        expect(classes).toEqual(['exchange', 'margin', 'funding'])
        const body = w.find('.sr-body').text()
        expect(body).toContain('7989.6614248')        // exchange TESTUSD balance verbatim
        expect(body).toContain('54590.60275383')      // margin TESTUSDTF0 available verbatim
    })

    test('groups the wallets of the OTHER runtime too when selected', () => {
        const w = mountPanel({ selectedRuntimeId: 'v8-tail-repair-status-main' })
        expect(w.find('.sr-body').text()).toContain('64.84881728')   // status runtime TESTADA balance
    })
})

describe('CorkyStrategyPanel — per-ticker allocation rows', () => {
    test('renders one row per ticker allocation with decimal fields verbatim', () => {
        const w = mountPanel()
        const rows = w.findAll('.sr-alloc tbody tr')
        expect(rows).toHaveLength(liveRuntime.ticker_allocations.length)   // 2 (ADA, BTC)
        const btc = rows.find((r) => r.text().includes('tTESTBTC'))
        expect(btc.text()).toContain('60281.158738234545917069447978')     // position_avg_price verbatim
        expect(btc.text()).toContain('0.00016774')                         // position_quantity verbatim
    })

    test('gives waiting and long allocations DISTINCT status badges', () => {
        const w = mountPanel()
        const badges = w.findAll('.sr-alloc .st-badge')
        const texts = badges.map((b) => b.text())
        expect(texts).toContain('waiting')
        expect(texts).toContain('long')
        const waiting = badges.find((b) => b.text() === 'waiting')
        const long = badges.find((b) => b.text() === 'long')
        // Different per-status AND tone classes → visually distinguishable.
        expect(waiting.classes()).toContain('st-waiting')
        expect(waiting.classes()).toContain('tone-idle')
        expect(long.classes()).toContain('st-long')
        expect(long.classes()).toContain('tone-long')
        expect(waiting.classes()).not.toEqual(long.classes())
    })

    test('every risk status (waiting/long/short/paused/degraded/bust_locked/capital_shortfall) is distinct', () => {
        const statuses = ['waiting', 'long', 'short', 'paused', 'degraded', 'bust_locked', 'capital_shortfall']
        const ticker_allocations = statuses.map((status, i) => ({
            ticker_id: `V:t${i}:USD`, status, allocated_equity: '0', available_cash: '0',
            reserved_cash: '0', locked_margin: '0', position_quantity: '0', realized_pnl: '0',
            unrealized_pnl: '0', fees_paid: '0', last_event: 'x',
        }))
        const rt = { ...liveRuntime, ticker_allocations, ticker_orders: [] }
        const w = mountPanel({ runtimes: [rt], selectedRuntimeId: rt.runtime_id })
        const badges = w.findAll('.sr-alloc .st-badge')
        expect(badges).toHaveLength(statuses.length)
        // Each badge's full class list is unique (no two statuses look alike).
        const keys = badges.map((b) => b.classes().slice().sort().join('|'))
        expect(new Set(keys).size).toBe(statuses.length)
        // And each carries its own per-status class.
        for (const s of statuses) {
            expect(badges.some((b) => b.classes().includes(`st-${s}`))).toBe(true)
        }
    })

    test('per-ticker order counts label the queued count as local-journal-only', () => {
        const w = mountPanel()
        const cell = w.find('.sr-alloc .sr-ticket-orders')
        const q = cell.find('.sr-oc-inline')
        expect(q.attributes('title').toLowerCase()).toContain('not sent to the exchange')
    })

    test('colours realized P/L by its textual sign; pure-zero stays neutral', () => {
        const w = mountPanel()
        const rows = w.findAll('.sr-alloc tbody tr')
        const ada = rows.find((r) => r.text().includes('tTESTADA'))
        // ADA realized_pnl = "-0.2211344669248" → negative
        const negCell = ada.findAll('td').find((c) => c.text().startsWith('-0.2211'))
        expect(negCell.classes()).toContain('neg')
        // ADA unrealized_pnl = "0" → neutral (not coloured green)
        const zeroCells = ada.findAll('td.mono').filter((c) => c.text() === '0')
        expect(zeroCells.every((c) => !c.classes().includes('pos') && !c.classes().includes('neg'))).toBe(true)
    })
})

describe('CorkyStrategyPanel — decision audit', () => {
    test('renders a decision-audit table grouped by ticker with the audit columns', () => {
        const w = mountPanel()
        expect(w.find('.sr-decisions').exists()).toBe(true)
        const rows = w.findAll('.sr-decisions tbody tr')
        expect(rows).toHaveLength(decisions.length)             // 3 ADA decisions
        const first = rows[0].text()
        expect(first).toContain('1m')                           // timeframe
        expect(first).toContain('no_intents')                   // outcome
        // risk_checks / ledger_deltas / claim_states counts render as chips.
        const chips = rows[0].findAll('.sr-chip').map((c) => c.text())
        expect(chips).toContain('2')                            // 2 risk checks
        expect(chips).toContain('1')                            // 1 ledger delta / claim state
    })

    test('truncates the feature fingerprint (full value on hover)', () => {
        const w = mountPanel()
        const fp = w.find('.sr-decisions .sr-fp')
        expect(fp.text()).toMatch(/…$/)
        expect(fp.attributes('title')).toContain(decisions[0].feature_fingerprint)
    })

    test('shows an empty note when there are no decisions', () => {
        const w = mountPanel({ decisions: [] })
        expect(w.find('.sr-decisions').exists()).toBe(false)
        expect(w.text()).toContain('No decisions loaded')
    })
})

describe('CorkyStrategyPanel — empty / loading states', () => {
    test('empty runtime set shows a message and no body', () => {
        const w = mountPanel({ runtimes: [], decisions: [] })
        expect(w.text()).toContain('No strategy runtimes available.')
    })

    test('loading with no runtimes yet shows a loading message', () => {
        const w = mountPanel({ runtimes: [], decisions: [], loading: true })
        expect(w.text()).toContain('Loading runtimes…')
    })

    test('surfaces an error string', () => {
        const w = mountPanel({ error: 'gateway down' })
        expect(w.find('.sr-error').text()).toBe('gateway down')
    })
})
