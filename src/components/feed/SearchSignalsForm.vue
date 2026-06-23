<template>
<div class="ssf">
    <div class="ssf-row ssf-grid2">
        <label class="ssf-field">
            <span class="ssf-label">Venue</span>
            <input class="ssf-input" v-model.trim="venue" placeholder="BITFINEX"
                   @input="venueDirty = true" />
        </label>
        <label class="ssf-field">
            <span class="ssf-label">Symbol(s)</span>
            <input class="ssf-input" v-model.trim="symbol" placeholder="tBTCUSD, tETHUSD"
                   @input="symbolDirty = true" />
        </label>
    </div>

    <div class="ssf-row">
        <span class="ssf-label">Timeframes</span>
        <div class="ssf-tfs">
            <button v-for="tf in availableTimeframes" :key="tf" type="button"
                    class="ssf-chip" :class="{ on: tfs.includes(tf) }"
                    @click="toggleTf(tf)">{{ tf }}</button>
            <span v-if="!availableTimeframes.length" class="ssf-hint">No timeframes discovered for this symbol</span>
        </div>
    </div>

    <div class="ssf-row">
        <span class="ssf-label">Range</span>
        <div class="ssf-range">
            <label class="ssf-radio">
                <input type="radio" value="latest" v-model="rangeMode" /> Latest
                <input class="ssf-input ssf-num" type="number" min="1" v-model.number="latestLimit"
                       :disabled="rangeMode !== 'latest'" /> bars
            </label>
            <label class="ssf-radio">
                <input type="radio" value="start_end" v-model="rangeMode" /> Date range
            </label>
            <template v-if="rangeMode === 'start_end'">
                <input class="ssf-input ssf-date" type="datetime-local" v-model="startStr" />
                <span class="ssf-arrow">→</span>
                <input class="ssf-input ssf-date" type="datetime-local" v-model="endStr" />
            </template>
        </div>
    </div>

    <div class="ssf-row">
        <span class="ssf-label">Conditions <span class="ssf-hint">(all must hold)</span></span>
        <div class="ssf-conds">
            <div v-for="(row, i) in rows" :key="i" class="ssf-cond">
                <select class="ssf-input ssf-sel" v-model="row.indicator" @change="row.field = ''">
                    <option value="" disabled>Indicator…</option>
                    <option v-for="ind in indicators" :key="ind.label" :value="ind.label">{{ ind.label }}</option>
                </select>
                <select class="ssf-input ssf-sel" v-model="row.field">
                    <option value="" disabled>Field…</option>
                    <option v-for="f in fieldsFor(row.indicator)" :key="f" :value="f">{{ f }}</option>
                </select>
                <select class="ssf-input ssf-op" v-model="row.op">
                    <option v-for="o in OPS" :key="o.v" :value="o.v">{{ o.label }}</option>
                </select>
                <input class="ssf-input ssf-num" type="number" step="any" v-model="row.value" placeholder="value" />
                <input class="ssf-input ssf-num ssf-offset" type="number" min="0" v-model.number="row.bar_offset"
                       title="Bars back (0 = this bar)" />
                <button type="button" class="ssf-iconbtn" title="Remove condition"
                        :disabled="rows.length === 1" @click="removeRow(i)">×</button>
            </div>
            <button type="button" class="ssf-addcond" @click="addRow">+ Add condition</button>
        </div>
    </div>

    <div class="ssf-row ssf-grid3">
        <label class="ssf-field">
            <span class="ssf-label">Bars before</span>
            <input class="ssf-input" type="number" min="0" v-model.number="beforeBars" />
        </label>
        <label class="ssf-field">
            <span class="ssf-label">Bars after</span>
            <input class="ssf-input" type="number" min="0" v-model.number="afterBars" />
        </label>
        <label class="ssf-field">
            <span class="ssf-label">Max results</span>
            <input class="ssf-input" type="number" min="1" v-model.number="maxResults" />
        </label>
    </div>

    <div v-if="error" class="ssf-error">{{ error }}</div>

    <div class="ssf-actions">
        <button type="button" class="ssf-run" @click="submit">Search</button>
    </div>
</div>
</template>

<script>
// SearchSignalsForm — define one historical indicator search. Emits a `run`
// payload (plain selections) for the parent to turn into a gateway query via
// buildSearchQuery (which derives indicators[] from the discovery descriptors).
// The form references indicators by DISPLAY LABEL; field options come from each
// indicator's discovered outputs.

const OPS = [
    { v: 'gt', label: '>' },
    { v: 'gte', label: '≥' },
    { v: 'lt', label: '<' },
    { v: 'lte', label: '≤' },
    { v: 'eq', label: '=' },
    { v: 'ne', label: '≠' },
]

export default {
    name: 'SearchSignalsForm',
    props: {
        // { venue, symbol, timeframes:[], indicators:[{ label, fields:[] }] }
        context: { type: Object, default: null },
    },
    emits: ['run'],
    data() {
        return {
            OPS,
            venue: '',
            symbol: '',
            // Once the user edits venue/symbol we stop auto-syncing them to the
            // charted symbol (so a deliberate choice sticks).
            venueDirty: false,
            symbolDirty: false,
            tfs: [],
            rangeMode: 'latest',
            latestLimit: 500,
            startStr: '',
            endStr: '',
            rows: [this.blankRow()],
            beforeBars: 200,
            afterBars: 600,
            maxResults: 100,
            error: '',
        }
    },
    computed: {
        // The per-symbol option set for the symbol currently in the form (first
        // of a comma list), matched case-insensitively against context.symbols;
        // null when that symbol has no discovered state.
        symbolOptions() {
            const list = (this.context && this.context.symbols) || []
            if (!list.length) return null
            const sym = String(this.symbol || '').split(',')[0].trim().toLowerCase()
            if (!sym) return null
            const ven = String(this.venue || '').trim().toLowerCase()
            return list.find((s) => String(s.symbol).toLowerCase() === sym &&
                (!ven || String(s.venue).toLowerCase() === ven)) || null
        },
        // Timeframes / indicators follow the SEARCHED symbol when it has its own
        // discovered descriptors; otherwise fall back to the charted defaults.
        availableTimeframes() {
            if (this.symbolOptions) return this.symbolOptions.timeframes || []
            return (this.context && this.context.timeframes) || []
        },
        indicators() {
            if (this.symbolOptions) return this.symbolOptions.indicators || []
            return (this.context && this.context.indicators) || []
        },
    },
    watch: {
        context: { handler: 'applyDefaults', immediate: true },
        // When the searched symbol changes, drop timeframes it doesn't offer.
        availableTimeframes() { this.reconcileTimeframes() },
    },
    methods: {
        blankRow() {
            return { indicator: '', field: '', op: 'gt', value: '', bar_offset: 0 }
        },
        // Keep venue/symbol synced to the charted context UNTIL the user edits
        // them (then dirty flags pin their choice). This stops the form showing a
        // stale symbol while the indicator dropdown reflects a different one.
        applyDefaults() {
            const c = this.context || {}
            if (!this.venueDirty && c.venue) this.venue = c.venue
            if (!this.symbolDirty && c.symbol) this.symbol = c.symbol
            this.reconcileTimeframes()
        },
        // Drop selected timeframes no longer offered; seed one when none remain.
        reconcileTimeframes() {
            const tfs = this.availableTimeframes
            this.tfs = this.tfs.filter((t) => tfs.includes(t))
            const c = this.context || {}
            if (!this.tfs.length && c.timeframe && tfs.includes(c.timeframe)) this.tfs = [c.timeframe]
            if (!this.tfs.length && tfs.length) this.tfs = [tfs[0]]
        },
        toggleTf(tf) {
            const i = this.tfs.indexOf(tf)
            if (i === -1) this.tfs.push(tf)
            else this.tfs.splice(i, 1)
        },
        fieldsFor(label) {
            const ind = this.indicators.find((x) => x.label === label)
            return (ind && ind.fields) || []
        },
        addRow() { this.rows.push(this.blankRow()) },
        removeRow(i) { if (this.rows.length > 1) this.rows.splice(i, 1) },
        submit() {
            this.error = ''
            const venue = this.venue
            const symbol = this.symbol
            if (!venue) { this.error = 'Venue is required.'; return }
            if (!symbol) { this.error = 'At least one symbol is required.'; return }
            if (!this.tfs.length) { this.error = 'Pick at least one timeframe.'; return }
            const conditionRows = this.rows
                .filter((r) => r.indicator && r.field && r.op && r.value !== '' && Number.isFinite(Number(r.value)))
                .map((r) => ({
                    indicator: r.indicator, field: r.field, op: r.op,
                    value: Number(r.value), bar_offset: Number(r.bar_offset) || 0,
                }))
            if (!conditionRows.length) { this.error = 'Add at least one complete condition.'; return }

            let range
            if (this.rangeMode === 'latest') {
                const limit = Math.trunc(Number(this.latestLimit))
                if (!(limit > 0)) { this.error = 'Latest bars must be a positive number.'; return }
                range = { type: 'latest', limit }
            } else {
                const start_ms = this.startStr ? new Date(this.startStr).getTime() : NaN
                const end_ms = this.endStr ? new Date(this.endStr).getTime() : NaN
                if (!Number.isFinite(start_ms) || !Number.isFinite(end_ms)) {
                    this.error = 'Pick both a start and end date.'; return
                }
                if (end_ms <= start_ms) { this.error = 'End must be after start.'; return }
                range = { type: 'start_end', start_ms, end_ms }
            }

            this.$emit('run', {
                venue,
                symbol,
                timeframes: this.tfs.slice(),
                range,
                conditionRows,
                result_window: {
                    before_bars: Math.max(0, Math.trunc(Number(this.beforeBars)) || 0),
                    after_bars: Math.max(0, Math.trunc(Number(this.afterBars)) || 0),
                },
                max_results: Math.max(1, Math.trunc(Number(this.maxResults)) || 1),
            })
        },
    },
}
</script>

<style scoped>
.ssf { padding: 12px 14px; display: flex; flex-direction: column; gap: 12px; color: #d1d4dc; }
.ssf-row { display: flex; flex-direction: column; gap: 6px; }
.ssf-grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.ssf-grid3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px; }
.ssf-field { display: flex; flex-direction: column; gap: 4px; }
.ssf-label { font-size: 11px; color: #808a9d; font-weight: 600; text-transform: uppercase; letter-spacing: 0.04em; }
.ssf-hint { font-size: 11px; color: #5c6470; text-transform: none; font-weight: 400; }
.ssf-input {
    background: #0e1320; color: #d1d4dc;
    border: 1px solid #2a2e39; border-radius: 4px;
    padding: 6px 8px; font-size: 12px;
}
.ssf-input:focus { outline: none; border-color: #35a776; }
.ssf-input:disabled { opacity: 0.45; }
.ssf-tfs { display: flex; flex-wrap: wrap; gap: 6px; }
.ssf-chip {
    background: #131722; color: #808a9d;
    border: 1px solid #2a2e39; border-radius: 12px;
    padding: 4px 12px; font-size: 12px; cursor: pointer;
    transition: all 0.12s ease;
}
.ssf-chip:hover { color: #d1d4dc; border-color: #3a3f4d; }
.ssf-chip.on { background: rgba(53,167,118,0.15); color: #35a776; border-color: #35a776; }
.ssf-range { display: flex; align-items: center; flex-wrap: wrap; gap: 12px; }
.ssf-radio { display: flex; align-items: center; gap: 6px; font-size: 12px; color: #d1d4dc; }
.ssf-num { width: 84px; }
.ssf-offset { width: 56px; }
.ssf-date { width: 190px; }
.ssf-arrow { color: #808a9d; }
.ssf-conds { display: flex; flex-direction: column; gap: 6px; }
.ssf-cond { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
.ssf-sel { flex: 1 1 130px; min-width: 110px; }
.ssf-op { width: 56px; text-align: center; }
.ssf-iconbtn {
    background: transparent; color: #808a9d; border: 1px solid #2a2e39;
    border-radius: 4px; width: 26px; height: 28px; cursor: pointer; font-size: 15px;
}
.ssf-iconbtn:hover:not(:disabled) { color: #e54150; border-color: #e54150; }
.ssf-iconbtn:disabled { opacity: 0.4; cursor: default; }
.ssf-addcond {
    align-self: flex-start;
    background: transparent; color: #35a776;
    border: 1px dashed #2a4a3c; border-radius: 4px;
    padding: 5px 10px; font-size: 12px; cursor: pointer;
}
.ssf-addcond:hover { border-color: #35a776; background: rgba(53,167,118,0.08); }
.ssf-error { color: #e54150; font-size: 12px; }
.ssf-actions { display: flex; justify-content: flex-end; }
.ssf-run {
    background: #35a776; color: #fff; border: none;
    border-radius: 4px; padding: 8px 22px; font-size: 13px; font-weight: 600; cursor: pointer;
    transition: background 0.12s ease;
}
.ssf-run:hover { background: #2e9468; }
</style>
