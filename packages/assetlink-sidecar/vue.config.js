const { defineConfig } = require("@vue/cli-service");
const { ModuleFederationPlugin } = require("webpack").container;
const WebpackAssetsManifest = require("webpack-assets-manifest");

const DEV_PROXY_TARGET =
  process.env.ASSET_LINK_DEV_PROXY_TARGET || "http://localhost";

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
      "Set-Cookie": "assetLinkDrupalBasePath=/; path=/",
    },
    proxy: {
      "^/": {
        ws: false,
        target: DEV_PROXY_TARGET,
        context: () => true,
        headers: {
          "X-Forwarded-For": `${devHost}:8080`,
        },
        bypass: function (req) {
          if (req.path.indexOf("/alink/sidecar") === 0) {
            return req.path;
          }
          console.log(
            `'${req.path}' is not an alink url - passing to proxy...`
          );
        },
      },
    },
  };

  if (targetUrl.protocol === "https") {
    Object.assign(serverConfig, {
      // Deprecated `https` config still needed to cause links printed to console to have correct protocol
      // https://github.com/symfony/webpack-encore/issues/1064
      https: true,
      server: {
        type: "https",
        options: {
          ca: `${__dirname}/../devcerts/rootCA.pem`,
          key: `${__dirname}/../devcerts/${devHost}/privkey.pem`,
          cert: `${__dirname}/../devcerts/${devHost}/fullchain.pem`,
        },
      },
      host: devHost,
      allowedHosts: [devHost],
    });
  }

  return serverConfig;
};

const BASE_PUBLIC_PATH =
  process.env.NODE_ENV === "production"
    ? "/__THIS_GETS_REPLACED_AT_RUNTIME_BY_THE_DRUPAL_CONTROLLER__/"
    : "/alink/";

module.exports = defineConfig({
  publicPath: BASE_PUBLIC_PATH + "sidecar/",

  outputDir: "../../farmos_asset_link/asset-link-dist/sidecar",

  transpileDependencies: ["quasar"],

  configureWebpack(config) {
    config.plugins.push(
      new ModuleFederationPlugin({
        name: "assetlink_sidecar",
        filename: "remoteEntry.js",
        shared: {
          vue: {
            singleton: true,
          },
          quasar: {},
          assetlink: {},
        },
      })
    );

    config.plugins.push(
      new WebpackAssetsManifest({
        entrypoints: true,
      })
    );
  },

  pluginOptions: {
    quasar: {
      importStrategy: "kebab",
      rtlSupport: false,
    },
  },
  devServer: createDevServerConfig(),
});
