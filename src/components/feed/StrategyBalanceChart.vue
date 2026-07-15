<template>
<div class="sbc" :style="{ width: width + 'px', height: height + 'px' }">
    <div class="sbc-head">
        <div>
            <div class="sbc-title">USD-normalized strategy balance</div>
            <div class="sbc-sub">{{ strategyName }} · {{ timeframe }} · {{ pointCount }} observations</div>
        </div>
        <div v-if="latest" class="sbc-latest">
            <span>Booked <strong :class="valueTone(latest.booked)">{{ money(latest.booked) }}</strong></span>
            <span v-if="latest.equity != null">Marked <strong :class="valueTone(latest.equity)">{{ money(latest.equity) }}</strong></span>
        </div>
    </div>

    <svg v-if="points.length" class="sbc-svg" :viewBox="`0 0 ${width} ${height}`" role="img"
         :aria-label="`Balance history for ${strategyName}`">
        <g class="sbc-grid">
            <template v-for="tick in yTicks" :key="'y-' + tick.value">
                <line :x1="margin.left" :x2="width - margin.right" :y1="tick.y" :y2="tick.y" />
                <text :x="margin.left - 10" :y="tick.y + 4" text-anchor="end">{{ money(tick.value) }}</text>
            </template>
            <template v-for="tick in xTicks" :key="'x-' + tick.value">
                <line :x1="tick.x" :x2="tick.x" :y1="margin.top" :y2="height - margin.bottom" />
                <text :x="tick.x" :y="height - 13" text-anchor="middle">{{ timeLabel(tick.value) }}</text>
            </template>
        </g>
        <line class="sbc-baseline" :x1="margin.left" :x2="width - margin.right"
              :y1="y(startingBalance)" :y2="y(startingBalance)" />
        <text class="sbc-baseline-label" :x="width - margin.right" :y="y(startingBalance) - 7"
              text-anchor="end">Starting balance {{ money(startingBalance) }}</text>

        <polyline v-for="(segment, index) in bookedSegments" :key="'booked-' + index"
                  class="sbc-line sbc-booked" :class="'tone-' + segment.tone"
                  :points="svgPoints(segment.points)" />
        <polyline v-for="(segment, index) in equitySegments" :key="'equity-' + index"
                  class="sbc-line sbc-equity" :class="'tone-' + segment.tone"
                  :points="svgPoints(segment.points)" />
    </svg>

    <div v-if="!points.length && !loading && !error" class="sbc-state">No balance history is available.</div>
    <div v-if="error" class="sbc-state sbc-error">{{ error }}</div>
    <div v-if="loading" class="sbc-state sbc-loading">Loading {{ timeframe }} balance history…</div>

    <div class="sbc-legend">
        <span><i class="solid"></i>Booked balance (banked)</span>
        <span><i class="dotted"></i>Marked equity (includes unbanked P&amp;L)</span>
        <span><i class="base"></i>Starting balance</span>
        <span v-if="partialCount" class="sbc-partial">{{ partialCount }} partial marks omitted</span>
        <span v-if="logScale && !domain.useLog" class="sbc-partial">Log scale unavailable for non-positive values</span>
    </div>
</div>
</template>

<script>
import {
    balanceChartDomain, balanceChartPoints, splitBalanceSegments,
} from '../../helpers/feed/strategy-balance-chart.js'

export default {
    name: 'StrategyBalanceChart',
    props: {
        history: { type: Object, default: null },
        loading: { type: Boolean, default: false },
        error: { type: String, default: null },
        strategyName: { type: String, default: 'Strategy' },
        timeframe: { type: String, default: '1h' },
        width: { type: Number, required: true },
        height: { type: Number, required: true },
        logScale: { type: Boolean, default: false },
    },
    data() {
        return { margin: { top: 82, right: 26, bottom: 48, left: 88 } }
    },
    computed: {
        points() { return balanceChartPoints(this.history) },
        pointCount() { return this.points.length },
        startingBalance() {
            const value = Number(this.history && this.history.starting_balance)
            return Number.isFinite(value) ? value : (this.points[0] ? this.points[0].booked : 0)
        },
        latest() { return this.points[this.points.length - 1] || null },
        partialCount() { return this.points.filter((point) => point.markStatus === 'partial').length },
        domain() { return balanceChartDomain(this.points, this.startingBalance, this.logScale) },
        minTime() { return this.points.length ? this.points[0].timestamp : 0 },
        maxTime() { return this.points.length > 1 ? this.points[this.points.length - 1].timestamp : this.minTime + 1 },
        bookedSegments() { return splitBalanceSegments(this.points, 'booked', this.startingBalance) },
        equitySegments() { return splitBalanceSegments(this.points, 'equity', this.startingBalance) },
        yTicks() {
            return Array.from({ length: 5 }, (_, index) => {
                const projected = this.domain.maximum - (this.domain.maximum - this.domain.minimum) * index / 4
                const value = this.domain.useLog ? 10 ** projected : projected
                return { value, y: this.y(value) }
            })
        },
        xTicks() {
            return Array.from({ length: 5 }, (_, index) => {
                const value = this.minTime + (this.maxTime - this.minTime) * index / 4
                return { value, x: this.x(value) }
            })
        },
    },
    methods: {
        resetView() { /* the history view always fits the complete selected timeframe */ },
        x(timestamp) {
            const span = this.maxTime - this.minTime || 1
            return this.margin.left + (timestamp - this.minTime) / span * (this.width - this.margin.left - this.margin.right)
        },
        y(value) {
            const projected = this.domain.project(value)
            const span = this.domain.maximum - this.domain.minimum || 1
            return this.margin.top + (this.domain.maximum - projected) / span * (this.height - this.margin.top - this.margin.bottom)
        },
        svgPoints(points) { return points.map((point) => `${this.x(point.timestamp)},${this.y(point.value)}`).join(' ') },
        valueTone(value) { return value < this.startingBalance ? 'loss' : 'profit' },
        money(value) {
            if (!Number.isFinite(value)) return '—'
            return new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD', maximumFractionDigits: 2 }).format(value)
        },
        timeLabel(timestamp) {
            const date = new Date(timestamp)
            return this.timeframe === '1D' || this.timeframe === '1W'
                ? date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: '2-digit', timeZone: 'UTC' })
                : date.toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'UTC' })
        },
    },
}
</script>

<style scoped>
.sbc { position: relative; overflow: hidden; color: #d7deea; background: #121827; font: 12px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; }
.sbc-head { position: absolute; z-index: 2; top: 14px; left: 20px; right: 24px; display: flex; justify-content: space-between; pointer-events: none; }
.sbc-title { color: #f3f5f8; font-size: 15px; font-weight: 650; }
.sbc-sub { margin-top: 4px; color: #778399; font-size: 11px; }
.sbc-latest { display: flex; gap: 18px; color: #8792a5; }
.sbc-latest strong { margin-left: 5px; font-variant-numeric: tabular-nums; }
.sbc-latest .profit { color: #f5f7fa; }
.sbc-latest .loss { color: #ff5c6c; }
.sbc-svg { display: block; width: 100%; height: 100%; }
.sbc-grid line { stroke: #263043; stroke-width: 1; }
.sbc-grid text, .sbc-baseline-label { fill: #69758a; font-size: 10px; }
.sbc-baseline { stroke: #8590a2; stroke-width: 1; stroke-dasharray: 7 5; }
.sbc-line { fill: none; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; vector-effect: non-scaling-stroke; }
.sbc-line.tone-profit { stroke: #f5f7fa; }
.sbc-line.tone-loss { stroke: #ff5c6c; }
.sbc-equity { stroke-width: 1.7; stroke-dasharray: 4 6; }
.sbc-state { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; color: #8792a5; background: rgba(18,24,39,.88); z-index: 3; }
.sbc-error { color: #ff7b86; padding: 30px; text-align: center; }
.sbc-loading { color: #79b8ff; }
.sbc-legend { position: absolute; left: 94px; bottom: 5px; display: flex; align-items: center; gap: 18px; color: #7f899a; font-size: 10px; }
.sbc-legend span { display: inline-flex; align-items: center; gap: 6px; }
.sbc-legend i { width: 22px; border-top: 2px solid #f5f7fa; }
.sbc-legend i.dotted { border-top-style: dotted; }
.sbc-legend i.base { border-top: 1px dashed #8590a2; }
.sbc-partial { color: #e1ad5b; }
</style>
