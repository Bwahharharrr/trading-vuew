// WebSocket live feed manager — connects to whichever quant-buffers
// LiveFeedServer corresponds to the currently-loaded chart file (driven
// by file-manager's currentFileMeta). Filters every incoming message by
// identity to defend against any cross-talk. A connection-generation
// counter prevents stale callbacks (from a closed socket) from mutating
// state belonging to the new connection.

import { buildWsUrl, classifyDataFile, msgMatchesMeta } from '../../helpers/ws-helpers.js'
import { validateCandle } from '../../helpers/schema/validate.js'
import { report } from '../../helpers/schema/diagnostics.js'

export default {
    data() {
        return {
            ws: null,
            wsConnected: false,
            wsReconnectTimer: null,
            wsReconnectDelay: 1000,
            // URL is derived from currentFileMeta; no static default.
            wsUrl: null,
            // Monotonic counter incremented on every wsConnect call. All
            // callbacks attached to a socket capture the value at attach
            // time and bail if it no longer matches — prevents a stale
            // close/reconnect from interfering after a file switch.
            _wsGen: 0,

            // Accumulated live data (survives view switches)
            liveScmrColors: [],
            liveAlertColors: [],
            liveZones: [],
            liveAlerts: [],

            // Index where live data starts in originalChartData
            liveDataStartIdx: -1,
        }
    },
    methods: {
        wsConnect(url) {
            if (this.ws) this.wsDisconnect()
            if (url) this.wsUrl = url
            if (!this.wsUrl) {
                console.log('[WS] No URL — not connecting')
                return
            }
            // Bump generation BEFORE attaching handlers; capture below.
            const myGen = ++this._wsGen

            console.log('[WS] Connecting to:', this.wsUrl, 'gen:', myGen)
            try {
                this.ws = new WebSocket(this.wsUrl)
            } catch (e) {
                console.error('[WS] Failed to create WebSocket:', e)
                this._wsScheduleReconnect(myGen)
                return
            }

            this.ws.onopen = () => {
                if (this._wsGen !== myGen) return  // stale
                console.log('[WS] Connected to', this.wsUrl)
                this.wsConnected = true
                this.wsReconnectDelay = 1000 // Reset backoff
                // Signal the preboot WebSocket wrap to start filtering
                // dev-server reload messages while the live feed is active.
                window.__tvw_wsConnected = true
            }

            this.ws.onmessage = (event) => {
                if (this._wsGen !== myGen) return  // stale
                try {
                    const msg = JSON.parse(event.data)
                    this._wsOnMessage(msg)
                } catch (e) {
                    console.error('[WS] Message handler error:', e)
                }
            }

            this.ws.onclose = () => {
                if (this._wsGen !== myGen) return  // stale (we already moved on)
                console.log('[WS] Disconnected')
                this.wsConnected = false
                window.__tvw_wsConnected = false
                this._wsScheduleReconnect(myGen)
            }

            this.ws.onerror = (err) => {
                if (this._wsGen !== myGen) return  // stale
                console.warn('[WS] Error:', err)
            }
        },

        wsDisconnect() {
            // Bump generation so any in-flight callbacks from the prior socket
            // bail. Also clears any scheduled reconnect tied to that gen.
            this._wsGen++
            if (this.wsReconnectTimer) {
                clearTimeout(this.wsReconnectTimer)
                this.wsReconnectTimer = null
            }
            if (this.ws) {
                this.ws.onclose = null // Belt-and-braces (also guarded by gen check)
                this.ws.close()
                this.ws = null
            }
            this.wsConnected = false
            window.__tvw_wsConnected = false
        },

        _wsScheduleReconnect(originatingGen) {
            if (this.wsReconnectTimer) return
            // Bail if we've moved on (file switch invalidated this conn).
            if (originatingGen !== undefined && originatingGen !== this._wsGen) return
            const delay = Math.min(this.wsReconnectDelay, 30000)
            console.log(`[WS] Reconnecting in ${delay}ms...`)
            this.wsReconnectTimer = setTimeout(() => {
                this.wsReconnectTimer = null
                this.wsReconnectDelay = Math.min(this.wsReconnectDelay * 2, 30000)
                // Last-check: if generation changed during the wait, don't reconnect.
                if (originatingGen !== undefined && originatingGen !== this._wsGen) return
                this.wsConnect()
            }, delay)
        },

        // Thin wrappers over the pure helpers in ../../helpers/ws-helpers.js
        // (kept as instance methods so the existing call sites read
        //  cleanly; the helpers are independently unit-tested).
        _wsMsgMatchesCurrentFile(msg) {
            return msgMatchesMeta(msg, this.currentFileMeta)
        },
        _wsBuildUrl(meta) {
            return buildWsUrl(
                meta,
                window.location.protocol,
                window.location.hostname,
                window.location.port,
            )
        },

        _wsOnMessage(msg) {
            console.log('[WS] msg:', msg.type, msg.type === 'candle' ? msg.data : '')
            switch (msg.type) {
                case 'candle':
                    this._wsHandleCandle(msg)
                    break
                case 'alert':
                    this._wsHandleAlert(msg)
                    break
                case 'snapshot':
                    this._wsHandleSnapshot(msg)
                    break
            }
        },

        _wsHandleCandle(msg) {
            // Identity filter — drop cross-talk before touching any state
            if (!this._wsMsgMatchesCurrentFile(msg)) return

            const candle = msg.data // [ts, o, h, l, c, v]

            // Surface a typed diagnostic for a malformed live candle instead of
            // dropping it silently. Shape-only (ordering is handled below by the
            // lastChartTs check + the same-ts in-place update path). Respects the
            // DataCube's `validation` mode; default 'warn' is non-breaking.
            const vmode = (this.chart && this.chart.sett && this.chart.sett.validation) || 'warn'
            if (vmode !== 'off') {
                const out = []
                validateCandle(candle, 'live-feed candle', out)
                if (out.length) report(out, vmode === 'strict' ? 'warn' : vmode, 'live candle')
            }

            if (!candle || candle.length < 6) return
            if (!this.chart || !this.originalChartData) return
            if (!this.originalChartData.length) return

            const ts = candle[0]
            const chartData = this.chart.data.chart.data
            if (!chartData || !chartData.length) return

            const lastChartTs = chartData[chartData.length - 1][0]

            // Reject candles older than loaded data
            if (ts < lastChartTs) return

            // Determine which color to use based on active file. The string
            // patterns we used to match here ('data_alerts', 'data.json',
            // 'data_scorers') predate the per-identity rename — a file like
            // 'data_bitfinex_tBTCUSD_1m.json' matches NONE of them, so the
            // live candle inherited the trading-vue OHLC default (green/red)
            // instead of the SCMR colour. classifyDataFile handles both
            // legacy and per-identity names.
            let color = ''
            const kind = classifyDataFile(this.currentDataFile)
            if (kind === 'alert') {
                color = msg.alert_color || ''
            } else if (kind === 'scmr') {
                color = msg.scmr_color || ''
            }

            // Build the 9-element candle with color
            const dcCandle = [...candle]
            while (dcCandle.length < 9) dcCandle.push('')
            dcCandle[6] = color

            // Check if this is a large time gap (loaded data too old for live)
            const gap = ts - lastChartTs
            const tf = this.$refs.tradingVue?.$refs?.chart?.interval_ms || 3600000
            const isLargeGap = ts !== lastChartTs && gap > tf * 200

            // Update originalChartData (pristine OHLCV)
            const lastOrig = this.originalChartData[this.originalChartData.length - 1]
            if (lastOrig && lastOrig[0] === ts) {
                for (let i = 1; i < 6; i++) lastOrig[i] = candle[i]
                const ci = this.liveScmrColors.length - 1
                if (ci >= 0) this.liveScmrColors[ci] = msg.scmr_color || ''
            } else if (!isLargeGap) {
                if (this.liveDataStartIdx < 0) {
                    this.liveDataStartIdx = this.originalChartData.length
                }
                this.originalChartData.push([...candle])
                this.liveScmrColors.push(msg.scmr_color || '')
                this.liveAlertColors.push(msg.alert_color || '')
            }

            if (isLargeGap) {
                // Large gap — don't append, would cause blank chart.
                // The user should reload the page after charts are regenerated.
                return
            }

            // Use dc.update() for proper render cycle (AggTool batching + re-draw).
            // For same-timestamp updates, fast_merge replaces in-place (no scroll).
            // For new candles, fast_merge appends and auto-scrolls.
            // fast_merge() calls touchData() which propagates through
            // Chart.dataHashKey / Grid.dataKey to trigger the redraw.
            this.chart.update({ candle: dcCandle })
        },

        _wsHandleAlert(msg) {
            // Identity filter — drop cross-talk before touching any state
            if (!this._wsMsgMatchesCurrentFile(msg)) return

            if (!this.chart) return

            // Always accumulate alert + zones into the in-memory state, even
            // if the SCMR file is currently loaded. The accumulators don't
            // touch the visible chart — they only mutate liveAlerts/liveZones
            // for potential future use. The chart itself is only mutated
            // when the loaded file is an alerts file (below).
            // Cap the standalone accumulators so a long-running session can't
            // grow them without bound (they're only otherwise cleared on file
            // switch). These arrays aren't index-aligned to chartData, so
            // dropping the oldest entries is safe and preserves ordering.
            const MAX_LIVE = 10000
            if (msg.alert) {
                this.liveAlerts.push(msg.alert)
                if (this.liveAlerts.length > MAX_LIVE) {
                    this.liveAlerts.splice(0, this.liveAlerts.length - MAX_LIVE)
                }
            }
            if (msg.zones && msg.zones.length > 0) {
                this.liveZones.push(...msg.zones)
                if (this.liveZones.length > MAX_LIVE) {
                    this.liveZones.splice(0, this.liveZones.length - MAX_LIVE)
                }
            }

            const onAlertsFile = classifyDataFile(this.currentDataFile) === 'alert'

            // Render zones into the chart's onchart overlay ONLY when the
            // loaded file is an alerts file. Previously this happened
            // unconditionally, so zone blocks bled onto the SCMR view.
            if (onAlertsFile && msg.zones && msg.zones.length > 0) {
                const onchart = this.chart.data.onchart
                let zonesOv = onchart.find(o => o.type === 'Zones')
                if (zonesOv) {
                    // Append new zones (capped like liveAlerts/liveZones — a
                    // long session otherwise grows the overlay + its per-frame
                    // render cost without bound)
                    zonesOv.data.push(...msg.zones)
                    if (zonesOv.data.length > MAX_LIVE) {
                        zonesOv.data.splice(0, zonesOv.data.length - MAX_LIVE)
                    }
                    // Also update settings.zones for zones that span beyond view
                    if (zonesOv.settings && zonesOv.settings.zones) {
                        // Convert TV data format [x1,y1,y2,x2,color] to settings format [x1,y1,x2,y2,color]
                        for (const z of msg.zones) {
                            zonesOv.settings.zones.push([z[0], z[1], z[3], z[2], z[4]])
                        }
                        if (zonesOv.settings.zones.length > MAX_LIVE) {
                            zonesOv.settings.zones.splice(0, zonesOv.settings.zones.length - MAX_LIVE)
                        }
                    }
                } else {
                    // Create Zones overlay
                    this.chart.add('onchart', {
                        name: 'Zones',
                        type: 'Zones',
                        data: [...msg.zones],
                        settings: {
                            zones: msg.zones.map(z => [z[0], z[1], z[3], z[2], z[4]])
                        }
                    })
                }
                this.chart.touchData()
            }

            // Always update the liveAlertColors accumulator so a future
            // switch to the alerts file gets the correct historical colour.
            if (msg.candle_alert_color && msg.alert && msg.alert.timestamp) {
                const alertTs = msg.alert.timestamp

                for (let i = 0; i < this.liveAlertColors.length; i++) {
                    const ci = this.liveDataStartIdx + i
                    if (ci >= 0 && ci < this.originalChartData.length) {
                        if (this.originalChartData[ci][0] === alertTs) {
                            this.liveAlertColors[i] = msg.candle_alert_color
                            break
                        }
                    }
                }

                // Recolour the alert's candle in the DataCube ONLY when the
                // alerts file is loaded.
                if (onAlertsFile) {
                    const chartData = this.chart.data.chart.data
                    for (let i = chartData.length - 1; i >= 0; i--) {
                        if (chartData[i][0] === alertTs) {
                            while (chartData[i].length < 9) chartData[i].push('')
                            chartData[i][6] = msg.candle_alert_color
                            this.chart.touchData()
                            break
                        }
                    }
                }
            }
        },

        _wsHandleSnapshot(msg) {
            // Identity filter — must happen BEFORE mutating any state.
            // A stale snapshot mid-switch would otherwise corrupt the new
            // file's live arrays.
            if (!this._wsMsgMatchesCurrentFile(msg)) return

            const nc = msg.candles ? msg.candles.length : 0
            const na = msg.alerts ? msg.alerts.length : 0
            const nz = msg.zones ? msg.zones.length : 0
            console.log(`[WS] Snapshot: ${nc} candles, ${na} alerts, ${nz} zones (stored, not applied)`)

            // Store snapshot data — these will be used by incremental handlers.
            // The color arrays are documented as index-aligned to
            // originalChartData[liveDataStartIdx + i] (push-paired in
            // _wsHandleCandle). A snapshot replaces them with server arrays of
            // arbitrary length, so the old boundary is meaningless — reset it,
            // or _wsApplyLiveColors / the same-ts write path would stamp the
            // snapshot colors onto the WRONG candles.
            this.liveScmrColors = msg.scmr_colors || []
            this.liveAlertColors = msg.alert_colors || []
            this.liveAlerts = msg.alerts || []
            this.liveZones = msg.zones || []
            this.liveDataStartIdx = -1

            // Don't mutate chart data from snapshot — just store the state.
            // Incremental candle/alert messages will append new data as it arrives.
        },

        // Called when view changes — extends applyCurrentColoring with live data
        _wsApplyLiveColors() {
            if (this.liveDataStartIdx < 0 || !this.chart) return

            // classifyDataFile handles both legacy and per-identity names —
            // see _wsHandleCandle for context.
            const useAlertColors = classifyDataFile(this.currentDataFile) === 'alert'
            const chartData = this.chart.data.chart.data
            const colors = useAlertColors ? this.liveAlertColors : this.liveScmrColors

            let touched = false
            for (let i = 0; i < colors.length; i++) {
                const ci = this.liveDataStartIdx + i
                if (ci >= 0 && ci < chartData.length) {
                    while (chartData[ci].length < 9) chartData[ci].push('')
                    chartData[ci][6] = colors[i] || ''
                    touched = true
                }
            }
            if (touched) this.chart.touchData()
        },
    },

    watch: {
        // Re-apply live colors when the displayed view changes
        displayedView() {
            this.$nextTick(() => this._wsApplyLiveColors())
        },
        // Re-apply when file changes
        currentDataFile() {
            // Reset live tracking when switching files
            this.liveDataStartIdx = -1
            this.liveScmrColors = []
            this.liveAlertColors = []
            this.liveZones = []
            this.liveAlerts = []
        },
        // The loaded file's _meta is the source of truth for WS connection.
        // Null → disconnect (legacy or static file with no live feed).
        // Non-null with valid ws.port → reconnect to the new URL.
        //
        // CRITICAL: dedup by identity tuple, not reference equality.
        // onFileSelected reassigns currentFileMeta to a fresh object on every
        // fetch (JSON.parse always returns new objects), so a same-file
        // refresh would otherwise tear down a working WS and reconnect —
        // observed as "WebSocket is closed before the connection is
        // established" on the FE side and "EOFError: stream ends after 0
        // bytes" handshake-failed tracebacks on the backend side.
        currentFileMeta(newMeta, oldMeta) {
            const sameIdentity = (
                !!newMeta && !!oldMeta &&
                newMeta.exchange === oldMeta.exchange &&
                newMeta.ticker === oldMeta.ticker &&
                newMeta.tf === oldMeta.tf &&
                (newMeta.instance_id || '') === (oldMeta.instance_id || '') &&
                newMeta.ws && oldMeta.ws &&
                newMeta.ws.port === oldMeta.ws.port &&
                (newMeta.ws.host || '') === (oldMeta.ws.host || '') &&
                (newMeta.ws.path || '/') === (oldMeta.ws.path || '/')
            )
            if (sameIdentity && this.wsConnected) {
                // Identical identity, WS already open — nothing to do.
                return
            }
            const url = this._wsBuildUrl(newMeta)
            if (!url) {
                if (this.ws || this.wsReconnectTimer) this.wsDisconnect()
                return
            }
            // wsConnect handles the disconnect-of-prior-socket internally.
            this.wsConnect(url)
        },
    },

    beforeUnmount() {
        this.wsDisconnect()
    }
}
