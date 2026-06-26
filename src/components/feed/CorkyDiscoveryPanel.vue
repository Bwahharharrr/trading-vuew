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
            {{ progressText }}
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

    <!-- Search + category filters -->
    <div v-if="venues.length || loading" class="corky-filters">
        <div class="corky-search">
            <input
                type="text"
                class="corky-search-input"
                placeholder="Search symbols…"
                aria-label="Search symbols"
                v-model="query">
            <button
                v-if="query"
                type="button"
                class="corky-search-clear"
                aria-label="Clear search"
                @click="query = ''">
                ×
            </button>
        </div>
        <div class="tf-buttons corky-cat-row" role="group" aria-label="Category filters">
            <button
                v-for="cat in categoryFilters"
                :key="cat.value"
                type="button"
                class="tf-btn corky-cat-chip"
                :class="{ active: activeCategory === cat.value }"
                :aria-pressed="activeCategory === cat.value ? 'true' : 'false'"
                @click="activeCategory = cat.value">
                {{ cat.label }}
            </button>
            <span class="corky-symbol-count">{{ symbolCount }} {{ symbolCount === 1 ? 'symbol' : 'symbols' }}</span>
        </div>
    </div>

    <!-- Empty state -->
    <div v-if="!venues.length && !loading" class="corky-empty">
        No feeds discovered.
    </div>
    <div v-else-if="!filteredVenues.length && !loading" class="corky-empty">
        No symbols match your filters.
    </div>

    <!-- Venue → Symbol → Timeframe → Indicator tree.
         Two-level collapse: the venue header toggles its ticker list; each ticker
         header toggles its own timeframes + indicators. Default: venues expanded,
         tickers collapsed (a clean exchange → ticker list). -->
    <div class="corky-tree">
        <div v-for="group in filteredVenues" :key="group.venue" class="corky-venue">
            <!-- Exchange (venue) collapse toggle -->
            <button
                type="button"
                class="corky-venue-toggle"
                :aria-expanded="isVenueExpanded(group.venue) ? 'true' : 'false'"
                :title="isVenueExpanded(group.venue) ? 'Collapse exchange' : 'Expand exchange'"
                @click="toggleVenue(group.venue)">
                <span class="corky-chevron" :class="{ expanded: isVenueExpanded(group.venue) }">▼</span>
                <span class="corky-venue-name">{{ group.venue }}</span>
            </button>

            <div v-show="isVenueExpanded(group.venue)" class="corky-symbols-list">
                <div
                    v-for="row in group.symbols"
                    :key="row.key"
                    class="corky-symbol">
                    <!-- Ticker collapse toggle: reveals its timeframes + indicators -->
                    <button
                        type="button"
                        class="corky-symbol-toggle"
                        :aria-expanded="isSymbolExpanded(row.key) ? 'true' : 'false'"
                        :title="isSymbolExpanded(row.key) ? 'Collapse ticker' : 'Expand ticker'"
                        @click="toggleSymbol(row.key)">
                        <span class="corky-chevron" :class="{ expanded: isSymbolExpanded(row.key) }">▼</span>
                        <span class="corky-symbol-title">
                            <span class="corky-symbol-name">{{ row.symbol }}</span>
                            <span
                                v-for="cat in row.categories"
                                :key="cat"
                                class="corky-cat-badge"
                                :class="'corky-cat-badge-' + cat">
                                {{ categoryLabel(cat) }}
                            </span>
                        </span>
                    </button>

                    <div v-show="isSymbolExpanded(row.key)" class="corky-symbol-details">
                        <!-- Timeframe chips + add-timeframe picker -->
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
                                :title="'Load ' + row.symbol + ' ' + tf.timeframe + ' — ⌘/Ctrl/middle-click opens a new tab'"
                                @click="onSelectTimeframe(row, tf.timeframe, $event)"
                                @mousedown.middle.prevent="onSelectTimeframe(row, tf.timeframe, $event)">
                                <span class="corky-tf-label">{{ tf.timeframe }}</span>
                                <span
                                    class="corky-badge"
                                    :class="badgeClass(tf)">
                                    {{ badgeText(tf) }}
                                </span>
                            </button>
                            <!-- Add a timeframe: inline picker of standard TFs not
                                 already present for this symbol. -->
                            <div class="corky-tf-add-wrapper">
                                <button
                                    type="button"
                                    class="tf-btn corky-tf-add"
                                    :title="addingFor === row.key ? 'Close' : 'Add a timeframe'"
                                    :aria-expanded="addingFor === row.key ? 'true' : 'false'"
                                    @click="toggleAddPicker(row)">
                                    +
                                </button>
                                <div v-if="addingFor === row.key" class="corky-tf-picker">
                                    <div v-if="availableTimeframes(row).length === 0" class="corky-tf-picker-empty">
                                        All timeframes added
                                    </div>
                                    <div v-else class="corky-tf-picker-list">
                                        <button
                                            v-for="tf in availableTimeframes(row)"
                                            :key="tf"
                                            type="button"
                                            class="tf-btn corky-tf-picker-chip"
                                            :title="'Add ' + tf"
                                            @click="onAddTimeframe(row, tf)">
                                            {{ tf }}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Indicators for the SELECTED timeframe (none until a tf
                             is chosen for this symbol). -->
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
                                    v-if="ind.timeframe"
                                    class="corky-badge corky-ind-tf badge-tf">
                                    {{ ind.timeframe }}
                                </span>
                                <span
                                    class="corky-badge"
                                    :class="ind.ready ? 'badge-ready' : 'badge-warmup'">
                                    {{ ind.ready ? 'ready' : 'warmup' }}
                                </span>
                                <!-- Per-layer sub-toggles (view.layers): turn on
                                     hidden layers like TL1/TL2/diagnostics. -->
                                <div
                                    v-if="isIndicatorOn(row, ind) && toggleableLayers(ind).length"
                                    class="corky-layers">
                                    <button
                                        v-for="layer in toggleableLayers(ind)"
                                        :key="layer.id"
                                        type="button"
                                        class="visibility-toggle corky-layer-toggle"
                                        :class="{ on: isLayerOn(row, ind, layer) }"
                                        @click="onToggleLayer(row, ind, layer)">
                                        {{ isLayerOn(row, ind, layer) ? '●' : '○' }}
                                        {{ layer.label || layer.id }}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>
</template>

<script>
import { symbolCategories, SYMBOL_CATEGORIES } from '../../helpers/feed/symbol-meta.js'

// Short, human display labels for each derived category.
const CATEGORY_LABELS = {
    exchange: 'Exch',
    margin: 'Margin',
    derivative: 'Deriv',
    funding: 'Fund',
}

export default {
    name: 'CorkyDiscoveryPanel',
    props: {
        states: { type: Array, default: () => [] },
        current: { type: Object, default: null },
        loading: { type: Boolean, default: false },
        progress: { type: Object, default: null },
        error: { type: Object, default: null },
    },
    emits: ['select', 'add-timeframe', 'toggle-indicator', 'toggle-layer', 'retry'],
    data() {
        return {
            // Local UI state — presentational only, never emitted.
            query: '',
            activeCategory: 'all',
            // Two-level collapse state. Venues are EXPANDED by default (a name
            // present in collapsedVenues == collapsed); tickers are COLLAPSED by
            // default (a key present in expandedSymbols == expanded). Vue 3 makes
            // these Sets reactive (collection handlers track has/add/delete).
            collapsedVenues: new Set(),
            expandedSymbols: new Set(),
            // row.key of the symbol whose add-timeframe picker is open, or null.
            addingFor: null,
        }
    },
    computed: {
        // The category filter chips: 'All' + one per derived category.
        categoryFilters() {
            return [
                { value: 'all', label: 'All' },
                ...SYMBOL_CATEGORIES.map((c) => ({ value: c, label: this.categoryLabel(c) })),
            ]
        },
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
                    categories: symbolCategories(st.symbol),
                    timeframes: this.timeframesFor(st),
                })
            }
            return Array.from(byVenue, ([venue, symbols]) => ({ venue, symbols }))
        },
        // venues[] narrowed by the search query AND the active category filter.
        // Venues with no surviving symbols are dropped entirely.
        filteredVenues() {
            const q = this.query.trim().toLowerCase()
            const cat = this.activeCategory
            const out = []
            for (const group of this.venues) {
                const symbols = group.symbols.filter((row) => {
                    if (cat !== 'all' && !row.categories.includes(cat)) return false
                    if (q) {
                        const hay = `${row.venue} ${row.symbol}`.toLowerCase()
                        if (!hay.includes(q)) return false
                    }
                    return true
                })
                if (symbols.length) out.push({ venue: group.venue, symbols })
            }
            return out
        },
        // Live count of symbols visible after filtering.
        symbolCount() {
            return this.filteredVenues.reduce((n, g) => n + g.symbols.length, 0)
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
        // Human-friendly status for the loading bar. The gateway never sends a
        // total (only a per-chunk index), so we surface the PHASE + what is being
        // loaded instead of a meaningless count.
        progressLabel() {
            const p = this.progress
            if (!p) return 'Loading…'
            switch (p.phase) {
                case 'accepted': return 'Connecting…'
                case 'history': return `Loading history (chunk ${p.chunk_index || 0})`
                case 'history-complete': return 'Finalising…'
                case 'live': return 'Live'
                case 'retrying': return p.message || 'Reconnecting…'
                default: return 'Loading…'
            }
        },
        // The symbol + timeframe currently being loaded (from the `current` prop).
        progressStatusText() {
            const cur = this.current
            if (!cur) return ''
            return [cur.symbol, cur.timeframe].filter(Boolean).join(' ')
        },
        progressText() {
            const status = this.progressStatusText
            return status ? `${this.progressLabel} — ${status}` : this.progressLabel
        },
        // Canonical timeframe universe offered by the add-timeframe picker, in
        // the gateway's format (minutes lowercase, hour+ uppercase — e.g. '1D').
        standardTimeframes() {
            return ['1m', '5m', '15m', '30m', '1H', '2H', '4H', '6H', '12H', '1D', '1W', '1M']
        },
        errorMessage() {
            return (this.error && this.error.message) || 'Something went wrong.'
        },
    },
    methods: {
        // Short display label for a derived category (e.g. 'exchange' → 'Exch').
        categoryLabel(cat) {
            return CATEGORY_LABELS[cat] || cat
        },
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
        // The SELECTED timeframe for a row, or null when the user hasn't selected
        // one. No fallback to the first available timeframe — indicators (which
        // key off this) must stay hidden until a timeframe is explicitly chosen.
        activeTimeframe(row) {
            if (this.isSymbolActive(row) && this.current.timeframe) {
                return this.current.timeframe
            }
            return null
        },
        // Indicators[] of a row's state filtered to the active timeframe, with
        // DUPLICATES removed. The runtime can publish the same indicator
        // descriptor more than once (e.g. SCMR twice), which would otherwise
        // produce duplicate v-for keys ("Duplicate keys found …" Vue warning).
        // Dedupe by full identity so genuinely distinct descriptors are kept
        // while exact repeats collapse.
        indicatorsFor(row) {
            const tf = this.activeTimeframe(row)
            // No timeframe selected ⇒ show no indicators for this symbol.
            if (!tf) return []
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
        // View layers the user can toggle (exclude candle_color — always on with
        // the candles, no overlay). Empty when there's no view.
        toggleableLayers(ind) {
            const ls = (ind.view && Array.isArray(ind.view.layers)) ? ind.view.layers : []
            return ls.filter(l => l && l.kind !== 'candle_color')
        },
        // A layer is "on" when its id is in current.layers (mirrors the feed
        // handle's enabledLayers, set on indicator-enable for visible layers).
        isLayerOn(row, ind, layer) {
            if (!this.isIndicatorOn(row, ind)) return false
            const chosen = this.current && this.current.layers
            if (!Array.isArray(chosen)) return false
            // enabled layers are tracked instance-scoped ('SCMR(INV)#trade_lines');
            // tolerate the legacy bare layer-id form from older persisted state.
            return chosen.includes(`${ind.display_label}#${layer.id}`) ||
                chosen.includes(layer.id)
        },
        onToggleLayer(row, ind, layer) {
            this.$emit('toggle-layer', {
                venue: row.venue,
                symbol: row.symbol,
                timeframe: this.activeTimeframe(row),
                kind: ind.kind,
                display_label: ind.display_label,
                layerId: layer.id,
                enabled: !this.isLayerOn(row, ind, layer),
            })
        },
        badgeText(tf) {
            if (!tf.ready) return 'pending'
            return tf.stale ? 'stale' : 'ready'
        },
        badgeClass(tf) {
            if (!tf.ready) return 'badge-pending'
            return tf.stale ? 'badge-stale' : 'badge-ready'
        },
        onSelectTimeframe(row, tf, ev) {
            // Load CANDLES ONLY by default — every indicator series ships in the
            // rows, so the user toggles each on client-side afterwards (no
            // re-subscribe). `indicators: []` ⇒ candles-only.
            // ⌘/Ctrl-click (or middle-click) opens the load in a NEW chart tab;
            // a plain click loads into the active tab.
            const newTab = !!(ev && (ev.metaKey || ev.ctrlKey || ev.button === 1))
            this.$emit('select', {
                venue: row.venue,
                symbol: row.symbol,
                timeframe: tf,
                indicators: [],
                newTab,
            })
        },
        // ── Two-level collapse ────────────────────────────────────────────
        isVenueExpanded(venue) {
            return !this.collapsedVenues.has(venue)
        },
        toggleVenue(venue) {
            if (this.collapsedVenues.has(venue)) this.collapsedVenues.delete(venue)
            else this.collapsedVenues.add(venue)
        },
        isSymbolExpanded(key) {
            return this.expandedSymbols.has(key)
        },
        toggleSymbol(key) {
            if (this.expandedSymbols.has(key)) this.expandedSymbols.delete(key)
            else this.expandedSymbols.add(key)
        },

        // ── Add-timeframe inline picker ───────────────────────────────────
        // Standard timeframes NOT already present for this symbol (case-
        // insensitive so a gateway '1D' isn't re-offered as '1d').
        availableTimeframes(row) {
            const present = new Set(
                (row.timeframes || []).map((tf) => tf.timeframe.toLowerCase()))
            return this.standardTimeframes.filter(
                (tf) => !present.has(tf.toLowerCase()))
        },
        toggleAddPicker(row) {
            this.addingFor = this.addingFor === row.key ? null : row.key
        },
        // Emit a NEW timeframe (the picked one) — not an existing one — and close
        // the picker. App.onCorkyAddTimeframe patches the candle-state on the
        // gateway, re-discovers, then selects the new tf so it streams.
        onAddTimeframe(row, timeframe) {
            this.$emit('add-timeframe', {
                venue: row.venue,
                symbol: row.symbol,
                timeframe,
            })
            this.addingFor = null
        },
        // Close the picker if its symbol is no longer visible (e.g. filtered out).
        closePickerIfNeeded() {
            if (!this.addingFor) return
            const stillVisible = this.filteredVenues
                .some((g) => g.symbols.some((row) => row.key === this.addingFor))
            if (!stillVisible) this.addingFor = null
        },
        onToggleIndicator(row, ind) {
            // Client-side show/hide of an already-loaded indicator (no
            // re-subscribe). `kind` identifies the overlay set in the feed;
            // `enabled` is the NEXT state (the opposite of the current one).
            this.$emit('toggle-indicator', {
                venue: row.venue,
                symbol: row.symbol,
                timeframe: this.activeTimeframe(row),
                kind: ind.kind,
                display_label: ind.display_label,
                enabled: !this.isIndicatorOn(row, ind),
            })
        },
    },
    watch: {
        // Drop an open add-timeframe picker when its symbol scrolls out of the
        // filtered view (search/category change).
        filteredVenues() {
            this.closePickerIfNeeded()
        },
        // Auto-expand the ACTIVE symbol's row (e.g. when a reload restores the
        // last-viewed stream) so its timeframes + indicators are immediately
        // visible without an extra click. Never collapses anything.
        current: {
            immediate: true,
            handler(cur) {
                if (cur && cur.venue && cur.symbol) {
                    this.expandedSymbols.add(`${cur.venue}::${cur.symbol}`)
                }
            },
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

/* Search + category filters */
.corky-filters {
    margin-bottom: 12px;
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.corky-search {
    position: relative;
    display: flex;
    align-items: center;
}

.corky-search-input {
    width: 100%;
    box-sizing: border-box;
    background: #131722;
    color: #d1d4dc;
    border: 1px solid #2a2e39;
    border-radius: 4px;
    padding: 6px 26px 6px 10px;
    font-size: 12px;
    outline: none;
    transition: border-color 0.15s ease;
}

.corky-search-input::placeholder {
    color: #5d6470;
}

.corky-search-input:focus {
    border-color: #35a776;
}

.corky-search-clear {
    position: absolute;
    right: 4px;
    top: 50%;
    transform: translateY(-50%);
    background: transparent;
    color: #808a9d;
    border: none;
    font-size: 16px;
    line-height: 1;
    cursor: pointer;
    padding: 2px 6px;
}

.corky-search-clear:hover {
    color: #d1d4dc;
}

.corky-cat-row {
    align-items: center;
    flex-wrap: wrap;
    gap: 4px;
}

.corky-cat-chip.active {
    border-color: #35a776;
    color: #35a776;
}

.corky-symbol-count {
    color: #808a9d;
    font-size: 10px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin-left: auto;
}

/* Tree */
.corky-tree {
    display: flex;
    flex-direction: column;
    gap: 12px;
}

/* Exchange (venue) collapse toggle */
.corky-venue-toggle {
    display: flex;
    align-items: center;
    gap: 6px;
    width: 100%;
    background: transparent;
    border: none;
    padding: 4px 0;
    margin-bottom: 6px;
    color: #808a9d;
    font-size: 10px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    text-align: left;
    cursor: pointer;
    transition: color 0.15s ease;
}

.corky-venue-toggle:hover {
    color: #d1d4dc;
}

.corky-venue-name {
    flex: 1;
}

/* Chevron: points down when expanded, left (rotated) when collapsed */
.corky-chevron {
    display: inline-block;
    width: 12px;
    font-size: 9px;
    line-height: 1;
    transition: transform 0.18s ease;
    transform: rotate(-90deg);
    flex-shrink: 0;
}

.corky-chevron.expanded {
    transform: rotate(0deg);
}

/* Ticker list (shown/hidden by the venue toggle) */
.corky-symbols-list {
    display: flex;
    flex-direction: column;
    gap: 4px;
}

.corky-symbol {
    margin-bottom: 2px;
}

.corky-symbol:last-child {
    margin-bottom: 0;
}

/* Ticker collapse toggle (replaces the old plain symbol title div) */
.corky-symbol-toggle {
    display: flex;
    align-items: center;
    gap: 6px;
    width: 100%;
    background: transparent;
    border: none;
    padding: 2px 0;
    color: #d1d4dc;
    font-size: 12px;
    font-weight: 600;
    text-align: left;
    cursor: pointer;
    transition: color 0.15s ease;
}

.corky-symbol-toggle:hover {
    color: #35a776;
}

.corky-symbol-title {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 5px;
}

/* Ticker details (timeframes + indicators), shown/hidden by the ticker toggle */
.corky-symbol-details {
    display: flex;
    flex-direction: column;
    gap: 8px;
    margin: 4px 0 8px 6px;
    padding-left: 10px;
    border-left: 1px solid #2a2e39;
    animation: corky-slide-down 0.18s ease;
}

@keyframes corky-slide-down {
    from { opacity: 0; transform: translateY(-3px); }
    to { opacity: 1; transform: translateY(0); }
}

.corky-symbol-name {
    margin-right: 2px;
}

/* Derived category badges (from symbol naming, not the protocol) */
.corky-cat-badge {
    font-size: 9px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.3px;
    padding: 1px 5px;
    border-radius: 8px;
    line-height: 1.4;
}

.corky-cat-badge-exchange {
    background: rgba(78, 138, 229, 0.18);
    color: #6ba2f0;
}

.corky-cat-badge-margin {
    background: rgba(159, 122, 234, 0.18);
    color: #b08ef0;
}

.corky-cat-badge-derivative {
    background: rgba(229, 165, 75, 0.18);
    color: #e5a54b;
}

.corky-cat-badge-funding {
    background: rgba(53, 167, 118, 0.18);
    color: #35a776;
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

/* Add-timeframe inline picker */
.corky-tf-add-wrapper {
    position: relative;
    display: inline-flex;
    align-items: center;
}

.corky-tf-picker {
    position: absolute;
    top: 100%;
    left: 0;
    margin-top: 4px;
    z-index: 20;
    min-width: 200px;
    padding: 6px;
    background: #1a1e2a;
    border: 1px solid #2a2e39;
    border-radius: 4px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
}

.corky-tf-picker-list {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
}

.corky-tf-picker-chip {
    font-size: 11px;
    padding: 4px 8px;
}

.corky-tf-picker-chip:hover {
    border-color: #35a776;
    color: #35a776;
}

.corky-tf-picker-empty {
    color: #808a9d;
    font-size: 10px;
    padding: 2px 4px;
    text-transform: uppercase;
    letter-spacing: 0.3px;
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

.badge-tf {
    background: rgba(78, 138, 229, 0.18);
    color: #6ba2f0;
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
    /* allow the full-width per-layer sub-toggles to wrap BELOW the row
       (.indicator-item is a non-wrapping flex row by default) */
    flex-wrap: wrap;
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

/* Per-layer sub-toggles (hidden view layers like TL/TH/diagnostics). */
.corky-layers {
    flex-basis: 100%;
    display: flex;
    flex-wrap: wrap;
    gap: 4px 10px;
    padding: 4px 0 2px 24px;
}
.corky-layer-toggle {
    color: #808a9d;
    font-size: 11px;
    width: auto;
    padding: 0 2px;
    white-space: nowrap;
}
.corky-layer-toggle.on {
    color: #35a776;
}

.corky-ind-label {
    flex: 1;
}
</style>
