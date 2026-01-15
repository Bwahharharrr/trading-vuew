# Data Format Specification

## Quick Reference

```
ROOT (single-tf)     ROOT (multi-tf)
├─ chart {}          ├─ "<tf>" {}
├─ onchart []        │   ├─ chart {}
├─ offchart []       │   ├─ onchart []
└─ views {}          │   ├─ offchart []
                     │   └─ views {}
                     └─ "<tf>" {} ...
```

**Data requirements**: Sorted ascending by timestamp. No duplicate timestamps in OHLCV.

---

## Schema

### Root Structure

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `chart` | Object | Yes | Main candlestick data |
| `onchart` | Array | No | Overlays on price chart (always visible) |
| `offchart` | Array | No | Indicators below chart (always visible) |
| `views` | Object | No | Switchable view presets |

For multi-timeframe: wrap in `{ "<tf>": { chart, onchart, offchart, views }, ... }`

### chart Object

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `type` | String | No | `"Candles"` | `"Candles"` or `"Spline"` |
| `data` | Array | Yes | - | OHLCV array |
| `tf` | String | No | - | Timeframe hint |
| `indexBased` | Boolean | No | `false` | Index-based rendering |
| `grid.logScale` | Boolean | No | `false` | Logarithmic scale |

**OHLCV format**: `[timestamp_ms, open, high, low, close, volume]`

### views Object

```js
"views": {
    "<view_name>": {
        "colors": ["#hex", ...],        // Per-candle colors (index 6)
        "below": [...] | {values, color}, // Below markers (index 7)
        "above": [...] | {values, color}, // Above markers (index 8)
        "offchart": [...]               // View-specific indicators
    }
}
```

**Marker formats**:
- Simple: `["", "o", "x", ...]` (default colors: below=#00FF00, above=#FF0000)
- Extended: `{ "values": ["", "o", ...], "color": "#hex" }`

### Overlay Object (onchart/offchart items)

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | String | Yes | Display name |
| `type` | String | Yes | Overlay type (see below) |
| `data` | Array | Yes | `[[timestamp, value, ...], ...]` |
| `settings` | Object | No | Type-specific settings |

---

## Overlay Types

### Spline
Line chart. Data: `[[ts, value], ...]`
```js
{ "color": "#42b28a", "lineWidth": 0.75, "dataIndex": 1, "skipNaN": false }
```

### Histogram
Vertical bars. Data: `[[ts, value], ...]`
```js
{ "colorUp": "#26A69A", "colorDown": "#EF5350", "baseline": 0, "dataIndex": 1 }
```

### Bar
Discrete bars. Data: `[[ts, value], ...]`
```js
{ "colorUp": "#612ff9", "colorDown": "#EF5350", "baseline": 0, "barWidth": 0.4 }
```

### StepLine
Step function. Data: `[[ts, value], ...]`
```js
{ "color": "#42b28a", "lineWidth": 1.5 }
```

### Channel
Bands with fill. Data: `[[ts, mid, lower, upper], ...]`
```js
{ "color": "#42b28a", "lineWidth": 0.75, "showMid": true, "backColor": "#42b28a11" }
```

### Range
Line with horizontal bands. Data: `[[ts, value], ...]`
```js
{ "color": "#ec206e", "lineWidth": 0.75, "upper": 70, "lower": 30, "bandColor": "#ddd", "backColor": "#381e9c16" }
```

### Splines
Multiple lines. Data: `[[ts, val1, val2, ...], ...]`
```js
{ "colors": ["#42b28a", "#5691ce"], "lineWidth": 0.75, "lineWidths": [1.0, 0.5], "skipNaN": false }
```

### Splitters
Vertical markers. Data: `[[ts, "label"], ...]`
```js
{ "flagColor": "#4285f4", "labelColor": "#fff", "lineColor": "#4285f4", "lineWidth": 1.0, "yPosition": 0.9 }
```

### Trades
Buy/sell markers. Data: `[[ts, price, side, label], ...]` (side: 1=buy, -1=sell)
```js
{ "buyColor": "#63df89", "sellColor": "#ec4662", "markerSize": 5, "showLabel": true, "labelColor": "#999" }
```

### Volume
Volume bars. Data: `[]` (uses main OHLCV)
```js
{ "colorVolUp": "#23a77688", "colorVolDw": "#e5415088", "volscale": 0.85 }
```

### MACD
Data: `[[ts, histogram, macd, signal], ...]`
```js
{ "macdColor": "#3782f2", "signalColor": "#f48709", "histWidth": 4, "macdWidth": 1, "signalWidth": 1 }
```

### Stoch
Data: `[[ts, k, d], ...]`
```js
{ "kColor": "#3782f2", "dColor": "#f48709", "lineWidth": 0.75, "upper": 80, "lower": 20 }
```

### Ichimoku
Data: `[[ts, tenkan, kijun, spanA, spanB, chikou], ...]`
```js
{ "tenkan-color": "#0496ff", "kijun-color": "#991515", "senkou_spanA_color": "#00897b", "senkou_spanB_color": "#880e4f", "chinkou_color": "#2c693f", "kumo_up_color": "#00897b20", "kumo_down_color": "#880e4f20" }
```

### LongShortTrades
Data: `[[ts, price, type], ...]` (type: 1=long entry, 2=long exit, 3=short entry, 4=short exit)
```js
{ "longColor": "#42b28a", "shortColor": "#ec4662", "markerSize": 5, "showLabel": true, "currency": "$" }
```

### Area51
Filled area. Data: `[[ts, value], ...]`
```js
{ "color": "#42b28a", "lineWidth": 1, "back1": "#42b28a30", "back2": "#ec466230" }
```

---

## Timeframe Strings

`1s`, `5s`, `30s`, `1m`, `5m`, `15m`, `30m`, `1H`, `2H`, `4H`, `12H`, `1D`, `1W`, `1M`, `1Y`

Or milliseconds: `60000` = 1 minute

---

## Complete Example

```json
{
    "1h": {
        "chart": {
            "type": "Candles",
            "data": [
                [1766275200000, 88463, 88536, 88393, 88475, 8.7],
                [1766278800000, 88474, 88474, 88118, 88125, 37.3]
            ]
        },
        "onchart": [
            {
                "name": "EMA 20",
                "type": "Spline",
                "data": [[1766275200000, 88400], [1766278800000, 88350]],
                "settings": { "color": "#FF9800", "lineWidth": 2 }
            }
        ],
        "offchart": [
            {
                "name": "Volume",
                "type": "Histogram",
                "data": [[1766275200000, 8.7], [1766278800000, 37.3]],
                "settings": { "colorUp": "#26A69A", "colorDown": "#EF5350" }
            }
        ],
        "views": {
            "SCMR": {
                "colors": ["#9FB4B4", "#FF0000"],
                "below": ["", "o"],
                "above": ["", ""],
                "offchart": [
                    {
                        "name": "Score",
                        "type": "Histogram",
                        "data": [[1766275200000, 0.5], [1766278800000, -0.3]],
                        "settings": { "colorUp": "#26A69A", "colorDown": "#EF5350" }
                    }
                ]
            }
        }
    }
}
```
