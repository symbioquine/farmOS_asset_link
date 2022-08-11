<script setup>
import { ref } from 'vue';
import { uuidv4 } from 'assetlink-plugin-api';

const searchText = ref('');

const emit = defineEmits(["update:searchRequest"]);

const onSearchTextUpdated = (text) => {
  emit('update:searchRequest', {
    id: uuidv4(),
    type: 'text-search',
    term: text,
  });
};
</script>

<template alink-slot[net.symbioquine.farmos_asset_link.asset_search.v0.text]="asset-search-method(weight: 50)">
  <search-method
    name="text-search"
    icon="mdi-keyboard"
    ref="searchMethod">

    <template #search-interface>
      <div class="q-pa-md">
        <q-input v-model="searchText" @update:model-value="(evt) => onSearchTextUpdated(evt)" label="Search" />
      </div>
    </template>

  </search-method>

</template>
