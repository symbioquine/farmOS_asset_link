<script setup>
import { computed, inject, ref, watch, nextTick } from 'vue';
import { useRoute } from 'vue-router'

const emit = defineEmits(['expose-meta-actions', 'expose-route-title']);

const route = useRoute();

const props = defineProps({
  logRef: {
    type: String,
    required: true,
  },
});

const assetLink = inject('assetLink');

const resolvedLog = ref(null);

const metaActionDefs = computed(() => {
  return assetLink.getSlots({ type: 'log-meta-action', route, log: resolvedLog.value });
});

watch(metaActionDefs, () => {
  emit('expose-meta-actions', metaActionDefs.value);
});

const logName = ref(null);

watch([logName, resolvedLog], () => {
  // We have to wait until after the new log name text has rendered
  nextTick(() => {
    emit('expose-route-title', logName?.value?.wrapper?.textContent);
  });
});
</script>

<template alink-route[net.symbioquine.farmos_asset_link.routes.v0.log_page]="/log/:logRef">
  <q-page padding class="text-left">
    <entity-resolver
      entity-type="log"
      :entity-ref="props.logRef"
      #default="{ entity }"
      @entity-resolved="resolvedLog = $event"
      :key="props.logRef">
        <h4 class="q-my-xs"><render-widget
              name="log-page-title"
              :context="{ log: entity }"
              ><span class="log-page-title-text-prefix">Log: </span><entity-name ref="logName" :entity="entity"></entity-name></render-widget>
        </h4>

        <component
            v-for="slotDef in assetLink.getSlots({ type: 'page-slot', route: $route, pageName: 'log-page', log: entity })"
            :key="slotDef.id"
            :is="slotDef.component"
            v-bind="slotDef.props"></component>
    </entity-resolver>
  </q-page>
</template>
