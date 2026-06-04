declare namespace _default {
    /**
     * Creates a new time-series & records each x.
     * Returns an array. Id is auto-generated
     * @param {*} x - A variable to sample from
     * @return {TS} - New time-series
     */
    function ts(x: any, _id: any, _tf: any): TS;
    /**
     * Creates a new time-series & records each x.
     * Uses Sampler to aggregate the values
     * Return the an array. Id is auto-generated
     * @param {*} x - A variable to sample from
     * @param {(number|string)} tf - Timeframe in ms or as a string
     * @return {TS} - New time-series
     */
    function tstf(x: any, tf: (number | string), _id: any): TS;
    /**
     * Creates a new custom sampler.
     * Return the an array. Id is auto-generated
     * @param {*} x - A variable to sample from
     * @param {string} type - Sampler type
     * @param {(number|string)} tf - Timeframe in ms or as a string
     * @return {TS} - New time-series
     */
    function sample(x: any, type: string, tf: (number | string), _id: any): TS;
    function _tsid(prev: any, next: any): string;
    function _i(i: any, x: any): any;
    function _v(x: any, i: any): any;
}
export default _default;
