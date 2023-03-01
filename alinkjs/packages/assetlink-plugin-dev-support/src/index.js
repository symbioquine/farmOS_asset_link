const fs = require('fs');
const https = require('https');
const glob = require('glob');
const chokidar = require('chokidar');
const yaml = require('js-yaml');
const path = require('path');


const SERVE_DEV_HOST = process.env.ASSET_LINK_PLUGIN_SERVING_DEV_HOST || 'http://farmos.test';

/*
 * Custom plugin to generate configuration entity yml files for each of our included
 * Asset Link plugins.
 */
function GenerateDefaultPluginConfigYmlFilesPlugin(options) {
  if (!options?.pluginDir) {
    throw new Error('options.pluginDir must be specified with the local directory where the plugins are located.');
  }

  if (!options?.drupalModuleName) {
    throw new Error('options.drupalModuleName must be specified with the name of the drupal module which will provide these plugins and yaml files.');
  }

  GenerateDefaultPluginConfigYmlFilesPlugin.prototype.apply = (compiler) => {
    compiler.hooks.beforeCompile.tap('GenerateDefaultPluginConfigYmlFilesPlugin', (compilation) => {

      const configOutputDir = options.configOutputDir || `${options.pluginDir}/config/install`;

      if (!fs.existsSync(configOutputDir)) {
        fs.mkdirSync(configOutputDir, { recursive: true });
      }

      const existingConfigFiles = glob.sync(`${configOutputDir}/farmos_asset_link.asset_link_default_plugin.*.yml`);
      existingConfigFiles.forEach(f => fs.unlinkSync(f));

      fs.readdirSync(options.pluginDir).forEach(filename => {
        if (filename.indexOf('.alink.') === -1) {
          return;
        }

        const nameWithoutExt = filename.replace(/(\.[^.]+)*$/, '');

        const configOutputFilename = `${configOutputDir}/farmos_asset_link.asset_link_default_plugin.${nameWithoutExt}.yml`;

        fs.writeFileSync(configOutputFilename, yaml.dump({
          langcode: 'en',
          status: true,
          id: nameWithoutExt,
          dependencies: { enforced: { module: [ options.drupalModuleName ] } },
          url: `{module:${options.drupalModuleName}}/${filename}`,
          user_defined : null,
        }));
      });

    });
  };
}
module.exports.GenerateDefaultPluginConfigYmlFilesPlugin = GenerateDefaultPluginConfigYmlFilesPlugin;

/**
 * Generate a Webpack dev server configuration to serve our plugins with live-reload and (optionally) https.
 */
const createDevServerConfig = (options) => {
  if (!options?.pluginDir) {
    throw new Error('options.pluginDir must be specified with the local directory where the plugins to be hosted are located.');
  }

  const targetUrl = new URL(SERVE_DEV_HOST);

  const devHost = targetUrl.hostname;

  let serverPort;

  let serverConfig = {
    hot: true,
    webSocketServer: 'ws',
    allowedHosts: "all",
    setupMiddlewares: function (middlewares, devServer) {
      if (!devServer) {
        throw new Error('webpack-dev-server is not defined');
      }

      const getPluginFilenames = () => fs.readdirSync(`${options.pluginDir}/`).filter(filename => filename.indexOf('.alink.') !== -1);

      devServer.app.get('/plugins.repo.json', (_, res) => {
        const repo = {};

        const wsProtocol = (targetUrl.protocol === "https:") ? 'wss' : 'ws';
        repo.updateChannel = `${wsProtocol}://${devHost}:${serverPort}/ws`;

        repo.plugins = getPluginFilenames().map(pluginFilename => ({url: `/plugins/${pluginFilename}`})),

        res.set({
          ...serverConfig.headers,
        });

        res.json(repo);
      });

      const handlePluginRequest = (req, res) => {
        // Make sure the specified plugin is actual among the ones we're trying to host
        const pluginMatch = getPluginFilenames().find(filename => filename === req.params.pluginFilename);

        if (!pluginMatch) {
          return res.status(404).json({ error: 'No Such plugin' });
        }

        res.set({
          ...serverConfig.headers,
        });

        res.send(fs.readFileSync(`${options.pluginDir}/${pluginMatch}`));
      };

      devServer.app.options('/plugins/:pluginFilename', handlePluginRequest);
      devServer.app.get('/plugins/:pluginFilename', handlePluginRequest);

      const files = [`${options.pluginDir}/*.alink.*`];
      console.log(files);
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
    
          const pluginUrl = `${targetUrl.protocol}//${devHost}:${serverPort}/plugins/${fileName}`;

          const eventToSend = (event === 'unlink') ? 'asset-link-plugin-removed' : 'asset-link-plugin-changed';

          devServer.sendMessage(devServer.webSocketServer.clients, eventToSend, pluginUrl);
        });

      return middlewares;
    },
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET",
      "Access-Control-Allow-Headers": "*",
    },
    onListening: (devServer) => {
      serverPort = devServer.server.address().port;
    },
  };

  if (targetUrl.protocol === "https:") {
    const devRootCA = `${options.pluginDir}/devcerts/rootCA.pem`;

    https.globalAgent.options.ca = https.globalAgent.options.ca || [];
    https.globalAgent.options.ca.push(fs.readFileSync(devRootCA));

    Object.assign(serverConfig, {
      server: {
        type: "https",
        options: {
          ca: devRootCA,
          key: `${options.pluginDir}/devcerts/${devHost}/privkey.pem`,
          cert: `${options.pluginDir}/devcerts/${devHost}/fullchain.pem`,
        },
      },
      host: devHost,
    });
  }

  return serverConfig;
};
module.exports.createDevServerConfig = createDevServerConfig;
