const fs = require('fs');
const https = require('https');
const glob = require('glob');
const chokidar = require('chokidar');
const yaml = require('js-yaml');
const path = require('path');


const SERVE_DEV_HOST = process.env.ASSET_LINK_PLUGIN_SERVING_DEV_HOST || 'http://farmos.test';

/**
 * Libraries that are available for import in Asset Link plugins.
 * 
 * 'buffer/' 6.0.3 - https://www.npmjs.com/package/buffer
 * 'assetlink-plugin-api' - https://symbioquine.github.io/farmOS_asset_link/global.html
 * 'vue' 3.0.0 - https://vuejs.org/api/
 * 'vue-router' 4.0.0 - https://router.vuejs.org/api/
 * 'quasar' 2.6.0 - https://quasar.dev/docs
 * 'ngeohash' 0.6.3 - https://www.npmjs.com/package/ngeohash
 * 'haversine-distance' 1.2.1 - https://www.npmjs.com/package/haversine-distance
 * 'jmespath' 0.16.0 - https://www.npmjs.com/package/jmespath
 * 'micromustache' 8.0.3 - https://www.npmjs.com/package/micromustache
 * 
 * ### Usage in webpack.config.js
 * 
 * ```js
 * const { assetLinkIncludedLibraries } = require('assetlink-plugin-dev-support');
 * 
 * module.exports = {
 *   ...
 *   externals: {
 *     ...assetLinkIncludedLibraries,
 *   }
 * };
 * ```
 * 
 * ### Usage in Plugins
 *
 * ```js
 * import { h } from 'vue';
 * import { QBtn } from 'quasar';
 * ```
 */
module.exports.assetLinkIncludedLibraries = {
  'buffer/': 'buffer/',
  'assetlink-plugin-api': 'assetlink-plugin-api',
  'vue': 'vue',
  'vue-router': 'vue-router',
  'quasar': 'quasar',
  'ngeohash': 'ngeohash',
  'haversine-distance': 'haversine-distance',
  'jmespath': 'jmespath',
  'micromustache': 'micromustache',
}

/**
 * Custom Webpack plugin to generate configuration entity yml files for each of our included
 * Asset Link plugins.
 * 
 * ### Usage
 *
 * ```js
 * const { GenerateDefaultPluginConfigYmlFilesPlugin } = require('assetlink-plugin-dev-support');
 * 
 * module.exports = {
 *   ...
 *   plugins: [
 *     new GenerateDefaultPluginConfigYmlFilesPlugin({
 *       pluginDir: __dirname,
 *       // This must match your drupal module name for Asset Link to be able to serve your plugins
 *       drupalModuleName: 'example_alink_plugins',
 *     }),
 *   ]
 * };
 * ```
 */
function GenerateDefaultPluginConfigYmlFilesPlugin(options) {
  if (!options?.pluginDir) {
    throw new Error('options.pluginDir must be specified with the local directory where the plugins are located.');
  }

  if (!options?.drupalModuleName) {
    throw new Error('options.drupalModuleName must be specified with the name of the drupal module which will provide these plugins and yaml files.');
  }

  GenerateDefaultPluginConfigYmlFilesPlugin.prototype.apply = (compiler) => {
    compiler.hooks.afterEmit.tap('GenerateDefaultPluginConfigYmlFilesPlugin', (compilation) => {

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
 * 
 * ### Usage
 *
 * ```js
 * const { createDevServerConfig } = require('assetlink-plugin-dev-support');
 * 
 * module.exports = {
 *   ...
 *   devServer: createDevServerConfig({
 *     pluginDir: __dirname,
 *   }),
 * };
 * ```
 */
const createDevServerConfig = (options) => {
  if (!options?.pluginDir) {
    throw new Error('options.pluginDir must be specified with the local directory where the plugins to be hosted are located.');
  }

  const targetUrl = new URL(SERVE_DEV_HOST);

  const devHost = targetUrl.hostname;

  let serverPort;

  let serverConfig = {
    hot: false,
    liveReload: false,
    webSocketServer: 'ws',
    allowedHosts: "all",
    setupMiddlewares: function (middlewares, devServer) {
      if (!devServer) {
        throw new Error('webpack-dev-server is not defined');
      }

      const compiledPlugins = {};

      const getPluginFilenames = () => Array.from(new Set([
        ...Object.keys(compiledPlugins),
        ...fs.readdirSync(`${options.pluginDir}/`).filter(filename => filename.indexOf('.alink.') !== -1),
      ])).filter(filename => !filename.endsWith('LICENSE.txt'));

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

        if (Object.hasOwn(compiledPlugins, req.params.pluginFilename)) {
          res.send(compiledPlugins[req.params.pluginFilename]);
          return;
        }

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

      devServer.compiler.hooks.assetEmitted.tap('ServeCompiledPlugins',
        (fileName, { content, source, outputPath, compilation, targetPath }) => {
          if (fileName.includes('hot-update') || fileName.endsWith('LICENSE.txt')) {
            return;
          }

          compiledPlugins[fileName] = content;

          const pluginUrl = `${targetUrl.protocol}//${devHost}:${serverPort}/plugins/${fileName}`;

          devServer.sendMessage(devServer.webSocketServer.clients, 'asset-link-plugin-changed', pluginUrl);
        }
      );

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
