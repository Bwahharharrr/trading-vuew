<template>
    <div class="candle-color-selector" v-if="coloringOptions.length > 0">
        <label>Candle Colors:</label>
        <select v-model="selectedColoring" @change="onColoringChange">
            <option value="">Default (from data)</option>
            <option v-for="option in coloringOptions" :key="option.title" :value="option.title">
                {{ option.title }}
            </option>
        </select>
    </div>
</template>

<script>
export default {
    name: 'CandleColorSelector',
    props: {
        coloringOptions: {
            type: Array,
            default: () => []
        },
        currentColoring: {
            type: String,
            default: ''
        }
    },
    data() {
        return {
            selectedColoring: this.currentColoring
        }
    },
    watch: {
        currentColoring(newVal) {
            this.selectedColoring = newVal
        }
    },
    methods: {
        onColoringChange() {
            this.$emit('coloring-selected', this.selectedColoring)
        }
    }
}
</script>

<style scoped>
.candle-color-selector {
    position: absolute;
    top: 10px;
    left: 50%;
    transform: translateX(-50%);
    margin-top: 45px;
    z-index: 1000;
    background: rgba(18, 24, 39, 0.9);
    padding: 10px 15px;
    border-radius: 5px;
    border: 1px solid #3e3e3e;
}

.candle-color-selector label {
    color: #888;
    font: 11px -apple-system, BlinkMacSystemFont,
        Segoe UI, Roboto, Oxygen, Ubuntu, Cantarell,
        Fira Sans, Droid Sans, Helvetica Neue,
        sans-serif;
    margin-right: 8px;
}

.candle-color-selector select {
    background: #1e2433;
    color: #35a776;
    border: 1px solid #3e3e3e;
    border-radius: 3px;
    padding: 4px 8px;
    font: 11px -apple-system, BlinkMacSystemFont,
        Segoe UI, Roboto, Oxygen, Ubuntu, Cantarell,
        Fira Sans, Droid Sans, Helvetica Neue,
        sans-serif;
    cursor: pointer;
    outline: none;
}

.candle-color-selector select:hover {
    border-color: #35a776;
}

.candle-color-selector select option {
    background: #1e2433;
    color: #35a776;
}
</style>
