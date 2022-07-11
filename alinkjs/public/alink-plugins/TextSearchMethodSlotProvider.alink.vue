<script setup>
import { ref } from 'vue';

const text = ref('hi');
</script>

<template alink-slot[net.symbioquine.farmos_asset_link.asset_search.v0.text]="asset-search-method(weight: 50)">
  <search-method
    name="text-search"
    icon="mdi-keyboard">

    <template #search-interface>
      <div class="q-pa-md">
        <q-input v-model="text" label="Search" />
      </div>
    </template>

  </search-method>

</template>
