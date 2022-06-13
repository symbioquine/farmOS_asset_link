import Vue from 'vue'
import FloatingSidebar from './FloatingSidebar.vue'
import vuetify from './plugins/vuetify'

Vue.config.productionTip = false

import Cookies from 'js-cookie'
import './registerServiceWorker'

window.assetLinkDrupalBasePath = Cookies.get('assetLinkDrupalBasePath');

if (!window.assetLinkDrupalBasePath && window.drupalSettings?.path?.baseUrl) {
  window.assetLinkDrupalBasePath = window.drupalSettings.path.baseUrl;
  Cookies.set('assetLinkDrupalBasePath', 'window.assetLinkDrupalBasePath', { expires: 365 });
}

new Vue({
  vuetify,
  render: h => h(FloatingSidebar),
}).$mount('#asset-link-floating-sidebar')
