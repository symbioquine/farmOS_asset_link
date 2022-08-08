const { defineConfig } = require("@vue/cli-service");

module.exports = defineConfig({
  transpileDependencies: ["quasar"],

  configureWebpack: (config) => {
    config.output.library = config.output.library || {};
    config.output.library.type = "commonjs-static";

    config.resolve.fallback = {
      ...config.resolve.fallback,
      path: require.resolve("path-browserify"),
    };

    config.externals = {
      ...config.externals,
      quasar: "commonjs-module quasar",
      "qr-scanner": "commonjs-module qr-scanner",
      vue: "commonjs-module vue",
      "vue-router": "commonjs-module vue-router",
    };
  },

  pluginOptions: {
    quasar: {
      importStrategy: "kebab",
      rtlSupport: false,
    },
  },
});
