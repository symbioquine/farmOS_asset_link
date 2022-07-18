import { createApp } from 'vue';
import FloatingSidebar from './FloatingSidebar.vue';
import { Quasar } from "quasar";

const app = createApp(FloatingSidebar).use(Quasar, {});

app.mount('#asset-link-floating-sidebar');
