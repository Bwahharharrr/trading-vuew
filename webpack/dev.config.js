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
        // No /live-ws proxy: each loaded chart file declares its own WS
        // endpoint via _meta.ws (port/host/path) and the FE connects
        // directly. This is necessary for multi-instance — one proxy
        // entry could only target one backend port.
        proxy: [],
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
