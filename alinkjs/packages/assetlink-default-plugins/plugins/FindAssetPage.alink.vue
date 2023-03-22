<script setup>
import { computed, inject } from 'vue';
import { useRoute, useRouter } from 'vue-router'

const route = useRoute();
const router = useRouter();

const assetLink = inject('assetLink');

const searchMethod = computed(() => route.params.searchType);

const onAssetSelected = async (selectedAssets) => {
  console.log("onAssetSelected", selectedAssets);
  if (selectedAssets === undefined) {
    router.back();
    return;
  }
  if (selectedAssets.length === 1) {
    const asset = selectedAssets[0];

    const model = await assetLink.getEntityModel(asset.type);

    const include = Object.keys(model.relationships);

    // Load the asset from the server (if online) again to ensure
    // all the relationships get loaded (since search plugins may
    // not load all the data)
    await assetLink.entitySource.query(q => q
        .findRecord({ type: asset.type, id: asset.id })
        .options({ include }),
      { forceRemote: true });

    router.push(`/asset/${asset.attributes.drupal_internal__id}`);
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
        no-results-label="No matching assets found"
        :search-method="searchMethod"
        :key="searchMethod"
        @changed:search-method="searchMethod => router.replace(`/find/asset/${searchMethod}`)"
        @submit="(assets) => onAssetSelected(assets)"
        class="col">
          <template v-slot:promoted-results="{ searchRequest }">
            <component
                v-for="slotDef in assetLink.getSlots({ type: 'asset-search-promoted-result', searchRequest })"
                :key="slotDef.id"
                :is="slotDef.component"
                v-bind="slotDef.props"></component>
          </template>
        </entity-search>
  </q-page>
</template>
