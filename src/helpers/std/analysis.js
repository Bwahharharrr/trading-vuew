// Analysis functions for ScriptStd

export default {
    // Math operators on t-series and numbers

    /** Adds values / time-series
     * @param {(TS|*)} x - First input
     * @param {(TS|*)} y - Second input
     * @return {TS} - New time-series
     */
    add(x, y, _id) {
        let id = this._tsid(_id, `add`)
        let x0 = this.na(x) ? NaN : (x.__id__ ? x[0] : x)
        let y0 = this.na(y) ? NaN : (y.__id__ ? y[0] : y)
        return this.ts(x0 + y0, id, x.__tf__)
    },

    /** Subtracts values / time-series
     * @param {(TS|*)} x - First input
     * @param {(TS|*)} y - Second input
     * @return {TS} - New time-series
     */
    sub(x, y, _id) {
        let id = this._tsid(_id, `sub`)
        let x0 = this.na(x) ? NaN : (x.__id__ ? x[0] : x)
        let y0 = this.na(y)? NaN : (y.__id__ ? y[0] : y)
        return this.ts(x0 - y0, id, x.__tf__)
    },

    /** Multiplies values / time-series
     * @param {(TS|*)} x - First input
     * @param {(TS|*)} y - Second input
     * @return {TS} - New time-series
     */
    mult(x, y, _id) {
        let id = this._tsid(_id, `mult`)
        let x0 = this.na(x) ? NaN : (x.__id__ ? x[0] : x)
        let y0 = this.na(y)? NaN : (y.__id__ ? y[0] : y)
        return this.ts(x0 * y0, id, x.__tf__)
    },

    /** Divides values / time-series
     * @param {(TS|*)} x - First input
     * @param {(TS|*)} y - Second input
     * @return {TS} - New time-series
     */
    div(x, y, _id) {
        let id = this._tsid(_id, `div`)
        let x0 = this.na(x) ? NaN : (x.__id__ ? x[0] : x)
        let y0 = this.na(y)? NaN : (y.__id__ ? y[0] : y)
        return this.ts(x0 / y0, id, x.__tf__)
    },

    /** Returns a negative value / time-series
     * @param {(TS|*)} x - Input
     * @return {TS} - New time-series
     */
    neg(x, _id) {
        let id = this._tsid(_id, `neg`)
        let x0 = this.na(x) ? NaN : (x.__id__ ? x[0] : x)
        return this.ts(-x0, id, x.__tf__)
    },

    /** Average of arguments
     * @param {...number} args - Numeric values
     * @return {number}
     */
    avg(...args) {
        args.pop() // Remove _id
        let sum = 0
        for (var i = 0; i < args.length; i++) {
            sum += args[i]
        }
        return sum / args.length
    },

    /** Max of arguments
     * @param {...number} args - Numeric values
     * @return {number}
     */
    max(...args) {
        args.pop() // Remove _id
        return Math.max(...args)
    },

    /** Min of arguments
     * @param {...number} args - Numeric values
     * @return {number}
     */
    min(...args) {
        args.pop() // Remove _id
        return Math.min(...args)
    },

    /** Change: x[0] - x[len]
     * @param {TS} src - Input
     * @param {number} [len] - Length
     * @return {TS} - New time-series
     */
    change(src, len = 1, _id) {
        let id = this._tsid(_id, `change(${len})`)
        return this.ts(src[0] - src[len], id, src.__tf__)
    },

    /** When one time-series crosses another
     * @param {TS} src1 - TS1
     * @param {TS} src2 - TS2
     * @return {TS} - New time-series
     */
    cross(src1, src2, _id) {
        let id = this._tsid(_id, `cross`)
        let x = (src1[0] > src2[0]) !== (src1[1] > src2[1])
        return this.ts(x, id, src1.__tf__)
    },

    /** When one time-series goes over another one
     * @param {TS} src1 - TS1
     * @param {TS} src2 - TS2
     * @return {TS} - New time-series
     */
    crossover(src1, src2, _id) {
        let id = this._tsid(_id, `crossover`)
        let x = (src1[0] > src2[0]) && (src1[1] <= src2[1])
        return this.ts(x, id, src1.__tf__)
    },

    /** When one time-series goes under another one
     * @param {TS} src1 - TS1
     * @param {TS} src2 - TS2
     * @return {TS} - New time-series
     */
    crossunder(src1, src2, _id) {
        let id = this._tsid(_id, `crossunder`)
        let x = (src1[0] < src2[0]) && (src1[1] >= src2[1])
        return this.ts(x, id, src1.__tf__)
    },

    /** Sum of all elements of src
     * @param {TS} src1 - Input
     * @return {TS} - New time-series
     */
    cum(src, _id) {
        let id = this._tsid(_id, `cum`)
        let res = this.ts(0, id, src.__tf__)
        res[0] = this.nz(src[0]) + this.nz(res[1])
        return res
    },

    /** Test if "src" TS is falling for "len" candles
     * @param {TS} src - Input
     * @param {number} len - Length
     * @return {TS} - New time-series
     */
    falling(src, len, _id) {
        let id = this._tsid(_id, `falling(${len})`)
        let bot = src[0]
        for (var i = 1; i < len + 1; i++) {
            if (bot >= src[i]) {
                return this.ts(false, id, src.__tf__)
            }
        }
        return this.ts(true, id, src.__tf__)
    },

    /** Test if "src" TS is rising for "len" candles
     * @param {TS} src - Input
     * @param {number} len - Length
     * @return {TS} - New time-series
     */
    rising(src, len, _id) {
        let id = this._tsid(_id, `rising(${len})`)
        let top = src[0]
        for (var i = 1; i < len + 1; i++) {
            if (top <= src[i]) {
                return this.ts(false, id, src.__tf__)
            }
        }
        return this.ts(true, id, src.__tf__)
    },

    /** Highest value for a given number of candles back
     * @param {TS} src - Input
     * @param {number} len - Length
     * @return {TS} - New time-series
     */
    highest(src, len, _id) {
        let id = this._tsid(_id, `highest(${len})`)
        let high = -Infinity
        for (var i = 0; i < len; i++) {
            if (src[i] > high) high = src[i]
        }
        return this.ts(high, id, src.__tf__)
    },

    /** Highest value offset for a given number of bars back
     * @param {TS} src - Input
     * @param {number} len - Length
     */
    highestbars(src, len, _id) {
        let id = this._tsid(_id, `highestbars(${len})`)
        let high = -Infinity
        let hi = 0
        for (var i = 0; i < len; i++) {
            if (src[i] > high) { high = src[i], hi = i }
        }
        return this.ts(-hi, id, src.__tf__)
    },

    /** Lowest value for a given number of candles back
     * @param {TS} src - Input
     * @param {number} len - Length
     * @return {TS} - New time-series
     */
    lowest(src, len, _id) {
        let id = this._tsid(_id, `lowest(${len})`)
        let low = Infinity
        for (var i = 0; i < len; i++) {
            if (src[i] < low) low = src[i]
        }
        return this.ts(low, id, src.__tf__)
    },

    /** Lowest value offset for a given number of bars back
     * @param {TS} src - Input
     * @param {number} len - Length
     */
    lowestbars(src, len, _id) {
        let id = this._tsid(_id, `lowestbars(${len})`)
        let low = Infinity
        let li = 0
        for (var i = 0; i < len; i++) {
            if (src[i] < low) { low = src[i], li = i }
        }
        return this.ts(-li, id, src.__tf__)
    },

    /** Momentum
     * @param {TS} src - Input
     * @param {number} len - Length
     * @return {TS} - New time-series
     */
    mom(src, len, _id) {
        let id = this._tsid(_id, `mom(${len})`)
        return this.ts(src[0] - src[len], id, src.__tf__)
    },

    /** Returns price of the pivot high point
     * Tip: works best with `offset` function
     * @param {TS} src - Input
     * @param {number} left - left threshold, candles
     * @param {number} right - right threshold, candles
     * @return {TS} - New time-series
     */
    pivothigh(src, left, right, _id) {
        let id = this._tsid(_id, `pivothigh(${left},${right})`)
        let len = left + right + 1
        let top = src[right]
        for (var i = 0; i < len; i++) {
            if (top <= src[i] && i !== right) {
                return this.ts(NaN, id, src.__tf__)
            }
        }
        return this.ts(top, id, src.__tf__)
    },

    /** Returns price of the pivot low point
     * Tip: works best with `offset` function
     * @param {TS} src - Input
     * @param {number} left - left threshold, candles
     * @param {number} right - right threshold, candles
     * @return {TS} - New time-series
     */
    pivotlow(src, left, right, _id) {
        let id = this._tsid(_id, `pivotlow(${left},${right})`)
        let len = left + right + 1
        let bot = src[right]
        for (var i = 0; i < len; i++) {
            if (bot >= src[i] && i !== right) {
                return this.ts(NaN, id, src.__tf__)
            }
        }
        return this.ts(bot, id, src.__tf__)
    },

    /** Candles since the event occured (cond === true)
     * @param {(boolean|TS)} cond - the condition
     */
    since(cond, _id) {
        let id = this._tsid(_id, `since()`)
        if (cond && cond.__id__) cond = cond[0]
        let s = this.ts(undefined, id)
        s[0] = cond ? 0 : s[1] + 1
        return s
    },

    /** Returns the sliding sum of last "len" values of the source
     * @param {TS} src - Input
     * @param {number} len - Length
     * @return {TS} - New time-series
     */
    sum(src, len, _id) {
        let id = this._tsid(_id, `sum(${len})`)
        let sum = 0
        for (var i = 0; i < len; i++) {
            sum = sum + src[i]
        }
        return this.ts(sum, id, src.__tf__)
    }
}
