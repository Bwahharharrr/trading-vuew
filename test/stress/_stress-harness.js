
// 600-ticks/sec live-feed stress harness (Phase 3.1b gate).
//
// Drives the REAL DataCube live-update path (update({candle}) -> AggTool.push
// -> fast_merge -> touchData) headlessly, with a Vue reactive watcher counting
// render invalidations exactly as Chart.dataHashKey / Grid.dataKey do. It
// establishes the machine-checkable baseline the 3.1b reactivity rewrite must
// meet or beat — turning the vague "no thrash" gate into concrete budgets:
//   - tick collapse: N same-candle ticks between flushes => 1 render,
//   - render invalidations == touchData calls == flushes-with-changes,
//   - correctness: final candle reflects the latest tick; new candles append,
//   - throughput: sustains 600 ticks/sec comfortably.
//
// AggTool's auto-flush (setTimeout + requestAnimationFrame) is bypassed so
// flushes are deterministic: we clear the pending timer and call agg.update()
// at controlled points. requestAnimationFrame is stubbed (Node has none).

import { watch } from 'vue'
import DataCube from '../../src/helpers/datacube.js'

export function setupStressDc(seed, opts = {}) {
    const TF = opts.tf || 60000

    // Stub RAF/CAF (Node has none); we drive flushes manually anyway.
    const hadRaf = 'requestAnimationFrame' in globalThis
    const prevRaf = globalThis.requestAnimationFrame
    const prevCaf = globalThis.cancelAnimationFrame
    globalThis.requestAnimationFrame = () => 0
    globalThis.cancelAnimationFrame = () => {}

    const dc = new DataCube(
        { ohlcv: seed.map((r) => r.slice()) },
        { aggregation: opts.aggregation ?? 100, scripts: false, auto_scroll: false, validation: 'off' }
    )

    // Build chart.data / dataVersion structure (init_tvjs needs a full $root and
    // also wires the settings/ids/datasets watchers we don't want here).
    dc.init_data()

    // Sync watcher on the store revision via the SAME data.$cd back-ref the real
    // component reads (Phase 3.1b-final). flush:'sync' => fires once per
    // cd.invalidate() / touchData().
    let renders = 0
    const stop = watch(() => dc.data.$cd.revision(), () => { renders++ }, { flush: 'sync' })

    // Count touchData calls to assert the reactive bridge is 1:1 (no missed /
    // duplicate fires).
    let touches = 0
    const origTouch = dc.touchData.bind(dc)
    dc.touchData = () => { touches++; origTouch() }

    // Minimal tv stub: update_candle reads $refs.chart.interval_ms.
    dc.tv = {
        $refs: { chart: { interval_ms: TF } },
    }

    function flush() {
        if (dc.agg.st_id) { clearTimeout(dc.agg.st_id); dc.agg.st_id = null }
        dc.agg.update()
        if (dc.agg.st_id) { clearTimeout(dc.agg.st_id); dc.agg.st_id = null }
    }

    function tick(candle) {
        dc.update({ candle })
    }

    function teardown() {
        stop()
        dc.agg.destroy()
        if (hadRaf) { globalThis.requestAnimationFrame = prevRaf; globalThis.cancelAnimationFrame = prevCaf }
        else { delete globalThis.requestAnimationFrame; delete globalThis.cancelAnimationFrame }
    }

    return {
        dc,
        tf: TF,
        tick,
        flush,
        teardown,
        get renders() { return renders },
        get touches() { return touches },
        lastCandle: () => dc.data.chart.data[dc.data.chart.data.length - 1],
        candleCount: () => dc.data.chart.data.length,
    }
}

// Percentile helper for latency budgets.
export function percentile(samples, q) {
    if (!samples.length) return 0
    const s = samples.slice().sort((a, b) => a - b)
    return s[Math.min(s.length - 1, Math.floor(q * (s.length - 1)))]
}
