const { defineConfig } = require("@vue/cli-service");
const { ModuleFederationPlugin } = require("webpack").container;

const DEV_PROXY_TARGET =
  process.env.ASSET_LINK_DEV_PROXY_TARGET || "http://127.0.0.1";

const createDevServerConfig = () => {
  const targetUrl = new URL(DEV_PROXY_TARGET);

  const devHost = targetUrl.hostname;

  let serverPort;

  const serverConfig = {
    hot: true,
    watchFiles: ["node_modules/assetlink/**/*"],
    headers: {
      "Set-Cookie": "assetLinkDrupalBasePath=/; path=/",
    },
    proxy: {
      "^/": {
        ws: false,
        target: DEV_PROXY_TARGET,
        context: () => true,
        secure: targetUrl.protocol === "https",
        changeOrigin: true,
        bypass(req) {
          if (req.path.indexOf("/alink/sidecar") === 0) {
            console.log(
              `'${req.path}' is an alink sidecar url - passing to proxy...`
            );
            return null;
          }
          if (req.path.indexOf("/alink/backend") === 0) {
            console.log(
              `'${req.path}' is an alink backend url - passing to proxy...`
            );
            return null;
          }
          if (req.path.indexOf("/alink") === 0) {
            return req.path;
          }
          console.log(
            `'${req.path}' is not an alink url - passing to proxy...`
          );
        },
        onProxyReq: (proxyReq) => {
          // console.log("existing headers", proxyReq.getHeaders());

          if (!proxyReq.getHeader("X-Forwarded-For")) {
            proxyReq.setHeader("X-Forwarded-For", devHost);
          }
          if (!proxyReq.getHeader("X-Forwarded-Port")) {
            proxyReq.setHeader("X-Forwarded-Port", serverPort);
          }
          if (!proxyReq.getHeader("X-Forwarded-Host")) {
            proxyReq.setHeader("X-Forwarded-Host", `${devHost}:${serverPort}`);
          }
        },
      },
    },
    onListening: (devServer) => {
      serverPort = devServer.server.address().port;
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

module.exports = defineConfig({
  publicPath:
    process.env.NODE_ENV === "production"
      ? "/__THIS_GETS_REPLACED_AT_RUNTIME_BY_THE_DRUPAL_CONTROLLER__/"
      : "/alink/",

  outputDir: "../../../farmos_asset_link/asset-link-dist/",
  transpileDependencies: ["quasar"],

  configureWebpack: {
    plugins: [
      new ModuleFederationPlugin({
        name: "assetlink",
        filename: "pwa/remoteEntry.js",
        shared: {
          vue: {
            singleton: true,
          },
          quasar: {},
          assetlink: {},
        },
      }),
    ],
  },

  pluginOptions: {
    quasar: {
      importStrategy: "kebab",
      rtlSupport: false,
    },
  },

  devServer: createDevServerConfig(),
});
