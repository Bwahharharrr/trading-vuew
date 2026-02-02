// Utility functions for ScriptStd

export default {
    /** Replaces the variable if it's NaN
     * @param {*} x - The variable
     * @param {*} [v] - A value to replace with
     * @return {*} - New value
     */
    nz(x, v) {
        if (x == undefined || x !== x) {
            return v || 0
        }
        return x
    },

    /** Is the variable NaN ?
     * @param {*} x - The variable
     * @return {boolean} - New value
     */
    na(x) {
        return x == undefined || x !== x
    },

    /** Replaces the var with NaN if Infinite
     * @param {*} x - The variable
     * @param {*} [v] - A value to replace with
     * @return {*} - New value
     */
    nf(x, v) {
        if (!isFinite(x)) {
            return v !== undefined ? v : NaN
        }
        return x
    },

    /** Converts the variable to Boolean
     * @param {number} x The variable
     * @return {number}
     */
    bool(x) {
        return !!x
    },

    /** Returns x or y depending on the condition
     * @param {(boolean|TS)} cond - Condition
     * @param {*} x - First value
     * @param {*} y - Second value
     * @return {*}
     */
    iff(cond, x, y) {
        if (cond && cond.__id__) cond = cond[0]
        return cond ? x : y
    },

    /** Sets the reverse buffer size for a given
     * time-series (default = 5, grows on demand)
     * @param {TS} src - Input
     * @param {number} len - New length
     */
    buffsize(src, len) {
        src.__len__ = len
    },

    /** For a given series replaces NaN values with
     * previous nearest non-NaN value
     * @param {TS} src - Input time-series
     * @return {TS}
     */
    fixnan(src) {
        if (this.na(src[0])) {
            for (var i = 1; i < src.length; i++) {
                if (!this.na(src[i])) {
                    src[0] = src[i]
                    break
                }
            }
        }
        return src
    },

    /** Shifts TS left or right by "num" candles
     * @param {number} num - Offset measured in candles
     * @return {TS} - New / existing time-series
     */
    offset(src, num, _id) {
        if (src.__id__) {
            src.__offset__ = num
            return src
        }
        let id = this._tsid(_id, `offset(${num})`)
        let out = this.ts(src, id)
        out.__offset__ = num
        return out
    }
}
