<script setup>
import { computed } from 'vue';

const props = defineProps({
  log: {
    type: Object,
    required: true,
  },
});

const logDate = computed(() => {
  if (!props.log.attributes?.timestamp) {
    return '';
  }
  return props.log.attributes.timestamp.substring(0, 10);
});
</script>

<template alink-widget-decorator[net.symbioquine.farmos_asset_link.widget_decorator.v0.log_name_with_date]
    ="log-name(weight: 25)">
  <span>{{ logDate }} <slot></slot></span>
</template>
