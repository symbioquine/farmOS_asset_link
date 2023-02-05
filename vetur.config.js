// vetur.config.js
/** @type {import('vls').VeturConfig} */
module.exports = {
    // **optional** default: `{}`
    // override vscode settings
    // Notice: It only affects the settings used by Vetur.
    settings: {
      "vetur.useWorkspaceDependencies": true,
      "vetur.experimental.templateInterpolationService": true
    },
    // **optional** default: `[{ root: './' }]`
    // support monorepos
    projects: [
      './alinkjs/packages/assetlink',
      './alinkjs/packages/assetlink-default-plugins',
      './alinkjs/packages/assetlink-plugin-api',
      './alinkjs/packages/assetlink-plugin-pwa',
      './alinkjs/packages/assetlink-plugin-sidecar',
    ]
  }
  