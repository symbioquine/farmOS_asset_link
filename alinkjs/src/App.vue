<template>
  <q-layout view="lHh Lpr lFf">
    <q-header elevated>
      <q-toolbar class="bg-green text-white">

        <q-toolbar-title>
          Asset Link
        </q-toolbar-title>

        <farmos-sync-icon @click.stop="$refs.syncTray.toggle()"></farmos-sync-icon>

        <q-btn flat padding="xs" icon="mdi-cog" class="q-ml-sm" @click.stop v-if="configActionDefs.length">
          <q-menu>
            <q-list style="min-width: 200px">
              <component
                  v-for="slotDef in configActionDefs"
                  :key="slotDef.id"
                  :is="slotDef.component"
                  v-bind="slotDef.props"></component>
            </q-list>
          </q-menu>
        </q-btn>

      </q-toolbar>
    </q-header>

    <farmos-sync-tray ref="syncTray"></farmos-sync-tray>

    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script>
import { defineComponent, defineAsyncComponent, inject, getCurrentInstance, provide, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'

import AssetLink from '@/AssetLink';
import NonReactiveAssetLinkDecorator from '@/NonReactiveAssetLinkDecorator';

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
  setup (props, { expose }) {
    const app = inject('app');
    const rootComponent = getCurrentInstance();

    const router = useRouter();
    const route = useRoute();

    const assetLink = NonReactiveAssetLinkDecorator.decorate(new AssetLink(app, rootComponent));

    provide('assetLink', assetLink);

    const configActionDefs = computed(() => {
      if (!assetLink.vm.booted) {
        return [];
      }

      return assetLink.getSlots({ type: 'config-action', route });
    });

    expose({
      assetLink,
      async addRoute(routeDef) {
        console.log("Adding route:", routeDef.name);
        const currentRoute = route.name;
        const currentRoutePath = route.path;

        router.addRoute({
          name: routeDef.name,
          path: routeDef.path,
          component: routeDef.component,
          props: routeDef.props,
        });

        const resolved = router.resolve(currentRoutePath);

        if (resolved.name === routeDef.name) {
          await router.replace('/');
          await router.replace(currentRoutePath);
        }
        console.log("Done adding route:", routeDef.name);
      },
      /* eslint-disable no-console,no-unused-vars */
      removeRoute(routeDef) {
        // TODO: Implement
      },
    });
    return {
      assetLink,
      configActionDefs,
    };
  },
  created () {
    this.assetLink.boot();
  },
})
</script>
