<script setup>
import { inject, ref } from "vue";

const assetLink = inject("assetLink");

const drawer = ref(false);

defineExpose({
  toggle: () => (drawer.value = !drawer.value),
});
</script>

<template>
  <q-drawer v-model="drawer" overlay bordered class="bg-grey-3">
    <q-scroll-area class="fit">
      <q-list v-if="assetLink.vm.pendingUpdates.length > 0">
        <template
          v-for="pendingUpdate in assetLink.vm.pendingUpdates"
          :key="pendingUpdate.data.id"
        >
          <q-item clickable>
            <q-item-section>
              {{ pendingUpdate.data.options.label }}
            </q-item-section>
          </q-item>
        </template>
      </q-list>
    </q-scroll-area>
  </q-drawer>
</template>
