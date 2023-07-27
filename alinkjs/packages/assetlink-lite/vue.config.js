const fs = require("fs");
const path = require("path");
const chokidar = require('chokidar');
const https = require("https");
const CopyPlugin = require("copy-webpack-plugin");
const { defineConfig } = require("@vue/cli-service");
const { ModuleFederationPlugin } = require("webpack").container;

const DEV_PROXY_TARGET =
  process.env.ASSET_LINK_DEV_PROXY_TARGET || "http://127.0.0.1";

const defaultPluginsSourceDir = path.resolve(
  __dirname,
  "../assetlink-default-plugins/plugins"
);

const litePluginsSourceDir = path.resolve(
  __dirname,
  "src/plugins"
);

const createDevServerConfig = () => {
  const targetUrl = new URL(DEV_PROXY_TARGET);

  const devHost = targetUrl.hostname;

  let serverPort;

  const serverConfig = {
    hot: true,
    watchFiles: ["node_modules/assetlink/**/*"],
    setupMiddlewares: function (middlewares, devServer) {
      if (!devServer) {
        throw new Error("webpack-dev-server is not defined");
      }

      const files = [
        `${defaultPluginsSourceDir}/**`,
        `${litePluginsSourceDir}/**`,
      ];
      chokidar
        .watch(files, {
          alwaysStat: true,
          atomic: false,
          followSymlinks: false,
          ignoreInitial: true,
          ignorePermissionErrors: true,
          persistent: true,
          usePolling: true,
        })
        .on("all", (event, pluginFilePath) => {
          const fileName = path.basename(pluginFilePath);
    
          const pluginUrl = `plugins/${fileName}`;

          const eventToSend = (event === 'unlink') ? 'asset-link-plugin-removed' : 'asset-link-plugin-changed';

          devServer.sendMessage(devServer.webSocketServer.clients, eventToSend, pluginUrl);
        });

      devServer.app.get("/backend/default-plugins.repo.json", (_, response) => {
        const plugins = [];

        fs.readdirSync(defaultPluginsSourceDir).forEach((filename) => {
          plugins.push({
            url: `plugins/${filename}`,
          });
        });

        fs.readdirSync(litePluginsSourceDir).forEach((filename) => {
          plugins.push({
            url: `plugins/${filename}`,
          });
        });

        const wsProtocol = (targetUrl.protocol === "https:") ? 'wss' : 'ws';
        const updateChannel = `${wsProtocol}://${devHost}:${serverPort}/ws`;

        response.send(
          JSON.stringify({
            plugins,
            updateChannel,
          })
        );
      });

      return middlewares;
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

/*
 * Custom plugin to generate the default-plugins.repo.json file listing all the default Asset Link
 * plugins.
 */
function GenerateDefaultPluginRepoDotJsonFilePlugin() {
  GenerateDefaultPluginRepoDotJsonFilePlugin.prototype.apply = (compiler) => {
    compiler.hooks.beforeCompile.tap(
      "GenerateDefaultPluginRepoDotJsonFilePlugin",
      (compilation) => {
        const plugins = [];

        fs.readdirSync(defaultPluginsSourceDir).forEach((filename) => {
          plugins.push({
            url: `plugins/${filename}`,
          });
        });

        fs.readdirSync(litePluginsSourceDir).forEach((filename) => {
          plugins.push({
            url: `plugins/${filename}`,
          });
        });

        const configOutputDir = `${__dirname}/dist/backend/`;

        if (!fs.existsSync(configOutputDir)) {
          fs.mkdirSync(configOutputDir, { recursive: true });
        }

        const configOutputFilename = `${configOutputDir}/default-plugins.repo.json`;

        fs.writeFileSync(
          configOutputFilename,
          JSON.stringify({
            plugins,
          })
        );
      }
    );
  };
}

module.exports = defineConfig({
  publicPath: "/",

  runtimeCompiler: true,
  transpileDependencies: ["quasar"],
  parallel: false,

  pages: {
    index: {
      entry: "src/main.js",
      title: "Asset Link☀",
    },
  },

  pwa: {
    name: "Asset Link Lite",
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
    };

    config.resolve.fallback = {
      ...config.resolve.fallback,
      path: require.resolve("path-browserify"),
    };

    config.plugins = [
      ...config.plugins, // this is important !
      new CopyPlugin({
        patterns: [
          {
            from: defaultPluginsSourceDir,
            to: path.resolve(__dirname, "dist/backend/plugins"),
            toType: "dir",
            // Terser skip this file for minimization
            info: { minimized: true },
          },
          {
            from: litePluginsSourceDir,
            to: path.resolve(__dirname, "dist/backend/plugins"),
            toType: "dir",
            // Terser skip this file for minimization
            info: { minimized: true },
          },
        ],
      }),
      new GenerateDefaultPluginRepoDotJsonFilePlugin(),
    ];

    config.plugins.push(
      new ModuleFederationPlugin({
        name: "assetlink",
        filename: "remoteEntry.js",
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
