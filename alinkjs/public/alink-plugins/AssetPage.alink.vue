<template>
  <q-page padding class="text-left">
    <asset-resolver :asset-ref="$route.params.assetRef" #default="{ asset }">
        <h4 class="q-my-sm">Asset: <render-widget
              name="asset-name"
              :context="{ asset }"
              >{{ asset.attributes.name }}</render-widget>
        </h4>

        <component
            v-for="slotDef in assetLink.getSlots({ type: 'page-slot', route: $route, pageName: 'asset-page', asset })"
            :key="slotDef.id"
            :is="slotDef.component"
            v-bind="slotDef.props"></component>
    </asset-resolver>
  </q-page>
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

      pageRoute.component(handle.thisPlugin);
    });
  }
}
</script>
