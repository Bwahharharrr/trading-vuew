// Timeseries core functions for ScriptStd

import * as u from '../script_utils.js'
import Sampler from '../sampler.js'
import Const from '../../stuff/constants.js'

const { BUF_INC } = Const

export default {
    /**
     * Creates a new time-series & records each x.
     * Returns an array. Id is auto-generated
     * @param {*} x - A variable to sample from
     * @return {TS} - New time-series
     */
    ts(x, _id, _tf) {
        if (_tf) return this.tstf(x, _tf, _id)
        let ts = this.env.tss[_id]
        if (!ts) {
            ts = this.env.tss[_id] = [x]
            ts.__id__ = _id
        } else {
            ts[0] = x
        }
        return ts
    },

    /**
     * Creates a new time-series & records each x.
     * Uses Sampler to aggregate the values
     * Return the an array. Id is auto-generated
     * @param {*} x - A variable to sample from
     * @param {(number|string)} tf - Timeframe in ms or as a string
     * @return {TS} - New time-series
     */
    tstf(x, tf, _id) {
        let ts = this.env.tss[_id]
        if (!ts) {
            ts = this.env.tss[_id] = [x]
            ts.__id__ = _id
            ts.__tf__ = u.tf_from_str(tf)
            ts.__fn__ = Sampler('close').bind(ts)
        } else {
            ts.__fn__(x)
        }
        return ts
    },

    /**
     * Creates a new custom sampler.
     * Return the an array. Id is auto-generated
     * @param {*} x - A variable to sample from
     * @param {string} type - Sampler type
     * @param {(number|string)} tf - Timeframe in ms or as a string
     * @return {TS} - New time-series
     */
    sample(x, type, tf, _id) {
        let ts = this.env.tss[_id]
        if (!ts) {
            ts = this.env.tss[_id] = [x]
            ts.__id__ = _id
            ts.__tf__ = u.tf_from_str(tf)
            ts.__fn__ = Sampler(type).bind(ts)
        } else {
            ts.__fn__(x)
        }
        return ts
    },

    // Generate the next timeseries id
    _tsid(prev, next) {
        return `${prev}<-${next}`
    },

    // Index-tracker
    _i(i, x) {
        // If an object is actually a timeseries
        if (x != undefined && x === x && x.__id__) {
            // Increase TS buff length
            if (!x.__len__ || i >= x.__len__) {
                x.__len__ = i + BUF_INC
            }
        }
        return i
    },

    // Index-tracker (object-based)
    _v(x, i) {
        // If an object is actually a timeseries
        if (x != undefined && x === x && x.__id__) {
            // Increase TS buff length
            if (!x.__len__ || i >= x.__len__) {
                x.__len__ = i + BUF_INC
            }
        }
        return x
    }
}
