import { createApp, defineAsyncComponent } from "vue";
import FloatingSidebar from "./FloatingSidebar.vue";
import { Quasar } from "quasar";
import quasarUserOptions from "./quasar-user-options";

const Content = defineAsyncComponent(() => import("assetlink_core/Content"));
const Button = defineAsyncComponent(() => import("assetlink_core/Button"));

const app = createApp(FloatingSidebar).use(Quasar, quasarUserOptions);

app.component("content-element", Content);
app.component("button-element", Button);

app.mount("#asset-link-floating-sidebar");
