/* eslint-env node */

/*
 * This file runs in a Node context (it's NOT transpiled by Babel), so use only
 * the ES6 features that are supported by your Node version. https://node.green/
 */

// Configuration for your app
// https://v2.quasar.dev/quasar-cli-vite/quasar-config-js

const Components = require('unplugin-vue-components/vite');
const { configure } = require('quasar/wrappers');
const { NodeGlobalsPolyfillPlugin } = require('@esbuild-plugins/node-globals-polyfill');
const fs = require('fs');
const path = require('path');

const DEV_PROXY_TARGET = process.env.ASSET_LINK_DEV_PROXY_TARGET || 'http://localhost';

const targetUrl = new URL(DEV_PROXY_TARGET);

const devHost = targetUrl.hostname;

const quasarComponents = [];
const quasarDirectives = [];

fs.readdirSync(`${__dirname}/node_modules/quasar/dist/api`).forEach(filename => {
  const nameWithoutExt = filename.replace(/(\.[^.]+)*$/, '');
  const apiData = JSON.parse(fs.readFileSync(`${__dirname}/node_modules/quasar/dist/api/${filename}`));

  if (apiData.type === 'component') {
    quasarComponents.push(nameWithoutExt);
  }

  if (apiData.type === 'directive') {
    quasarDirectives.push(nameWithoutExt);
  }
});

const assetLinkPluginsDir = fs.realpathSync(`${__dirname}/public/alink-plugins`);

function AssetLinkPluginHotReload() {
  return {
    name: 'asset-link-plugin-changed',
    handleHotUpdate({ file, server }) {
      const realFilePath = fs.realpathSync(file);

      const fileName = path.basename(file);

      if (realFilePath.indexOf(assetLinkPluginsDir) == 0) {
        server.ws.send({
          type: "custom",
          event: "asset-link-plugin-changed",
          data: {
            pluginUrl: `${targetUrl.protocol}//${devHost}:${server.config.server.port}/alink/alink-plugins/${fileName}`,
          },
        });
      }
    },
  }
}


module.exports = configure(function (/* ctx */) {
  return {
    eslint: {
      // fix: true,
      // include = [],
      // exclude = [],
      // rawOptions = {},
      warnings: true,
      errors: true
    },

    // https://v2.quasar.dev/quasar-cli/prefetch-feature
    // preFetch: true,

    // app boot file (/src/boot)
    // --> boot files are part of "main.js"
    // https://v2.quasar.dev/quasar-cli/boot-files
    boot: [
      'readDrupalBasePathCookie',
    ],

    // https://v2.quasar.dev/quasar-cli-vite/quasar-config-js#css
    css: [
      'app.scss'
    ],

    // https://github.com/quasarframework/quasar/tree/dev/extras
    extras: [
      // 'ionicons-v4',
      // 'mdi-v5',
      // 'fontawesome-v6',
      // 'eva-icons',
      // 'themify',
      // 'line-awesome',
      // 'roboto-font-latin-ext', // this or either 'roboto-font', NEVER both!

      'roboto-font', // optional, you are not bound to it
      'mdi-v6', // optional, you are not bound to it
    ],

    // Full list of options: https://v2.quasar.dev/quasar-cli-vite/quasar-config-js#build
    build: {
      target: {
        browser: [ 'es2019', 'edge88', 'firefox78', 'chrome87', 'safari13.1' ],
        node: 'node16'
      },

      vueRouterMode: 'history', // available values: 'hash', 'history'
      // vueRouterBase,
      // vueDevtools,
      // vueOptionsAPI: false,

      // rebuildCache: true, // rebuilds Vite/linter/etc cache on startup

      publicPath: '/alink',
      // analyze: true,
      // env: {},
      // rawDefine: {}
      // ignorePublicFolder: true,
      // minify: false,
      // polyfillModulePreload: true,
      // distDir

      extendViteConf (viteConf) {
        viteConf.resolve.alias.path = 'path-browserify';
        viteConf.resolve.alias['@'] = path.resolve(__dirname, './src');

        viteConf.plugins.push(AssetLinkPluginHotReload());
        viteConf.plugins.push(Components({ /* options */ }));

        viteConf.build.rollupOptions = {
          output: {
            manualChunks(id) {
              if (id.includes('/node_modules/')) {
                const modules = ['quasar', '@quasar', 'vue', '@vue']
                const chunk = modules.find((module) => id.includes(`/node_modules/${module}`))
                return chunk ? `vendor-${chunk}` : 'vendor'
              }
            },
          }
        };

        viteConf.optimizeDeps = viteConf.optimizeDeps || {};
        viteConf.optimizeDeps.esbuildOptions = viteConf.optimizeDeps.esbuildOptions || {};

        viteConf.optimizeDeps.esbuildOptions.define = viteConf.optimizeDeps.esbuildOptions.define || {};
        viteConf.optimizeDeps.esbuildOptions.define.global = 'globalThis';

        viteConf.optimizeDeps.esbuildOptions.plugins = viteConf.optimizeDeps.esbuildOptions.plugins || [];
        viteConf.optimizeDeps.esbuildOptions.plugins.push(NodeGlobalsPolyfillPlugin({
          buffer: true
        }));
      },

      // viteVuePluginOptions: {},

      
      // vitePlugins: [
      //   [ 'package-name', { ..options.. } ]
      // ]
    },

    // Full list of options: https://v2.quasar.dev/quasar-cli-vite/quasar-config-js#devServer
    devServer: {
      // https: true
      open: true, // opens browser window automatically 
      proxy: {
        '^(/alink/backend|/(?!alink).*)': {
            target: 'http://localhost:80',
            xfwd: true,
        }
      },
      headers: {
        'Set-Cookie': 'assetLinkDrupalBasePath=/; path=/',
      },
    },

    // https://v2.quasar.dev/quasar-cli-vite/quasar-config-js#framework
    framework: {
      config: {},

      // iconSet: 'material-icons', // Quasar icon set
      // lang: 'en-US', // Quasar language pack

      // For special cases outside of where the auto-import strategy can have an impact
      // (like functional components as one of the examples),
      // you can manually specify Quasar components/directives to be available everywhere:
      //
      components: quasarComponents,
      directives: quasarDirectives,

      // Quasar plugins
      plugins: []
    },

    // animations: 'all', // --- includes all animations
    // https://v2.quasar.dev/options/animations
    animations: [],

    // https://v2.quasar.dev/quasar-cli-vite/quasar-config-js#property-sourcefiles
    // sourceFiles: {
    //   rootComponent: 'src/App.vue',
    //   router: 'src/router/index',
    //   store: 'src/store/index',
    //   registerServiceWorker: 'src-pwa/register-service-worker',
    //   serviceWorker: 'src-pwa/custom-service-worker',
    //   pwaManifestFile: 'src-pwa/manifest.json',
    //   electronMain: 'src-electron/electron-main',
    //   electronPreload: 'src-electron/electron-preload'
    // },

    // https://v2.quasar.dev/quasar-cli/developing-pwa/configuring-pwa
    pwa: {
      workboxMode: 'generateSW', // or 'injectManifest'
      injectPwaMetaTags: true,
      swFilename: 'sw.js',
      manifestFilename: 'manifest.json',
      useCredentialsForManifestTag: false,
      // extendGenerateSWOptions (cfg) {}
      // extendInjectManifestOptions (cfg) {},
      // extendManifestJson (json) {}
      // extendPWACustomSWConf (esbuildConf) {}
    },

    // Full list of options: https://v2.quasar.dev/quasar-cli/developing-cordova-apps/configuring-cordova
    cordova: {
      // noIosLegacyBuildFlag: true, // uncomment only if you know what you are doing
    },

    // Full list of options: https://v2.quasar.dev/quasar-cli/developing-capacitor-apps/configuring-capacitor
    capacitor: {
      hideSplashscreen: true
    },

    // Full list of options: https://v2.quasar.dev/quasar-cli/developing-electron-apps/configuring-electron
    electron: {
      // extendElectronMainConf (esbuildConf)
      // extendElectronPreloadConf (esbuildConf)

      inspectPort: 5858,

      bundler: 'packager', // 'packager' or 'builder'

      packager: {
        // https://github.com/electron-userland/electron-packager/blob/master/docs/api.md#options

        // OS X / Mac App Store
        // appBundleId: '',
        // appCategoryType: '',
        // osxSign: '',
        // protocol: 'myapp://path',

        // Windows only
        // win32metadata: { ... }
      },

      builder: {
        // https://www.electron.build/configuration/configuration

        appId: 'alinkjs2'
      }
    },

    // Full list of options: https://v2.quasar.dev/quasar-cli-vite/developing-browser-extensions/configuring-bex
    bex: {
      contentScripts: [
        'my-content-script'
      ],

      // extendBexScriptsConf (esbuildConf) {}
      // extendBexManifestJson (json) {}
    }
  }
});
