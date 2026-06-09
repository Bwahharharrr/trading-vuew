# Indicator `view.layers` Rendering — Implementation Plan

Prefer the chart-feed descriptor's `view.layers` over plotting every output; render only
`visible_by_default` layers; keep hidden layers toggleable; fallback to plot-every-output.
Planned via ultracode (6-agent workflow + adversarial review). **Status: P0–P4 DONE (416 tests
green, typecheck clean). P5 (persistence across tf-reselect) + P6 (markers) = optional follow-ups.**

## Protocol (confirmed)
Descriptor (`candle_states.states[].indicators[]`) carries `view = { version, layers[] }`.
`layer = { id, label, kind, target:{surface:'price'|'pane', pane:string|null}, fields:string[],
style:{[k]:string}, visible_by_default:bool }`. `kind ∈ line|histogram|band|candle_color|box|marker|diagnostic`.
Rows still carry raw values as `indicators[display_label][output]`.

## Key facts / corrections (from review)
- **Two disjoint paths today:** descriptors (discovery, carry `view` untyped, dropped at panel toggle)
  vs overlays (built from ROWS in `buildChartData` via `indicatorPlacement(kind)` = plot-every-output).
  `view` must be **threaded** from discovery → `App.corkySelect` (read `this.corkyStates`) →
  `subscribe(opts.views)` → `handle.views` → `buildChartData(rows,{views})`.
- **Pane grouping is by NUMERIC grid index, NOT a string name** (Section.vue:152-159, layout.js:51-55):
  one anchor layer per pane has NO `grid.id` (spawns the grid); the rest carry `grid:{id:N}` matching
  its index. Need a deterministic `target.pane → grid index` resolver.
- **candle_color** = candle tuple slot-6 (`candle-draw.js:13-16` reads `raw[6]`; mirror `ws-manager.js:198`).
  `applyLiveUpdate` REPLACES the tuple each tick → **must re-stamp slot-6 every tick**. Pad ohlcv→9 slots.
- **box → `Zones.vue`** (already renders per-ts rectangles `[ts,y1,y2,x2,color]`), NOT Channel.
- **marker/diagnostic** → hidden metadata (no declarative renderer); diagnostic renders as Spline on opt-in.
- line→Spline, multi-field→Splines (cols 1..n), histogram→Histogram, band→Channel ([ts,top,mid,bottom]).
- Fallback (no/empty view) path must stay **byte-identical** (golden-pinned `pivotIndicators`/`buildChartData`).
- Multi-field Splines live updates need per-COLUMN writes by `corkyFields` index.
- Descriptor↔series identity: match view by `display_label` first; kind-only fallback iff exactly one instance.
- Per-layer remove = object-identity splice (`_removeOverlay`), never `dc.del(id)` (substring hazard).
- tf-reselect wipes overlays + enabled state + slot-6 → persistence + re-apply in `_finishHistory` (Phase 5).

## Phases (each tested + committed)
- [x] **P0** types (`IndicatorViewSpec`/`LayerSpec` + `view?`) + threading (App.corkySelect→subscribe→handle.views
  →buildChartData). Fallback goldens byte-identical. (commit e557820/efa1eaf)
- [x] **P1** pane-index resolver + `buildLayerOverlays` (line/Splines/histogram/band) + buildChartData branch +
  `layerKindToOverlay` + ts-zip + style→sett. MACD macd+signal+histogram in ONE grid (anchor no grid.id). (e557820)
- [x] **P2** `visible_by_default` gating in setIndicatorEnabled; raw preserved (incl. hidden-layer overlays). (efa1eaf)
- [x] **P3** candle_color (SCMR/CRUP): pad→9, stamp slot-6 at build + re-stamp in applyLiveUpdate; value→color. (e557820/efa1eaf)
- [x] **P4** per-layer toggle UI (CorkyDiscoveryPanel nested sub-toggles) + `setLayerEnabled` (object-identity). (5e09063)
- [ ] **P5** (follow-up) persistence (`corkyLayerVisibility`) + re-apply on tf-reselect in `_finishHistory`.
  tf-switch currently resets hidden-layer toggles (visible defaults + candle_color always restored).
- [ ] **P6** (optional) Markers overlay for kind=marker (box already → Zones; marker = hidden metadata until then).

## Known limitations / follow-ups
- Pane grid-index resolver assigns sequential ids per distinct `target.pane`; if VIEW-pane indicators are mixed
  with FALLBACK offchart indicators (no grid.id) the numeric indices can drift — gate with a component-harness
  mount test before relying on multi-indicator pane mixing (single-indicator panes like MACD verified at build level).
- P5 persistence not done: hidden-layer opt-ins reset on tf-switch.

## Targets
SCMR/SCMR(INV): candle_color visible, TL/TH lines hidden-toggleable. MACD: histogram pane + macd/signal
lines same pane + bull/bear strength panes. CRUP: candle_color + box (Zones) visible. Raw values always kept.
