// Object pooling utilities to reduce GC pressure
// Reuses objects for frequent events instead of creating new ones

/**
 * Simple object pool for reusing event data objects
 * Reduces garbage collection during high-frequency operations
 */
export class ObjectPool {
    constructor(factory, reset, initialSize = 4) {
        this.factory = factory    // Function to create new objects
        this.reset = reset        // Function to reset object state
        this.pool = []

        // Pre-allocate initial objects
        for (let i = 0; i < initialSize; i++) {
            this.pool.push(this.factory())
        }
    }

    /**
     * Acquire an object from the pool (or create new if empty)
     */
    acquire() {
        if (this.pool.length > 0) {
            return this.pool.pop()
        }
        return this.factory()
    }

    /**
     * Release an object back to the pool
     */
    release(obj) {
        if (this.reset) {
            this.reset(obj)
        }
        this.pool.push(obj)
    }

    /**
     * Clear the pool
     */
    clear() {
        this.pool.length = 0
    }
}

/**
 * Pre-configured pool for cursor-changed event objects
 */
export function createCursorEventPool() {
    return new ObjectPool(
        // Factory: create cursor event object
        () => ({ grid_id: undefined, x: undefined, y: undefined, mode: undefined }),
        // Reset: clear all fields
        (obj) => {
            obj.grid_id = undefined
            obj.x = undefined
            obj.y = undefined
            obj.mode = undefined
        },
        2  // Initial pool size
    )
}

/**
 * Pre-configured pool for drag range arrays
 * Used in pan operations that frequently create [start, end] arrays
 */
export function createRangeArrayPool() {
    return new ObjectPool(
        () => [0, 0],
        (arr) => { arr[0] = 0; arr[1] = 0 },
        4
    )
}

export default { ObjectPool, createCursorEventPool, createRangeArrayPool }
