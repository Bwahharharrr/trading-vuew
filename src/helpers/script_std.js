// Script std-lib (built-in functions)
// This is the main ScriptStd class that composes functions from separate modules

import se from './script_state.js'
import * as u from './script_utils.js'

// Import function modules
import {
    mathFns,
    timeFns,
    chartFns,
    utilsFns,
    analysisFns,
    indicatorFns,
    timeseriesFns,
    symbolFns
} from './std/index.js'

export default class ScriptStd {

    constructor(env) {
        this.env = env
        this.se = se

        this.SWMA = [1/6, 2/6, 2/6, 1/6]
        this.STDEV_EPS = 1e-10
        this.STDEV_Z = 1e-4

        this._index_tracking()
    }

    // Wrap every index with index-tracking function
    // That way we will know exact index ranges
    _index_tracking() {
        let proto = Object.getPrototypeOf(this)
        for (var k of Object.getOwnPropertyNames(proto)) {
            switch(k) {
                case 'constructor':
                case 'ts':
                case 'tstf':
                case 'sample':
                case '_index_tracking':
                case '_tsid':
                case '_i':
                case '_v':
                case '_add_i':
                case 'chart':
                case 'onchart':
                case 'offchart':
                case 'sym':
                    continue
            }
            let f = this._add_i(k, this[k].toString())
            if (f) this[k] = f
        }
    }

    // Add index tracking to the function
    _add_i(name, src) {
        let args = u.f_args(src)
        src = u.f_body(src)
        let src2 = u.wrap_idxs(src, 'this.')
        if (src2 !== src) {
            return new Function (...args, src2)
        }
        return null
    }

    // Placeholder methods for unimplemented features
    corr() {
        // TODO: this
    }

    time(res, sesh) {
        // TODO: this
    }

    timestamp() {
        // TODO: this
    }

    linearint() {
        // TODO: this
    }

    nearestrank() {
        // TODO: this
    }

    percentrank() {
        // TODO: this
    }

    variance(src, len) {
        // TODO: this
    }

    vwap(src) {
        // TODO: this
    }
}

// Mix in all the function modules to the prototype
const proto = ScriptStd.prototype
Object.assign(proto, mathFns)
Object.assign(proto, timeFns)
Object.assign(proto, chartFns)
Object.assign(proto, utilsFns)
Object.assign(proto, analysisFns)
Object.assign(proto, indicatorFns)
Object.assign(proto, timeseriesFns)
Object.assign(proto, symbolFns)
