// Chart output functions for ScriptStd

import se from '../script_state.js'
import * as u from '../script_utils.js'

export default {
    // Display data point as the main chart
    chart() {
        // TODO: this
    },

    /** Display data point onchart
     * (create a new overlay in DataCube)
     * @param {(TS|TS[]|*)} x - Data point / TS / array of TS
     * @param {string} [name] - Overlay name
     * @param {Object} [sett] - Object with settings & OV type
     */
    onchart(x, name, sett = {}, _id) {
        let off = 0
        name = name || u.get_fn_id('Onchart', _id)
        if (x && x.__id__) {
            off = x.__offset__ || 0
            x = x[0]
        }
        if (Array.isArray(x) && x[0] && x[0].__id__) {
            off = x[0].__offset__ || 0
            x = x.map(x => x[0])
        }
        if (!this.env.onchart[name]) {
            let type = sett.type
            delete sett.type
            sett.$synth = true
            sett.skipNaN = true
            let post = Array.isArray(x) ? 's': ''
            this.env.onchart[name] = {
                name: name,
                type: type || 'Spline' + post,
                data: [],
                settings: sett,
                scripts: false,
                grid: sett.grid || {}
            }
        }
        off *= se.tf
        let v = Array.isArray(x) ?
            [se.t + off, ...x] : [se.t + off, x]
        u.update(this.env.onchart[name].data, v)
    },

    /** Display data point offchart
     * (create a new overlay in DataCube)
     * @param {(TS|TS[]|*)} x - Data point / TS / array of TS
     * @param {string} [name] - Overlay name
     * @param {Object} [sett] - Object with settings & OV type
     */
    offchart(x, name, sett = {}, _id) {
        name = name || u.get_fn_id('Offchart', _id)
        let off = 0
        if (x && x.__id__) {
            off = x.__offset__ || 0
            x = x[0]
        }
        if (Array.isArray(x) && x[0] && x[0].__id__) {
            off = x[0].__offset__ || 0
            x = x.map(x => x[0])
        }
        if (!this.env.offchart[name]) {
            let type = sett.type
            delete sett.type
            sett.$synth = true
            sett.skipNaN = true
            let post = Array.isArray(x) ? 's': ''
            this.env.offchart[name] = {
                name: name,
                type: type || 'Spline' + post,
                data: [],
                settings: sett,
                scripts: false,
                grid: sett.grid || {}
            }
        }
        off *= se.tf
        let v = Array.isArray(x) ?
            [se.t + off, ...x] : [se.t + off, x]
        u.update(this.env.offchart[name].data, v)
    },

    /** Returns true when the candle(<tf>) is being closed
     * @param {(number|string)} tf - Timeframe in ms or as a string
     * @return {boolean}
     */
    onclose(tf) {
        if (!this.env.shared.onclose) return false
        if (!tf) tf = se.tf
        return (se.t + se.tf) % u.tf_from_str(tf) === 0
    },

    /** Emits an event to DataCube
     * @param {string} type - Signal type
     * @param {*} data - Signal data
     */
    signal(type, data = {}) {
        if (se.shared.event !== 'update') return
        se.send('script-signal', { type, data })
    },

    /** Emits an event if cond === true
     * @param {(boolean|TS)} cond - The condition
     * @param {string} type - Signal type
     * @param {*} data - Signal data
     */
    signalif(cond, type, data = {}) {
        if (se.shared.event !== 'update') return
        if (cond && cond.__id__) cond = cond[0]
        if (cond) {
            se.send('script-signal', { type, data })
        }
    },

    /** Sends update to some overlay / main chart
     * @param {string} id - Overlay id
     * @param {Object} fields - Fields to be overwritten
     */
    modify(id, fields) {
        se.send('modify-overlay', { uuid:id, fields })
    },

    /** Sends settings update
     * (can be called from init(), update() or post())
     * @param {Object} upd - Settings update (object to merge)
     */
    settings(upd) {
        this.env.send_modify({ settings: upd })
        Object.assign(this.env.src.sett, upd)
    }
}
