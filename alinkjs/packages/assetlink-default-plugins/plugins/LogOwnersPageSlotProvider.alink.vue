<script setup>
import { inject, ref } from 'vue';
import {
  date,
} from 'quasar';

const props = defineProps({
  log: {
    type: Object,
    required: true,
  },
  ownerRef: {
    type: Object,
    required: true,
  },
});

const assetLink = inject('assetLink');

const ownerEntity = ref(null);

const resolveLogOwnerEntity = async () => {
  try {
    let entity = await assetLink.entitySource.cache.query(
        (q) => q.findRecord({ type: props.ownerRef.type, id: props.ownerRef.id }));

    if (entity) {
      ownerEntity.value = entity;
      return;
    }

    entity = await assetLink.entitySource.query(
        (q) => q.findRecord({ type: props.ownerRef.type, id: props.ownerRef.id }));

    ownerEntity.value = entity;
  } catch (e) {
    assetLink.vm.messages.push({text: `Failed to load log owner entity: ${e.message}`, type: "error"});
    console.log(e);
  }
};

resolveLogOwnerEntity();
</script>

<template>
  <div class="q-mt-md">
    Owner:
    <entity-name v-if="ownerEntity" :entity="ownerEntity"></entity-name>
    <template v-else>{{ props.ownerRef }}</template>
  </div>
</template>

<script>
export default {
  onLoad(handle, assetLink) {
    handle.defineSlot('net.symbioquine.farmos_asset_link.slots.v0.log_owners', slot => {
      slot.type('page-slot');

      slot.weight(35);

      slot.showIf(({ pageName }) => pageName === 'log-page');

      slot.multiplexContext(({ log }) => {
        return log.relationships.owner.data.map(ownerRef => ({ log, ownerRef }));
      });

      slot.component(handle.thisPlugin);
    });
  }
}
</script>
