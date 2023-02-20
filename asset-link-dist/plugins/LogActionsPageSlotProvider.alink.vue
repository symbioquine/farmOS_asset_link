<script setup>
import { computed, inject } from 'vue';
import { useRoute } from 'vue-router'

const route = useRoute();

const assetLink = inject('assetLink');

const props = defineProps({
  log: {
    type: Object,
    required: true,
  },
});

const actionDefs = computed(() => {
  return assetLink.getSlots({ type: 'log-action', route, log: props.log });
});
</script>

<template alink-slot[net.symbioquine.farmos_asset_link.slots.v0.log_actions]="page-slot(weight: 75, showIf: 'pageName == `log-page`')">
  <div>
    <h5 class="q-my-md">Actions:</h5>
    <div class="row q-mx-md" v-for="actionDef in actionDefs">
      <component
            :key="actionDef.id"
            :is="actionDef.component"
            v-bind="actionDef.props"
            class="full-width q-mb-md"></component>
    </div>
    <div v-if="!actionDefs.length" class="row q-mx-md text-italic">
      No Actions
    </div>
  </div>
</template>
