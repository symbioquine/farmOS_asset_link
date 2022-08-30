const fs = require('fs');
const https = require('https');
const glob = require('glob');
const chokidar = require('chokidar');
const yaml = require('js-yaml');
const path = require('path');
const CopyPlugin = require("copy-webpack-plugin");


const DEV_PROXY_TARGET = process.env.ASSET_LINK_DEV_PROXY_TARGET || 'http://127.0.0.1';

const createDevServerConfig = () => {
  const targetUrl = new URL(DEV_PROXY_TARGET);

  const devHost = targetUrl.hostname;

  let serverPort;

  let serverConfig = {
    hot: true,
    webSocketServer: 'ws',
    setupMiddlewares: function (middlewares, devServer) {
      if (!devServer) {
        throw new Error('webpack-dev-server is not defined');
      }
    
      const files = [`${__dirname}/plugins/**`];
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
    
          const pluginUrl = `${targetUrl.protocol}//${devHost}:${serverPort}/alink/plugins/${fileName}`;

          const eventToSend = (event === 'unlink') ? 'asset-link-plugin-removed' : 'asset-link-plugin-changed';

          devServer.sendMessage(devServer.webSocketServer.clients, eventToSend, pluginUrl);
        });
    
      return middlewares;
    },
    headers: {
      "Set-Cookie": "assetLinkDrupalBasePath=/; path=/; SameSite=Lax",
    },
    proxy: {
      "/": {
        ws: false,
        target: DEV_PROXY_TARGET,
        context: () => true,
        secure: targetUrl.protocol === "https:",
        changeOrigin: true,
        bypass: function (req, res) {
          if (req.path.indexOf("/alink/plugins/~") === 0) {
            console.log(
              `'${req.path}' is a module scoped plugin url - passing to proxy...`
            );
            return null;
          }
          if (req.path.indexOf("/alink/plugins") === 0) {
            return req.path;
          }
          if (req.path.indexOf("/alink/backend/default-plugins.repo.json") === 0) {
            const wsProtocol = (targetUrl.protocol === "https:") ? 'wss' : 'ws';
            res.send({
              plugins: fs.readdirSync(`${__dirname}/plugins`).map(pluginFilename => ({url: `/alink/plugins/${pluginFilename}`})),
              updateChannel: `${wsProtocol}://${devHost}:${serverPort}/ws`,
            });
            return;
          }
          console.log(
            `'${req.path}' is not an alink plugin url - passing to proxy...`
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

    serverConfig.proxy["/"].agent = https.globalAgent;

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
 * Custom plugin to generate configuration entity yml files for each of our included
 * default Asset Link plugins.
 */
function GenerateDefaultPluginConfigYmlFilesPlugin() {
  GenerateDefaultPluginConfigYmlFilesPlugin.prototype.apply = (compiler) => {
    compiler.hooks.beforeCompile.tap('GenerateDefaultPluginConfigYmlFilesPlugin', (compilation) => {

      const configOutputDir = `${__dirname}/../../../farmos_asset_link/config/install`;

      if (!fs.existsSync(configOutputDir)) {
        fs.mkdirSync(configOutputDir, { recursive: true });
      }

      const existingConfigFiles = glob.sync(`${configOutputDir}/farmos_asset_link.asset_link_default_plugin.*.yml`);
      existingConfigFiles.forEach(f => fs.unlinkSync(f));

      fs.readdirSync(`${__dirname}/plugins`).forEach(filename => {
        const nameWithoutExt = filename.replace(/(\.[^.]+)*$/, '');

        const configOutputFilename = `${configOutputDir}/farmos_asset_link.asset_link_default_plugin.${nameWithoutExt}.yml`;

        fs.writeFileSync(configOutputFilename, yaml.dump({
          langcode: 'en',
          status: true,
          id: nameWithoutExt,
          dependencies: { enforced: { module: [ 'farmos_asset_link' ] } },
          url: `{base_path}alink/plugins/${filename}`,
        }));
      });

    });
  };
}

module.exports = {
  output: {
    publicPath: process.env.NODE_ENV === 'production'
      ? '/__THIS_GETS_REPLACED_AT_RUNTIME_BY_THE_DRUPAL_CONTROLLER__/'
      : '/alink/plugins/',
    path: path.resolve(__dirname, '../../../farmos_asset_link/asset-link-dist/plugins/'),
    clean: true,
  },
  // We have no entry since this package just contains uncompiled plugins
  entry: {},
  plugins: [
    new CopyPlugin({
      patterns: [
        {
          from: path.resolve(__dirname, 'plugins'),
          to: path.resolve(__dirname, '../../../farmos_asset_link/asset-link-dist/plugins'),
          toType: 'dir',
          // Terser skip this file for minimization
          info: { minimized: true },
        },
      ],
    }),
    new GenerateDefaultPluginConfigYmlFilesPlugin(),
  ],
  devServer: createDevServerConfig(),
};
