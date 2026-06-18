// @vitest-environment jsdom
//
// PositionAuditDrawer — controlled modal rendering the get_auth_position_audit /
// auth_position_audit_update bundle: position identity, reconciliation summary,
// linked orders + trades, a status badge, and summary.reasons when the bundle is
// degraded / incomplete / missing.
import { test, expect, describe } from 'vitest'
import { mount } from '@vue/test-utils'
import PositionAuditDrawer from '../../src/components/feed/PositionAuditDrawer.vue'
import { authPositionAuditEvent } from '../fixtures/corky/index.js'

const audit = authPositionAuditEvent.event.audit

function mountDrawer(props = {}) {
    return mount(PositionAuditDrawer, { props: { open: true, audit, ...props } })
}

describe('PositionAuditDrawer', () => {
    test('hidden until open', () => {
        const w = mount(PositionAuditDrawer, { props: { open: false, audit } })
        expect(w.find('.pad-modal').exists()).toBe(false)
    })

    test('renders header symbol/id and a complete status badge', () => {
        const w = mountDrawer()
        expect(w.find('.pad-sym').text()).toBe('tBTCUSD')
        expect(w.find('.pad-id').text()).toContain('77')
        const badge = w.find('.pad-badge')
        expect(badge.text()).toBe('complete')
        expect(badge.classes()).toContain('st-complete')
    })

    test('renders summary metrics, orders and trades from the fixture', () => {
        const w = mountDrawer()
        const text = w.text()
        expect(text).toContain('0.25')        // trade_amount_sum / amounts (decimal string)
        expect(text).toContain('9001')        // order id
        expect(text).toContain('7001')        // trade id
        expect(text).toContain('USD')         // fee currency
        expect(w.findAll('.pad-table')).toHaveLength(2)  // orders + trades
    })

    test('decimal strings render verbatim (no float parse)', () => {
        const precise = JSON.parse(JSON.stringify(audit))
        precise.position.base_price = '42000.500000000000001'
        const w = mountDrawer({ audit: precise })
        expect(w.text()).toContain('42000.500000000000001')
    })

    test('missing audit shows the on-disk note, not an error', () => {
        const missing = {
            venue: 'BITFINEX', account_id: 'paper-a', symbol: 'tBTCUSD', position_id: 5,
            position: { status: 'missing', side: 'unknown', amount: '0', base_price: '0' },
            summary: { status: 'missing', order_count: 0, trade_count: 0, trade_amount_sum: '0', expected_position_amount: '0', amount_delta: '0', reasons: [] },
            orders: [], trades: [],
        }
        const w = mountDrawer({ audit: missing })
        expect(w.find('.pad-badge').classes()).toContain('st-missing')
        expect(w.text()).toContain('No audit on disk')
    })

    test('degraded audit surfaces summary.reasons', () => {
        const degraded = JSON.parse(JSON.stringify(audit))
        degraded.summary.status = 'degraded'
        degraded.summary.reasons = ['orders REST window exceeded', 'missing trade 7002']
        const w = mountDrawer({ audit: degraded })
        expect(w.find('.pad-badge').classes()).toContain('st-degraded')
        expect(w.text()).toContain('orders REST window exceeded')
        expect(w.text()).toContain('missing trade 7002')
    })

    test('error banner shows while the last-good bundle stays rendered', () => {
        const w = mountDrawer({ error: 'auth_position_audit_unavailable: disk read error' })
        expect(w.find('.pad-error').text()).toContain('auth_position_audit_unavailable')
        expect(w.text()).toContain('9001')   // last-good orders still shown
    })

    test('close button and backdrop emit close', async () => {
        const w = mountDrawer()
        await w.find('.pad-close').trigger('click')
        await w.find('.pad-overlay').trigger('click')   // self-click on backdrop
        expect(w.emitted('close').length).toBeGreaterThanOrEqual(1)
    })
})
