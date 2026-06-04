declare namespace _default {
    function chart(): void;
    /** Display data point onchart
     * (create a new overlay in DataCube)
     * @param {(TS|TS[]|*)} x - Data point / TS / array of TS
     * @param {string} [name] - Overlay name
     * @param {Object} [sett] - Object with settings & OV type
     */
    function onchart(x: (TS | TS[] | any), name?: string, sett?: Object, _id: any): void;
    /** Display data point offchart
     * (create a new overlay in DataCube)
     * @param {(TS|TS[]|*)} x - Data point / TS / array of TS
     * @param {string} [name] - Overlay name
     * @param {Object} [sett] - Object with settings & OV type
     */
    function offchart(x: (TS | TS[] | any), name?: string, sett?: Object, _id: any): void;
    /** Returns true when the candle(<tf>) is being closed
     * @param {(number|string)} tf - Timeframe in ms or as a string
     * @return {boolean}
     */
    function onclose(tf: (number | string)): boolean;
    /** Emits an event to DataCube
     * @param {string} type - Signal type
     * @param {*} data - Signal data
     */
    function signal(type: string, data?: any): void;
    /** Emits an event if cond === true
     * @param {(boolean|TS)} cond - The condition
     * @param {string} type - Signal type
     * @param {*} data - Signal data
     */
    function signalif(cond: (boolean | TS), type: string, data?: any): void;
    /** Sends update to some overlay / main chart
     * @param {string} id - Overlay id
     * @param {Object} fields - Fields to be overwritten
     */
    function modify(id: string, fields: Object): void;
    /** Sends settings update
     * (can be called from init(), update() or post())
     * @param {Object} upd - Settings update (object to merge)
     */
    function settings(upd: Object): void;
}
export default _default;
