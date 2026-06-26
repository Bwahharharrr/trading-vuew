import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'

// Vue 3 feature flags (mirror vite.config.ts) so SFCs compile under test.
const vueFlags = {
  __VUE_OPTIONS_API__: 'true',
  __VUE_PROD_DEVTOOLS__: 'false',
  __VUE_PROD_HYDRATION_MISMATCH_DETAILS__: 'false',
}

export default defineConfig({
  define: vueFlags,
  plugins: [vue()],
  test: {
    // Most suites are pure logic (engine/datacube/utils) and run in Node.
    // Suites needing a DOM (component/visual) opt in per-file via the
    // `// @vitest-environment jsdom` pragma.
    environment: 'node',
    include: ['test/**/*.{test,spec}.{js,ts}'],
    // Golden + visual snapshots live next to their suites.
    globals: false,
    // NB: the three native-addon (skia-canvas) suites — render-engine,
    // canvas-context, visual — raise their own testTimeout via vi.setConfig()
    // because their getImageData GPU->CPU readbacks are slow and
    // contention-sensitive under the full parallel run, blowing the 5s default.
    // We deliberately do NOT set a global `retry`: a retry would mask genuine
    // reproducible failures, and the real cause (too-tight default timeout for
    // native pixel readback) is fixed directly at those source files.
    coverage: {
      provider: 'v8',
      // Specifying `include` instruments EVERY matching file — even ones no test
      // imports — so untested source is visible in the denominator instead of
      // silently vanishing. (Vitest 4 dropped the old `all` flag; an explicit
      // `include` glob is now the mechanism. The prior config had no coverage
      // block at all, so it only reported test-imported files, understating
      // true coverage.)
      include: ['src/**'],
      exclude: [
        // Entry/auto-install shims and demo-only files: NOT part of the public
        // runtime export surface (verified against src/index.ts), so excluding
        // them keeps the denominator focused on shipped library code.
        'src/index.ts',
        'src/index.umd.ts',
        'src/main.js',
        'src/App.vue',
        'src/**/*Selector.vue',
        'src/types/**',
        'src/vite-env.d.ts',
        'src/icons/**',
      ],
      reporter: ['text', 'json-summary', 'html'],
      reportsDirectory: './coverage',
      // Floors set BELOW the measured baseline (88.99/78.35/86.45/91.92) so the
      // gate passes today and only trips on a real regression.
      thresholds: {
        statements: 88,
        branches: 78,
        functions: 86,
        lines: 90,
      },
    },
  },
})
