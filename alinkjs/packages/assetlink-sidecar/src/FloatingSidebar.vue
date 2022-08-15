<script setup>
import {
  inject,
  onMounted,
  getCurrentInstance,
  ref,
  computed,
  provide,
} from "vue";

import AssetLinkIcon from "@/icons/asset-link.svg";
import AssetLink from "assetlink/AssetLink";

const devToolsApi = inject("devToolsApi");

const rootComponent = getCurrentInstance();

const assetLink = new AssetLink(rootComponent, devToolsApi);

provide("assetLink", assetLink);

const resolvedAsset = ref(null);

const sidecarMenuItemDefs = computed(() => {
  return assetLink.getSlots({
    type: "sidecar-menu-slot",
    asset: resolvedAsset.value,
  });
});

const assetRef = computed(() => {
  const matches = window.location.href.match(/https?:\/\/.*\/asset\/(\d+)/);

  if (!matches || matches.length < 2) {
    return undefined;
  }

  const assetDrupalInternalId = matches[1];

  return assetDrupalInternalId;
});

onMounted(() => {
  assetLink.boot();
});
</script>

<template>
  <q-layout>
    <q-page-sticky
      position="right"
      :offset="[18, 0]"
      v-if="assetLink.connectionStatus.isLoggedIn"
    >
      <q-fab
        v-if="!assetLink.vm.booted"
        disable
        :loading="true"
        color="orange-5"
      >
        <template v-slot:icon>
          <q-circular-progress
            show-value
            font-size="16px"
            class="text-red"
            :value="assetLink.vm.bootProgress"
            size="56px"
            :thickness="0.25"
            color="#2E7D32"
            track-color="grey-3"
            style="margin-top: -16px; margin-left: -16px"
          >
            <q-icon :name="'img:' + AssetLinkIcon" />
          </q-circular-progress>
        </template>
      </q-fab>

      <asset-resolver
        v-if="assetLink.vm.booted"
        :asset-ref="assetRef"
        @asset-resolved="resolvedAsset = $event"
      >
        <q-fab
          color="orange-5"
          icon="keyboard_arrow_left"
          direction="left"
          v-if="sidecarMenuItemDefs.length"
        >
          <template v-slot:icon>
            <q-icon :name="'img:' + AssetLinkIcon" />
          </template>

          <component
            v-for="slotDef in sidecarMenuItemDefs"
            :key="slotDef.id"
            :is="slotDef.component"
            v-bind="slotDef.props"
          ></component>
        </q-fab>
      </asset-resolver>
    </q-page-sticky>
  </q-layout>
</template>
