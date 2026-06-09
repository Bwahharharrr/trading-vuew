// Pure distribution math for the OrderBox tool.
//
// Distributes a total `size` across `qty` order lines whose prices span the box
// range [low, high] (inclusive). `dist`:
//   'flat' — even size at evenly spaced prices
//   'asc'  — size ramps UP toward the HIGH price   (weight i+1)
//   'desc' — size ramps UP toward the LOW price     (weight N-i)
//
// Σ(order.size) === size exactly (to `sizePrec` decimals): the rounding drift is
// absorbed into the last order. Prices are full precision (display uses grid.prec).
// Deterministic ids only (ord-1..ord-N) — no Date.now/random.

export function distributeOrders({ low, high, qty, size, dist = 'flat', sizePrec = 2 }) {
    let lo = Number(low)
    let hi = Number(high)
    if (!(lo < hi)) {                 // swap (or collapse) so lo <= hi
        const t = lo; lo = hi; hi = t
    }
    const N = Math.max(1, Math.trunc(Number(qty) || 0))
    const S = Number(size) || 0

    // Price levels: i=0 -> low, i=N-1 -> high; single order -> midprice.
    const priceAt = (i) => N === 1 ? (lo + hi) / 2 : lo + (hi - lo) * (i / (N - 1))

    const weight = (i) => {
        if (dist === 'asc') return i + 1        // more toward HIGH price
        if (dist === 'desc') return N - i       // more toward LOW price
        return 1                                 // flat
    }
    let W = 0
    for (let i = 0; i < N; i++) W += weight(i)

    const round = (v) => Number(v.toFixed(sizePrec))
    const orders = []
    let allocated = 0
    for (let i = 0; i < N; i++) {
        const price = priceAt(i)
        let sz
        if (i === N - 1) {
            sz = round(S - allocated)            // absorb rounding drift -> Σ === S
        } else {
            sz = round((S * weight(i)) / W)
            allocated += sz
        }
        orders.push({ id: `ord-${i + 1}`, price, size: sz })
    }
    return orders
}
