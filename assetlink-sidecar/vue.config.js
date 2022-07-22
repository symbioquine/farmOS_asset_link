const { defineConfig } = require("@vue/cli-service");
const { ModuleFederationPlugin } = require("webpack").container;
const WebpackAssetsManifest = require('webpack-assets-manifest');
const prefixer = require('postcss-prefix-selector');

const DEV_PROXY_TARGET = process.env.ASSET_LINK_DEV_PROXY_TARGET || 'http://localhost';

const createDevServerConfig = () => {
  const targetUrl = new URL(DEV_PROXY_TARGET);

  const devHost = targetUrl.hostname;

  let serverConfig = {
    hot: true,
    // client: {
    //   webSocketTransport: `${__dirname}/src/alink-plugin-reloading-dev-server-ws-transport`,
    // },
    // webSocketServer: 'ws',
    // setupMiddlewares: function (middlewares, devServer) {
    //   if (!devServer) {
    //     throw new Error('webpack-dev-server is not defined');
    //   }
    // 
    //   const files = [`${__dirname}/alink-plugins/**`];
    //   chokidar
    //     .watch(files, {
    //       alwaysStat: true,
    //       atomic: false,
    //       followSymlinks: false,
    //       ignoreInitial: true,
    //       ignorePermissionErrors: true,
    //       persistent: true,
    //       usePolling: true,
    //     })
    //     .on("all", (event, pluginFilePath) => {
    //       const fileName = path.basename(pluginFilePath);
    // 
    //       const pluginUrl = `${targetUrl.protocol}//${devHost}:8080/alink/alink-plugins/${fileName}`;
    // 
    //       devServer.sendMessage(devServer.webSocketServer.clients, 'asset-link-plugin-changed', pluginUrl);
    //     });
    // 
    //   return middlewares;
    // },
    headers: {
      'Set-Cookie': 'assetLinkDrupalBasePath=/; path=/',
    },
    proxy: {
      "^/": {
        ws: false,
        target: DEV_PROXY_TARGET,
        context: () => true,
        headers: {
          'X-Forwarded-For': `${devHost}:8080`,
        },
        bypass: function (req, res, proxyOptions) {
          if (req.path.indexOf('/alink/sidecar') === 0) {
            return req.path;
          }
          console.log(`'${req.path}' is not an alink url - passing to proxy...`);
        },
      },
    },
  };

  if (targetUrl.protocol === 'https') {
    Object.assign(serverConfig, {
      // Deprecated `https` config still needed to cause links printed to console to have correct protocol
      // https://github.com/symfony/webpack-encore/issues/1064
      https: true,
      server: {
        type: 'https',
        options: {
          ca: `${__dirname}/../devcerts/rootCA.pem`,
          key: `${__dirname}/../devcerts/${devHost}/privkey.pem`,
          cert: `${__dirname}/../devcerts/${devHost}/fullchain.pem`,
        },
      },
      host: devHost,
      allowedHosts: [
        devHost,
      ],
    });
  }

  return serverConfig;
};

const BASE_PUBLIC_PATH = process.env.NODE_ENV === "production"
      ? "/__THIS_GETS_REPLACED_AT_RUNTIME_BY_THE_DRUPAL_CONTROLLER__/"
      : "/alink/";

module.exports = defineConfig({
  publicPath: BASE_PUBLIC_PATH + "sidecar/",

  outputDir: "../farmos_asset_link/asset-link-dist/sidecar",

  transpileDependencies: ["quasar"],

  configureWebpack(config) {
    // output: {
    //   filename: (pathData, assetInfo) => {
    //     console.log("Determining entry filename:", pathData);
    //     return pathData.chunk.name === 'app' ? 'main.js' : '[name].[contenthash].js';
    //   },
    //   chunkFilename: (pathData) => {
    //     console.log("Determining chunkFilename:", pathData);
    //     return '[name].[contenthash].js';
    //   },
    // },
    config.plugins.push(new ModuleFederationPlugin({
        name: "assetlink_sidecar",
        filename: "remoteEntry.js",
        remotes: {
          assetlink_core:
            `assetlink_core@${BASE_PUBLIC_PATH}core/remoteEntry.js`,
        },
        shared: {
          vue: {
            singleton: true,
          },
          quasar: {},
        },
    }));

    config.plugins.push(new WebpackAssetsManifest({
      entrypoints: true,
    }));

    // config.module.rules.push({
    //   test: /client-entry\.js$/,
    //   loader: 'string-replace-loader',
    //   options: {
    //     search: "import 'quasar/dist/quasar.sass'",
    //     replace: '',
    //   },
    // });
  },

  chainWebpack: (config) => {
    // // From https://github.com/vuetifyjs/vuetify/issues/8530#issuecomment-680942337
    // const sassRule = config.module.rule('sass');
    // const sassNormalRule = sassRule.oneOfs.get('normal');
    // // creating a new rule
    // const vuetifyRule = sassRule.oneOf('quasar').test(/[\\/]quasar[\\/]src[\\/]/);
    // // taking all uses from the normal rule and adding them to the new rule
    // Object.keys(sassNormalRule.uses.entries()).forEach((key) => {
    //     vuetifyRule.uses.set(key, sassNormalRule.uses.get(key));
    // });
    // // moving rule "vuetify" before "normal"
    // sassRule.oneOfs.delete('normal');
    // sassRule.oneOfs.set('normal', sassNormalRule);
    // // adding prefixer to the "vuetify" rule
    // vuetifyRule.use('quasar').loader(require.resolve('postcss-loader')).tap((options = {}) => {
    //     options.sourceMap = process.env.NODE_ENV !== 'production';
    //     options.postcssOptions = {};
    //     options.postcssOptions.plugins = [
    //         prefixer({
    //             prefix: '[data-quasar]',
    //             transform(prefix, selector, prefixedSelector) {
    //                 let result = prefixedSelector;
    //                 if (selector.startsWith('html') || selector.startsWith('body')) {
    //                     result = prefix + selector.substring(4);
    //                 }
    //                 return result;
    //             },
    //         }),
    //     ];
    //     return options;
    // });
    // // moving sass-loader to the end
    // vuetifyRule.uses.delete('sass-loader');
    // vuetifyRule.uses.set('sass-loader', sassNormalRule.uses.get('sass-loader'));

  },

  pluginOptions: {
    quasar: {
      importStrategy: "kebab",
      rtlSupport: false,
    },
  },
  devServer: createDevServerConfig(),
});
