<script setup>
import { computed, ref } from 'vue';

const props = defineProps({
  log: {
    type: Object,
    required: true,
  },
});
</script>

<template alink-slot[net.symbioquine.farmos_asset_link.slots.v0.log_date]="page-slot(weight: 25, showIf: 'pageName == `log-page`')">
  <div class="q-mt-md">
    {{ props.log.attributes.timestamp }}
  </div>
</template>
