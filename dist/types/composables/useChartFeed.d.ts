/**
 * Drive a FeedSource (CorkyFeed / FileFeed) from a Vue component.
 *
 * @param {object|(() => object)} sourceOrFactory - a FeedSource instance, or a
 *   0-arg factory returning one. A factory hands lifetime ownership (destroy on
 *   scope dispose) to the composable.
 * @returns {{
 *   states: import('vue').Ref<any[]>,
 *   loading: import('vue').Ref<boolean>,
 *   error: import('vue').Ref<any|null>,
 *   current: import('vue').Ref<object|null>,
 *   progress: import('vue').Ref<any|null>,
 *   discover: () => Promise<any[]>,
 *   select: (opts: object) => Promise<any>,
 *   clear: () => Promise<void>,
 *   source: object,
 * }}
 */
export function useChartFeed(sourceOrFactory: object | (() => object)): {
    states: import("vue").Ref<any[]>;
    loading: import("vue").Ref<boolean>;
    error: import("vue").Ref<any | null>;
    current: import("vue").Ref<object | null>;
    progress: import("vue").Ref<any | null>;
    discover: () => Promise<any[]>;
    select: (opts: object) => Promise<any>;
    clear: () => Promise<void>;
    source: object;
};
export default useChartFeed;
