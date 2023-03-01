Welcome to the documentation for Asset Link's Plugin Dev Support package!

## Usage

```sh
mkdir example_alink_plugins && cd example_alink_plugins
npm init -y
npm install --save-dev assetlink-plugin-dev-support webpack webpack-cli webpack-dev-server
```

**webpack.config.js**

```js
const { GenerateDefaultPluginConfigYmlFilesPlugin, createDevServerConfig } = require('assetlink-plugin-dev-support');

module.exports = {
  // We have no entry since this package just contains uncompiled plugins
  entry: {},
  output: {
    // Use the current directory to prevent a 'dist/' folder from being created there should be no output, otherwise
    path: __dirname,
  },
  mode: 'development',
  plugins: [
    new GenerateDefaultPluginConfigYmlFilesPlugin({
      pluginDir: __dirname,
      // This must match your drupal module name for Asset Link to be able to serve your plugins
      drupalModuleName: 'example_alink_plugins',
    }),
  ],
  devServer: createDevServerConfig({
    pluginDir: __dirname,
  }),
};

```

**package.json**

Update `package.json` with "build" and "serve" scripts;

```diff
diff --git a/package.json b/package.json
index 0abd22b..bc028b4 100644
--- a/package.json
+++ b/package.json
@@ -5,5 +5,6 @@
   "main": "index.js",
   "scripts": {
-    "test": "echo \"Error: no test specified\" && exit 1"
+    "build": "webpack build",
+    "serve": "webpack serve"
   },
   "repository": {
```

** `*.alink.*` Plugin Files

The configuration above expects the plugins to be in the root of the package. e.g. `./NameBobAssetActionProvider.alink.js` would be a sibling of `webpack.config.js`.

**example_alink_plugins.info.yml**

```
name: A package with some plugins for farmOS Asset Link
description: Provides Asset Link plugins that do awesome stuff
type: module
package: Example farmOS Asset Link Plugins
core_version_requirement: ^9
dependencies:
  - farmos_asset_link
```

### Build Config Yaml Files

```sh
npm run build
```

### Serve Plugins for Development

```sh
npm run serve
```

By default this will serve the plugins using a free port at `http://farmos.test`. You'll need to somehow create a DNS entry pointing at that domain.

Alternatively, you can just use localhost by exporting the following environment variable;

```sh
export ASSET_LINK_PLUGIN_SERVING_DEV_HOST="http://localhost"
```

#### Using the Served Plugins

The plugins are served under a `/plugins/` path. So "NameBobAssetActionProvider.alink.js" would by default be served at `"http://farmos.test:8080/plugins/NameBobAssetActionProvider.alink.js"` (maybe with a different port).

Also a plugin list is served at `/plugins.repo.json` (e.g. `"http://farmos.test:8080/plugins.repo.json"`) which can be installed via the Manage Plugins page in Asset Link and which specifies an `updateChannel` websocket. This means that - if everything is working correctly - plugins should be live reloaded by Asset Link when they are changed on the local filesystem.

#### HTTPS

To enable HTTPS the following steps are needed;

```sh
mkdir -p ./devcerts/mydomain.farmos.test/
cp /path/to/my/dev/server/rootCA.pem ./devcerts/rootCA.pem
cp /path/to/my/dev/server/privkey.pem ./devcerts/mydomain.farmos.test/privkey.pem
cp /path/to/my/dev/server/fullchain.pem ./devcerts/mydomain.farmos.test/fullchain.pem
export ASSET_LINK_PLUGIN_SERVING_DEV_HOST='https://mydomain.farmos.test'
npm run serve
```

Check out [mkcert](https://github.com/FiloSottile/mkcert) as a convenient tool for creating/trusting certs for development.

## Example package

See https://github.com/symbioquine/example-assetlink-plugin-pkg
