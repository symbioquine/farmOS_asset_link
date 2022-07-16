import { createApp, defineAsyncComponent } from 'vue';
import Layout from './Layout.vue';

const Content = defineAsyncComponent(() => import('assetlink_core/Content'));
const Button = defineAsyncComponent(() => import('assetlink_core/Button'));

const app = createApp(Layout);

app.component('content-element', Content);
app.component('button-element', Button);

app.mount('#app');