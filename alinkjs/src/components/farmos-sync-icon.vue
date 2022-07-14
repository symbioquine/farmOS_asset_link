<template>
  <q-btn v-if="assetLink.vm.pendingUpdates.length > 0" flat dense :icon="statusIcon" class="q-mr-sm">
    <q-badge color="red" floating>{{ assetLink.vm.pendingUpdates.length }}</q-badge>
  </q-btn>
  <q-btn v-else flat dense :icon="statusIcon" class="q-mr-sm"></q-btn>
</template>

<script setup>
import { inject, computed } from 'vue'

const assetLink = inject('assetLink');

const statusIcon = computed(() => {
  const connectionStatus = assetLink.connectionStatus;

  if (!connectionStatus.hasNetworkConnection) {
    return "mdi-cloud-off-outline";
  }

  if (!connectionStatus.canReachFarmOS.value) {
    return "mdi-cloud-alert";
  }

  if (!connectionStatus.isLoggedIn.value) {
    return "mdi-cloud-lock";
  }

  return "mdi-cloud-sync";
});
</script>
