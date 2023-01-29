const esModules = ['assetlink-plugin-api', 'uuid', 'vue3-sfc-loader', 'quasar'].join('|');

/** @returns {Promise<import('jest').Config>} */
module.exports = async () => {
  return {
    testEnvironment: 'jest-environment-jsdom-global',
    moduleFileExtensions: ['js', 'json', 'vue'],
    transform: {
      "^.+\\.js$": "babel-jest",
      "^.+\\.vue$": "@vue/vue3-jest"
    },
    transformIgnorePatterns: [`/node_modules/(?!${esModules})`],
    verbose: true,
    setupFiles: [
      "fake-indexeddb/auto",
      "./test/customTestEnv",
    ],
  };
};
