// @vitest-environment jsdom
import { beforeEach, describe, expect, test } from 'vitest'
import { mount } from '@vue/test-utils'
import CorkyStrategyPanel from '../../src/components/feed/CorkyStrategyPanel.vue'
import fixture from '../fixtures/corky/strategy/examples/strategy-runtimes-ux-contract.event.json'

const runtimes = fixture.event.runtimes

function mountPanel(props = {}) {
    return mount(CorkyStrategyPanel, {
        props: {
            runtimes,
            selectedRuntimeId: runtimes[0].runtime_id,
            streaming: true,
            now: runtimes[0].generated_at_ms,
            ...props,
        },
    })
}

async function task(wrapper, label) {
    const button = wrapper.findAll('.sr-tab').find((row) => row.text() === label)
    await button.trigger('click')
}

beforeEach(() => window.localStorage.clear())

describe('responsive strategy task workspace', () => {
    test('compact and maximized presentations share the same selected runtime', () => {
        const compact = mountPanel({ maximized: false })
        const expanded = mountPanel({ maximized: true })
        expect(compact.find('.sr').classes()).not.toContain('maximized')
        expect(expanded.find('.sr').classes()).toContain('maximized')
        expect(compact.find('.sr-rt.active').text()).toContain(runtimes[0].runtime_id)
        expect(expanded.find('.sr-rt.active').text()).toContain(runtimes[0].runtime_id)
        expect(expanded.find('.sr-hier').exists()).toBe(true)
        expect(expanded.find('.sr-body').exists()).toBe(true)
    })

    test('persists the active task across a panel remount', async () => {
        const first = mountPanel()
        await task(first, 'Orders')
        expect(first.find('.sr-tab.active').text()).toBe('Orders')
        first.unmount()
        const restored = mountPanel({ maximized: true })
        expect(restored.find('.sr-tab.active').text()).toBe('Orders')
        expect(restored.find('.sr-body').text()).toContain('Local journal only')
    })

    test('assigns evidence to task-specific views without duplicating it in Overview', async () => {
        const wrapper = mountPanel()
        expect(wrapper.find('.sr-body').text()).not.toContain('Audit provenance')
        expect(wrapper.find('.sr-body').text()).not.toContain('Local journal only')
        await task(wrapper, 'Configuration')
        expect(wrapper.find('.sr-body').text()).toContain('Audit provenance')
        expect(wrapper.find('.sr-body').text()).toContain('Lineage')
        await task(wrapper, 'Administration')
        expect(wrapper.find('.sr-body').text()).toContain('Runtime administration')
        expect(wrapper.find('.sr-body').text()).toContain('Approval')
    })

    test('Tickers renders exact status reasons and selects its command target', async () => {
        const wrapper = mountPanel()
        await task(wrapper, 'Tickers')
        const cards = wrapper.findAll('.sr-ticker-card')
        expect(cards).toHaveLength(runtimes[0].tickers.length)
        expect(cards[0].text()).toContain(runtimes[0].tickers[0].status_reason)
        await cards[0].trigger('click')
        expect(cards[0].classes()).toContain('active')
        await wrapper.setProps({ maximized: true })
        await task(wrapper, 'Administration')
        expect(wrapper.find('.sr').classes()).toContain('maximized')
        expect(wrapper.find('.sr-body').text()).toContain(runtimes[0].tickers[0].ticker_id)
    })

    test('Activity combines immutable operations, grouped decisions, lifecycle, filters, and pagination', async () => {
        const tickerId = runtimes[0].tickers[0].ticker_id
        const decisions = [1, 2].map((value) => ({
            decision_id: `d${value}`, decision_ts_ms: 100 - value, ticker_id: tickerId,
            outcome: 'no_intents', reason: 'no entry signal', intents: [], risk_checks: [],
            ledger_deltas: [], claim_states: [],
        }))
        const operations = {
            live: true,
            projectionRevision: 'projection-revision-full',
            nextCursor: 'opaque-next',
            resumeCursor: 'opaque-resume',
            loading: false,
            error: null,
            events: [{
                event_id: 'op-1', ts_ms: 110, source: 'order', kind: 'order_partially_filled',
                ticker_id: tickerId, order_id: 'order-1', payload: { detail: 'partial fill recorded' },
            }],
            lifecycleIntervals: [{
                state: 'degraded', start_ms: 90, source: 'gateway', reason: 'auth reconciliation stale',
            }],
        }
        const wrapper = mountPanel({ decisions, operations })
        await task(wrapper, 'Activity')
        expect(wrapper.find('.sr-lifecycle').text()).toContain('auth reconciliation stale')
        expect(wrapper.findAll('.sr-activity-row')).toHaveLength(2)
        expect(wrapper.find('.activity-decision .sr-chip').text()).toBe('×2')
        expect(wrapper.find('.activity-operation').text()).toContain('partial fill recorded')
        expect(wrapper.find('.sr-payload pre').text()).toContain('partial fill recorded')
        expect(wrapper.findAll('.sr-layer-toggles input')).toHaveLength(6)
        await wrapper.findAll('.sr-layer-toggles input')[1].setValue(false)
        expect(wrapper.emitted('toggle-overlay').pop()[0]).toEqual({ kind: 'fill', enabled: false })
        const source = wrapper.find('.sr-activity-filters select')
        await source.setValue('order')
        expect(wrapper.findAll('.sr-activity-row')).toHaveLength(1)
        await wrapper.find('.sr-load-more').trigger('click')
        expect(wrapper.emitted('load-more-operations')).toBeTruthy()
    })

    test('Capital renders only server-computed money and valuation decimals', async () => {
        const money = {
            loading: false,
            error: null,
            data: {
                runtime_id: runtimes[0].runtime_id,
                generated_at_ms: runtimes[0].generated_at_ms,
                projection_revision: 'money-projection-revision',
                authority_scope: 'wallet_local',
                account_id: 'primary-account',
                quote_currency: 'TESTUSD',
                totals: {
                    observed_balance: '10000.0000000000000000001', observed_available: '9800',
                    allocated: '5000', unallocated: '4800', gross_exposure: '125',
                    realized_pnl: '30', unrealized_pnl: '12', fees: '2',
                    external_deposits: '100', external_withdrawals: '25',
                },
                valuation: {
                    status: 'current', as_of_ms: runtimes[0].generated_at_ms, source: 'public_market',
                    total_equity: '10042.0000000000000000001', total_unrealized_pnl: '12',
                },
                funding: [{
                    event_id: 'deposit-1', ts_ms: 1, direction: 'deposit', amount: '100.0000000000000000001',
                    currency: 'TESTUSD', classification: 'external', reason: 'TEST funding',
                }],
            },
        }
        const wrapper = mountPanel({ money })
        await task(wrapper, 'Capital')
        expect(wrapper.text()).toContain('10,000.0000000000000000001')
        expect(wrapper.text()).toContain('10,042.0000000000000000001')
        expect(wrapper.find('.sr-funding').text()).toContain('100.0000000000000000001')
    })

    test('Orders and Configuration expose detailed blockers and canonical lineage evidence', async () => {
        const runtime = {
            ...runtimes[0],
            ticker_orders: [{
                ...runtimes[0].ticker_orders[0],
                submitted_order_blockers: [{
                    order_key: 'order-1', side: 'buy', kind: 'market', quantity: '1',
                    remaining_quantity: '1', age_ms: 1200, auth_order_boundary: 'accepted',
                    exchange_boundary: 'no_exchange_response',
                    reason: 'submitted_nonterminal_order_needs_exchange_reconciliation',
                    suggested_action: 'review_auth_history_before_repair_or_resume',
                }],
            }],
            stale_order_forensics: {
                status: 'blocked', as_of_ms: 1, stale_nonterminal_order_count: 1,
                repairable_order_count: 0, blocked_order_count: 1,
                live_mutation_allowed_by_this_report: false,
                required_statement_for_repair: 'APPROVE_STALE_SUBMITTED_ORDER_REPAIR',
                reason: 'exchange history required', forbidden_mutations: ['send_orders'],
                report_path: '/tmp/report.json', repair_report_path: '/tmp/repair.json',
            },
        }
        const wrapper = mountPanel({ runtimes: [runtime], selectedRuntimeId: runtime.runtime_id })
        await task(wrapper, 'Orders')
        expect(wrapper.find('.sr-order-forensic').text()).toContain('submitted_nonterminal_order_needs_exchange_reconciliation')
        expect(wrapper.find('.sr-stale-forensics').text()).toContain('report is not approval')
        expect(wrapper.find('.sr-stale-forensics').text()).toContain('APPROVE_STALE_SUBMITTED_ORDER_REPAIR')
        await task(wrapper, 'Configuration')
        expect(wrapper.find('.sr-json').text()).toBe(runtimes[0].strategy_params_canonical_json)
        expect(wrapper.find('.sr-candidate-metrics').text()).toContain('institutional_score')
        expect(wrapper.find('.sr-candidate-metrics').text()).toContain('8.25')
        expect(wrapper.text()).toContain('public snapshots matched')
    })

    test('Administration renders automatic state and enforces compare → preview → exact approval', async () => {
        const now = runtimes[0].generated_at_ms
        const runtime = {
            ...runtimes[0],
            lineage_status: 'verified',
            runtime_control_available: true,
            automatic_allocation: {
                journal_path: '/tmp/automatic-allocation.jsonl', policy_configured: true,
                enabled: true, fault: null, global_enabled: true, wallet_enabled: true,
                strategy_enabled: true, policy_id: 'equal-v1', policy_version: 1,
                policy_hash: 'sha256:policy-hash', approved_by: 'operator', approved_at_ms: now - 1000,
                last_decision: { applied_amount: '20.0000000000000000001' },
                daily_digest: { remaining_unallocated: '0' },
            },
        }
        const proposal = {
            proposal_sha256: 'proposal-hash',
            input: { policy: { policy_id: 'equal-v1', policy_version: 1, kind: 'equal' } },
            total_newly_unallocated: '20.0000000000000000001',
            allocated_amount: '20.0000000000000000001', remaining_unallocated: '0',
            allocations: [{ ticker_id: runtime.tickers[0].ticker_id, amount: '10.0000000000000000001' }],
            ranking: [{ ticker_id: runtime.tickers[0].ticker_id, eligible: true, selected: true }],
        }
        const comparison = {
            runtime_id: runtime.runtime_id, as_of_ms: now, expires_at_ms: now + 300000,
            ledger_revision: 'ledger-1', projection_revision: 'rev-1', proposals: [proposal],
        }
        const wrapper = mountPanel({
            runtimes: [runtime], selectedRuntimeId: runtime.runtime_id, now,
            control: { available: true },
            operations: { projectionRevision: 'rev-1', events: [], lifecycleIntervals: [] },
            administration: { comparison, preview: null, result: null, pending: null, error: null },
        })
        await task(wrapper, 'Administration')
        expect(wrapper.text()).toContain('published state · read only')
        expect(wrapper.text()).toContain('equal-v1')
        expect(wrapper.text()).toContain('20.0000000000000000001')

        await wrapper.find('.sr-admin-actions button').trigger('click')
        expect(wrapper.emitted('compare-allocation').pop()[0]).toMatchObject({
            as_of_ms: now, expires_at_ms: now + 300000,
            policies: [{ policy_id: 'equal-v1', kind: 'equal' }], candidate_performance: [],
        })
        const identity = wrapper.findAll('.sr-admin-identity input')
        await identity[0].setValue('operator')
        await identity[1].setValue('allocation-op-1')
        await identity[2].setValue('reviewed comparison')
        await wrapper.find('.sr-proposal > button').trigger('click')
        expect(wrapper.emitted('preview-operation').pop()[0]).toMatchObject({
            actor: 'operator', idempotency_key: 'allocation-op-1', expected_revision: 'rev-1',
            operation: { type: 'approve_automatic_allocation_policy', reason: 'reviewed comparison' },
        })

        const preview = {
            runtime_id: runtime.runtime_id, actor: 'operator', idempotency_key: 'allocation-op-1',
            expected_revision: 'rev-1', created_at_ms: now, expires_at_ms: now + 300000,
            operation: { type: 'approve_automatic_allocation_policy', policy: proposal.input.policy },
            preview_hash: 'preview-hash-1',
        }
        await wrapper.setProps({ administration: { comparison, preview, result: null, pending: null, error: null } })
        const apply = wrapper.find('.sr-approval-entry .danger')
        expect(apply.attributes('disabled')).toBeDefined()
        await wrapper.find('.sr-approval-entry input').setValue('APPROVE preview-hash-1')
        expect(apply.attributes('disabled')).toBeUndefined()
        await apply.trigger('click')
        expect(wrapper.emitted('approve-operation').pop()[0]).toEqual({
            approval_statement: 'APPROVE preview-hash-1',
        })

        await wrapper.setProps({ administration: {
            comparison, preview: { ...preview, expires_at_ms: now - 1 },
            result: null, pending: null, error: null,
        } })
        await wrapper.find('.sr-approval-entry input').setValue('APPROVE preview-hash-1')
        expect(wrapper.find('.sr-approval-entry .danger').attributes('disabled')).toBeDefined()
        expect(wrapper.find('.sr-operation-preview').text()).toContain('expired')
    })

    test('Administration remains read-only for observer runtimes', async () => {
        const observer = {
            ...runtimes[0], mode: 'origin_observer', lineage_status: 'verified',
            runtime_control_available: false, mutations_halted_reason: 'origin observer is capability-fenced',
            automatic_allocation: null,
        }
        const wrapper = mountPanel({
            runtimes: [observer], selectedRuntimeId: observer.runtime_id,
            control: { available: true },
        })
        await task(wrapper, 'Administration')
        expect(wrapper.find('.sr-admin-unavailable').text()).toContain('observer runtimes have no allocation authority')
        expect(wrapper.find('.sr-admin-workflow').exists()).toBe(false)
        expect(wrapper.find('.sr-operation-preview').exists()).toBe(false)
    })
})
