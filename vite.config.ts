import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import cssInjectedByJs from 'vite-plugin-css-injected-by-js'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { readFileSync } from 'node:fs'
import { devServerPlugin } from './vite/dev-server-plugin'

const __dirname = dirname(fileURLToPath(import.meta.url))
const pkg = JSON.parse(
  readFileSync(resolve(__dirname, 'package.json'), 'utf-8')
)

const BANNER =
  `TradingVue.JS - v${pkg.version}\n` +
  `    https://github.com/tvjsx/trading-vue-js\n` +
  `    Copyright (c) 2019 C451 Code's All Right;\n` +
  `    Licensed under the MIT license`

// One of: 'umd' | 'umd-min' | 'es'. Set by the npm `build` script so the three
// dist artifacts are produced from a single config without clobbering each
// other (emptyOutDir is only true for the first target).
const BUILD_TARGET = process.env.BUILD_TARGET || 'umd'

// Vue 3 feature flags — identical to the old webpack DefinePlugin block.
const vueFlags = {
  __VUE_OPTIONS_API__: 'true',
  __VUE_PROD_DEVTOOLS__: 'false',
  __VUE_PROD_HYDRATION_MISMATCH_DETAILS__: 'false',
}

export default defineConfig(({ command }) => {
  // ---- Dev server (npm run dev) ----
  if (command === 'serve') {
    return {
      define: {
        ...vueFlags,
        MOB_DEBUG: JSON.stringify(process.env.MOB_DEBUG),
      },
      plugins: [vue(), devServerPlugin()],
      // The app worker is bundled inline (see script_ww_api.js); module
      // workers keep ESM imports intact in dev.
      worker: { format: 'es' },
      server: {
        host: '0.0.0.0',
        // The backend rewrites data/*.json on every closed candle. Ignore the
        // data dir so HMR never full-reloads the chart and discards the live
        // WS state (the webpack `static.watch:false` equivalent).
        watch: { ignored: ['**/data/**'] },
      },
    }
  }

  // ---- Library builds (npm run build) ----
  const isEs = BUILD_TARGET === 'es'
  const isMin = BUILD_TARGET === 'umd-min'

  return {
    define: vueFlags,
    // cssInjectedByJs replicates the old vue-style-loader behaviour: component
    // <style> blocks are injected into <head> at runtime, so the bundle stays
    // self-contained and consumers never have to import a separate .css file.
    plugins: [vue(), cssInjectedByJs()],
    // Inline the script worker (text/javascript Blob + data: URI fallback) so
    // the UMD bundle stays a single self-contained file — replaces
    // webpack/ww_plugin.js + ww$$$.json. Note: an ES MODULE worker (worker.format
    // 'es'), which requires Firefox 114+ / Safari 15+ (vs the old classic worker).
    worker: { format: 'es' },
    build: {
      // Only the first target wipes dist; later targets append.
      emptyOutDir: BUILD_TARGET === 'umd',
      sourcemap: true,
      minify: isMin ? 'terser' : false,
      lib: {
        entry: resolve(__dirname, 'src/index.ts'),
        name: 'TradingVueJs',
        formats: isEs ? ['es'] : ['umd'],
        fileName: () =>
          isEs ? 'trading-vue.es.js'
            : isMin ? 'trading-vue.min.js'
              : 'trading-vue.js',
      },
      rollupOptions: {
        // ESM build externalises Vue (tree-shakeable, for npm consumers).
        // UMD build bundles Vue (self-contained, for CDN/<script> use) —
        // matching the historical dist contract.
        external: isEs ? ['vue'] : [],
        output: {
          // The entry mixes a default export (TradingVue) with named exports;
          // 'named' keeps both (default reachable via `.default`), matching the
          // historical webpack UMD namespace behaviour.
          exports: 'named',
          globals: { vue: 'Vue' },
          banner: isMin ? undefined : `/*!\n${BANNER}\n*/`,
        },
      },
      terserOptions: isMin
        ? { mangle: { reserved: ['_id', '_tf'] } }
        : undefined,
    },
    resolve: isEs
      ? {}
      : // UMD bundles Vue: use the full esm-bundler build (matches old alias).
      { alias: { vue: 'vue/dist/vue.esm-bundler.js' } },
  }
})
