/// <reference types="vite/client" />

// Vue SFC modules. Loosely typed for now (Phase 1); the public component
// surface is typed precisely in Phase 4 when the `<TradingChart>` shell lands.
declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<Record<string, any>, Record<string, any>, any>
  export default component
}
