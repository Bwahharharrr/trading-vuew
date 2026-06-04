declare namespace _default {
    /** Replaces the variable if it's NaN
     * @param {*} x - The variable
     * @param {*} [v] - A value to replace with
     * @return {*} - New value
     */
    function nz(x: any, v?: any): any;
    /** Is the variable NaN ?
     * @param {*} x - The variable
     * @return {boolean} - New value
     */
    function na(x: any): boolean;
    /** Replaces the var with NaN if Infinite
     * @param {*} x - The variable
     * @param {*} [v] - A value to replace with
     * @return {*} - New value
     */
    function nf(x: any, v?: any): any;
    /** Converts the variable to Boolean
     * @param {number} x The variable
     * @return {number}
     */
    function bool(x: number): number;
    /** Returns x or y depending on the condition
     * @param {(boolean|TS)} cond - Condition
     * @param {*} x - First value
     * @param {*} y - Second value
     * @return {*}
     */
    function iff(cond: (boolean | TS), x: any, y: any): any;
    /** Sets the reverse buffer size for a given
     * time-series (default = 5, grows on demand)
     * @param {TS} src - Input
     * @param {number} len - New length
     */
    function buffsize(src: TS, len: number): void;
    /** For a given series replaces NaN values with
     * previous nearest non-NaN value
     * @param {TS} src - Input time-series
     * @return {TS}
     */
    function fixnan(src: TS): TS;
    /** Shifts TS left or right by "num" candles
     * @param {number} num - Offset measured in candles
     * @return {TS} - New / existing time-series
     */
    function offset(src: any, num: number, _id: any): TS;
}
export default _default;
