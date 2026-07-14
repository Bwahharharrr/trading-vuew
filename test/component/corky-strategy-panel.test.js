// @vitest-environment jsdom
//
// CorkyStrategyPanel — presentational Strategy-runtime view (bottom dock), now a
// TABBED interface: Overview / Tickers / Activity / Capital / Orders / Configuration / Administration. App owns the feed +
// selection; this renders props + emits intents (select-runtime / refresh).
//
// Pins: the runtime selector, the tab switching, the readiness-vs-strategy-status
// distinction, the DISTINCT per-status badges, queued=LOCAL-JOURNAL framing, the
// wallet→allocation→ticker tree (Balances), the decision-audit ticker drill-down,
// the stale-approval flag — and that fmt() cleans decimals (drops trailing zeros,
// groups thousands) WITHOUT losing precision.
import { beforeEach, test, expect, describe } from 'vitest'
import { mount } from '@vue/test-utils'
import CorkyStrategyPanel from '../../src/components/feed/CorkyStrategyPanel.vue'

import runtimesFx from '../fixtures/corky/strategy/list_strategy_runtimes.json'
import decisionsFx from '../fixtures/corky/strategy/list_strategy_decisions_ADA.json'

const runtimes = runtimesFx.event.runtimes
const liveRuntime = runtimes.find((r) => r.runtime_id === 'v8-tail-repair-live-main')
const decisions = decisionsFx.event.decisions

const NOW_FRESH = 1782937600019
const NOW_STALE = 1782950129878 + 1

function mountPanel(props = {}) {
    return mount(CorkyStrategyPanel, { props: { runtimes, decisions, now: NOW_FRESH, ...props } })
}
beforeEach(() => window.localStorage.clear())
// Activate a tab by its label.
async function tab(w, label) {
    const btn = w.findAll('.sr-tab').find((b) => b.text() === label)
    await btn.trigger('click')
    return w
}

describe('CorkyStrategyPanel — tabs + runtime selector', () => {
    test('renders the seven task tabs; Overview is active by default', () => {
        const w = mountPanel()
        expect(w.findAll('.sr-tab').map((t) => t.text())).toEqual([
            'Overview', 'Tickers', 'Activity', 'Capital', 'Orders', 'Configuration', 'Administration',
        ])
        expect(w.find('.sr-tab.active').text()).toBe('Overview')
    })

    test('lists every runtime as a selectable row; default-selects the live runtime', () => {
        const w = mountPanel({ selectedRuntimeId: '' })
        const rows = w.findAll('.sr-rt')
        expect(rows).toHaveLength(runtimes.length)
        expect(w.find('.sr-rt.active').text()).toContain('v8-tail-repair-live-main')
    })

    test('clicking a runtime row emits select-runtime; honours an explicit selection', async () => {
        const w = mountPanel()
        await w.findAll('.sr-rt')[1].trigger('click')
        expect(w.emitted('select-runtime')[0]).toEqual(['v8-tail-repair-status-main'])
        const w2 = mountPanel({ selectedRuntimeId: 'v8-tail-repair-status-main' })
        expect(w2.find('.sr-rt.active').text()).toContain('v8-tail-repair-status-main')
    })

    test('refresh icon emits refresh; ● live shows only while streaming', async () => {
        const w = mountPanel()
        await w.find('.sr-icon').trigger('click')
        expect(w.emitted('refresh')).toBeTruthy()
        expect(mountPanel({ streaming: false }).find('.sr-live').exists()).toBe(false)
        expect(mountPanel({ streaming: true }).find('.sr-live').exists()).toBe(true)
    })
})

describe('CorkyStrategyPanel — Overview tab', () => {
    test('readiness state (Ready) is its own badge, distinct from strategy status', () => {
        const rt = mountPanel().find('.sr-sec-head .rt-badge')
        expect(rt.text()).toBe('Ready')
        expect(rt.classes()).toContain('tone-ready')
    })

    test('shows strategy, public/private runtimes, gate readiness, and formatted observed balances', async () => {
        const w = mountPanel()
        const body = w.find('.sr-body').text()
        expect(body).toContain('ema_regime_breakout_v8')
        expect(body).toContain('public-market-main')
        expect(body).toContain('private-account-main')
        expect(body).toContain('2 / 2 ready')
        await tab(w, 'Capital')
        const capital = w.find('.sr-body').text()
        // fmt(): trailing zeros dropped + thousands grouped, precision PRESERVED.
        expect(capital).toContain('8,000.0003305718272')
        expect(capital).toContain('0.0000000018272')
    })

    test('approval: max notional + expiry; stale flag flips after expiry', async () => {
        const fresh = await tab(mountPanel({ now: NOW_FRESH }), 'Administration')
        const appr = fresh.find('.sr-approval')
        expect(appr.text()).toContain('12')
        expect(appr.classes()).not.toContain('stale')
        const stale = await tab(mountPanel({ now: NOW_STALE }), 'Administration')
        expect(stale.find('.sr-approval').classes()).toContain('stale')
        expect(stale.find('.sr-stale').text()).toContain('STALE')
    })

    test('orders keep the local journal (queued) VISUALLY DISTINCT from dispatched', async () => {
        const w = await tab(mountPanel(), 'Orders')
        const local = w.find('.sr-order-local')
        const dispatched = w.find('.sr-order-dispatched')
        expect(local.text().toLowerCase()).toContain('local journal')
        expect(local.text().toLowerCase()).toContain('not sent')
        expect(local.attributes('title').toLowerCase()).toContain('not sent to the exchange')
        expect(local.text()).not.toContain('filled')
        expect(dispatched.text()).toContain('filled')
    })
})

describe('CorkyStrategyPanel — Capital tab (auth wallets + wallet allocation tree)', () => {
    test('lists auth wallets grouped by class; the legacy allocation tree is a single TESTUSD card', async () => {
        const w = await tab(mountPanel(), 'Capital')
        // auth wallets grouped by class (exchange / margin / funding) — every wallet row shows.
        const rows = w.findAll('.sr-wtable tbody tr')
        expect(rows).toHaveLength(liveRuntime.auth_wallet_balances.length)   // 8 balances across classes
        expect(w.findAll('.sr-wclass-grp').length).toBeGreaterThanOrEqual(3) // exchange, margin, funding
        expect(w.text()).toContain('7,989.6614248')       // exchange TESTUSD balance (grouped)
        // wallet allocation tree — no wallet_allocations[] on this older fixture → ONE
        // synthesized card (allocation_quote_currency) CLEARLY MARKED legacy / inferred.
        const alloc = w.find('.sr-wallet.alloc')
        expect(alloc.exists()).toBe(true)
        expect(alloc.find('.sym').text()).toBe('TESTUSD')
        expect(w.find('.sr-body .sr-legacy-tag').text().toLowerCase()).toContain('legacy')
        expect(alloc.text()).toContain('8,000.0003305718272') // observed (pool)
    })

    test('the allocation card nests the ticker claim rows, decimals formatted + precision preserved', async () => {
        const w = await tab(mountPanel(), 'Capital')
        const rows = w.findAll('.sr-wallet.alloc .sr-alloc tbody tr')
        expect(rows).toHaveLength(liveRuntime.ticker_allocations.length)   // 2
        const btc = rows.find((r) => r.text().includes('tTESTBTC'))
        // 30-digit avg price: grouped + preserved (would lose precision under Number()).
        expect(btc.text()).toContain('60,281.158738234545917069447978')
    })

    test('waiting vs long claims get DISTINCT ticker-status style badges', async () => {
        const w = await tab(mountPanel(), 'Capital')
        const badges = w.findAll('.sr-wallet.alloc .st-badge')
        const waiting = badges.find((b) => b.text() === 'waiting')
        const long = badges.find((b) => b.text() === 'long')
        expect(waiting.classes()).toContain('sts-muted-grey')
        expect(long.classes()).toContain('sts-positive-green')
        expect(waiting.classes()).not.toEqual(long.classes())
    })

    test('ticker-status styles: long/short/waiting are distinct; the attention family (paused/degraded/capital_shortfall) shares one style; bust_locked is lockout', async () => {
        const statuses = ['waiting', 'long', 'short', 'paused', 'degraded', 'bust_locked', 'capital_shortfall']
        const ticker_allocations = statuses.map((status, i) => ({
            ticker_id: `V:t${i}:TESTUSD`, status, allocated_equity: '0', available_cash: '0',
            reserved_cash: '0', locked_margin: '0', position_quantity: '0', realized_pnl: '0',
            unrealized_pnl: '0', fees_paid: '0', last_event: 'x',
        }))
        const rt = { ...liveRuntime, wallet_allocations: undefined, ticker_allocations, ticker_orders: [] }
        const w = await tab(mountPanel({ runtimes: [rt], selectedRuntimeId: rt.runtime_id }), 'Capital')
        const badges = w.findAll('.sr-wallet.alloc .st-badge')
        expect(badges).toHaveLength(statuses.length)
        // badge TEXT distinguishes every status.
        expect(badges.map((b) => b.text())).toEqual(statuses)
        // style families: long/short/waiting/lockout distinct; the 3 attention states collapse.
        const styleOf = (b) => b.classes().find((c) => c.startsWith('sts-'))
        expect(styleOf(badges[0])).toBe('sts-muted-grey')      // waiting
        expect(styleOf(badges[1])).toBe('sts-positive-green')  // long
        expect(styleOf(badges[2])).toBe('sts-short-distinct')  // short
        expect(styleOf(badges[3])).toBe('sts-attention')       // paused
        expect(styleOf(badges[4])).toBe('sts-attention')       // degraded
        expect(styleOf(badges[5])).toBe('sts-lockout')         // bust_locked
        expect(styleOf(badges[6])).toBe('sts-attention')       // capital_shortfall
        expect(new Set(badges.map(styleOf)).size).toBe(5)      // 5 distinct style families
    })

    test('colours realized P/L by textual sign; pure-zero stays neutral', async () => {
        const w = await tab(mountPanel(), 'Capital')
        const rows = w.findAll('.sr-wallet.alloc .sr-alloc tbody tr')
        const ada = rows.find((r) => r.text().includes('tTESTADA'))
        const negCell = ada.findAll('td').find((c) => c.text().startsWith('-0.2211'))
        expect(negCell.classes()).toContain('neg')
        const zeroCells = ada.findAll('td.mono').filter((c) => c.text() === '0')
        expect(zeroCells.every((c) => !c.classes().includes('pos') && !c.classes().includes('neg'))).toBe(true)
    })
})

describe('CorkyStrategyPanel — Activity tab (ticker drill-down)', () => {
    test('lists tickers; the first ticker\'s decisions show by default, most-recent-first', async () => {
        const w = await tab(mountPanel(), 'Activity')
        const tks = w.findAll('.sr-audit-tk')
        expect(tks.length).toBeGreaterThanOrEqual(1)
        expect(w.find('.sr-audit-tk.active').exists()).toBe(true)
        const rows = w.findAll('.sr-decisions tbody tr')
        expect(rows).toHaveLength(decisions.length)   // 3 ADA decisions
        expect(rows[0].text()).toContain('1m')
    })

    test('clicking a ticker shows that ticker\'s decisions', async () => {
        // two tickers, distinct decision sets
        const ds = [
            { ticker_id: 'V:tADA:USD', symbol: 'tADA:USD', decision_ts_ms: 2, timeframe: '1m', outcome: 'a', intents: [], risk_checks: [], ledger_deltas: [], claim_states: [] },
            { ticker_id: 'V:tBTC:USD', symbol: 'tBTC:USD', decision_ts_ms: 3, timeframe: '5m', outcome: 'b', intents: [], risk_checks: [], ledger_deltas: [], claim_states: [] },
        ]
        const w = await tab(mountPanel({ decisions: ds }), 'Activity')
        expect(w.findAll('.sr-audit-tk')).toHaveLength(2)
        // default → first ticker (tADA)
        expect(w.find('.sr-decisions').text()).toContain('1m')
        // click the second ticker → its decision
        await w.findAll('.sr-audit-tk')[1].trigger('click')
        expect(w.find('.sr-decisions').text()).toContain('5m')
        expect(w.find('.sr-decisions').text()).not.toContain('1m')
    })

    test('truncates the feature fingerprint (full value on hover)', async () => {
        const w = await tab(mountPanel(), 'Activity')
        const fp = w.find('.sr-decisions .sr-fp')
        expect(fp.text()).toMatch(/…$/)
        // rows are most-recent-first, so the first row is the newest decision.
        const newest = decisions.slice().sort((a, b) => (b.decision_ts_ms || 0) - (a.decision_ts_ms || 0))[0]
        expect(fp.attributes('title')).toContain(newest.feature_fingerprint)
    })

    test('empty note when there are no decisions', async () => {
        const w = await tab(mountPanel({ decisions: [] }), 'Activity')
        expect(w.find('.sr-decisions').exists()).toBe(false)
        expect(w.text()).toContain('No decisions loaded')
    })
})

describe('CorkyStrategyPanel — empty / loading / error', () => {
    test('empty runtime set shows a message', () => {
        expect(mountPanel({ runtimes: [], decisions: [] }).text()).toContain('No strategy runtimes available.')
    })
    test('loading with no runtimes shows a loading message', () => {
        expect(mountPanel({ runtimes: [], decisions: [], loading: true }).text()).toContain('Loading runtimes…')
    })
    test('surfaces an error string', () => {
        expect(mountPanel({ error: 'gateway down' }).find('.sr-error').text()).toBe('gateway down')
    })

    // Socket down + nothing loaded → ONE centered message, not the redundant
    // error banner + "No strategy runtimes available." + "No strategy runtime
    // loaded." stack.
    test('socket down with no runtimes shows a single centered error, not the stacked messages', () => {
        const msg = 'socket is closing/closed and no reconnect is pending'
        const w = mountPanel({ runtimes: [], decisions: [], error: msg })
        const empty = w.find('.sr-empty-inner')
        expect(empty.exists()).toBe(true)
        expect(empty.classes()).toContain('error')     // rendered red
        expect(empty.text()).toBe(msg)
        // the redundant duplicate states are gone
        expect(w.text()).not.toContain('No strategy runtimes available.')
        expect(w.text()).not.toContain('No strategy runtime loaded.')
        expect(w.find('.sr-error').exists()).toBe(false)   // no separate top banner
        // the message appears exactly once
        expect(w.text().split(msg).length - 1).toBe(1)
    })

    test('loading takes priority over a stale error in the centered state', () => {
        const w = mountPanel({ runtimes: [], decisions: [], loading: true, error: 'x' })
        expect(w.find('.sr-empty-inner').text()).toBe('Loading runtimes…')
        expect(w.find('.sr-empty-inner').classes()).not.toContain('error')
    })
})
