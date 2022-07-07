<template>
  <q-layout view="lHh Lpr lFf">
    <q-header elevated>
      <q-toolbar class="bg-green text-white">

        <q-toolbar-title>
          Asset Link
        </q-toolbar-title>

        <farmos-sync-icon @click.stop="$refs.syncTray.toggle()"></farmos-sync-icon>

        <component
            v-for="slotDef in assetLink.getSlots({ type: 'toolbar-item', route })"
            :key="slotDef.id"
            :is="slotDef.component"
            v-bind="slotDef.props"
            class="q-mr-sm"></component>

      </q-toolbar>
    </q-header>

    <farmos-sync-tray ref="syncTray"></farmos-sync-tray>

    <q-page-container>

      <q-banner inline-actions class="text-white bg-orange-10" v-if="assetLink.connectionStatus.canReachFarmOS.value && !assetLink.connectionStatus.isLoggedIn.value">
        You are not logged in to farmOS.
        <template v-slot:action>
          <q-btn flat dense color="white" icon-right="mdi-account-key" label="Log in" :href="farmOSLoginUrl" />
        </template>
      </q-banner>

      <q-page>
        <router-view v-if="assetLink.vm.booted" />

        <q-inner-loading :showing="!assetLink.vm.booted">
          <q-circular-progress
            show-value
            font-size="16px"
            class="text-red q-ma-md"
            :value="assetLink.vm.bootProgress"
            size="100px"
            :thickness="0.25"
            color="#2E7D32"
            track-color="grey-3"
          >
            {{ assetLink.vm.bootProgress }}%
          </q-circular-progress>
          <span v-if="assetLink.vm.bootFailed" class="text-italic text-red-12">{{ assetLink.vm.bootText }}</span>
          <span v-else class="text-italic">{{ assetLink.vm.bootText }}</span>
        </q-inner-loading>

      </q-page>

    </q-page-container>

  </q-layout>
</template>

<script>
import { defineComponent, defineAsyncComponent, inject, getCurrentInstance, provide, computed, watch, ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'

import AssetLink from '@/AssetLink';
import createDrupalUrl from '@/createDrupalUrl';
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
    const rootComponent = getCurrentInstance();

    const router = useRouter();
    const route = useRoute();

    const devToolsApi = inject('devToolsApi');

    const assetLink = NonReactiveAssetLinkDecorator.decorate(new AssetLink(rootComponent, devToolsApi));

    provide('assetLink', assetLink);

    const configActionDefs = computed(() => {
      if (!assetLink.vm.booted) {
        return [];
      }

      return assetLink.getSlots({ type: 'config-action', route });
    });

    const farmOSLoginUrl = ref(null);
    watch(route, () => {
      farmOSLoginUrl.value = createDrupalUrl(`/user/login?destination=${window.location.pathname}`);
    }, { immediate: true })

    expose({
      assetLink,
      async addRoute(routeDef) {
        const currentRoute = route.name;
        const currentRoutePath = route.path;

        await router.addRoute({
          name: routeDef.name,
          path: routeDef.path,
          component: routeDef.component,
          props: routeDef.props,
        });

        const resolved = router.resolve(currentRoutePath);

        if (resolved.name === routeDef.name) {
          // await router.replace('/');
          await router.replace(currentRoutePath);
        }
      },
      /* eslint-disable no-console,no-unused-vars */
      removeRoute(routeDef) {
        // TODO: Implement
      },
    });
    return {
      route,
      assetLink,
      farmOSLoginUrl,
    };
  },
  created () {
    this.assetLink.boot();
  },
})
</script>
