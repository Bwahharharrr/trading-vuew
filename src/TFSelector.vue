<template>
<!-- Timeframe Selector -->
<div class="tf-selector" :style="selectorStyle">
    <span class="timeframe" v-for="(tf, i) in this.timeframes"
        v-on:click="on_click(tf, i)"
        v-bind:style= "selected === i ? {color: '#44c767'} : {}">
        {{tf}}
    </span>
</div>
</template>

<script>
export default {
    name: 'TfSelector',
    props: ['charts', 'rightOffset'],
    mounted() {
        this.$emit('selected', {
            name: this.timeframes[this.selected],
            i: this.selected
        })
    },
    computed: {
        timeframes() {
            return Object.keys(this.$props.charts)
        },
        selectorStyle() {
            // Account for right panel offset (default 80px from right edge of chart)
            const rightPos = 80 + (this.$props.rightOffset || 0)
            return {
                right: rightPos + 'px'
            }
        }
    },
    methods: {
        on_click(tf, i) {
            this.selected = i
            this.$emit('selected', {
                name: this.timeframes[this.selected],
                i: this.selected
            })
        }
    },
    data() {
        return {
            selected: 0
        }
    }
}
</script>

<style>
.tf-selector {
    position: absolute;
    top: 15px;
    /* right is set dynamically via selectorStyle computed property */
    font: 16px -apple-system,BlinkMacSystemFont,
        Segoe UI,Roboto,Oxygen,Ubuntu,Cantarell,
        Fira Sans,Droid Sans,Helvetica Neue,
        sans-serif;
    background: #34363b;
    color: #ccc;
    padding: 8px;
    border-radius: 3px;
}
.timeframe {
    margin-right: 5px;
    user-select: none;
    cursor: pointer;
    font-weight: 200;
    max-width: 10px;
}
.timeframe:hover {
    color: #fff;
}
</style>
