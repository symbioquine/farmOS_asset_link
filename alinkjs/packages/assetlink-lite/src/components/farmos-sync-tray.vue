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

const onPendingItemClicked = (pendingUpdate) => {
  console.log("onPendingUpdateItemClicked", toRaw(pendingUpdate));
};

const deleteFailedUpdateFromDlq = (failedUpdate) => {
  console.log("deleteFailedUpdate", toRaw(failedUpdate));

  const dlqEntries = assetLink.updateDlq.entries;
  assetLink.updateDlq.clear();
  dlqEntries
    .filter((entry) => failedUpdate.data.id != entry.data.id)
    .forEach((entry) => assetLink.updateDlq.push(entry));
};

const retryFailedUpdate = (failedUpdate) => {
  console.log("retryFailedUpdate", toRaw(failedUpdate));

  assetLink.entitySource.update(toRaw(failedUpdate.data));
  deleteFailedUpdateFromDlq(failedUpdate);
};

const clearLocalData = async () => {
  const confirmed = await assetLink.ui.dialog.confirm(
    "Are you sure you want to clear all local data? Any unsynchronized data will be permanently lost."
  );

  if (!confirmed) {
    return undefined;
  }

  await assetLink.permanentlyDeleteLocalData();

  if (navigator?.serviceWorker?.controller) {
    navigator.serviceWorker.controller.postMessage({
      type: "CLEAR_ALL_CACHES",
    });
  }

  window.location.reload();
};

defineExpose({
  toggle: () => (drawer.value = !drawer.value),
});
</script>

<template>
  <q-drawer v-model="drawer" bordered class="bg-grey-3 column">
    <q-scroll-area class="col col-grow">
      <q-list v-if="assetLink.vm.pendingUpdates.length > 0">
        <template
          v-for="pendingUpdate in assetLink.vm.pendingUpdates"
          :key="pendingUpdate.data.id"
        >
          <q-item clickable @click="() => onPendingItemClicked(pendingUpdate)">
            <q-item-section avatar>
              <q-avatar icon="mdi-database-edit" />
            </q-item-section>
            <q-item-section>
              {{ pendingUpdate.data.options.timestamp }}<br />
              {{ pendingUpdate.data.options.label }}
            </q-item-section>
          </q-item>
        </template>
      </q-list>
      <q-list v-if="assetLink.vm.failedUpdates.length > 0">
        <template
          v-for="failedUpdate in assetLink.vm.failedUpdates"
          :key="failedUpdate.data.id"
        >
          <q-item clickable @click="() => onPendingItemClicked(failedUpdate)">
            <q-item-section avatar>
              <q-avatar icon="mdi-database-alert-outline" color="orange" />
            </q-item-section>
            <q-item-section>
              <q-item-label lines="1">{{
                failedUpdate.data.options.label || failedUpdate.data.id
              }}</q-item-label>
              <q-item-label caption lines="1">{{
                failedUpdate.data.options.timestamp
              }}</q-item-label>
              <q-item-label caption lines="5" class="text-italic text-red-12">{{
                failedUpdate.data.options.failedRetryErrors[0].message
              }}</q-item-label>
            </q-item-section>
            <q-item-section top side>
              <div class="text-grey-8 q-gutter-xs">
                <q-btn
                  flat
                  dense
                  round
                  icon="mdi-replay"
                  @click.stop="() => retryFailedUpdate(failedUpdate)"
                />
              </div>
              <div class="text-grey-8 q-gutter-xs">
                <q-btn
                  flat
                  dense
                  round
                  icon="mdi-delete"
                  @click.stop="() => deleteFailedUpdateFromDlq(failedUpdate)"
                />
              </div>
            </q-item-section>
          </q-item>
        </template>
      </q-list>
      <q-list v-if="assetLink.vm.pendingQueries.length > 0">
        <template
          v-for="pendingQuery in assetLink.vm.pendingQueries"
          :key="pendingQuery.data.id"
        >
          <q-item clickable @click="() => onPendingItemClicked(pendingQuery)">
            <q-item-section avatar>
              <q-avatar icon="mdi-database-search" />
            </q-item-section>
            <q-item-section>
              {{ pendingQuery.data.options.timestamp }}<br />
              {{ pendingQuery.data.options.label || pendingQuery.data.id }}
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
