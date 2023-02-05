<script setup>
import { inject, ref, onMounted, onUnmounted } from 'vue';

const props = defineProps({
  asset: {
    type: Object,
    required: true,
  },
});

const assetLink = inject('assetLink');

const currentGroups = ref(null);

const resolveCurrentGroups = async () => {
  const assetModel = await assetLink.getEntityModel(props.asset.type);

  // Bail if groups are not enabled
  if (!assetModel.relationships.group) {
    return;
  }

  currentGroups.value = await assetLink.entitySource.query(q => q.findRelatedRecords({ type: props.asset.type, id: props.asset.id }, 'group'))
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
    <q-btn
      unelevated
      rounded
      dense
      no-caps
      color="secondary"
      text-color="white"
      icon="mdi-group"
      :to="`/asset/${currentGroup.attributes.drupal_internal__id}`"
      v-for="currentGroup in currentGroups"
      :key="currentGroup.id"
      class="q-ml-sm q-px-sm q-py-none">
      {{ currentGroup.attributes.name }}
    </q-btn>
  </span>
</template>

<script>
export default {
  onLoad(handle) {
    handle.defineWidgetDecorator('net.symbioquine.farmos_asset_link.widget_decorator.v0.asset_name_with_groups', widgetDecorator => {
      widgetDecorator.targetWidgetName('asset-page-title');

      widgetDecorator.appliesIf(context => true);

      widgetDecorator.weight(75);

      widgetDecorator.component(handle.thisPlugin);
    });
  }
}
</script>
