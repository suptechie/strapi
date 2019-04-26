const path = require('path');
const webpack = require('webpack');

// Webpack plugins
const FriendlyErrorsWebpackPlugin = require('friendly-errors-webpack-plugin');
const SimpleProgressWebpackPlugin = require('simple-progress-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const WebpackDashboard = require('webpack-dashboard/plugin');
const OpenBrowserWebpackPlugin = require('open-browser-webpack-plugin');
const DuplicatePckgChecker = require('duplicate-package-checker-webpack-plugin');
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer')
  .BundleAnalyzerPlugin;
const alias = require('./webpack.alias.js');

const URLs = {
  host: '/admin/',
  backend: 'http://localhost:1337',
  publicPath: '/admin/',
  mode: 'host',
};

const webpackPlugins = ({ dev }) =>
  dev
    ? [
        new WebpackDashboard(),
        new DuplicatePckgChecker({
          verbose: true,
        }),
        new FriendlyErrorsWebpackPlugin(),
        // new BundleAnalyzerPlugin(),
        // new OpenBrowserWebpackPlugin({
        //   url: `http://localhost:${PORT}/${URLs.publicPath}`,
        // }),
      ]
    : [
        new webpack.IgnorePlugin({
          resourceRegExp: /^\.\/locale$/,
          contextRegExp: /moment$/,
        }),
        new MiniCssExtractPlugin({
          filename: dev ? '[name].css' : '[name].[chunkhash].css',
          chunkFilename: dev
            ? '[name].chunk.css'
            : '[name].[chunkhash].chunkhash.css',
        }),
      ];

// Use style loader in dev mode to optimize compilation
const scssLoader = ({ dev }) =>
  dev
    ? [{ loader: 'style-loader', options: {} }]
    : [
        {
          loader: MiniCssExtractPlugin.loader,
          options: {
            fallback: require.resolve('style-loader'),
            publicPath: URLs.publicPath,
          },
        },
      ];

module.exports = ({ entry, dest, dev }) => ({
  mode: dev ? 'development' : 'production',
  devServer: {
    historyApiFallback: {
      index: URLs.publicPath,
    },
    port: 4000,
    stats: 'minimal',
    // hot: true,
  },
  stats: dev ? 'minimal' : 'errors-only',
  devtool: 'cheap-module-source-map',
  context: path.resolve(__dirname),
  entry,
  output: {
    path: dest,
    publicPath: URLs.publicPath,
    // Utilize long-term caching by adding content hashes (not compilation hashes)
    // to compiled assets for production
    filename: dev ? '[name].js' : '[name].[chunkhash].js',
    chunkFilename: dev ? '[name].chunk.js' : '[name].[chunkhash].chunk.js',
  },
  module: {
    rules: [
      {
        test: /\.m?js$/,
        exclude: /node_modules/,
        use: {
          loader: require.resolve('babel-loader'),
          options: {
            cacheDirectory: true,
            cacheCompression: !dev,
            compact: !dev,
            presets: [
              require.resolve('@babel/preset-env'),
              require.resolve('@babel/preset-react'),
            ],
            plugins: [
              require.resolve('@babel/plugin-proposal-class-properties'),
              require.resolve('@babel/plugin-syntax-dynamic-import'),
              require.resolve(
                '@babel/plugin-proposal-async-generator-functions'
              ),
              [
                require.resolve('@babel/plugin-transform-runtime'),
                {
                  helpers: true,
                  regenerator: true,
                },
              ],
            ],
          },
        },
      },
      {
        test: /\.css$/,
        include: /node_modules/,
        use: [
          {
            loader: require.resolve('style-loader'),
          },
          {
            loader: require.resolve('css-loader'),
            options: {
              sourceMap: false,
            },
          },
          {
            loader: require.resolve('postcss-loader'),
            options: {
              config: {
                path: path.resolve(__dirname, 'postcss.config.js'),
              },
            },
          },
        ],
      },
      {
        test: /\.scss$/,
        use: scssLoader({ dev }).concat([
          {
            loader: require.resolve('css-loader'),
            options: {
              localIdentName: '[local]__[path][name]__[hash:base64:5]',
              modules: true,
              importLoaders: 1,
              sourceMap: false,
            },
          },
          {
            loader: require.resolve('postcss-loader'),
            options: {
              config: {
                path: path.resolve(__dirname, 'postcss.config.js'),
              },
            },
          },
          {
            loader: 'sass-loader',
          },
        ]),
      },
      {
        test: /\.(svg|eot|otf|ttf|woff|woff2)$/,
        use: 'file-loader',
      },
      {
        test: /\.(jpg|png|gif)$/,
        loaders: [
          require.resolve('file-loader'),
          {
            loader: require.resolve('image-webpack-loader'),
            query: {
              mozjpeg: {
                progressive: true,
              },
              gifsicle: {
                interlaced: false,
              },
              optipng: {
                optimizationLevel: 4,
              },
              pngquant: {
                quality: '65-90',
                speed: 4,
              },
            },
          },
        ],
      },
      {
        test: /\.html$/,
        include: [path.join(__dirname, 'src')],
        use: require.resolve('html-loader'),
      },
      {
        test: /\.(mp4|webm)$/,
        loader: require.resolve('url-loader'),
        options: {
          limit: 10000,
        },
      },
    ],
  },
  resolve: {
    alias,
    symlinks: false,
    extensions: ['.js', '.jsx', '.react.js'],
    mainFields: ['browser', 'jsnext:main', 'main'],
  },
  plugins: [
    new HtmlWebpackPlugin({
      inject: true,
      template: path.resolve(__dirname, 'index.html'),
      favicon: path.resolve(__dirname, 'admin/src/favicon.ico'),
    }),
    new SimpleProgressWebpackPlugin(),

    new webpack.DefinePlugin({
      NODE_ENV: JSON.stringify(process.env.NODE_ENV),
      REMOTE_URL: JSON.stringify(URLs.host),
      BACKEND_URL: JSON.stringify(URLs.backend),
      MODE: JSON.stringify(URLs.mode), // Allow us to define the public path for the plugins assets.
      PUBLIC_PATH: JSON.stringify(URLs.publicPath),
    }),
  ].concat(webpackPlugins({ dev })),
});
