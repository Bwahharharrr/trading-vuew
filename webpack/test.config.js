const { VueLoaderPlugin } = require('vue-loader')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const WWPlugin = require('./ww_plugin.js')
const webpack = require('webpack')

global.port = '8080'

module.exports = {
    entry: './test/index.js',
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
            template: './test/index.html'
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
        proxy: [
            {
                context: ['/api/v1'],
                target: 'https://api.binance.com',
                changeOrigin: true
            },
            {
                context: ['/ws'],
                target: 'wss://stream.binance.com:9443',
                changeOrigin: true,
                ws: true
            },
            {
                context: ['/api/udf'],
                target: 'https://www.bitmex.com',
                changeOrigin: true
            }
        ],
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
            return middlewares
        }
    },
    devtool: 'source-map'
}
