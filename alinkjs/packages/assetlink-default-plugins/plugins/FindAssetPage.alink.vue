<script setup>
import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router'

const route = useRoute();
const router = useRouter();

const searchMethod = computed(() => route.params.searchType);

const onAssetSelected = (selectedAssets) => {
  console.log("onAssetSelected", selectedAssets);
  if (selectedAssets === undefined) {
    router.back();
    return;
  }
  if (selectedAssets.length === 1) {
    router.push(`/asset/${selectedAssets[0].attributes.drupal_internal__id}`);
    return;
  }
  // TODO: Implement multi-asset page
};
</script>

<template alink-route[net.symbioquine.farmos_asset_link.routes.v0.find_asset_page]="/find/asset/:searchType">
  <q-page padding>
    <asset-selector
        title="Find Asset"
        :search-method="searchMethod"
        :key="searchMethod"
        @search-method-changed="searchMethod => router.replace(`/find/asset/${searchMethod}`)"
        @submit="(assets) => onAssetSelected(assets)"></asset-selector>
  </q-page>
</template>
