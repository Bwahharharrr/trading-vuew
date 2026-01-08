<template>
<div>
    <trading-vue ref="tradingVue" :data="chart" :width="this.width" :height="this.height"
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
    <candle-color-selector
        :coloring-options="candleColoringOptions"
        :current-coloring="currentCandleColoring"
        @coloring-selected="onCandleColoringSelected">
    </candle-color-selector>
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
import CandleColorSelector from './CandleColorSelector.vue'

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
        TradingVue, TfSelector, FileSelector, CandleColorSelector
    },
    methods: {
        onResize() {
            this.width = window.innerWidth
            this.height = window.innerHeight
        },
        on_selected(tf) {
            const chartData = this.charts[tf.name]
            // Store original data for color scheme switching
            this.originalChartData = JSON.parse(JSON.stringify(chartData.chart.data))
            // Extract candle coloring options from onchart
            this.extractCandleColoringOptions(chartData)
            // Reset current coloring selection
            this.currentCandleColoring = ''
            // Create DataCube with candle_coloring items filtered out
            this.chart = new DataCube(this.prepareChartData(chartData))
            // Force chart to redraw
            this.$nextTick(() => {
                if (this.$refs.tradingVue) {
                    this.$refs.tradingVue.resetChart()
                }
            })
        },
        extractCandleColoringOptions(chartData) {
            this.candleColoringOptions = []
            if (chartData.onchart && Array.isArray(chartData.onchart)) {
                for (const item of chartData.onchart) {
                    if (item.type === 'candle_coloring' && item.title && Array.isArray(item.data)) {
                        this.candleColoringOptions.push({
                            title: item.title,
                            data: item.data
                        })
                    }
                }
            }
        },
        // Create a clean copy of chart data with candle_coloring items filtered out
        prepareChartData(chartData) {
            const cleaned = JSON.parse(JSON.stringify(chartData))
            if (cleaned.onchart && Array.isArray(cleaned.onchart)) {
                cleaned.onchart = cleaned.onchart.filter(item => item.type !== 'candle_coloring')
            }
            return cleaned
        },
        onCandleColoringSelected(coloringTitle) {
            this.currentCandleColoring = coloringTitle

            if (!this.originalChartData || !this.chart.data.chart) return

            // Get the color data for selected scheme
            let colorData = null
            if (coloringTitle) {
                const selectedOption = this.candleColoringOptions.find(opt => opt.title === coloringTitle)
                if (selectedOption) {
                    colorData = selectedOption.data
                }
            }

            // Apply colors to chart data
            const newData = JSON.parse(JSON.stringify(this.originalChartData))
            if (colorData) {
                for (let i = 0; i < newData.length && i < colorData.length; i++) {
                    newData[i][6] = colorData[i]
                }
            }

            // Update the chart
            this.$set(this.chart.data.chart, 'data', newData)
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
                // Save current view range and dataset bounds before loading new data
                let savedRange = null
                let prevStart = null
                let prevEnd = null
                if (this.$refs.tradingVue && this.$refs.tradingVue.$refs.chart) {
                    savedRange = this.$refs.tradingVue.getRange()
                    const ohlcv = this.$refs.tradingVue.$refs.chart.ohlcv
                    if (ohlcv && ohlcv.length >= 2) {
                        prevStart = ohlcv[0][0]
                        prevEnd = ohlcv[ohlcv.length - 1][0]
                    }
                }

                const response = await fetch(`/data/${filename}`)
                if (!response.ok) {
                    throw new Error(`Failed to load ${filename}`)
                }
                const data = await response.json()
                this.currentDataFile = filename

                // Reset candle coloring
                this.currentCandleColoring = ''

                // Check if this is single-format (has chart.data array at root)
                if (data.chart && Array.isArray(data.chart.data)) {
                    // Single-timeframe format (data.json style)
                    this.charts = { 'default': data }
                    this.originalChartData = JSON.parse(JSON.stringify(data.chart.data))
                    this.extractCandleColoringOptions(data)
                    this.chart = new DataCube(this.prepareChartData(data))
                } else {
                    // Multi-timeframe format (data_tf.json style)
                    this.charts = data
                    const timeframes = Object.keys(data)
                    if (timeframes.length > 0) {
                        const firstTfData = data[timeframes[0]]
                        this.originalChartData = JSON.parse(JSON.stringify(firstTfData.chart.data))
                        this.extractCandleColoringOptions(firstTfData)
                        this.chart = new DataCube(this.prepareChartData(firstTfData))
                    }
                }

                // Force chart to redraw after data loads
                this.$nextTick(() => {
                    if (this.$refs.tradingVue) {
                        this.$refs.tradingVue.resetChart()
                    }
                })

                // Restore range only if new dataset has exact same first/last as previous dataset
                if (savedRange && savedRange[0] && savedRange[1] && prevStart !== null) {
                    setTimeout(() => {
                        if (this.$refs.tradingVue && this.$refs.tradingVue.$refs.chart) {
                            const ohlcv = this.$refs.tradingVue.$refs.chart.ohlcv
                            if (ohlcv && ohlcv.length >= 2) {
                                const newStart = ohlcv[0][0]
                                const newEnd = ohlcv[ohlcv.length - 1][0]
                                // Only restore if dataset start/end match exactly
                                if (newStart === prevStart && newEnd === prevEnd) {
                                    this.$refs.tradingVue.setRange(savedRange[0], savedRange[1])
                                }
                            }
                        }
                    }, 50)
                }
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
            currentDataFile: 'data_tf.json',
            candleColoringOptions: [],
            currentCandleColoring: '',
            originalChartData: null
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
