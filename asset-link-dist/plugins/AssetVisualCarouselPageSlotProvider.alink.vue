<template>
  <div no-gutters class="row asset-visual-carousel" v-if="carouselItems.length">
    <div class="col"
      md="6"
      offset-md="3"
    >
      <q-carousel class="q-ml-md q-mt-xs"
        v-model="carouselPosition"
        swipeable
        animated
        navigation
        navigation-icon="mdi-radiobox-marked"
        control-type="flat"
        control-color="orange"
        :arrows="false"
        height="200px"
      >
        <component
            v-for="carouselItemDef in carouselItems"
            :key="carouselItemDef.id"
            :is="carouselItemDef.component"
            :name="carouselItemDef.id"
            v-bind="carouselItemDef.props"></component>
      </q-carousel>
    </div>
  </div>
</template>

<script>
import { ref } from 'vue';

export default {
  props: {
    asset: {
      type: Object,
      required: true,
    }
  },
  inject: ['assetLink'],
  data: () => ({
    carouselPosition: ref(undefined),
  }),
  computed: {
    carouselItems() {
      return this.assetLink.getSlots({ type: 'asset-visual-carousel-item', route: this.$route, asset: this.asset });
    },
  },
  watch: {
    carouselItems: {
      handler(items) {
        if (this.carouselItems.length) {
          this.carouselPosition = this.carouselItems[0].id;
        } else {
          this.carouselPosition = undefined;
        }
      },
      immediate: true,
    },
  },
  onLoad(handle) {
    handle.defineSlot('net.symbioquine.farmos_asset_link.slots.v0.visual_carousel', slot => {
      slot.type('page-slot');

      slot.showIf(context => context.pageName === 'asset-page');

      slot.weight(50);

      slot.component(handle.thisPlugin);
    });
  }
}
</script>
