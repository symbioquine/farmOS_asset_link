<script setup>
import { computed } from 'vue';

const props = defineProps({
  asset: {
    type: Object,
    required: true,
  },
});

const inventoryLineItemNodes = computed(() => {
  const inventoryLineItems = props.asset.attributes?.inventory || [];

  return inventoryLineItems.map((lineItem, idx) => {
    return {
      id: idx,
      lineItem,
      selectable: true,
    };
  });
});
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
      v-for="inventoryLineItemNode in inventoryLineItemNodes"
      :key="inventoryLineItemNode.id"
      class="q-ml-sm q-px-sm q-py-none">
      {{ inventoryLineItemNode.lineItem.value }} {{ inventoryLineItemNode.lineItem.units }} ({{ inventoryLineItemNode.lineItem.measure }})
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
