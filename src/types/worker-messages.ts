// Typed discriminated union for the DataCube → ScriptEngine worker protocol.
// Runtime enforcement lives in ../helpers/schema/worker-messages.js; this file
// is the compile-time contract (and documentation) for those message shapes.

export type Timeframe = number | string
export type Range = [number, number]

export interface WWBase<T extends string, D = unknown> {
  type: T
  /** Correlation id for request/response messages. */
  id?: string
  data: D
}

export type UpdateDcSettings = WWBase<'update-dc-settings', Record<string, unknown>>
export type ExecScript = WWBase<'exec-script', { s: unknown; tf: Timeframe; range: Range }>
export type ExecAllScripts = { type: 'exec-all-scripts'; data?: { tf: Timeframe; range: Range } }
export type UploadData = WWBase<'upload-data', Record<string, unknown> | { ohlcv: unknown }>
export type UploadModule = WWBase<'upload-module', { id: string; main: string }>
export type ModuleEvent = { type: 'module-event'; data?: unknown }
export type UpdateData = WWBase<'update-data', { ohlcv?: unknown } & Record<string, unknown>>
export type GetDataset = WWBase<'get-dataset', string>
export type DatasetOp = WWBase<'dataset-op', { id: string; exec?: boolean } & Record<string, unknown>>
export type UpdateOvSettings = WWBase<'update-ov-settings', { delta: unknown; tf: Timeframe; range: Range }>
export type SendMetaInfo = { type: 'send-meta-info'; data?: { tf: Timeframe; range: Range } }
export type RemoveScripts = WWBase<'remove-scripts', string[]>

/** Any message the worker accepts. */
export type WorkerMessage =
  | UpdateDcSettings
  | ExecScript
  | ExecAllScripts
  | UploadData
  | UploadModule
  | ModuleEvent
  | UpdateData
  | GetDataset
  | DatasetOp
  | UpdateOvSettings
  | SendMetaInfo
  | RemoveScripts

/** Messages the worker posts back (WW → DC). */
export type WorkerEvent =
  | { type: 'request-data'; data: unknown }
  | { type: 'overlay-data'; data: unknown }
  | { type: 'overlay-update'; data: unknown }
  | { type: 'data-uploaded' }
  | { type: 'engine-state'; data: Record<string, unknown> }
  | { type: 'modify-overlay'; data: unknown }
  | { type: 'module-data'; data: unknown }
  | { type: 'script-signal'; data: unknown }
  | { type: 'script-error'; data: { uuid: string | null; name?: string; type?: string; phase: string; message: string } }
  | { id: string; data: unknown }
