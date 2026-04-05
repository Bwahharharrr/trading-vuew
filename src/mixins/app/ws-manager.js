// WebSocket live feed manager — connects to quant-buffers LiveFeedServer
// and pipes real-time candle/alert updates into the Trading-Vue DataCube.

export default {
    data() {
        return {
            ws: null,
            wsConnected: false,
            wsReconnectTimer: null,
            wsReconnectDelay: 1000,
            wsUrl: 'ws://localhost:8765',

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

            try {
                this.ws = new WebSocket(this.wsUrl)
            } catch (e) {
                console.warn('[WS] Failed to create WebSocket:', e)
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
                    console.warn('[WS] Bad message:', e)
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

            const ts = candle[0]

            // 1. Update originalChartData (pristine OHLCV — no colors)
            const lastOrig = this.originalChartData[this.originalChartData.length - 1]
            if (lastOrig && lastOrig[0] === ts) {
                // Update existing candle in-place
                for (let i = 1; i < 6; i++) lastOrig[i] = candle[i]
                // Update corresponding color arrays (same index)
                const ci = this.liveScmrColors.length - 1
                if (ci >= 0) {
                    this.liveScmrColors[ci] = msg.scmr_color || ''
                    // Don't overwrite alert color here — alerts handle their own coloring
                }
            } else {
                // Append new candle
                if (this.liveDataStartIdx < 0) {
                    this.liveDataStartIdx = this.originalChartData.length
                }
                this.originalChartData.push([...candle])
                this.liveScmrColors.push(msg.scmr_color || '')
                this.liveAlertColors.push(msg.alert_color || '')
            }

            // 2. Determine which color to use based on active file
            let color = ''
            const file = this.currentDataFile || ''
            if (file.includes('data_alerts')) {
                color = msg.alert_color || ''
            } else if (file.includes('data.json') || file.includes('data_scorers')) {
                color = msg.scmr_color || ''
            }

            // 3. Push to DataCube with color at index 6
            const dcCandle = [...candle]
            while (dcCandle.length < 9) dcCandle.push('')
            dcCandle[6] = color

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
            if (!msg.candles || !msg.candles.length) return
            console.log(`[WS] Snapshot: ${msg.candles.length} candles, ${msg.alerts.length} alerts, ${msg.zones.length} zones`)

            // Store snapshot data for use when files are loaded
            this.liveScmrColors = msg.scmr_colors || []
            this.liveAlertColors = msg.alert_colors || []
            this.liveAlerts = msg.alerts || []
            this.liveZones = msg.zones || []

            if (!this.chart || !this.originalChartData) return

            // Determine overlap: find where snapshot candles extend beyond loaded data
            const lastLoadedTs = this.originalChartData.length > 0
                ? this.originalChartData[this.originalChartData.length - 1][0]
                : 0

            let appendFrom = 0
            for (let i = 0; i < msg.candles.length; i++) {
                if (msg.candles[i][0] > lastLoadedTs) {
                    appendFrom = i
                    break
                }
                if (i === msg.candles.length - 1) {
                    // All snapshot candles are within loaded range — update last candle
                    appendFrom = msg.candles.length
                }
            }

            if (appendFrom < msg.candles.length) {
                this.liveDataStartIdx = this.originalChartData.length
                const file = this.currentDataFile || ''
                const useAlertColors = file.includes('data_alerts')

                for (let i = appendFrom; i < msg.candles.length; i++) {
                    const candle = msg.candles[i]
                    this.originalChartData.push([...candle])

                    // Push to DataCube with color
                    const dcCandle = [...candle]
                    while (dcCandle.length < 9) dcCandle.push('')
                    if (useAlertColors && i < this.liveAlertColors.length) {
                        dcCandle[6] = this.liveAlertColors[i] || ''
                    } else if (i < this.liveScmrColors.length) {
                        dcCandle[6] = this.liveScmrColors[i] || ''
                    }
                    this.chart.update({ candle: dcCandle })
                }

                // Merge zones
                if (this.liveZones.length > 0) {
                    const onchart = this.chart.data.onchart
                    let zonesOv = onchart.find(o => o.type === 'Zones')
                    if (zonesOv) {
                        zonesOv.data.push(...this.liveZones)
                    }
                }
            }
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
