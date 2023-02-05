<template>
  <q-btn
    v-if="
      assetLink.vm.pendingUpdates.length > 0 ||
      assetLink.vm.failedUpdates.length > 0
    "
    flat
    dense
    :icon="statusIcon"
    class="q-mx-sm"
  >
    <q-badge
      v-if="assetLink.vm.failedUpdates.length > 0"
      color="orange"
      floating
    >
      {{ assetLink.vm.pendingUpdates.length }}
      <q-icon name="mdi-alert" color="white" size="1em" />
      {{ assetLink.vm.failedUpdates.length }}
    </q-badge>
    <q-badge v-else color="red" floating>
      {{ assetLink.vm.pendingUpdates.length }}
    </q-badge>
  </q-btn>
  <q-btn v-else flat dense :icon="statusIcon" class="q-mr-sm" />
</template>

<script setup>
import { inject, computed } from "vue";

const assetLink = inject("assetLink");

const statusIcon = computed(() => {
  const { connectionStatus } = assetLink;

  if (!connectionStatus.hasNetworkConnection.value) {
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
