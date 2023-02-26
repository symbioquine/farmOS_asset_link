<script setup>
import { inject, ref, onMounted, onUnmounted } from 'vue';

import { currentEpochSecond, parseJSONDate } from "assetlink-plugin-api";

const props = defineProps({
  asset: {
    type: Object,
    required: true,
  },
});

const assetLink = inject('assetLink');

const currentLocations = ref(null);

const resolveCurrentLocation = async (options) => {
  const opts = options || {};
  currentLocations.value = await assetLink.entitySource.query(q => q.findRelatedRecords({ type: props.asset.type, id: props.asset.id }, 'location'), { ...opts });
};

const onAssetLogsChanged = ({ assetType, assetId }) => {
  if (
    props.asset.type === assetType &&
    props.asset.id === assetId
  ) {
    // Use chaining here instead of await to avoid blocking the event bus
    resolveCurrentLocation().then(() => resolveCurrentLocation({ forceRemote: true }));
  }
};

let unsubber;
onMounted(() => {
  resolveCurrentLocation();
  unsubber = assetLink.eventBus.$on("changed:assetLogs", onAssetLogsChanged);
});
onUnmounted(() => unsubber && unsubber.$off());
</script>

<template>
  <span>
    <slot></slot>
    <q-btn
      unelevated
      rounded
      dense
      no-caps
      color="primary"
      text-color="white"
      icon="mdi-crosshairs"
      :to="`/asset/${currentLocation.attributes.drupal_internal__id}`"
      v-for="currentLocation in currentLocations"
      :key="currentLocation.id"
      class="q-ml-sm q-px-sm q-py-none">
      {{ currentLocation.attributes.name }}
    </q-btn>
  </span>
</template>

<script>
export default {
  onLoad(handle) {
    handle.defineWidgetDecorator('net.symbioquine.farmos_asset_link.widget_decorator.v0.asset_name_with_locations', widgetDecorator => {
      widgetDecorator.targetWidgetName('asset-page-title');

      widgetDecorator.appliesIf(context => true);

      widgetDecorator.weight(95);

      widgetDecorator.component(handle.thisPlugin);
    });
  }
}
</script>
