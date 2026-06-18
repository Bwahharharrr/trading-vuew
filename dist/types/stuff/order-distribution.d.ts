export function distributeOrders({ low, high, qty, size, dist, sizePrec }: {
    low: any;
    high: any;
    qty: any;
    size: any;
    dist?: string | undefined;
    sizePrec?: number | undefined;
}): {
    id: string;
    price: number;
    size: number;
}[];
