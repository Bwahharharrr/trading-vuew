module.exports = {
    "root": true,
    "env": {
        "browser": true,
        "es2021": true,
        "node": true,
        "worker": true
    },
    "extends": [
        "eslint:recommended",
        "plugin:vue/recommended"
    ],
    "globals": {
        "Atomics": "readonly",
        "SharedArrayBuffer": "readonly",
        // Build-time constant injected by Vite `define` (dev mobile debugging).
        "MOB_DEBUG": "readonly"
    },
    "parserOptions": {
        // The codebase uses optional chaining / nullish coalescing (ES2020+);
        // the old `ecmaVersion: 2018` caused 27 spurious parse errors.
        "ecmaVersion": 2021,
        "sourceType": "module"
    },
    "plugins": [
        "vue"
    ],
    "rules": {
        "vue/html-indent": "off",
        // `no-undef` stays an ERROR — it caught two real block-scope bugs.
        "no-undef": "error",
        // Pre-existing legacy debt in this ~20k LOC codebase: keep visible as
        // warnings (CI fails on errors, not warnings) so the build-migration
        // phase introduces no behavioural churn. Tightening these to errors is
        // tracked for the Phase 4 component restructure.
        "no-unused-vars": "warn",
        "no-case-declarations": "warn",
        "no-redeclare": "warn",
        "no-empty": "warn",
        "no-constant-condition": "warn",
        "no-useless-escape": "warn",
        "no-mixed-spaces-and-tabs": "warn",
        "no-unexpected-multiline": "warn",
        // Leading `;[a,b] = …` defensive semicolons in grid_maker.js are
        // intentional; keep visible without blocking (and without an autofix
        // that could strip a genuine ASI guard elsewhere).
        "no-extra-semi": "warn",
        "vue/multi-word-component-names": "warn",
        "vue/require-v-for-key": "warn",
        "vue/no-v-for-template-key": "warn",
        "vue/no-side-effects-in-computed-properties": "warn"
    }
};
