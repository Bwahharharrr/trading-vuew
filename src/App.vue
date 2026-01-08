<template>
<div>
    <trading-vue :data="chart" :width="this.width" :height="this.height"
            :color-back="colors.colorBack"
            :color-grid="colors.colorGrid"
            :color-text="colors.colorText"
            :overlays="overlays"
            :chart-config="config"
            :toolbar="true">
    </trading-vue>
    <tf-selector :charts="charts" v-on:selected="on_selected">
    </tf-selector>
    <file-selector
        :files="dataFiles"
        :current-file="currentDataFile"
        @file-selected="onFileSelected">
    </file-selector>
    <span class="log-scale">
        <input type="checkbox" v-model="log_scale">
        <label>Log Scale</label>
    </span>
</div>
</template>

<script>
import TradingVue from './TradingVue.vue'
import TfSelector from './TFSelector.vue'
import FileSelector from './FileSelector.vue'

let uri = window.location.href.split('?');
if(uri.length == 2) {
  let vars = uri[1].split('&');
  let getVars = {};
  let tmp = '';
  vars.forEach(function(v) {
    tmp = v.split('=');
    if(tmp.length == 2)
      getVars[tmp[0]] = tmp[1];
  });
  console.log(getVars);
  // do 
    if (getVars['data'] != 'undefined') { 
        console.log('hello world')
       // #import Data from '../data/data_colormap.json'
    } 
} 


import Utils from '../src/stuff/utils.js'
import Data from '../data/data_tf.json'
// import DataColmap from '../data/data_colmap.json'
import DataCube from '../src/helpers/datacube.js'
import BuysAndSells from './buysandsells.js'
import Balance from './balance.js'
import LineTracker from './linetracker.js'

export default {
    name: 'app',
    computed: {
    	colors() {
        	return {
            	back: '#121827',
                grid: '#3e3e3e',
                text: '#35a776',
              	cross: '#dd64ef',
              	candle_dw: '#e54077',
              	wick_dw: '#e54077'
            }
        }
    },
    components: {
        TradingVue, TfSelector, FileSelector
    },
    methods: {
        onResize() {
            this.width = window.innerWidth
            this.height = window.innerHeight
        },
        on_selected(tf) {
            this.chart = new DataCube(this.charts[tf.name])
        },
        async loadDataFileList() {
            try {
                const response = await fetch('/data-files')
                if (response.ok) {
                    this.dataFiles = await response.json()
                }
            } catch (error) {
                console.error('Error loading file list:', error)
            }
        },
        async onFileSelected(filename) {
            try {
                const response = await fetch(`/data/${filename}`)
                if (!response.ok) {
                    throw new Error(`Failed to load ${filename}`)
                }
                const data = await response.json()
                this.currentDataFile = filename

                // Reset chart first to force Vue reactivity
                this.chart = new DataCube()

                // Use nextTick to ensure the reset is processed
                this.$nextTick(() => {
                    // Check if this is single-format (has chart.data array at root)
                    if (data.chart && Array.isArray(data.chart.data)) {
                        // Single-timeframe format (data.json style)
                        this.charts = { 'default': data }
                        this.chart = new DataCube(data)
                    } else {
                        // Multi-timeframe format (data_tf.json style)
                        this.charts = data
                        const timeframes = Object.keys(data)
                        if (timeframes.length > 0) {
                            this.chart = new DataCube(data[timeframes[0]])
                        }
                    }
                })
            } catch (error) {
                console.error('Error loading data file:', error)
            }
        }
    },
    mounted() {
        window.addEventListener('resize', this.onResize)
        window.dc = this.chart
        window.tv = this.$refs.tradingVue
        this.loadDataFileList()
    },
    beforeDestroy() {
        window.removeEventListener('resize', this.onResize)
    },
    data() {
        return {
            charts: Data,
            chart: new DataCube(),
            width: window.innerWidth,
            height: window.innerHeight,
            overlays: [BuysAndSells,Balance,LineTracker],
            config: {
                DEFAULT_LEN: 200,
                TB_BORDER: 5,
                CANDLEW: 0.9,
                GRIDX: 200,
                VOLSCALE: 0.1
            },
            log_scale: true,
            dataFiles: [],
            currentDataFile: 'data_tf.json'
        };
    },
    watch: {
        log_scale(value) {
            if (this.chart.data.chart) {
                this.$set(this.chart.data.chart, 'grid', {
                    logScale: value
                })
            }
        }
    }
};
</script>

<style>
html,
body {
    background-color: #000;
    margin: 0;
    padding: 0;
    overflow: hidden;
}
.log-scale {
    position: absolute;
    top: 60px;
    right: 80px;
    color: #888;
    font: 11px -apple-system, BlinkMacSystemFont,
        Segoe UI, Roboto, Oxygen, Ubuntu, Cantarell,
        Fira Sans, Droid Sans, Helvetica Neue,
        sans-serif
}
</style>
