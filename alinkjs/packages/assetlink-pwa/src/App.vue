<template>
  <q-layout view="lHh Lpr lFf">
    <q-header elevated>
      <q-toolbar class="bg-green text-white">
        <q-toolbar-title> Asset Link</q-toolbar-title>

        <farmos-sync-icon @click.stop="$refs.syncTray.toggle()" />

        <component
          :is="slotDef.component"
          v-for="slotDef in assetLink.getSlots({ type: 'toolbar-item', route })"
          :key="slotDef.id"
          v-bind="slotDef.props"
          class="q-mr-sm"
        />

        <q-btn
          v-if="metaActionDefs.length"
          flat
          padding="xs"
          icon="mdi-dots-vertical"
          @click.stop
        >
          <q-menu>
            <q-list style="min-width: 200px">
              <component
                :is="slotDef.component"
                v-for="slotDef in metaActionDefs"
                :key="slotDef.id"
                v-bind="slotDef.props"
              />
            </q-list>
          </q-menu>
        </q-btn>
      </q-toolbar>
    </q-header>

    <farmos-sync-tray ref="syncTray" />

    <q-page-container>
      <q-banner
        v-if="
          assetLink.connectionStatus.canReachFarmOS.value &&
          !assetLink.connectionStatus.isLoggedIn.value
        "
        inline-actions
        class="text-white bg-orange-10"
      >
        You are not logged in to farmOS.
        <template #action>
          <q-btn
            flat
            dense
            color="white"
            icon-right="mdi-account-key"
            label="Log in"
            :href="farmOSLoginUrl"
          />
        </template>
      </q-banner>

      <q-banner
        v-if="assetLink.connectionStatus.canReachFarmOS.value && updateExists"
        inline-actions
        class="text-white bg-deep-orange-12"
      >
        An update is available for Asset Link
        <template #action>
          <q-btn
            flat
            dense
            color="white"
            icon-right="mdi-refresh"
            label="Update"
            @click="refreshApp"
          />
        </template>
      </q-banner>

      <q-page>
        <router-view
          v-if="assetLink.vm.booted"
          @expose-meta-actions="metaActionDefs = $event"
        />

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
          <span
            v-if="assetLink.vm.bootFailed"
            class="text-italic text-red-12"
            >{{ assetLink.vm.bootText }}</span
          >
          <span v-else class="text-italic">{{ assetLink.vm.bootText }}</span>
        </q-inner-loading>
      </q-page>
    </q-page-container>
  </q-layout>
</template>

<script>
import { defineComponent, inject, getCurrentInstance, watch, ref } from "vue";
import { useRouter, useRoute } from "vue-router";

import { useServiceWorkerUX } from "@/useServiceWorkerUX";

import AssetLink from "assetlink/AssetLink";

import { createDrupalUrl } from "assetlink-plugin-api";

export default defineComponent({
  name: "App",
  setup(props, { expose }) {
    const rootComponent = getCurrentInstance();

    const router = useRouter();
    const route = useRoute();

    const { updateExists, refreshApp } = useServiceWorkerUX();

    const devToolsApi = inject("devToolsApi");

    const app = inject("app");

    const assetLink = new AssetLink(rootComponent, devToolsApi);

    // provide("assetLink", assetLink);
    app.provide("assetLink", assetLink);

    const metaActionDefs = ref([]);

    const farmOSLoginUrl = ref(null);
    watch(
      route,
      () => {
        metaActionDefs.value = [];

        farmOSLoginUrl.value = createDrupalUrl(
          `/user/login?destination=${window.location.pathname}`
        );
      },
      { immediate: true }
    );

    expose({
      assetLink,
      async addRoute(routeDef) {
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
      metaActionDefs,
      updateExists,
      refreshApp,
    };
  },
  created() {
    this.assetLink.boot();
  },
});
</script>
