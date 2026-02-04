# Performance Lessons Learned

## 2026-02-04: Critical Performance Optimizations

### Overview
Implemented 10 critical performance fixes for scrolling, scaling, dragging, and drawing operations.

---

## Fix #1: Script Engine Full Re-execution (CRITICAL)
**File:** `src/helpers/script_engine.js`

### Problem
Scripts re-executed through entire dataset on ANY settings change, including display-only changes (colors, line widths).

### Solution
- Added `DISPLAY_ONLY_SETTINGS` Set to identify non-computation settings
- Added `_outputCache` Map to cache computed outputs per script
- Added `_computationHash()` to track computation-affecting settings
- Modified `exec_sel()` to skip re-execution for display-only changes
- Added progress reporting during long executions

### Impact
- Display settings changes: **Instant** (was seconds)
- Same params re-execution: Uses cache

---

## Fix #2: Candle/Volbar Object Creation Per Frame (CRITICAL)
**Files:** `src/components/overlays/Candles.vue`, `src/components/primitives/candle-draw.js`

### Problem
Created `new Candle()` and `new Volbar()` objects for every visible candle on every frame, causing massive GC pressure.

### Solution
- Created static draw functions `drawCandle()` and `drawVolbar()` in new file `candle-draw.js`
- Replaced object instantiation with direct function calls

### Impact
- Eliminates 1000+ object allocations per frame
- Reduced GC pauses and stuttering

---

## Fix #3: TI_MAPPING Array Spread in Hot Loops (CRITICAL)
**File:** `src/components/js/ti_mapping.js`

### Problem
Array spread operator `[...array]` used in tight loops, creating new arrays for each candle.

### Solution
- Replaced `[...data[i]]` with `data[i].slice()`
- `slice()` is optimized for array copying

### Impact
- Reduced memory allocations in data mapping
- Faster index-based mode calculations

---

## Fix #4: Overlay Array Copy & Sort Every Frame (CRITICAL)
**File:** `src/components/js/grid/grid-renderer.js`

### Problem
Copied and sorted overlays array on every render frame (60fps).

### Solution
- Added `_sortedOverlays` cache
- Added `_overlaysSortDirty` flag
- Only re-sort when overlays are added/removed

### Impact
- Eliminated 60 array copies + sorts per second during interaction

---

## Fix #5: getBoundingClientRect on Every Mousemove (HIGH)
**File:** `src/components/js/grid.js`

### Problem
`calc_offset()` called `getBoundingClientRect()` on every cursor move, forcing layout recalculation.

### Solution
- Added offset caching with `_offsetCached` flag
- Cache refreshes every 100ms or when forced
- Added `invalidate_offset()` for resize/scroll events

### Impact
- Eliminated layout thrashing during mouse movement

---

## Fix #6: Layout Recalculation on Every Tick (HIGH)
**File:** `src/mixins/chart/chart-range.js`

### Status
Already optimized with hash-key watchers (`dataHashKey` computed property).
Layout recalculation is necessary when data actually changes.

---

## Fix #7: Grid Resizer Unthrottled Mousemove (HIGH)
**File:** `src/components/GridResizer.vue`

### Problem
`onMouseMove` fired at 100+ Hz with no throttling during resize.

### Solution
- Added RAF-throttling with `_rafId` and `_lastEvent`
- Batch multiple mousemove events into single RAF callback
- Cancel pending RAF on unmount

### Impact
- Reduced resize event frequency to ~60fps
- Eliminated layout thrashing during grid resize

---

## Fix #8: Array.unshift() O(n) in Indicator Step
**File:** `src/helpers/script_engine.js`

### Status
Mitigated by existing `limit()` function which truncates arrays to small sizes (DEF_LIMIT = 5).
The O(n) concern is bounded to O(5) = O(1) in practice.

---

## Fix #9: Sidebar Full Redraw on Cursor Y Change (HIGH)
**Files:** `src/components/Sidebar.vue`, `src/components/js/sidebar.js`

### Problem
Entire sidebar (all price labels) redrawn when only cursor panel needed updating.

### Solution
- Added `updatePanelOnly()` method to sidebar.js
- Added `_clearPanel()` helper for targeted clearing
- Modified Sidebar.vue watcher to use panel-only update

### Impact
- Cursor movement only redraws small panel area
- Price labels not redrawn on every cursor move

---

## Fix #10: AggTool Live Updates Not RAF-synchronized (HIGH)
**File:** `src/helpers/agg_tool.js`

### Problem
Live data polling used `setTimeout` instead of syncing with render loop.

### Solution
- Added `_scheduleNextUpdate()` with RAF coordination
- Combines minimum interval with RAF sync
- Added proper `destroy()` cleanup method

### Impact
- Updates sync with render loop, preventing tearing
- Proper cleanup prevents memory leaks

---

## Summary Table

| Fix | Severity | Files Changed | Key Change |
|-----|----------|---------------|------------|
| 1 | CRITICAL | script_engine.js | Output caching for display-only changes |
| 2 | CRITICAL | Candles.vue, candle-draw.js | Static draw functions |
| 3 | CRITICAL | ti_mapping.js | slice() instead of spread |
| 4 | CRITICAL | grid-renderer.js | Cached sorted overlays |
| 5 | HIGH | grid.js | Offset caching |
| 6 | - | chart-range.js | Already optimized |
| 7 | HIGH | GridResizer.vue | RAF throttling |
| 8 | - | script_engine.js | Already bounded |
| 9 | HIGH | Sidebar.vue/js | Panel-only updates |
| 10 | HIGH | agg_tool.js | RAF-coordinated updates |

---

## Phase 2 Optimizations (2026-02-04)

### Fix #11: Deep Watchers on Complex Objects (HIGH)
**Files:** `src/mixins/xcontrol.js`, `src/components/Toolbar.vue`

### Problem
Deep watchers traverse entire nested objects on every change, causing O(n) work even for unrelated property changes.

### Solution
- Replaced deep watch on `xSettings` with computed hash key watcher
- Replaced deep watch on `data` in Toolbar with computed `toolsLength`
- Used `markRaw()` for controller instances to prevent Vue reactivity overhead

### Impact
- Settings changes now O(1) instead of O(n) for nested object traversal
- Controller objects not tracked by Vue's reactivity system

---

### Fix #12: measureText Called on Every Cursor Move (MEDIUM)
**File:** `src/components/js/botbar.js`

### Problem
Canvas `measureText()` is relatively expensive and was called on every cursor move.

### Solution
- Added `measureTextCache` Map with font+text key
- Cache limited to 100 entries with FIFO eviction
- Used cached values in `panel()` method

### Impact
- Text measurement now O(1) for repeated strings
- Reduced canvas API calls during cursor movement

---

### Fix #13: Single-Pass Filter in Cursor Updater (MEDIUM)
**File:** `src/components/js/updater.js`

### Problem
Two separate `filter()` calls on same array for sequential vs custom grids.

### Solution
- Combined into single-pass loop separating items by grid.id condition
- Used `concat()` instead of spread operator for array joining

### Impact
- Reduced iterations from 2N to N for offchart overlay filtering

---

## Updated Summary Table

| Fix | Severity | Files Changed | Key Change |
|-----|----------|---------------|------------|
| 1 | CRITICAL | script_engine.js | Output caching for display-only changes |
| 2 | CRITICAL | Candles.vue, candle-draw.js | Static draw functions |
| 3 | CRITICAL | ti_mapping.js | slice() instead of spread |
| 4 | CRITICAL | grid-renderer.js | Cached sorted overlays |
| 5 | HIGH | grid.js | Offset caching |
| 6 | - | chart-range.js | Already optimized |
| 7 | HIGH | GridResizer.vue | RAF throttling |
| 8 | - | script_engine.js | Already bounded |
| 9 | HIGH | Sidebar.vue/js | Panel-only updates |
| 10 | HIGH | agg_tool.js | RAF-coordinated updates |
| 11 | HIGH | xcontrol.js, Toolbar.vue | Hash key watchers, markRaw |
| 12 | MEDIUM | botbar.js | measureText caching |
| 13 | MEDIUM | updater.js | Single-pass filter |

---

## Prevention Rules

1. **Never create objects in render loops** - Use static functions or object pooling
2. **Never use spread operator in hot loops** - Use `slice()` or direct assignment
3. **Cache expensive sorts** - Only re-sort when data changes
4. **Avoid getBoundingClientRect in event handlers** - Cache and refresh periodically
5. **Use RAF for high-frequency events** - Throttle mousemove, resize, wheel
6. **Separate computation from display** - Track what actually needs recalculation
7. **Sync data updates with render loop** - Use RAF coordination
8. **Replace deep watchers with hash keys** - Compute a simple string key from relevant properties
9. **Use markRaw for complex non-reactive objects** - Prevents Vue from adding reactivity proxies
10. **Cache expensive DOM/canvas API calls** - measureText, getBoundingClientRect, etc.
