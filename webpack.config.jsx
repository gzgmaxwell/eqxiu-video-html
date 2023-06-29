const webpack = require('webpack');
const CleanWebpackPlugin = require('clean-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const OptimizeCssAssetsPlugin = require('optimize-css-assets-webpack-plugin');
const HtmlWebpackHarddiskPlugin = require('html-webpack-harddisk-plugin');
const ZipPlugin = require('zip-webpack-plugin');
const UglifyJsPlugin = require('uglifyjs-webpack-plugin');
const FilterWarningsPlugin = require('webpack-filter-warnings-plugin');
const LodashModuleReplacementPlugin = require('lodash-webpack-plugin');
const os = require('os');
const path = require('path');
const nameList = {
    pro: 'product',
    dev: 'develop',
    pre: 'stage',
    test: 'test',
};
module.exports = (options) => {
    const env = require('./env/' + options.config + '.js');
    const { plugin } = env;
    const name = 'video';
    const port = env.port || 3333;
    const isLocal = options.local;
    const buildDir = isLocal ? 'dist' : `dist_${options.config}`;
    const editorKeys = ['axios', 'moment', 'moment_lang', 'jquery', 'eqxLayout'];
    const editorLibs = [];
    const sourceMap = !(options.pro || options.pre || options.test);
    const minify = {
        minifyCSS: true,
        minifyJS: true,
        removeComments: true, // 删除HTML中的注释
        collapseWhitespace: true, // 删除空白符与换行符
        collapseBooleanAttributes: true, // 省略布尔属性的值 <input checked="true"/> ==> <input checked />
        removeEmptyAttributes: true, // 删除所有空格作属性值 <input id="" /> ==> <input />
        removeScriptTypeAttributes: true, // 删除script上的type
        removeStyleLinkTypeAttributes: true, // 删除style上的type
    };
    // 如果是本地开发，使用未压缩的插件
    // if (isLocal) {
    //     for (let key in plugin) {
    //         plugin[key] = plugin[key].replace('.min', '')
    //     }
    // }
    editorKeys.forEach(item => plugin[item] && editorLibs.push({
        url: plugin[item],
        isAsync: false,
    }));
    const rules = [
        {
            test: /\.js|.jsx$/,
            exclude: /node_modules/,
            include: [path.join(__dirname, 'env'), path.join(__dirname, 'src')],
            use: {
                loader: 'babel-loader',
                options: {
                    cacheDirectory: true,
                    plugins: [
                        'lodash',
                        [
                            'import',
                            {
                                'libraryName': 'antd',
                                'libraryDirectory': 'es',
                                'style': 'css',
                            },
                        ],
                    ],
                },
            },
        },
        {
            test: /\.css$/,
            use: [
                MiniCssExtractPlugin.loader,
                'css-loader',
            ],
        },
        {
            test: /\.less$/,
            loader: [
                MiniCssExtractPlugin.loader,
                `css-loader?modules&localIdentName=[name]__[local]__[hash:3]!less-loader?sourceMap=${sourceMap}`],
        },
        {
            test: /\.(png|jpg|gif|svg|ico)$/,
            use: [
                {
                    loader: 'url-loader',
                    options: {
                        name: 'images/[path][name]_[hash:3].[ext]',
                        limit: 1000,
                    },
                }],
        },
        {
            test: /\.(woff|woff2|eot|ttf|otf)$/,
            loader: 'file-loader',
            options: {
                name: '[path][name].[ext]',
            },
        },
    ];
    const plugins = [
        new LodashModuleReplacementPlugin(),
        new CleanWebpackPlugin(buildDir, {
            root: __dirname, // 需要指定根目录，才能删除项目外的文件夹
        }),
        new MiniCssExtractPlugin({
            filename: 'css/[name]-[hash:8].css',
        }),
        new webpack.ContextReplacementPlugin(
            /moment[\\\/]locale$/,
            /^\.\/(zh-cn)$/,
        ),
        new OptimizeCssAssetsPlugin(),
        new webpack.HotModuleReplacementPlugin(),
        new HtmlWebpackPlugin({
            title: '易企秀视频|简易操作的视频编辑工具|易企秀官网',
            template: './index.html',
            filename: isLocal ? 'index.html' : 'index.html',
            minify,
            libs: editorLibs,
            chunks: ['app', 'ark'],
            alwaysWriteToDisk: true,
            env: options.config,
            cdn: env.host.cdn,
        }),
        new HtmlWebpackPlugin({
            title: '易企秀视频|字幕编辑|简易操作的视频编辑工具|易企秀官网',
            template: './index.html',
            filename: 'iframe/subtitles.html',
            minify,
            libs: editorLibs,
            chunks: ['subtitle', 'ark'],
            alwaysWriteToDisk: true,
            env: options.config,
            cdn: env.host.cdn,
        }),
        new HtmlWebpackPlugin({
            title: '视频上传|简易操作的视频编辑工具|易企秀官网',
            template: './src/upload.html',
            filename: 'upload.html',
            minify,
            host: env.host,
            // libs: uploaderLibs,
            libs: [],
            // inject: false,
            chunks: ['upload'],
            alwaysWriteToDisk: true,
        }),
        new HtmlWebpackHarddiskPlugin({
            outputPath: path.resolve(__dirname, buildDir),
        }),
        new FilterWarningsPlugin({
            exclude: /mini-css-extract-plugin */,
        }),
        new FilterWarningsPlugin({
            exclude: /Child mini-css-extract-plugin  */,
        }),
    ];
    if (!isLocal) {
        plugins.push(new ZipPlugin({
            path: path.resolve(__dirname, 'zip'),
            pathPrefix: name,
            filename: `${name}-${nameList[options.config] || options.config}.zip`,
        }));
    }
    return {
        mode: isLocal ? 'development' : 'production',
        entry: {
            app: './src',
            upload: './src/upload.js',
            // store: './src/store.js',
            ark: './src/ark.js',
            subtitle: './src/iframe/subtitle.js',
        },
        output: {
            publicPath: env.host.cdn + (options.hot ? ':' + port : '') + `/`,
            path: path.resolve(__dirname, buildDir),
            filename: isLocal ? 'js/[name].js' : 'js/[name]-[hash:8].js',
            chunkFilename: isLocal ? 'js/[name].js' : 'js/[name]-[hash:8].js', // 本地开发如果使用hash，watch会影响到公用js
        },
        optimization: {
            // splitChunks: {
            //     chunks: 'all',
            // },
            // runtimeChunk: true,
            minimizer: [
                new UglifyJsPlugin({
                    uglifyOptions: {
                        parse: {
                            ecma: 8,
                        },
                        compress: {
                            ecma: 5,
                            warnings: false,
                            comparisons: false,
                        },
                        mangle: {
                            safari10: true,
                        },
                        output: {
                            ecma: 5,
                            comments: false,
                            ascii_only: true,
                        },
                    },
                    parallel: true,
                    cache: true,
                    sourceMap,
                }),
            ],
        },
        module: {
            rules,
        },
        plugins,
        resolve: {
            extensions: ['.js', '.jsx'],
            alias: {
                env: path.resolve(__dirname, `env/${options.config}.js`),
                Api: path.resolve(__dirname, 'src/api'),
                Models: path.resolve(__dirname, 'src/models'),
                Components: path.resolve(__dirname, 'src/page/components'),
                Page: path.resolve(__dirname, 'src/page'),
                Util: path.resolve(__dirname, 'src/util'),
                Router: path.resolve(__dirname, 'src/router'),
                Config: path.resolve(__dirname, 'src/config'),
                Static: path.resolve(__dirname, 'src/page/static'),
                Services: path.resolve(__dirname, 'src/services'),
            },
        },
        devtool: (options.pro || options.pre || options.test)
                 ? false
                 : 'cheap-module-eval-source-map',
        devServer: {
            hot: true,
            disableHostCheck: true,
            contentBase: path.join(__dirname, 'dist'),
            compress: true,
            port: 80,
            historyApiFallback: {
                rewrites: [
                    {
                        from: /^\/store/,
                        to: './store.html',
                    },
                    {
                        from: /^\/$/,
                        to: './index.html',
                    },
                ],
            },
            headers: {
                'Access-Control-Allow-Origin': '*',
            },
        },
    };
};
// module.exports = config;
