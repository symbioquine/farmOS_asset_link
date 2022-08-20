<script setup>
import { computed, inject, ref, toRaw } from "vue";

const assetLink = inject("assetLink");

const connectionStatusExplanation = computed(() => {
  const { connectionStatus } = assetLink;

  if (!connectionStatus.hasNetworkConnection.value) {
    return "Networking offline";
  }

  if (!connectionStatus.canReachFarmOS.value) {
    return "farmOS unreachable";
  }

  if (!connectionStatus.isLoggedIn.value) {
    return "Unauthenticated";
  }

  return "Online";
});

const drawer = ref(false);

const onPendingUpdateItemClicked = (pendingUpdate) => {
  console.log("onPendingUpdateItemClicked", toRaw(pendingUpdate));
};

const clearLocalData = async () => {
  const confirmed = await assetLink.ui.dialog.confirm(
    "Are you sure you want to clear all local data? Any unsynchronized data will be permanently lost."
  );

  if (!confirmed) {
    return undefined;
  }

  await assetLink.permanentlyDeleteLocalData();

  navigator.serviceWorker.controller.postMessage({
    type: "CLEAR_ALL_CACHES",
  });

  window.location.reload();
};

defineExpose({
  toggle: () => (drawer.value = !drawer.value),
});
</script>

<template>
  <q-drawer v-model="drawer" overlay bordered class="bg-grey-3 column">
    <q-scroll-area class="col col-grow">
      <q-list v-if="assetLink.vm.pendingUpdates.length > 0">
        <template
          v-for="pendingUpdate in assetLink.vm.pendingUpdates"
          :key="pendingUpdate.data.id"
        >
          <q-item
            clickable
            @click="() => onPendingUpdateItemClicked(pendingUpdate)"
          >
            <q-item-section>
              {{ pendingUpdate.data.options.label }}
            </q-item-section>
          </q-item>
        </template>
      </q-list>
    </q-scroll-area>
    <q-bar>
      <div>{{ connectionStatusExplanation }}</div>

      <q-space />

      <q-btn dense flat icon="mdi-wrench-outline">
        <q-menu auto-close>
          <q-list style="min-width: 100px">
            <q-item clickable @click="() => clearLocalData()">
              <q-item-section>Clear all local data</q-item-section>
            </q-item>
          </q-list>
        </q-menu>
      </q-btn>
    </q-bar>
  </q-drawer>
</template>
