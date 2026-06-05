// Corky chart-client-interface v1 fixtures.
//
// Verbatim copies of the canonical examples shipped in the Corky repo at
//   docs/examples/chart-feed/v1/*.json
// re-exported here as parsed JSON so tests can import a single barrel.
//
// JSON imports are resolved natively by Vite/Vitest (see existing usage such
// as test/tests/Simple.vue: `import Data from '../data/data_btc.json'`).

import candleStatesEvent from './candle-states.event.json'
import controlAckEvent from './control-ack.event.json'
import errorEvent from './error.event.json'
import historicalChunkEvent from './historical-chunk.event.json'
import listCandleStatesRequest from './list-candle-states.request.json'
import liveUpdateEvent from './live-update.event.json'
import subscribeLatestRequest from './subscribe-latest.request.json'
import upsertCandleStateRequest from './upsert-candle-state.request.json'

// Named exports keyed by a JS-friendly camelCase identifier.
export {
  candleStatesEvent,
  controlAckEvent,
  errorEvent,
  historicalChunkEvent,
  listCandleStatesRequest,
  liveUpdateEvent,
  subscribeLatestRequest,
  upsertCandleStateRequest,
}

// Map keyed by original on-disk filename, for tests that want to iterate the
// whole corpus or look a fixture up by its canonical name.
export const fixturesByFilename = {
  'candle-states.event.json': candleStatesEvent,
  'control-ack.event.json': controlAckEvent,
  'error.event.json': errorEvent,
  'historical-chunk.event.json': historicalChunkEvent,
  'list-candle-states.request.json': listCandleStatesRequest,
  'live-update.event.json': liveUpdateEvent,
  'subscribe-latest.request.json': subscribeLatestRequest,
  'upsert-candle-state.request.json': upsertCandleStateRequest,
}
