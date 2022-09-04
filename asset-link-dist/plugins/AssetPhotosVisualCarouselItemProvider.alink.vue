<script setup>
import { inject, ref } from 'vue';

import { createDrupalUrl } from "assetlink-plugin-api";

const props = defineProps({
  imgRef: {
    type: Object,
    required: true,
  },
});

const assetLink = inject('assetLink');

const imageEntity = ref(null);

const resolveImageEntity = async () => {
  try {
    let entity = await assetLink.entitySource.cache.query(
        (q) => q.findRecord({ type: props.imgRef.type, id: props.imgRef.id }));

    if (entity) {
      imageEntity.value = entity;
      return;
    }

    entity = await assetLink.entitySource.query(
        (q) => q.findRecord({ type: props.imgRef.type, id: props.imgRef.id }));

    imageEntity.value = entity;
  } catch (e) {
    assetLink.vm.messages.push({text: `Failed to load asset image entity: ${e.message}`, type: "error"});
    console.log(e);
  }
};

resolveImageEntity();
</script>

<template>
  <q-carousel-slide
      v-if="imageEntity">
    <div class="row fit justify-start items-center no-wrap">
      <q-img
        v-if="imageEntity"
        :src="createDrupalUrl(imageEntity.attributes.uri.url).toString()"
        class="rounded-borders full-height"
        fit="contain"
      ></q-img>

      <q-inner-loading :showing="!imageEntity">
        <q-spinner-gears size="50px" color="primary" />
      </q-inner-loading>
    </div>
  </q-carousel-slide>
</template>

<script>
export default {
  onLoad(handle, assetLink) {
    handle.defineSlot('net.symbioquine.farmos_asset_link.vcarousel_item.v0.asset_photos', vCarouselItem => {
      vCarouselItem.type('asset-visual-carousel-item');

      vCarouselItem.showIf(({ asset }) => true);

      vCarouselItem.multiplexContext(({ asset }) => {
        return asset.relationships.image.data.map(imgRef => ({ imgRef }));
      });

      vCarouselItem.component(handle.thisPlugin);
    });
  }
}
</script>
