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

const loadingLocations = ref(false);
const currentLocations = ref(null);

const resolveCurrentLocation = async () => {
  loadingLocations.value = true;

  const logTypes = (await assetLink.getLogTypes()).map(t => t.attributes.drupal_internal__id);

  const populateLocationsFromLatestMovementLogs = async (entitySource, entitySourceCache) => {

    const results = await entitySource.query(q => logTypes.map(logType => {
      return q.findRecords(`log--${logType}`)
        .filter({ attribute: 'is_movement', op: 'equal', value: true })
        .filter({ attribute: 'status', op: 'equal', value: 'done' })
        .filter({ attribute: 'timestamp', op: '<=', value: currentEpochSecond() })
        .filter({
          relation: 'asset.id',
          op: 'some',
          records: [{ type: props.asset.type, id: props.asset.id }]
        })
        .sort('-timestamp')
        .page({ offset: 0, limit: 1 });
    }), {
      sources: {
        remote: {
          include: ['location']
        }
      }
    });

    const logs = results.flatMap(l => l);

    const latestLog = logs.length ? logs.reduce((logA, logB) => parseJSONDate(logA.attributes.timestamp) > parseJSONDate(logB.attributes.timestamp) ? logA : logB) : null;

    if (latestLog) {
      currentLocations.value = await entitySourceCache.query(q => q.findRelatedRecords(latestLog, 'location'))
    }
  }

  await populateLocationsFromLatestMovementLogs(assetLink.entitySource.cache, assetLink.entitySource.cache);

  await populateLocationsFromLatestMovementLogs(assetLink.entitySource, assetLink.entitySource.cache);

  loadingLocations.value = false;
};

const onAssetLogsChanged = ({ assetType, assetId }) => {
  if (
    props.asset.type === assetType &&
    props.asset.id === assetId
  ) {
    resolveCurrentLocation();
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
