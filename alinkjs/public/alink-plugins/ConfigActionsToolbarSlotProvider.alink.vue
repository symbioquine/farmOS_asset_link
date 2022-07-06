<template alink-slot[net.symbioquine.farmos_asset_link.tb_item.v0.config_actions]="toolbar-item(weight: 25)">
  <q-btn flat padding="xs" icon="mdi-cog" class="q-mr-sm" @click.stop v-if="configActionDefs.length">
    <q-menu>
      <q-list style="min-width: 200px">
        <component
            v-for="slotDef in configActionDefs"
            :key="slotDef.id"
            :is="slotDef.component"
            v-bind="slotDef.props"></component>
      </q-list>
    </q-menu>
  </q-btn>
</template>

<script setup>
import { inject, computed } from 'vue';
import { useRoute } from 'vue-router'

const assetLink = inject('assetLink');

const route = useRoute();

const configActionDefs = computed(() => {
  return assetLink.getSlots({ type: 'config-action', route });
});
</script>
