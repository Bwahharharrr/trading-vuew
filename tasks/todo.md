# Full bug-fix pass (2026-06-11 review)
Order: C1+M1 merge → C3 pins → C5/M17/M18/M27 feed → C2/M14/M15 render → C4 engine-loop →
M22/M23/M24 app → M2-M5 data → M6-M13 engine → M16/M19/M20/M21/M25/M26 → M28-M31 overlays → minors
- [ ] C1 merge gap-drop + M1 multi-match chunk corruption (+tests)
- [ ] C3 pin.js dead $emits (+test)
- [ ] C5 superseded subscribe revert; M17 re-issue wedge; M18 backoff permanent; M27 corkySelect staleness (+tests)
- [ ] C2 botbar stale layout; M14 wheel preventDefault; M15 grid_maker min/max (+tests)
- [ ] C4 ohlcvLen custom_main
- [ ] M22 cube destroy; M23 log_scale; M24 gateway tf buttons
- [ ] M2 includes(undefined); M3 empty-chart drop; M4 dss init; M5 loading flag
- [ ] M6-M13 engine cluster
- [ ] M16 botbar pandrag; M19 post-history errors; M20 layer instance scope; M21 views tf filter; M25 mirror index; M26 visibility wipe
- [ ] M28 degenerate collision; M29 dup shader; M30 orderbox guards; M31 defineTool clone
- [ ] minors batch
