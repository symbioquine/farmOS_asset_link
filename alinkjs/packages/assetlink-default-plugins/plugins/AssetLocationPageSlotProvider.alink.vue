<script setup>
import { inject, ref, computed, onMounted, onUnmounted } from 'vue';

import { currentEpochSecond, parseJSONDate } from "assetlink-plugin-api";

const emit = defineEmits(['asset-resolved']);

const props = defineProps({
  asset: {
    type: Object,
    required: true,
  },
});

const assetLink = inject('assetLink');

const currentLocations = ref(null);

const currentLocationsString = computed(() => {
  if (!currentLocations.value) {
    return '';
  }
  return currentLocations.value.map(cl => cl.attributes.name).join(', ');
});

const resolveCurrentLocation = async () => {
  const logTypes = (await assetLink.getLogTypes()).map(t => t.attributes.drupal_internal__id);

  const entitySource = assetLink.entitySource;

  // TODO: Query local cache - and remote if online
  // TODO: Include some visual indication of how up-to-date the results are - e.g. are we just showing cached results because the server is taking a long time or is offline

  const results = await entitySource.query(q => logTypes.map(logType => {
    return q.findRecords(`log--${logType}`)
      .filter({ attribute: 'is_movement', op: 'equal', value: true })
      .filter({ attribute: 'status', op: 'equal', value: 'done' })
      .filter({ attribute: 'timestamp', op: '<=', value: currentEpochSecond() })
      .filter({
        relation: 'asset.id',
        op: 'equal',
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
    currentLocations.value = entitySource.cache.query(q => q.findRelatedRecords(latestLog, 'location'))
  }
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
  <div no-gutters class="row q-ml-sm">
    <span v-if="currentLocations"> Location: {{ currentLocationsString }}</span>
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
