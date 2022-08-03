import { createApp } from "vue";
import FloatingSidebar from "./FloatingSidebar.vue";
import { Quasar } from "quasar";
import quasarUserOptions from "./quasar-user-options";

console.log("Running bootstrap...");

import Cookies from "js-cookie";

window.assetLinkDrupalBasePath = Cookies.get("assetLinkDrupalBasePath");
if (!window.assetLinkDrupalBasePath && window.drupalSettings?.path?.baseUrl) {
  window.assetLinkDrupalBasePath = window.drupalSettings.path.baseUrl;
  Cookies.set("assetLinkDrupalBasePath", "window.assetLinkDrupalBasePath", {
    expires: 365,
  });
}

const app = createApp(FloatingSidebar).use(Quasar, quasarUserOptions);

app.mount("#asset-link-floating-sidebar");
