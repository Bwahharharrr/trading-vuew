# Render Architecture Plan — the "scale engine" spine (DEEP change #1–#3)

Branch `perf/render-fastpath`. This is the **multi-phase, NOT-this-build** migration that
turns the per-frame "rebuild the world" model into a TradingView-style spine:
first-class **scales** + a single **rAF scheduler** + a **Reposition** fast path.

This doc is a PLAN, not code. The sibling `tasks/render-perf-constraints.md` governs the
orthogonal, ship-now candle color-batch; the two share the same sacred constraint —
**the committed visual golden stays byte-identical** (`test/visual/candles.visual.test.js`,
snapshot at `test/visual/__snapshots__/candles.visual.test.js.snap`; never `vitest -u`).

---

## 0. The current model — where the per-frame cost actually is

A pan/zoom/tick re-derives geometry **synchronously** through this chain:

```
gesture (grid.js) → range mutate → grid.change_range() (grid.js:319)
  → $emit('range-changed')
  → chart-range.js range_changed (:11)
       clamp_range (:29) · subset (:103)  ← new TI() PER FRAME (:109) + filter
       Utils.overwrite(range,sub) · update_layout (:124)  ← markRaw(new Layout) (:160)
  → reactive churn → Grid.vue rangeKey watcher (:450) → nextTick → redraw()
  → renderer.update (grid-renderer.js:149) → engine.renderStatic (render-engine.js:39)
```

The **expensive work runs synchronously inside `range_changed`, once per range mutation**
— it is NOT batched. Only the final canvas *paint* is `nextTick`-coalesced. Per pan frame:

- `subset()` (chart-range.js:103) — `Utils.fast_filter`/`fast_filter_i` (utils.js:143/164)
  **plus a fresh `new TI()` (ti_mapping.js) every call**, re-running `map_sub` in `ib` mode.
- `update_layout()` (chart-range.js:124) — `Array.from(this.sub)` copy +
  **`markRaw(new Layout(...))`** (layout.js:33): `grid_hs()`, one **`new GridMaker`** per
  grid (`calc_$range` O(visible) minmax · `calc_sidebar` · `calc_positions` sets `A,B,
  px_step,startx` · `grid_x` **full O(visible) gridline rescan** · `grid_y`), a fresh
  `layout_fn` (new memo caches), then **`candles_n_vol()`** (layout.js:163) whose cache key
  (layout.js:186) **embeds `range[0],range[1]`** → busts on every pan → **full rebuild of
  ~N candle{} + N volume{} objects**.
- Sub-pane Candles overlays call **`layout_cnv(this)` every frame, UNCACHED**
  (Candles.vue:43 → layout_cnv.js:6), rebuilding ~2·N objects.

### The scheduling "mix" we are replacing
Invalidations funnel through **four** different mechanisms, none aware of the others:

| Source | File:line | Schedules via |
|---|---|---|
| wheel zoom | grid.js:70 `_throttledWheel` | `Utils.rafThrottle` (its own rAF) |
| pan move | grid.js:124 `_throttledPanmove` | `Utils.rafThrottle` (a *second*, independent rAF) |
| **pinch** | grid.js:175 `mc.on('pinch')` | **UNthrottled** → N rebuilds/frame |
| momentum fade | pan-manager.js:71 | `FrameAnimation` (frame.js — a 3rd rAF loop) |
| data revision | chart-range.js:355 `dataHashKey` + Grid.vue:511 `dataKey` | synchronous layout + `nextTick` paint |
| cursor move | grid.js:220 (dual-canvas, synchronous) / Grid.vue:461 `cursor.x` (fallback) | sync draw / `requestAnimationFrame` |
| colors/tz/shaders/yT/resize | chart-range + Grid.vue watchers | `nextTick` |

Two same-frame sources ⇒ two synchronous `new Layout()` builds; pinch ⇒ many. The paint is
deduped per source, the **layout build is not deduped at all**.

### What is deliberately right (do not "fix" in this migration)
- Rows are `markRaw`'d; redraw is revision-ref / hash-key driven (dc_core.js,
  stores/chart-data.js, chart-range.js `dataHashKey` :305, Grid.vue `dataKey` :376). **No
  deep watchers, no re-proxying row arrays.**
- `candles_n_vol` cache key embeds the **last visible bar** (layout.js:184) so a live
  intra-candle tick that stays inside the auto-scaled band still busts the cache
  (otherwise the last candle freezes). Any new cache MUST keep this term.
- Dual-canvas crosshair is drawn **synchronously** in grid.js:220 (same tick the cursor is
  committed) — a deliberate latency win; the Grid.vue `cursor.x` RAF watcher is only the
  single-canvas fallback.

---

## 1. Target architecture (the three objects + the scheduler)

### (#3) TimeScale — index↔x, and PriceScale — price↔y, as first-class objects with versions

Today these live as loose fields reborn inside every `new Layout()`:
`self.A,self.B,self.$_hi,self.$_lo` (grid_maker.js:233-240), `self.px_step,self.startx`
(grid_maker.js:227-230), and the `t2screen/$2screen/screen2$` closures (layout_fn.js).
Promote them to **stable objects with identity + a monotonic `version`**, located at
`src/render/scales/time-scale.js` and `src/render/scales/price-scale.js`.

```
TimeScale  (one, shared across grids — offcharts borrow master x: grid_maker.js:359-366)
  state:   barSpacing (= px_step), i0 (float index at x=0), spacex (= width - sidebar),
           rightOffset (empty bars at right; today implicit in range[1] past last bar),
           ib flag + ti_map ref (time↔index)
  map:     x(i)  = floor((i - i0) * barSpacing) - 0.5      // ib path: pure integer math
           i(x)  = i0 + x / barSpacing
           (time mode delegates t↔i through ti_map.smth2i — identical to today's
            layout_fn.t2screen :38, with r = spacex/(range1-range0) = barSpacing/interval)
  version: bumped ONLY when barSpacing | i0 | spacex changes

PriceScale (one PER grid: main + each offchart)
  state:   A, B, hi, lo, height, logScale, auto|manual, fixed range?
  map:     y(p)  = floor(p*A + B) - 0.5      // == $2screen (layout_fn.js:54)
           p(y)  = (y - B)/A                  // == screen2$ (layout_fn.js:79); log variants
  recompute(visible): minmax → hi/lo → A,B   // == calc_$range + calc_positions A/B math
  version: bumped ONLY when A | B changes (a manual y-lock pins them → version stable)
```

Why lean on the **index-based (`ib`) path** (`Utils.fast_filter_i`, utils.js:164;
`ti_map.smth2i`, ti_mapping.js:215): in index space a bar's x is a *pure function of its
integer index* — `x(i)=floor((i-i0)*barSpacing)-0.5` — so (a) TimeScale needs no array
scan, (b) membership-delta detection (#2) is integer subtraction, (c) `fast_filter_i` is an
O(1) `slice(i1,i2)` with no `IndexedArray`. The objects expose the **same closure API**
(`t2screen/$2screen/screen2$/t_magnet/c_magnet/...`) so every overlay, tool and shader is
untouched; `layout_fn.js` becomes a thin adapter that binds those closures to the two
scale objects instead of to ad-hoc `self` fields.

The decisive property: a paint can ask `timeScale.version` / `priceScale.version` to learn
*what actually changed* — replacing today's coarse "the whole `chartLayout` object got a
new identity" signal (grid-renderer.js:106 `_lastLayoutRef !== layoutRef`).

### (#1) Single rAF render scheduler draining an InvalidateMask

One `RenderScheduler` per TradingVue instance (`src/render/render-scheduler.js`),
coordinating all grids. It holds a single `mask` and a single `rafId`.

```
Levels (ordered; merge = max):   Cursor (0)  <  Reposition (1)  <  Full (2)

invalidate(level, hint?):
    mask = max(mask, level)
    if (!rafId) rafId = requestAnimationFrame(drain)

drain():
    rafId = null
    const lvl = mask; mask = None
    switch (lvl):
      Cursor:      paint dynamic (crosshair) only          // no scale/layout touch
      Reposition:  scales.repositionPass()  → static       // §1(#2)
      Full:        subset + scales.rebuild() + geometry     // today's update_layout body
                   → static
    // exactly ONE static paint per grid per frame; Cursor coalesces to dynamic-only
```

Every source in the table above calls `scheduler.invalidate(...)` instead of its own timer:

| Source | New call |
|---|---|
| pan move, momentum fade, trackpad scroll | `invalidate(Reposition)` |
| wheel/pinch zoom | `invalidate(Reposition, {zoom:true})` → drain escalates to Full-X if barSpacing moved (see #2) |
| data revision (tick/colour), settings, colors, theme, shaders, y-transform, resize | `invalidate(Full)` |
| cursor move | `invalidate(Cursor)` (single-canvas); dual-canvas keeps the existing synchronous crosshair as an even-lower-latency special case |

This **replaces**: the two independent `rafThrottle`s (grid.js:70,124), the per-watcher
`nextTick` paints (Grid.vue:453,468,509,521,527 + chart-range.js update_layout reactivity),
the `requestAnimationFrame` cursor watcher (Grid.vue:465), and the **unthrottled pinch**
(grid.js:175 — which collapses to one rebuild/frame, a latent-bug fix). `FrameAnimation`
(frame.js) stays as the momentum *driver* but only sets `invalidate(Reposition)` per tick;
it no longer calls `change_range` → synchronous rebuild.

### (#2) The Reposition level — translate cached geometry instead of rebuilding it

On a pan, `range` width (`dt`) is constant ⇒ `r = spacex/dt = barSpacing/interval` is
constant ⇒ every candle's **x shifts by one constant pixel delta** and **y is unchanged iff
A,B are unchanged**. The Reposition pass exploits this:

```
repositionPass(grid):
    1. visible₂ = fast_filter_i(data, i1', i2')        // O(1) index slice (ib path)
    2. priceScale.recompute(visible₂)                  // cheap O(visible) minmax → A,B
    3. if (priceScale.version unchanged                // A,B identical (lock OR stable extent)
         && membershipDelta(i1,i2 → i1',i2') ≤ 5%):    // pure integer: |Δi1|+|Δi2| ≤ 0.05·N
            • REUSE cached candle/volume y-fields (o,h,l,c,vh) for the kept bars
            • recompute x via the SAME floor formula (cheap; NOT a float translate — see §2)
            • SPLICE: drop bars scrolled off one edge, build only the ≤5% new edge bars
            • grid_x: translate kept xs, extend_left/right only at the exposed edge
            • SKIP: new TI(), new Layout(), full candles_n_vol(), full grid_x rescan
       else:
            • escalate → Full (subset + scales.rebuild + candles_n_vol)   // safe fallback
    4. static paint
```

**Membership delta, cheaply (index math):** the visible window is `[i1,i2)` where
`i1=floor(range0_idx)`, `i2=floor(range1_idx)+1` (exactly `fast_filter_i`, utils.js:166-168).
A pan changes `range0,range1` by the same `dt`-preserving amount, so
`Δ = |i1'-i1| + |i2'-i2|` bars enter/leave; **no scan** — just the two new integer bounds.
If `Δ ≤ 0.05·(i2-i1)` the interior is identical and only the edge strip is rebuilt.

**Recompute vs translate (per field):**

| Field | Pan, A/B stable | Why |
|---|---|---|
| candle/vol **y** (o,h,l,c,vh, body color, green flag) | **reuse cached** | function of price·A+B only |
| candle/vol **x** (x, x1, x2) | **recompute (floor formula)** or translate (see §2) | function of (i − i0)·barSpacing |
| **grid_x** time labels (xs) | translate kept + edge-extend | x = floor((t−range0)·r), r const |
| **grid_y** price labels (ys) | reuse | function of A,B only |
| sidebar width / precision | reuse | function of hi/lo only → stable when A/B stable |
| **TI map** | reuse | sub membership ≥95% identical |

Zoom (barSpacing changed) cannot translate x (spacing differs per bar) → it is **Full-X**:
recompute all x, but still **reuse y when A/B stable** and **skip new TI / subset realloc**.
The plan keeps Reposition honest: *pan* is the headline win; *zoom* is a partial win folded
into the same drain by the A/B-version check.

Wire the **sub-pane** path (`layout_cnv`, Candles.vue:43) into the same cache keyed by
`(TimeScale.version, PriceScale.version, sub identity)` so offchart panes stop rebuilding
every frame too.

---

## 2. The correctness crux (read before touching Phase 3)

1. **Floor rounding vs the pixel golden.** A *pure float translate* `x -= Δrange0·r` can
   diverge by ±1px from a fresh `floor((t−range0)·r)` when `Δrange0·r` is fractional — and
   ±1px **moves the visual signature**. Therefore the first cut of Reposition **recomputes x
   with the identical `floor` formula** (cheap arithmetic) and only skips the *allocations*
   (new TI, new Layout, full candle-object churn, full grid_x rescan). The pure-pixel
   `drawImage` translate is deferred to #6 behind **integer-device-pixel snapping**. This is
   the line between "byte-identical" and "a real pixel diff to find and fix."

2. **The reactivity seam (highest-risk, same class as Phase 3.1b-FINAL dataVersion→revision).**
   Today the whole Grid tree keys off `chartLayout` *object identity*: `update_layout`
   builds `markRaw(new Layout)` (chart-range.js:160), and grid-renderer detects change via
   `_lastLayoutRef !== layoutRef` (grid-renderer.js:106) + `rangeKey` (Grid.vue:450). If
   Reposition **mutates the existing layout in place** (to translate geometry) the identity
   never changes and the dirty detector misses it. Fix: the renderer must read
   `timeScale.version` / `priceScale.version` (explicit, shallow signals) instead of object
   identity — mirroring the dataVersion→closure-revision migration (`cd.revision()`,
   chart-range.js:221,317). Keep it explicit and shallow; **add no deep watcher, re-proxy
   no row array.**

3. **Live-tick last-bar term.** The reuse cache MUST retain the last-visible-bar hash
   (layout.js:184-186) or a live intra-candle tick that stays in-band freezes the last
   candle. Reposition's "reuse y for kept bars" must treat the **last bar as always dirty**.

4. **Indicator-pane coverage gap.** The pixel golden covers the **main pane only**
   (`isMainChart`, Candles.vue:36-40). The `layout_cnv` indicator branch has **no
   rasterised guard** (render-perf-constraints.md §2). Phase-3 changes there are verified by
   geometry-equality unit tests + the parity argument, not by the golden — flag to the
   integrator.

---

## 3. Phases (each independently shippable + gated; riskiest seams flagged)

### Phase 0 — Characterization harness (no behaviour change)
- **Do:** pin the arithmetic *before* refactoring. New `test/unit/scale-math.char.test.js`
  asserting exact `t2screen/$2screen/screen2$` outputs for a fixed range+data, and exact
  `candles_n_vol` field values for a known slice. Extend `test/component/render-trigger.test.js`
  with a **paint/layout-build counter** (how many `new Layout` + static paints per simulated
  pan/pinch burst) — the baseline #1 must improve.
- **Touches:** test/unit (new), test/component/render-trigger.test.js, a tiny test-only
  instrumentation hook on `update_layout`/`renderStatic`.
- **Gate:** `candles.visual` · `cov-grid-layout` · `layout-math-coverage` · `render-trigger`
  all green; new char tests are the locked baseline.
- **Risk:** none. **Rollback:** delete tests.

### Phase 1 — Extract TimeScale + PriceScale (pure refactor, byte-identical math)
- **Do:** create `src/render/scales/{time-scale,price-scale}.js`. Move `A,B,$_hi,$_lo`
  (grid_maker.js:233-240), `px_step,startx,spacex` (grid_maker.js:222-230), and the
  `t2screen/$2screen/screen2$/t_magnet/c_magnet` closures (layout_fn.js:36-126) onto the two
  objects. `GridMaker` constructs/owns a `PriceScale`; `Layout` owns the shared `TimeScale`.
  `layout_fn.js` becomes a thin adapter delegating to them (same closure surface → overlays/
  tools/shaders untouched). Each object carries a `version`. **Same floor formulas.**
- **Touches:** `grid_maker.js` (calc_$range/calc_positions/grid_x), `layout.js`
  (candles_n_vol reads scales), `layout_fn.js` (adapter), new scale modules.
- **Gate:** `candles.visual` (byte-identical) · `cov-grid-layout` · `layout-math-coverage`
  · `layout-cnv` · `render-trigger` · Phase-0 char tests.
- **Risk (medium):** the `layout_fn` memo caches are cleared today by "new instance per
  layout"; reproduce that with **version-keyed** cache clears (TimeScale.version bump ⇒
  clear t2screen cache; PriceScale.version bump ⇒ clear $2screen/screen2$). Get this wrong
  and a stale coord cache serves wrong pixels.
- **Rollback:** revert; scale modules are additive, call sites restore to `self.*` fields.

### Phase 2 — Single rAF RenderScheduler + InvalidateMask (orchestration only; STILL Full each drain)
- **Do:** add `src/render/render-scheduler.js` (mask + one rAF + drain). Route every source
  to `invalidate(level)`. Drain still runs the **existing** subset+update_layout+paint once
  per frame (no Reposition yet) — this isolates the orchestration change from the geometry
  change. Cursor level → dynamic-only (preserve the synchronous dual-canvas crosshair).
  Pinch becomes throttled-by-construction (one rebuild/frame).
- **Touches:** `grid.js` (remove `_throttledWheel`/`_throttledPanmove`/unthrottled pinch →
  `invalidate`), `pan-manager.js` (fade tick → `invalidate(Reposition)`), `chart-range.js`
  (range_changed/dataHashKey → `invalidate`), `Grid.vue` (rangeKey/dataKey/cursor.x/shaders/
  yTransform watchers → `invalidate`), `canvas.js` redraw stays the paint primitive.
- **Gate:** `render-trigger` (**assert exactly ONE static paint per coalesced burst, never
  zero**) · `crosshair-lag.repro` · `live-inplace-redraw` · `live-intracandle-redraw` ·
  `candle-cache-busting` · `static-candle-stale.repro` · `candles.visual`.
- **Risk (high):** the orchestration seam — "exactly one paint, never dropped." The live
  tick / `dataKey markStaticDirty` path (Grid.vue:520) MUST still force a static repaint;
  the Cursor level must never swallow a pending Full. Pan→pan→tick in one frame must drain
  as Full.
- **Rollback:** gate the scheduler behind a `config` / build const; falsy ⇒ fall back to the
  current per-source `rafThrottle`/`nextTick` paths (keep them until Phase 3 proves out).

### Phase 3 — Reposition fast path (the payoff)
- **Do:** implement `repositionPass` (§1#2) in the scheduler drain. Pan/fade →
  `invalidate(Reposition)`; drain runs the cheap `priceScale.recompute` + membership-delta
  test; on pass, reuse cached y + splice edge bars + translate grid_x, skipping `new TI` /
  `new Layout` / full `candles_n_vol` / full `grid_x`; on fail, escalate to Full. Switch
  grid-renderer dirty detection from `_lastLayoutRef` identity to `priceScale.version` +
  `timeScale.version`. Wire `layout_cnv` (sub-panes) into the version-keyed geometry cache.
  Keep the **last-visible-bar-always-dirty** rule.
- **Touches:** `render-scheduler.js` (repositionPass), `price-scale.js`/`time-scale.js`
  (recompute + version), `layout.js` (candles_n_vol → splice/reuse mode), `layout_cnv.js`
  (cache), `grid-renderer.js` (version-based dirty), `chart-range.js` (Reposition entry
  bypasses the synchronous `new Layout`).
- **Gate (SACRED):** `candles.visual` **byte-identical, no `-u`** — any signature move is a
  real pixel bug to fix, not accept. Plus `candle-cache-busting` · `static-candle-stale.repro`
  · `live-intracandle-redraw` · `render-trigger` (paint-count baseline must DROP) ·
  `cov-grid-layout` · stress `render-scaling.stress`.
- **Risk (highest):** (a) any x/y arithmetic divergence ⇒ ±1px ⇒ golden break — mitigated by
  reusing the identical floor formula (§2.1); (b) the version-vs-identity dirty seam (§2.2);
  (c) the unguarded indicator pane (§2.4) — cover with geometry-equality tests.
- **Rollback:** one line — make the drain **always escalate Reposition→Full**. That reverts
  to verified Phase-2 behaviour with **zero** visual risk while keeping the scaffolding.

---

## 4. Smaller follow-ups (noted, deferred)

### #6 — Bitmap / device-pixel snapping (after Phase 3)
Snap `barSpacing` and pan deltas to **integer device pixels** (DPR-aware backing store,
grid.js canvas sizing; zoom-manager.js already wrestles DPR at :57,:68). Then the
Reposition translate can become a true **`ctx.drawImage` blit** of the unchanged interior
framebuffer + a redraw of only the newly-exposed edge strip (render-engine.js gains a
`blitTranslate`). Deferred because it only pays off *after* Reposition exists and it
re-opens the ±1px floor question (§2.1) — it must own integer snapping to stay golden-safe.

### #8 — Per-series recompute subgraph (deferred; today's whole-map re-exec is DELIBERATE)
On a compute-affecting settings change, `script_engine.js` (~:342-352) re-runs the **whole
map**, not just the edited series. This is **correct by construction, not laziness**: a
partial `init_state` rebuilds the **shared** price arrays + `tss` for the entire engine,
leaving every *non-selected* script's `box` bound to a **dead generation** — their overlays
flatline on the next live tick (the comment at :343-348 documents the scar). A genuine
per-series subgraph requires **per-script state isolation** (private price arrays / box
lifetime) so one series can recompute without invalidating the others' generation — a large,
separate change. Until then the whole-map re-exec is the safe default (display-only changes
already short-circuit at :328-339). Flag, do not attempt inside the scale-engine migration.

---

## 5. Invariants checklist (every phase must keep ALL)
- [ ] `candles.visual` snapshot **byte-identical**; never `vitest -u`, never edit the snap.
- [ ] No deep watchers added; rows stay `markRaw`'d; no row-array re-proxy.
- [ ] No public API / overlay-contract / data-shape (`[t,o,h,l,c,v,style?,l1?,l2?]`,
      per-candle `raw[6]`) change; `t2screen/$2screen/screen2$/c_magnet/...` surface intact.
- [ ] `candles_n_vol` last-visible-bar dirty term preserved (layout.js:184); last bar always
      recomputed under Reposition.
- [ ] Dual-canvas synchronous crosshair (grid.js:220) preserved as the low-latency path.
- [ ] Dirty detection migrates from layout **object identity** to scale **version** signals,
      explicit + shallow (mirrors dataVersion→`cd.revision()`).
- [ ] Scoped tests only; no full build, no commit, no `-u`. Integrator gates + commits.
