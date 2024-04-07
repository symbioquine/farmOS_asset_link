module.exports = api => {
  const isTest = api.env('test');

  const plugins = isTest ? [
    "@babel/plugin-transform-modules-commonjs",
  ] : [
    ["@babel/plugin-proposal-decorators", { "decoratorsBeforeExport": true, "version": "2021-12" }],
  ];

  const alias = {
      "@": "assetlink",
  };

  const cfg = {
    presets: [],
    plugins: [
      ...plugins,
      '@babel/plugin-transform-class-static-block',
      [
        require.resolve('babel-plugin-module-resolver'),
        {
          alias,
          loglevel: 'silent',
        }
      ]
    ]
  };

  if (isTest) {
    cfg.presets.push("@vue/babel-preset-app");

    alias["@"] = "./src";
  }

  return cfg;
};
