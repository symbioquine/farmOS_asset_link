import { createApp } from 'vue';

import SideBar from './SideBar.vue';

/* eslint-disable-next-line no-console */
console.log('farmos_asset_link_sidecar.js loaded');

const container = document.createElement('div');

document.body.appendChild(container);

createApp(SideBar).mount(container);
