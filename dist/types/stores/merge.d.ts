/** Reactive object merge: assign over a fresh object so Vue sees the change. */
export function mergeObjects(obj: any, data: any, new_obj?: {}): void;
/** Binary search: first index where arr[i][0] >= target (-1 if none). */
export function binarySearchGTE(arr: any, target: any): number;
/** Binary search: last index where arr[i][0] <= target (-1 if none). */
export function binarySearchLTE(arr: any, target: any): number;
/** Compute the overlapping region of two sorted series. O(n) via binary search. */
export function tsOverlap(arr1: any, arr2: any, range: any): {
    od: any[];
    d1: number[];
    d2: number[];
};
/** Combine (destination, overlap, source) parts into one ordered series. */
export function combine(dst: any, o: any, src: any): any;
/** Merge an overlapping source series into the dst pivot (both pre-sorted). */
export function mergeTs(obj: any, data: any): any;
