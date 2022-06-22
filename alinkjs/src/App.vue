<template>
  <q-layout view="lHh Lpr lFf">
    <q-header elevated>
      <q-toolbar class="bg-green text-white">

        <q-toolbar-title>
          Asset Link <test-component></test-component>
        </q-toolbar-title>

        <farmos-sync-icon @click.stop="$refs.syncTray.toggle()"></farmos-sync-icon>
      </q-toolbar>
    </q-header>

    <farmos-sync-tray ref="syncTray"></farmos-sync-tray>

    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script>
import { defineComponent, defineAsyncComponent } from 'vue'
import * as Vue from 'vue';
import { loadModule } from 'vue3-sfc-loader/dist/vue3-sfc-loader.esm.js';

import AssetLink from '@/AssetLink';
import NonReactiveAssetLinkDecorator from '@/NonReactiveAssetLinkDecorator';

const moduleCache = {
  vue: Vue,
  'asset-link/utils': {
    color: () => 'yellow',
  },
};

const loadPlugin = async (pluginUrl) => {
  const pluginUrlWithoutParams = new URL(pluginUrl.toString());
  pluginUrlWithoutParams.search = '';

  const options = {
    moduleCache,
    getFile: async (url) => {
      const fileUrl = new URL(url);

      const pluginSrcRes = await fetch(fileUrl);

      const pluginSrc = await pluginSrcRes.text();

      if (fileUrl.pathname.endsWith('alink.js')) {
        return { getContentData: () => pluginSrc, type: ".mjs" }
      } else if (fileUrl.pathname.endsWith('alink.vue')) {
        return { getContentData: () => pluginSrc, type: ".vue" }
      } else {
        throw new Error(`Secondary imports are not supported. url=${url}`);
      }
    },
    addStyle: () => {},
  };

  return await loadModule(pluginUrlWithoutParams.href, options);
};

const TestComponent = defineAsyncComponent(async () => {
  const m = await loadPlugin(new URL('/alink-plugins/Example.alink.vue', import.meta.url));

  console.log("component plugin:", m, );

  return m;
});

const loadJsPlugin = async () => {
  const m = await loadPlugin(new URL('/alink-plugins/Example2.alink.js', import.meta.url));

  console.log("JS plugin:", m, );
};

loadJsPlugin();

if (import.meta.hot) {
  import.meta.hot.on('asset-link-plugin-changed', (data) => {
    const pluginChangedEvent = new CustomEvent('asset-link-plugin-changed', {
      detail: {
        pluginUrl: data.pluginUrl,
      },
    });

    window.dispatchEvent(pluginChangedEvent);
  })
}

export default defineComponent({
  name: 'App',
  components: {
    TestComponent,
  },
  setup () {
    return {
      assetLink: NonReactiveAssetLinkDecorator.decorate(new AssetLink(this)),
    }
  },
  created () {
    this.assetLink.boot();
  },
})
</script>
