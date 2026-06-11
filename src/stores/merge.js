
// Framework-agnostic time-series merge engine (Phase 3.1b).
//
// Faithful extraction of dc_core's merge_objects / merge_ts / ts_overlap /
// combine + the binary-search helpers, operating on plain pivots ({p,i,v}) and
// arrays instead of `this`. Pure, Vue-free, Node-testable — the merge sibling
// of src/stores/query.js. DataCube delegates to it byte-identically (the
// Phase 1 DataCube golden masters' merge_ts matrix is the guarantee).

/** Reactive object merge: assign over a fresh object so Vue sees the change. */
export function mergeObjects(obj, data, new_obj = {}) {
    Object.assign(new_obj, obj.v)
    Object.assign(new_obj, data)
    obj.p[obj.i] = new_obj
}

/** Binary search: first index where arr[i][0] >= target (-1 if none). */
export function binarySearchGTE(arr, target) {
    if (!arr.length) return -1
    let lo = 0, hi = arr.length - 1
    while (lo < hi) {
        let mid = (lo + hi) >> 1
        if (arr[mid][0] < target) lo = mid + 1
        else hi = mid
    }
    return arr[lo][0] >= target ? lo : -1
}

/** Binary search: last index where arr[i][0] <= target (-1 if none). */
export function binarySearchLTE(arr, target) {
    if (!arr.length) return -1
    let lo = 0, hi = arr.length - 1
    while (lo < hi) {
        let mid = (lo + hi + 1) >> 1
        if (arr[mid][0] > target) hi = mid - 1
        else lo = mid
    }
    return arr[lo][0] <= target ? lo : -1
}

/** Compute the overlapping region of two sorted series. O(n) via binary search. */
export function tsOverlap(arr1, arr2, range) {
    const t1 = range[0]
    const t2 = range[1]
    let ts = new Map()

    let id11 = binarySearchGTE(arr1, t1)
    let id12 = binarySearchLTE(arr1, t2)
    let id21 = binarySearchGTE(arr2, t1)
    let id22 = binarySearchLTE(arr2, t2)

    // No elements in the window: keep the GTE INSERTION index (array end when
    // every element is earlier) with a zero length, so mergeTs's split
    // (`splice(d1[0])`) happens AT THE GAP. The old reset to [0,-1] split at
    // the front, and combine()'s "src inside dst" branch then dropped the
    // merged data entirely — gap-fill chunks silently vanished.
    if (id11 === -1 || id12 === -1 || id11 > id12) {
        id11 = id11 === -1 ? arr1.length : id11
        id12 = id11 - 1
    }
    if (id21 === -1 || id22 === -1 || id21 > id22) {
        id21 = id21 === -1 ? arr2.length : id21
        id22 = id21 - 1
    }

    for (let i = id11; i <= id12 && i < arr1.length; i++) ts.set(arr1[i][0], arr1[i])
    for (let i = id21; i <= id22 && i < arr2.length; i++) ts.set(arr2[i][0], arr2[i])

    let keys = Array.from(ts.keys()).sort((a, b) => a - b)

    return {
        od: keys.map(k => ts.get(k)),
        d1: [id11, Math.max(0, id12 - id11 + 1)],
        d2: [id21, Math.max(0, id22 - id21 + 1)]
    }
}

/** Combine (destination, overlap, source) parts into one ordered series. */
export function combine(dst, o, src) {
    function last(arr) { return arr[arr.length - 1][0] }

    if (!dst.length) { dst = o; o = [] }
    if (!src.length) { src = o; o = [] }

    // src fully inside dst: from mergeTs's call sites this branch is only ever
    // reached after the `!src.length` reassignment above forced o = [], so the
    // Object.assign is a no-op (dst already holds the result) — no front-write.
    if (src[0][0] >= dst[0][0] && last(src) <= last(dst)) {
        return Object.assign(dst, o)
    } else if (last(src) > last(dst)) {
        if (o.length < 100000 && src.length < 100000) {
            dst.push(...o, ...src)
            return dst
        } else {
            return dst.concat(o, src)
        }
    } else if (src[0][0] < dst[0][0]) {
        if (o.length < 100000 && src.length < 100000) {
            src.push(...o, ...dst)
            return src
        } else {
            return src.concat(o, dst)
        }
    } else { return [] }
}

/** Merge an overlapping source series into the dst pivot (both pre-sorted). */
export function mergeTs(obj, data) {
    if (!data.length) return obj.v

    let r1 = [obj.v[0][0], obj.v[obj.v.length - 1][0]]
    let r2 = [data[0][0], data[data.length - 1][0]]

    let o = [Math.max(r1[0], r2[0]), Math.min(r1[1], r2[1])]

    if (o[1] >= o[0]) {
        let { od, d1, d2 } = tsOverlap(obj.v, data, o)
        obj.v.splice(...d1)
        data.splice(...d2)

        if (!obj.v.length && !data.length) {
            obj.p[obj.i] = od
            return obj.v
        }
        if (!data.length) { data = obj.v.splice(d1[0]) }
        if (!obj.v.length) { obj.v = data.splice(d2[0]) }

        obj.p[obj.i] = combine(obj.v, od, data)
    } else {
        obj.p[obj.i] = combine(obj.v, [], data)
    }

    return obj.v
}
