Welcome to the documentation for Asset Link's Plugin Dev Support package!

## Usage

```shell
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

```shell
npm run build
```

### Serve Plugins for Development

```shell
npm run serve
```

By default this will serve the plugins using a free port at `http://farmos.test`. You'll need to somehow create a DNS entry pointing at that domain.

Alternatively, you can just use localhost by exporting the following environment variable;

```shell
export ASSET_LINK_PLUGIN_SERVING_DEV_HOST="http://localhost"
```

#### Using the Served Plugins

The plugins are served under a `/plugins/` path. So "NameBobAssetActionProvider.alink.js" would by default be served at `"http://farmos.test:8080/plugins/NameBobAssetActionProvider.alink.js"` (maybe with a different port).

Also a plugin list is served at `/plugins.repo.json` (e.g. `"http://farmos.test:8080/plugins.repo.json"`) which can be installed via the Manage Plugins page in Asset Link and which specifies an `updateChannel` websocket. This means that - if everything is working correctly - plugins should be live reloaded by Asset Link when they are changed on the local filesystem.

*Note: It is probably necessary for the protocol (e.g. http vs https) to match between the farmOS / Asset Link instance and the dev server this creates. If connecting from https, the instructions below for enabling HTTPS in the dev server are most likely required.*

#### HTTPS

To enable HTTPS the following steps are needed;

```shell
mkdir -p ./devcerts/mydomain.farmos.test/
cp /path/to/my/dev/server/rootCA.pem ./devcerts/rootCA.pem
cp /path/to/my/dev/server/privkey.pem ./devcerts/mydomain.farmos.test/privkey.pem
cp /path/to/my/dev/server/fullchain.pem ./devcerts/mydomain.farmos.test/fullchain.pem
export ASSET_LINK_PLUGIN_SERVING_DEV_HOST='https://mydomain.farmos.test'
npm run serve
```

*Note: It is necessary for the browser where Asset Link is running to fully trust the certificates above.*

Check out [mkcert](https://github.com/FiloSottile/mkcert) as a convenient tool for creating/trusting certs for development on Linux.

## Example package

See https://github.com/symbioquine/example-assetlink-plugin-pkg

## Plugins that require a (Webpack) build step

For a plugin to include modules that don't come with Asset Link, a Webpack build step may be required.

First we would create the new plugin in a `src` directory;

```shell
mkdir ./src
edit ./src/ExampleChartPage.alink.js
```

**src/ExampleChartPage.alink.js**

```javascript
import { h } from 'vue';
import {
  Chart as ChartJS,
  Colors,
  CategoryScale,
  LinearScale,
  BarElement,
  Legend
} from 'chart.js'

ChartJS.register(
  Colors,
  BarElement,
  CategoryScale,
  LinearScale,
  Legend
);

import {
  Bar as BarChart
} from 'vue-chartjs'

export default class ExampleChartPage {
  static onLoad(handle, assetLink) {

    handle.defineRoute('com.example.farmos_asset_link.routes.v0.example_chart_page', route => {
      route.path('/example-chart-page');

      const data = [
          { year: 2010, count: 10 },
          { year: 2011, count: 20 },
          { year: 2012, count: 15 },
          { year: 2013, count: 25 },
          { year: 2014, count: 22 },
          { year: 2015, count: 30 },
          { year: 2016, count: 28 },
      ];

      route.component(async () => h(BarChart, {
        data: {
          labels: data.map(row => row.year),
          datasets: [
            {
              label: 'Acquisitions by year',
              data: data.map(row => row.count)
            }
          ]
        }
      }));
    });

  }
}

```

Add our dependencies;

```shell
npm install chart.js vue-chartjs
```

Finally, our webpack.config.js gets a bit more complicated than the earlier example;

```diff
--- a/./webpack.config.js
+++ b/./webpack.config.js
@@ -1,17 +1,42 @@
-const { GenerateDefaultPluginConfigYmlFilesPlugin, createDevServerConfig } = require('assetlink-plugin-dev-support');
+const {
+  assetLinkIncludedLibraries,
+  GenerateDefaultPluginConfigYmlFilesPlugin,
+  createDevServerConfig
+} = require('assetlink-plugin-dev-support');
 
 module.exports = {
-  // We have no entry since this package just contains uncompiled plugins
-  entry: {},
+  entry: {
+    // Add an entry here for each plugin in the `src` directory that needs building
+    'ExampleChartPage.alink.js': './src/ExampleChartPage.alink.js',
+  },
   output: {
-    // Use the current directory to prevent a 'dist/' folder from being created there should be no output, otherwise
+    // Output the built plugins in the current directory - alongside any unbuilt plugins
     path: __dirname,
+    // Use just the entry name as our output plugin name
+    filename: '[name]',
+    // Make our built plugin code use module import/exports
+    library: { type: 'commonjs-module' },
+    // Required, but don't worry about it (For nerds: with the default `publicPath: "auto"` Webpack
+    // outputs code that doesn't work in our Asset Link browser environment - similar to this issue:
+    // https://github.com/angular-architects/module-federation-plugin/issues/96)
+    publicPath: '/',
   },
+  // This can be changed to 'production' - see https://webpack.js.org/configuration/mode/
   mode: 'development',
+
+  // Output a module and don't try and bundle things like `vue` that are provided by Asset Link
+  experiments: {
+    outputModule: true,
+  },
+  externalsType: 'module',
+  externals: {
+    ...assetLinkIncludedLibraries,
+  },
```

## Example package with Built Plugin

See https://github.com/symbioquine/example-assetlink-built-plugin-pkg

## Vue SFC Plugins that require a (Webpack) build step

If we want to write `.alink.vue` plugins that need a build step to include other modules, we can do that too.

From the previous example we can rename our `ExampleChartPage.alink.js` to `ExampleChartPage.alink.vue` and make a few changes;

```shell
mv ./src/ExampleChartPage.alink.js ./src/ExampleChartPage.alink.vue
edit ./src/ExampleChartPage.alink.vue
```

The new **ExampleChartPage.alink.vue** file;

```vue
<script setup>
import {
  Chart as ChartJS,
  Colors,
  CategoryScale,
  LinearScale,
  BarElement,
  Legend
} from 'chart.js'

ChartJS.register(
  Colors,
  BarElement,
  CategoryScale,
  LinearScale,
  Legend
);

import {
  Bar as BarChart
} from 'vue-chartjs'

const data = [
  { year: 2010, count: 10 },
  { year: 2011, count: 20 },
  { year: 2012, count: 15 },
  { year: 2013, count: 25 },
  { year: 2014, count: 22 },
  { year: 2015, count: 30 },
  { year: 2016, count: 28 },
];

const chartData = {
  labels: data.map(row => row.year),
  datasets: [
    {
      label: 'Acquisitions by year',
      data: data.map(row => row.count)
    }
  ]
};
</script>

<template>
  <bar-chart :data="chartData"></bar-chart>
</template>

<script>
export default {
  onLoad(handle, assetLink) {
    handle.defineRoute('com.example.farmos_asset_link.routes.v0.example_chart_page', route => {
      route.path('/example-chart-page');
      route.component(handle.thisPlugin);
    });
  }
}
</script>

<style scoped>
/* This style block isn't required, just included as an example to show that the scoped styling works */
canvas {
  border: solid black 10px;
}
</style>

```

Add our dependencies;

```shell
npm install -D vue-loader vue-style-loader css-loader
```

Update **webpack.config.js**;

```diff
--- a/./webpack.config.js
+++ b/./webpack.config.js
@@ -1,3 +1,5 @@
+const { VueLoaderPlugin } = require("vue-loader");
+
 const {
   assetLinkIncludedLibraries,
   GenerateDefaultPluginConfigYmlFilesPlugin,
@@ -7,7 +9,8 @@ const {
 module.exports = {
   entry: {
     // Add an entry here for each plugin in the `src` directory that needs building
-    'ExampleChartPage.alink.js': './src/ExampleChartPage.alink.js',
+    'ExampleSimplePage.alink.js': './src/ExampleSimplePage.alink.vue',
+    'ExampleChartPage.alink.js': './src/ExampleChartPage.alink.vue',
   },
   output: {
     // Output the built plugins in the current directory - alongside any unbuilt plugins
@@ -33,7 +36,27 @@ module.exports = {
     ...assetLinkIncludedLibraries,
   },
 
+  module: {
+    rules: [
+      {
+        test: /\.vue$/i,
+        exclude: /(node_modules)/,
+        use: {
+          loader: "vue-loader",
+        },
+      },
+      {
+        test: /\.css$/,
+        use: [
+          { loader: "vue-style-loader" },
+          { loader: "css-loader" },
+        ],
+      },
+    ]
+  },
+
   plugins: [
+    new VueLoaderPlugin(),
     new GenerateDefaultPluginConfigYmlFilesPlugin({
       pluginDir: __dirname,
       drupalModuleName: 'example_built_vue_alink_plugins',
```

## Example package with Built Vue SFC Plugins

See https://github.com/symbioquine/example-assetlink-built-vue-plugin-pkg