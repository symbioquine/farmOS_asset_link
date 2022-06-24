<template>
  <div class="text-left">
    <asset-resolver :asset-ref="$route.params.assetRef" #default="{ asset }">



    </asset-resolver>
  </div>
</template>

<script>
export default {
  props: {
    wrapper: {
      type: Object,
      required: true,
    }
  },
  inject: ['assetLink'],
  methods: {
    onAssetResolved(asset) {
      const metaActionDefs = this.assetLink.getSlots({ type: 'asset-meta-action', route: this.$route, asset });
      this.wrapper.$emit('expose-meta-actions', metaActionDefs);
    },
  },
  onMounted() {
    console.log('$route.params.assetRef', this.$route.params.assetRef);
  },
  onLoad(handle, assetLink) {

    handle.defineRoute('net.symbioquine.farmos_asset_link.routes.v0.asset_page', pageRoute => {
      pageRoute.path("/asset/:assetRef");

      pageRoute.componentFn((wrapper, h) => {
        try {
          return h(handle.thisPlugin, { wrapper })
        } catch (error) {
          console.log("Error in AssetPage route render fn", typeof error, error);
        }
      });
    });

  }
}
</script>
