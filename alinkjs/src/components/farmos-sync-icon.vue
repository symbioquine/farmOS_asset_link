<template>
  <template v-if="pendingUpdateCount > 0">
    <q-btn flat dense :icon="statusIcon" class="q-ml-md">
      <q-badge color="red" floating>{{ assetLink.vm.pendingUpdates.length }}</q-badge>
    </q-btn>
  </template>
  <template v-else>
    <q-btn flat dense :icon="statusIcon" class="q-ml-md"></q-btn>
  </template>
</template>

<script setup>
import { inject, computed } from 'vue'

const assetLink = inject('assetLink');

const statusIcon = computed(() => {
  const connectionStatus = assetLink.connectionStatus;

  if (!connectionStatus.hasNetworkConnection) {
    return "mdi-cloud-off-outline";
  }

  if (!connectionStatus.canReachFarmOS) {
    return "mdi-cloud-alert";
  }

  if (!connectionStatus.isLoggedIn) {
    return "mdi-cloud-lock";
  }

  return "mdi-cloud-sync";
});
</script>
