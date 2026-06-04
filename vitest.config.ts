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
  },
})
