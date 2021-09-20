import Vue from 'vue';

import SideBar from './SideBar.vue';

/* eslint-disable-next-line no-console */
console.log('farmos_asset_link_sidecar.js loaded');

const container = document.createElement('div');

document.body.appendChild(container);

// Wait until all attached Drupal libraries get loaded
document.addEventListener('DOMContentLoaded', () => {
  new Vue({
    render: h => h(SideBar),
  }).$mount(container);
});
