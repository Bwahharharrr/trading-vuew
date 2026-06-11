# Full bug-fix pass (2026-06-11 review) — COMPLETE
All 5 criticals, all 26 majors, and 17/18 minors fixed across 7 commits
(c75a70f, b662a8a, 2d951e0, 7ab3706, bb9c60f, 93f541b, + minors).
DEFERRED (deliberate): substring id matching (EMA1 also matches EMA10+) —
changing public query semantics risks breaking name-with-space matching used
by the corky feed; documented in stores/query.js callers instead.
NOTE: the Zones settings-format "mismatch" was a FALSE POSITIVE — ws-manager
deliberately converts element order on write; documented the pair in Zones.vue.
