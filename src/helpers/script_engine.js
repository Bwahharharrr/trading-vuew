
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

class ScriptEngine {

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
                parts.push(`${key}:${JSON.stringify(val)}`)
            }
        }

        // Include computation-affecting settings
        for (const key in sett) {
            if (!DISPLAY_ONLY_SETTINGS.has(key)) {
                parts.push(`s.${key}:${JSON.stringify(sett[key])}`)
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

        let step = (sel, unshift) => {
            for (let m = 0; m < mfs1.length; m++) {
                mfs1[m](sel) // pre_step
            }

            for (let id of sel) {
                this.map[id].env.step(unshift)
            }

            for (let m = 0; m < mfs2.length; m++) {
                mfs2[m](sel) // post_step
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

        try {

            for (let id of sel) {
                this.map[id].env.init()
            }

            let ohlcv = this.data.ohlcv.data
            let start = this.start(ohlcv)
            let total = ohlcv.length - start
            this.shared.event = 'step'

            // === PERFORMANCE: Improved progress reporting and yielding ===
            let lastProgress = 0

            for (let i = start; i < ohlcv.length; i++) {

                // === PERFORMANCE: More frequent yielding for better responsiveness ===
                // Yield every YIELD_FREQUENCY iterations instead of 5000
                if (i % YIELD_FREQUENCY === 0) {
                    await Utils.pause(0)

                    // === PERFORMANCE: Emit progress percentage ===
                    let progress = Math.floor(((i - start) / total) * 100)
                    if (progress > lastProgress) {
                        lastProgress = progress
                        this.send('engine-state', {
                            running: true,
                            progress: progress
                        })
                    }
                }
                if (this.restarted()) return

                this.iter = i - start
                this.t = ohlcv[i][0]
                this.syncState()
                this.step(ohlcv[i])
                this.shared.onclose = i !== ohlcv.length - 1

                for (let m = 0; m < mfs1.length; m++) {
                    mfs1[m](sel) // pre_step
                }

                for (let id of sel) this.map[id].env.step()

                for (let m = 0; m < mfs2.length; m++) {
                    mfs2[m](sel) // post_step
                }

                if (this.custom_main) this.make_ohlcv()
                this.limit()
            }

            for (let id of sel) {
                this.map[id].env.output.post()
            }

        } catch(e) {
            console.error('Script execution error:', e)
        }

        this.post_run_mods(sel)

        this.perf = Utils.now() - t1
        this.running = false

        this.send('overlay-data', this.format_map(sel))
    }

    step(data, unshift = true) {
        if (unshift) {
            this.open.unshift(data[1])
            this.high.unshift(data[2])
            this.low.unshift(data[3])
            this.close.unshift(data[4])
            this.vol.unshift(data[5])
            for (let id in this.tss) {
                if (this.tss[id].__tf__) this.tss[id].__fn__()
                else this.tss[id].unshift(this.tss[id].__fn__())
            }
        } else {
            this.open[0] = data[1]
            this.high[0] = data[2]
            this.low[0] = data[3]
            this.close[0] = data[4]
            this.vol[0] = data[5]
            for (let id in this.tss) {
                if (this.tss[id].__tf__) this.tss[id].__fn__()
                else this.tss[id][0] = this.tss[id].__fn__()
            }
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
                f = x => x.filter(
                    y => y[0] >= t1 && y[0] <= t2
                )
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

    format_update() {
        let res = []
        for (let id in this.map) {
            let x = this.map[id]
            if (x.output === false) {
                res.push({id: id, data: null})
                continue
            }
            res.push({
                id: id,
                data: x.env.data[x.env.data.length - 1]
            })
            for (let side of ['onchart', 'offchart']) {
                for (let oid in x.env[side]) {
                    let y = x.env[side][oid]
                    res.push({
                        id: `${side}.${oid}`,
                        data: y.data[y.data.length - 1]
                    })
                }
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
        let arr = []
        for (let id in this.mods) {
            if (this.mods[id][name]) {
                arr.push(this.mods[id][name]
                    .bind(this.mods[id]))
            }
        }
        return arr
    }

    data_required(s) {

        let all = Object.values(this.map)
        if (s) all.push(s)

        let types = [{ type: 'OHLCV' }]
        for (let s of all) {
            if (s.src.data) {
                let reqs = Object.values(s.src.data)
                types.push(...reqs.map(x => ({
                    id: s.uuid,
                    type: x.type
                })))
            }
        }
        let unf = types.filter(x =>
            !Object.values(this.data)
            .find(y => y.type === x.type)
        )
        return unf.length ? unf : null
    }

    // Match dataset id using script id & required type
    match_ds(id, type) {
        // TODO: develop further
        for (let id in this.data) {
            if (this.data[id].type === type) {
                return id
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
