'use strict';
const {resolve, join} = require('path');
const webpack = require('webpack');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const CleanWebpackPlugin = require('clean-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const HtmlWebpackExcludeAssetsPlugin = require('html-webpack-exclude-assets-plugin');
const ScriptExtHtmlWebpackPlugin = require('script-ext-html-webpack-plugin');

const pkg = require('./package.json');

const ENV = process.argv.find(arg => arg.includes('NODE_ENV=production')) ? 'production' : 'development';
const IS_DEV_SERVER = process.argv.find(arg => arg.includes('webpack-dev-server'));
const OUTPUT_PATH = IS_DEV_SERVER ? resolve(__dirname) : resolve('dist');

const processEnv = {
    NODE_ENV: JSON.stringify(ENV),
    appVersion: JSON.stringify(pkg.version)
};


const copyStatics = {
    copyWebcomponents: [{
        from: resolve('./node_modules/@webcomponents/webcomponentsjs/webcomponents-loader.js'),
        to: join(OUTPUT_PATH, 'vendor'),
        flatten: true
    }, {
        from: resolve('./node_modules/@webcomponents/webcomponentsjs/webcomponents-bundle.js'),
        to: join(OUTPUT_PATH, 'vendor'),
        flatten: true
    }, {
        from: resolve('./node_modules/@webcomponents/webcomponentsjs/bundles/webcomponents-ce.js'),
        to: join(OUTPUT_PATH, 'vendor', 'bundles'),
        flatten: true
    }, {
        from: resolve('./node_modules/@webcomponents/webcomponentsjs/bundles/webcomponents-sd-ce.js'),
        to: join(OUTPUT_PATH, 'vendor', 'bundles'),
        flatten: true
    }, {
        from: resolve('./node_modules/@webcomponents/webcomponentsjs/bundles/webcomponents-sd-ce-pf.js'),
        to: join(OUTPUT_PATH, 'vendor', 'bundles'),
        flatten: true
    }, {
        from: resolve('./node_modules/@webcomponents/webcomponentsjs/bundles/webcomponents-sd.js'),
        to: join(OUTPUT_PATH, 'vendor', 'bundles'),
        flatten: true
    }],
    copyOthers: [
        {
            from: resolve('./demo/index.html'),
            to: OUTPUT_PATH,
            flatten: true
        }
        //     {
        //         from: resolve('./settings.js'),
        //         to: OUTPUT_PATH,
        //         flatten: true
        //     },
        //     {
        //         from: resolve('./images'),
        //         to: resolve(OUTPUT_PATH, 'images'),
        //         flatten: true
        //     }
    ]
};

const renderHtmlPlugins = () =>
    [
        new HtmlWebpackPlugin({
            filename: resolve(OUTPUT_PATH, 'demo/index.html'),
            template: `!!ejs-loader!${resolve('./demo/index.html')}`,
            minify: ENV === 'production' && {
                collapseWhitespace: true,
                removeScriptTypeAttributes: true,
                removeRedundantAttributes: true,
                removeStyleLinkTypeAttributes: true,
                removeComments: true
            },
            inject: true,
            compile: true,
            excludeAssets: [/(bundle|polyfills)(\..*)?\.js$/],
            showErrors: true,
            paths: {
                webcomponents: '../vendor/webcomponents-loader.js'
            }
        }),
        new HtmlWebpackExcludeAssetsPlugin(),
        new ScriptExtHtmlWebpackPlugin({
            defaultAttribute: 'defer'
        })
    ];

const sharedPlugins = [
    new webpack.DefinePlugin({'process.env': processEnv}),
    ...renderHtmlPlugins()
];
const devPlugins = [new CopyWebpackPlugin(copyStatics.copyWebcomponents), new webpack.HotModuleReplacementPlugin()
];
const buildPlugins = [
    new CopyWebpackPlugin(
        [].concat(copyStatics.copyWebcomponents, copyStatics.copyOthers)
    ),
    new CleanWebpackPlugin([OUTPUT_PATH], {verbose: true})
];

const plugins = sharedPlugins.concat(IS_DEV_SERVER ? devPlugins : buildPlugins);


module.exports = {
    mode: ENV,
    entry: 'demo/index.ts',
    devtool: 'cheap-source-map',
    output: {
        path: OUTPUT_PATH,
        filename: 'src/[name].[hash].bundle.js',
        pathinfo: true
    },
    module: {
        rules: [
            {
                test: /\.scss$/,
                include: join(__dirname, 'src'),
                use: [
                    {
                        loader: 'to-string-loader',
                        options: {
                            sourceMap: true
                        }
                    },
                    {
                        loader: 'typings-for-css-modules-loader',
                        options: {
                            modules: true,
                            namedExport: false,
                            sourceMap: false,
                            getLocalIdent: (context, localIdentName, localName, options) => {
                                return localName;
                            }
                        }
                    },
                    {
                        loader: 'sass-loader',
                        options: {
                            sourceMap: true,
                        }
                    }
                ]
            },
            {
                test: /\.ts$/,
                loader: 'ts-loader',
                options: { allowTsInNodeModules: true, transpileOnly: true }
            },
            {
                test: /\.(js)$/,
                exclude: resolve(__dirname, 'node_modules'),
                use: {
                    loader: 'babel-loader',
                    options: {
                        presets: [[
                            '@babel/preset-env',
                            {
                                targets: {
                                    browsers: [
                                        // Best practice: https://github.com/babel/babel/issues/7789
                                        '>=1%',
                                        'not ie 11',
                                        'not op_mini all'
                                    ]
                                },
                                debug: true
                            }
                        ]],
                        plugins: [['@babel/plugin-syntax-object-rest-spread', {useBuiltIns: true}],
                            ['@babel/plugin-syntax-dynamic-import', {useBuiltIns: true}]]
                    }
                }
            },
            {
                test: /\.html$/,
                use: [
                    {loader: 'polymer-webpack-loader'}
                ]
            },
            {
                test: /\.(png|jpg|gif)$/,
                use: [
                    {
                        loader: 'file-loader',
                        options: {},
                    },
                ],
            }
        ]
    },
    plugins,
    optimization: {
        splitChunks: {
            chunks: 'async',
            minSize: 30000,
            maxSize: 0,
            minChunks: 1,
            maxAsyncRequests: 5,
            maxInitialRequests: 3,
            automaticNameDelimiter: '-',
            name: true,
            cacheGroups: {
                vendors: {
                    test: /[\\/]node_modules[\\/]/,
                    priority: -10
                },
                default: {
                    minChunks: 1,
                    priority: -20,
                    reuseExistingChunk: true
                }
            }
        }
    },
    devServer: {
        contentBase: OUTPUT_PATH,
        compress: true,
        overlay: {
            errors: true
        },
        hot: true,
        stats: 'errors-only',
        host: '0.0.0.0',
        disableHostCheck: true
    },
    resolve: {
        modules: [__dirname, 'node_modules'],
        extensions: [".ts", ".tsx", ".js"]
    }
};
