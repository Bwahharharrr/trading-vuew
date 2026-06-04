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

---

# Phase-Gated Modernization (workflow-planned, critic-reviewed) — 2026-06-02

Executing the recommended phase-gated plan foundation-first. Nothing risky
starts until its safety nets are green.

## ✅ Phase 1 — Foundation: Build, Types, Numeric + Visual Safety Nets (COMPLETE & VERIFIED)

- [x] **Vite + Vitest migration** — single `vite.config.ts` → 3 artifacts:
      `trading-vue.js` (UMD, Vue bundled, CDN contract preserved), `.min.js`,
      `trading-vue.es.js` (ESM, Vue external, tree-shakeable). Worker moved to
      Vite `?worker&inline`; deleted all 4 webpack configs, `ww_plugin.js`,
      `tmp/ww$$$.json`, the `lz-string` blob dance, `.babelrc`. CSS auto-injected
      (= old vue-style-loader). Dev server ported faithfully in
      `vite/dev-server-plugin.ts` (live-WS proxy `/live-ws/<port>`, `/data-files`,
      `/debug`, static `/data`, data-dir watch-ignore).
- [x] **TypeScript scaffolding** — `tsconfig.json` + `tsconfig.build.json`;
      `src/index.ts`; `vue-tsc` clean; ships `dist/types/index.d.ts`; package
      exports/main/module/types/unpkg wired.
- [x] **Golden masters (linchpin)** — `test/golden/_engine-harness.js` drives the
      singleton engine directly (bypassing the worker). 28 indicators + nested
      lineage snapshotted over the BTC fixture; determinism proven (re-runs
      byte-identical); FP-tolerance 8 decimals. DataCube golden: merge_ts matrix
      + get_by_query.
- [x] **Visual baseline + metrics shim** (pulled into P1 per review) —
      `test/visual/` rasterises real Candle/Volbar primitives on skia-canvas →
      stable, deterministic, sensitivity-verified pixel signature.
      `src/stuff/metrics.js` = minimal SSR-safe RenderMetrics for P3 budgets.
- [x] **CI + size + SSR** — `.github/workflows/ci.yml` (typecheck+lint+test+
      build+size). ESLint modernized (ecmaVersion 2018→2021 fixed 27 parse
      errors); legacy debt → warnings; `no-undef` kept as error. `size-limit`
      budgets (ESM 92kB/130, UMD-min 142kB/190 brotli). `test/ssr/` import-safety.

### Verification — all gates green
- typecheck → 0 · lint → 0 errors (619 warnings = tracked debt) · tests → 96 pass
- build → UMD + UMD.min + ESM + index.d.ts · size → within budget · dev → boots clean

### Real bugs fixed (found by `no-undef`, both block-scope ReferenceErrors)
- `utils.js index_shift()` — `i` block-scoped to first loop → threw in IB-mode.
- `pan-manager.js` — `let range` inside `if`, used outside → threw in log-scale pan.

## ✅ Phase 2 — Validated Boundaries (COMPLETE & VERIFIED)

Dependency-free validation seam (no schema lib → keeps the size gate happy),
additive and non-breaking (default `validation: 'warn'`).

- [x] **Schema + validate() seam** — `src/helpers/schema/{diagnostics,validate}.js`
      produce typed `Diagnostic`s. Wired at the primary choke point
      (DataCube constructor) + the live-feed choke point (ws-manager
      `_wsHandleCandle`, always warns — never kills the stream). Modes
      off/warn/strict; default warn.
- [x] **Typed worker protocol + guards** — `src/helpers/schema/worker-messages.js`
      guards `script_ww.js onmessage`: malformed envelope → typed diagnostic +
      skip (no engine crash); unknown-but-wellformed → warn + no-op (forward
      compatible). Union typed in `src/types/worker-messages.ts`.
- [x] **Typed EventMap** — enumerated every `$emit` site; `src/types/events.ts`
      types the public events + the custom-event relay catalog. Runtime
      unchanged (mitt intact). Shipped in `dist/types`.
- [x] **OverlayDefinition + registration validation** — `src/types/overlay.ts`
      contract; `src/helpers/schema/validate-overlay.js` validates each overlay
      when the Grid registry is built (Grid.vue created()), replacing the silent
      skip + "reload the browser" mount stub with a loud registration diagnostic.

### Verification — all gates green
- typecheck 0 · lint 0 errors · **127 tests** (+31 over Phase 1) · build+d.ts · size within budget
- Public types confirmed in `dist/types/index.d.ts`; **all Phase 1 golden + visual snapshots byte-identical** (no behaviour drift).

## 🔄 Phase 3 — Vue-Agnostic Core (IN PROGRESS, gated by P1 goldens)

### ✅ 3.1a — Read-side strangler-fig seam (COMPLETE & VERIFIED)
- [x] **Query engine extracted** → `src/stores/query.js` (framework-agnostic,
      Node-testable `getByQuery`/`querySearch`/`chartAsPiv` + opt-in
      `createQueryCache`). dc_core delegates; **DataCube goldens byte-identical**.
- [x] **ChartUI store** → `src/stores/chart-ui.js` typed facade for
      tool/drawingMode/scrollLock/selected/tools, wired as `this.ui` (backed by
      `this.data` → zero behaviour/reactivity change). Unit-tested.
- [x] Store types in `src/types/store.ts`.
- Verify: 140 tests (+13), golden+visual byte-identical, typecheck/lint/build/size green.

### 🔓 3.1b — Mutations→actions + reactivity elimination (UNBLOCKED — gate built)
The risky core: move merge/set/del/add + AggTool tick path into ChartData typed
actions; migrate dc_events UI sites to `this.ui`; physically separate UI state;
**then** delete `touchData`/`dataVersion`/the JSON.stringify fingerprint watcher.

**Gate built** (`test/stress/`, `_stress-harness.js` + `live-feed.stress.test.js`):
drives the real `DataCube.update` live path headlessly with a Vue reactive
watcher counting render invalidations. **Baseline (current touchData/dataVersion):**
- 600 same-candle ticks between flushes ⇒ **1** render (AggTool collapse)
- 10 candles × 60 ticks, flush each ⇒ **10** renders, all appended, none lost
- render invalidations == touchData calls (1:1 bridge)
- 600 ticks total ≈ 0.9 ms, p99/tick ≈ 0.003 ms (sustains ≫ 600/sec)

The 3.1b rewrite MUST keep these green. The harness is reusable for the
before/after comparison.

**3.1b structural-mutation seam — COMPLETE & VERIFIED:**
- [x] Merge engine extracted → `src/stores/merge.js` (pure: mergeTs/mergeObjects/
      tsOverlap/combine/binary-search). dc_core delegates; merge_ts matrix goldens byte-identical.
- [x] `src/stores/chart-data.js` — `ChartData` store owns the data API
      (query/get/getOne/set/merge/del/add/lock/unlock); bodies moved verbatim.
      DataCube delegates via a lazy `cd` getter; data/UI now a store layer
      (query.js + merge.js + chart-data.js + chart-ui.js).
- [x] 169 tests; goldens + visual + **stress baseline** all green; live path untouched.

**✅ 3.1b-final — dataVersion DELETED (COMPLETE & VERIFIED):**
- [x] Removed the `data.dataVersion` integer field and the `touchData()`
      `$props.data.data` raw/reactive routing hack.
- [x] Replaced with a store-owned reactive signal: a `ref` held in a CLOSURE
      inside `ChartData` (so it's never auto-unwrapped through a reactive proxy,
      and the AggTool raw-`this` problem disappears — the ref is reactive on its
      own). `cd.invalidate()` bumps it; `cd.revision()` reads it.
- [x] `touchData()` kept as a thin delegate → `cd.invalidate()` (the external
      ws-manager/view-manager bulk-recolor callers keep working unchanged).
- [x] Exposed via a non-enumerable `data.$cd` back-ref (the prop is `dc.data`,
      not the DataCube). `chart-range.dataHashKey` + the Grid forwarding read
      `data.$cd.revision()`.
- [x] **No perf regression**: kept EXPLICIT (shallow) invalidation — did NOT
      make OHLCV reactive(), so no per-candle proxy overhead. Same perf profile
      as the old counter, cleaner architecture.
- [x] **Live-coloring preserved**: new component test proves a colour-only write
      (close unchanged) still triggers a redraw — the scmr_color feature works.
- Verify: 175 tests; goldens+visual byte-identical; stress collapse preserved
  (600 ticks→1 render, same throughput); render-trigger + colour + no-thrash green;
  dev boots clean.

### ✅ Component-test harness (COMPLETE — unblocks 3.1b-final AND 3.3b)
- [x] `test/component/_component-harness.js` — mounts real TradingVue/Grid in
      jsdom with a recording 2D context + controllable RAF (`flushRaf`/`settle`),
      asserting draw activity (no real pixels).
- [x] `chart-mount.test.js` (smoke) + `render-trigger.test.js`: mount draws
      grid+candles (orchestration → 3.3b); `touchData`→redraw + no-thrash +
      live-candle redraw/append (→ 3.1b-final). 174 tests; all gates green.

### ✅ 3.2 — Instantiable ScriptExecutor behind a Transport seam (COMPLETE & VERIFIED)
- [x] `ScriptEngine` exported as a named class (instantiable); singleton default kept.
- [x] Message dispatch extracted from the worker into shared `src/helpers/script_dispatch.js`
      (`makeDispatcher`/`wireEngineEvents`); `script_ww.js` is now a thin wrapper.
- [x] `src/helpers/transport/sync-transport.js` runs the engine in-process (Node/tests);
      `transport/index.js` documents the seam (WorkerTransport = `WebWork`). `src/types/transport.ts`.
- [x] **Exit gate proven**: SyncTransport runs the full 28-indicator golden corpus
      **byte-identical** to the singleton drive (`test/golden/sync-transport.test.js`),
      via the REAL dispatch path. 142 tests; all golden+visual byte-identical; build/size green.
### ✅ 3.3a — CanvasContext + per-overlay error boundary (COMPLETE & VERIFIED)
- [x] `src/render/canvas-context.js` — framework-agnostic boundary: scoped
      save/restore, typed diagnostic + **error dedup** (was logged every frame),
      **path-reset on failure** (bad overlay can't corrupt the next), optional
      RenderMetrics draw-call counting. Happy path byte-identical (`!l.display`
      semantics matched; beginPath only in the error branch).
- [x] `grid-renderer.js` delegates the overlay loop to it (band-aid try/catch removed).
- [x] Headless-tested (skia-canvas): isolation, dedup, no-corruption-after-throw,
      recovery, metrics, ctx-repoint. 149 tests; golden+visual byte-identical; dev boots.

### ✅ 3.3b — RenderEngine extraction (COMPLETE & VERIFIED)
- [x] `src/render/render-engine.js` — framework-agnostic drawing core taking an
      immutable frame ({canvas,layout,colors,overlays,shaders,crosshair,...}):
      `renderStatic` (clear→shaders→grid→overlays→crosshair), `renderDynamic`
      (crosshair), `drawGrid`, `drawShaders`. Owns the CanvasContext per-overlay
      boundary. No `this.grid`, no props, no Vue.
- [x] `grid-renderer.js` keeps the dirty-flag/dual-canvas/lifecycle
      orchestration, builds a frame and delegates drawing to the engine
      (draw sequence identical to the old inline code).
- [x] Headless-tested (6 RenderEngine tests) + component render-orchestration
      (grid+candles draw in a mounted chart) + visual baseline byte-identical. 181 tests.
- Note: full "Grid.vue → thin shell" + canvas.js mixin extraction + removing the
  dead `useCanvasRenderer.js` belong with the Phase 4 component restructure;
  3.3b delivered the rendering CORE (the high-value, safest slice).

---

## ✅ AUDIT (multi-agent, 66 agents) + FIXES — verdict: solid-with-caveats
Adversarial audit of Phases 1–4.1: 54 confirmed findings (mostly info/low
behaviour-preservation confirmations), 2 refuted. The high-risk dataVersion→
revision change was independently verified correct & non-vacuous. Confirmed real
defects FIXED:
- [x] defineTool `init_tool` no longer clobbers the Tool mixin wiring (routed to
      `init` + warn) — was making tools non-interactive.
- [x] defineOverlay `def.settings` now consumed as RenderContext defaults.
- [x] Validation: duplicate/descending-timestamp downgraded error→warn (strict
      no longer throws on legit same-timestamp data like data_scorers 3h).
- [x] RenderContext binds all 8 CanvasDrawing helpers (was 2); `def.methods`
      spread first (factory wrappers win); defineTool warns on missing icon.
- [x] Type catalogs completed (module-data / chart-reset / close-indicator).
- [x] Golden fingerprint → order-sensitive, precision-exact BigInt hash
      (closed the additive-checksum permutation/1e-6 blind spot); snapshots regen.
- [x] Doc/cleanup: "base64"→data-URI comments, deleted stale src/index.html,
      fixed tool.js var-shadow, stress-harness stale comment/dead stub, ChartUI header.
- 187 tests; goldens/visual/stress/component green; +2 regression guards.
- ⚠ NOT done (deliberate): the work is still UNCOMMITTED; browser-only paths
  (module-worker support floor FF114+/Safari15+, dev-server WS proxy, real-RAF
  cadence) and large-dataset scale are unverified end-to-end. See audit report.

## ✅ PHASE 3 COMPLETE (Vue-Agnostic Core)
All sub-items landed, every step gated by goldens/visual/stress/component:
3.1a query/UI store seam · 3.1b structural ChartData store · **3.1b-final
dataVersion deleted** (store-owned closure-ref revision, no perf regression,
live-coloring verified) · 3.2 Transport seam (SyncTransport) · 3.3a CanvasContext
boundary · **3.3b RenderEngine** · 3.x structured indicator errors · plus the
stress + component test harnesses. 181 tests green; all golden/visual/stress
byte-identical/green; build/size/dev all clean.

### ✅ 3.x — structured indicator errors (COMPLETE & VERIFIED)
- [x] Per-indicator error boundary in `script_engine.run()` (init/exec/post): a
      throwing indicator is recorded + skipped for the run (isolation) instead of
      aborting the whole batch. Per-run skip set → empty on happy path → goldens
      byte-identical.
- [x] `make_box` build failure (`script_env.js`) now reports a structured error
      (was silent all-null output); keeps the no-op fallback so the engine survives.
- [x] `_onScriptError` → `script-error` event (whitelisted in wireEngineEvents) →
      DC re-emits as **`indicator-error`** on the public EventMap. Types:
      `IndicatorError` exported, `indicator-error` in EventMap, `script-error` in WorkerEvent.
- [x] Tested via SyncTransport: exec-throw → phase 'exec'; bad source → phase 'build';
      a good indicator alongside a broken one still computes. 152 tests; goldens byte-identical.

## 🔄 Phase 4 — The DX Surface (IN PROGRESS)

### ✅ 4.1 — defineOverlay / defineTool typed factories (COMPLETE & VERIFIED)
- [x] `src/api/defineOverlay.js` — config-based overlay authoring
      ({useFor, draw, meta, settings, …}) → a registry-compatible Overlay+
      CanvasDrawing component. Draw gets a curated `RenderContext` (no
      positional $props) AND `this.*` power. Config validated at definition time.
- [x] `src/api/defineTool.js` — defineOverlay + Tool mixin + tool() descriptor.
- [x] Public types `src/types/define-overlay.ts` (DefineOverlayConfig,
      DefineToolConfig, RenderContext); exported from index + shipped in d.ts.
- [x] Verified: a config-only overlay RENDERS in a mounted chart (component
      harness); config-validation errors; tool descriptor. 185 tests; additive/
      non-breaking (legacy mixin authoring untouched); goldens/visual/stress green.

### ⏭ 4.x remaining — use*() composables (useChart/useRange/useCursor/useData,
      resolve the goto/setRange out-of-range TODO), single `theme` object +
      flat-prop deprecation shims, `<TradingChart>` thin shell, a11y, tree-shaking gate.

## ⏳ Phases 5–7 — RenderGraph → engine/perf rewrite → deprecation removal.
