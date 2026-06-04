// UMD / CDN entry. Same public surface as ./index, plus the `window.Vue`
// auto-install SIDE EFFECT (register the component + expose the lib globally
// when loaded via <script> alongside a global Vue). This side effect lives
// here, not in ./index, so the ESM entry stays side-effect-free and
// tree-shakeable. The Vite lib build points the UMD targets at this file.

import TradingVue, {
    Overlay, Utils, Constants, Candle, Volbar, layout_cnv, layout_vol,
    DataCube, Tool, Interface, primitives,
} from './index'

const w = (typeof window !== 'undefined' ? window : undefined) as any
if (w && w.Vue) {
    w.Vue.use(TradingVue)
    w.TradingVueLib = {
        TradingVue, Overlay, Utils, Constants,
        Candle, Volbar, layout_cnv, layout_vol,
        DataCube, Tool, Interface, primitives,
    }
}

export * from './index'
export { default } from './index'
