<script setup>
import { inject, onMounted, getCurrentInstance } from "vue";

import { createDrupalUrl } from "assetlink-plugin-api";

import AssetLinkIcon from "@/icons/asset-link.svg";
import AssetLink from "assetlink/AssetLink";

const devToolsApi = inject("devToolsApi");

const assetLinkUrl = () => {
  const matches = window.location.href.match(/https?:\/\/.*\/asset\/(\d+)/);

  console.log(matches);

  if (!matches || matches.length < 2) {
    return undefined;
  }

  const assetDrupalInternalId = matches[1];

  return createDrupalUrl(`/alink/asset/${assetDrupalInternalId}`).toString();
};

const openInAssetLink = () => {
  window.location = assetLinkUrl();
};

const rootComponent = getCurrentInstance();

const assetLink = new AssetLink(rootComponent, devToolsApi);

onMounted(() => {
  assetLink.boot();
});
</script>

<template>
  <q-layout>
    <q-page-sticky position="right" :offset="[18, 0]">
      <q-fab color="orange-5" icon="keyboard_arrow_left" direction="left">
        <template v-slot:icon>
          <q-icon :name="'img:' + AssetLinkIcon" />
        </template>

        <q-fab-action
          @click="openInAssetLink"
          color="grey-8"
          icon="launch"
        ></q-fab-action>
      </q-fab>
    </q-page-sticky>
  </q-layout>
</template>
