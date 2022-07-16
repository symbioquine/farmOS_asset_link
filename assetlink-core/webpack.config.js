const path = require('path');
const { VueLoaderPlugin } = require('vue-loader');
const { ModuleFederationPlugin } = require('webpack').container;

module.exports = {
  entry: './src/index.js',
  output: {
    publicPath: process.env.NODE_ENV === 'production'
      ? '/__THIS_GETS_REPLACED_AT_RUNTIME_BY_THE_DRUPAL_CONTROLLER__/'
      : '/alink/',
    filename: 'core/main.js',
    path: path.resolve(__dirname, '../farmos_asset_link/asset-link-dist'),
  },
  resolve: {
    extensions: ['.vue', '.js', '.json'],
  },
  module: {
    rules: [
      {
        test: /\.vue$/,
        use: 'vue-loader',
      },
    ]
  },
  plugins: [
    new ModuleFederationPlugin({
      name: "assetlink_core",
      filename: 'core/remoteEntry.js',
      remotes: {
        'assetlink_core': 'assetlink_core@/__THIS_GETS_REPLACED_AT_RUNTIME_BY_THE_DRUPAL_CONTROLLER__/core/remoteEntry.js',
      },
      exposes: {
        './Content': './src/components/Content',
        './Button': './src/components/Button',
      },
      shared: {
        vue: {
          singleton: true,
        },
      },
    }),
    new VueLoaderPlugin(),
  ],
};
