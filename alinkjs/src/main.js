import Vue from 'vue'
import App from './App.vue'
import vuetify from './plugins/vuetify'
import router from './router'

Vue.config.productionTip = false

import Cookies from 'js-cookie'
import './registerServiceWorker'

import AsyncComputed from 'vue-async-computed';
Vue.use(AsyncComputed);

import VuetifyDialog from 'vuetify-dialog'
import 'vuetify-dialog/dist/vuetify-dialog.css'

Vue.use(VuetifyDialog, { context: { vuetify } });

window.assetLinkDrupalBasePath = Cookies.get('assetLinkDrupalBasePath');

const path = require('path');

function importAll(requireContext) {
  return requireContext.keys().map((componentFile) => {
    const component = requireContext(componentFile).default;
    const componentName = path.basename(componentFile, '.vue');
    Vue.component(componentName, component);
    return component;
  });
}

importAll(require.context('./components/', true, /\.vue$/));

new Vue({
  vuetify,
  router,
  render: h => h(App),
}).$mount('#app')
