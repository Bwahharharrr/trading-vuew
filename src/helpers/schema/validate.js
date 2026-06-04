
// Data validation for the ingestion seam (Phase 2).
//
// Validates the shapes accepted by DATA_FORMAT.md at the points where external
// data enters the system, turning silent corruption (NaN candles, mis-ordered
// timestamps, malformed overlays) into typed diagnostics. Dependency-free.
//
// Scope intentionally pragmatic & NON-BREAKING: it flags genuine structural
// problems (not array shape, non-finite OHLC, non-ascending/duplicate
// timestamps, missing overlay name/type/data) rather than enforcing every
// nuance — so existing real-world data keeps loading under the default 'warn'
// mode while problems become visible.

import { error, warn } from './diagnostics.js'

const isArr = Array.isArray
const isNum = (v) => typeof v === 'number' && Number.isFinite(v)
const isStr = (v) => typeof v === 'string' && v.length > 0

/**
 * Validate a single OHLCV candle row: [t, o, h, l, c, v, ...extras].
 * `prevTs` (optional) enables ascending-order / duplicate detection for feeds.
 * Pushes diagnostics into `out`. Returns nothing.
 */
export function validateCandle(row, path, out, prevTs) {
    if (!isArr(row)) {
        out.push(error('ohlcv.row.shape', 'candle is not an array', path))
        return
    }
    if (row.length < 6) {
        out.push(error(
            'ohlcv.row.length',
            `candle has ${row.length} fields, expected >= 6 [t,o,h,l,c,v]`,
            path))
        return
    }
    if (!isNum(row[0])) {
        out.push(error('ohlcv.row.time', `timestamp is not a finite number: ${row[0]}`, path))
    }
    for (let k = 1; k <= 4; k++) {
        if (!isNum(row[k])) {
            out.push(error('ohlcv.row.ohlc',
                `OHLC field [${k}] is not a finite number: ${row[k]}`, path))
        }
    }
    // volume may legitimately be 0/absent in some feeds — only flag non-number
    if (row[5] != null && typeof row[5] !== 'number') {
        out.push(warn('ohlcv.row.volume', `volume is not a number: ${row[5]}`, path))
    }
    if (prevTs != null && isNum(row[0])) {
        // Ordering issues are WARN, not ERROR: some legitimate feeds ship
        // same-timestamp rows per bar (handled by the live in-place-update
        // path), so flagging them must not make `strict` mode throw on data
        // the renderer accepts.
        if (row[0] === prevTs) {
            out.push(warn('ohlcv.order.duplicate',
                `duplicate timestamp ${row[0]}`, path))
        } else if (row[0] < prevTs) {
            out.push(warn('ohlcv.order.descending',
                `timestamp ${row[0]} < previous ${prevTs} (must be ascending)`, path))
        }
    }
}

/** Validate an OHLCV series. Caps per-issue noise; checks ordering across rows. */
export function validateOHLCV(data, basePath, out) {
    if (!isArr(data)) {
        out.push(error('ohlcv.shape', 'chart data is not an array', basePath))
        return
    }
    let prevTs
    let shapeErrs = 0
    for (let i = 0; i < data.length; i++) {
        const before = out.length
        validateCandle(data[i], `${basePath}[${i}]`, out, prevTs)
        // Stop spamming if the whole series is malformed; first few are enough.
        if (out.length > before) {
            shapeErrs++
            if (shapeErrs > 10) {
                out.push(warn('ohlcv.truncated',
                    `further row issues suppressed after ${i + 1} rows`, basePath))
                break
            }
        }
        const row = data[i]
        if (isArr(row) && isNum(row[0])) prevTs = row[0]
    }
}

/** Validate an onchart/offchart overlay object. */
function validateOverlay(ov, path, out) {
    if (!ov || typeof ov !== 'object') {
        out.push(error('overlay.shape', 'overlay is not an object', path))
        return
    }
    if (!isStr(ov.name)) {
        out.push(error('overlay.name', 'overlay missing string `name`', path))
    }
    if (!isStr(ov.type)) {
        out.push(error('overlay.type', 'overlay missing string `type`', path))
    }
    if (ov.data != null && !isArr(ov.data)) {
        out.push(error('overlay.data', '`data` is present but not an array', path))
    }
}

function validateDataset(ds, path, out) {
    if (!ds || typeof ds !== 'object') {
        out.push(error('dataset.shape', 'dataset is not an object', path))
        return
    }
    if (!isStr(ds.id)) out.push(error('dataset.id', 'dataset missing string `id`', path))
    if (!isStr(ds.type)) out.push(error('dataset.type', 'dataset missing string `type`', path))
    if (ds.data != null && !isArr(ds.data)) {
        out.push(error('dataset.data', '`data` is present but not an array', path))
    }
}

/**
 * Validate a full DataCube data object. Accepts both the short form
 * ({ ohlcv, onchart, offchart, datasets }) and the chart form
 * ({ chart: { data }, ... }). Multi-timeframe maps ({ '1m': {...} }) are
 * validated per-timeframe.
 *
 * @returns {{ ok: boolean, diagnostics: Diagnostic[] }}
 */
export function validateData(data) {
    const out = []

    if (!data || typeof data !== 'object') {
        out.push(error('data.shape', 'data is not an object', 'data'))
        return { ok: false, diagnostics: out }
    }

    // Multi-timeframe: top-level keys look like tf strings mapping to chart objs
    // (heuristic: a value that is an object with chart/ohlcv but no own chart at root).
    const looksSingle = 'chart' in data || 'ohlcv' in data ||
        'onchart' in data || 'offchart' in data || 'datasets' in data
    if (!looksSingle) {
        const tfs = Object.keys(data)
        let validatedAny = false
        for (const tf of tfs) {
            const sub = data[tf]
            if (sub && typeof sub === 'object' && ('chart' in sub || 'ohlcv' in sub)) {
                validatedAny = true
                const r = validateData(sub)
                for (const d of r.diagnostics) {
                    out.push({ ...d, path: `${tf}.${d.path || ''}` })
                }
            }
        }
        if (!validatedAny) {
            out.push(warn('data.empty',
                'data has no chart/ohlcv and is not a recognised multi-timeframe map', 'data'))
        }
        return { ok: !out.some((d) => d.level === 'error'), diagnostics: out }
    }

    // Single timeframe.
    const ohlcv = data.ohlcv != null
        ? data.ohlcv
        : (data.chart && data.chart.data)
    const ohlcvPath = data.ohlcv != null ? 'ohlcv' : 'chart.data'

    if (ohlcv == null) {
        out.push(error('chart.missing', 'no OHLCV series (chart.data / ohlcv)', 'chart'))
    } else {
        validateOHLCV(ohlcv, ohlcvPath, out)
    }

    for (const side of ['onchart', 'offchart']) {
        const arr = data[side]
        if (arr == null) continue
        if (!isArr(arr)) {
            out.push(error(`${side}.shape`, `${side} is present but not an array`, side))
            continue
        }
        arr.forEach((ov, i) => validateOverlay(ov, `${side}[${i}]`, out))
    }

    if (data.datasets != null) {
        if (!isArr(data.datasets)) {
            out.push(error('datasets.shape', 'datasets is present but not an array', 'datasets'))
        } else {
            data.datasets.forEach((ds, i) => validateDataset(ds, `datasets[${i}]`, out))
        }
    }

    return { ok: !out.some((d) => d.level === 'error'), diagnostics: out }
}
