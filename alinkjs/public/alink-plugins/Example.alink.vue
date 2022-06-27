<script setup>
import { ref } from 'vue'

const count = ref(1)
</script>

<template>
  <q-page class="flex flex-center">
    <q-btn @click="count++">Count is: {{ count }}</q-btn>
  </q-page>
</template>

<script>
export default {
  onLoad(handle, assetLink) {
    handle.defineRoute('net.symbioquine.farmos_asset_link.routes.v0.test_page', pageRoute => {
      pageRoute.path("/test");

      pageRoute.component(handle.thisPlugin);
    });

  }
}
</script>
