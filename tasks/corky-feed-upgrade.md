# Corky chart-feed gateway integration — upgrade plan

Upgrade trading-vuew to discover/list **tickers + timeframes + indicators** and load them onto
the chart via the **Corky chart-client-interface v1** WS gateway.

Spec: `/workspace/rust/corky/docs/protocol/chart-client-interface.v1.json`
Schemas/examples: `/workspace/rust/corky/docs/{schemas,examples}/chart-feed/v1/`

## Default decisions (proceed unless vetoed)
- **(A) Add alongside** the legacy file feed via a feed-source abstraction (reversible, both testable).
- **(B) Verify** the transform with golden tests against the checked-in example payloads; live-smoke
  the gateway when the corky stack is up (`cargo run -p corky-chart-gateway -- --bind 127.0.0.1:7070 …`).
- **(C) Full discovery-tree UI** (venue → symbol → timeframe chips → indicator toggles).
- Decimal strings → `Number()` for rendering, keep raw string for tooltip/legend.

## Phases (executed via Workflow, gated by my own test runs between phases)

### Phase C0 — Types & fixtures (foundation)
- [ ] Generate TS types from the 3 schema files → `src/types/corky-feed.ts`
      (ChartClientRequest, ChartFeedEvent, ChartStateDescriptor + sub-shapes).
- [ ] Copy the example request/event JSON into `test/fixtures/corky/` as the transform/test corpus.

### Phase C1 — Protocol client (`src/helpers/feed/corky-client.js`)
- [ ] WS connection (browser + injectable for node tests), JSON text encode/decode.
- [ ] `request_id` generation + outstanding-request correlation map; `schema_version:1` guard.
- [ ] Typed senders: `listCandleStates`, `subscribeCandles`, `unsubscribe`, `upsertCandleState`, `patchCandleState`.
- [ ] Event router (mitt) keyed by `event.type` and by `subscription_id`.
- [ ] Reconnect/backoff; map `known_error_codes` (retryable vs terminal); schema-version reject.
- [ ] Unit tests: drive it with a fake socket replaying fixture events; assert correlation/routing.

### Phase C2 — Ingestion adapter (`src/helpers/feed/corky-ingest.js`)
- [ ] `rowsToOhlcv`: decimal→Number → `[ts,o,h,l,c,v]`; keep raw strings sidecar.
- [ ] `pivotIndicators`: row-embedded `indicators` → per-(instanceKey,output) series `[[ts,val]]`.
- [ ] `kind` → onchart/offchart **catalog** (extensible) + overlay descriptor (type/name).
- [ ] Chunk assembly (chunk_index order) → DataCube `chart.data` + onchart/offchart overlays.
- [ ] Live merge: `live_update` by subscription_id+`sequence`, dedup `[timeframe, timestamp_ms]`,
      through DataCube merge/`revision` (reuse the proven reactive path).
- [ ] **Golden tests**: feed the example chunk/live events → assert exact DataCube shape (byte-pinned).

### Phase C3 — Feed-source abstraction + composable
- [ ] `FeedSource` interface; wrap legacy file loader as `FileFeed`, new gateway as `CorkyFeed`.
- [ ] `src/composables/useChartFeed.js`: discover() → states; subscribe(symbol,tf,indicators); lifecycle.
- [ ] Subscription↔chart mapping; unsubscribe on symbol/tf change + on unmount.

### Phase C4 — Discovery UI (App.vue + a picker component)
- [ ] Source toggle (File | Corky gateway).
- [ ] Discovery tree: venue → symbol(ticker) → timeframe chips (ready/stale badges) → indicator toggles.
- [ ] Loading/progress (historical_progress) + error states (retryable surfacing).
- [ ] Add-tf / add-indicator → `patch_candle_state` then re-subscribe.

### Phase C5 — Verify
- [ ] Full gate suite (golden/visual/stress/component + typecheck/lint/build).
- [ ] Live smoke when gateway up: connect ws://127.0.0.1:7070, list → subscribe tBTCUSD 1m →
      assert candles + SMA(20) render + live ticks.

## Notes / risks
- Gateway needs corky-zmq proxy (:5558) + public runtime + control (:6565); `runtime_not_found` is retryable.
- No auth/backpressure yet — design a hook, don't implement.
- `vite dev` currently won't start in this env (signal 16) → browser/live smoke may be deferred to the user.
