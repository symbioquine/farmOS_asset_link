const webpack = require('webpack');
const { VueLoaderPlugin } = require('vue-loader');


module.exports = {
  entry: {
    'farmos_asset_link': {
      'import': `${__dirname}/src/main.js`,
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
      { test: /\.vue$/, use: 'vue-loader' },
      {
        test: /\.css$/,
        use: [
          { loader: 'style-loader' },
          { loader: 'css-loader' },
        ],
      },
    ],
  },
  plugins: [
    new VueLoaderPlugin(),
  ],
};
