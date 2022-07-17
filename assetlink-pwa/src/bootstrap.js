import { createApp, defineAsyncComponent } from "vue";
import "./registerServiceWorker";
import router from "./router";
import App from "./App.vue";
import { Quasar } from "quasar";
import quasarUserOptions from "./quasar-user-options";

const Content = defineAsyncComponent(() => import("assetlink_core/Content"));
const Button = defineAsyncComponent(() => import("assetlink_core/Button"));

const app = createApp(App).use(router).use(Quasar, quasarUserOptions);

app.component("content-element", Content);
app.component("button-element", Button);

app.mount("#app");
