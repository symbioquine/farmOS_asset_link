module.exports = api => {
  const isTest = api.env('test');

  const testPlugins = isTest ? ["@babel/plugin-transform-modules-commonjs"] : [];

  return {
    presets: [],
    plugins: [
      ...testPlugins,
      ["@babel/plugin-syntax-decorators", { "decoratorsBeforeExport": true }],
      [
        require.resolve('babel-plugin-module-resolver'),
        {
          alias: {
            "@": "assetlink",
          },
          loglevel: 'silent',
        }
      ]
    ]
  };
};
