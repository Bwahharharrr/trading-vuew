import { createHash } from 'node:crypto'
import { existsSync } from 'node:fs'
import { readFile, writeFile } from 'node:fs/promises'
import { isDeepStrictEqual } from 'node:util'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { compile } from 'json-schema-to-typescript'

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const outputPath = join(projectRoot, 'src/types/corky-feed.generated.ts')
const schemaFiles = [
  'chart-client-request.schema.json',
  'chart-feed-event.schema.json',
  'chart-state-descriptor.schema.json'
]
const legacyExports = `
DecimalString TimestampMs SchemaVersion Timeframe ServiceState RuntimeControlStatus
StateControlOutcome KnownErrorCode ErrorCode ChartHistoryRangeLatest
ChartHistoryRangeStartEnd ChartHistoryRangeSinceInception ChartHistoryRange
HistoricalCandleRange CandleSnapshot RowIndicators ChartCandleRow CandlePreview
ChartTimeframeRange IndicatorViewLayerKind IndicatorViewTarget IndicatorViewLayerSpec
IndicatorViewSpec ChartIndicatorDescriptor ChartCandleStateDescriptor
ChartAuthPositionSource ChartAuthPosition ChartAuthPositionAuditStatus
ChartAuthPositionAuditPosition ChartAuthPositionAuditSummary ChartAuthPositionFeeKind
ChartAuthPositionAuditFee ChartAuthPositionAuditOrder ChartAuthPositionAuditTrade
ChartAuthPositionAudit PublicIndicatorSpec ListCandleStatesCommand
SubscribeCandlesCommand UnsubscribeCommand UpsertCandleStateCommand
PatchCandleStateCommand ListAuthPositionsCommand SubscribeAuthPositionsCommand
ListAuthPositionHistoryCommand GetAuthPositionAuditCommand
SubscribeAuthPositionAuditCommand SearchCompareOp SearchConditionField
SearchConditionCompare SearchConditionAll SearchConditionAny SearchCondition
SearchSymbolSet SearchIndicatorSpec SearchResultWindow
SearchBarrierSymmetricTargetSpec SearchTargetSpec SearchQuery SearchCandlesCommand
CancelSearchCommand BacktestRunStatus ListStrategiesCommand GetStrategyCommand
ListStrategyLaunchProfilesCommand ChartStrategyLaunchProfile
ChartStrategyRuntimeLifecycleStatus ListBacktestRunsCommand GetBacktestRunCommand
GetBacktestProgressCommand SubscribeBacktestProgressCommand
GetBacktestChartOverlaysCommand GetBacktestReportOverlaysCommand ChartClientCommand
ChartClientCommandType ChartClientRequest CandleStatesEvent SubscriptionAcceptedEvent
SubscriptionAcceptedSummaryEvent HistoricalAckEvent HistoricalProgressEvent
HistoricalChunkEvent HistoricalChunkColumnarEvent HistoricalCompleteEvent
LiveUpdateEvent ControlAckEvent ErrorEvent AuthPositionsEvent
AuthPositionsUpdateEvent AuthPositionHistoryEvent AuthPositionAuditEvent
AuthPositionAuditUpdateEvent SearchObservation SearchCrupContext SearchChartWindow
SearchBarrierSymmetricPlan SearchBarrierSymmetricOutcome
SearchBarrierSymmetricAnalyticsSummary SearchBarrierSymmetricEvaluation
SearchTargetEvaluation SearchMatchResult SearchAcceptedEvent SearchProgressEvent
SearchMatchEvent SearchCompleteEvent SearchCancelledEvent SearchFailedEvent
ChartStrategyParameterDescriptor ChartStrategyDescriptor ChartBacktestRunSummary
ChartBacktestProgressItem ChartBacktestTradeOverlay ChartBacktestPriceLevelOverlay
ChartBacktestEquityCurvePoint ChartBacktestMetricDescriptor ChartBacktestPeriodReturn
ChartBacktestSeriesDescriptor ChartBacktestTradeChartOverlay StrategiesEvent
StrategyEvent StrategyRuntimeLifecycleEvent BacktestRunsEvent BacktestRunEvent
BacktestProgressEvent BacktestProgressUpdateEvent BacktestChartOverlaysEvent
BacktestReportOverlaysEvent ChartFeedEventKind ChartFeedEventType ChartFeedEvent
EventOf CommandOf
`.trim().split(/\s+/)

function findSchemaDirectory() {
  const roots = [
    process.env.CORKY_ROOT,
    '/workspace/rust/corky',
    resolve(projectRoot, '../corky'),
    resolve(projectRoot, '../corky-stream')
  ].filter(Boolean)
  return roots
    .map(root => join(root, 'docs/schemas/chart-feed/v1'))
    .find(dir => schemaFiles.every(file => existsSync(join(dir, file))))
}

function schemaRoot(schema) {
  return Object.fromEntries(
    Object.entries(schema).filter(([key]) => !['$schema', 'title', 'definitions'].includes(key))
  )
}

function discriminatorAliases(schema, definition, suffix, union) {
  return schema.definitions[definition].oneOf.map(variant => {
    const type = variant.properties?.type?.enum?.[0]
    if (!type) throw new Error(`${definition} variant is missing a single type enum`)
    const name = type.split('_').map(word => word[0].toUpperCase() + word.slice(1)).join('')
    return `export type ${name}${suffix} = Extract<${union}, { type: '${type}' }>`
  })
}

function compatibilityAliases(requestSchema, eventSchema) {
  const generatedVariants = [
    ...discriminatorAliases(requestSchema, 'ChartClientCommand', 'Command', 'ChartClientCommand'),
    ...discriminatorAliases(eventSchema, 'ChartFeedEventKind', 'Event', 'ChartFeedEventKind')
  ]
  return `
// Compatibility aliases retained for the original public deep-import surface.
export type DecimalString = string
export type TimestampMs = number
export type SchemaVersion = 1
export type Timeframe = string
export type KnownErrorCode =
  | 'unsupported_schema_version' | 'invalid_request_json' | 'state_not_found'
  | 'runtime_not_found' | 'invalid_control_command' | 'control_response_timeout'
  | 'control_receive_error' | 'historical_query_failed'
  | 'auth_position_history_unavailable' | 'auth_position_audit_unavailable'
  | 'stateful_websocket_required' | 'backtest_artifacts_disabled'
  | 'strategy_not_found' | 'backtest_not_found' | 'backtest_artifact_not_ready'
  | 'invalid_backtest_request' | 'backtest_artifact_invalid'
  | 'backtest_store_unavailable'
export type ErrorCode = KnownErrorCode | (string & {})
export type ChartHistoryRangeLatest = Extract<ChartHistoryRange, { type: 'latest' }>
export type ChartHistoryRangeStartEnd = Extract<ChartHistoryRange, { type: 'start_end' }>
export type ChartHistoryRangeSinceInception = Extract<ChartHistoryRange, { type: 'since_inception' }>
export type RowIndicators = Record<string, Record<string, DecimalString>>
export type ChartAuthPositionFeeKind = ChartAuthPositionAuditFee['kind']
export type SearchCompareOp = AlertCompareOp
export type SearchConditionField = AlertFieldRef
export type SearchConditionCompare = Extract<AlertCondition, { type: 'compare' }>
export type SearchConditionAll = Extract<AlertCondition, { type: 'all' }>
export type SearchConditionAny = Extract<AlertCondition, { type: 'any' }>
export type SearchCondition = AlertCondition
export type SearchSymbolSet = Extract<SearchSymbolScope, { type: 'symbols' }>
export type SearchIndicatorSpec = PublicIndicatorSpec
export type SearchQuery = SearchCandleQuery
export type SearchObservation = AlertObservation
export type SearchMatchResult = SearchCandleMatch
export type BacktestRunStatus = 'queued' | 'running' | 'completed' | 'failed'
export type ChartBacktestProgressItem = ChartBacktestProgressEvent
export type ChartClientCommandType = ChartClientCommand['type']
export type ChartFeedEventType = ChartFeedEventKind['type']
export type EventOf<T extends ChartFeedEventType> = Extract<ChartFeedEventKind, { type: T }>
export type CommandOf<T extends ChartClientCommandType> = Extract<ChartClientCommand, { type: T }>
${generatedVariants.join('\n')}
`
}

function assertLegacyExports(source) {
  const exports = new Set(
    [...source.matchAll(/^export (?:type|interface) ([A-Za-z0-9_]+)/gm)].map(match => match[1])
  )
  const missing = legacyExports.filter(name => !exports.has(name))
  if (missing.length) throw new Error(`generated chart-feed types lost exports: ${missing.join(', ')}`)
}

async function generate(schemaDirectory) {
  const entries = await Promise.all(schemaFiles.map(async file => {
    const bytes = await readFile(join(schemaDirectory, file))
    return { file, bytes, schema: JSON.parse(bytes) }
  }))
  const [request, event, state] = entries.map(entry => entry.schema)
  const definitions = {}
  for (const { file, schema } of entries) {
    for (const [name, definition] of Object.entries(schema.definitions)) {
      if (definitions[name] && !isDeepStrictEqual(definitions[name], definition)) {
        throw new Error(`conflicting ${name} definition in ${file}`)
      }
      definitions[name] = definition
    }
  }
  definitions.ChartClientRequest = schemaRoot(request)
  if (!isDeepStrictEqual(definitions.ChartCandleStateDescriptor, schemaRoot(state))) {
    throw new Error('chart-state-descriptor root differs from the event schema definition')
  }
  const hashes = entries.map(({ file, bytes }) =>
    `${file} sha256:${createHash('sha256').update(bytes).digest('hex')}`
  )
  const source = await compile({ ...event, definitions }, 'ChartFeedEvent', {
    cwd: schemaDirectory,
    unreachableDefinitions: true,
    bannerComment: `/* Generated from Corky chart-feed v1 schemas.\n * ${hashes.join('\n * ')}\n * Do not edit by hand.\n */`,
    style: { singleQuote: true, semi: false }
  }) + compatibilityAliases(request, event)
  assertLegacyExports(source)
  await writeFile(outputPath, source)
}

const schemaDirectory = process.argv.includes('--checked') ? undefined : findSchemaDirectory()
if (schemaDirectory) {
  await generate(schemaDirectory)
  console.log(`generated ${outputPath} from ${schemaDirectory}`)
} else {
  const checkedSource = await readFile(outputPath, 'utf8')
  assertLegacyExports(checkedSource)
  console.log('Corky schemas are unavailable; verified the checked generated declaration')
}
