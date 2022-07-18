const { defineConfig } = require("@vue/cli-service");
const { ModuleFederationPlugin } = require("webpack").container;

module.exports = defineConfig({
  publicPath:
    process.env.NODE_ENV === "production"
      ? "/__THIS_GETS_REPLACED_AT_RUNTIME_BY_THE_DRUPAL_CONTROLLER__/sidecar/"
      : "/alink/sidecar/",

  outputDir: "../farmos_asset_link/asset-link-dist/sidecar",

  transpileDependencies: ["quasar"],

  configureWebpack: {
    output: {
      filename: "main.js",
    },
    plugins: [
      new ModuleFederationPlugin({
        name: "assetlink_sidecar",
        filename: "remoteEntry.js",
        remotes: {
          assetlink_core:
            "assetlink_core@/__THIS_GETS_REPLACED_AT_RUNTIME_BY_THE_DRUPAL_CONTROLLER__/core/remoteEntry.js",
        },
        shared: {
          vue: {
            singleton: true,
          },
          quasar: {},
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
});
