const fs = require("fs");
const path = require("path");
const https = require("https");
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
      "Set-Cookie": "assetLinkDrupalBasePath=/; path=/; SameSite=Lax",
    },
    proxy: {
      "^/": {
        ws: false,
        target: DEV_PROXY_TARGET,
        context: () => true,
        secure: targetUrl.protocol === "https:",
        changeOrigin: true,
        bypass(req) {
          if (req.path.indexOf("/alink/sidecar") === 0) {
            console.log(
              `'${req.path}' is an alink sidecar url - passing to proxy...`
            );
            return null;
          }
          if (req.path.indexOf("/alink/plugins") === 0) {
            console.log(
              `'${req.path}' is an alink plugins url - passing to proxy...`
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

  if (targetUrl.protocol === "https:") {
    const devRootCA = `${__dirname}/../../../devcerts/rootCA.pem`;

    https.globalAgent.options.ca = https.globalAgent.options.ca || [];
    https.globalAgent.options.ca.push(fs.readFileSync(devRootCA));

    serverConfig.proxy["^/"].agent = https.globalAgent;

    Object.assign(serverConfig, {
      // Deprecated `https` config still needed to cause links printed to console to have correct protocol
      // https://github.com/symfony/webpack-encore/issues/1064
      https: true,
      server: {
        type: "https",
        options: {
          ca: devRootCA,
          key: `${__dirname}/../../../devcerts/${devHost}/privkey.pem`,
          cert: `${__dirname}/../../../devcerts/${devHost}/fullchain.pem`,
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

  runtimeCompiler: true,
  transpileDependencies: ["quasar"],

  pages: {
    index: {
      entry: "src/main.js",
      title: "Asset Link",
    },
  },

  pwa: {
    name: "Asset Link",
    themeColor: "#4CAF50",
    msTileColor: "#000000",
    appleMobileWebAppCapable: "yes",
    appleMobileWebAppStatusBarStyle: "black",

    // configure the workbox plugin
    workboxPluginMode: "InjectManifest",
    workboxOptions: {
      swSrc: "./src/service-worker.js",
    },
  },

  configureWebpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      quasar: path.resolve("./node_modules/quasar"),
    };

    config.resolve.fallback = {
      ...config.resolve.fallback,
      path: require.resolve("path-browserify"),
    };

    config.plugins = [
      ...config.plugins, // this is important !
      new ModuleFederationPlugin({
        name: "assetlink",
        filename: "pwa/remoteEntry.js",
        shared: {
          vue: {
            singleton: true,
          },
          "vue-router": {
            singleton: true,
          },
          quasar: {
            singleton: true,
          },
          "quasar/src/plugins/Dialog.js": {
            singleton: true,
          },
          assetlink: {
            singleton: true,
          },
        },
      }),
    ];
  },

  pluginOptions: {
    quasar: {
      importStrategy: "kebab",
      rtlSupport: false,
    },
  },

  devServer: createDevServerConfig(),
});
