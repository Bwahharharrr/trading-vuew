import { describe, expect, test } from 'vitest'
import fixture from '../fixtures/corky/strategy/strategy-ux-scenarios.json'

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
})
