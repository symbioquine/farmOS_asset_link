<script setup>
import { inject, ref, computed, watch } from "vue";
import { useRoute } from "vue-router";
import RacingLocalRemoteAsyncIterator from "@/RacingLocalRemoteAsyncIterator";

const props = defineProps({
  title: { type: String, required: true },
  inputLabel: { type: String, default: "Search" },
  inputPlaceholder: { type: String, default: "Search Assets" },
  searchMethod: { type: String, default: "text-search" },
  selectMultiple: { type: Boolean, default: false },
  confirmLabel: { type: String, default: "Choose" },
});

const route = useRoute();

const assetLink = inject("assetLink");

const searchMethodTileDefs = computed(() =>
  assetLink.getSlots({ type: "asset-search-method", route })
);

const currentSearchMethod = ref(props.searchMethod);

const emit = defineEmits(["searchMethodChanged", "submit"]);

watch(currentSearchMethod, () =>
  emit("searchMethodChanged", currentSearchMethod.value)
);

const searchResultEntries = ref([]);

const selectedKey = ref(null);
const tickedKeys = ref([]);

const selectedAssets = computed(() => {
  const searchResultAssets = searchResultEntries.value.map(
    (entry) => entry.asset
  );
  if (selectedKey.value) {
    return searchResultAssets.filter((asset) => asset.id === selectedKey.value);
  }
  return searchResultAssets.filter((asset) =>
    tickedKeys.value.includes(asset.id)
  );
});

const hasAssetSelection = computed(() => {
  return selectedAssets.value.length > 0;
});

const isSearchingAssets = ref(false);

const searchRequest = ref(undefined);

const nodes = computed(() => {
  return searchResultEntries.value.map((entry) => {
    return {
      id: entry.asset.id,
      label: entry.asset.attributes.name,
      tickable: props.selectMultiple ? true : false,
    };
  });
});

const maxDesiredSearchEntries = 10;

/* eslint-disable class-methods-use-this,no-unused-vars */
const searchAssets = async function searchAssets() {
  const currSearchId = searchRequest.value.id;

  isSearchingAssets.value = true;

  let assetSearchResultCursor = assetLink.searchAssets(
    searchRequest.value,
    "local"
  );

  if (assetLink.connectionStatus.isOnline) {
    assetSearchResultCursor = new RacingLocalRemoteAsyncIterator(
      assetSearchResultCursor,
      assetLink.searchAssets(searchRequest.value, "remote")
    );
  }

  if (currSearchId !== searchRequest.value.id) {
    return;
  }

  searchResultEntries.value = [];

  const alreadyFoundAssetIds = new Set();

  let searchIterItem = {};
  while (
    searchResultEntries.value.length < maxDesiredSearchEntries &&
    !searchIterItem.done
  ) {
    searchIterItem = await assetSearchResultCursor.next();
    console.log("searchIterItem:", searchIterItem);

    if (currSearchId !== searchRequest.value.id) {
      return;
    }

    if (
      searchIterItem.value &&
      !alreadyFoundAssetIds.has(searchIterItem.value.asset.id)
    ) {
      alreadyFoundAssetIds.add(searchIterItem.value.asset.id);
      searchResultEntries.value.push(searchIterItem.value);
    }
  }

  isSearchingAssets.value = false;
};

watch(searchRequest, (val) => {
  console.log(`search request changed: ${val}`);
  searchAssets();
  emit("update:searchRequest", val);
});

const onAccept = () => {
  emit("submit", selectedAssets.value);
};

const onCancel = () => {
  emit("submit", undefined);
};
</script>

<template>
  <div class="column">
    <div class="text-h5 grey lighten-2">
      {{ title }}
    </div>

    <search-method-tile-tabber v-model:search-method="currentSearchMethod">
      <component
        :is="slotDef.component"
        v-for="slotDef in searchMethodTileDefs"
        :key="slotDef.id"
        @update:searchRequest="(req) => (searchRequest = req)"
      />
    </search-method-tile-tabber>

    <q-tree
      node-key="id"
      :nodes="nodes"
      dense
      :tick-strategy="props.selectMultiple ? 'leaf' : 'none'"
      v-model:ticked="tickedKeys"
      v-model:selected="selectedKey"
      no-nodes-label="No assets found"
      class="q-mx-lg q-mb-md col-grow"
    />

    <q-separator />

    <div class="q-pa-md q-gutter-sm row justify-end">
      <q-btn color="secondary" label="Cancel" @click="onCancel()" />
      <q-btn
        color="primary"
        :label="props.confirmLabel"
        @click="onAccept()"
        :disabled="!hasAssetSelection"
      />
    </div>
  </div>
</template>
