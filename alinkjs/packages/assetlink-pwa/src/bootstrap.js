import { createApp } from "vue";
import "./registerServiceWorker";
import router from "./router";
import App from "./App.vue";
import { Quasar } from "quasar";
import quasarUserOptions from "./quasar-user-options";

const app = createApp(App).use(router).use(Quasar, quasarUserOptions);

app.mount("#app");
