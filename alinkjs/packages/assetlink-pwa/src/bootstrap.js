import { createApp } from "vue";
import "./registerServiceWorker";
import { Quasar } from "quasar";
import devToolsPlugin from "assetlink/devToolsPlugin";
import router from "./router";
import App from "./App.vue";
import quasarUserOptions from "./quasar-user-options";

import Cookies from "js-cookie";

window.assetLinkDrupalBasePath = Cookies.get("assetLinkDrupalBasePath");

const app = createApp(App).use(router).use(Quasar, quasarUserOptions);

devToolsPlugin({ app });

app.mount("#app");
