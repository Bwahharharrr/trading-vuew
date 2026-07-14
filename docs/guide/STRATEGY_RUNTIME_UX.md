# Strategy Runtime UX Contract

Status: SUX-0 semantic baseline.

The Strategy dock is an operator view over Corky chart-gateway projections. It
must not read strategy sidecars, calculate financial totals, infer authority, or
treat evidence as approval.

## Independent Status Axes

| Axis | Primary fields | Rendering rule |
| --- | --- | --- |
| Runtime health | `state`, `last_error` | Health answers whether the process is operational. It does not grant money or control authority. |
| Execution mode | `mode`, `state_origin` | Mode answers how decisions are produced. `origin_observer` is read-only by construction. |
| Mutation authority | configured flags, order-control status, `mutations_halted_reason`, client capability state | Authority is explicit. A connected socket alone never grants it. |
| Freshness | `generated_at_ms`, dependency timestamps, valuation timestamps | Stale data is shown separately from health and authority. |
| Attention | pending reasons, blockers, `last_error`, operation reasons | The most actionable exact reason is visible without a tooltip. |

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

The compact dock shows the fleet, selected-runtime status, and current
attention. The maximized workspace exposes:

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
| `recent_decisions`, decision history | Overview and Activity | explicit no-evidence state |
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

