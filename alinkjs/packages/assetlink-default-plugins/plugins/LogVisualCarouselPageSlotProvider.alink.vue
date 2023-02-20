<script setup>
import { computed, inject, ref, watch } from 'vue';
import { useRoute } from 'vue-router'

const route = useRoute();

const assetLink = inject('assetLink');

const props = defineProps({
  log: {
    type: Object,
    required: true,
  },
});

const carouselItems = computed(() => {
  return assetLink.getSlots({ type: 'log-visual-carousel-item', route: route, log: props.log });
});

const carouselPosition = ref(undefined);

watch(carouselItems, () => {
  if (carouselItems.value.length) {
    carouselPosition.value = carouselItems.value[0].id;
  } else {
    carouselPosition.value = undefined;
  }
}, { immediate: true });
</script>

<template alink-slot[net.symbioquine.farmos_asset_link.slots.v0.visual_carousel]="page-slot(weight: 15, showIf: 'pageName == `log-page`')">
  <div no-gutters class="row log-visual-carousel" v-if="carouselItems.length">
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
