# Order Distribution Tool — Implementation Plan

Prototype (visual-first) for a bracket "order distribution" drawing tool, built on the existing box
tool. Planned via ultracode (7-agent workflow + adversarial review).

**Status: COMPLETE (2026-06-09).** All phases P0–P6 implemented, tested, and committed per-phase
(7 feat commits + 1 review-fix commit on `modernization/phase-1-4`). 385 tests green, typecheck clean.
A final 5-agent adversarial review caught + fixed one blocker (agent must follow the active DataCube)
and hardened the agent for the future async ws swap; it confirmed the rest sound.

## Goal
Draw a box → keep the existing debug alert → open a modal (Order Size / Order Qty / distribution /
side) → save a persistent, data-anchored **OrderBox** overlay that renders the distributed orders as
draggable/deletable horizontal lines clamped to the box, with a buy/sell color and an eye toggle.
Later: submit to a websocket agent (pending → confirmed). For now everything is local/stub.

## Architecture (grounded in the codebase)
- The current rectangle tool (`src/mixins/app/drawing-tools.js`) stays as-is: transient DOM box +
  `boxReadout` + debug `alert`. **Only change:** after the alert, stash geometry + open the modal.
- The saved artifact is a **chart overlay** in `data.onchart` (`type:'OrderBox'`), added via
  `chart.add('onchart', overlay)`, rendered by a new `OrderBox.vue` (`mixins:[Overlay, Tool]`,
  modeled on `RangeTool.vue`) registered in `App.vue overlays:[...]`.
- All geometry stored as **data coords** (`[t, price]`); pixels derived every frame via
  `layout.t2screen/$2screen` → survives zoom/pan/relayout. Box corners are two Pins (resize/move).
- Per-order handles + eye are drawn each frame and hit-tested via AABB collision closures (Tool mixin
  `pre_draw()` clears them per frame). Edits persist via `custom_event('change-settings', …)`.

## Data model (overlay pushed to `data.onchart`)
```
{ name:'Order Distribution', type:'OrderBox', grid:{id:0}, data:[],
  settings: {
    $uuid, $selected:false, $state:'finished', 'z-index':100, legend:false,
    t0, t1,                 // box time range (epoch-ms / index), from boxReadout
    p0, p1,                 // box low/high price (numeric)
    c0:[t0,p0], c1:[t1,p1], // draggable corner Pins
    side:'buy'|'sell',      // green/red fill
    visible:true,           // eye toggle (hide order lines, box stays)
    totalSize, qty, distribution:'flat'|'asc'|'desc',
    orders:[ { id:'ord-1', price, size, status:'local' }, ... ]
    // status: 'local'(proto) | 'pending' | 'confirmed' | 'rejected'
  } }
```
Orders are stored (not derived) so per-order drag/delete can override the distribution. Always emit a
**new** `orders` array on edits (reactivity). Deterministic ids only (`ord-N` counter; no Date.now/random).

## Distribution math — `src/stuff/order-distribution.js` (pure, tested)
`distributeOrders({low,high,qty,size,dist,sizePrec=2}) -> [{id,price,size}]`
- Prices span `[low,high]` inclusive: `price[i]=low+(high-low)*i/(N-1)` (N=1 → midprice).
- Weights: flat `1`; **asc `i+1`** (more size toward HIGH); **desc `N-i`** (more toward LOW).
- Normalize to total `S`; round each to `sizePrec`, absorb drift into the last order so `Σ===S`.

## Components
**Add:** `src/stuff/order-distribution.js`, `src/components/OrderDistributionModal.vue` (clone of
`IndicatorSettings.vue` shell), `src/components/overlays/OrderBox.vue`,
`src/helpers/orders/{order-agent.js, stub-order-transport.js}` (Phase 6), plus tests.
**Change:** `src/mixins/app/drawing-tools.js` (modal handoff in `onDrawEnd`),
`src/App.vue` (register modal + add `OrderBox` to `overlays:[]`), and the redraw fix (Phase 5.5).

## ⚠️ Critical correctness items (from adversarial review)
- [ ] **Redraw on static edits (HIGH):** `change-settings` does NOT auto-repaint without a cursor
  move (Grid `dataKey` ignores settings content; precedent: Volume eye-toggle calls `cd.invalidate()`,
  `Chart.vue:151-158`). Fix: emit `this.$emit('redraw-grid')` after every non-drag settings change
  (Grid binds `onRedrawGrid→redraw`, `Grid.vue:278`) **OR** add `this.cd.invalidate()` at the end of
  `dc_events.change_settings` (one line, fixes all tools). → **Phase 5.5.**
- [ ] **No method named `mousedown/mousemove/mouseup` on OrderBox** — `grid-renderer.propagate` calls
  `layer.renderer[name](event)` directly (before `mouse.x/y` refresh) AND `mouse.emit`. Register ALL
  handlers via `this.mouse.on(...)` in `init` (with `unshift` so they run first).
- [ ] **preventDefault precedence:** in one mousedown handler test X-delete → eye → order-grab, and
  `preventDefault()` on first hit so box-corner Pins / Tool drag don't also engage.
- [ ] **Per-order delete = splice by object identity**, never `dc.del` (substring id match: ord-1 vs
  ord-10 collision). Whole-box delete via `system_tool('Remove')` is fine.
- [ ] **ws status flips mutate canonical objects by reference** + one `touchData()` per batch (never clone).
- [ ] Reset `ctx.setLineDash([])`/`globalAlpha=1` after dashed/translucent pending orders.

## Phases (each independently shippable + verified)
- [ ] **P0 — Modal handoff.** `onDrawEnd`: keep alert; then stash `pendingBoxGeometry` + open modal;
  `rectDrawMode=false`. Verify: one draw → correct alert → exactly one modal (no mouseleave double-open).
- [ ] **P1 — Distribution helper + `test/unit/order-distribution.test.js`.** Verify: `Σsize===S` across
  flat/asc/desc, flat equal, asc non-decreasing / desc non-increasing, N=1 midprice, swapped low>high.
- [ ] **P2 — `OrderDistributionModal.vue`.** Size(float)/Qty(int)/distribution tiles/BUY-SELL toggle;
  emits `@confirm/@close`, never mutates chart. Verify (jsdom): v-model.number, tiles toggle, payload.
- [ ] **P3 — Persistent `OrderBox.vue` (box only).** `[Overlay,Tool]`, `use_for()=['OrderBox']`,
  `$uuid`+`$state:'finished'` before Pin init, 2 corner Pins, box fill/border by side. Register in App;
  `onOrderConfirm` builds canonical overlay + `chart.add('onchart',…)`. Verify: persists, survives
  zoom/pan, Pins resize, Delete removes it, no ctx leak.
- [ ] **P4 — Order lines + size labels (read-only).** N lines clamped to box width at `$2screen(price)`,
  gated by `visible`. Verify: correct prices, span ONLY box width (even when t0/t1 off-screen), counts match.
- [ ] **P5 — Per-order interaction (riskiest).** AABB collisions per frame (capture id by value);
  `mouse.on` handlers (unshift); X→eye→grab order. Drag writes `order.price=cursor.y$` via
  change-settings(new array); `alert` new price on **mouseup**; eye/X via change-settings + redraw.
  Verify (component): eye hides/shows with NO mousemove; X removes exactly one; drag+alert; box-Pin vs
  order drag don't fight.
- [ ] **P5.5 — Redraw-on-static-edit hardening.** Implement the redraw fix above; regression test that a
  settings-only change with no cursor move triggers a redraw.
- [ ] **P6 — WS pending→confirmed stub.** `order-agent.js` + `stub-order-transport.js` (echoes
  'confirmed'); status-driven dash/alpha; explicit Submit flips local→pending→confirmed (touchData per
  batch, mutate by identity). Verify: lifecycle repaints; cloned-object negative test fails; 'rejected' distinct.

## Decisions (confirmed by user 2026-06-09)
1. **asc/desc semantics:** asc = more size toward **HIGH** price (`w[i]=i+1`); desc = more toward
   **LOW** (`w[i]=N-i`). flat = even.
2. **Box resize:** **ALWAYS recompute** orders from the new low/high on a corner-Pin drag (re-run
   `distributeOrders`; manual per-order drags/deletes are discarded on resize). → no manual-edit
   tracking needed; simplifies P5 (re-derive `orders` whenever c0/c1 change).
3. **alert on order move:** fire **once on mouseup** (drag stays smooth via the cursor-driven redraw).
4. **Side selection:** **BUY/SELL toggle in the modal** (default BUY/green).
5. **Submit:** **separate explicit "Submit" action** — Confirm only draws `status:'local'` orders; a
   later Submit flips them pending→confirmed via the stub agent (P6).
6. Size precision **2 decimals**; price display uses `grid.prec`.

## Notes
- Feasibility confirmed by adversarial review. Biggest risk = the static-edit redraw trigger (P5.5).
- Future ws: `OrderAgent`/`OrderTransport` mirror `CorkyFeed`/transport; `Stub`→`Ws` swap to go live.
