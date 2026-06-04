/**
 * Pre-configured pool for cursor-changed event objects
 */
export function createCursorEventPool(): ObjectPool;
/**
 * Pre-configured pool for drag range arrays
 * Used in pan operations that frequently create [start, end] arrays
 */
export function createRangeArrayPool(): ObjectPool;
/**
 * Simple object pool for reusing event data objects
 * Reduces garbage collection during high-frequency operations
 */
export class ObjectPool {
    constructor(factory: any, reset: any, initialSize?: number);
    factory: any;
    reset: any;
    pool: any[];
    /**
     * Acquire an object from the pool (or create new if empty)
     */
    acquire(): any;
    /**
     * Release an object back to the pool
     */
    release(obj: any): void;
    /**
     * Clear the pool
     */
    clear(): void;
}
declare namespace _default {
    export { ObjectPool };
    export { createCursorEventPool };
    export { createRangeArrayPool };
}
export default _default;
