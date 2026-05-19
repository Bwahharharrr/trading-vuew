const { VueLoaderPlugin } = require('vue-loader')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const WWPlugin = require('./ww_plugin.js')
const TerserPlugin = require('terser-webpack-plugin')
const webpack = require('webpack')

global.port = '8080'

module.exports = (env, options) => ({
    entry: './src/main.js',
    resolve: {
        alias: {
            'vue': 'vue/dist/vue.esm-bundler.js'
        }
    },
    module: {
        rules: [{
                test: /\.vue$/,
                exclude: /node_modules/,
                loader: 'vue-loader'
            },
            {
                test: /\.js$/,
                exclude: /node_modules/,
                loader: 'babel-loader'
            },
            {
                test: /\.css$/,
                use: [
                    'vue-style-loader',
                    'css-loader'
                ]
            },
            {
                test: /script_ww\.js$/,
                loader: 'worker-loader'
            }
        ]
    },
    plugins: [
        new VueLoaderPlugin(),
        new HtmlWebpackPlugin({
            template: './src/index.html'
        }),
        new WWPlugin(),
        new webpack.DefinePlugin({
            MOB_DEBUG: JSON.stringify(process.env.MOB_DEBUG),
            __VUE_OPTIONS_API__: 'true',
            __VUE_PROD_DEVTOOLS__: 'false',
            __VUE_PROD_HYDRATION_MISMATCH_DETAILS__: 'false'
        })
    ],
    devServer: {
        host: '0.0.0.0',
        client: {
            webSocketURL: 'auto://0.0.0.0:0/ws',  // Use same host/port as page URL
        },
        // Wildcard live-feed proxy: routes /live-ws/<port> → ws://127.0.0.1:<port>.
        //
        // Each qb-new backend declares its actual bound port in the chart
        // file's _meta.ws.port. The FE (ws-helpers.buildWsUrl) builds a
        // URL of the form ws://<page-host>:<page-port>/live-ws/<backend-port>
        // and the dev-server forwards each connection to the matching local
        // backend. This solves three problems:
        //   1. Multi-instance: any number of backends on distinct ephemeral
        //      ports all reachable through the one dev-server port.
        //   2. Container / port-forward setups (the common dev case): the
        //      page is reached through ONE exposed port; backend WS ports
        //      need no separate forwarding.
        //   3. Future TLS termination: dev-server can handle wss→ws bridging
        //      so the FE doesn't need to know about cert details.
        //
        // Direct-host mode is still available — if a chart file's
        // _meta.ws.host is non-empty, buildWsUrl uses that host:port
        // verbatim and bypasses this proxy (advanced deployments where the
        // backend is on a different machine that's directly reachable).
        proxy: [
            {
                context: (pathname) => /^\/live-ws\/\d+$/.test(pathname),
                target: 'ws://127.0.0.1:0',  // overridden per-request by router
                ws: true,
                changeOrigin: true,
                router: (req) => {
                    const m = req.url.match(/^\/live-ws\/(\d+)/);
                    const port = m ? m[1] : '8765';
                    return `ws://127.0.0.1:${port}`;
                },
                pathRewrite: { '^/live-ws/\\d+': '' },
            },
        ],
        static: {
            directory: require('path').join(__dirname, '../data'),
            publicPath: '/data',
            // CRITICAL: do NOT live-reload the page when data/*.json changes.
            // The backend rewrites these files on every closed candle (~once
            // per minute on a 1m feed); without watch:false, webpack-dev-server
            // detects each write and triggers a full page reload, which:
            //   1. Tears down the trading-vue chart and re-mounts it from
            //      scratch (visible flicker, lost view range, lost overlays).
            //   2. Re-fetches the file from disk, discarding any in-flight
            //      WebSocket-driven updates accumulated since the last write.
            //   3. Defeats the entire incremental-update model — the WS feed
            //      exists precisely so the FE never has to reload.
            // Source files (.vue/.js) are watched independently by the
            // compilation pipeline; this flag only affects the data
            // directory.
            watch: false,
        },
        onListening: function(devServer) {
            const port = devServer.server.address().port
            global.port = port
        },
        setupMiddlewares: (middlewares, devServer) => {
            devServer.app.get("/debug", function(req, res) {
                try {
                    let argv = JSON.parse(req.query.argv)
                    console.log(...argv)
                } catch(e) {}
                res.send("[OK]")
            })
            devServer.app.get("/data-files", function(req, res) {
                const fs = require('fs')
                const path = require('path')
                const dataDir = path.join(__dirname, '../data')
                try {
                    const files = fs.readdirSync(dataDir)
                        .filter(f =>
                            f.endsWith('.json') &&
                            !f.startsWith('bak') &&
                            // Exclude indicators files — they are companion
                            // assets fetched via _meta.indicators_url, not
                            // picker-loadable chart files.
                            !f.startsWith('indicators_') &&
                            f !== 'indicators.json'
                        )
                        .sort()
                    res.json(files)
                } catch(e) {
                    res.status(500).json({ error: e.message })
                }
            })
            return middlewares
        }
    },
    optimization: {
        minimize: options.mode === 'production',
        minimizer: [
            new TerserPlugin({
                terserOptions: {
                    mangle: {
                        reserved: ['_id', '_tf'] // for scripts std
                    }
                }
            })
        ]
    },
    devtool: 'source-map'
})
