# Test-coverage audit (2026-06-23) — COMPLETE
Multi-agent (ultracode) coverage audit: 11 areas, 94 gaps found → 30 new test
files, 542 new cases, 0 source changes. Suite 1139 → 1681 tests (162 files), all
green incl. under `npm run coverage`.
Coverage: statements 76.6%→83.0%, branches 65.4%→72.4%, functions 74.4%→79.2%,
lines 79.6%→85.8%.
Areas: corky feed (client/feed/ingest/search/positions/catalog/feed-source),
ScriptEngine (cache/exec_sel/format_map/lifecycle) + dc_events, App/mixins
(corkySelect status, positions data, ws-manager, indicator-manager, datatrack),
render/overlays (layout math, pan/zoom, candle primitives, SignalMarker.draw,
overlay draw geometry, Legend, TradingVue index-based), API/utils (defineOverlay/
defineTool, composables, stuff utils).
Flake fixed: engine-exec-sel used fixed setTimeout sleeps that broke under
coverage instrumentation; rewritten to poll for the actual condition.

# Full bug-fix pass (2026-06-11 review) — COMPLETE
All 5 criticals, all 26 majors, and 17/18 minors fixed across 7 commits
(c75a70f, b662a8a, 2d951e0, 7ab3706, bb9c60f, 93f541b, + minors).
DEFERRED (deliberate): substring id matching (EMA1 also matches EMA10+) —
changing public query semantics risks breaking name-with-space matching used
by the corky feed; documented in stores/query.js callers instead.
NOTE: the Zones settings-format "mismatch" was a FALSE POSITIVE — ws-manager
deliberately converts element order on write; documented the pair in Zones.vue.
