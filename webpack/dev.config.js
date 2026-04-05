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
        static: {
            directory: require('path').join(__dirname, '../data'),
            publicPath: '/data'
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
                        .filter(f => f.endsWith('.json') && !f.startsWith('bak') && f !== 'indicators.json')
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
