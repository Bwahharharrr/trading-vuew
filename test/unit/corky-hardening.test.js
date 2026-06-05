// Regression tests for the post-review hardening of the Corky feed foundation.
// These pin two contract decisions made while resolving the adversarial review:
//   1. kindOf tolerates BOTH wire forms — 'sma:20' (examples) AND 'SMA(20)'
//      (the contract's candle_row_shape, keyed by display_label).
//   2. A non-user socket drop fails in-flight requests with a RETRYABLE
//      'connection_lost' error instead of hanging forever.
//   3. applyLiveUpdate drops foreign-timeframe rows when the chart-data object
//      is tagged with its timeframe (single-timeframe invariant).

import { describe, it, expect } from 'vitest'
import { buildChartData, applyLiveUpdate } from '../../src/helpers/feed/corky-ingest.js'
import { CorkyClient } from '../../src/helpers/feed/corky-client.js'

const row = (ts, tf, indicators) => ({
    timeframe: tf,
    candle: { timestamp_ms: ts, open: '100', high: '101', low: '99', close: '100.5', volume: '1' },
    indicators,
})

describe('ingest hardening', () => {
    it('places a display_label-keyed indicator (SMA(20)) on-chart, like sma:20', () => {
        const labelForm = buildChartData([row(1, '1m', { 'SMA(20)': { sma: '100.25' } })])
        const colonForm = buildChartData([row(1, '1m', { 'sma:20': { sma: '100.25' } })])
        // sma is a price overlay → onchart in BOTH wire forms (the bug was that
        // the display_label form silently fell back to an off-chart Spline).
        expect(labelForm.onchart).toHaveLength(1)
        expect(labelForm.offchart).toHaveLength(0)
        expect(labelForm.onchart[0].type).toBe(colonForm.onchart[0].type)
        expect(labelForm.onchart[0].data).toEqual([[1, 100.25]])
    })

    it('drops a foreign-timeframe live row when the chart-data is tagged', () => {
        const chart = buildChartData([row(1000, '1m', null)])
        chart.timeframe = '1m'
        const seqs = {}
        const before = chart.chart.data.length
        const res = applyLiveUpdate(
            chart,
            { subscription_id: 's', sequence: 1, row: row(2000, '5m', null) },
            seqs
        )
        expect(res.applied).toBe(false)
        expect(chart.chart.data.length).toBe(before) // foreign-tf row NOT mixed in
        // A matching-timeframe row IS applied.
        const ok = applyLiveUpdate(
            chart,
            { subscription_id: 's', sequence: 2, row: row(2000, '1m', null) },
            seqs
        )
        expect(ok.applied).toBe(true)
        expect(chart.chart.data.length).toBe(before + 1)
    })
})

describe('client hardening', () => {
    // Minimal fake socket — captures sends, lets the test drive open/drop.
    class FakeSocket {
        constructor(url) { this.url = url; this.onopen = this.onmessage = this.onclose = this.onerror = null }
        send() {}
        close() { if (this.onclose) this.onclose({ code: 1000 }) }
        open() { if (this.onopen) this.onopen({}) }
        drop(code = 1006) { if (this.onclose) this.onclose({ code }) }
    }

    it('fails an in-flight request with a retryable connection_lost on a non-user drop', async () => {
        let sock
        const client = new CorkyClient({
            url: 'ws://fake/corky',
            socketFactory: (url) => (sock = new FakeSocket(url)),
            backoff: false,
        })
        client.connect()
        sock.open()
        const pending = client.listCandleStates() // never answered
        sock.drop(1006) // simulate a network drop (not a user close)
        await expect(pending).rejects.toMatchObject({ code: 'connection_lost', retryable: true })
    })
})
