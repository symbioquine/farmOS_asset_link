import { createApp } from "vue";
import "./registerServiceWorker";
import { Quasar } from "quasar";
import devToolsPlugin from "assetlink/devToolsPlugin";
import router from "./router";
import App from "./App.vue";
import quasarUserOptions from "./quasar-user-options";

import { components as pluginApiComponents } from "assetlink-plugin-api";

// This shouldn't actually get used since Drupal isn't available
window.assetLinkDrupalBasePath = "/";

const path = require("path");

const app = createApp(App).use(router).use(Quasar, quasarUserOptions);
app.provide("app", app);

function importAll(requireContext, extension) {
  return requireContext.keys().map((componentFile) => {
    const component = requireContext(componentFile).default;
    const componentName = path.basename(componentFile, extension);
    app.component(componentName, component);
    return component;
  });
}

importAll(require.context("./components/", true, /\.vue$/), ".vue");
importAll(require.context("./components/", true, /\.js$/), ".js");

// Add the components from the "assetlink-plugin-api" library
Object.entries(pluginApiComponents).forEach(([componentName, component]) =>
  app.component(componentName, component)
);

devToolsPlugin({ app });

app.mount("#app");
