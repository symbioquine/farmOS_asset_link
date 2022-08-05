import { createApp } from "vue";
import "./registerServiceWorker";
import { Quasar } from "quasar";
import devToolsPlugin from "assetlink/devToolsPlugin";
import router from "./router";
import App from "./App.vue";
import quasarUserOptions from "./quasar-user-options";

import Cookies from "js-cookie";

window.assetLinkDrupalBasePath = Cookies.get("assetLinkDrupalBasePath");

const path = require("path");

const app = createApp(App).use(router).use(Quasar, quasarUserOptions);

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

devToolsPlugin({ app });

app.mount("#app");
