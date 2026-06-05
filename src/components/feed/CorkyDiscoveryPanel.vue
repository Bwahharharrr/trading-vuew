<template>
<div class="panel-section corky-discovery" role="region" aria-label="Chart feed discovery">
    <div class="section-title">Discovery</div>

    <!-- Loading / progress bar -->
    <div v-if="loading" class="corky-progress" role="status" aria-live="polite">
        <div class="corky-progress-track">
            <div
                class="corky-progress-fill"
                :class="{ indeterminate: !hasProgress }"
                :style="hasProgress ? { width: progressPct + '%' } : null">
            </div>
        </div>
        <span class="corky-progress-label">
            <template v-if="hasProgress">{{ progressText }}</template>
            <template v-else>Loading…</template>
        </span>
    </div>

    <!-- Error banner -->
    <div v-if="error" class="corky-error" role="alert">
        <span class="corky-error-msg">{{ errorMessage }}</span>
        <button
            v-if="error.retryable"
            type="button"
            class="corky-retry-btn"
            @click="$emit('retry')">
            Retry
        </button>
    </div>

    <!-- Empty state -->
    <div v-if="!venues.length && !loading" class="corky-empty">
        No feeds discovered.
    </div>

    <!-- Venue → Symbol → Timeframe → Indicator tree -->
    <div class="corky-tree">
        <div v-for="group in venues" :key="group.venue" class="corky-venue">
            <div class="corky-venue-title">{{ group.venue }}</div>

            <div
                v-for="row in group.symbols"
                :key="row.key"
                class="corky-symbol">
                <div class="corky-symbol-title">{{ row.symbol }}</div>

                <!-- Timeframe chips -->
                <div class="tf-buttons corky-tf-row">
                    <button
                        v-for="tf in row.timeframes"
                        :key="tf.timeframe"
                        type="button"
                        class="tf-btn corky-tf-chip"
                        :class="{
                            active: isCurrent(row, tf.timeframe),
                            ready: tf.ready,
                            stale: tf.stale,
                            'not-ready': !tf.ready
                        }"
                        :aria-pressed="isCurrent(row, tf.timeframe) ? 'true' : 'false'"
                        @click="onSelectTimeframe(row, tf.timeframe)">
                        <span class="corky-tf-label">{{ tf.timeframe }}</span>
                        <span
                            class="corky-badge"
                            :class="badgeClass(tf)">
                            {{ badgeText(tf) }}
                        </span>
                    </button>
                    <button
                        type="button"
                        class="tf-btn corky-tf-add"
                        title="Add a timeframe"
                        @click="onAddTimeframe(row)">
                        +
                    </button>
                </div>

                <!-- Indicators for the active timeframe -->
                <div
                    v-if="indicatorsFor(row).length"
                    class="corky-indicators"
                    :class="{ active: isSymbolActive(row) }">
                    <div
                        v-for="ind in indicatorsFor(row)"
                        :key="ind.key"
                        class="indicator-item corky-indicator-row">
                        <button
                            type="button"
                            class="visibility-toggle corky-ind-toggle"
                            :class="{ on: isIndicatorOn(row, ind) }"
                            :aria-pressed="isIndicatorOn(row, ind) ? 'true' : 'false'"
                            @click="onToggleIndicator(row, ind)">
                            {{ isIndicatorOn(row, ind) ? '●' : '○' }}
                        </button>
                        <span class="indicator-name corky-ind-label">
                            {{ ind.display_label }}
                        </span>
                        <span
                            class="corky-badge"
                            :class="ind.ready ? 'badge-ready' : 'badge-warmup'">
                            {{ ind.ready ? 'ready' : 'warmup' }}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>
</template>

<script>
export default {
    name: 'CorkyDiscoveryPanel',
    props: {
        states: { type: Array, default: () => [] },
        current: { type: Object, default: null },
        loading: { type: Boolean, default: false },
        progress: { type: Object, default: null },
        error: { type: Object, default: null },
    },
    emits: ['select', 'add-timeframe', 'add-indicator', 'retry'],
    computed: {
        // Group the flat State[] by venue → symbol, each carrying the source
        // state so we can derive tf readiness + indicators on demand.
        venues() {
            const byVenue = new Map()
            for (const st of this.states || []) {
                if (!st) continue
                const venue = st.venue || '—'
                if (!byVenue.has(venue)) byVenue.set(venue, [])
                byVenue.get(venue).push({
                    key: `${venue}::${st.symbol}`,
                    venue,
                    symbol: st.symbol,
                    state: st,
                    timeframes: this.timeframesFor(st),
                })
            }
            return Array.from(byVenue, ([venue, symbols]) => ({ venue, symbols }))
        },
        hasProgress() {
            const p = this.progress
            return !!(p && Number.isFinite(p.total) && p.total > 0 &&
                      Number.isFinite(p.current))
        },
        progressPct() {
            if (!this.hasProgress) return 0
            const { current, total } = this.progress
            return Math.max(0, Math.min(100, Math.round((current / total) * 100)))
        },
        progressText() {
            const p = this.progress
            const phase = p && p.phase ? `${p.phase} ` : ''
            return `${phase}${p.current}/${p.total}`
        },
        errorMessage() {
            return (this.error && this.error.message) || 'Something went wrong.'
        },
    },
    methods: {
        // The available timeframes for a state, decorated with the ready/stale
        // flags from that state's matching ranges[] entry.
        timeframesFor(st) {
            const ranges = st.ranges || []
            return (st.available_timeframes || []).map((tf) => {
                const r = ranges.find((x) => x.timeframe === tf) || {}
                return {
                    timeframe: tf,
                    ready: !!r.ready,
                    stale: !!r.stale,
                }
            })
        },
        // Which timeframe is "expanded"/selected for a row: the current
        // selection if it matches this row, else the first available one.
        activeTimeframe(row) {
            if (this.isSymbolActive(row) && this.current.timeframe) {
                return this.current.timeframe
            }
            const first = row.timeframes[0]
            return first ? first.timeframe : null
        },
        // Indicators[] of a row's state filtered to the active timeframe, with
        // DUPLICATES removed. The runtime can publish the same indicator
        // descriptor more than once (e.g. SCMR twice), which would otherwise
        // produce duplicate v-for keys ("Duplicate keys found …" Vue warning).
        // Dedupe by full identity so genuinely distinct descriptors are kept
        // while exact repeats collapse.
        indicatorsFor(row) {
            const tf = this.activeTimeframe(row)
            const inds = (row.state.indicators || [])
            const seen = new Set()
            const out = []
            for (const ind of inds) {
                if (ind.timeframe && ind.timeframe !== tf) continue
                const key =
                    `${ind.kind}:${ind.display_label}:${ind.timeframe || ''}:` +
                    `${ind.source || ''}:${(ind.outputs || []).join(',')}`
                if (seen.has(key)) continue
                seen.add(key)
                out.push({ key, ...ind })
            }
            return out
        },
        // Default indicator display set for a (row, tf): all available labels.
        defaultIndicators(row, tf) {
            return (row.state.indicators || [])
                .filter((ind) => !ind.timeframe || ind.timeframe === tf)
                .map((ind) => ind.display_label)
        },
        isSymbolActive(row) {
            return !!(this.current &&
                this.current.venue === row.venue &&
                this.current.symbol === row.symbol)
        },
        isCurrent(row, tf) {
            return this.isSymbolActive(row) && this.current.timeframe === tf
        },
        isIndicatorOn(row, ind) {
            if (!this.isSymbolActive(row)) return false
            const chosen = this.current.indicators
            if (!Array.isArray(chosen)) return true
            return chosen.includes(ind.display_label)
        },
        badgeText(tf) {
            if (!tf.ready) return 'pending'
            return tf.stale ? 'stale' : 'ready'
        },
        badgeClass(tf) {
            if (!tf.ready) return 'badge-pending'
            return tf.stale ? 'badge-stale' : 'badge-ready'
        },
        onSelectTimeframe(row, tf) {
            this.$emit('select', {
                venue: row.venue,
                symbol: row.symbol,
                timeframe: tf,
                indicators: this.defaultIndicators(row, tf),
            })
        },
        onAddTimeframe(row) {
            this.$emit('add-timeframe', {
                venue: row.venue,
                symbol: row.symbol,
                timeframe: this.activeTimeframe(row),
            })
        },
        onToggleIndicator(row, ind) {
            this.$emit('add-indicator', {
                venue: row.venue,
                symbol: row.symbol,
                timeframe: this.activeTimeframe(row),
                indicator: ind.display_label,
            })
        },
    },
}
</script>

<style scoped>
.corky-discovery {
    font-family: -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Oxygen, Ubuntu, sans-serif;
}

/* Progress bar */
.corky-progress {
    margin-bottom: 10px;
}

.corky-progress-track {
    height: 4px;
    background: #131722;
    border: 1px solid #2a2e39;
    border-radius: 3px;
    overflow: hidden;
}

.corky-progress-fill {
    height: 100%;
    background: #35a776;
    transition: width 0.2s ease;
}

.corky-progress-fill.indeterminate {
    width: 40%;
    animation: corky-indeterminate 1.1s ease-in-out infinite;
}

@keyframes corky-indeterminate {
    0% { margin-left: -40%; }
    100% { margin-left: 100%; }
}

.corky-progress-label {
    display: block;
    margin-top: 4px;
    color: #808a9d;
    font-size: 10px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
}

/* Error banner */
.corky-error {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    padding: 8px 10px;
    margin-bottom: 10px;
    background: rgba(229, 75, 75, 0.12);
    border: 1px solid #e54b4b;
    border-radius: 4px;
}

.corky-error-msg {
    color: #f0a3a3;
    font-size: 11px;
}

.corky-retry-btn {
    background: #131722;
    color: #e54b4b;
    border: 1px solid #e54b4b;
    border-radius: 4px;
    padding: 4px 10px;
    font-size: 11px;
    cursor: pointer;
    transition: all 0.15s ease;
    flex-shrink: 0;
}

.corky-retry-btn:hover {
    background: rgba(229, 75, 75, 0.2);
}

.corky-empty {
    color: #808a9d;
    font-size: 11px;
    padding: 4px 0;
}

/* Tree */
.corky-tree {
    display: flex;
    flex-direction: column;
    gap: 12px;
}

.corky-venue-title {
    color: #808a9d;
    font-size: 10px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin-bottom: 6px;
}

.corky-symbol {
    margin-bottom: 10px;
}

.corky-symbol:last-child {
    margin-bottom: 0;
}

.corky-symbol-title {
    color: #d1d4dc;
    font-size: 12px;
    font-weight: 600;
    margin-bottom: 6px;
}

.corky-tf-row {
    align-items: center;
}

.corky-tf-chip {
    display: inline-flex;
    align-items: center;
    gap: 6px;
}

.corky-tf-chip.not-ready {
    opacity: 0.7;
}

.corky-tf-add {
    padding: 6px 9px;
    font-weight: 700;
    line-height: 1;
}

/* Badges */
.corky-badge {
    font-size: 9px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.3px;
    padding: 1px 5px;
    border-radius: 8px;
    line-height: 1.4;
}

.badge-ready {
    background: rgba(53, 167, 118, 0.2);
    color: #35a776;
}

.badge-stale {
    background: rgba(229, 165, 75, 0.2);
    color: #e5a54b;
}

.badge-pending,
.badge-warmup {
    background: rgba(128, 138, 157, 0.2);
    color: #808a9d;
}

/* Indicators */
.corky-indicators {
    margin-top: 8px;
    padding-left: 8px;
    border-left: 2px solid #2a2e39;
    display: flex;
    flex-direction: column;
    gap: 4px;
}

.corky-indicators.active {
    border-left-color: #35a776;
}

.corky-indicator-row {
    justify-content: flex-start;
}

.corky-ind-toggle {
    color: #808a9d;
    font-size: 12px;
    width: 18px;
    height: 18px;
}

.corky-ind-toggle.on {
    color: #35a776;
}

.corky-ind-label {
    flex: 1;
}
</style>
