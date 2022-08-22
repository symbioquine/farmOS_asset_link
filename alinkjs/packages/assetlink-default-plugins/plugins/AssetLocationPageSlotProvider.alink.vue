<script setup>
import { inject, ref, onMounted, onUnmounted } from 'vue';

import { currentEpochSecond, parseJSONDate } from "assetlink-plugin-api";

const emit = defineEmits(['asset-resolved']);

const props = defineProps({
  asset: {
    type: Object,
    required: true,
  },
});

const assetLink = inject('assetLink');

const loadingLocations = ref(false);
const currentLocations = ref(null);

const resolveCurrentLocation = async (opts) => {
  const options = opts || {};

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

  if (!options.cacheOnly) {
    await populateLocationsFromLatestMovementLogs(assetLink.entitySource, assetLink.entitySource.cache);
  }

  loadingLocations.value = false;
};

const onAssetLogsChanged = ({ assetType, assetId }) => {
  if (
    props.asset.type === assetType &&
    props.asset.id === assetId
  ) {
    resolveCurrentLocation({ cacheOnly: true });
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
  <div no-gutters class="q-ml-sm relative-position fit">
    <span class="relative-position" :class="{ 'text-grey-7': !assetLink.connectionStatus.isOnline.value }">
    <span class="q-my-md">Location:</span>
    <q-chip
      color="primary"
      text-color="white"
      v-for="currentLocation in currentLocations"
      :key="currentLocation.id">
      {{ currentLocation.attributes.name }}
    </q-chip>
    <q-inner-loading :showing="loadingLocations">
        <q-spinner-dots color="primary" />
    </q-inner-loading>
    </span>
  </div>
</template>

<script>
export default {
  onLoad(handle) {
    handle.defineSlot('net.symbioquine.farmos_asset_link.slots.v0.asset_location', slot => {
      slot.type('page-slot');

      slot.showIf(context => context.pageName === 'asset-page');

      slot.weight(25);

      slot.component(handle.thisPlugin);
    });
  }
}
</script>
