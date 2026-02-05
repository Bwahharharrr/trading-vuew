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

## Data Format

All data files are JSON. Place in `/data/`.

### Single-Timeframe

```json
{
  "chart": { "type": "Candles", "data": [...] },
  "onchart": [],
  "offchart": [],
  "views": {}
}
```

### Multi-Timeframe

Each top-level key is a timeframe. Every timeframe has the same structure:

```json
{
  "1h": {
    "chart": { "type": "Candles", "data": [...] },
    "onchart": [],
    "offchart": [],
    "views": { ... }
  },
  "2h": { ... },
  "4h": { ... }
}
```

### OHLCV Candles

```
[timestamp, open, high, low, close, volume]
```

Timestamps are Unix milliseconds, ascending, no duplicates. When a view is applied, the array extends to:

```
[timestamp, open, high, low, close, volume, color, below, above]
```

Indices 6/7/8 are set by the view system at runtime (not in the source JSON).

### Onchart / Offchart Overlays

```json
{
  "name": "Volume",
  "type": "Histogram",
  "data": [[timestamp, value], ...],
  "settings": { ... }
}
```

`onchart` overlays render on the price chart. `offchart` overlays render in separate panes below.

### Views

The `views` object defines per-candle coloring and marker overlays. Each key is a view name:

```json
{
  "views": {
    "View Name": {
      "colors": ["#9FB4B4", "#FF0000", ...],
      "below": [...],
      "above": [...],
      "offchart": [...]
    }
  }
}
```

| Field | Description |
|-------|-------------|
| `colors` | Array of hex color strings, one per candle. Applied to OHLCV index 6. |
| `below` | Markers rendered below candles (index 7). See formats below. |
| `above` | Markers rendered above candles (index 8). See formats below. |
| `offchart` | Array of overlay objects shown only when this view is active. |

All fields are optional. A view can have any combination.

**Below/above marker formats:**

Simple array (default marker color):
```json
"below": ["", "", "o", "", "x", ...]
```

Extended object (custom color):
```json
"below": { "values": ["", "", "o", "", ...], "color": "#FF0000" }
```

Empty strings mean no marker. Non-empty strings are rendered as marker symbols.

## Overlay Types

| Type | Settings | Description |
|------|----------|-------------|
| Histogram | `colorUp`, `colorDown`, `baseline` | Colored bars above/below baseline |
| Spline | `color`, `lineWidth` | Continuous line |
| Bar | `colorUp`, `colorDown`, `baseline`, `barWidth` | Width-configurable bars |
| Candles | *(default)* | OHLCV candlesticks (chart type) |

### Settings Reference

| Setting | Type | Example | Used by |
|---------|------|---------|---------|
| `colorUp` | hex string | `"#00E676"` | Histogram, Bar |
| `colorDown` | hex string | `"#FF1744"` | Histogram, Bar |
| `baseline` | number | `0` | Histogram, Bar |
| `color` | hex string | `"#2196F3"` | Spline |
| `lineWidth` | number | `1`, `2` | Spline |
| `barWidth` | number | `0.6` | Bar |

## Persistent Indicators

`indicators.json` is loaded separately and auto-clipped to the chart's date range. It is excluded from the file selector.

```json
{
  "1h": {
    "indicators": [
      {
        "name": "RSI",
        "group": "Swing RSI",
        "type": "Histogram",
        "data": [[timestamp, value], ...],
        "settings": {
          "colorUp": "#00E676",
          "colorDown": "#FF1744",
          "baseline": 50
        }
      }
    ]
  }
}
```

Each timeframe key contains an `indicators` array. Indicators have `name`, `type`, `group`, `data`, and `settings`. The `group` field controls accordion grouping in the UI.

## Dev Server Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/data/{file}` | GET | Serve JSON file from `/data/` |
| `/data-files` | GET | List available JSON files (excludes `indicators.json` and `bak*` files) |
| `/debug?argv=[]` | GET | Debug logging (requires `MOB_DEBUG=true`) |

## localStorage

Single key: `trading-vue-state`

| Field | Type | Description |
|-------|------|-------------|
| `selectedDataFile` | string | Last opened data file |
| `selectedView` | string | Last selected view name |
| `log_scale` | boolean | Logarithmic price scale |
| `indicatorVisibility` | object | View indicator show/hide state |
| `indicatorSettings` | object | Per-indicator type and visual settings (colors, baseline, etc.) |
| `persistentIndicatorVisibility` | object | Show/hide state for persistent indicators |
| `accordionExpandedViews` | object | Expanded/collapsed state of indicator groups |

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `MOB_DEBUG` | `false` | Route console output to `/debug` endpoint |

## License

MIT
