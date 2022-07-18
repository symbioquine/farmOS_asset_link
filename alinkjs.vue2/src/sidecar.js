import { createApp } from 'vue'
import FloatingSidebar from './FloatingSidebar.vue'

Vue.config.productionTip = false

import Cookies from 'js-cookie'

if (!window.assetLinkDrupalBasePath && window.drupalSettings?.path?.baseUrl) {
  window.assetLinkDrupalBasePath = window.drupalSettings.path.baseUrl;
  Cookies.set('assetLinkDrupalBasePath', 'window.assetLinkDrupalBasePath', { expires: 365 });
}

const app = createApp(FloatingSidebar);

app.mount('#asset-link-floating-sidebar')
