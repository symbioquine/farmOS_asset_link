const webpack = require('webpack');
const CopyPlugin = require("copy-webpack-plugin");
const { VueLoaderPlugin } = require('vue-loader');
const NodePolyfillPlugin = require("node-polyfill-webpack-plugin");


module.exports = {
  entry: {
    'farmos_asset_link': {
      'import': `${__dirname}/src/main.js`,
    },
    'farmos_asset_link_sidecar': {
      'import': `${__dirname}/src/sidecar.js`,
    },
  },
  output: {
    path: `${__dirname}/farmos_asset_link/js`,
    filename: '[name].js',
    clean: true,
  },
  performance: {
    hints: false,
  },
  devServer: {
    public: 'farmos.test',
    proxy: {
      context: () => true,
      target: 'http://localhost:80',
      bypass: function (req, res, proxyOptions) {
        if (req.path.indexOf('modules/farmos_asset_link/js/') !== -1) {
          return '/' + req.path.split('/').pop();
        }
        if (req.path.indexOf('.hot-update.js') !== -1) {
          return '/' + req.path.split('/').pop();
        }
      },
    },
  },
  module: {
    rules: [
      {
        test: /\.css$/,
        use: [
          { loader: 'style-loader' },
          { loader: 'css-loader' },
        ],
      },
      {
        test: /\.vue$/,
        loader: 'vue-loader'
      },
    ],
  },
  externals: {
    axios: 'axios',
    'bootstrap-vue': 'BootstrapVue',
    vue: 'Vue',
  },
  plugins: [
    new NodePolyfillPlugin(),
    new VueLoaderPlugin(),
    new CopyPlugin({
      patterns: [
        { from: 'node_modules/vue/dist/vue.min.js' },

        { from: 'node_modules/axios/dist/axios.min.js' },

        { from: 'node_modules/bootstrap/dist/css/bootstrap.min.css', to: '../css/' },
        { from: 'node_modules/bootstrap/dist/js/bootstrap.bundle.min.js' },

        { from: 'node_modules/bootstrap-vue/dist/bootstrap-vue.min.css', to: '../css/' },
        { from: 'node_modules/bootstrap-vue/dist/bootstrap-vue-icons.min.css', to: '../css/' },
        { from: 'node_modules/bootstrap-vue/dist/bootstrap-vue.min.js' },
      ],
    }),
  ],
};
