<script setup>
import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router'

const route = useRoute();
const router = useRouter();

const searchMethod = computed(() => route.params.searchType);
</script>

<template alink-route[net.symbioquine.farmos_asset_link.routes.v0.find_asset_page]="/find/asset/:searchType">
  <q-page padding>
    <asset-selector
        title="Find Asset"
        :search-method="searchMethod"
        :key="searchMethod"
        @search-method-changed="searchMethod => router.replace(`/find/asset/${searchMethod}`)"></asset-selector>
  </q-page>
</template>
