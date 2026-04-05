// WebSocket live feed manager — connects to quant-buffers LiveFeedServer
// and pipes real-time candle/alert updates into the Trading-Vue DataCube.

export default {
    data() {
        return {
            ws: null,
            wsConnected: false,
            wsReconnectTimer: null,
            wsReconnectDelay: 1000,
            // Proxy through webpack-dev-server so no extra port needs exposing
            wsUrl: `ws://${window.location.host}/live-ws`,

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
            if (url) this.wsUrl = url
            if (this.ws) this.wsDisconnect()

            console.log('[WS] Connecting to:', this.wsUrl)
            try {
                this.ws = new WebSocket(this.wsUrl)
            } catch (e) {
                console.error('[WS] Failed to create WebSocket:', e)
                this._wsScheduleReconnect()
                return
            }

            this.ws.onopen = () => {
                console.log('[WS] Connected to', this.wsUrl)
                this.wsConnected = true
                this.wsReconnectDelay = 1000 // Reset backoff
            }

            this.ws.onmessage = (event) => {
                try {
                    const msg = JSON.parse(event.data)
                    this._wsOnMessage(msg)
                } catch (e) {
                    console.error('[WS] Message handler error:', e)
                }
            }

            this.ws.onclose = () => {
                console.log('[WS] Disconnected')
                this.wsConnected = false
                this._wsScheduleReconnect()
            }

            this.ws.onerror = (err) => {
                console.warn('[WS] Error:', err)
            }
        },

        wsDisconnect() {
            if (this.wsReconnectTimer) {
                clearTimeout(this.wsReconnectTimer)
                this.wsReconnectTimer = null
            }
            if (this.ws) {
                this.ws.onclose = null // Prevent reconnect on intentional close
                this.ws.close()
                this.ws = null
            }
            this.wsConnected = false
        },

        _wsScheduleReconnect() {
            if (this.wsReconnectTimer) return
            const delay = Math.min(this.wsReconnectDelay, 30000)
            console.log(`[WS] Reconnecting in ${delay}ms...`)
            this.wsReconnectTimer = setTimeout(() => {
                this.wsReconnectTimer = null
                this.wsReconnectDelay = Math.min(this.wsReconnectDelay * 2, 30000)
                this.wsConnect()
            }, delay)
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
            const candle = msg.data // [ts, o, h, l, c, v]
            if (!candle || candle.length < 6) return
            if (!this.chart || !this.originalChartData) return
            if (!this.originalChartData.length) return

            const ts = candle[0]
            const chartData = this.chart.data.chart.data
            if (!chartData || !chartData.length) return

            const lastChartTs = chartData[chartData.length - 1][0]

            // Reject candles older than loaded data
            if (ts < lastChartTs) return

            // Determine which color to use based on active file
            let color = ''
            const file = this.currentDataFile || ''
            if (file.includes('data_alerts')) {
                color = msg.alert_color || ''
            } else if (file.includes('data.json') || file.includes('data_scorers')) {
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
            this.chart.update({ candle: dcCandle })
        },

        _wsHandleAlert(msg) {
            if (!this.chart) return

            // Store alert
            if (msg.alert) {
                this.liveAlerts.push(msg.alert)
            }

            // Merge zones into onchart Zones overlay
            if (msg.zones && msg.zones.length > 0) {
                this.liveZones.push(...msg.zones)

                // Find existing Zones overlay or create one
                const onchart = this.chart.data.onchart
                let zonesOv = onchart.find(o => o.type === 'Zones')
                if (zonesOv) {
                    // Append new zones
                    zonesOv.data.push(...msg.zones)
                    // Also update settings.zones for zones that span beyond view
                    if (zonesOv.settings && zonesOv.settings.zones) {
                        // Convert TV data format [x1,y1,y2,x2,color] to settings format [x1,y1,x2,y2,color]
                        for (const z of msg.zones) {
                            zonesOv.settings.zones.push([z[0], z[1], z[3], z[2], z[4]])
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
            }

            // Recolor the alert's candle if viewing data_alerts
            if (msg.candle_alert_color && msg.alert && msg.alert.timestamp) {
                const alertTs = msg.alert.timestamp

                // Update accumulated alert color
                for (let i = 0; i < this.liveAlertColors.length; i++) {
                    const ci = this.liveDataStartIdx + i
                    if (ci >= 0 && ci < this.originalChartData.length) {
                        if (this.originalChartData[ci][0] === alertTs) {
                            this.liveAlertColors[i] = msg.candle_alert_color
                            break
                        }
                    }
                }

                // If viewing alerts file, recolor the candle in the DataCube
                const file = this.currentDataFile || ''
                if (file.includes('data_alerts')) {
                    const chartData = this.chart.data.chart.data
                    for (let i = chartData.length - 1; i >= 0; i--) {
                        if (chartData[i][0] === alertTs) {
                            while (chartData[i].length < 9) chartData[i].push('')
                            chartData[i][6] = msg.candle_alert_color
                            break
                        }
                    }
                }
            }
        },

        _wsHandleSnapshot(msg) {
            const nc = msg.candles ? msg.candles.length : 0
            const na = msg.alerts ? msg.alerts.length : 0
            const nz = msg.zones ? msg.zones.length : 0
            console.log(`[WS] Snapshot: ${nc} candles, ${na} alerts, ${nz} zones (stored, not applied)`)

            // Store snapshot data — these will be used by incremental handlers
            this.liveScmrColors = msg.scmr_colors || []
            this.liveAlertColors = msg.alert_colors || []
            this.liveAlerts = msg.alerts || []
            this.liveZones = msg.zones || []

            // Don't mutate chart data from snapshot — just store the state.
            // Incremental candle/alert messages will append new data as it arrives.
        },

        // Called when view changes — extends applyCurrentColoring with live data
        _wsApplyLiveColors() {
            if (this.liveDataStartIdx < 0 || !this.chart) return

            const file = this.currentDataFile || ''
            const useAlertColors = file.includes('data_alerts')
            const chartData = this.chart.data.chart.data
            const colors = useAlertColors ? this.liveAlertColors : this.liveScmrColors

            for (let i = 0; i < colors.length; i++) {
                const ci = this.liveDataStartIdx + i
                if (ci >= 0 && ci < chartData.length) {
                    while (chartData[ci].length < 9) chartData[ci].push('')
                    chartData[ci][6] = colors[i] || ''
                }
            }
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
    },

    beforeUnmount() {
        this.wsDisconnect()
    }
}
