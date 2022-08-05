const chokidar = require('chokidar');
const path = require('path');
const fs = require('fs');
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
    
          devServer.sendMessage(devServer.webSocketServer.clients, 'asset-link-plugin-changed', pluginUrl);
        });
    
      return middlewares;
    },
    headers: {
      "Set-Cookie": "assetLinkDrupalBasePath=/; path=/",
    },
    proxy: {
      "/": {
        ws: false,
        target: DEV_PROXY_TARGET,
        context: () => true,
        secure: targetUrl.protocol === "https",
        changeOrigin: true,
        bypass: function (req, res) {
          if (req.path.indexOf("/alink/plugins") === 0) {
            return req.path;
          }
          if (req.path.indexOf("/alink/backend/default-plugins.repo.json") === 0) {
            res.send({
              plugins: fs.readdirSync(`${__dirname}/plugins`).map(pluginFilename => ({url: `/alink/plugins/${pluginFilename}`})),
              updateChannel: '/ws',
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

module.exports = {
  output: {
    publicPath: process.env.NODE_ENV === 'production'
      ? '/__THIS_GETS_REPLACED_AT_RUNTIME_BY_THE_DRUPAL_CONTROLLER__/'
      : '/alink/plugins/',
    path: path.resolve(__dirname, '../../../farmos_asset_link/asset-link-dist/plugins/'),
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
  ],
  devServer: createDevServerConfig(),
};
