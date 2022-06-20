<template>
  <template v-if="pendingUpdateCount > 0">
    <q-btn flat dense :icon="statusIcon" class="q-ml-md">
      <q-badge color="red" floating>{{ pendingUpdateCount }}</q-badge>
    </q-btn>
  </template>
  <template v-else>
    <q-btn flat dense :icon="statusIcon" class="q-ml-md"></q-btn>
  </template>
</template>

<script>
import { defineComponent } from 'vue'

export default defineComponent({
  // inject: ['assetLink'],
  data: () => ({
    // const connectionStatus = this.assetLink.viewModel.connectionStatus;
    connectionStatus: {
      hasNetworkConnection: true,
      canReachFarmOS: true,
      isLoggedIn: false,
    },
    // const pendingUpdateCount = this.assetLink.viewModel.pendingUpdates;
    pendingUpdateCount: 5,
  }),
  computed: {
    statusIcon() {
      if (!this.connectionStatus.hasNetworkConnection) {
        return "mdi-cloud-off-outline";
      }

      if (!this.connectionStatus.canReachFarmOS) {
        return "mdi-cloud-alert";
      }

      if (!this.connectionStatus.isLoggedIn) {
        return "mdi-cloud-lock";
      }

      return "mdi-cloud-sync";
    },
  },
});
</script>
