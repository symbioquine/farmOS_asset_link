<script setup>
import { ref } from 'vue';
import { uuidv4 } from 'assetlink-plugin-api';

const props = defineProps({
  isSearching: {
    type: Boolean,
  },
});

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
    icon="mdi-keyboard">

    <template #search-interface>
      <div class="q-px-md">
        <q-input
          autofocus
          v-model="searchText"
          @update:model-value="(evt) => onSearchTextUpdated(evt)" label="Search"
          :loading="props.isSearching" />
      </div>
    </template>

  </search-method>

</template>
