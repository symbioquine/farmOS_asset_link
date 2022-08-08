import { createApp } from "vue";
import FloatingSidebar from "./FloatingSidebar.vue";
import { Quasar } from "quasar";
import quasarUserOptions from "./quasar-user-options";
import devToolsPlugin from "assetlink/devToolsPlugin";

import { components as pluginApiComponents } from "assetlink-plugin-api";

import Cookies from "js-cookie";

window.assetLinkDrupalBasePath = Cookies.get("assetLinkDrupalBasePath");
if (!window.assetLinkDrupalBasePath && window.drupalSettings?.path?.baseUrl) {
  window.assetLinkDrupalBasePath = window.drupalSettings.path.baseUrl;
  Cookies.set("assetLinkDrupalBasePath", "window.assetLinkDrupalBasePath", {
    expires: 365,
  });
}

const app = createApp(FloatingSidebar).use(Quasar, quasarUserOptions);

//Add the components from the "assetlink-plugin-api" library
Object.entries(pluginApiComponents).forEach(([componentName, component]) =>
  app.component(componentName, component)
);

devToolsPlugin({ app });

app.mount("#asset-link-floating-sidebar");
