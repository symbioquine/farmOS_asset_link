<template>
  <v-carousel-item contain
      v-if="imageEntity"
      :src="assetLink.util.createDrupalUrl(imageEntity.attributes.uri.url).toString()"></v-carousel-item>
</template>

<script>
export default {
  props: {
    asset: {
      type: Object,
      required: true,
    },
    imgRef: {
      type: Object,
      required: true,
    }
  },
  inject: ['assetLink'],
  asyncComputed: {
    async imageEntity() {
      try {
        // TODO: Improve implementation - this probably does work well offline...
        const entity = await this.assetLink.entitySource.query(
            (q) => q.findRecord({ type: this.imgRef.type, id: this.imgRef.id }));

        return entity;
      } catch (e) {
        this.assetLink.viewModel.messages.push({text: `Failed to load image entity: ${e.message}`, type: "error"});
        console.log(e);
      }
      return null;
    },
  },
  onLoad(handle, assetLink) {

    const VBtn = assetLink.ui.c.VBtn;

    handle.defineSlot('net.symbioquine.farmos_asset_link.vcarousel_item.v0.asset_photos', vCarouselItem => {
      vCarouselItem.type('asset-visual-carousel-item');

      vCarouselItem.showIf(({ asset }) => true);

      vCarouselItem.multiplexContext(({ asset }) => {
        return asset.relationships.image.data.map(imgRef => ({ asset, imgRef }));
      });

      vCarouselItem.componentFn((wrapper, h, { asset, imgRef }) => {
        return h(handle.thisPlugin, { props: { asset, imgRef } });
      });

    });

  }
}
</script>
