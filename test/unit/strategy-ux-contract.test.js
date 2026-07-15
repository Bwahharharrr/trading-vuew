import { describe, expect, test } from 'vitest'
import fixture from '../fixtures/corky/strategy/strategy-ux-scenarios.json'
import {
    strategyRuntimeSemantics,
    strategyDisplayName,
    strategyDecisionPresentation,
} from '../../src/helpers/feed/corky-strategy-transforms.js'

describe('strategy UX semantic contract', () => {
    test('covers every required operator scenario exactly once', () => {
        const ids = fixture.scenarios.map((scenario) => scenario.id)
        expect(ids).toEqual([
            'ready_observer',
            'ready_executable',
            'degraded',
            'stale_disconnected',
            'allocation_blocked',
            'automatic_allocation',
        ])
        expect(new Set(ids).size).toBe(ids.length)
    })

    test('observer readiness never implies financial authority', () => {
        const scenario = fixture.scenarios.find(({ id }) => id === 'ready_observer')
        expect(scenario.runtime.state).toBe('Ready')
        expect(scenario.runtime.auth_ready).toBe(true)
        expect(scenario.runtime.auth_gate_configured).toBe(false)
        expect(scenario.runtime.allocation_ready).toBe(true)
        expect(scenario.runtime.allocation_configured).toBe(false)
        expect(scenario.expected).toMatchObject({
            authority: 'read_only',
            auth: 'not_applicable',
            allocation: 'not_applicable',
            actions: [],
        })
    })

    test('financial fixture values remain exact decimal strings', () => {
        const moneyFields = fixture.scenarios.flatMap(({ runtime }) => [
            runtime.allocation_unallocated_available,
            runtime.automatic_allocation && runtime.automatic_allocation.remaining_unallocated,
        ]).filter((value) => value != null)
        expect(moneyFields.length).toBeGreaterThan(0)
        expect(moneyFields.every((value) => typeof value === 'string')).toBe(true)
    })

    test('keeps observer health separate from its fenced authority', () => {
        const scenario = fixture.scenarios.find(({ id }) => id === 'ready_observer')
        const semantics = strategyRuntimeSemantics(scenario.runtime, {
            nowMs: scenario.runtime.generated_at_ms + 1_000,
            streaming: true,
        })
        expect(semantics.health).toMatchObject({ state: 'Ready', ready: true })
        expect(semantics.mode.label).toBe('Monitoring only')
        expect(semantics.mode.description).toContain('cannot place orders or change balances')
        expect(semantics.authority).toMatchObject({
            status: 'read_only',
            label: 'Cannot place orders or change balances',
            reason: 'origin_observer_money_mutations_fenced',
        })
        expect(semantics.auth.status).toBe('not_applicable')
        expect(semantics.allocation.status).toBe('not_applicable')
        expect(semantics.runtimeControl.available).toBe(false)
        expect(semantics.primaryReason).toBeNull()
    })

    test('presents strategy identity and observer decisions without wire vocabulary', () => {
        const scenario = fixture.scenarios.find(({ id }) => id === 'ready_observer')
        expect(strategyDisplayName(scenario.runtime)).toBe('EMA Regime Breakout V8')
        expect(strategyDecisionPresentation(scenario.runtime.recent_decisions[0], scenario.runtime.mode)).toEqual({
            label: 'Order not sent',
            tone: 'neutral',
            detail: 'Expected while monitoring only — this runtime cannot place orders or change balances.',
        })
    })

    test('presents a shadow-live duplicate exit as a local unsent queue hold', () => {
        const reason = 'tTESTADA:TESTUSD: sell quantity 23.81686873 exceeds sellable quantity 0.00000000 (tracked long 23.81686873 minus 23.81686873 pending sell)'
        expect(strategyDecisionPresentation({ outcome: 'intent_denied', reason }, 'shadow_live')).toEqual({
            label: 'Exit already queued locally',
            tone: 'neutral',
            detail: 'A sell for 23.81686873 is already queued locally in this live-data simulation. It was not sent to the exchange; repeated exit signals are being safely suppressed.',
        })
        expect(strategyRuntimeSemantics({
            state: 'Ready',
            mode: 'shadow_live',
            mutations_halted_reason: reason,
        }).authority).toMatchObject({
            status: 'simulated_pending',
            tone: 'neutral',
            label: 'Exchange orders disabled',
        })

        const livePresentation = strategyDecisionPresentation({ outcome: 'intent_denied', reason }, 'live')
        expect(livePresentation).toMatchObject({ label: 'Strategy action blocked', tone: 'attention' })
    })

    test('reports freshness independently from a Ready snapshot', () => {
        const scenario = fixture.scenarios.find(({ id }) => id === 'stale_disconnected')
        const semantics = strategyRuntimeSemantics(scenario.runtime, {
            nowMs: scenario.client.now_ms,
            streaming: scenario.client.streaming,
        })
        expect(semantics.health.state).toBe('Ready')
        expect(semantics.freshness.status).toBe('disconnected')
        expect(semantics.freshness.label).not.toBe('Live')
        expect(semantics.currentStatus).toMatchObject({ known: false, ready: false, label: 'Status unknown' })
    })

    test('describes non-live modes without implying exchange order authority', () => {
        const paper = fixture.scenarios.find(({ id }) => id === 'ready_executable')
        const shadow = fixture.scenarios.find(({ id }) => id === 'degraded')
        expect(strategyRuntimeSemantics(paper.runtime).authority.label).toBe('Simulated orders only')
        expect(strategyRuntimeSemantics(shadow.runtime).mode.label).toBe('Live-data simulation')
        expect(strategyRuntimeSemantics({ ...shadow.runtime, mutations_halted_reason: null }).authority.label)
            .toBe('Exchange orders disabled')
    })

    test('uses the exact published degraded and allocation-blocked reasons', () => {
        const degraded = fixture.scenarios.find(({ id }) => id === 'degraded')
        const allocation = fixture.scenarios.find(({ id }) => id === 'allocation_blocked')
        expect(strategyRuntimeSemantics(degraded.runtime).primaryReason).toBe('market_data_continuity_gap')
        expect(strategyRuntimeSemantics(allocation.runtime).primaryReason).toBe('allocation ledger revision mismatch')
    })
})
