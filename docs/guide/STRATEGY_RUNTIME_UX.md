# Strategy Runtime UX Contract

Status: implemented through SUX-7.

The Strategy dock is an operator view over Corky chart-gateway projections. It
must not read strategy sidecars, calculate financial totals, infer authority, or
treat evidence as approval.

## Independent Status Axes

| Axis | Primary fields | Rendering rule |
| --- | --- | --- |
| Runtime health | `state`, `last_error` | Health answers whether the process was operational at the published snapshot. It is current only while freshness is current and does not grant money or control authority. |
| Execution mode | `mode`, `state_origin` | Mode answers how decisions are produced. `origin_observer` is read-only by construction. |
| Mutation authority | configured flags, order-control status, `mutations_halted_reason`, client capability state | Authority is explicit. A connected socket alone never grants it. |
| Freshness | `generated_at_ms`, dependency timestamps, valuation timestamps | Stale/disconnected publishing makes current status unknown. Last-reported health may remain visible only when labelled as historical evidence. |
| Attention | pending reasons, blockers, `last_error`, operation reasons | The most actionable exact reason is visible without a tooltip. |

The health label is explicitly **Runtime healthy**, not **Service healthy**, so
it cannot be mistaken for a claim that every latest strategy action executed.
In `shadow_live`, the duplicate-exit reason `sell quantity … exceeds sellable
quantity … (tracked long … minus … pending sell)` is an expected local
simulation hold: render **Exit already queued locally** in a neutral tone and
say that it was not sent to the exchange. The raw reason remains available in
technical evidence. The same `intent_denied` outcome in true live mode remains
an attention state.

## Capability Semantics

| Capability | Available when | Otherwise |
| --- | --- | --- |
| Market observation | public dependency is configured and current | `Unavailable` with the published reason |
| Strategy decisions | decision evidence is published or the mode supports decisions | `No decision evidence` |
| Auth dependency | `auth_gate_configured=true` | `N/A — not configured` |
| Allocation authority | `allocation_configured=true` | `N/A — not configured` |
| Order submission | explicit Auth order-control configuration and ready status, with no mutation halt | `Unavailable` with the exact blocker |
| Manual controls | selected runtime advertises control capability and the client has a valid selected-runtime session | No action buttons; explain the missing capability |

`ready=true` on an unconfigured gate is never rendered as a positive readiness
signal. It is rendered as `N/A — not configured`.

## Information Architecture

The base **Strategy** dock tab is a catalog of every running strategy and its
health, execution mode, ticker count, freshness, and current attention reason.
It does not embed one runtime's task views.

The catalog first loads `list_strategy_runtimes`, then follows the unfiltered
runtime subscription. Each subscription payload replaces the complete catalog,
including `runtimes=[]`; an omitted runtime is removed. Operations and controls
remain scoped to the selected runtime. The gateway normally removes a runtime
after 30 seconds of receive silence, while the client marks snapshots stale
after 15 seconds. During that interval and on disconnect, the UI says **Status
unknown**, never **Healthy** plus **Data is stale**. Published health is shown
only as **Last reported: ...** until a fresh snapshot arrives.

Opening a catalog row creates one reusable contextual tab immediately after the
Strategy tab. Its title is `S: <strategy name>`, and every view inside it is
scoped to that selected runtime. Opening another strategy retargets the same
contextual tab; closing it returns to the Strategy catalog. The strategy
workspace exposes:

1. Overview
2. Tickers
3. Activity
4. Capital
5. Orders
6. Configuration
7. Administration

The hierarchy and detail areas each own one scroll container. Deep tables do not
compete with the fleet list for the same 240-pixel dock height.

## Field Coverage

| Gateway surface | Destination | Fallback |
| --- | --- | --- |
| identity, state, mode, generated time | Fleet and Overview | `Unknown`, never guessed |
| `state_origin`, `mutations_halted_reason` | Persistent status banner | derive only the safe observer fence from `mode=origin_observer` for older gateways |
| dependencies and pending feature/auth/allocation reasons | Overview | explicit empty state |
| `tickers[]`, last-decision summary | Tickers | legacy allocation rows, visibly marked |
| `recent_decisions`, decision history | Overview (20 most recent) and Activity | merge snapshot summaries with available durable rows; explicit no-evidence state |
| strategy operations and lifecycle intervals | Activity and chart lifecycle bands | unavailable state; never read JSONL paths |
| strategy money and valuation | Capital | `N/A by design` for observers |
| order counts, detailed blockers, stale forensics | Orders | counts only are labelled incomplete |
| canonical params, lineage, candidate metrics | Configuration | unknown lineage cannot link to a running candidate |
| automatic-allocation status and policy | Administration | read-only unavailable state |
| preview/approve operations | Administration | hidden unless actual runtime capability and revision gates pass |

## Required Scenario Fixtures

`test/fixtures/corky/strategy/strategy-ux-scenarios.json` defines the minimum
operator states every Strategy UI change must preserve:

- ready observer
- ready executable runtime
- degraded runtime
- stale/disconnected runtime
- allocation-blocked runtime
- automatic-allocation runtime

Money values remain decimal strings. Fixture administrative actions are
capability descriptions only and never authorize a live mutation.

## Administration Safety Flow

Automatic-allocation state is always rendered read-only before any action
surface. Mutations are available only when all of these are true:

- the runtime is not an `origin_observer`;
- the runtime advertises direct control;
- the selected-runtime WebSocket control session is active;
- runtime lineage is `verified`;
- an authoritative projection revision is available; and
- the rollout flag is enabled.

Policy changes follow `compare_strategy_allocation_policies` →
`preview_strategy_operation` → `approve_strategy_operation`. The final action
requires the exact text `APPROVE <preview_hash>`. Preview expiry, selected
runtime, preview hash, and projection revision are checked again before send;
the gateway remains authoritative for the final validation. The UI never
patches money, allocation, order, or runtime state optimistically after an
acknowledgement—it waits for immutable operation/runtime projections.

Set `VITE_CORKY_STRATEGY_ADMINISTRATION=0` at build/dev-server startup to keep
the entire Strategy workspace read-only while preserving automatic-allocation
status, comparisons already received, and all other evidence views. The default
is enabled, but runtime capability gates still apply.

## Operator Workflow

1. Open **Strategy** in the bottom dock to see every running strategy and its
   status.
2. Open a strategy to create its `S: <strategy name>` contextual tab.
3. Use **Overview** for current health, mode, authority, freshness, the 20 most
   recent decisions, and the direct link to the verified universe backtest
   study/candidate that supplied the runtime parameters.
4. Use **Tickers**, **Activity**, **Capital**, **Orders**, and
   **Configuration** for their respective evidence. Activity initially renders
   at most 200 loaded rows; reveal more in 200-row batches or request the next
   immutable page.
5. Use **Administration** to inspect published automatic-allocation state.
6. For a policy change, compare the candidate first, inspect allocation and
   ranking evidence, enter actor/idempotency key/reason, then create a preview.
7. Verify the operation, revision, expiry, and preview hash. Type the displayed
   exact approval statement to enable **Apply exact preview**.

The seven task tabs support Left/Right, Home, and End keyboard navigation. All
status colors have text labels; color is never the only state indicator.

## Release Validation

The SUX-7 release gate is:

```bash
npm run typecheck
npm test -- --run
npm run build
npm run size
```

When a chart gateway and dev server are available, also run:

```bash
npm run smoke:gateway
npm run smoke:browser
```

The browser smoke requires a live gateway; inability to connect is an
environmental prerequisite failure, not a substitute for the deterministic
unit/component/build gates.
