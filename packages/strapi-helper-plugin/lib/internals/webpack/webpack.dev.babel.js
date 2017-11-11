/**
 * DEVELOPMENT WEBPACK CONFIGURATION
 */

const fs = require('fs');
const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const webpack = require('webpack');
const argv = require('minimist')(process.argv.slice(2));
// PostCSS plugins
const cssnext = require('postcss-cssnext');
const postcssFocus = require('postcss-focus');
const postcssReporter = require('postcss-reporter');
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;
const LodashModuleReplacementPlugin = require('lodash-webpack-plugin');

// Load plugins into the same build in development mode.
const plugins = {
  exist: false,
  src: [],
  folders: {}
};

if (process.env.npm_lifecycle_event === 'start') {
  try {
    fs.accessSync(path.resolve(process.env.PWD, '..', 'plugins'), fs.constants.R_OK);
  } catch (e) {
    // Allow app without plugins.
    plugins.exist = true;
  }

  plugins.src = process.env.IS_ADMIN === 'true' && !plugins.exist ? fs.readdirSync(path.resolve(process.env.PWD, '..', 'plugins')).filter(x => x[0] !== '.') : [];

  plugins.folders = plugins.reduce((acc, current) => {
    acc[current] = path.resolve(process.env.PWD, '..', 'plugins', current, 'node_modules', 'strapi-helper-plugin', 'lib', 'src');

    return acc;
  }, {});
}

const appPath = path.join(process.cwd(), 'admin', 'src', 'app.js')
const port = argv.port || process.env.PORT || 3000;

module.exports = require('./webpack.base.babel')({
  // Add hot reloading in development
  entry: Object.assign({
      main: [
        `webpack-hot-middleware/client?path=http://localhost:${port}/__webpack_hmr`,
        appPath,
      ]
    }, plugins.src.reduce((acc, current) => {
        acc[current] = path.resolve(plugins.folders[current], 'app.js');

        return acc;
      }, {})
  ),

  // Don't use hashes in dev mode for better performance
  output: {
    filename: '[name].js',
    chunkFilename: '[name].chunk.js',
    publicPath: `http://127.0.0.1:${port}/`,
  },

  // Add development plugins
  plugins: [
    new webpack.HotModuleReplacementPlugin(), // Tell webpack we want hot reloading
    new webpack.optimize.CommonsChunkPlugin({
      name: 'common',
      minChunks: 2,
    }),
    new LodashModuleReplacementPlugin(),
    new webpack.IgnorePlugin(/^\.\/locale$/, /moment$/),
    new HtmlWebpackPlugin({
      favicon: 'admin/src/favicon.ico',
      inject: true, // Inject all files that are generated by webpack, e.g. bundle.js
      templateContent: templateContent(), // eslint-disable-line no-use-before-define
      chunksSortMode: 'auto',
    }),
    // new BundleAnalyzerPlugin(),
  ], // eslint-disable-line no-use-before-define,

  // Process the CSS with PostCSS
  postcssPlugins: [
    postcssFocus(), // Add a :focus to every :hover
    cssnext({ // Allow future CSS features to be used, also auto-prefixes the CSS...
      browsers: ['last 2 versions', 'IE > 10'], // ...based on this browser list
    }),
    postcssReporter({ // Posts messages from plugins to the terminal
      clearMessages: true,
    }),
  ],

  // Tell babel that we want presets and to hot-reload
  babelPresets: [
    [
      require.resolve('babel-preset-latest'),
      {
        es2015: {
          modules: false,
        },
      },
    ],
    require.resolve('babel-preset-react'),
    require.resolve('babel-preset-stage-0'),
    require.resolve('babel-preset-react-hmre'),
  ],
  alias: {
    moment: 'moment/moment.js',
    'lodash': path.resolve(__dirname, '..', '..', '..', 'node_modules', 'lodash'),
    'immutable': path.resolve(__dirname, '..', '..', '..', 'node_modules', 'immutable'),
    'react-intl': path.resolve(__dirname, '..', '..', '..', 'node_modules', 'react-intl'),
    'react': path.resolve(__dirname, '..', '..', '..', 'node_modules', 'react'),
    'react-dom': path.resolve(__dirname, '..', '..', '..', 'node_modules', 'react-dom'),
    'react-transition-group': path.resolve(__dirname, '..', '..', '..', 'node_modules', 'react-transition-group')
  },

  // Emit a source map for easier debugging
  devtool: 'cheap-module-source-map',
});


/**
 * We dynamically generate the HTML content in development so that the different
 * DLL Javascript files are loaded in script tags and available to our application.
 */
function templateContent() {
  const html = fs.readFileSync(
    path.resolve(process.cwd(), 'admin/src/index.html')
  ).toString();

  return html;
}
