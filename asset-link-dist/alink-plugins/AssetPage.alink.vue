<template>
  <v-container>
    <v-container class="text-left">

      <asset-resolver :asset-ref="$route.params.assetRef" #default="{ asset }" @asset-resolved="onAssetResolved($event)">

        <h2>Asset: <render-widget
              name="asset-name"
              :context="{ asset }"
              >{{ asset.attributes.name }}</render-widget>
        </h2>

        <render-fn-wrapper
          v-for="slotDef in assetLink.getSlots({ type: 'page-slot', route: $route, asset })" :key="slotDef.id"
          :render-fn="slotDef.componentFn"
        ></render-fn-wrapper>

      </asset-resolver>

    </v-container>
  </v-container>
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
  onLoad(handle, assetLink) {

    handle.defineRoute('net.symbioquine.farmos_asset_link.routes.v0.asset_page', assetPageRoute => {
      assetPageRoute.path("/asset/:assetRef");

      assetPageRoute.componentFn((wrapper, h) =>
        h(handle.thisPlugin, { props: { wrapper } })
      );
    });

  }
}
</script>
