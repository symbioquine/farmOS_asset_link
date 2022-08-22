<script setup>
import { computed, inject, ref, watch } from 'vue';
import { useRoute } from 'vue-router'

const emit = defineEmits(['expose-meta-actions']);

const route = useRoute();

const assetLink = inject('assetLink');

const resolvedAsset = ref(null);

const metaActionDefs = computed(() => {
  return assetLink.getSlots({ type: 'asset-meta-action', route, asset: resolvedAsset.value });
});

watch(metaActionDefs, () => {
  emit('expose-meta-actions', metaActionDefs.value);
});
</script>

<template alink-route[net.symbioquine.farmos_asset_link.routes.v0.asset_page]="/asset/:assetRef">
  <q-page padding class="text-left">
    <asset-resolver :asset-ref="$route.params.assetRef" #default="{ asset }" @asset-resolved="resolvedAsset = $event">
        <h4 class="q-my-xs">Asset: <render-widget
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
