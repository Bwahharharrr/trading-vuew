// @vitest-environment jsdom
//
// CorkyStrategyPanel — Phase 3 DIRECT-CONTROL surface gate. The panel is
// presentational: it renders the per-ticker control affordance (pause / resume /
// unlock / adopt / cancel submitted orders) ONLY when a control session is
// available, requires a visible operator reason, and EMITS an intent — it never
// mutates local state (App forwards to the feed and waits for reconciliation).
//
// Pins the GATE: (1) the control surface is HIDDEN when no control session; (2) a
// blocked/paused/locked/adoption ticker offers the right action; (3) the emitted
// intent payloads match the *.request.json command shapes (minus the wire `type`,
// which the client adds); (4) reason is mandatory; (5) unlock keeps a DECIMAL
// STRING amount and adopt coerces a numeric position_id.
import { test, expect, describe } from 'vitest'
import { mount } from '@vue/test-utils'
import CorkyStrategyPanel from '../../src/components/feed/CorkyStrategyPanel.vue'

import cancelReq from '../fixtures/corky/strategy/examples/cancel-strategy-ticker-orders.request.json'
import pauseReq from '../fixtures/corky/strategy/examples/pause-strategy-ticker.request.json'
import adoptOneReq from '../fixtures/corky/strategy/examples/adopt-strategy-position.request.json'

const AVAILABLE = { available: true, pending: false, awaiting: false, error: null }
const OFF = { available: false, pending: false, awaiting: false, error: null }

// The panel emits the command fields MINUS the wire `type` (the client adds it),
// so compare an intent payload against the fixture command with `type` stripped.
const cmdMinusType = (fx) => Object.fromEntries(Object.entries(fx.command).filter(([k]) => k !== 'type'))

// A runtime carrying tickers[] with the given per-ticker status + optional
// submitted-order blocker (via ticker_orders). runtime_id/ticker_id are set to
// the request-fixture values so an emitted payload can be matched byte-for-byte.
function mkRuntime(over = {}) {
  return {
    runtime_id: 'strategy-runtime-v8-test',
    process_kind: 'corky-strategy-runtime', state: 'Ready', mode: 'live',
    strategy: 'ema_regime_breakout_v8', strategy_id: 'ema_regime_breakout_v8',
    lineage_status: 'verified',
    runtime_control_available: true,
    tickers: [{ ticker_id: 'tTESTADA:TESTUSD', symbol: 'tTESTADA:TESTUSD', status: 'waiting' }],
    ticker_orders: [],
    ...over,
  }
}

function mountPanel(runtime, control = AVAILABLE, props = {}) {
  return mount(CorkyStrategyPanel, {
    props: { runtimes: [runtime], selectedRuntimeId: runtime.runtime_id, control, now: 0, ...props },
  })
}

// Select a ticker by clicking its hierarchy row (control targets the selection).
async function selectTicker(w, needle) {
  const row = w.findAll('.sr-ticker').find((r) => r.text().includes(needle))
  await row.trigger('click')
  return w
}
const btn = (w, label) => w.findAll('.sr-ctl-btn').find((b) => b.text() === label)

describe('control surface gating — hidden without a session', () => {
  test('no control section renders when control.available is false (even with a ticker selected)', async () => {
    const w = mountPanel(mkRuntime(), OFF)
    await selectTicker(w, 'tTESTADA:TESTUSD')
    expect(w.find('.sr-controls-off').exists()).toBe(true)     // the explicit "no session" note
    expect(w.findAll('.sr-ctl-btn')).toHaveLength(0)           // NO actionable controls
    expect(w.find('.sr-ctl-input').exists()).toBe(false)       // NO reason input
    expect(w.text()).toContain('no control session')
  })

  test('default control prop (absent) is treated as unavailable — no controls', async () => {
    const w = mount(CorkyStrategyPanel, {
      props: { runtimes: [mkRuntime()], selectedRuntimeId: 'strategy-runtime-v8-test', now: 0 },
    })
    await selectTicker(w, 'tTESTADA:TESTUSD')
    expect(w.findAll('.sr-ctl-btn')).toHaveLength(0)
  })

  test('controls appear once a session is available AND a ticker is selected', async () => {
    const w = mountPanel(mkRuntime(), AVAILABLE)
    // no ticker selected yet → no controls block
    expect(w.find('.sr-controls').exists()).toBe(false)
    await selectTicker(w, 'tTESTADA:TESTUSD')
    expect(w.find('.sr-controls').exists()).toBe(true)
    expect(btn(w, 'Pause').exists()).toBe(true)
  })

  test('a connected client cannot create controls for a capability-fenced runtime', async () => {
    const runtime = mkRuntime({
      mode: 'origin_observer',
      runtime_control_available: false,
      runtime_control_reason: 'origin observer is capability-fenced',
    })
    const w = mountPanel(runtime, AVAILABLE)
    await selectTicker(w, 'tTESTADA:TESTUSD')
    expect(w.findAll('.sr-ctl-btn')).toHaveLength(0)
    expect(w.find('.sr-ctl-unavailable').text()).toContain('origin observer is capability-fenced')
  })
})

describe('reason is mandatory (mutating a live runtime)', () => {
  test('clicking an action with no reason shows a validation error and emits NOTHING', async () => {
    const w = mountPanel(mkRuntime(), AVAILABLE)
    await selectTicker(w, 'tTESTADA:TESTUSD')
    await btn(w, 'Pause').trigger('click')
    expect(w.emitted('pause-ticker')).toBeFalsy()
    expect(w.find('.sr-ctl-msg.validation').text().toLowerCase()).toContain('reason is required')
  })
})

describe('emitted intents match the request-fixture command shapes', () => {
  test('cancel submitted orders → cancel-ticker-orders {runtime_id, ticker_id, reason}', async () => {
    const rt = mkRuntime({
      ticker_orders: [{ ticker_id: 'tTESTADA:TESTUSD', orders_submitted_nonterminal: 1, oldest_submitted_order_ts_ms: 1 }],
    })
    const w = mountPanel(rt, AVAILABLE)
    await selectTicker(w, 'tTESTADA:TESTUSD')
    // the blocked ticker offers the danger cancel action first
    const cancel = btn(w, 'Cancel submitted orders')
    expect(cancel.exists()).toBe(true)
    await w.find('#sr-ctl-reason').setValue(cancelReq.command.reason)
    await cancel.trigger('click')
    const payload = w.emitted('cancel-ticker-orders')[0][0]
    expect(payload).toEqual(cmdMinusType(cancelReq))
  })

  test('pause → pause-ticker {runtime_id, ticker_id, reason}', async () => {
    const w = mountPanel(mkRuntime(), AVAILABLE)
    await selectTicker(w, 'tTESTADA:TESTUSD')
    await w.find('#sr-ctl-reason').setValue(pauseReq.command.reason)
    await btn(w, 'Pause').trigger('click')
    expect(w.emitted('pause-ticker')[0][0]).toEqual(cmdMinusType(pauseReq))
  })

  test('resume → resume-ticker for a paused ticker', async () => {
    const rt = mkRuntime({ tickers: [{ ticker_id: 'tTESTADA:TESTUSD', symbol: 'tTESTADA:TESTUSD', status: 'paused' }] })
    const w = mountPanel(rt, AVAILABLE)
    await selectTicker(w, 'tTESTADA:TESTUSD')
    expect(btn(w, 'Pause')).toBeFalsy()          // paused → resume, not pause
    await w.find('#sr-ctl-reason').setValue('operator resume after review')
    await btn(w, 'Resume').trigger('click')
    expect(w.emitted('resume-ticker')[0][0]).toEqual({
      runtime_id: 'strategy-runtime-v8-test', ticker_id: 'tTESTADA:TESTUSD', reason: 'operator resume after review',
    })
  })

  test('unlock → unlock-ticker with new_allocation (amount stays a DECIMAL STRING)', async () => {
    const rt = mkRuntime({ tickers: [{ ticker_id: 'tTESTADA:TESTUSD', symbol: 'tTESTADA:TESTUSD', status: 'bust_locked' }] })
    const w = mountPanel(rt, AVAILABLE)
    await selectTicker(w, 'tTESTADA:TESTUSD')
    await w.find('#sr-ctl-reason').setValue('operator unlock after bust')
    await w.find('.sr-ctl-cur').setValue('TESTUSD')
    await w.find('.sr-ctl-amt').setValue('2500.50')
    await btn(w, 'Unlock').trigger('click')
    const payload = w.emitted('unlock-ticker')[0][0]
    expect(payload).toEqual({
      runtime_id: 'strategy-runtime-v8-test', ticker_id: 'tTESTADA:TESTUSD',
      reason: 'operator unlock after bust', new_allocation: { currency: 'TESTUSD', amount: '2500.50' },
    })
    expect(typeof payload.new_allocation.amount).toBe('string')   // never Number()-parsed
  })

  test('unlock without allocation inputs is blocked with a validation error', async () => {
    const rt = mkRuntime({ tickers: [{ ticker_id: 'tTESTADA:TESTUSD', symbol: 'tTESTADA:TESTUSD', status: 'bust_locked' }] })
    const w = mountPanel(rt, AVAILABLE)
    await selectTicker(w, 'tTESTADA:TESTUSD')
    await w.find('#sr-ctl-reason').setValue('operator unlock')
    await btn(w, 'Unlock').trigger('click')
    expect(w.emitted('unlock-ticker')).toBeFalsy()
    expect(w.find('.sr-ctl-msg.validation').exists()).toBe(true)
  })

  test('adopt → adopt-position with a numeric position_id (coerced from the string input)', async () => {
    const rt = mkRuntime({
      runtime_id: adoptOneReq.command.runtime_id,
      tickers: [{ ticker_id: adoptOneReq.command.ticker_id, symbol: 'tTESTADA:TESTUSD', status: 'adoption_required' }],
    })
    const w = mountPanel(rt, AVAILABLE, { selectedRuntimeId: adoptOneReq.command.runtime_id })
    await selectTicker(w, 'tTESTADA:TESTUSD')   // hierarchy rows show the symbol
    await w.find('#sr-ctl-reason').setValue(adoptOneReq.command.reason)
    await w.find('.sr-ctl-pos').setValue(String(adoptOneReq.command.position_id))
    await btn(w, 'Adopt position').trigger('click')
    const payload = w.emitted('adopt-position')[0][0]
    expect(payload).toEqual(cmdMinusType(adoptOneReq))
    expect(typeof payload.position_id).toBe('number')             // 77, not "77"
  })
})

describe('in-flight hint', () => {
  test('pending shows "sending…" and disables the action buttons; awaiting shows the reconciliation hint', async () => {
    const w = mountPanel(mkRuntime(), { available: true, pending: true, awaiting: false, error: null })
    await selectTicker(w, 'tTESTADA:TESTUSD')
    expect(w.find('.sr-ctl-state.pending').exists()).toBe(true)
    expect(btn(w, 'Pause').attributes('disabled')).toBeDefined()
    // awaiting holds the runtime_id the control was sent to → the hint shows only
    // for that (active) runtime.
    await w.setProps({ control: { available: true, pending: false, awaiting: 'strategy-runtime-v8-test', error: null } })
    expect(w.find('.sr-ctl-state.awaiting').text().toLowerCase()).toContain('awaiting reconciliation')
  })

  test('a send error surfaces in the control section', async () => {
    const w = mountPanel(mkRuntime(), { available: true, pending: false, awaiting: false, error: 'missing or stale runtime control session' })
    await selectTicker(w, 'tTESTADA:TESTUSD')
    expect(w.find('.sr-ctl-msg.error').text()).toContain('stale runtime control session')
  })
})
