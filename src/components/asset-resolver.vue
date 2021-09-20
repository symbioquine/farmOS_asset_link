<template>
  <span>
    <loading :active="isLoadingAreas"
        :can-cancel="false"
        :is-full-page="true"
        :opacity="0.75"
        background-color="#AAA"></loading>
    <i v-if="!resolvedAsset">Unknown asset '{{ assetRef }}'...</i>
    <slot v-else :asset="resolvedAsset"></slot>
  </span>
</template>

<script>
import Loading from 'vue-loading-overlay';
import 'vue-loading-overlay/dist/vue-loading.css';

export default {
  components: {
    Loading,
  },
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
      isLoadingAreas: false,
    };
  },
  asyncComputed: {
    async resolvedAsset() {
      this.isLoadingAreas = true;
      const asset = await this.assetLink.resolveAsset(this.assetRef);
      this.isLoadingAreas = false;
      return asset;
    },
  },
};
</script>
