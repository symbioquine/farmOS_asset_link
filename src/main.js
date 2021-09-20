/* eslint-disable import/first, import/order, import/newline-after-import */

import Vue from 'vue';

import VueRouter from 'vue-router';
Vue.use(VueRouter);

import AsyncComputed from 'vue-async-computed';
Vue.use(AsyncComputed);

import Vlf from 'vlf';
import localforage from 'localforage';
Vue.use(Vlf, localforage);

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
const pages = importAll(require.context('./pages/', true, /\.vue$/));

const routes = pages.map(page => ({
  name: page.name,
  path: page.routePath,
  component: page,
}));

const router = new VueRouter({
  mode: 'history',
  base: `${window.drupalSettings.path.baseUrl}alink/`,
  routes,
});

router.afterEach((to) => {
  document.title = to.meta.title || `Asset Link | ${window.drupalSettings.farmos_asset_link.site_name}`;
});

import App from './App.vue';

import AssetLinkInstance from './AssetLinkInstance';

window.assetLink = new AssetLinkInstance();

import BaseAssetResolver from './plugins/BaseAssetResolver';
import ExampleActionProvider from './plugins/ExampleActionProvider';

window.assetLink.registerPlugin(new BaseAssetResolver());
window.assetLink.registerPlugin(new ExampleActionProvider());

// Wait until all attached Drupal libraries get loaded
document.addEventListener('DOMContentLoaded', () => {
  new Vue({
    router,
    render: h => h(App),
  }).$mount('#farm-asset-link-app');
});
