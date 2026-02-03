# Vue 3 Migration Status

## Latest Fix: Canvas Rendering (Blank Chart)

### Problem
Chart loaded without JavaScript errors but nothing rendered:
- Candlesticks not visible
- Off-chart indicator plots not visible
- Right-hand axis (Sidebar) not visible
- Bottom axis (Botbar) not visible

### Root Cause
Three interrelated timing issues:
1. **Canvas/Renderer Timing**: When `render()` returns loading div (missing layout), canvas never created. `mounted()` finds undefined `$refs['canvas']` and returns early.
2. **Botbar.vue Missing Safeguards**: Unlike Sidebar.vue, Botbar.vue lacked null check in mounted() and layout watcher for deferred init.
3. **Overlay Registration Before Renderer**: Overlays emit `new-grid-layer` before Grid's renderer is initialized, causing layers to be lost.

### Solution Implemented
1. **Botbar.vue**: Added null check in mounted() + layout watcher + data() with layoutOverride/renderKey (matching Sidebar.vue pattern)
2. **Grid.vue**: Added `pendingLayers` queue - layers registered before renderer ready are queued and flushed when renderer initializes
3. **canvas.js**: Added null guard for missing canvas element in setup()

### Files Modified
- `src/components/Botbar.vue` - Null check, data(), layout watcher
- `src/components/Grid.vue` - pendingLayers queue + flush in layout watcher
- `src/mixins/canvas.js` - Null guard for canvas element

---

# Performance Improvements Implementation

## Quick Wins (Completed)
- [x] #3 Remove remaining deep watchers from Grid.vue, Botbar.vue, Sidebar.vue, Section.vue
- [x] #5 Memoize coordinate transformations in layout_fn.js (with cache size limits)
- [x] #7 Fix O(n²) algorithm in ts_overlap() in dc_core.js (binary search)
- [x] #10 Throttle resize operations in chart-resize.js (RAF-based)

## Medium Priority (Completed)
- [x] #9 Visible range culling - already implemented at data subset level

## Reverted
- [ ] #4 Object pooling for canvas primitives - reverted due to context issues with `this.$p` access

## High Effort (Completed)
- [x] #1 Smart redraw tracking in grid-renderer.js (dirty region detection)
- [x] #2 Layout caching for candles/volume computations in layout.js

## Deferred
- [ ] #6 Batch Vue event emissions with provide/inject (architectural change)
- [ ] #8 Reduce props drilling with provide/inject (architectural change)

## Verification
After each improvement:
1. Run `npm run dev`
2. Open Chrome DevTools Performance tab
3. Record while dragging chart for 5 seconds
4. Check frame times: target < 16ms (60fps)

---

# Vue 3 Optimization Task - Completed

## Summary

All optimization tasks completed successfully. The codebase has been modernized for Vue 3 with significant performance improvements.

## Completed Tasks

- [x] **Phase 1: Create core composables**
  - Created `src/composables/useChartActions.js` - Chart reset + save pattern
  - Created `src/composables/useCanvasRenderer.js` - Canvas setup with DPR scaling
  - Created `src/composables/useIndicatorVisibility.js` - Visibility toggle management
  - Created `src/composables/index.js` - Barrel export

- [x] **Phase 2: Eliminate deep watchers**
  - Grid.vue: 5 deep watchers -> targeted path watchers (`range.0`, `range.1`, `cursor.x`, etc.)
  - Sidebar.vue: 2 deep watchers -> targeted watchers
  - Section.vue: Removed hash hack, using computed `gridHeightKey`
  - Botbar.vue: 2 deep watchers -> targeted watchers
  - chart-range.js: Consolidated width/height watchers using computed `dimensions`

- [x] **Phase 3: Remove $forceUpdate() calls**
  - Grid.vue: Replaced with `renderKey++` reactive pattern
  - Sidebar.vue: Replaced with `renderKey++` reactive pattern
  - Section.vue: Using `rerender++` instead

- [x] **Phase 4: Performance fixes**
  - Legend.vue: Fixed O(n^2) indicator index lookup -> O(n) using `Map`
  - Keyboard.vue: Replaced object with `Map` for listener management

- [x] **Phase 5: Helper modernization**
  - dc_core.js: Added cleanup method, store watcher references
  - utils.js: Simplified `overwrite()` for Vue 3 array tracking

## Results

| Metric | Before | After | Change |
|--------|--------|-------|--------|
| $forceUpdate() calls | 5 | 0 | -100% |
| Deep watchers | 15 | 6 | -60% |
| Composables | 0 | 4 files (315 lines) | +4 reusable modules |
| O(n^2) algorithms | 1 | 0 | -100% |

### Remaining Deep Watchers (Necessary)
These deep watchers are appropriate for their use cases:
1. `chart-range.js` - OHLCV data object changes
2. `overlay.js` - Settings changes
3. `xcontrol.js` - Settings changes
4. `Crosshair.vue` - Cursor mode changes
5. `Grid.vue` - Overlays calc() tracking
6. `Toolbar.vue` - Config changes

## Build Verification

```
npm run build - SUCCESS (compiled with only size warnings)
npm run dev - SUCCESS (webpack dev server starts correctly)
```

## Files Changed

### New Files:
- `src/composables/useChartActions.js`
- `src/composables/useCanvasRenderer.js`
- `src/composables/useIndicatorVisibility.js`
- `src/composables/index.js`

### Modified Files:
- `src/components/Grid.vue` - Targeted watchers, reactive key pattern
- `src/components/Section.vue` - Removed hash hack, computed gridHeightKey
- `src/components/Sidebar.vue` - Targeted watchers, reactive key pattern
- `src/components/Legend.vue` - O(n) index lookup with Map
- `src/components/Keyboard.vue` - Map-based listener management
- `src/components/Botbar.vue` - Targeted watchers
- `src/mixins/chart/chart-range.js` - Consolidated dimension watcher
- `src/helpers/dc_core.js` - Event bus integration, cleanup method
- `src/stuff/utils.js` - Simplified array overwrite
