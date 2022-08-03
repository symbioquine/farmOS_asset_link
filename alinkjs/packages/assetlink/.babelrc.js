module.exports = {
  presets: [],
  plugins: [
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
