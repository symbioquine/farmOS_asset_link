const path = require('path');
const { VueLoaderPlugin } = require('vue-loader');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const { ModuleFederationPlugin } = require('webpack').container;

module.exports = {
  entry: {
    app: {
      import: './src/index.js',
      filename: 'pwa/main.js'
    }
  },
  output: {
    publicPath: process.env.NODE_ENV === 'production'
      ? '/__THIS_GETS_REPLACED_AT_RUNTIME_BY_THE_DRUPAL_CONTROLLER__/'
      : '/alink/',
    path: path.resolve(__dirname, '../farmos_asset_link/asset-link-dist'),
  },
  module: {
    rules: [
      {
        test: /\.vue$/,
        use: 'vue-loader',
      },
      {
        test: /\.css$/,
        use: [
          {
            loader: MiniCssExtractPlugin.loader,
            options: {},
          },
          'css-loader',
        ],
      },
    ]
  },
  plugins: [
    new MiniCssExtractPlugin({
      filename: 'pwa/[name].css',
    }),
    new ModuleFederationPlugin({
      name: "assetlink",
      filename: 'pwa/remoteEntry.js',
      remotes: {
        'assetlink_core': 'assetlink_core@/__THIS_GETS_REPLACED_AT_RUNTIME_BY_THE_DRUPAL_CONTROLLER__/core/remoteEntry.js',
      },
      shared: {
        vue: {
          singleton: true,
        },
      },
    }),
    new HtmlWebpackPlugin({
      template: path.resolve(__dirname, './index.html'),
      // chunks: ['main'],
    }),
    new VueLoaderPlugin(),
  ],
};
