<script setup>
import { computed, inject, ref, onMounted, onUnmounted } from 'vue';

import { currentEpochSecond, parseJSONDate } from "assetlink-plugin-api";

const props = defineProps({
  asset: {
    type: Object,
    required: true,
  },
});

const assetLink = inject('assetLink');

const inventoryLineItems = ref([]);

const inventoryLineItemNodes = computed(() => {
  return inventoryLineItems.value.map((lineItem, idx) => {
    return {
      id: idx,
      lineItem,
      selectable: true,
    };
  });
});

const resolveInventoryLineItems = async () => {
  const logTypes = (await assetLink.getLogTypes()).map(t => t.attributes.drupal_internal__id);

  // Paginate through all the pages of logs for each log type by keeping a mapping of log types to page offsets
  // and removing log types once we've reached the end of the pages
  let nextOffsetByLogType = logTypes.reduce((offsets, logType) => { offsets[logType] = 0; return offsets; }, {});

  while (Object.keys(nextOffsetByLogType).length) {
    // Orbit.js doesn't support this query fully https://github.com/orbitjs/orbit/issues/370
    // So for now, we'll execute it just to prime the cache (if online), then do all our calculations
    // from the cache.
    const primingResult = await assetLink.entitySource.query(q => Object.entries(nextOffsetByLogType).map(([logType, nextOffset]) => {
      return q.findRecords(`log--${logType}`)
        .filter({ attribute: 'status', op: 'equal', value: 'done' })
        .filter({ attribute: 'timestamp', op: '<=', value: currentEpochSecond() })
        .filter({
          attribute: 'quantity.inventory_asset.id',
          op: 'equal',
          value: props.asset.id
        })
        .sort('-timestamp')
        .options({
          page: { kind: 'offsetLimit', offset: nextOffset, limit: 50 },
        });
    }), {
      fullResponse: true,
      sources: {
        remote: {
          include: ['quantity', 'quantity.units'],
        }
      }
    });

    const remoteDetails = primingResult?.sources?.remote?.details;

    if (!remoteDetails) {
      break;
    }

    remoteDetails.forEach(detail => {
      const selfRawUrl = detail.document?.links?.self?.href;
      const nextRawUrl = detail.document?.links?.next?.href;

      const selfUrl = new URL(selfRawUrl);

      const selfPathParts = selfUrl.pathname.split('/');

      const logType = selfPathParts[3];

      if (!nextRawUrl) {
        delete nextOffsetByLogType[logType];
        return;
      }

      const nextUrl = new URL(nextRawUrl);

      nextOffsetByLogType[logType] = nextUrl.searchParams.get('page[offset]');
    });
  }

  const relatedQuantities = assetLink.entitySource.cache.query(q => {
    return q.findRecords('quantity--standard')
      .filter({
        relation: 'inventory_asset.id',
        op: 'equal',
        record: { type: props.asset.type, id: props.asset.id }
      })
      .sort('-timestamp');
  });

  const results = assetLink.entitySource.cache.query(q => logTypes.map(logType => {
    const logTypeName = `log--${logType}`;
    return q.findRecords(logTypeName)
      .filter({ attribute: 'status', op: 'equal', value: 'done' })
      .filter({ attribute: 'timestamp', op: '<=', value: currentEpochSecond() })
      .filter({
        relation: 'quantity.id',
        op: 'some',
        records: relatedQuantities.map(quantity => ({ id: quantity.id, type: quantity.type })),
      })
      .sort('-timestamp');
  }));

  const logs = results.flatMap(l => l).sort((logA, logB) => parseJSONDate(logA.attributes.timestamp) - parseJSONDate(logB.attributes.timestamp));

  const inventoryLineItemsByMeasureAndUnits = {};

  logs.forEach(log => {
    log.relationships.quantity.data.forEach(quantity => {
      const quantityEntity = assetLink.entitySource.cache.query((q) => q.findRecord({ type: quantity.type, id: quantity.id }));

      const invAsset = quantityEntity.relationships.inventory_asset?.data;

      if (!invAsset || invAsset.type !== props.asset.type || invAsset.id !== props.asset.id) {
        return;
      }

      const relatedUnits = quantityEntity.relationships?.units?.data;

      const unitsEntity = relatedUnits && assetLink.entitySource.cache.query((q) => q.findRecord({ type: relatedUnits.type, id: relatedUnits.id })) || {};

      const key = `${quantityEntity.attributes.measure}|${unitsEntity.type}|${unitsEntity.id}`;

      let operator = undefined;
      if (quantityEntity.attributes.inventory_adjustment === 'increment') {
        operator = (existing, value) => existing + value;
      } else if (quantityEntity.attributes.inventory_adjustment === 'decrement') {
        operator = (existing, value) => existing - value;
      } else if (quantityEntity.attributes.inventory_adjustment === 'reset') {
        operator = (existing, value) => value;
      } else {
        throw new Error("Unsupported inventory adjustment type.");
      }

      if (!inventoryLineItemsByMeasureAndUnits[key]) {
        inventoryLineItemsByMeasureAndUnits[key] = { key, value: 0, measure: quantityEntity.attributes.measure, units: unitsEntity };
      }

      inventoryLineItemsByMeasureAndUnits[key].value = operator(inventoryLineItemsByMeasureAndUnits[key].value, parseFloat(quantityEntity.attributes.value.decimal));
    });
  });

  inventoryLineItems.value = Object.values(inventoryLineItemsByMeasureAndUnits);
};

const onAssetLogsChanged = ({ assetType, assetId }) => {
  if (
    props.asset.type === assetType &&
    props.asset.id === assetId
  ) {
    resolveInventoryLineItems();
  }
};

let unsubber;
onMounted(() => {
  resolveInventoryLineItems();
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
      color="dark"
      text-color="white"
      icon="mdi-sigma"
      v-for="inventoryLineItem in inventoryLineItems"
      :key="inventoryLineItem.key"
      class="q-ml-sm q-px-sm q-py-none">
      {{ inventoryLineItem.value }} {{ inventoryLineItem.units.attributes.name }} ({{ inventoryLineItem.measure }})
    </q-btn>
  </span>

</template>

<script>
export default {
  onLoad(handle) {
    handle.defineWidgetDecorator('net.symbioquine.farmos_asset_link.widget_decorator.v0.asset_page_title_with_inventory', widgetDecorator => {
      widgetDecorator.targetWidgetName('asset-page-title');

      widgetDecorator.appliesIf(context => true);

      widgetDecorator.weight(90);

      widgetDecorator.component(handle.thisPlugin);
    });
  }
}
</script>
