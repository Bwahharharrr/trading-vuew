# TradingVue.js

Canvas-based charting library for traders. Vue 3.

## Install

```
npm i trading-vue-js
```

## Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Dev server on localhost:8080 |
| `npm run build` | Production build |
| `npm run test` | Visual test server |
| `npm run ww` | Compile web workers |

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `MOB_DEBUG` | `false` | Route console output to `/debug` endpoint |

## Input Files

All input files are JSON. Place in `/data/` directory.

### OHLCV Data (Required)

```json
{
  "chart": {
    "type": "Candles",
    "data": [[timestamp, open, high, low, close, volume], ...]
  },
  "onchart": [],
  "offchart": []
}
```

### Multi-Timeframe Data

```json
{
  "1h": { "chart": {...}, "onchart": [], "offchart": [] },
  "4h": { "chart": {...}, "onchart": [], "offchart": [] }
}
```

### Indicators

```json
{
  "2h": {
    "indicators": [{
      "name": "RSI",
      "type": "Histogram",
      "data": [[timestamp, value], ...]
    }]
  }
}
```

## Data Formats

| Type | Format |
|------|--------|
| OHLCV | `[timestamp, open, high, low, close, volume]` |
| Indicator | `[timestamp, ...values]` |
| Timestamp | Unix milliseconds, ascending, no duplicates |

## Dev Server Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/data/{file}` | GET | Serve JSON file from `/data/` |
| `/data-files` | GET | List available JSON files |
| `/debug?argv=[]` | GET | Debug logging endpoint |

## localStorage

Key: `trading-vue-state`

Persists: selected file, view settings, indicator visibility, log scale.

## License

MIT
