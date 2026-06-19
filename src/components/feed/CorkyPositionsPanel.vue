<template>
<div class="positions-dock" :style="{ height: height + 'px' }">
    <!-- Top-edge resize handle (only meaningful while open) -->
    <div v-if="open" class="pd-resizer" @mousedown.prevent="$emit('resize-start', $event)"></div>

    <!-- Header / tab bar — always visible so the dock can be (re)opened. -->
    <div class="pd-header">
        <div class="pd-tabs" role="tablist" aria-label="Positions">
            <button class="pd-tab" role="tab" :aria-selected="activeTab === 'open'"
                    :class="{ active: activeTab === 'open' }"
                    @click="selectTab('open')">
                Open Positions<span v-if="openPositions.length" class="pd-count">{{ openPositions.length }}</span>
            </button>
            <button class="pd-tab" role="tab" :aria-selected="activeTab === 'historical'"
                    :class="{ active: activeTab === 'historical' }"
                    @click="selectTab('historical')">
                Historical<span v-if="historyTotal" class="pd-count">{{ historyTotal }}</span>
            </button>
        </div>
        <div class="pd-header-right">
            <select v-if="accounts.length > 1" class="pd-account"
                    :value="activeAccountKey" @change="onAccountChange">
                <option v-for="a in accounts" :key="accountKey(a)" :value="accountKey(a)">
                    {{ a.venue }} · {{ a.account_id }}
                </option>
            </select>
            <button class="pd-icon" title="Refresh" @click="$emit('refresh')">⟳</button>
            <button class="pd-icon" :title="open ? 'Collapse' : 'Expand'"
                    @click="$emit('update:open', !open)">{{ open ? '▾' : '▴' }}</button>
        </div>
    </div>

    <!-- Body -->
    <div v-if="open" class="pd-body">
        <div v-if="error" class="pd-msg pd-error">{{ error }}</div>
        <div v-else-if="loading && !rows.length" class="pd-msg">Loading…</div>
        <div v-else-if="!rows.length" class="pd-msg">
            No {{ activeTab === 'open' ? 'open' : 'historical' }} positions
        </div>
        <template v-else>
            <table class="pd-table">
                <thead>
                    <tr>
                        <th>Symbol</th><th>Side</th><th class="num">Amount</th>
                        <th class="num">Base Price</th><th class="num">PnL</th>
                        <th class="num">PnL %</th><th>Opened</th>
                        <th v-if="activeTab === 'historical'">Closed</th>
                        <th></th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="p in rows" :key="rowKey(p)"
                        class="pd-row" :class="{ active: isActiveRow(p) }"
                        tabindex="0" role="button"
                        :aria-label="`Switch chart to ${p.venue} ${p.symbol}`"
                        @click="$emit('select-position', p)"
                        @keydown.enter.prevent="$emit('select-position', p)"
                        @keydown.space.prevent="$emit('select-position', p)"
                        :title="`Switch chart to ${p.venue} ${p.symbol}`">
                        <td class="sym">{{ p.symbol }}</td>
                        <td :class="sideClass(p)">{{ p.side }}</td>
                        <td class="num">{{ p.amount }}</td>
                        <td class="num">{{ p.base_price }}</td>
                        <td class="num" :class="signClass(p.pl)">{{ p.pl == null ? '—' : p.pl }}</td>
                        <td class="num" :class="signClass(p.pl_perc)">{{ pctText(p.pl_perc) }}</td>
                        <td class="time">{{ fmtTime(p.opened_at_ms) }}</td>
                        <td v-if="activeTab === 'historical'" class="time">{{ fmtTime(p.closed_at_ms) }}</td>
                        <td class="pd-details-cell">
                            <button class="pd-details" title="Audit details (orders & trades)"
                                    @click.stop="$emit('audit-position', p)"
                                    @keydown.enter.stop.prevent="$emit('audit-position', p)">ⓘ</button>
                        </td>
                    </tr>
                </tbody>
            </table>
            <div v-if="activeTab === 'historical' && historyHasMore" class="pd-more">
                <button class="tf-btn" :disabled="loading" @click="$emit('load-more')">
                    Load more ({{ rows.length }}/{{ historyTotal }})
                </button>
            </div>
        </template>
    </div>
</div>
</template>

<script>
import { isNeg, positionKey } from '../../helpers/feed/corky-positions.js'

export default {
    name: 'CorkyPositionsPanel',
    props: {
        height: { type: Number, default: 34 },
        open: { type: Boolean, default: false },
        activeTab: { type: String, default: 'open' },
        openPositions: { type: Array, default: () => [] },
        historicalPositions: { type: Array, default: () => [] },
        accounts: { type: Array, default: () => [] },
        activeAccount: { type: Object, default: null },
        loading: { type: Boolean, default: false },
        error: { type: String, default: null },
        historyHasMore: { type: Boolean, default: false },
        historyTotal: { type: Number, default: 0 },
        // `venue|symbol` (lowercased) currently charted — highlights the row.
        currentSymbolKey: { type: String, default: '' },
    },
    emits: [
        'update:open', 'update:active-tab', 'update:active-account',
        'select-position', 'audit-position', 'load-more', 'refresh', 'resize-start',
    ],
    computed: {
        rows() {
            return this.activeTab === 'open' ? this.openPositions : this.historicalPositions
        },
        activeAccountKey() {
            return this.activeAccount ? this.accountKey(this.activeAccount) : ''
        },
    },
    methods: {
        selectTab(tab) {
            if (tab !== this.activeTab) this.$emit('update:active-tab', tab)
        },
        accountKey(a) {
            return a ? `${String(a.venue).toLowerCase()}|${a.account_id}` : ''
        },
        onAccountChange(ev) {
            const found = this.accounts.find((a) => this.accountKey(a) === ev.target.value)
            if (found) this.$emit('update:active-account', found)
        },
        rowKey(p) { return positionKey(p) },
        isActiveRow(p) {
            if (!this.currentSymbolKey || !p) return false
            return `${String(p.venue).toLowerCase()}|${String(p.symbol).toLowerCase()}` === this.currentSymbolKey
        },
        sideClass(p) {
            const s = String(p && p.side || '').toLowerCase()
            if (s === 'long') return 'side-long'
            if (s === 'short') return 'side-short'
            return ''
        },
        // Colour by the textual sign of a decimal string — never float-parsed.
        signClass(dec) {
            if (dec == null || dec === '') return ''
            return isNeg(dec) ? 'neg' : 'pos'
        },
        pctText(dec) {
            if (dec == null || dec === '') return '—'
            // pl_perc is a decimal fraction string (e.g. "0.03" = 3%). Show the
            // raw value with a % suffix; no float maths so precision is preserved.
            return `${dec}%`
        },
        fmtTime(ms) {
            // null / 0 / negative / NaN = unknown — never render the 1970 epoch
            // (e.g. a current position whose opened_at_ms came through as 0).
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
.positions-dock {
    display: flex;
    flex-direction: column;
    /* As a flex child of .chart-area, never shrink below the requested height —
       otherwise the body collapses and the tabs overlap the chart. */
    flex-shrink: 0;
    background-color: #121827;
    border-top: 1px solid #2a2e39;
    color: #d1d4dc;
    font-size: 12px;
    overflow: hidden;
    position: relative;
}
.pd-resizer {
    position: absolute;
    top: 0; left: 0; right: 0;
    height: 5px;
    cursor: ns-resize;
    z-index: 2;
}
.pd-resizer:hover { background: rgba(53, 167, 118, 0.4); }

.pd-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    height: 34px;
    min-height: 34px;
    padding: 0 8px;
    border-bottom: 1px solid #2a2e39;
    background-color: #131722;
}
.pd-tabs { display: flex; gap: 6px; }
.pd-tab {
    background: transparent;
    color: #808a9d;
    border: none;
    border-bottom: 2px solid transparent;
    padding: 8px 10px;
    font-size: 12px;
    font-weight: 500;
    cursor: pointer;
    transition: color 0.15s ease, border-color 0.15s ease;
}
.pd-tab:hover { color: #d1d4dc; }
.pd-tab.active { color: #35a776; border-bottom-color: #35a776; }
.pd-count {
    display: inline-block;
    margin-left: 6px;
    padding: 0 5px;
    border-radius: 8px;
    background: #2a2e39;
    color: #d1d4dc;
    font-size: 10px;
}

.pd-header-right { display: flex; align-items: center; gap: 6px; }
.pd-account {
    background: #131722;
    color: #d1d4dc;
    border: 1px solid #2a2e39;
    border-radius: 4px;
    padding: 3px 6px;
    font-size: 11px;
}
.pd-icon {
    background: #131722;
    color: #808a9d;
    border: 1px solid #2a2e39;
    border-radius: 4px;
    width: 24px; height: 22px;
    cursor: pointer;
    transition: all 0.15s ease;
}
.pd-icon:hover { color: #35a776; border-color: #35a776; }

.pd-body { flex: 1 1 0; min-height: 0; overflow: auto; }
.pd-msg { padding: 16px; color: #808a9d; text-align: center; }
.pd-error { color: #e54150; }

.pd-table { width: 100%; border-collapse: collapse; }
.pd-table th {
    position: sticky; top: 0;
    background: #131722;
    color: #808a9d;
    font-weight: 500;
    text-align: left;
    padding: 6px 10px;
    border-bottom: 1px solid #2a2e39;
    white-space: nowrap;
}
.pd-table td {
    padding: 5px 10px;
    border-bottom: 1px solid #1c212e;
    white-space: nowrap;
}
.pd-table .num { text-align: right; font-variant-numeric: tabular-nums; }
.pd-row { cursor: pointer; }
.pd-row:hover { background: #1e222d; }
.pd-row.active { background: rgba(53, 167, 118, 0.12); }
.pd-details-cell { text-align: right; width: 1%; }
.pd-details {
    background: transparent; border: none; color: #808a9d;
    cursor: pointer; font-size: 13px; padding: 0 2px;
}
.pd-details:hover { color: #35a776; }
.sym { font-weight: 600; color: #fff; }
.side-long { color: #23a776; text-transform: capitalize; }
.side-short { color: #e54150; text-transform: capitalize; }
.pos { color: #23a776; }
.neg { color: #e54150; }
.time { color: #808a9d; }

.pd-more { padding: 8px; text-align: center; }
.tf-btn {
    background: #131722;
    color: #808a9d;
    border: 1px solid #2a2e39;
    border-radius: 4px;
    padding: 6px 12px;
    font-size: 11px;
    cursor: pointer;
    transition: all 0.15s ease;
}
.tf-btn:hover:not(:disabled) { border-color: #35a776; color: #35a776; }
.tf-btn:disabled { opacity: 0.5; cursor: default; }
</style>
