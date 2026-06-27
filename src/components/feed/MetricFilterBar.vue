<template>
<div class="mfb">
    <!-- Builder row: pick a column, an operator, a threshold, then Add. -->
    <div class="mfb-controls">
        <select class="bt-input mfb-col" v-model="draftKey">
            <option value="" disabled>column…</option>
            <option v-for="c in columns" :key="c.key" :value="c.key">{{ c.label }}</option>
        </select>
        <select class="bt-input mfb-op" v-model="draftOp">
            <option v-for="op in ops" :key="op" :value="op">{{ op }}</option>
        </select>
        <input class="bt-input mfb-val" type="number" v-model="draftValue"
               placeholder="value" @keydown.enter="add" />
        <button class="mfb-add" :disabled="!canAdd" @click="add">+ Add</button>
    </div>

    <!-- Active filters as removable chips: "<label> <op> <value>  ×". -->
    <div v-if="filters.length" class="mfb-chips">
        <span v-for="(f, i) in filters" :key="i" class="mfb-chip">
            <span class="mfb-chip-text">{{ f.label }} {{ f.op }} {{ f.value }}</span>
            <button class="mfb-chip-x" title="Remove filter" @click="remove(i)">×</button>
        </span>
    </div>
</div>
</template>

<script>
// MetricFilterBar — compact numeric column-filter builder for tabular views
// (backtest RUNS list, universe CANDIDATES table). Presentational + stateless
// w.r.t. the active filters: the PARENT owns the `filters` array (so they can
// live in App-level state and persist across tabs/views); this only emits the
// FULL new array on every add/remove. Matches the dark .bt-input look.
import { FILTER_OPS } from '../../helpers/metric-filter.js'

export default {
    name: 'MetricFilterBar',
    props: {
        // Filterable columns to offer in the column <select>.
        columns: { type: Array, default: () => [] },
        // The active filters (parent-owned): [{ key, label, op, value }].
        filters: { type: Array, default: () => [] },
    },
    emits: ['update:filters'],
    data() {
        return {
            ops: FILTER_OPS,
            draftKey: '',
            draftOp: FILTER_OPS[0],
            // Kept as a string (the <input> v-model); coerced to a number on Add.
            draftValue: '',
        }
    },
    computed: {
        // Add is live only once a column is chosen AND the value is a finite
        // number (an empty / non-numeric box can't be committed).
        canAdd() {
            return !!this.draftKey && Number.isFinite(Number(this.draftValue)) && this.draftValue !== ''
        },
    },
    methods: {
        add() {
            if (!this.canAdd) return
            const col = this.columns.find((c) => c.key === this.draftKey)
            const filter = {
                key: this.draftKey,
                label: col ? col.label : this.draftKey,
                op: this.draftOp,
                value: Number(this.draftValue),
            }
            this.$emit('update:filters', [...this.filters, filter])
            // Reset just the value so a chain of filters on the same column is quick.
            this.draftValue = ''
        },
        remove(idx) {
            this.$emit('update:filters', this.filters.filter((_, i) => i !== idx))
        },
    },
}
</script>

<style scoped>
.mfb { display: flex; flex-direction: column; gap: 6px; }
.mfb-controls { display: flex; gap: 6px; align-items: center; flex-wrap: wrap; }
/* Mirror CorkyBacktestsPanel .bt-input for a consistent dark control look. */
.bt-input { background: #0e1320; color: #d1d4dc; border: 1px solid #2a2e39; border-radius: 4px; padding: 5px 8px; font-size: 12px; }
.mfb-col { max-width: 160px; }
.mfb-op { width: 56px; text-align: center; }
.mfb-val { width: 92px; }
.mfb-add { background: #35a776; color: #fff; border: none; border-radius: 4px; padding: 6px 12px; font-size: 12px; cursor: pointer; white-space: nowrap; }
.mfb-add:hover:not(:disabled) { background: #2e9468; }
.mfb-add:disabled { opacity: 0.4; cursor: default; }
.mfb-chips { display: flex; flex-wrap: wrap; gap: 6px; }
.mfb-chip { display: inline-flex; align-items: center; gap: 4px; font-size: 11px; color: #d1d4dc;
            background: rgba(53,167,118,0.12); border: 1px solid rgba(53,167,118,0.35);
            border-radius: 10px; padding: 1px 4px 1px 8px; }
.mfb-chip-text { color: #c4ccda; font-variant-numeric: tabular-nums; }
.mfb-chip-x { background: none; border: none; color: #808a9d; cursor: pointer; font-size: 13px;
              line-height: 1; padding: 0 3px; border-radius: 8px; }
.mfb-chip-x:hover { color: #e54150; background: rgba(229,65,80,0.14); }
</style>
