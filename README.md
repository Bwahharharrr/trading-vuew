
<div align="center">
  <img width="318" heigth="256" src="https://raw.githubusercontent.com/tvjsx/trading-vue-js/master/assets/README-c8a97eb7.png?raw=true" alt="trading-vue logo">
</div>

# TradingVue.js ![npm](https://img.shields.io/npm/v/trading-vue-js.svg?color=brightgreen&label=version) ![license](https://img.shields.io/badge/license-MIT-blue.svg) ![build](https://img.shields.io/badge/build-passing-brightgreen.svg)

A hackable charting library for traders. Draw anything on top of candlestick charts using canvas. [Not Maintained]

## Data Format

See [DATA_FORMAT.md](DATA_FORMAT.md) for full specification.

```
{
    "chart": { ... },      // Main candlestick data (mandatory)
    "onchart": [ ... ],    // Overlays ON the chart
    "offchart": [ ... ]    // Overlays BELOW the chart
}
```

**OHLCV:** `[timestamp, open, high, low, close, volume]`

**Indicator:** `[timestamp, ...values]`

**Timestamps:** Unix milliseconds, sorted ascending, no duplicates in main OHLCV

## Install

```
npm i trading-vue-js
```

## Quick Start

```html
<template>
<trading-vue :data="this.$data"></trading-vue>
</template>
<script>
import TradingVue from 'trading-vue-js'

export default {
    components: { TradingVue },
    data() {
        return {
            ohlcv: [
                [1551128400000, 33, 37.1, 14, 14, 196],
                [1551132000000, 13.7, 30, 6.6, 30, 206],
                [1551135600000, 29.9, 33, 21.3, 21.8, 74]
            ]
        }
    }
}
</script>
```

## Docs

[Demo](https://tvjsx.github.io/trading-vue-demo/) | [Getting Started](https://github.com/tvjsx/trading-vue-js/tree/master/docs/guide) | [API](https://github.com/tvjsx/trading-vue-js/tree/master/docs/api) | [Overlays](https://github.com/tvjsx/trading-vue-js/tree/master/docs/overlays) | [DataCube](https://github.com/tvjsx/trading-vue-js/tree/master/docs/datacube) | [FAQ](https://github.com/tvjsx/trading-vue-js/tree/master/docs/faq)

## Development

```
npm install      # Install dependencies
npm run dev      # Development server (localhost:8080)
npm run build    # Build bundle
npm run test     # Visual tests
```

## License

MIT
