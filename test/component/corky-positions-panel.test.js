// @vitest-environment jsdom
//
// CorkyPositionsPanel — a PRESENTATIONAL, controlled bottom-dock component with
// Open / Historical tabs. It renders position rows from props, highlights the
// charted ticker, and EMITS intents (select-position / load-more / refresh /
// update:open / update:active-tab / update:active-account). It owns no feed.
//
// Also pins the App-level onPositionSelect timeframe rule (keep → 1h → lowest)
// driving the existing corkySelect() — exercised against a plain `this` context,
// the same lightweight technique used in chart-state.test.js.
import { test, expect, describe, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import CorkyPositionsPanel from '../../src/components/feed/CorkyPositionsPanel.vue'
import { authPositionsEvent } from '../fixtures/corky/index.js'
import { pickTimeframe } from '../../src/helpers/feed/pick-timeframe.js'
import fileManager from '../../src/mixins/app/file-manager.js'

const rows = authPositionsEvent.event.positions
const openRows = rows.filter((r) => r.source === 'current')
const histRows = rows.filter((r) => r.source === 'historical')

function mountPanel(props = {}) {
    return mount(CorkyPositionsPanel, {
        props: {
            height: 274, open: true, activeTab: 'open',
            openPositions: openRows, historicalPositions: histRows,
            accounts: [{ venue: 'BITFINEX', account_id: 'paper-a' }],
            activeAccount: { venue: 'BITFINEX', account_id: 'paper-a' },
            historyTotal: histRows.length,
            ...props,
        },
    })
}

describe('CorkyPositionsPanel — rendering', () => {
    test('shows the base tabs (Open / Historical / Search Signals / Backtests / Strategy) with counts', () => {
        const w = mountPanel()
        const tabs = w.findAll('.pd-tab')
        // Open Positions, Historical, Search Signals, Backtests, Strategy (no result tabs yet).
        expect(tabs).toHaveLength(5)
        expect(tabs[0].text()).toContain('Open Positions')
        expect(tabs[0].text()).toContain(String(openRows.length))
        expect(tabs[1].text()).toContain('Historical')
        expect(tabs[2].text()).toContain('Search Signals')
        expect(tabs[3].text()).toContain('Backtests')
        expect(tabs[4].text()).toContain('Strategy')
    })

    test('the Backtests tab renders the backtests panel', () => {
        const w = mountPanel({ activeTab: 'backtests', backtests: { strategies: [{ name: 'ema', display_name: 'EMA' }], runs: [], filters: {}, detail: {} } })
        expect(w.find('.bt').exists()).toBe(true)
    })

    test('dock forwards metric-filters / click-history to the backtests panel and bubbles updates back', () => {
        const metricFilters = [{ key: 'total_net_profit', label: 'Net P/L', op: '>', value: 1000 }]
        const clickHistory = ['r1']
        const w = mountPanel({ activeTab: 'backtests', backtests: { strategies: [], runs: [], filters: {}, detail: {}, metricFilters, clickHistory } })
        const child = w.findComponent({ name: 'CorkyBacktestsPanel' })
        // Down: props arrive intact (catches a misnamed kebab binding falling into $attrs).
        expect(child.props('metricFilters')).toEqual(metricFilters)
        expect(child.props('clickHistory')).toEqual(clickHistory)
        // Up: the child's update:metric-filters bubbles out of the dock as bt-set-metric-filters.
        const payload = [{ key: 'score_v2', label: 'Score v2', op: '>=', value: 0.5 }]
        child.vm.$emit('update:metric-filters', payload)
        expect(w.emitted('bt-set-metric-filters').pop()[0]).toEqual(payload)
    })

    test('a selected run adds a Run-Details tab that renders the detail + closes', async () => {
        const run = { run_id: 'r1', strategy: 'ema_cross_all_in_v1', venue: 'BITFINEX', symbols: ['tBTCUSD'], trade_timeframe: '1h', status: 'completed', metrics: { profit_factor: '1.33' } }
        const w = mountPanel({ activeTab: 'bt-detail', backtests: { runs: [run], filters: {}, selectedRun: run, detail: {} } })
        const tabs = w.findAll('.pd-tab')
        expect(tabs).toHaveLength(6)                      // base 5 + Run-Details
        expect(tabs[5].text()).toContain('ema_cross_all_in_v1 · tBTCUSD · 1h')
        expect(w.find('.btd').exists()).toBe(true)        // the detail body
        // closing the tab emits bt-close-detail
        await tabs[5].find('.pd-tab-close').trigger('click')
        expect(w.emitted('bt-close-detail')).toBeTruthy()
    })

    test('no Run-Details tab when no run is selected', () => {
        const w = mountPanel({ activeTab: 'backtests', backtests: { runs: [], filters: {}, selectedRun: null, detail: {} } })
        expect(w.findAll('.pd-tab')).toHaveLength(5)   // base tabs incl. Strategy, no Run-Details
    })

    test('the Strategy tab renders only the running-strategy catalog', () => {
        const runtimes = [{ runtime_id: 'v8-tail-repair-live-main', state: 'Ready', mode: 'live', strategy: 'ema_v8', ticker_allocations: [], ticker_orders: [], order_status_counts: {}, auth_wallet_balances: [] }]
        const w = mountPanel({ activeTab: 'strategy', strategy: { runtimes, selectedRuntimeId: '', decisions: [] } })
        expect(w.findComponent({ name: 'CorkyStrategyList' }).exists()).toBe(true)
        expect(w.findComponent({ name: 'CorkyStrategyPanel' }).exists()).toBe(false)
    })

    test('the Strategy tab shows a runtime count badge', () => {
        const runtimes = [{ runtime_id: 'a', state: 'Ready', mode: 'live' }, { runtime_id: 'b', state: 'Ready', mode: 'shadow_live' }]
        const w = mountPanel({ strategy: { runtimes } })
        const strategyTab = w.findAll('.pd-tab').find((t) => t.text().includes('Strategy'))
        expect(strategyTab.text()).toContain('2')
    })

    test('a selected strategy gets one contextual S: tab directly after Strategy', async () => {
        const runtime = { runtime_id: 'v8-tail-repair-live-main', state: 'Ready', mode: 'live', strategy: 'ema_regime_breakout_v8' }
        const strategy = { runtimes: [runtime], selectedRuntimeId: runtime.runtime_id, detailOpen: true }
        const w = mountPanel({ activeTab: 'strategy', tabOrder: ['strategy', 'open', 'historical', 'search', 'backtests'], strategy })
        const tabs = w.findAll('.pd-tab')
        expect(tabs[0].text()).toContain('Strategy')
        expect(tabs[1].text()).toBe('S: EMA Regime Breakout V8 ×')
        expect(tabs[2].text()).toContain('Open Positions')
        await tabs[1].trigger('click')
        expect(w.emitted('update:active-tab').pop()).toEqual(['strategy-detail'])
    })

    test('the catalog opens a runtime and the contextual tab scopes the full strategy workspace', () => {
        const runtimes = [{ runtime_id: 'v8-tail-repair-live-main', state: 'Ready', mode: 'live', strategy: 'ema_v8', ticker_allocations: [], ticker_orders: [], order_status_counts: {}, auth_wallet_balances: [] }]
        const decisions = [{ decision_id: 'd1', ticker_id: 'x', symbol: 'tX', timeframe: '1m', outcome: 'no_intents' }]
        const catalog = mountPanel({ activeTab: 'strategy', strategy: { runtimes, selectedRuntimeId: runtimes[0].runtime_id } })
        catalog.findComponent({ name: 'CorkyStrategyList' }).vm.$emit('open-runtime', runtimes[0].runtime_id)
        expect(catalog.emitted('strategy-open-runtime').pop()[0]).toBe(runtimes[0].runtime_id)

        const w = mountPanel({ activeTab: 'strategy-detail', maximized: true, strategy: { runtimes, selectedRuntimeId: 'v8-tail-repair-live-main', detailOpen: true, decisions, streaming: true } })
        const child = w.findComponent({ name: 'CorkyStrategyPanel' })
        // Down: bundle spreads into the child's individual props.
        expect(child.props('runtimes')).toEqual(runtimes)
        expect(child.props('selectedRuntimeId')).toBe('v8-tail-repair-live-main')
        expect(child.props('decisions')).toEqual(decisions)
        expect(child.props('streaming')).toBe(true)
        expect(child.props('maximized')).toBe(true)
        // Up: select-runtime → strategy-select-runtime, refresh → strategy-refresh.
        child.vm.$emit('select-runtime', 'v8-tail-repair-status-main')
        expect(w.emitted('strategy-select-runtime').pop()[0]).toBe('v8-tail-repair-status-main')
        child.vm.$emit('refresh')
        expect(w.emitted('strategy-refresh')).toBeTruthy()
    })

    test('renders open rows with the ticker symbol', () => {
        const w = mountPanel()
        const trs = w.findAll('.pd-row')
        expect(trs).toHaveLength(openRows.length)
        expect(w.text()).toContain('tBTCUSD')
    })

    test('switching activeTab prop swaps the row set to historical', async () => {
        const w = mountPanel({ activeTab: 'historical' })
        expect(w.findAll('.pd-row')).toHaveLength(histRows.length)
        // historical rows expose a Closed column
        expect(w.text()).toContain('Closed')
    })

    test('collapsed dock hides the body but keeps the header', () => {
        const w = mountPanel({ open: false, height: 34 })
        expect(w.find('.pd-body').exists()).toBe(false)
        expect(w.find('.pd-header').exists()).toBe(true)
    })

    test('highlights the row matching the charted ticker', () => {
        const w = mountPanel({ currentSymbolKey: 'bitfinex|tbtcusd' })
        expect(w.find('.pd-row.active').exists()).toBe(true)
    })

    test('colours PnL by the textual sign of the decimal string', () => {
        const w = mountPanel()
        // fixture open row pl = "12.75" → positive
        expect(w.find('.pd-row .pos').exists()).toBe(true)
    })
})

describe('CorkyPositionsPanel — events', () => {
    test('clicking a row emits select-position with the row', async () => {
        const w = mountPanel()
        await w.find('.pd-row').trigger('click')
        const ev = w.emitted('select-position')
        expect(ev).toBeTruthy()
        expect(ev[0][0].symbol).toBe('tBTCUSD')
        expect(ev[0][0].source).toBe('current')
    })

    test('Ctrl/Cmd-click a position row → select-position(newTab=true); plain click → false', async () => {
        const w = mountPanel()
        await w.find('.pd-row').trigger('click', { ctrlKey: true })
        expect(w.emitted('select-position')[0][1]).toBe(true)     // 2nd arg = newTab
        await w.find('.pd-row').trigger('click')
        expect(w.emitted('select-position')[1][1]).toBe(false)
    })

    test('the per-row details button emits audit-position (not select)', async () => {
        const w = mountPanel()
        await w.find('.pd-details').trigger('click')
        expect(w.emitted('audit-position')).toBeTruthy()
        expect(w.emitted('audit-position')[0][0].symbol).toBe('tBTCUSD')
        // the row click (select) must NOT also fire from the details button (@click.stop)
        expect(w.emitted('select-position')).toBeFalsy()
    })

    test('tab buttons emit update:active-tab', async () => {
        const w = mountPanel()
        await w.findAll('.pd-tab')[1].trigger('click')
        expect(w.emitted('update:active-tab')[0]).toEqual(['historical'])
    })

    test('refresh + collapse icons emit', async () => {
        const w = mountPanel()
        const icons = w.findAll('.pd-icon')   // [refresh, maximize, collapse]
        await icons[0].trigger('click')   // refresh
        await icons[2].trigger('click')   // collapse
        expect(w.emitted('refresh')).toBeTruthy()
        expect(w.emitted('update:open')[0]).toEqual([false])
    })

    test('maximize button: ⤢ normally / ⤡ when maximized, emits update:maximized', async () => {
        const w = mountPanel()
        const icons = w.findAll('.pd-icon')
        expect(icons).toHaveLength(3)              // refresh, maximize, collapse
        const maxBtn = icons[1]
        expect(maxBtn.text()).toBe('⤢')
        expect(maxBtn.attributes('title')).toBe('Maximize')
        await maxBtn.trigger('click')
        expect(w.emitted('update:maximized')[0]).toEqual([true])

        // When already maximized it flips to the Restore glyph and emits false.
        const wMax = mountPanel({ maximized: true })
        const restoreBtn = wMax.findAll('.pd-icon')[1]
        expect(restoreBtn.text()).toBe('⤡')
        expect(restoreBtn.attributes('title')).toBe('Restore')
        await restoreBtn.trigger('click')
        expect(wMax.emitted('update:maximized')[0]).toEqual([false])
    })

    test('Load more shows when more history is available and emits', async () => {
        const w = mountPanel({ activeTab: 'historical', historyHasMore: true, historyTotal: 99 })
        const more = w.find('.pd-more button')
        expect(more.exists()).toBe(true)
        await more.trigger('click')
        expect(w.emitted('load-more')).toBeTruthy()
    })

    test('empty state when no rows', () => {
        const w = mountPanel({ openPositions: [] })
        expect(w.find('.pd-msg').text()).toContain('No open positions')
    })

    test('opened_at_ms=0 shows — in the Opened column, never 1970', () => {
        const w = mountPanel({ openPositions: [{ ...openRows[0], opened_at_ms: 0 }] })
        expect(w.text()).not.toContain('1970')
    })
})

// ── App.onPositionSelect timeframe rule (keep → 1h → lowest) ──────────────────
// Replicate App.methods.onPositionSelect against a controllable `this`.
async function runSelect(ctx, pos) {
    // mirror of App.methods.onPositionSelect (kept in lockstep with App.vue)
    if (!pos || !pos.symbol) return
    const { venue, symbol } = pos
    let state = (ctx.corkyStates || []).find((s) => s && s.venue === venue && s.symbol === symbol)
    if (!state) {
        await ctx.corkyDiscover(venue)
        state = (ctx.corkyStates || []).find((s) => s && s.venue === venue && s.symbol === symbol)
    }
    const tfs = (state && state.available_timeframes) || []
    const current = ctx.corkyCurrent && ctx.corkyCurrent.timeframe
    const timeframe = pickTimeframe(current, tfs, { fallback: '1h' }) || current || '1h'
    ctx.corkySelect({ venue, symbol, timeframe })
}

describe('onPositionSelect — switch ticker + timeframe rule', () => {
    const pos = { venue: 'BITFINEX', symbol: 'tETHUSD' }

    test('keeps the current timeframe when the target offers it', async () => {
        const corkySelect = vi.fn()
        await runSelect({
            corkyStates: [{ venue: 'BITFINEX', symbol: 'tETHUSD', available_timeframes: ['1m', '1h', '1D'] }],
            corkyCurrent: { timeframe: '1D' },
            corkyDiscover: vi.fn(), corkySelect,
        }, pos)
        expect(corkySelect).toHaveBeenCalledWith({ venue: 'BITFINEX', symbol: 'tETHUSD', timeframe: '1D' })
    })

    test('falls back to 1h when current is unavailable', async () => {
        const corkySelect = vi.fn()
        await runSelect({
            corkyStates: [{ venue: 'BITFINEX', symbol: 'tETHUSD', available_timeframes: ['5m', '1H', '1D'] }],
            corkyCurrent: { timeframe: '4h' },
            corkyDiscover: vi.fn(), corkySelect,
        }, pos)
        expect(corkySelect).toHaveBeenCalledWith({ venue: 'BITFINEX', symbol: 'tETHUSD', timeframe: '1H' })
    })

    test('falls back to the lowest available when neither current nor 1h offered', async () => {
        const corkySelect = vi.fn()
        await runSelect({
            corkyStates: [{ venue: 'BITFINEX', symbol: 'tETHUSD', available_timeframes: ['1D', '1W', '15m'] }],
            corkyCurrent: { timeframe: '4h' },
            corkyDiscover: vi.fn(), corkySelect,
        }, pos)
        expect(corkySelect).toHaveBeenCalledWith({ venue: 'BITFINEX', symbol: 'tETHUSD', timeframe: '15m' })
    })

    test('discovers the venue first when the symbol is unknown', async () => {
        const corkySelect = vi.fn()
        const ctx = {
            corkyStates: [],
            corkyCurrent: { timeframe: '1h' },
            corkySelect,
            corkyDiscover: vi.fn(async () => {
                ctx.corkyStates = [{ venue: 'BITFINEX', symbol: 'tETHUSD', available_timeframes: ['1h', '1D'] }]
            }),
        }
        await runSelect(ctx, pos)
        expect(ctx.corkyDiscover).toHaveBeenCalledWith('BITFINEX')
        expect(corkySelect).toHaveBeenCalledWith({ venue: 'BITFINEX', symbol: 'tETHUSD', timeframe: '1h' })
    })
})

describe('CorkyPositionsPanel — search tabs', () => {
    const searchContext = {
        venue: 'BITFINEX', symbol: 'tBTCUSD', timeframe: '1h',
        timeframes: ['1h', '2h'],
        indicators: [{ label: 'CRUP', fields: ['score'] }],
    }
    const matchRow = {
        ticker: 'tBTCUSD', venue: 'BITFINEX', timeframe: '1h', side: 'bull', signal: '1h bull',
        timestamp_ms: 1781953200000, close: '63664', boxes: [], boxesText: '2h bull box',
        chart_window: { timeframe: '1h', start_ms: 1, end_ms: 2 },
    }
    const searchTab = {
        id: 'search-1', n: 1, search_id: 'corky-search-1', title: 'Search Results 1',
        status: 'running', running: true, progress: { message: 'scanning…' },
        matches: [matchRow], error: null, summary: null, query: {},
    }

    test('renders a Search Results tab with a close button; close emits close-search-tab', async () => {
        const w = mountPanel({ searchTabs: [searchTab], searchContext })
        const tab = w.findAll('.pd-tab-search')
        expect(tab).toHaveLength(1)
        expect(tab[0].text()).toContain('Search Results 1')
        expect(tab[0].text()).toContain('1')          // match-count badge
        await tab[0].find('.pd-tab-close').trigger('click')
        expect(w.emitted('close-search-tab')[0]).toEqual(['search-1'])
    })

    test('the Search Signals tab renders the form with timeframe chips from context', () => {
        const w = mountPanel({ activeTab: 'search', searchContext, searchTabs: [] })
        expect(w.find('.ssf').exists()).toBe(true)
        expect(w.findAll('.ssf-chip').map((c) => c.text())).toEqual(['1h', '2h'])
    })

    test('keeps the form mounted (state survives) when switching tabs away and back', async () => {
        const w = mountPanel({ activeTab: 'search', searchContext, searchTabs: [searchTab] })
        const symbol = w.findAll('.ssf-grid2 input')[1]
        await symbol.setValue('tFOOUSD')
        // switch to a results tab, then back to the form
        await w.setProps({ activeTab: 'search-1' })
        await w.setProps({ activeTab: 'search' })
        // same form instance → the edited value is retained (not reset to default)
        expect(w.findAll('.ssf-grid2 input')[1].element.value).toBe('tFOOUSD')
    })

    test('an active Search Results tab renders matches; row click → select-result, Stop → cancel-search', async () => {
        const w = mountPanel({ activeTab: 'search-1', searchTabs: [searchTab], searchContext })
        expect(w.find('.sr').exists()).toBe(true)
        const rows = w.findAll('.sr-row')
        expect(rows).toHaveLength(1)
        expect(rows[0].text()).toContain('tBTCUSD')
        expect(rows[0].text()).toContain('2h bull box')
        await rows[0].trigger('click')
        expect(w.emitted('select-result')[0][0]).toEqual({ tabId: 'search-1', row: matchRow, index: 0, newTab: false })
        await rows[0].trigger('click', { metaKey: true })   // ⌘-click → new tab
        expect(w.emitted('select-result')[1][0].newTab).toBe(true)
        await w.find('.sr-stop').trigger('click')
        expect(w.emitted('cancel-search')[0]).toEqual(['search-1'])
    })

    test('does not render the positions table while a search tab is active', () => {
        const w = mountPanel({ activeTab: 'search-1', searchTabs: [searchTab], searchContext })
        expect(w.find('.pd-table').exists()).toBe(false)
    })

    test('highlights the active result row and shows the loading sub-row', () => {
        const w = mountPanel({
            activeTab: 'search-1', searchTabs: [searchTab], searchContext,
            searchNav: { tabId: 'search-1', index: 0, loading: true, error: false, message: 'Loading history…' },
        })
        expect(w.find('.sr-row.active').exists()).toBe(true)
        const status = w.find('.sr-status-row')
        expect(status.exists()).toBe(true)
        expect(status.text()).toContain('Loading history…')
    })

    test('nav for a different tab does not highlight this tab', () => {
        const w = mountPanel({
            activeTab: 'search-1', searchTabs: [searchTab], searchContext,
            searchNav: { tabId: 'search-2', index: 0, loading: true, message: 'x' },
        })
        expect(w.find('.sr-row.active').exists()).toBe(false)
        expect(w.find('.sr-status-row').exists()).toBe(false)
    })

    // ── Barrier Symmetric target enrichment in results ──
    const barrierTab = {
        id: 'search-2', n: 2, search_id: 'cs-2', title: 'Search Results 2',
        status: 'complete', running: false, progress: null, error: null, summary: null, query: {},
        matches: [
            { ...matchRow, barrier: { pending: false, hash: 'h', plan: { reward_risk_ratio: 1 }, outcome: { bull_hit: true, bear_hit: false }, analytics: { sample_count: 1840, bull_hit_rate: 0.563, bull_wilson_lower_bound: 0.54, bull_expected_value: 0.08, bull_full_kelly: 0.08, bear_hit_rate: 0.397, bear_wilson_lower_bound: 0.375, bear_expected_value: -0.25, bear_full_kelly: 0 } } },
            { ...matchRow, barrier: { pending: true, hash: 'h', plan: {}, outcome: null, analytics: { sample_count: 95 } } },
        ],
    }

    test('shows the Target column only when matches carry barrier enrichment', () => {
        const plain = mountPanel({ activeTab: 'search-1', searchTabs: [searchTab], searchContext })
        expect(plain.findAll('th').some((t) => t.text() === 'Target')).toBe(false)
        const enriched = mountPanel({ activeTab: 'search-2', searchTabs: [barrierTab], searchContext })
        expect(enriched.findAll('th').some((t) => t.text() === 'Target')).toBe(true)
    })

    test('renders matured outcome (bull ✓) and pending separately (never a miss)', () => {
        const w = mountPanel({ activeTab: 'search-2', searchTabs: [barrierTab], searchContext })
        const cells = w.findAll('.sr-tgt')
        expect(cells).toHaveLength(2)
        expect(cells[0].text()).toBe('bull ✓')
        expect(cells[0].classes()).toContain('bull')
        expect(cells[1].text()).toBe('pending')
        expect(cells[1].classes()).toContain('pending')
        // analytics ride along as the hover title
        expect(cells[0].attributes('title')).toMatch(/n=1840/)
        expect(cells[0].attributes('title')).toMatch(/bull 56\.3%/)
    })
})

// ── Drag-to-reorder the base dock tabs (persisted forever by App) ─────────────
// The panel is controlled: it renders the base tabs in the App-owned `tabOrder`,
// reconciles that order against its canonical set, and EMITS `update:tab-order`
// on drop. Transient tabs (run details, search results) are appended and are NOT
// draggable.
describe('CorkyPositionsPanel — base-tab reordering', () => {
    const baseTabs = (w) => w.findAll('.pd-tab:not(.pd-tab-search)')
    const ids = (w) => baseTabs(w).map((b) => b.text().replace(/\d+$/, '').trim())

    test('with no saved order the tabs render in the canonical order', () => {
        const w = mountPanel()   // tabOrder defaults to []
        expect(ids(w)).toEqual(['Open Positions', 'Historical', 'Search Signals', 'Backtests', 'Strategy'])
    })

    test('renders the base tabs in the persisted order', () => {
        const w = mountPanel({ tabOrder: ['backtests', 'strategy', 'open', 'historical', 'search'] })
        expect(ids(w)).toEqual(['Backtests', 'Strategy', 'Open Positions', 'Historical', 'Search Signals'])
    })

    test('reconciles a partial saved order — missing canonical tabs are appended', () => {
        const w = mountPanel({ tabOrder: ['strategy', 'backtests'] })
        expect(ids(w)).toEqual(['Strategy', 'Backtests', 'Open Positions', 'Historical', 'Search Signals'])
    })

    test('reconciles a dirty saved order — unknown ids dropped, duplicates collapsed', () => {
        const w = mountPanel({ tabOrder: ['zzz', 'strategy', 'strategy', 'open'] })
        expect(ids(w)).toEqual(['Strategy', 'Open Positions', 'Historical', 'Search Signals', 'Backtests'])
    })

    test('all base tabs are draggable', () => {
        const w = mountPanel()
        expect(baseTabs(w).every((b) => b.attributes('draggable') === 'true')).toBe(true)
    })

    test('dragging a tab onto another emits update:tab-order with the new (insert-before) order', async () => {
        const w = mountPanel()
        const tabs = baseTabs(w)                 // [open, historical, search, backtests, strategy]
        await tabs[4].trigger('dragstart')       // grab Strategy
        await tabs[0].trigger('dragover')        // over Open Positions
        await tabs[0].trigger('drop')            // drop → insert Strategy before Open
        expect(w.emitted('update:tab-order')[0][0]).toEqual(['strategy', 'open', 'historical', 'search', 'backtests'])
    })

    test('dragging left→right inserts before the target', async () => {
        const w = mountPanel()
        const tabs = baseTabs(w)
        await tabs[0].trigger('dragstart')       // grab Open (idx 0)
        await tabs[3].trigger('drop')            // drop on Backtests (idx 3)
        // remove open → [historical,search,backtests,strategy]; insert before backtests
        expect(w.emitted('update:tab-order')[0][0]).toEqual(['historical', 'search', 'open', 'backtests', 'strategy'])
    })

    test('dropping a tab on itself emits nothing', async () => {
        const w = mountPanel()
        const tabs = baseTabs(w)
        await tabs[2].trigger('dragstart')
        await tabs[2].trigger('drop')
        expect(w.emitted('update:tab-order')).toBeFalsy()
    })

    test('drag visual state clears on dragend', async () => {
        const w = mountPanel()
        const tabs = baseTabs(w)
        await tabs[1].trigger('dragstart')
        expect(w.vm.dragId).toBe('historical')
        await tabs[1].trigger('dragend')
        expect(w.vm.dragId).toBe(null)
        expect(w.vm.dragOverId).toBe(null)
    })

    test('transient tabs (search results) are appended and NOT draggable', () => {
        const searchTab = { id: 'search-1', title: 'Search Results 1', status: 'running', matches: [], running: true }
        const w = mountPanel({ tabOrder: ['strategy', 'open', 'historical', 'search', 'backtests'], searchTabs: [searchTab] })
        // base tabs keep the persisted order…
        expect(ids(w)[0]).toBe('Strategy')
        // …and the transient tab is appended after all base tabs, not draggable
        const search = w.find('.pd-tab-search')
        expect(search.exists()).toBe(true)
        expect(search.attributes('draggable')).toBeUndefined()
        // it comes after the last base tab in DOM order
        const all = w.findAll('.pd-tab')
        expect(all[all.length - 1].classes()).toContain('pd-tab-search')
    })
})

// ── Persistence round-trip (the "forever, across reload" guarantee) ───────────
// Exercises the REAL file-manager mixin methods against a controllable `this`
// with a live (jsdom) localStorage — the same seam App boots from.
describe('positionsTabOrder persistence (real file-manager mixin)', () => {
    const { saveStateToStorage, loadStateFromStorage } = fileManager.methods

    // Minimal host carrying every field saveStateToStorage reads.
    function fakeHost(over = {}) {
        return {
            getIndicatorSettings: () => ({}),
            selectedDataFile: '', selectedView: null, log_scale: false,
            indicatorVisibility: {}, persistentIndicatorVisibility: {}, accordionExpandedViews: {},
            corkyEnabled: {}, corkyLast: null, panelWidth: 300, rightPanelCollapsed: false,
            positionsDockOpen: true, positionsDockHeight: 240, positionsDockMaximized: false,
            positionsActiveTab: 'open', positionsTabOrder: [],
            saveStateToStorage, loadStateFromStorage,
            ...over,
        }
    }

    test('a reordered tab order survives a save → load cycle', () => {
        localStorage.clear()
        const order = ['backtests', 'strategy', 'open', 'historical', 'search']
        fakeHost({ positionsTabOrder: order }).saveStateToStorage()
        // A fresh host (simulating a page reload) reads it straight back.
        const restored = loadStateFromStorage.call(fakeHost())
        expect(restored.positionsTabOrder).toEqual(order)
    })

    test('the App restore rule accepts an array of string ids and drops the rest', () => {
        // Mirror of App.methods.loadState's restore snippet (kept in lockstep).
        const applyRestore = (host, saved) => {
            if (Array.isArray(saved.positionsTabOrder)) {
                host.positionsTabOrder = saved.positionsTabOrder.filter((id) => typeof id === 'string')
            }
        }
        const host = { positionsTabOrder: [] }
        applyRestore(host, { positionsTabOrder: ['strategy', 3, 'open', null] })
        expect(host.positionsTabOrder).toEqual(['strategy', 'open'])
        // A non-array saved value leaves the default untouched.
        applyRestore(host, { positionsTabOrder: 'nope' })
        expect(host.positionsTabOrder).toEqual(['strategy', 'open'])
    })

    test('setPositionsTabOrder stores the ids and persists (mirror of App.methods)', () => {
        localStorage.clear()
        // Mirror of App.methods.setPositionsTabOrder.
        const host = fakeHost()
        host.setPositionsTabOrder = function (o) {
            if (!Array.isArray(o)) return
            this.positionsTabOrder = o.filter((id) => typeof id === 'string')
            this.saveStateToStorage()
        }
        host.setPositionsTabOrder(['strategy', 'open', 42])
        expect(host.positionsTabOrder).toEqual(['strategy', 'open'])
        expect(JSON.parse(localStorage.getItem('trading-vue-state')).positionsTabOrder).toEqual(['strategy', 'open'])
    })
})
