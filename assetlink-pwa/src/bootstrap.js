import { createApp, defineAsyncComponent } from "vue";
import "./registerServiceWorker";
import router from "./router";
import AppLayout from "./components/AppLayout.vue";

const Content = defineAsyncComponent(() => import("assetlink_core/Content"));
const Button = defineAsyncComponent(() => import("assetlink_core/Button"));

const app = createApp(AppLayout).use(router);

app.component("content-element", Content);
app.component("button-element", Button);

app.mount("#app");
