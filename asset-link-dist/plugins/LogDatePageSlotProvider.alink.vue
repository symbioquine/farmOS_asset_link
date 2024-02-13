<script setup>
import { computed } from 'vue';
import {
  date,
} from 'quasar';
import { parseJSONDate } from "assetlink-plugin-api";

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
  const ts = parseJSONDate(props.log.attributes.timestamp);

  const widgetDateFormat = 'YYYY-MM-DD HH:mm';

  return date.formatDate(ts, widgetDateFormat);
});
</script>

<template alink-slot[net.symbioquine.farmos_asset_link.slots.v0.log_date]="page-slot(weight: 20, showIf: 'pageName == `log-page`')">
  <div class="q-mt-md">
    <q-icon size="sm" name="mdi-clock-outline" /> {{ logDate }}
  </div>
</template>
