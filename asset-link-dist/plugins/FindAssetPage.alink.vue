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
  <q-page padding class="column">
    <entity-search
        title="Find Asset"
        entity-type="asset"
        :search-method="searchMethod"
        :key="searchMethod"
        @changed:search-method="searchMethod => router.replace(`/find/asset/${searchMethod}`)"
        @submit="(assets) => onAssetSelected(assets)"
        class="col"></entity-search>
  </q-page>
</template>
