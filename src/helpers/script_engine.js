
// Script engine, Fuck yeah

import ScriptEnv from './script_env.js'
import Utils from '../stuff/utils.js'
import * as u from './script_utils.js'
import symstd from './symstd.js'
import TS from './script_ts.js'
import Const from '../stuff/constants.js'
import scriptState from './script_state.js'

const { DEF_LIMIT } = Const
const WAIT_EXEC = 10  // merge script execs, ms

// Display-only settings that don't affect indicator computation
// Changes to these should NOT trigger full re-execution
const DISPLAY_ONLY_SETTINGS = new Set([
    // Colors
    'color', 'lineColor', 'fillColor', 'upColor', 'downColor',
    'wickUpColor', 'wickDownColor', 'borderUpColor', 'borderDownColor',
    'backgroundColor', 'textColor', 'labelColor', 'crossColor',
    // Line styles
    'lineWidth', 'lineStyle', 'lineDash', 'opacity', 'alpha',
    // Display toggles
    'showLabels', 'showLegend', 'showValues', 'showPrice',
    'visible', 'display', 'showBands', 'showFill',
    // Visual formatting
    'precision', 'prec', 'zIndex', 'z'
])

// PERFORMANCE: Fast deep copy for script cache data
// Much faster than JSON.parse(JSON.stringify()) for typical indicator data structures
function fastDeepCopy(obj) {
    if (obj === null || typeof obj !== 'object') return obj
    if (Array.isArray(obj)) {
        // For arrays, use slice for shallow arrays or map for nested
        if (obj.length === 0) return []
        // Check if first element is primitive (common case for indicator data)
        const first = obj[0]
        if (first === null || typeof first !== 'object') {
            return obj.slice()  // Fast path for primitive arrays
        }
        // Nested array - recurse
        const copy = new Array(obj.length)
        for (let i = 0; i < obj.length; i++) {
            copy[i] = fastDeepCopy(obj[i])
        }
        return copy
    }
    // Object - copy properties
    const copy = {}
    for (const key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
            copy[key] = fastDeepCopy(obj[key])
        }
    }
    return copy
}

// Yield frequency for long-running script execution (in iterations)
const YIELD_FREQUENCY = 2000  // Yield every 2000 candles for better responsiveness

export class ScriptEngine {

    constructor() {
        this.map = {}
        this.data = {}
        this.exec_id = null
        this.queue = []         // Script exec queue
        this.delta_queue = []   // Settings queue
        this.update_queue = []  // Live update queue
        this.sett = {}
        this.state = {}
        this.mods = {}          // Modules (extensions)
        this.std_plus = {}      // Functions to inject
        this.tf = undefined     // Main chart TF

        // === PERFORMANCE OPTIMIZATION: Script output cache ===
        // Caches computed outputs to avoid re-execution when only display settings change
        this._outputCache = new Map()  // scriptId -> { hash, data, onchart, offchart }
        this._dataHash = null          // Hash of current OHLCV data for cache invalidation

        // PERF: Cache for make_mods_hooks() bound functions
        this._hooksCache = {}          // hookName -> bound function array
        this._hooksModsKey = null      // Serialized mods keys for invalidation

        // PERF: Pre-built template for format_update() fast path
        this._updateTemplate = null    // Flat array of { id, src } for fast tick updates

        // Set up function references in shared state (breaks circular deps)
        // Use arrow functions to defer method lookup until call time,
        // since this.send is defined externally after construction
        scriptState.send = (...args) => this.send(...args)
        scriptState.std_inject = (...args) => this.std_inject(...args)
        scriptState.match_ds = (...args) => this.match_ds(...args)
    }

    // === PERFORMANCE: Compute hash for computation-affecting settings ===
    // Only settings NOT in DISPLAY_ONLY_SETTINGS affect computation
    _computationHash(script) {
        const props = script.src?.props || {}
        const sett = script.sett || {}
        const parts = []

        // Include script source code hash (if code changes, must recompute)
        if (script.src?.init) parts.push('i:' + script.src.init.toString().length)
        if (script.src?.update) parts.push('u:' + script.src.update.toString().length)

        // Include only computation-affecting props
        for (const key in props) {
            if (!DISPLAY_ONLY_SETTINGS.has(key)) {
                const val = props[key].val !== undefined ? props[key].val : props[key].def
                // PERF: Avoid JSON.stringify for primitives
                const sv = val !== null && typeof val === 'object' ? JSON.stringify(val) : String(val)
                parts.push(`${key}:${sv}`)
            }
        }

        // Include computation-affecting settings
        for (const key in sett) {
            if (!DISPLAY_ONLY_SETTINGS.has(key)) {
                const sv = sett[key] !== null && typeof sett[key] === 'object' ? JSON.stringify(sett[key]) : String(sett[key])
                parts.push(`s.${key}:${sv}`)
            }
        }

        return parts.sort().join('|')
    }

    // === PERFORMANCE: Compute hash of OHLCV data for cache invalidation ===
    _computeDataHash() {
        const ohlcv = this.data?.ohlcv?.data
        if (!ohlcv || !ohlcv.length) return ''
        // Hash based on length and first/last timestamps
        return `${ohlcv.length}:${ohlcv[0]?.[0]}:${ohlcv[ohlcv.length - 1]?.[0]}`
    }

    // === PERFORMANCE: Check if only display settings changed ===
    _isDisplayOnlyChange(delta, scriptId) {
        if (!delta || !delta[scriptId]) return false
        const changes = delta[scriptId]
        for (const key in changes) {
            if (!DISPLAY_ONLY_SETTINGS.has(key)) {
                return false  // Found a computation-affecting change
            }
        }
        return true  // All changes are display-only
    }

    // === PERFORMANCE: Restore script output from cache ===
    _restoreFromCache(scriptId) {
        const cached = this._outputCache.get(scriptId)
        if (!cached) return false

        const script = this.map[scriptId]
        if (!script || !script.env) return false

        // Restore cached data using fast deep copy
        script.env.data = cached.data.slice()  // Shallow copy is sufficient
        script.env.onchart = fastDeepCopy(cached.onchart || {})
        script.env.offchart = fastDeepCopy(cached.offchart || {})

        return true
    }

    // === PERFORMANCE: Save script output to cache ===
    _saveToCache(scriptId) {
        const script = this.map[scriptId]
        if (!script || !script.env) return

        // Evict oldest entries if cache exceeds max size
        if (this._outputCache.size > 50) {
            const firstKey = this._outputCache.keys().next().value
            this._outputCache.delete(firstKey)
        }

        const hash = this._computationHash(script)
        this._outputCache.set(scriptId, {
            hash,
            dataHash: this._dataHash,
            data: script.env.data.slice(),  // Shallow copy
            onchart: fastDeepCopy(script.env.onchart || {}),
            offchart: fastDeepCopy(script.env.offchart || {})
        })
    }

    // === PERFORMANCE: Check if cache is valid for a script ===
    _isCacheValid(scriptId) {
        const cached = this._outputCache.get(scriptId)
        if (!cached) return false

        const script = this.map[scriptId]
        if (!script) return false

        // Check if data changed
        if (cached.dataHash !== this._dataHash) return false

        // Check if computation settings changed
        const currentHash = this._computationHash(script)
        return cached.hash === currentHash
    }

    // Sync runtime state to shared module (for script_env and script_std)
    syncState() {
        scriptState.t = this.t
        scriptState.tf = this.tf
        scriptState.iter = this.iter
        scriptState.data = this.data
        scriptState.shared = this.shared
        scriptState.mods = this.mods
    }

    exec_all() {

        clearTimeout(this.exec_id)

        // Wait for the data
        if (!this.data.ohlcv) return

        // === PERFORMANCE: Update data hash for cache invalidation ===
        this._dataHash = this._computeDataHash()

        // Execute queue after all scripts & data are loaded
        this.exec_id = setTimeout(async () => {

            if (!this.init_state(Object.keys(this.map))) {
                return
            }
            this.re_init_map()

            while (this.queue.length) {
                this.exec(this.queue.shift())
            }

            if (Object.keys(this.map).length) {
                await this.run()

                // === PERFORMANCE: Cache all script outputs ===
                for (let id in this.map) {
                    this._saveToCache(id)
                }

                this.drain_queues()
            }

            this.send_state()

        }, WAIT_EXEC)
    }

    // Exec selected
    async exec_sel(delta) {

        // Wait for the data
        // TODO: Check data requirements
        if (!this.data.ohlcv) return

        let sel = Object.keys(delta).filter(x => x in this.map)

        // === PERFORMANCE: Check which scripts actually need re-execution ===
        const needsReExec = []
        const displayOnlyChanges = []

        for (let id of sel) {
            if (!this.map[id]) continue

            // Check if this is a display-only change
            if (this._isDisplayOnlyChange(delta, id) && this._isCacheValid(id)) {
                displayOnlyChanges.push(id)
            } else {
                needsReExec.push(id)
            }

            // Apply the delta to props regardless
            let props = this.map[id].src.props || {}
            for (let k in props) {
                if (k in delta[id]) {
                    props[k].val = delta[id][k]
                }
            }
        }

        // === PERFORMANCE: Handle display-only changes without re-execution ===
        if (displayOnlyChanges.length > 0) {
            // Restore from cache and send updated data
            for (let id of displayOnlyChanges) {
                this._restoreFromCache(id)
            }

            // If ALL changes are display-only, skip expensive re-execution
            if (needsReExec.length === 0) {
                this.send('overlay-data', this.format_map(sel))
                this.send_state()
                return
            }
        }

        // === Continue with normal re-execution for computation-affecting changes ===
        if (!this.init_state(needsReExec)) {
            this.delta_queue.push(delta)
            return
        }

        for (let id of needsReExec) {
            if (!this.map[id]) continue
            this.exec(this.map[id])
        }

        await this.run(needsReExec)

        // === PERFORMANCE: Cache the results for future use ===
        for (let id of needsReExec) {
            this._saveToCache(id)
        }

        this.drain_queues()
        this.send_state()

    }

    // Exec script (create a new ScriptEnv, add to the map)
    exec(s) {

        if (!s.src.conf) s.src.conf = {}

        if (s.src.init) {
            s.src.init_src = u.get_raw_src(s.src.init)
        }
        if (s.src.update) {
            s.src.upd_src = u.get_raw_src(s.src.update)
        }
        if (s.src.post) {
            s.src.post_src = u.get_raw_src(s.src.post)
        }

        // Parse non-default symbols
        symstd.parse(s)

        for (let id in this.mods) {
            if (this.mods[id].pre_env) {
                this.mods[id].pre_env(s.uuid, s)
            }
        }

        s.env = new ScriptEnv(s, Object.assign(this.shared, {
            open: this.open,
            high: this.high,
            low: this.low,
            close: this.close,
            vol: this.vol,
            dss: this.data,
            t: () => this.t,
            iter: () => this.iter,
            tf: this.tf,
            range: this.range,
            onclose: true
        }, this.tss))

        this.map[s.uuid] = s
        this._updateTemplate = null  // Invalidate update template

        for (let id in this.mods) {
            if (this.mods[id].new_env) {
                this.mods[id].new_env(s.uuid, s)
            }
        }

        // Build te box after mod's interfaces injected
        s.env.build()
    }

    // Live update
    update(candles) {

        if (!this.data.ohlcv || !this.data.ohlcv.data.length) {
            return
        }

        if (this.running) {
            this.update_queue.push(candles)
            return
        }

        let mfs1 = this.make_mods_hooks('pre_step')
        let mfs2 = this.make_mods_hooks('post_step')

        // PERF: Cache mod-hook presence checks
        const hasMods1 = mfs1.length > 0
        const hasMods2 = mfs2.length > 0

        let step = (sel, unshift) => {
            if (hasMods1) {
                for (let m = 0; m < mfs1.length; m++) mfs1[m](sel)
            }

            // PERF: Indexed loop avoids iterator protocol overhead
            for (let j = 0; j < sel.length; j++) {
                this.map[sel[j]].env.step(unshift)
            }

            if (hasMods2) {
                for (let m = 0; m < mfs2.length; m++) mfs2[m](sel)
            }
        }

        try {
            let ohlcv = this.data.ohlcv.data
            let i = ohlcv.length - 1
            let last = ohlcv[i]
            let sel = Object.keys(this.map)
            let unshift = false
            this.shared.event = 'update'

            for (let candle of candles) {
                if (candle[0] > last[0]) {
                    this.shared.onclose = true
                    step(sel, false) // On candle close
                    ohlcv.push(candle)
                    unshift = true
                    i++
                } else if (candle[0] < last[0]) {
                    continue
                } else {
                    ohlcv[i] = candle
                }
            }

            this.iter = i
            this.t = ohlcv[i][0]
            this.syncState()
            this.step(ohlcv[i], unshift)

            this.shared.onclose = false
            step(sel, unshift)

            this.limit()
            this.send_update()
            this.send_state()

        } catch(e) {
            console.error('Script update error:', e)
        }
    }

    init_state(sel) {

        let task = sel.join(',')

        // Stop previous run only if the task is the same
        if (this.running) {
            this._restart = (task === this.task)
            return false
        }

        // Inverted arrays
        this.open = TS('open', [])
        this.high = TS('high', [])
        this.low = TS('low', [])
        this.close = TS('close', [])
        this.vol = TS('vol', [])

        // Shared TSs & user vars
        this.tss = {}
        this.std_plus = {}
        this.shared = {}

        // Engine state
        this.iter = 0
        this.t = 0
        this.skip = false // skip the step
        this.running = true
        this.task = task

        this.syncState()
        return true
    }

    // Inject/override functions in the std lib object
    std_inject(std) {
        let proto = Object.getPrototypeOf(std)
        Object.assign(proto, this.std_plus)
        return std
    }

    // Report a per-indicator failure as a structured, typed error (Phase 3.x).
    // Surfaced to the DC via the `script-error` event (whitelisted in
    // wireEngineEvents) and re-emitted on the public EventMap as
    // `indicator-error`, so the UI can show WHICH indicator failed and why —
    // replacing the old anonymous "Script execution error" console line.
    _onScriptError(id, phase, e) {
        const scr = this.map[id]
        const err = {
            uuid: id,
            name: scr && scr.name,
            type: scr && scr.type,
            phase,                                   // 'init' | 'exec' | 'post'
            message: (e && e.message) || String(e),
        }
        this.send('script-error', err)
        if (typeof console !== 'undefined') {
            console.error(`Script "${err.name || id}" ${phase} error:`, e)
        }
    }

    send_state() {
        this.send('engine-state', {
            scripts: Object.keys(this.map).length,
            last_perf: this.perf,
            iter: this.iter,
            last_t: this.t,
            data_size: this.data_size,
            running: false
        })
    }

    send_update() {
        this.send(
            'overlay-update', this.format_update()
        )
    }

    re_init_map() {
        for (let id in this.map) {
            this.exec(this.map[id])
        }
    }

    async run(sel) {

        this.send('engine-state', { running: true })

        let t1 = Utils.now()
        sel = sel || Object.keys(this.map)

        this.pre_run_mods(sel)
        let mfs1 = this.make_mods_hooks('pre_step')
        let mfs2 = this.make_mods_hooks('post_step')

        // Per-indicator error boundary: a script that throws is recorded
        // (structured error, sent to the DC) and skipped for the rest of THIS
        // run, so one bad indicator no longer aborts the whole batch. Empty on
        // the happy path, so behaviour/output is unchanged (golden-verified).
        const skip = new Set()

        try {

            for (let id of sel) {
                try {
                    this.map[id].env.init()
                } catch (e) {
                    skip.add(id)
                    this._onScriptError(id, 'init', e)
                }
            }

            let ohlcv = this.data.ohlcv.data
            let start = this.start(ohlcv)
            let total = ohlcv.length - start
            this.shared.event = 'step'

            // PERF: Set non-changing scriptState fields once before the loop
            scriptState.tf = this.tf
            scriptState.data = this.data
            scriptState.shared = this.shared
            scriptState.mods = this.mods

            // PERF: Cache loop-invariant values outside hot loop
            const ohlcvLen = ohlcv.length
            const lastIdx = ohlcvLen - 1
            const hasMods1 = mfs1.length > 0
            const hasMods2 = mfs2.length > 0
            const hasCustomMain = !!this.custom_main
            const selLen = sel.length
            let lastProgress = 0

            for (let i = start; i < ohlcvLen; i++) {

                if (i % YIELD_FREQUENCY === 0) {
                    await Utils.pause(0)
                    let progress = Math.floor(((i - start) / total) * 100)
                    if (progress > lastProgress) {
                        lastProgress = progress
                        this.send('engine-state', {
                            running: true,
                            progress
                        })
                    }
                }
                if (this.restarted()) return

                // PERF: Cache candle ref, avoid repeated ohlcv[i] indexing
                const candle = ohlcv[i]
                this.iter = i - start
                this.t = candle[0]
                scriptState.t = this.t
                scriptState.iter = this.iter
                this.step(candle)
                this.shared.onclose = i !== lastIdx

                // PERF: Skip empty mod-hooks loops entirely
                if (hasMods1) {
                    for (let m = 0; m < mfs1.length; m++) mfs1[m](sel)
                }

                // PERF: Indexed loop avoids iterator protocol overhead
                for (let j = 0; j < selLen; j++) {
                    const id = sel[j]
                    if (skip.has(id)) continue
                    try {
                        this.map[id].env.step()
                    } catch (e) {
                        skip.add(id)
                        this._onScriptError(id, 'exec', e)
                    }
                }

                if (hasMods2) {
                    for (let m = 0; m < mfs2.length; m++) mfs2[m](sel)
                }

                if (hasCustomMain) this.make_ohlcv()
                this.limit()
            }

            for (let j = 0; j < selLen; j++) {
                const id = sel[j]
                if (skip.has(id)) continue
                try {
                    this.map[id].env.output.post()
                } catch (e) {
                    skip.add(id)
                    this._onScriptError(id, 'post', e)
                }
            }

        } catch(e) {
            // Last-resort boundary for errors outside a single script's step
            // (candle step, mod hooks, custom_main). Per-indicator failures are
            // handled inline above.
            console.error('Script execution error:', e)
            this.send('script-error', {
                uuid: null, phase: 'engine',
                message: (e && e.message) || String(e)
            })
        }

        this.post_run_mods(sel)

        this.perf = Utils.now() - t1
        this.running = false

        // PERF: Pre-build flat template for fast per-tick format_update()
        this._buildUpdateTemplate()

        this.send('overlay-data', this.format_map(sel))
    }

    step(data, unshift = true) {
        if (unshift) {
            this.open.unshift(data[1])
            this.high.unshift(data[2])
            this.low.unshift(data[3])
            this.close.unshift(data[4])
            this.vol.unshift(data[5])
        } else {
            this.open[0] = data[1]
            this.high[0] = data[2]
            this.low[0] = data[3]
            this.close[0] = data[4]
            this.vol[0] = data[5]
        }
        for (let id in this.tss) {
            let ts = this.tss[id]
            if (ts.__tf__) ts.__fn__()
            else if (unshift) ts.unshift(ts.__fn__())
            else ts[0] = ts.__fn__()
        }
    }


    limit() {
        this.open.length = this.open.__len__ || DEF_LIMIT
        this.high.length = this.high.__len__ || DEF_LIMIT
        this.low.length = this.low.__len__ || DEF_LIMIT
        this.close.length = this.close.__len__ || DEF_LIMIT
        this.vol.length = this.vol.__len__ || DEF_LIMIT
    }

    start(ohlcv) {
        let depth = this.sett.script_depth
        return depth ?
            Math.max(ohlcv.length - depth, 0) : 0
    }

    drain_queues() {

        // Check if there are any new scripts (recieved during
        // the current run)
        if (this.queue.length) {
            this.exec_all()
        }
        // Check if there are any new settings deltas (...)
        else if (this.delta_queue.length) {
            this.exec_sel(this.delta_queue.pop())
            this.delta_queue = []
        }
        else {
            while (this.update_queue.length) {
                let c = this.update_queue.shift()
                this.update(c)
            }
        }
    }

    // Binary search: first index where arr[i][0] >= t
    _bsGTE(arr, t) {
        let lo = 0, hi = arr.length
        while (lo < hi) {
            let mid = (lo + hi) >> 1
            if (arr[mid][0] < t) lo = mid + 1
            else hi = mid
        }
        return lo
    }

    // Binary search: last index where arr[i][0] <= t (exclusive upper bound)
    _bsGT(arr, t) {
        let lo = 0, hi = arr.length
        while (lo < hi) {
            let mid = (lo + hi) >> 1
            if (arr[mid][0] <= t) lo = mid + 1
            else hi = mid
        }
        return lo
    }

    // Binary range slice: returns arr.slice for elements where t1 <= arr[i][0] <= t2
    _rangeSlice(arr, t1, t2) {
        if (!arr.length) return arr
        let lo = this._bsGTE(arr, t1)
        let hi = this._bsGT(arr, t2)
        return lo >= hi ? [] : arr.slice(lo, hi)
    }

    format_map(sel, range, output) {
        sel = sel || Object.keys(this.map)
        let res = []
        for (let id of sel) {
            let x = this.map[id]
            let f = x => x
            if ((x.output === false || x.output === 'none') &&
                !output) {
                res.push({id: id, data: null})
                continue
            }
            if (x.output === 'range' || range) {
                let [t1, t2] = range || this.range
                f = arr => this._rangeSlice(arr, t1, t2)
            }
            res.push({
                id: id, data: f(x.env.data), new_ovs: {
                    onchart: u.ovf(x.env.onchart, f),
                    offchart: u.ovf(x.env.offchart, f)
                }
            })
        }
        if (this.custom_main) {
            res.push({
                id: 'chart',
                data: this.data.ohlcv.data
            })
        }
        return res
    }

    // PERF: Build a flat template for fast per-tick updates
    _buildUpdateTemplate() {
        let tmpl = []
        for (let id in this.map) {
            let x = this.map[id]
            if (x.output === false) {
                tmpl.push({ id, src: null })
                continue
            }
            tmpl.push({ id, src: x.env.data })
            for (let side of ['onchart', 'offchart']) {
                for (let oid in x.env[side]) {
                    tmpl.push({
                        id: `${side}.${oid}`,
                        src: x.env[side][oid].data
                    })
                }
            }
        }
        this._updateTemplate = tmpl
    }

    format_update() {
        let tmpl = this._updateTemplate
        if (!tmpl) {
            // Fallback: build on first call
            this._buildUpdateTemplate()
            tmpl = this._updateTemplate
        }
        let res = new Array(tmpl.length)
        for (let i = 0; i < tmpl.length; i++) {
            let entry = tmpl[i]
            res[i] = {
                id: entry.id,
                data: entry.src ? entry.src[entry.src.length - 1] : null
            }
        }
        return res
    }

    restarted() {
        if (this._restart) {
            this._restart = false
            this.running = false
            this.perf = 0
            //console.log('Restarted')
            return true
        }
        return false
    }

    remove_scripts(ids) {
        for (let id of ids) {
            delete this.map[id]
            this._outputCache.delete(id)
        }
        this._updateTemplate = null  // Invalidate update template
        this.send_state()
    }

    pre_run_mods(sel) {
        for (let id in this.mods) {
            if (this.mods[id].pre_run) {
                this.mods[id].pre_run(sel)
            }
        }
    }

    post_run_mods(sel) {
        for (let id in this.mods) {
            if (this.mods[id].post_run) {
                this.mods[id].post_run(sel)
            }
        }
    }

    make_mods_hooks(name) {
        // PERF: Cache bound functions, only rebuild when mods keys change
        let modsKey = Object.keys(this.mods).join(',')
        if (modsKey === this._hooksModsKey && this._hooksCache[name]) {
            return this._hooksCache[name]
        }
        this._hooksModsKey = modsKey
        let arr = []
        for (let id in this.mods) {
            if (this.mods[id][name]) {
                arr.push(this.mods[id][name]
                    .bind(this.mods[id]))
            }
        }
        this._hooksCache[name] = arr
        return arr
    }

    data_required(s) {

        let all = Object.values(this.map)
        if (s) all.push(s)

        let types = [{ type: 'OHLCV' }]
        for (let sc of all) {
            if (sc.src.data) {
                let reqs = Object.values(sc.src.data)
                types.push(...reqs.map(x => ({
                    id: sc.uuid,
                    type: x.type
                })))
            }
        }
        // PERF: Set-based lookup O(n) instead of nested filter+find O(n²)
        let existing = new Set(
            Object.values(this.data).map(y => y.type)
        )
        let unf = types.filter(x => !existing.has(x.type))
        return unf.length ? unf : null
    }

    // Match dataset id using script id & required type
    match_ds(id, type) {
        // TODO: develop further
        for (let dsId in this.data) {
            if (this.data[dsId].type === type) {
                return dsId
            }
        }
    }

    // Make a ohlcv data point if there is a symbol
    // with { main: true } props (overwrites ohlcv).
    make_ohlcv() {
        let sym = this.custom_main
        let tNext = this.t + this.tf
        if (sym.update(null, tNext)) {
            this.data.ohlcv.data.push([
                tNext,
                sym.open[0],
                sym.high[0],
                sym.low[0],
                sym.close[0],
                sym.vol[0]
            ])
        }
    }

    // Calculate data size
    recalc_size() {
        let sz = 0
        let maxIter = 100
        while(maxIter-- > 0) {
            sz = u.size_of_dss(this.data) / (1024 * 1024)
            let lim = this.sett.ww_ram_limit
            if (lim && sz > lim) {
                this.limit_size()
            } else break
        }
        this.data_size = +sz.toFixed(2)
        this.send_state()
    }

    // Limit data size by throwing out the least
    // active datasets (measured by 'last_upd')
    limit_size() {
        let dss = Object.values(this.data).map(x => ({
            id: x.id,
            t: x.last_upd
        }))
        dss.sort((a, b) => a.t - b.t)
        if (dss.length) {
            delete this.data[dss[0].id]
        }
    }
}

export default new ScriptEngine()
