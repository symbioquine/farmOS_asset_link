<script setup>
import { computed } from 'vue';

const props = defineProps({
  log: {
    type: Object,
    required: true,
  },
});

const statusSymbol = computed(() => {
  if (props.log.attributes.status === 'done') {
    return '\u{2611}';
  }
  return '\u{2610}';
});
</script>

<template alink-widget-decorator[net.symbioquine.farmos_asset_link.widget_decorator.v0.log_name_with_status]
    ="log-name(weight: 50)">
  <span>{{ statusSymbol }} <slot></slot></span>
</template>
