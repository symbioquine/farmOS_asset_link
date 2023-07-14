<script setup>
import { computed, inject, ref, watch, nextTick } from 'vue';
import { useRoute } from 'vue-router'

const emit = defineEmits(['expose-meta-actions', 'expose-route-title']);

const route = useRoute();

const props = defineProps({
  assetRef: {
    type: String,
    required: true,
  },
});

const assetLink = inject('assetLink');

const resolvedAsset = ref(null);

const metaActionDefs = computed(() => {
  return assetLink.getSlots({ type: 'asset-meta-action', route, asset: resolvedAsset.value });
});

watch(metaActionDefs, () => {
  emit('expose-meta-actions', metaActionDefs.value);
});

const assetName = ref(null);

watch([assetName, resolvedAsset], () => {
  // We have to wait until after the new asset name text has rendered
  nextTick(() => {
    emit('expose-route-title', assetName?.value?.wrapper?.textContent);
  });
});
</script>

<template alink-route[net.symbioquine.farmos_asset_link.routes.v0.asset_page]="/asset/:assetRef">
  <q-page padding class="text-left">
    <entity-resolver
      entity-type="asset"
      :entity-ref="props.assetRef"
      #default="{ entity }"
      @entity-resolved="resolvedAsset = $event"
      :key="props.assetRef">
        <h4 class="q-my-xs"><render-widget
              name="asset-page-title"
              :context="{ asset: entity }"
              ><span class="asset-page-title-text-prefix">Asset: </span><entity-name ref="assetName" :entity="entity"></entity-name></render-widget>
        </h4>

        <component
            v-for="slotDef in assetLink.getSlots({ type: 'page-slot', route: $route, pageName: 'asset-page', asset: entity })"
            :key="slotDef.id"
            :is="slotDef.component"
            v-bind="slotDef.props"></component>
    </entity-resolver>
  </q-page>
</template>
