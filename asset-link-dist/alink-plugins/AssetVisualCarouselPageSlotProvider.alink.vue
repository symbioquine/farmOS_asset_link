<template>
  <v-row no-gutters class="asset-visual-carousel" v-if="carouselItems.length">
    <v-col
      md="6"
      offset-md="3"
    >
      <v-carousel v-model="carouselPosition" height="200" class="ml-2 mt-8" hide-delimiter-background show-arrows-on-hover>
        <render-fn-wrapper
            v-for="carouselItemDef in carouselItems"
            :key="carouselItemDef.id"
            :render-fn="carouselItemDef.componentFn"></render-fn-wrapper>
      </v-carousel>
    </v-col>
  </v-row>
</template>

<script>
export default {
  props: {
    asset: {
      type: Object,
      required: true,
    }
  },
  inject: ['assetLink'],
  data: () => ({
    carouselPosition: 0,
  }),
  computed: {
    carouselItems() {
      return this.assetLink.getSlots({ type: 'asset-visual-carousel-item', route: this.$route, asset: this.asset });
    },
  },
  onLoad(handle) {

    handle.defineSlot('net.symbioquine.farmos_asset_link.slots.v0.visual_carousel', slot => {
      slot.type('page-slot');

      slot.showIf(context => context.pageName === 'asset-page');

      slot.weight(50);

      slot.componentFn((wrapper, h, context) => {
        return h(handle.thisPlugin, { props: { asset: context.asset } });
      });

    });

  }
}
</script>

<style>
/* TODO: Get this working... minor, but it looks a bit better
 * with the progress indicator a shifted up a little.
 */
.asset-visual-carousel .v-carousel__controls {
  bottom: 10px;
}
</style>
