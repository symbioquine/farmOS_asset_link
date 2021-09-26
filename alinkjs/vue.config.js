const prefixer = require('postcss-prefix-selector');

module.exports = {
  publicPath: process.env.NODE_ENV === 'production'
    ? '/__THIS_GETS_REPLACED_AT_RUNTIME_BY_THE_DRUPAL_CONTROLLER__/'
    : '/alink/',
  outputDir: '../farmos_asset_link/asset-link-dist/',
  transpileDependencies: [
    'vuetify'
  ],
  css: {
    extract: { ignoreOrder: true },
  },
  runtimeCompiler: true,
  filenameHashing: false,
  pages: {
    app: {
      entry: "src/main.js",
      template: "public/index.html",
      filename: "index.html",
      title: "Index Page"
    },
    sidecar: {
      entry: "src/sidecar.js",
      template: "public/index.html",
      filename: "sidecar.html",
      title: "Unused Sidecar Page"
    },
  },
  pwa: {
    workboxPluginMode: 'InjectManifest',
    workboxOptions: {
      swSrc: './src/service-worker.js',
    },
  },
  configureWebpack: (config) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      "path": require.resolve("path-browserify"),
    };
  },
  chainWebpack: (config) => {
    // From https://github.com/vuetifyjs/vuetify/issues/8530#issuecomment-680942337
    const sassRule = config.module.rule('sass');
    const sassNormalRule = sassRule.oneOfs.get('normal');
    // creating a new rule
    const vuetifyRule = sassRule.oneOf('vuetify').test(/[\\/]vuetify[\\/]src[\\/]/);
    // taking all uses from the normal rule and adding them to the new rule
    Object.keys(sassNormalRule.uses.entries()).forEach((key) => {
        vuetifyRule.uses.set(key, sassNormalRule.uses.get(key));
    });
    // moving rule "vuetify" before "normal"
    sassRule.oneOfs.delete('normal');
    sassRule.oneOfs.set('normal', sassNormalRule);
    // adding prefixer to the "vuetify" rule
    vuetifyRule.use('vuetify').loader(require.resolve('postcss-loader')).tap((options = {}) => {
        options.sourceMap = process.env.NODE_ENV !== 'production';
        options.postcssOptions = {};
        options.postcssOptions.plugins = [
            prefixer({
                prefix: '[data-vuetify]',
                transform(prefix, selector, prefixedSelector) {
                    let result = prefixedSelector;
                    if (selector.startsWith('html') || selector.startsWith('body')) {
                        result = prefix + selector.substring(4);
                    }
                    return result;
                },
            }),
        ];
        return options;
    });
    // moving sass-loader to the end
    vuetifyRule.uses.delete('sass-loader');
    vuetifyRule.uses.set('sass-loader', sassNormalRule.uses.get('sass-loader'));

    config.module.rules.delete('svg');
    config.module
      .rule('svg')
      .test(/\.(svg)(\?.*)?$/)
      .use('vue-loader')
      .loader('vue-loader')
      .end()
      .use('vue-svg-loader')
      .loader('vue-svg-loader')
  },
  devServer: {
    // Deprecated `https` config still needed to cause links printed to console to have correct protocol
    // https://github.com/symfony/webpack-encore/issues/1064
    https: true,
    server: {
      type: 'https',
      options: {
        ca: `${__dirname}/../devcerts/rootCA.pem`,
        key: `${__dirname}/../devcerts/v2.farmos.test/privkey.pem`,
        cert: `${__dirname}/../devcerts/v2.farmos.test/fullchain.pem`,
      },
    },
    host: "v2.farmos.test",
    allowedHosts: [
      'v2.farmos.test',
    ],
    headers: {
      'Set-Cookie': 'assetLinkDrupalBasePath=/; path=/',
    },
    proxy: {
      "^/": {
        ws: false,
        target: 'https://v2.farmos.test:443',
        context: () => true,
        headers: {
          'X-Forwarded-For': 'v2.farmos.test:8080',
        },
        bypass: function (req, res, proxyOptions) {
          if (req.path.indexOf('/alink/backend') === 0) {
            console.log(`'${req.path}' is an alink backend url - passing to proxy...`);
            return null;
          }
          if (req.path.indexOf('/alink') === 0) {
            return req.path;
          }
          console.log(`'${req.path}' is not an alink url - passing to proxy...`);
        },
      },
    },
  },
}
