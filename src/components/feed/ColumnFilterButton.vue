<template>
<span ref="root" class="cfb" @click.stop>
    <!-- IMPORTANT: this <span> must be the SOLE template root. A sibling comment
         or element at the root would make Vue treat the component as a multi-root
         fragment, so this.$el becomes the fragment anchor and $el.contains() (used
         by the outside-click dismiss) returns false for clicks INSIDE the popover
         — closing it the instant you click the value box. The @click.stop also
         keeps clicks off the enclosing <th> sort handler. -->
    <button class="cfb-btn" :class="{ active: !!filter }" type="button"
            :title="filter ? `${column.label} ${filter.op} ${filter.value} — click to edit` : `Filter ${column.label}`"
            @click.stop="toggle">
        <template v-if="filter">{{ filter.op }}{{ fmtVal(filter.value) }}</template>
        <template v-else>+</template>
    </button>
    <div v-if="open" class="cfb-pop" @click.stop>
        <div class="cfb-pop-title">{{ column.label }}</div>
        <div class="cfb-row">
            <select class="cfb-op" v-model="draftOp">
                <option v-for="op in ops" :key="op" :value="op">{{ op }}</option>
            </select>
            <input ref="val" class="cfb-val" type="number" v-model="draftValue"
                   placeholder="value" @keydown.enter.prevent="apply" @keydown.esc.prevent="close" />
        </div>
        <div class="cfb-actions">
            <button v-if="filter" class="cfb-remove" type="button" @click.stop="remove">Remove</button>
            <button class="cfb-apply" type="button" :disabled="!canApply" @click.stop="apply">Apply</button>
        </div>
    </div>
</span>
</template>

<script>
// ColumnFilterButton — the small "[+]" that lives next to a sortable column
// heading and opens a one-column numeric-threshold filter (op + value). The
// PARENT owns the filter set; this only emits `apply` ({key,label,op,value}) and
// `clear` (key) for THIS column, so a re-apply replaces the column's filter
// rather than stacking. When a filter is active the trigger shows the condition
// (e.g. ">1000") in accent green so filtered columns are obvious at a glance.
import { FILTER_OPS } from '../../helpers/metric-filter.js'

export default {
    name: 'ColumnFilterButton',
    props: {
        // The column this filter targets: { key, label }. `key` is the metric/row
        // accessor key used by applyMetricFilters.
        column: { type: Object, required: true },
        // The active filter for this column ({ key, label, op, value }) or null.
        filter: { type: Object, default: null },
    },
    emits: ['apply', 'clear'],
    data() {
        return { open: false, ops: FILTER_OPS, draftOp: FILTER_OPS[0], draftValue: '' }
    },
    computed: {
        // Apply is live only once the value box holds a finite number.
        canApply() {
            return this.draftValue !== '' && Number.isFinite(Number(this.draftValue))
        },
    },
    methods: {
        toggle() { this.open ? this.close() : this.openPop() },
        openPop() {
            // Pre-fill from the active filter so the popover EDITS (not just adds).
            this.draftOp = this.filter ? this.filter.op : FILTER_OPS[0]
            this.draftValue = this.filter ? String(this.filter.value) : ''
            this.open = true
            this.$nextTick(() => { if (this.$refs.val) this.$refs.val.focus() })
            // Dismiss on the next click outside (capture-phase: fires regardless of
            // child stopPropagation). The opening click's mousedown already passed.
            document.addEventListener('mousedown', this._onDocDown, true)
        },
        close() {
            this.open = false
            document.removeEventListener('mousedown', this._onDocDown, true)
        },
        _onDocDown(e) {
            // Use the explicit root ref (always the <span>) rather than $el, which
            // would be a fragment anchor if a second root node ever crept in — and
            // then wrongly report every in-popover click as "outside".
            const root = this.$refs.root
            if (root && !root.contains(e.target)) this.close()
        },
        apply() {
            if (!this.canApply) return
            this.$emit('apply', {
                key: this.column.key, label: this.column.label,
                op: this.draftOp, value: Number(this.draftValue),
            })
            this.close()
        },
        remove() {
            this.$emit('clear', this.column.key)
            this.close()
        },
        // Compact value for the header chip — thousands collapse to a separated
        // integer so the heading doesn't balloon; small values show verbatim.
        fmtVal(v) {
            const n = Number(v)
            if (!Number.isFinite(n)) return String(v)
            return Math.abs(n) >= 1000 ? n.toLocaleString(undefined, { maximumFractionDigits: 0 }) : String(v)
        },
    },
    beforeUnmount() { document.removeEventListener('mousedown', this._onDocDown, true) },
}
</script>

<style scoped>
.cfb { display: inline-flex; position: relative; margin-left: 5px; vertical-align: middle; }
.cfb-btn {
    background: transparent; border: 1px solid #2a2e39; color: #5b6472; border-radius: 4px;
    font-size: 10px; line-height: 1; padding: 1px 4px; min-width: 16px; cursor: pointer;
    font-variant-numeric: tabular-nums; font-weight: 600;
}
.cfb-btn:hover { color: #d1d4dc; border-color: #3a4150; }
.cfb-btn.active { background: rgba(53,167,118,0.18); border-color: rgba(53,167,118,0.55); color: #35a776; }
/* Popover: anchored under the trigger, above the table rows. */
.cfb-pop {
    position: absolute; top: 100%; left: 0; margin-top: 5px; z-index: 40; width: 168px;
    background: #1a2030; border: 1px solid #2a2e39; border-radius: 6px; padding: 8px;
    box-shadow: 0 6px 18px rgba(0,0,0,0.45); text-align: left;
}
.cfb-pop-title { font-size: 10px; text-transform: uppercase; letter-spacing: 0.04em; color: #808a9d; font-weight: 700; margin-bottom: 6px; }
.cfb-row { display: flex; gap: 6px; }
.cfb-op, .cfb-val { background: #0e1320; color: #d1d4dc; border: 1px solid #2a2e39; border-radius: 4px; padding: 4px 6px; font-size: 12px; }
.cfb-op { width: 52px; text-align: center; }
.cfb-val { flex: 1; min-width: 0; width: 100%; }
.cfb-actions { display: flex; justify-content: flex-end; gap: 6px; margin-top: 8px; }
.cfb-apply { background: #35a776; color: #fff; border: none; border-radius: 4px; padding: 4px 12px; font-size: 11px; cursor: pointer; }
.cfb-apply:hover:not(:disabled) { background: #2e9468; }
.cfb-apply:disabled { opacity: 0.4; cursor: default; }
.cfb-remove { background: transparent; color: #e07a85; border: 1px solid rgba(229,65,80,0.4); border-radius: 4px; padding: 4px 10px; font-size: 11px; cursor: pointer; }
.cfb-remove:hover { background: rgba(229,65,80,0.14); color: #e54150; }
</style>
