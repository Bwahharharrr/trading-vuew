// Chart state mixin - handles chart initialization, timeframe selection, and layout

import Utils from '../../stuff/utils.js'

export default {
    data() {
        return {
            charts: {},
            currentTimeframe: null,
            selectedTimeframe: 0,
            log_scale: true,
            width: window.innerWidth,
            height: window.innerHeight,
            // Right-panel width: user-resizable via the panel's left-edge drag
            // handle; persisted (saveStateToStorage). Default a bit wider than
            // the old fixed RIGHTBAR=250.
            panelWidth: 300,
            config: {
                DEFAULT_LEN: 200,
                TB_BORDER: 5,
                CANDLEW: 0.9,
                GRIDX: 200,
                VOLSCALE: 0.1,
                RIGHTBAR: 250
            }
        }
    },
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
        },
        rightPanelWidth() {
            const w = Number(this.panelWidth)
            const min = 220
            const max = Math.max(min, Math.floor(this.width * 0.6))
            if (Number.isFinite(w)) return Math.min(max, Math.max(min, w))
            return this.config.RIGHTBAR || 250
        },
        chartWidth() {
            return this.width - this.rightPanelWidth
        },
        chartHeight() {
            return this.height - this.bottomPanelHeight
        },
        bottomPanelHeight() {
            return 44
        },
        timeframes() {
            return Object.keys(this.charts)
        }
    },
    methods: {
        onResize() {
            this.width = window.innerWidth
            this.height = window.innerHeight
        },

        // ── Right-panel resize (left-edge drag handle) ──────────────────────
        // Document-level listeners + body cursor, mirroring GridResizer.vue.
        startPanelResize(e) {
            this._panelResizing = true
            this._onPanelResizeMove = (ev) => {
                if (!this._panelResizing) return
                // Width = distance from the pointer to the right edge of the window.
                this.panelWidth = window.innerWidth - ev.clientX
            }
            this._onPanelResizeUp = () => this.endPanelResize()
            document.addEventListener('mousemove', this._onPanelResizeMove)
            document.addEventListener('mouseup', this._onPanelResizeUp)
            document.body.style.cursor = 'col-resize'
            document.body.style.userSelect = 'none'
            e.preventDefault()
        },
        endPanelResize() {
            if (!this._panelResizing) return
            this._panelResizing = false
            document.removeEventListener('mousemove', this._onPanelResizeMove)
            document.removeEventListener('mouseup', this._onPanelResizeUp)
            document.body.style.cursor = ''
            document.body.style.userSelect = ''
            // Clamp what we persist to what rightPanelWidth actually renders.
            this.panelWidth = this.rightPanelWidth
            if (typeof this.saveStateToStorage === 'function') this.saveStateToStorage()
        },

        resetView() {
            if (this.$refs.tradingVue) {
                this.$refs.tradingVue.resetChart()
            }
        },

        // ── Capture screen (bottom-panel 📷 button) ─────────────────────────
        // Screenshot the WHOLE browser view via the Screen Capture API: the
        // browser shows its capture picker (Chrome pre-selects "This Tab" via
        // preferCurrentTab), we grab ONE video frame onto a canvas, then save it
        // as a PNG — through a real "Save As" dialog where the File System
        // Access API exists, else a regular download. Cancelling either prompt
        // is a silent no-op. No DOM-walking/html2canvas: the picker frame is
        // pixel-exact for canvases, panels, and modals alike.
        async captureScreen() {
            // The Screen Capture API only exists on SECURE origins (https:// or
            // localhost). Served over plain http://<ip> (remote dev box), Chrome
            // doesn't even define navigator.mediaDevices — fall back to rendering
            // the page into a canvas with html2canvas (no permission needed).
            if (!navigator.mediaDevices || !navigator.mediaDevices.getDisplayMedia) {
                console.info('[capture] no Screen Capture API (insecure origin?) — using html2canvas fallback')
                return this._captureViaHtml2Canvas()
            }
            let stream = null
            try {
                stream = await navigator.mediaDevices.getDisplayMedia({
                    video: { displaySurface: 'browser' },
                    audio: false,
                    preferCurrentTab: true,        // Chrome: default the picker to this tab
                    selfBrowserSurface: 'include', // allow picking the tab that asked
                })
                const video = document.createElement('video')
                video.srcObject = stream
                video.muted = true
                await video.play()
                // Wait for a real decoded frame (not just metadata) so the canvas
                // isn't black; rVFC where supported, else a short settle.
                await new Promise((res) => {
                    if (typeof video.requestVideoFrameCallback === 'function') {
                        video.requestVideoFrameCallback(() => res())
                    } else {
                        setTimeout(res, 150)
                    }
                })
                const canvas = document.createElement('canvas')
                canvas.width = video.videoWidth
                canvas.height = video.videoHeight
                canvas.getContext('2d').drawImage(video, 0, 0)
                stream.getTracks().forEach((t) => t.stop()) // stop sharing immediately
                stream = null
                const blob = await new Promise((res) => canvas.toBlob(res, 'image/png'))
                if (blob) await this._saveScreenshot(blob, this.screenshotName())
            } catch (err) {
                // User dismissed the picker / save dialog → not an error.
                if (err && (err.name === 'NotAllowedError' || err.name === 'AbortError')) return
                console.warn('[capture] native capture failed, trying html2canvas:', err)
                return this._captureViaHtml2Canvas()
            } finally {
                if (stream) stream.getTracks().forEach((t) => t.stop())
            }
        },

        // Permission-free fallback: rasterize the page DOM (canvases included —
        // html2canvas drawImage's them) into one canvas. Lazy-imported so the
        // dependency never loads unless the fallback is actually taken.
        async _captureViaHtml2Canvas() {
            try {
                const { default: html2canvas } = await import('html2canvas')
                const canvas = await html2canvas(document.body, {
                    backgroundColor: '#131722',
                    scale: window.devicePixelRatio || 1,
                    logging: false,
                    width: window.innerWidth,
                    height: window.innerHeight,
                })
                const blob = await new Promise((res) => canvas.toBlob(res, 'image/png'))
                if (blob) await this._saveScreenshot(blob, this.screenshotName())
            } catch (err) {
                if (err && err.name === 'AbortError') return // save dialog dismissed
                console.error('[capture] html2canvas fallback failed:', err)
            }
        },

        // chart-BITFINEX-tBTCUSD-1m-2026-06-10_14-30-05.png (parts present only
        // when a gateway stream is active; always date-stamped, fs-safe).
        screenshotName(now = new Date()) {
            const cur = this.corkyCurrent
            const parts = ['chart']
            if (cur && cur.symbol) {
                if (cur.venue) parts.push(cur.venue)
                parts.push(cur.symbol)
                if (cur.timeframe) parts.push(cur.timeframe)
            }
            const p = (n) => String(n).padStart(2, '0')
            parts.push(`${now.getFullYear()}-${p(now.getMonth() + 1)}-${p(now.getDate())}` +
                `_${p(now.getHours())}-${p(now.getMinutes())}-${p(now.getSeconds())}`)
            return parts.join('-').replace(/[^\w.-]+/g, '_') + '.png'
        },

        // Save a PNG blob: real Save-As dialog (File System Access API) when the
        // browser has it; otherwise a download link (the browser's "ask where to
        // save each file" setting controls whether THAT prompts).
        async _saveScreenshot(blob, name) {
            if (typeof window.showSaveFilePicker === 'function') {
                const handle = await window.showSaveFilePicker({
                    suggestedName: name,
                    types: [{ description: 'PNG image', accept: { 'image/png': ['.png'] } }],
                })
                const w = await handle.createWritable()
                await w.write(blob)
                await w.close()
                return
            }
            const url = URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = name
            document.body.appendChild(a)
            a.click()
            a.remove()
            URL.revokeObjectURL(url)
        },

        selectTimeframe(tf, index) {
            this.selectedTimeframe = index
            const chartData = this.charts[tf]
            // Store original data for color scheme switching
            this.originalChartData = Utils.fastDeepCopy(chartData.chart.data)
            // Track current timeframe
            this.currentTimeframe = tf
            // Extract candle coloring options for this timeframe
            this.extractCandleColoringOptions(chartData, tf)

            // Determine displayedView based on selectedView availability
            const availableViews = this.candleColoringOptions.map(opt => opt.title)
            if (availableViews.includes(this.selectedView)) {
                // Selected view exists - use it
                this.displayedView = this.selectedView
            } else if (availableViews.length > 0) {
                // Fallback to first view for display only (keep selectedView unchanged)
                this.displayedView = availableViews[0]
            } else {
                this.displayedView = ''
            }

            // Create DataCube with views filtered out
            // Pass originalChartData to skip redundant chart.data copy (applyCurrentColoring overwrites it)
            this.chart = new this.DataCubeClass(this.prepareChartData(chartData, tf, this.originalChartData))
            // Apply displayed view and re-clip persistent indicators
            this.$nextTick(() => {
                this.clipPersistentIndicators()
                this.applyCurrentColoring()
            })
            // Force chart to redraw
            this.$nextTick(() => {
                if (this.$refs.tradingVue) {
                    this.$refs.tradingVue.resetChart()
                }
            })
        },

        initializeChart(data) {
            // Check if this is single-format (has chart.data array at root)
            if (data.chart && Array.isArray(data.chart.data)) {
                // Single-timeframe format (data.json style)
                this.charts = { 'default': data }
                this.currentTimeframe = 'default'
                this.selectedTimeframe = 0
                this.originalChartData = Utils.fastDeepCopy(data.chart.data)
                this.extractCandleColoringOptions(data, 'default')
                this.chart = new this.DataCubeClass(this.prepareChartData(data, 'default', this.originalChartData))
            } else {
                // Multi-timeframe format (data_tf.json style)
                this.charts = data
                const timeframes = Object.keys(data)
                if (timeframes.length > 0) {
                    const firstTf = timeframes[0]
                    const firstTfData = data[firstTf]
                    this.currentTimeframe = firstTf
                    this.selectedTimeframe = 0
                    this.originalChartData = Utils.fastDeepCopy(firstTfData.chart.data)
                    this.extractCandleColoringOptions(firstTfData, firstTf)
                    this.chart = new this.DataCubeClass(this.prepareChartData(firstTfData, firstTf, this.originalChartData))
                }
            }

            // Set initial displayedView (fallback to first view since selectedView is empty on init)
            const availableViews = this.candleColoringOptions.map(opt => opt.title)
            if (availableViews.length > 0) {
                this.displayedView = availableViews[0]
                this.$nextTick(() => {
                    this.applyCurrentColoring()
                    // Force chart to redraw with colors applied
                    this.$nextTick(() => {
                        if (this.$refs.tradingVue) {
                            this.$refs.tradingVue.resetChart()
                        }
                    })
                })
            }
        }
    },
    watch: {
        log_scale(value) {
            if (this.chart.data.chart) {
                this.chart.data.chart.grid = {
                    logScale: value
                }
            }
            this.saveStateToStorage()
        }
    }
}
