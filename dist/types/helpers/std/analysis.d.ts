declare namespace _default {
    /** Adds values / time-series
     * @param {(TS|*)} x - First input
     * @param {(TS|*)} y - Second input
     * @return {TS} - New time-series
     */
    function add(x: (TS | any), y: (TS | any), _id: any): TS;
    /** Subtracts values / time-series
     * @param {(TS|*)} x - First input
     * @param {(TS|*)} y - Second input
     * @return {TS} - New time-series
     */
    function sub(x: (TS | any), y: (TS | any), _id: any): TS;
    /** Multiplies values / time-series
     * @param {(TS|*)} x - First input
     * @param {(TS|*)} y - Second input
     * @return {TS} - New time-series
     */
    function mult(x: (TS | any), y: (TS | any), _id: any): TS;
    /** Divides values / time-series
     * @param {(TS|*)} x - First input
     * @param {(TS|*)} y - Second input
     * @return {TS} - New time-series
     */
    function div(x: (TS | any), y: (TS | any), _id: any): TS;
    /** Returns a negative value / time-series
     * @param {(TS|*)} x - Input
     * @return {TS} - New time-series
     */
    function neg(x: (TS | any), _id: any): TS;
    /** Average of arguments
     * @param {...number} args - Numeric values
     * @return {number}
     */
    function avg(...args: number[]): number;
    /** Max of arguments
     * @param {...number} args - Numeric values
     * @return {number}
     */
    function max(...args: number[]): number;
    /** Min of arguments
     * @param {...number} args - Numeric values
     * @return {number}
     */
    function min(...args: number[]): number;
    /** Change: x[0] - x[len]
     * @param {TS} src - Input
     * @param {number} [len] - Length
     * @return {TS} - New time-series
     */
    function change(src: TS, len?: number, _id: any): TS;
    /** When one time-series crosses another
     * @param {TS} src1 - TS1
     * @param {TS} src2 - TS2
     * @return {TS} - New time-series
     */
    function cross(src1: TS, src2: TS, _id: any): TS;
    /** When one time-series goes over another one
     * @param {TS} src1 - TS1
     * @param {TS} src2 - TS2
     * @return {TS} - New time-series
     */
    function crossover(src1: TS, src2: TS, _id: any): TS;
    /** When one time-series goes under another one
     * @param {TS} src1 - TS1
     * @param {TS} src2 - TS2
     * @return {TS} - New time-series
     */
    function crossunder(src1: TS, src2: TS, _id: any): TS;
    /** Sum of all elements of src
     * @param {TS} src1 - Input
     * @return {TS} - New time-series
     */
    function cum(src: any, _id: any): TS;
    /** Test if "src" TS is falling for "len" candles
     * @param {TS} src - Input
     * @param {number} len - Length
     * @return {TS} - New time-series
     */
    function falling(src: TS, len: number, _id: any): TS;
    /** Test if "src" TS is rising for "len" candles
     * @param {TS} src - Input
     * @param {number} len - Length
     * @return {TS} - New time-series
     */
    function rising(src: TS, len: number, _id: any): TS;
    /** Highest value for a given number of candles back
     * @param {TS} src - Input
     * @param {number} len - Length
     * @return {TS} - New time-series
     */
    function highest(src: TS, len: number, _id: any): TS;
    /** Highest value offset for a given number of bars back
     * @param {TS} src - Input
     * @param {number} len - Length
     */
    function highestbars(src: TS, len: number, _id: any): any;
    /** Lowest value for a given number of candles back
     * @param {TS} src - Input
     * @param {number} len - Length
     * @return {TS} - New time-series
     */
    function lowest(src: TS, len: number, _id: any): TS;
    /** Lowest value offset for a given number of bars back
     * @param {TS} src - Input
     * @param {number} len - Length
     */
    function lowestbars(src: TS, len: number, _id: any): any;
    /** Momentum
     * @param {TS} src - Input
     * @param {number} len - Length
     * @return {TS} - New time-series
     */
    function mom(src: TS, len: number, _id: any): TS;
    /** Returns price of the pivot high point
     * Tip: works best with `offset` function
     * @param {TS} src - Input
     * @param {number} left - left threshold, candles
     * @param {number} right - right threshold, candles
     * @return {TS} - New time-series
     */
    function pivothigh(src: TS, left: number, right: number, _id: any): TS;
    /** Returns price of the pivot low point
     * Tip: works best with `offset` function
     * @param {TS} src - Input
     * @param {number} left - left threshold, candles
     * @param {number} right - right threshold, candles
     * @return {TS} - New time-series
     */
    function pivotlow(src: TS, left: number, right: number, _id: any): TS;
    /** Candles since the event occured (cond === true)
     * @param {(boolean|TS)} cond - the condition
     */
    function since(cond: (boolean | TS), _id: any): any;
    /** Returns the sliding sum of last "len" values of the source
     * @param {TS} src - Input
     * @param {number} len - Length
     * @return {TS} - New time-series
     */
    function sum(src: TS, len: number, _id: any): TS;
}
export default _default;
