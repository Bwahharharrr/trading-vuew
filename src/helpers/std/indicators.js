// Technical indicators for ScriptStd

import linreg from '../../stuff/linreg.js'
import se from '../script_state.js'

export default {
    /** Arnaud Legoux Moving Average
     * @param {TS} src - Input
     * @param {number} len - Length
     * @param {number} offset - Offset
     * @param {number} sigma - Sigma
     * @return {TS} - New time-series
     */
    alma(src, len, offset, sigma, _id) {
        let id = this._tsid(_id, `alma(${len},${offset},${sigma})`)
        let m = Math.floor(offset * (len - 1))
        let s = len / sigma
        let norm = 0
        let sum = 0
        for (let i = 0; i < len; i++) {
            let w = Math.exp(-1 * Math.pow(i - m, 2) / (2 * Math.pow(s, 2)))
            norm = norm + w
            sum = sum + src[len - i - 1] * w
        }
        return this.ts(sum / norm, id, src.__tf__)
    },

    /** Average True Range
     * @param {number} len - Length
     * @return {TS} - New time-series
     */
    atr(len, _id, _tf) {
        let tfs = _tf || ''
        let id = this._tsid(_id, `atr(${len})`)
        let high = this.env.shared[`high${tfs}`]
        let low = this.env.shared[`low${tfs}`]
        let close = this.env.shared[`close${tfs}`]
        let tr = this.ts(0, id, _tf)
        tr[0] = this.na(high[1]) ? high[0] - low[0] :
            Math.max(
                Math.max(
                    high[0] - low[0],
                    Math.abs(high[0] - close[1])
                ),
                Math.abs(low[0] - close[1])
            )
        return this.rma(tr, len, id)
    },

    /** Bollinger Bands
     * @param {TS} src - Input
     * @param {number} len - Length
     * @param {number} mult - Multiplier
     * @return {TS[]} - Array of new time-series (3 bands)
     */
    bb(src, len, mult, _id) {
        let id = this._tsid(_id, `bb(${len},${mult})`)
        let basis = this.sma(src, len, id)
        let dev = this.stdev(src, len, id)[0] * mult
        return [
            basis,
            this.ts(basis[0] + dev, id + '1', src.__tf__),
            this.ts(basis[0] - dev, id + '2', src.__tf__)
        ]
    },

    /** Bollinger Bands Width
     * @param {TS} src - Input
     * @param {number} len - Length
     * @param {number} mult - Multiplier
     * @return {TS} - New time-series
     */
    bbw(src, len, mult, _id) {
        let id = this._tsid(_id, `bbw(${len},${mult})`)
        let basis = this.sma(src, len, id)[0]
        let dev = this.stdev(src, len, id)[0] * mult
        return this.ts(basis === 0 ? NaN : 2 * dev / basis, id, src.__tf__)
    },

    /** Commodity Channel Index
     * @param {TS} src - Input
     * @param {number} len - Length
     * @return {TS} - New time-series
     */
    cci(src, len, _id) {
        let id = this._tsid(_id, `cci(${len})`)
        let ma = this.sma(src, len, id)
        let dev = this.dev(src, len, id)
        let cci = dev[0] === 0 ? NaN : (src[0] - ma[0]) / (0.015 * dev[0])
        return this.ts(cci, id, src.__tf__)
    },

    /** Chande Momentum Oscillator
     * @param {TS} src - Input
     * @param {number} len - Length
     * @return {TS} - New time-series
     */
    cmo(src, len, _id) {
        let id = this._tsid(_id, `cmo(${len})`)
        let mom = this.change(src, 1, id)

        let g = this.ts(mom[0] >= 0 ? mom[0] : 0.0, id+"g", src.__tf__)
        let l = this.ts(mom[0] >= 0 ? 0.0 : -mom[0], id+"l", src.__tf__)

        let sm1 = this.sum(g, len, id+'1')[0]
        let sm2 = this.sum(l, len, id+'2')[0]

        return this.ts((sm1 + sm2) === 0 ? NaN : 100 * (sm1 - sm2) / (sm1 + sm2), id, src.__tf__)
    },

    /** Center of Gravity
     * @param {TS} src - Input
     * @param {number} len - Length
     * @return {TS} - New time-series
     */
    cog(src, len, _id) {
        let id = this._tsid(_id, `cog(${len})`)
        let sum = this.sum(src, len, id)[0]
        let num = 0
        for (let i = 0; i < len; i++) {
            num += src[i] * (i + 1)
        }
        return this.ts(sum === 0 ? NaN : -num / sum, id, src.__tf__)
    },

    /** Deviation from SMA
     * @param {TS} src - Input
     * @param {number} len - Length
     * @return {TS} - New time-series
     */
    dev(src, len, _id) {
        let id = this._tsid(_id, `dev(${len})`)
        let mean = this.sma(src, len, id)[0]
        let sum = 0
        for (let i = 0; i < len; i++) {
            sum += Math.abs(src[i] - mean)
        }
        return this.ts(sum / len, id, src.__tf__)
    },

    /** Directional Movement Index ADX, +DI, -DI
     * @param {number} len - Length
     * @param {number} smooth - Smoothness
     * @return {TS} - New time-series
     */
    dmi(len, smooth, _id, _tf) {
        let id = this._tsid(_id, `dmi(${len},${smooth})`)
        let tfs = _tf || ''
        let high = this.env.shared[`high${tfs}`]
        let low = this.env.shared[`low${tfs}`]
        let up = this.change(high, 1, id+'1')[0]
        let down = this.neg(this.change(low, 1, id+'2'), id)[0]

        let plusDM = this.ts(100 * (
            this.na(up) ? NaN :
            (up > down && up > 0 ? up : 0)), id+'3', _tf
        )
        let minusDM = this.ts(100 * (
            this.na(down) ? NaN :
            (down > up && down > 0 ? down : 0)), id+'4', _tf
        )

        let trur = this.rma(this.tr(false, id, _tf), len, id+'5')
        let plus = this.div(
            this.rma(plusDM, len, id+'6'), trur, id+'8')
        let minus = this.div(
            this.rma(minusDM, len, id+'7'), trur, id+'9')
        let sum = this.add(plus, minus, id+'10')[0]
        let adx = this.rma(
            this.ts(100 * Math.abs(plus[0] - minus[0]) /
            (sum === 0 ? 1 : sum), id+'11', _tf),
            smooth, id+'12'
        )
        return [adx, plus, minus]
    },

    /** Exponential Moving Average with alpha = 2 / (y + 1)
     * @param {TS} src - Input
     * @param {number} len - Length
     * @return {TS} - New time-series
     */
    ema(src, len, _id) {
        let id = this._tsid(_id, `ema(${len})`)
        let a = 2 / (len + 1)
        let ema = this.ts(0, id, src.__tf__)
        ema[0] = this.na(ema[1]) ?
            this.sma(src, len, id)[0] :
            a * src[0] + (1 - a) * this.nz(ema[1])
        return ema
    },

    /** Hull Moving Average
     * @param {TS} src - Input
     * @param {number} len - Length
     * @return {TS} - New time-series
     */
    hma(src, len, _id) {
        let id = this._tsid(_id, `hma(${len})`)
        let len2 = Math.floor(len/2)
        let len3 = Math.round(Math.sqrt(len))

        let a = this.mult(this.wma(src, len2, id+'1'), 2, id)
        let b = this.wma(src, len, id+'2')
        let delt = this.sub(a, b, id+'3')

        return this.wma(delt, len3, id+'4')
    },

    /** Keltner Channels
     * @param {TS} src - Input
     * @param {number} len - Length
     * @param {number} mult - Multiplier
     * @param {boolean} [use_tr] - Use true range
     * @return {TS[]} - Array of new time-series (3 bands)
     */
    kc(src, len, mult, use_tr = true, _id, _tf) {
        let id = this._tsid(_id, `kc(${len},${mult},${use_tr})`)
        let tfs = _tf || ''
        let high = this.env.shared[`high${tfs}`]
        let low = this.env.shared[`low${tfs}`]
        let basis = this.ema(src, len, id+'1')

        let range = use_tr ?
            this.tr(false, id+'2', _tf) :
            this.ts(high[0] - low[0], id+'3', src.__tf__)
        let ema = this.ema(range, len, id+'4')

        return [
            basis,
            this.ts(basis[0] + ema[0] * mult, id+'5', src.__tf__),
            this.ts(basis[0] - ema[0] * mult, id+'6', src.__tf__)
        ]
    },

    /** Keltner Channels Width
     * @param {TS} src - Input
     * @param {number} len - Length
     * @param {number} mult - Multiplier
     * @param {boolean} [use_tr] - Use true range
     * @return {TS} - New time-series
     */
    kcw(src, len, mult, use_tr = true, _id, _tf) {
        let id = this._tsid(_id, `kcw(${len},${mult},${use_tr})`)
        let kc = this.kc(src, len, mult, use_tr, `kcw`, _tf)
        return this.ts(kc[0][0] === 0 ? NaN : (kc[1][0] - kc[2][0]) / kc[0][0], id, src.__tf__)
    },

    /** Linear Regression
     * @param {TS} src - Input
     * @param {number} len - Length
     * @param {number} offset - Offset
     * @return {TS} - New time-series
     */
    linreg(src, len, offset = 0, _id) {
        let id = this._tsid(_id, `linreg(${len})`)
        src.__len__ = Math.max(src.__len__ || 0, len)
        let lr = linreg(src, len, offset)
        return this.ts(lr, id, src.__tf__)
    },

    /** Moving Average Convergence/Divergence
     * @param {TS} src - Input
     * @param {number} fast - Fast EMA
     * @param {number} slow - Slow EMA
     * @param {number} sig - Signal
     * @return {TS[]} - [macd, signal, hist]
     */
    macd(src, fast, slow, sig, _id) {
        let id = this._tsid(_id, `macd(${fast}${slow}${sig})`)
        let fast_ma = this.ema(src, fast, id+'1')
        let slow_ma = this.ema(src, slow, id+'2')
        let macd = this.sub(fast_ma, slow_ma, id+'3')
        let signal = this.ema(macd, sig, id+'4')
        let hist = this.sub(macd, signal, id+'5')
        return [macd, signal, hist]
    },

    /** Money Flow Index
     * @param {TS} src - Input
     * @param {number} len - Length
     * @return {TS} - New time-series
     */
    mfi(src, len, _id) {
        let id = this._tsid(_id, `mfi(${len})`)
        let vol = this.env.shared.vol
        let ch = this.change(src, 1, id+'1')[0]

        let ts1 = this.mult(vol, ch <= 0.0 ? 0.0 : src[0], id+'2')
        let ts2 = this.mult(vol, ch  >= 0.0 ? 0.0 : src[0], id+'3')

        let upper = this.sum(ts1, len, id+'4')
        let lower = this.sum(ts2, len, id+'5')

        let res = undefined
        if (!this.na(lower)) {
            res = this.rsi(upper, lower, id+'6')[0]
        }
        return this.ts(res, id, src.__tf__)
    },

    /** Exponentially MA with alpha = 1 / length
     * Used in RSI
     * @param {TS} src - Input
     * @param {number} len - Length
     * @return {TS} - New time-series
     */
    rma(src, len, _id) {
        let id = this._tsid(_id, `rma(${len})`)
        let a = len
        let sum = this.ts(0, id, src.__tf__)
        sum[0] = this.na(sum[1]) ?
            this.sma(src, len, id)[0] :
            (src[0] + (a - 1) * this.nz(sum[1])) / a
        return sum
    },

    /** Rate of Change
     * @param {TS} src - Input
     * @param {number} len - Length
     * @return {TS} - New time-series
     */
    roc(src, len, _id) {
        let id = this._tsid(_id, `roc(${len})`)
        return this.ts(
            100 * (src[0] - src[len]) / src[len], id, src.__tf__
        )
    },

    /** Relative Strength Index
     * @param {TS} x - First Input
     * @param {number|TS} y - Second Input
     * @return {TS} - New time-series
     */
    rsi(x, y, _id) {
        let id, rsi
        // Check if y is a timeseries
        if (!this.na(y) && y.__id__) {
            id = this._tsid(_id, `rsi(x,y)`)
            rsi = 100 - 100 / (1 + this.div(x, y, id)[0])
        } else {
            id = this._tsid(_id, `rsi(${y})`)
            let ch = this.change(x, 1, _id)[0]
            let pc = this.ts(Math.max(ch, 0), id+'1', x.__tf__)
            let nc = this.ts(-Math.min(ch, 0), id+'2', x.__tf__)
            let up = this.rma(pc, y, id+'3')[0]
            let down = this.rma(nc, y, id+'4')[0]
            rsi = down === 0 ? 100 : (
                up === 0 ? 0 : (100 - (100 / (1 + up / down)))
            )
        }
        return this.ts(rsi, id+'5', x.__tf__)
    },

    /** Parabolic SAR
     * @param {number} start - Start
     * @param {number} inc - Increment
     * @param {number} max - Maximum
     * @return {TS} - New time-series
     */
    sar(start, inc, max, _id, _tf) {
        let id = this._tsid(_id, `sar(${start},${inc},${max})`)
        let tfs = _tf || ''
        let high = this.env.shared[`high${tfs}`]
        let low = this.env.shared[`low${tfs}`]
        let close = this.env.shared[`close${tfs}`]

        let minTick = 0
        let out = this.ts(undefined, id+'1', _tf)
        let pos = this.ts(undefined, id+'2', _tf)
        let maxMin = this.ts(undefined, id+'3', _tf)
        let acc = this.ts(undefined, id+'4', _tf)
        // Aggregated-bar index for the tf variant: __len__ is only stamped by
        // the index-tracker for offsets >= BUF_INC, which sar never produces —
        // `__len__ - 1` was NaN and the tf form (sar15m(...)) never computed.
        // out.length grows exactly once per closed sampler window.
        let n = _tf ? out.length - 1 : se.iter
        let prev
        let outSet = false

        if (n >= 1) {
            prev = out[1]
            if (n === 1) {
                if (close[0] > close[1]) {
                    pos[0] = 1
                    maxMin[0] = Math.max(high[0], high[1])
                    prev = Math.min(low[0], low[1])
                } else {
                    pos[0] = -1
                    maxMin[0] = Math.min(low[0], low[1])
                    prev = Math.max(high[0], high[1])
                }
                acc[0] = start
            } else {
                pos[0] = pos[1]
                acc[0] = acc[1]
                maxMin[0] = maxMin[1]
            }
            if (pos[0] === 1) {
                if (high[0] > maxMin[0]) {
                    maxMin[0] = high[0]
                    acc[0] = Math.min(acc[0] + inc, max)
                }
                if (low[0] <= prev) {
                    pos[0] = -1
                    out[0] = maxMin[0]
                    maxMin[0] = low[0]
                    acc[0] = start
                    outSet = true
                }
            } else {
                if (low[0] < maxMin[0]) {
                    maxMin[0] = low[0]
                    acc[0] = Math.min(acc[0] + inc, max)
                }

                if (high[0] >= prev) {
                    pos[0] = 1
                    out[0] = maxMin[0]
                    maxMin[0] = high[0]
                    acc[0] = start
                    outSet = true
                }
            }

            if (!outSet) {
                out[0] = prev + acc[0] * (maxMin[0] - prev)

                if (pos[0] === 1)
                    if (out[0] >= low[0])
                        out[0] = low[0] - minTick


                if (pos[0] === -1)
                    if (out[0] <= high[0])
                        out[0] = high[0] + minTick
            }
        }
        return out
    },

    /** Simple Moving Average
     * @param {TS} src - Input
     * @param {number} len - Length
     * @return {TS} - New time-series
     */
    sma(src, len, _id) {
        let id = this._tsid(_id, `sma(${len})`)
        let sum = 0
        for (let i = 0; i < len; i++) {
            sum = sum + src[i]
        }
        return this.ts(sum / len, id, src.__tf__)
    },

    /** Standard deviation
     * @param {TS} src - Input
     * @param {number} len - Length
     * @return {TS} - New time-series
     */
    stdev(src, len, _id) {
        let sumf = (x, y) => {
            let res = x + y
            return res
        }

        let id = this._tsid(_id, `stdev(${len})`)
        let avg = this.sma(src, len, id)
        let sqd = 0
        for (let i = 0; i < len; i++) {
            let sum = sumf(src[i], -avg[0])
            sqd += sum * sum
        }
        return this.ts(Math.sqrt(sqd / len), id, src.__tf__)
    },

    /** Stochastic
     * @param {TS} src - Input
     * @param {TS} high - TS of high
     * @param {TS} low - TS of low
     * @param {number} len - Length
     * @return {TS} - New time-series
     */
    stoch(src, high, low, len, _id) {
        let id = this._tsid(_id, `sum(${len})`)
        let x = 100 * (src[0] - this.lowest(low, len)[0])
        let y = this.highest(high, len)[0] - this.lowest(low, len)[0]
        return this.ts(y === 0 ? NaN : x / y, id, src.__tf__)
    },

    /** Supertrend Indicator
     * @param {number} factor - ATR multiplier
     * @param {number} atrlen - Length of ATR
     * @return {TS[]} - Supertrend line and direction of trend
     */
    supertrend(factor, atrlen, _id, _tf) {
        let id = this._tsid(_id, `supertrend(${factor},${atrlen})`)
        let tfs = _tf || ''
        let high = this.env.shared[`high${tfs}`]
        let low = this.env.shared[`low${tfs}`]
        let close = this.env.shared[`close${tfs}`]
        let hl2 = (high[0] + low[0]) * 0.5

        let atr = factor * this.atr(atrlen, id+'1', _tf)[0]

        let ls = this.ts(hl2 - atr, id+'2', _tf)
        let ls1 = this.nz(ls[1], ls[0])
        ls[0] = close[1] > ls1 ? Math.max(ls[0], ls1) : ls[0]

        let ss = this.ts(hl2 + atr, id+'3', _tf)
        let ss1 = this.nz(ss[1], ss[0])
        ss[0] = close[1] < ss1 ? Math.min(ss[0], ss1) : ss[0]

        let dir = this.ts(1, id+'4', _tf)
        dir[0] = this.nz(dir[1], dir[0])
        dir[0] = dir[0] === -1 && close[0] > ss1 ? 1 :
            (dir[0] === 1 && close[0] < ls1 ? -1 : dir[0])

        let plot = this.ts(dir[0] === 1 ? ls[0] : ss[0], id+'5', _tf)
        return [plot, this.neg(dir, id+'6')]
    },

    /** Symmetrically Weighted Moving Average
     * @param {TS} src - Input
     * @return {TS} - New time-series
     */
    swma(src, _id) {
        let id = this._tsid(_id, `swma`)
        let sum = src[3] * this.SWMA[0] + src[2] * this.SWMA[1] +
                  src[1] * this.SWMA[2] + src[0] * this.SWMA[3]
        return this.ts(sum, id, src.__tf__)
    },

    /** True Range
     * @param {TS} fixnan - Fix NaN values
     * @return {TS} - New time-series
     */
    tr(fixnan = false, _id, _tf) {
        let id = this._tsid(_id, `tr(${fixnan})`)
        let tfs = _tf || ''
        let high = this.env.shared[`high${tfs}`]
        let low = this.env.shared[`low${tfs}`]
        let close = this.env.shared[`close${tfs}`]
        let res = 0
        if (this.na(close[1]) && fixnan) {
            res = high[0] - low[0]
        } else {
            res = Math.max(
                high[0] - low[0],
                Math.abs(high[0] - close[1]),
                Math.abs(low[0] - close[1])
            )
        }

        return this.ts(res, id, _tf)
    },

    /** True strength index
     * @param {TS} src - Input
     * @param {number} short - Short length
     * @param {number} long - Long length
     * @return {TS} - New time-series
     */
    tsi(src, short, long, _id) {
        let id = this._tsid(_id, `tsi(${short},${long})`)
        let m = this.change(src, 1, id+'0')
        let m_abs = this.ts(Math.abs(m[0]), id+'1', src.__tf__)
        let tsi = (
            this.ema(this.ema(m, long, id+'1'), short, id+'2')[0] /
            this.ema(this.ema(m_abs, long, id+'3'), short, id+'4')[0]
        )
        return this.ts(tsi, id, src.__tf__)
    },

    /** Volume Weighted Moving Average
     * @param {TS} src - Input
     * @param {number} len - length
     * @return {TS} - New time-series
     */
    vwma(src, len, _id) {
        let id = this._tsid(_id, `vwma(${len})`)
        let vol = this.env.shared.vol
        let sxv = this.ts(src[0] * vol[0], id+'1', src.__tf__)
        let res =
            this.sma(sxv, len, id+'2')[0] /
            this.sma(vol, len, id+'3')[0]
        return this.ts(res, id+'4', src.__tf__)
    },

    /** Weighted moving average
     * @param {TS} src - Input
     * @param {number} len - length
     * @return {TS} - New time-series
     */
    wma(src, len, _id) {
        let id = this._tsid(_id, `wma(${len})`)
        let norm = 0
        let sum = 0
        for (let i = 0; i < len; i++) {
            let w = (len - i) * len
            norm += w
            sum += src[i] * w
        }
        return this.ts(sum / norm, id, src.__tf__)
    },

    /** Williams %R
     * @param {number} len - length
     * @return {TS} - New time-series
     */
    wpr(len, _id, _tf) {
        let id = this._tsid(_id, `wpr(${len})`)
        let tfs = _tf || ''
        let high = this.env.shared[`high${tfs}`]
        let low = this.env.shared[`low${tfs}`]
        let close = this.env.shared[`close${tfs}`]

        let hh = this.highest(high, len, id)
        let ll = this.lowest(low, len, id)

        let res = (hh[0] - ll[0]) === 0 ? NaN : (hh[0] - close[0]) / (hh[0] - ll[0])
        return this.ts(-res * 100 , id, _tf)
    }
}
