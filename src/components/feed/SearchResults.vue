<template>
<div class="sr">
    <div class="sr-head">
        <span class="sr-status" :class="tab.status">{{ statusLabel }}</span>
        <span v-if="tab.progress && tab.progress.message" class="sr-progress">{{ tab.progress.message }}</span>
        <span class="sr-spacer"></span>
        <span class="sr-count">{{ tab.matches.length }} match{{ tab.matches.length === 1 ? '' : 'es' }}</span>
        <button v-if="tab.running" type="button" class="sr-stop" @click="$emit('cancel')">Stop</button>
    </div>

    <div v-if="tab.error" class="sr-error">
        {{ errorText }} <span class="sr-error-note">— partial results below are preserved.</span>
    </div>

    <div v-if="!tab.matches.length" class="sr-empty">
        <template v-if="tab.running">Searching…</template>
        <template v-else-if="tab.status === 'complete'">No matches.</template>
        <template v-else-if="tab.status === 'cancelled'">Cancelled — no matches.</template>
        <template v-else-if="tab.status === 'failed'">Search failed.</template>
        <template v-else>Starting…</template>
    </div>

    <table v-else class="sr-table">
        <thead>
            <tr>
                <th>Ticker</th><th>Signal</th><th>Detection boxes</th>
                <th class="num">Close</th><th>Date</th>
            </tr>
        </thead>
        <tbody>
            <template v-for="(m, i) in tab.matches" :key="i">
                <tr class="sr-row" :class="{ active: isActive(i) }"
                    tabindex="0" role="button"
                    :title="`Open ${m.ticker} ${m.timeframe} at ${fmtDate(m.timestamp_ms)}`"
                    @click="$emit('select', { row: m, index: i })"
                    @keydown.enter.prevent="$emit('select', { row: m, index: i })">
                    <td class="sym">{{ m.ticker }}</td>
                    <td><span class="sr-side" :class="sideClass(m.side)">{{ m.signal }}</span></td>
                    <td class="sr-boxes">{{ m.boxesText || '—' }}</td>
                    <td class="num">{{ m.close == null ? '—' : m.close }}</td>
                    <td class="time">{{ fmtDate(m.timestamp_ms) }}</td>
                </tr>
                <tr v-if="isActive(i) && activeNav.loading" class="sr-status-row">
                    <td colspan="5"><span class="sr-spinner"></span>{{ activeNav.message || 'Loading onto chart…' }}</td>
                </tr>
                <tr v-else-if="isActive(i) && activeNav.error" class="sr-status-row is-error">
                    <td colspan="5">⚠ {{ activeNav.message || 'Failed to load on chart' }}</td>
                </tr>
            </template>
        </tbody>
    </table>
</div>
</template>

<script>
// SearchResults — render one search tab's streamed matches. Read-only over the
// tab state owned by the parent (status / progress / matches[] / error). Row
// click emits `select` (the projected match row, carrying chart_window) for the
// parent to navigate the chart; `cancel` stops a running search (keeps partials).

export default {
    name: 'SearchResults',
    props: {
        // { n, title, status, running, progress, matches:[], error, summary, query }
        tab: { type: Object, required: true },
        // Active/loading result across all tabs: { tabId, index, loading, message,
        // error, … }. Only applies to THIS tab when nav.tabId === tab.id.
        nav: { type: Object, default: null },
    },
    emits: ['select', 'cancel'],
    computed: {
        // The nav state iff it points at a row in THIS results tab.
        activeNav() {
            const n = this.nav
            return (n && n.tabId === this.tab.id) ? n : null
        },
        statusLabel() {
            switch (this.tab.status) {
                case 'pending': return 'Starting…'
                case 'running': return 'Running'
                case 'complete': return 'Complete'
                case 'cancelling': return 'Cancelling…'
                case 'cancelled': return 'Cancelled'
                case 'failed': return 'Failed'
                default: return this.tab.status || ''
            }
        },
        errorText() {
            const e = this.tab.error
            if (!e) return ''
            if (typeof e === 'string') return e
            return e.message || e.code || 'Search error'
        },
    },
    methods: {
        isActive(i) { return !!this.activeNav && this.activeNav.index === i },
        sideClass(side) {
            const s = String(side || '').toLowerCase()
            if (s === 'bull' || s === 'long') return 'bull'
            if (s === 'bear' || s === 'short') return 'bear'
            return ''
        },
        fmtDate(ms) {
            if (!(ms > 0)) return '—'
            const d = new Date(ms)
            if (Number.isNaN(d.getTime())) return '—'
            const pad = (n) => String(n).padStart(2, '0')
            return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
        },
    },
}
</script>

<style scoped>
.sr { display: flex; flex-direction: column; }
.sr-head {
    display: flex; align-items: center; gap: 10px;
    padding: 8px 12px; border-bottom: 1px solid #1c212e;
    position: sticky; top: 0; background: #121827; z-index: 1;
}
.sr-spacer { flex: 1 1 auto; }
.sr-status {
    font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.04em;
    padding: 2px 8px; border-radius: 10px; background: #2a2e39; color: #d1d4dc;
}
.sr-status.running, .sr-status.pending, .sr-status.cancelling { background: rgba(53,167,118,0.18); color: #35a776; }
.sr-status.complete { background: rgba(53,167,118,0.18); color: #35a776; }
.sr-status.cancelled { background: #2a2e39; color: #808a9d; }
.sr-status.failed { background: rgba(229,65,80,0.18); color: #e54150; }
.sr-progress { font-size: 11px; color: #808a9d; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.sr-count { font-size: 11px; color: #808a9d; }
.sr-stop {
    background: transparent; color: #e54150; border: 1px solid #5a2a2e;
    border-radius: 4px; padding: 3px 10px; font-size: 11px; cursor: pointer;
}
.sr-stop:hover { border-color: #e54150; background: rgba(229,65,80,0.08); }
.sr-error { padding: 8px 12px; color: #e54150; font-size: 12px; }
.sr-error-note { color: #808a9d; }
.sr-empty { padding: 24px; text-align: center; color: #808a9d; font-size: 12px; }

.sr-table { width: 100%; border-collapse: collapse; }
.sr-table th {
    position: sticky; top: 37px;
    background: #131722; color: #808a9d; font-weight: 500; text-align: left;
    padding: 6px 12px; border-bottom: 1px solid #2a2e39; white-space: nowrap;
}
.sr-table td { padding: 6px 12px; border-bottom: 1px solid #1c212e; white-space: nowrap; }
.sr-table .num { text-align: right; font-variant-numeric: tabular-nums; }
.sr-row { cursor: pointer; }
.sr-row:hover { background: #1e222d; }
.sr-row:focus { outline: none; background: rgba(53,167,118,0.12); }
/* The clicked result stays highlighted while it's shown on the chart. */
.sr-row.active { background: rgba(245,197,24,0.12); box-shadow: inset 3px 0 0 #f5c518; }
.sr-row.active:hover { background: rgba(245,197,24,0.18); }
.sr-row.active .sym { color: #f5c518; }

/* "Loading onto chart…" feedback under the active row. */
.sr-status-row td {
    padding: 6px 12px 6px 14px;
    background: rgba(245,197,24,0.06);
    color: #c9a227; font-size: 11px;
    box-shadow: inset 3px 0 0 #f5c518;
}
.sr-status-row.is-error td { background: rgba(229,65,80,0.08); color: #e54150; box-shadow: inset 3px 0 0 #e54150; }
.sr-spinner {
    display: inline-block; width: 11px; height: 11px; margin-right: 8px; vertical-align: -1px;
    border: 2px solid rgba(245,197,24,0.3); border-top-color: #f5c518; border-radius: 50%;
    animation: sr-spin 0.7s linear infinite;
}
@keyframes sr-spin { to { transform: rotate(360deg); } }
.sym { font-weight: 600; color: #fff; }
.sr-side { text-transform: capitalize; }
.sr-side.bull { color: #23a776; }
.sr-side.bear { color: #e54150; }
.sr-boxes { color: #b0b6c0; }
.time { color: #808a9d; }
</style>
