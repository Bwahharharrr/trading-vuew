<template>
<div class="indicator-settings-overlay" @click.self="close">
    <div class="indicator-settings-modal">
        <div class="modal-header">
            <span class="modal-title">{{ indicatorName }} Settings</span>
            <button class="modal-close" @click="close">&times;</button>
        </div>
        <div class="modal-body">
            <div class="setting-group">
                <label class="setting-label">Visualization Type</label>
                <div class="type-buttons">
                    <button
                        v-for="type in visualTypes"
                        :key="type.value"
                        class="type-btn"
                        :class="{ active: selectedType === type.value }"
                        @click="selectType(type.value)">
                        <span class="type-icon" v-html="type.icon"></span>
                        <span class="type-name">{{ type.label }}</span>
                    </button>
                </div>
            </div>

            <!-- Color settings for Spline/StepLine -->
            <div class="setting-group" v-if="selectedType === 'Spline' || selectedType === 'StepLine'">
                <label class="setting-label">Color</label>
                <div class="color-row">
                    <input type="color" v-model="lineColor" @input="updateColors" class="color-picker">
                    <span class="color-value">{{ lineColor }}</span>
                </div>
            </div>

            <!-- Color settings for Histogram/Bar -->
            <div class="setting-group" v-if="selectedType === 'Histogram' || selectedType === 'Bar'">
                <label class="setting-label">Colors</label>
                <div class="color-row">
                    <label class="color-label">Up/Positive</label>
                    <input type="color" v-model="colorUp" @input="updateColors" class="color-picker">
                    <span class="color-value">{{ colorUp }}</span>
                </div>
                <div class="color-row">
                    <label class="color-label">Down/Negative</label>
                    <input type="color" v-model="colorDown" @input="updateColors" class="color-picker">
                    <span class="color-value">{{ colorDown }}</span>
                </div>
            </div>

            <!-- Line width for line-based types -->
            <div class="setting-group" v-if="selectedType === 'Spline' || selectedType === 'StepLine'">
                <label class="setting-label">Line Width</label>
                <div class="slider-row">
                    <input type="range" v-model.number="lineWidth" min="0.5" max="5" step="0.5" @input="updateColors" class="slider">
                    <span class="slider-value">{{ lineWidth }}</span>
                </div>
            </div>
        </div>
        <div class="modal-footer">
            <button class="btn-close" @click="close">Close</button>
        </div>
    </div>
</div>
</template>

<script>
export default {
    name: 'IndicatorSettings',
    props: {
        indicatorName: {
            type: String,
            default: 'Indicator'
        },
        currentType: {
            type: String,
            default: 'Spline'
        },
        currentSettings: {
            type: Object,
            default: () => ({})
        },
        indicatorIndex: {
            type: Number,
            required: true
        },
        gridId: {
            type: Number,
            required: true
        }
    },
    data() {
        const settings = this.currentSettings || {}
        return {
            selectedType: this.currentType,
            lineColor: settings.color || '#42b28a',
            colorUp: settings.colorUp || settings.color || '#26A69A',
            colorDown: settings.colorDown || '#EF5350',
            lineWidth: settings.lineWidth || 1.5,
            visualTypes: [
                {
                    value: 'Spline',
                    label: 'Spline',
                    icon: '<svg viewBox="0 0 24 24" width="20" height="20"><path d="M3 17 Q 9 6, 12 12 T 21 7" stroke="currentColor" fill="none" stroke-width="2"/></svg>'
                },
                {
                    value: 'StepLine',
                    label: 'Step Line',
                    icon: '<svg viewBox="0 0 24 24" width="20" height="20"><path d="M3 17 H8 V10 H13 V14 H18 V7 H21" stroke="currentColor" fill="none" stroke-width="2"/></svg>'
                },
                {
                    value: 'Histogram',
                    label: 'Histogram',
                    icon: '<svg viewBox="0 0 24 24" width="20" height="20"><rect x="3" y="10" width="4" height="10" fill="currentColor"/><rect x="10" y="5" width="4" height="15" fill="currentColor"/><rect x="17" y="8" width="4" height="12" fill="currentColor"/></svg>'
                },
                {
                    value: 'Bar',
                    label: 'Bar',
                    icon: '<svg viewBox="0 0 24 24" width="20" height="20"><rect x="4" y="8" width="2" height="12" fill="currentColor"/><rect x="9" y="4" width="2" height="16" fill="currentColor"/><rect x="14" y="10" width="2" height="10" fill="currentColor"/><rect x="19" y="6" width="2" height="14" fill="currentColor"/></svg>'
                }
            ]
        }
    },
    methods: {
        selectType(type) {
            this.selectedType = type
            this.emitSettings()
        },
        updateColors() {
            this.emitSettings()
        },
        emitSettings() {
            const settings = {
                gridId: this.gridId,
                indicatorIndex: this.indicatorIndex,
                newType: this.selectedType,
                newSettings: this.buildSettings()
            }
            this.$emit('apply', settings)
        },
        buildSettings() {
            if (this.selectedType === 'Spline' || this.selectedType === 'StepLine') {
                return {
                    color: this.lineColor,
                    lineWidth: this.lineWidth
                }
            } else {
                return {
                    colorUp: this.colorUp,
                    colorDown: this.colorDown
                }
            }
        },
        close() {
            this.$emit('close')
        }
    }
}
</script>

<style>
.indicator-settings-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.6);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 10000;
    pointer-events: auto;
}

.indicator-settings-modal {
    background: #1e222d;
    border: 1px solid #2a2e39;
    border-radius: 8px;
    min-width: 320px;
    max-width: 400px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
    pointer-events: auto;
    position: relative;
    z-index: 10001;
}

.modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 15px 20px;
    border-bottom: 1px solid #2a2e39;
}

.modal-title {
    color: #d1d4dc;
    font-size: 14px;
    font-weight: 600;
    font-family: -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif;
}

.modal-close {
    background: none;
    border: none;
    color: #808a9d;
    font-size: 20px;
    cursor: pointer;
    padding: 0;
    line-height: 1;
    transition: color 0.15s ease;
}

.modal-close:hover {
    color: #d1d4dc;
}

.modal-body {
    padding: 20px;
}

.setting-group {
    margin-bottom: 15px;
}

.setting-label {
    display: block;
    color: #808a9d;
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin-bottom: 12px;
    font-family: -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif;
}

.type-buttons {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 10px;
}

.type-btn {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 15px 10px;
    background: #131722;
    border: 1px solid #2a2e39;
    border-radius: 6px;
    color: #808a9d;
    cursor: pointer;
    transition: all 0.15s ease;
    pointer-events: auto;
}

.type-btn:hover {
    border-color: #3e4251;
    color: #d1d4dc;
}

.type-btn.active {
    border-color: #35a776;
    background: rgba(53, 167, 118, 0.1);
    color: #35a776;
}

.type-icon {
    display: flex;
    align-items: center;
    justify-content: center;
}

.type-icon svg {
    width: 24px;
    height: 24px;
}

.type-name {
    font-size: 11px;
    font-weight: 500;
    font-family: -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif;
}

.modal-footer {
    display: flex;
    justify-content: flex-end;
    padding: 15px 20px;
    border-top: 1px solid #2a2e39;
}

.btn-close {
    padding: 8px 16px;
    border-radius: 4px;
    font-size: 12px;
    font-weight: 500;
    font-family: -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif;
    cursor: pointer;
    transition: all 0.15s ease;
    pointer-events: auto;
    background: #131722;
    border: 1px solid #2a2e39;
    color: #808a9d;
}

.btn-close:hover {
    border-color: #3e4251;
    color: #d1d4dc;
}

.color-row {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 8px;
}

.color-row:last-child {
    margin-bottom: 0;
}

.color-label {
    color: #808a9d;
    font-size: 11px;
    min-width: 80px;
    font-family: -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif;
}

.color-picker {
    width: 40px;
    height: 28px;
    padding: 0;
    border: 1px solid #2a2e39;
    border-radius: 4px;
    background: #131722;
    cursor: pointer;
    pointer-events: auto;
}

.color-picker::-webkit-color-swatch-wrapper {
    padding: 2px;
}

.color-picker::-webkit-color-swatch {
    border: none;
    border-radius: 2px;
}

.color-value {
    color: #808a9d;
    font-size: 11px;
    font-family: monospace;
    text-transform: uppercase;
}

.slider-row {
    display: flex;
    align-items: center;
    gap: 10px;
}

.slider {
    flex: 1;
    height: 4px;
    -webkit-appearance: none;
    appearance: none;
    background: #2a2e39;
    border-radius: 2px;
    outline: none;
    pointer-events: auto;
}

.slider::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 14px;
    height: 14px;
    background: #35a776;
    border-radius: 50%;
    cursor: pointer;
}

.slider::-moz-range-thumb {
    width: 14px;
    height: 14px;
    background: #35a776;
    border-radius: 50%;
    cursor: pointer;
    border: none;
}

.slider-value {
    color: #d1d4dc;
    font-size: 12px;
    min-width: 24px;
    text-align: right;
    font-family: -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif;
}
</style>
