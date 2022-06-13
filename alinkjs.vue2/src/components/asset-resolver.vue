<template>
  <span>
    <v-overlay :value="isLoadingAsset" color="#E0E0E0" :opacity="1"></v-overlay>
    <i v-if="!resolvedAsset">Unknown asset '{{ assetRef }}'...</i>
    <slot v-else :asset="resolvedAsset"></slot>
  </span>
</template>

<script>
export default {
  props: {
    assetRef: {
      type: String,
      required: true,
    }
  },
  inject: ['assetLink'],
  data: function () {
    return {
      self: this,
      isLoadingAsset: false,
      refreshHandler: null,
    };
  },
  created() {
    this.assetLink.viewModel.$on('changed:asset', this.onAssetChanged);
  },
  destroyed () {
    this.assetLink.viewModel.$off('changed:asset', this.onAssetChanged);
  },
  methods: {
    onAssetChanged(assetType, assetId) {
      console.log('onAssetChanged', assetType, assetId);
      const resolvedAsset = this.resolvedAsset;
      if (resolvedAsset && resolvedAsset.type === assetType && resolvedAsset.id === assetId) {
        this.$asyncComputed.resolvedAsset.update();
      }
    },
  },
  asyncComputed: {
    async resolvedAsset() {
      this.isLoadingAsset = true;
      try {
        const asset = await this.assetLink.resolveAsset(this.assetRef);
        this.$emit('asset-resolved', asset);
        return asset;
      } catch (e) {
        this.assetLink.viewModel.messages.push({text: `Failed to load asset: ${e.message}`, type: "error"});
        console.log(e);
      } finally {
        this.isLoadingAsset = false;
      }
      return null;
    },
  },
};
</script>
