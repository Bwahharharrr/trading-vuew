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
    <span class="log-scale">
        <input type="checkbox" v-model="log_scale">
        <label>Log Scale</label>
    </span>
    <div>
        <h1>Hello world</h1>
    </div>
</div>
</template>

<script>
import TradingVue from './TradingVue.vue'
import TfSelector from './TFSelector.vue'

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
        TradingVue, TfSelector
    },
    methods: {
        onResize() {
            this.width = window.innerWidth
            this.height = window.innerHeight
        },
        on_selected(tf) {
            // this.chart.set('chart', this.charts[tf.name].chart)
            
            this.chart = new DataCube( Data[tf.name] )
            // this.chart.set('onchart', this.charts[tf.name].onchart)
            //console.log(this)
            //this.chart.set('chart', this.charts[tf.name].chart)
            //this.chart.set('onchart', this.charts[tf.name].onchart)
            //this.overlays = this.charts[tf.name].onchart
           // this.chart.set('onchart', this.charts[tf.name].onchart)
           // this.$refs.tradingVue.resetChart()
         //   this.log_scale = false
        }
    },
    mounted() {
        window.addEventListener('resize', this.onResize)
        window.dc = this.chart
        window.tv = this.$refs.tradingVue
    },
    beforeDestroy() {
        window.removeEventListener('resize', this.onResize)
    },
    data() {
        return {
            charts: Data,
            // chart: new DataCube(Data['Y']),
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
            // index_based: false
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
