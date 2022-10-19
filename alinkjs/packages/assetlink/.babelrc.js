module.exports = {
  presets: [],
  plugins: [
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
