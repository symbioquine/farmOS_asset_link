<template>
  <q-page padding>
    <asset-selector></asset-selector>
  </q-page>
</template>

<script>
export default {
  inject: ['assetLink'],
  onMounted() {
    console.log('$route.params.searchType', this.$route.params.searchType);
  },
  onLoad(handle, assetLink) {
    handle.defineRoute('net.symbioquine.farmos_asset_link.routes.v0.open_asset_page', pageRoute => {
      pageRoute.path("/find/asset/:searchType");

      pageRoute.component(handle.thisPlugin);
    });
  }
}
</script>
