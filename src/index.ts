import TradingVue from './TradingVue.vue'
import DataCube from './helpers/datacube.js'
import Overlay from './mixins/overlay.js'
import Tool from './mixins/tool.js'
import Interface from './mixins/interface.js'
import Utils from './stuff/utils.js'
import Constants from './stuff/constants.js'
import Candle from './components/primitives/candle.js'
import Volbar from './components/primitives/volbar.js'
import Line from './components/primitives/line.js'
import Pin from './components/primitives/pin.js'
import Price from './components/primitives/price.js'
import Ray from './components/primitives/ray.js'
import Seg from './components/primitives/seg.js'

import { layout_cnv, layout_vol } from
    './components/js/layout_cnv.js'
import { defineOverlay } from './api/defineOverlay.js'
import { defineTool } from './api/defineTool.js'

const primitives = {
    Candle, Volbar, Line, Pin, Price, Ray, Seg
}

// `TradingVue` is an untyped .vue default export; cast through `any` to attach
// the Vue plugin `install` hook and to reach the optional `window.Vue` global
// without leaking `any` into the public surface.
const TV = TradingVue as any

TV.install = function (Vue: any) {
    Vue.component(TV.name, TradingVue)
}

const w = (typeof window !== 'undefined' ? window : undefined) as any
if (w && w.Vue) {
    w.Vue.use(TradingVue)
    w.TradingVueLib = {
        TradingVue, Overlay, Utils, Constants,
        Candle, Volbar, layout_cnv, layout_vol,
        DataCube, Tool, Interface, primitives
    }
}

export default TradingVue

export {
    TradingVue, Overlay, Utils, Constants,
    Candle, Volbar, layout_cnv, layout_vol,
    DataCube, Tool, Interface, primitives,
    defineOverlay, defineTool
}

// Public type surface (Phase 2 — typed boundaries). Type-only re-exports, no
// runtime cost; they ship in dist/types so consumers get typed events,
// overlay contracts, validation diagnostics, and the worker protocol.
export type {
    TradingVueEventMap, TradingVueEventName, CustomEventName, CustomEventArgs,
    IndicatorInfo, IndicatorError, OverlayRef, Range,
} from './types/events'
export type {
    OverlayDefinition, OverlayMeta, OverlayDrawContext,
} from './types/overlay'
export type {
    DefineOverlayConfig, DefineToolConfig, RenderContext,
} from './types/define-overlay'
export type { Diagnostic } from './types/diagnostics'
export type { WorkerMessage, WorkerEvent } from './types/worker-messages'
