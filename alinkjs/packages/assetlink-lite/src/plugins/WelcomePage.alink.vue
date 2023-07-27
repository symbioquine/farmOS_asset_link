<script setup>
import { computed, inject, ref, watch, nextTick } from 'vue';
import { useRoute } from 'vue-router'

const emit = defineEmits(['expose-meta-actions', 'expose-route-title']);

const route = useRoute();

const assetLink = inject('assetLink');

const metaActionDefs = computed(() => {
  return assetLink.getSlots({ type: 'welcome-page-meta-action', route });
});

watch(metaActionDefs, () => {
  emit('expose-meta-actions', metaActionDefs.value);
});

nextTick(() => {
  emit('expose-route-title', "Welcome");
});
</script>

<template alink-route[net.symbioquine.farmos_asset_link.routes.v0.welcome_page]="/">
  <q-page padding class="text-left text-body1">
    <p>Welcome to Asset Link Lite!</p>

    <p>Asset Link is a light-weight mobile app for working with farmOS data. See <a href="https://farmOS.org">farmOS.org</a>
    to learn more about farmOS.</p>

    <p>Asset Link "Lite" specifically is a version of Asset Link which has been adapted to work without a farmOS server.
    Although a farmOS server is critical for protecting you from data loss and enabling multi-user collaboration,
    Asset Link Lite can provide a quick way to get started with Asset Link without first setting up a farmOS server.</p>

    <p>Just remember that data entered in Asset Link Lite is only stored in the browser of the device you enter it from.
    You or your collaborators will not be able to access the data from another browser or device. Further, the data
    may be easily lost if your browser storage is cleared or if something happens to your device.</p>
  </q-page>
</template>
