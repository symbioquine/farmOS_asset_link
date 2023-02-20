<script setup>
import { inject } from 'vue';

const assetLink = inject('assetLink');

const props = defineProps({
  log: {
    type: Object,
    required: true,
  },
});

const doActionWorkflow = async () => {
  const confirmed = await assetLink.ui.dialog.confirm(`Are you sure you want to mark this log as completed?`);

  if (!confirmed) {
    return undefined;
  }

  const res = await assetLink.entitySource.update((t) => {
    return t.updateRecord({
      type: props.log.type,
      id: props.log.id,
      attributes: {
        status: 'done',
      },
    });
  }, {label: `Mark log as completed: ${props.log.attributes.name}`});
};
</script>

<template alink-slot[net.symbioquine.farmos_asset_link.log_actions.v0.complete]="log-action(showIf: 'log.attributes.status != `done`')">
  <q-btn block color="secondary" no-caps @click="() => doActionWorkflow()">Mark as Completed</q-btn>
</template>
