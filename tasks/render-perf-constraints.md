# Candle color-batch — CONSTRAINTS CONTRACT (read before implementing)

Branch `perf/render-fastpath`. The goal is to batch candle/volume draws by **resolved
color** (mirror the grid-line batch in `src/render/render-engine.js:66-79`: one
`beginPath` → many `moveTo`/`lineTo` → one `stroke`) to kill per-candle state churn —
WITHOUT changing a single pixel of the committed visual golden.

This doc is the contract. Violating any "MUST" fails the task.

---

## 1. The candle render path — EXACT map (runtime vs. pixel golden DIVERGE)

There are **two independent, duplicated implementations** of the candle/volume draw math:

| File | Form | Drawn at runtime by | Pixel-golden? | Public? |
|---|---|---|---|---|
| `src/components/primitives/candle-draw.js` | free fns `drawCandle`/`drawVolbar` | **YES — `Candles.vue`** | **NO** | no |
| `src/components/primitives/candle.js` (`CandleExt`) | per-candle class | nobody (legacy) | **YES — golden** | yes (`index.ts:8,24,41`) |
| `src/components/primitives/volbar.js` (`VolbarExt`) | per-bar class | `Volume.vue:7` (the *standalone* Volume overlay, NOT Candles' built-in volume) | **YES — golden** | yes (`index.ts:9,24,41`) |

### Runtime path (what users see)
`src/components/overlays/Candles.vue`:
- `:8` `import { drawCandle, drawVolbar } from '../primitives/candle-draw.js'`
- `:48-54` volume pass FIRST: `for (...) drawVolbar(ctx, cv[i], this, layoutHeight)`
- `:56-59` candle pass SECOND: `for (...) drawCandle(ctx, cc[i], this)`

So the **runtime Candles overlay uses `candle-draw.js`**, and it draws **volume UNDER candles**.

### Pixel-golden path (what `test/visual/candles.visual.test.js` actually rasterises)
`test/visual/_canvas-harness.js`:
- `:10-11` `import CandleExt from '.../candle.js'` / `import VolbarExt from '.../volbar.js'`
- `:52-75` loops per row: `new CandleExt(overlay, ctx, data)` then `new VolbarExt(overlay, ctx, {...})`

So the **golden rasterises `candle.js`/`volbar.js`, NOT the runtime `candle-draw.js`.**

### The reconciliation (the crux — read twice)
`drawCandle` ≡ `CandleExt.draw` produce **byte-identical** primitive calls. The only
spelling difference is harmless: `candle-draw.js:28` does `Math.floor(data.x) - hw - 1`
while `candle.js:42` does `Math.floor(data.x - hw - 1)` — equal because `hw`,`1` are
ints, so `floor` commutes. (`candle-primitives.test.js:199-246` pins this parity; the
only intentional divergence is `CandleExt` always sets `font`, `drawCandle` only sets it
when a label exists — font is state, not pixels.)

**Therefore: if you batch ONLY `candle-draw.js`, the pixel golden never executes your
batched code — it still rasterises the per-candle `CandleExt`. The "byte-identical"
guarantee would then be testing the wrong file and proving nothing.**

A color-batch is inherently **array-level** (you need the whole candle array to group by
color). `CandleExt`/`drawCandle` are **per-item** and cannot express a batch. So:

**WHERE THE CHANGE MUST LAND (required shape):**
1. Add array-level batched renderers in `candle-draw.js`, e.g.
   `drawCandles(ctx, candles, overlay)` and `drawVolbars(ctx, vols, overlay, layoutH)`,
   that inline the SAME per-primitive math as `drawCandle`/`drawVolbar` but group by
   resolved color (one state-set + one path/stroke per color, grid-batch style).
2. **KEEP `drawCandle`/`drawVolbar` (single-item) intact** — `candle-primitives.test.js`
   tests them in isolation (one candle, no reorder possible) and asserts exact call
   sequence; do not let the batch break those.
3. Wire `Candles.vue` `draw()` (replace the `:48-59` loops) to call `drawVolbars` then
   `drawCandles` (preserve volume-before-candles order).
4. **Repoint `test/visual/_canvas-harness.js` `renderCandles()`** to build the
   candle/volume `data` arrays and call `drawCandles`/`drawVolbars` instead of
   `new CandleExt`/`new VolbarExt` per row. This is the ONLY way the pixel golden covers
   the runtime batched path. Editing a test HELPER is allowed — it is **not** `vitest -u`
   and the snapshot VALUE must come out unchanged. (This trades pixel coverage of the
   dead `CandleExt` for pixel coverage of the live runtime path — strictly better.
   `CandleExt`/`VolbarExt` stay exported and stay covered by their recording-context unit
   tests.)

Do NOT change `candle.js`/`volbar.js` signatures — they are **public exports**
(`index.ts:8-9,24,41`) and `volbar.js` is a live runtime dep of `Volume.vue`.

---

## 2. Tests that guard candle / volume / indicator render output

Run ONLY these scoped tests (the integrator gates the full suite):

| Test file | Asserts |
|---|---|
| `test/visual/candles.visual.test.js` | **THE pixel golden.** Rasterises a 60-candle BTC slice → `pixelSignature` (sampled hex grid + coverage/green/red buckets) via skia-canvas; `toMatchSnapshot`. Plus: both body colours present; deterministic across runs. Snapshot committed at `test/visual/__snapshots__/candles.visual.test.js.snap`. |
| `test/visual/_canvas-harness.js` | Harness (the file you repoint in §1.4). `renderCandles` builds geometry + draws primitives; `pixelSignature` (`:86`) samples a 16px grid and buckets coverage to absorb AA jitter. |
| `test/unit/candle-primitives.test.js` | Recording-context call-sequence pin for `drawCandle`/`drawVolbar`: wide-body `fillRect` geometry `[xFloor-hw-1, c, hw*2+1, ±max(|o-c|,2)]`; narrow/doji body-stroke + `+1` doji bump; wick `strokeStyle`+`(x-0.5, hFloor→lFloor)`; raw[6] body override; value1/value2 `fillText` (`#00FF00`/`#FF0000`) + fontSize clamp + label-guard; `drawVolbar` color+rect; **`CandleExt` parity** block. **These call the per-item fns directly — keep `drawCandle`/`drawVolbar` unchanged and they pass untouched.** |
| `test/unit/layout-cnv.test.js` | `layout_cnv`/`layout_vol` geometry (the indicator-pane geometry builder). One candle+vol per row; A·price+B transform; green=close≥open; vol scales to slice max; grid_id>0 detached `$2screen` mapping. |
| `test/unit/overlay-draw-geometry.test.js` | `VolbarExt` detached/candle-pane geometry + raw[6] override; plus Volume/Zones/Trades/Markers/Bar/Range/StepLine draw geometry (regression blast-radius). |
| `test/unit/volume-overlay.test.js` | Standalone `Volume.vue` + `VolbarExt` runtime path (separate from Candles' volume). |
| `test/unit/candle-color.test.js` | `candleColorOf` numeric thresholds / neutral dead-band (upstream of raw[6] stamping). |
| `test/unit/scmr-candle-color.test.js` | Palette → per-candle `c[6]` hex stamping (how raw[6] gets its value; build + live). |
| `test/component/candle-cache-busting.test.js` | Live in-band close move ⇒ `grids[0].candles` geometry tracks the close (main-pane cache key, §5). jsdom. |
| `test/component/static-candle-stale.repro.test.js` | Per-canvas: main STATIC candle canvas repaints on each intra-candle tick (clears+fillRect/stroke). jsdom. |
| `test/stress/render-scaling.stress.test.js` | Perf-only (loose): per-frame visible-slice cost ~flat as N grows; mount O(n) once, redraw cheap. |

### Indicator-PANE render coverage GAP (relevant to §5 / `layout_cnv`)
The pixel golden and `static-candle-stale`/`candle-cache-busting` exercise the **MAIN
pane only** (`isMainChart` branch, `Candles.vue:36-40`, geometry from cached
`layout.candles`). The **indicator-pane branch** (`Candles.vue:43`, `layout_cnv(this)`
rebuilt every frame, UNCACHED) has **no pixel/component render coverage** — only
`layout-cnv.test.js` (pure geometry, recording-context-free, no rasterisation). So a
batch (or a layout_cnv cache) on the indicator path is **not pixel-guarded**; verify it
by geometry equality + the parity argument, and treat the golden as covering the main
path only.

---

## 3. Per-candle color resolution (raw[6]) — group by RESOLVED color, NOT up/down

Data row is `[t,o,h,l,c,v, style?, label1?, label2?]`; `raw[6]` is the per-candle
override. Resolution **as implemented** (`candle-draw.js:11-21`, identical in
`candle.js:14-20`):

```
green = raw[4] >= raw[1]                       // close >= open  → up, else down
style = raw[6] || overlay                      // raw[6] (string OR object) SHADOWS overlay
body  = raw[6] || (green ? style.colorCandleUp||'#23a776'
                         : style.colorCandleDw||'#e54150')
wick  = green ? style.colorWickUp||'#23a776'
              : style.colorWickDw||'#e54150'
```

Critical subtleties a correct batch MUST honor:
- **Body and wick are INDEPENDENT color groupings.** Batch keys are two separate maps:
  one keyed by resolved BODY color (fills), one by resolved WICK color (strokes).
- `raw[6]` overrides the **body only**. It does NOT recolor the wick. Worse: when
  `raw[6]` is a **string** hex (the real corky case — `corky-ingest`/`scmr-candle-color`
  stamp `c[6]=palette hex`), `style` becomes that string, so `style.colorWickUp` is
  `undefined` and the wick falls back to the **hardcoded** `'#23a776'/'#e54150'`, NOT the
  overlay's configured wick colors. (Only a `raw[6]` *object* feeds wick colors.)
  Preserve this exactly — do not "fix" it.
- So two UP candles can have **different body colors** (one carries a raw[6] override) but
  often the **same** wick color → grouping purely by up/down is WRONG for bodies, right
  for wicks-in-the-no-override case. Group by the resolved value, computed per candle.
- **Narrow/doji branch:** `data.w > 1.5` ⇒ body is a `fillRect`; else body is a 1px
  `stroke` in `body` color (`candle-draw.js:41-63`). Body-strokes and wick-strokes are
  both strokes but in different colors and different geometry — keep their per-candle
  branch selection and their own color keys.

Volume (`drawVolbar`, `candle-draw.js:95-109`): `green = data.green` (precomputed flag,
not re-derived); `style = data.raw[6] || overlay`; fill =
`data.green ? style.colorVolUp||'#23a77642' : style.colorVolDw||'#e5415042'`. Note volume
override reads `style.colorVolUp` from a raw[6] **object** (a raw[6] string ⇒ default) —
different semantics from candle body. Batch key = resolved vol fill color.

---

## 4. Re-bless policy — what a correct batch MUST preserve

**Hard rule: the visual signature stays byte-identical.** Never `vitest -u`, never edit
`__snapshots__/candles.visual.test.js.snap`. If the signature moves, that is a REAL pixel
diff to find and fix, not to accept. Acceptance = `test/visual/candles.visual.test.js`
green with the EXISTING snapshot after you repoint the harness (§1.4).

The legal transformation (and ONLY this): **within one Candles overlay**, coalesce draws
of the **same resolved color** that are **mutually non-overlapping** into a single
state-set + single path/stroke — exactly like `render-engine.js:66-79`. Everything below
MUST be preserved:

- **Cross-overlay z-order is OUT OF SCOPE** — each overlay draws in its own `draw()`;
  keep batching strictly inside one Candles `draw()`. Do not merge across overlays.
- **Volume-before-candles**: `Candles.vue` draws all volume bars, THEN all candles
  (volume sits under bodies). Keep the two passes in that order.
- **Per-candle wick-before-body**: a candle's body paints over its own wick segment. A
  global "all wicks (by color) → all bodies (by color)" pass preserves this. ⚠️ It also
  changes interleaving: per-candle is `W0 B0 W1 B1…`, batched is `W0 W1… B0 B1…`. That is
  pixel-identical ONLY where a body never overlaps an ADJACENT candle's wick. On the
  golden's 800px / 60-candle slice (`w≈9px`, `step≈13px`) bodies and neighbor wicks are
  ~8px apart — no overlap → identical. The byte-identical snapshot IS the proof of the
  no-overlap assumption for the test data; do not assume it holds at extreme zoom, and do
  not let the batch flip wick/body z-order for overlapping neighbors.
- **Exact geometry**: floors, `x = floor(x)-0.5` wick, `hw = max(floor(w*0.5),1)`,
  `max_h` (`2`, or `1` for doji), `±` height sign by direction, doji `+1` bump,
  `data.w>1.5` branch. Bit-for-bit.
- **Label pass (raw[7]/raw[8])**: `fillText` value1 `#00FF00` at `(xFloor, lFloor+3)`,
  value2 `#FF0000` at `(xFloor, hFloor-3)`, fontSize `clamp(floor(w*0.8),8,14)`, and the
  **label-present guard** (`drawCandle` sets `font` only when a label exists). Labels are
  drawn LAST per candle and overlap neighbors → keep them in a **final label pass after
  all bodies** so they stay on top. (Not exercised by the golden — see below.)

**Coverage caveat to flag to the integrator:** the BTC golden slice has **no raw[6]
overrides and no labels** (snapshot contains only `23a776`/`e54150` + AA blends; no
foreign hex, no `00ff00`/`ff0000`). So the **multi-color body batch and the label
ordering are NOT pixel-guarded** — only the 2-color default path + volume are. The only
guard on raw[6]/label behavior is `candle-primitives.test.js` (call-sequence on the
per-item fns, which you keep unchanged). If the integrator wants pixel assurance for the
multi-color batch, that needs a NEW colored-slice golden (a new snapshot the integrator
blesses) — out of scope for the implementer, who must not add/rebless snapshots.

---

## Acceptance checklist (implementer)
- [ ] `drawCandle`/`drawVolbar` (single-item) unchanged → `candle-primitives.test.js`,
      `overlay-draw-geometry.test.js`, `volume-overlay.test.js` green.
- [ ] New `drawCandles`/`drawVolbars` (array, color-batched) called by `Candles.vue` AND
      by `_canvas-harness.js`.
- [ ] `test/visual/candles.visual.test.js` green vs the EXISTING snapshot (no `-u`).
- [ ] `candle-cache-busting` + `static-candle-stale` jsdom tests green.
- [ ] No reactivity/API/data-shape changes; no build; no commit.
