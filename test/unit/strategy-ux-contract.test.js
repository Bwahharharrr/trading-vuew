import { describe, expect, test } from 'vitest'
import fixture from '../fixtures/corky/strategy/strategy-ux-scenarios.json'
import { strategyRuntimeSemantics } from '../../src/helpers/feed/corky-strategy-transforms.js'

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
        expect(semantics.mode.label).toBe('Origin Observer')
        expect(semantics.authority).toMatchObject({
            status: 'read_only',
            label: 'Money mutations fenced',
            reason: 'origin_observer_money_mutations_fenced',
        })
        expect(semantics.auth.status).toBe('not_applicable')
        expect(semantics.allocation.status).toBe('not_applicable')
        expect(semantics.runtimeControl.available).toBe(false)
        expect(semantics.primaryReason).toBe('origin_observer_money_mutations_fenced')
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
    })

    test('uses the exact published degraded and allocation-blocked reasons', () => {
        const degraded = fixture.scenarios.find(({ id }) => id === 'degraded')
        const allocation = fixture.scenarios.find(({ id }) => id === 'allocation_blocked')
        expect(strategyRuntimeSemantics(degraded.runtime).primaryReason).toBe('market_data_continuity_gap')
        expect(strategyRuntimeSemantics(allocation.runtime).primaryReason).toBe('allocation ledger revision mismatch')
    })
})
