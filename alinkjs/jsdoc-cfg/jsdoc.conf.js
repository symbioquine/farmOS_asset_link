'use strict';

module.exports = {
  "source": {
    "include": [
      "./packages/assetlink-plugin-api/src",
      "./packages/assetlink-plugin-dev-support/src"
    ],
    "includePattern": "\\.(js|vue)$"
  },
  "plugins": [
    "node_modules/jsdoc-babel",
    "node_modules/jsdoc-vuejs",
    "plugins/markdown",
    "node_modules/better-docs/category",
  ],
  "markdown": {
    "tags": ["example"],
    idInHeadings: true,
  },
  "babel": {
    "presets": ["@babel/env"]
  },
  'jsdoc-vuejs': {
    "template": "./jsdoc-cfg/custom-default.template.ejs",
  },
  "opts": {
    "encoding": "utf8",
    "destination": "../website/",
    "recurse": true,
    "verbose": true,
    "readme": "./packages/assetlink-plugin-api/README.md",
    "template": "./node_modules/better-docs",
    "tutorials": "./packages/assetlink-plugin-api/tutorials",
  },
  "templates": {
    "search": true,
    "better-docs": {
      "name": "Asset Link",
      "logo": "https://user-images.githubusercontent.com/30754460/184543756-4bbd5d3b-7a87-487b-b2ab-5d7244e728ac.png",
      "title": "Asset Link docs",
      "css": "./custom-styles.css",
      "search": true,
      "hideGenerator": false,
      "navLinks": [
        {
            "label": "Github",
            "href": "https://github.com/symbioquine/farmOS_asset_link"
        },
        {
          "label": "Plugin API 📦",
          "href": "https://www.npmjs.com/package/assetlink-plugin-api"
        },
        {
          "label": "Dev Support 📦",
          "href": "https://www.npmjs.com/package/assetlink-plugin-dev-support"
        }
      ]
    },
    "default": {
      "staticFiles": {
        "include": [
            "./jsdoc-cfg/static",
            "./packages/assetlink-plugin-api/tutorials/static"
        ]
      }
    }
  }
};
