declare namespace _default {
    /** Arnaud Legoux Moving Average
     * @param {TS} src - Input
     * @param {number} len - Length
     * @param {number} offset - Offset
     * @param {number} sigma - Sigma
     * @return {TS} - New time-series
     */
    function alma(src: TS, len: number, offset: number, sigma: number, _id: any): TS;
    /** Average True Range
     * @param {number} len - Length
     * @return {TS} - New time-series
     */
    function atr(len: number, _id: any, _tf: any): TS;
    /** Bollinger Bands
     * @param {TS} src - Input
     * @param {number} len - Length
     * @param {number} mult - Multiplier
     * @return {TS[]} - Array of new time-series (3 bands)
     */
    function bb(src: TS, len: number, mult: number, _id: any): TS[];
    /** Bollinger Bands Width
     * @param {TS} src - Input
     * @param {number} len - Length
     * @param {number} mult - Multiplier
     * @return {TS} - New time-series
     */
    function bbw(src: TS, len: number, mult: number, _id: any): TS;
    /** Commodity Channel Index
     * @param {TS} src - Input
     * @param {number} len - Length
     * @return {TS} - New time-series
     */
    function cci(src: TS, len: number, _id: any): TS;
    /** Chande Momentum Oscillator
     * @param {TS} src - Input
     * @param {number} len - Length
     * @return {TS} - New time-series
     */
    function cmo(src: TS, len: number, _id: any): TS;
    /** Center of Gravity
     * @param {TS} src - Input
     * @param {number} len - Length
     * @return {TS} - New time-series
     */
    function cog(src: TS, len: number, _id: any): TS;
    /** Deviation from SMA
     * @param {TS} src - Input
     * @param {number} len - Length
     * @return {TS} - New time-series
     */
    function dev(src: TS, len: number, _id: any): TS;
    /** Directional Movement Index ADX, +DI, -DI
     * @param {number} len - Length
     * @param {number} smooth - Smoothness
     * @return {TS} - New time-series
     */
    function dmi(len: number, smooth: number, _id: any, _tf: any): TS;
    /** Exponential Moving Average with alpha = 2 / (y + 1)
     * @param {TS} src - Input
     * @param {number} len - Length
     * @return {TS} - New time-series
     */
    function ema(src: TS, len: number, _id: any): TS;
    /** Hull Moving Average
     * @param {TS} src - Input
     * @param {number} len - Length
     * @return {TS} - New time-series
     */
    function hma(src: TS, len: number, _id: any): TS;
    /** Keltner Channels
     * @param {TS} src - Input
     * @param {number} len - Length
     * @param {number} mult - Multiplier
     * @param {boolean} [use_tr] - Use true range
     * @return {TS[]} - Array of new time-series (3 bands)
     */
    function kc(src: TS, len: number, mult: number, use_tr?: boolean, _id: any, _tf: any): TS[];
    /** Keltner Channels Width
     * @param {TS} src - Input
     * @param {number} len - Length
     * @param {number} mult - Multiplier
     * @param {boolean} [use_tr] - Use true range
     * @return {TS} - New time-series
     */
    function kcw(src: TS, len: number, mult: number, use_tr?: boolean, _id: any, _tf: any): TS;
    /** Linear Regression
     * @param {TS} src - Input
     * @param {number} len - Length
     * @param {number} offset - Offset
     * @return {TS} - New time-series
     */
    function linreg(src: TS, len: number, offset: number | undefined, _id: any): TS;
    /** Moving Average Convergence/Divergence
     * @param {TS} src - Input
     * @param {number} fast - Fast EMA
     * @param {number} slow - Slow EMA
     * @param {number} sig - Signal
     * @return {TS[]} - [macd, signal, hist]
     */
    function macd(src: TS, fast: number, slow: number, sig: number, _id: any): TS[];
    /** Money Flow Index
     * @param {TS} src - Input
     * @param {number} len - Length
     * @return {TS} - New time-series
     */
    function mfi(src: TS, len: number, _id: any): TS;
    /** Exponentially MA with alpha = 1 / length
     * Used in RSI
     * @param {TS} src - Input
     * @param {number} len - Length
     * @return {TS} - New time-series
     */
    function rma(src: TS, len: number, _id: any): TS;
    /** Rate of Change
     * @param {TS} src - Input
     * @param {number} len - Length
     * @return {TS} - New time-series
     */
    function roc(src: TS, len: number, _id: any): TS;
    /** Relative Strength Index
     * @param {TS} x - First Input
     * @param {number|TS} y - Second Input
     * @return {TS} - New time-series
     */
    function rsi(x: TS, y: number | TS, _id: any): TS;
    /** Parabolic SAR
     * @param {number} start - Start
     * @param {number} inc - Increment
     * @param {number} max - Maximum
     * @return {TS} - New time-series
     */
    function sar(start: number, inc: number, max: number, _id: any, _tf: any): TS;
    /** Simple Moving Average
     * @param {TS} src - Input
     * @param {number} len - Length
     * @return {TS} - New time-series
     */
    function sma(src: TS, len: number, _id: any): TS;
    /** Standard deviation
     * @param {TS} src - Input
     * @param {number} len - Length
     * @return {TS} - New time-series
     */
    function stdev(src: TS, len: number, _id: any): TS;
    /** Stochastic
     * @param {TS} src - Input
     * @param {TS} high - TS of high
     * @param {TS} low - TS of low
     * @param {number} len - Length
     * @return {TS} - New time-series
     */
    function stoch(src: TS, high: TS, low: TS, len: number, _id: any): TS;
    /** Supertrend Indicator
     * @param {number} factor - ATR multiplier
     * @param {number} atrlen - Length of ATR
     * @return {TS[]} - Supertrend line and direction of trend
     */
    function supertrend(factor: number, atrlen: number, _id: any, _tf: any): TS[];
    /** Symmetrically Weighted Moving Average
     * @param {TS} src - Input
     * @return {TS} - New time-series
     */
    function swma(src: TS, _id: any): TS;
    /** True Range
     * @param {TS} fixnan - Fix NaN values
     * @return {TS} - New time-series
     */
    function tr(fixnan: TS, _id: any, _tf: any): TS;
    /** True strength index
     * @param {TS} src - Input
     * @param {number} short - Short length
     * @param {number} long - Long length
     * @return {TS} - New time-series
     */
    function tsi(src: TS, short: number, long: number, _id: any): TS;
    /** Volume Weighted Moving Average
     * @param {TS} src - Input
     * @param {number} len - length
     * @return {TS} - New time-series
     */
    function vwma(src: TS, len: number, _id: any): TS;
    /** Weighted moving average
     * @param {TS} src - Input
     * @param {number} len - length
     * @return {TS} - New time-series
     */
    function wma(src: TS, len: number, _id: any): TS;
    /** Williams %R
     * @param {number} len - length
     * @return {TS} - New time-series
     */
    function wpr(len: number, _id: any, _tf: any): TS;
}
export default _default;
