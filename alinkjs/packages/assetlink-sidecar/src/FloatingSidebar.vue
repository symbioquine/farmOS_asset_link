<script setup>
import { inject, onMounted, getCurrentInstance, computed, provide } from "vue";

import AssetLinkIcon from "@/icons/asset-link.svg";
import AssetLink from "assetlink/AssetLink";

const devToolsApi = inject("devToolsApi");

const rootComponent = getCurrentInstance();

const assetLink = new AssetLink(rootComponent, devToolsApi);

provide("assetLink", assetLink);

const sidebarMenuItemDefs = computed(() => {
  return assetLink.getSlots({
    type: "sidebar-menu-slot",
  });
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
        v-if="!assetLink.vm.booted || sidebarMenuItemDefs.length"
        :disable="!assetLink.vm.booted"
        :loading="!assetLink.vm.booted"
        color="orange-5"
        icon="keyboard_arrow_left"
        direction="left"
      >
        <template v-slot:icon>
          <q-icon :name="'img:' + AssetLinkIcon" v-if="assetLink.vm.booted" />

          <q-circular-progress
            v-else
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

        <component
          v-for="slotDef in sidebarMenuItemDefs"
          :key="slotDef.id"
          :is="slotDef.component"
          v-bind="slotDef.props"
        ></component>
      </q-fab>
    </q-page-sticky>
  </q-layout>
</template>
