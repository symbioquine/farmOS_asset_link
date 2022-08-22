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

const loadingGroups = ref(false);
const currentGroups = ref(null);

const resolveCurrentGroups = async () => {
  loadingGroups.value = true;

  const logTypes = (await assetLink.getLogTypes()).map(t => t.attributes.drupal_internal__id);

  const populateGroupsFromLatestGroupMembershipLogs = async (entitySource, entitySourceCache) => {

    const results = await entitySource.query(q => logTypes.map(logType => {
      return q.findRecords(`log--${logType}`)
        .filter({ attribute: 'is_group_assignment', op: 'equal', value: true })
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
          include: ['group']
        }
      }
    });

    const logs = results.flatMap(l => l);

    const latestLog = logs.length ? logs.reduce((logA, logB) => parseJSONDate(logA.attributes.timestamp) > parseJSONDate(logB.attributes.timestamp) ? logA : logB) : null;

    if (latestLog) {
      currentGroups.value = await entitySourceCache.query(q => q.findRelatedRecords(latestLog, 'group'))
    }
  }

  await populateGroupsFromLatestGroupMembershipLogs(assetLink.entitySource.cache, assetLink.entitySource.cache);

  await populateGroupsFromLatestGroupMembershipLogs(assetLink.entitySource, assetLink.entitySource.cache);

  loadingGroups.value = false;
};

const onAssetLogsChanged = ({ assetType, assetId }) => {
  if (
    props.asset.type === assetType &&
    props.asset.id === assetId
  ) {
    resolveCurrentGroups();
  }
};

let unsubber;
onMounted(() => {
  resolveCurrentGroups();
  unsubber = assetLink.eventBus.$on("changed:assetLogs", onAssetLogsChanged);
});
onUnmounted(() => unsubber && unsubber.$off());
</script>

<template>
  <span>
    <slot></slot>
    <q-chip
      icon="mdi-group"
      color="secondary"
      text-color="white"
      v-for="currentGroup in currentGroups"
      :key="currentGroup.id">
      {{ currentGroup.attributes.name }}
    </q-chip>
  </span>
</template>

<script>
export default {
  onLoad(handle) {
    handle.defineWidgetDecorator('net.symbioquine.farmos_asset_link.widget_decorator.v0.asset_name_with_groups', widgetDecorator => {
      widgetDecorator.targetWidgetName('asset-name');

      widgetDecorator.appliesIf(context => true);

      widgetDecorator.weight(75);

      widgetDecorator.component(handle.thisPlugin);
    });
  }
}
</script>
