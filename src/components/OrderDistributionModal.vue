<template>
<div class="order-modal-overlay" @click.self="close">
    <div class="order-modal">
        <div class="modal-header">
            <span class="modal-title">Order Distribution</span>
            <button class="modal-close" @click="close">&times;</button>
        </div>
        <div class="modal-body">
            <div class="range-context" v-if="geometry">
                Range: {{ fmt(low) }} – {{ fmt(high) }}
            </div>

            <div class="setting-group">
                <label class="setting-label">Side</label>
                <div class="side-buttons">
                    <button class="side-btn buy" :class="{ active: side === 'buy' }"
                        @click="side = 'buy'">BUY</button>
                    <button class="side-btn sell" :class="{ active: side === 'sell' }"
                        @click="side = 'sell'">SELL</button>
                </div>
            </div>

            <div class="setting-group">
                <label class="setting-label">Order Size (total)</label>
                <input class="num-input" type="number" step="any" min="0"
                    v-model.number="orderSize">
            </div>

            <div class="setting-group">
                <label class="setting-label">Order Qty</label>
                <input class="num-input" type="number" step="1" min="1"
                    v-model.number="orderQty">
            </div>

            <div class="setting-group">
                <label class="setting-label">Distribution</label>
                <div class="type-buttons">
                    <button v-for="t in distTypes" :key="t.value" class="type-btn"
                        :class="{ active: distribution === t.value }"
                        @click="distribution = t.value">
                        <span class="type-icon" v-html="t.icon"></span>
                        <span class="type-name">{{ t.label }}</span>
                    </button>
                </div>
            </div>
        </div>
        <div class="modal-footer">
            <button class="btn-cancel" @click="close">Cancel</button>
            <button class="btn-confirm" :disabled="!valid" @click="confirm">Confirm</button>
        </div>
    </div>
</div>
</template>

<script>
export default {
    name: 'OrderDistributionModal',
    props: {
        // { high, low, tStart, tEnd } from boxReadout (read-only context).
        geometry: { type: Object, default: null }
    },
    emits: ['confirm', 'close'],
    data() {
        return {
            orderSize: 1,
            orderQty: 5,
            distribution: 'flat',
            side: 'buy',
            distTypes: [
                { value: 'flat', label: 'Flat',
                  icon: '<svg viewBox="0 0 24 24" width="24" height="24"><line x1="3" y1="12" x2="21" y2="12" stroke="currentColor" stroke-width="2"/></svg>' },
                { value: 'desc', label: 'High→Low',
                  icon: '<svg viewBox="0 0 24 24" width="24" height="24"><path d="M3 6 L21 18" stroke="currentColor" fill="none" stroke-width="2"/></svg>' },
                { value: 'asc', label: 'Low→High',
                  icon: '<svg viewBox="0 0 24 24" width="24" height="24"><path d="M3 18 L21 6" stroke="currentColor" fill="none" stroke-width="2"/></svg>' }
            ]
        }
    },
    computed: {
        low() { return this.geometry ? Number(this.geometry.low) : 0 },
        high() { return this.geometry ? Number(this.geometry.high) : 0 },
        valid() {
            return Number(this.orderSize) > 0 &&
                Number.isFinite(this.orderQty) && Math.trunc(this.orderQty) >= 1
        }
    },
    methods: {
        fmt(v) {
            return (typeof v === 'number' && isFinite(v)) ? v.toLocaleString() : v
        },
        confirm() {
            if (!this.valid) return
            this.$emit('confirm', {
                orderSize: Number(this.orderSize),
                orderQty: Math.trunc(this.orderQty),
                distribution: this.distribution,
                side: this.side
            })
        },
        close() {
            this.$emit('close')
        }
    }
}
</script>

<style scoped>
.order-modal-overlay {
    position: fixed;
    top: 0; left: 0; right: 0; bottom: 0;
    background: rgba(0, 0, 0, 0.6);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 10000;
    pointer-events: auto;
}
.order-modal {
    background: #1e222d;
    border: 1px solid #2a2e39;
    border-radius: 8px;
    min-width: 320px;
    max-width: 400px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
    font-family: -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif;
}
.modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 15px 20px;
    border-bottom: 1px solid #2a2e39;
}
.modal-title { color: #d1d4dc; font-size: 14px; font-weight: 600; }
.modal-close {
    background: none; border: none; color: #808a9d;
    font-size: 20px; cursor: pointer; line-height: 1;
}
.modal-close:hover { color: #d1d4dc; }
.modal-body { padding: 20px; }
.range-context {
    color: #808a9d; font-size: 12px; margin-bottom: 16px;
    padding: 8px 10px; background: #131722; border-radius: 4px;
}
.setting-group { margin-bottom: 15px; }
.setting-label {
    display: block; color: #808a9d; font-size: 11px; font-weight: 600;
    text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 10px;
}
.num-input {
    width: 100%; box-sizing: border-box; padding: 8px 10px;
    background: #131722; border: 1px solid #2a2e39; border-radius: 6px;
    color: #d1d4dc; font-size: 13px;
}
.num-input:focus { outline: none; border-color: #35a776; }
.side-buttons, .type-buttons { display: grid; gap: 10px; }
.side-buttons { grid-template-columns: repeat(2, 1fr); }
.type-buttons { grid-template-columns: repeat(3, 1fr); }
.side-btn {
    padding: 10px; border-radius: 6px; cursor: pointer; font-weight: 700;
    background: #131722; border: 1px solid #2a2e39; color: #808a9d;
}
.side-btn.buy.active { border-color: #35a776; background: rgba(53,167,118,0.12); color: #35a776; }
.side-btn.sell.active { border-color: #e54150; background: rgba(229,65,80,0.12); color: #e54150; }
.type-btn {
    display: flex; flex-direction: column; align-items: center; gap: 6px;
    padding: 12px 6px; background: #131722; border: 1px solid #2a2e39;
    border-radius: 6px; color: #808a9d; cursor: pointer;
}
.type-btn:hover { border-color: #3e4251; color: #d1d4dc; }
.type-btn.active { border-color: #35a776; background: rgba(53,167,118,0.1); color: #35a776; }
.type-name { font-size: 11px; }
.modal-footer {
    display: flex; justify-content: flex-end; gap: 10px;
    padding: 15px 20px; border-top: 1px solid #2a2e39;
}
.btn-cancel, .btn-confirm {
    padding: 8px 16px; border-radius: 6px; cursor: pointer; font-size: 13px;
    border: 1px solid #2a2e39; background: #131722; color: #d1d4dc;
}
.btn-confirm { background: #35a776; border-color: #35a776; color: #fff; }
.btn-confirm:disabled { opacity: 0.5; cursor: not-allowed; }
</style>
