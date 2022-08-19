<script>
/**
 * Provides a UI for searching for and choosing assets using
 * plugin-supplied search methods.
 *
 * ### Usage
 *
 * ```js
 * <asset-selector
 *   title="Find Asset"
 *   &commat;submit="(assets) => onAssetSelected(assets)"
 * ></asset-selector>
 * ```
 *
 * @category components
 * @vue-prop {String} title - the title to show at the top of the selector
 * @vue-prop {String} [searchMethod=text-search] - the initially selected search method
 * @vue-prop {Boolean} [selectMultiple=false] - allow selecting multiple assets
 * @vue-prop {String} [confirmLabel=Choose] - the text of the button which confirms the current asset selection
 * @vue-prop {Object} [additionalFilters=[]] - Additional [Orbit.js filters]{@link https://orbitjs.com/docs/querying-data#attribute-filtering} to apply to the searches
 * @vue-event {String} searchMethodChanged - Emit currently selected search method
 * @vue-event {Asset[]} submit - Emit selected asset(s)
 */
export default {};
</script>

<script setup>
import { inject, ref, computed, watch } from "vue";
import { useRoute } from "vue-router";
import RacingLocalRemoteAsyncIterator from "@/RacingLocalRemoteAsyncIterator";

const props = defineProps({
  title: { type: String, required: true },
  searchMethod: { type: String, default: "text-search" },
  selectMultiple: { type: Boolean, default: false },
  confirmLabel: { type: String, default: "Choose" },
  additionalFilters: { type: Array, default: () => [] },
});

const route = useRoute();

const assetLink = inject("assetLink");

const searchMethodTileDefs = computed(() =>
  assetLink.getSlots({ type: "asset-search-method", route })
);

const currentSearchMethod = ref(props.searchMethod);

const emit = defineEmits(["changed:searchMethod", "submit"]);

watch(currentSearchMethod, () =>
  emit("changed:searchMethod", currentSearchMethod.value)
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
      weightText: entry.weightText,
      tickable: props.selectMultiple ? true : false,
    };
  });
});

// TODO: Add a "show more" button at the bottom of the search to increase this
const maxDesiredSearchEntries = 10;

const searchAssets = async function searchAssets() {
  const currSearchReq = {
    ...searchRequest.value,
  };

  currSearchReq.additionalFilters = [
    ...(currSearchReq.additionalFilters || []),
    ...props.additionalFilters,
  ];

  isSearchingAssets.value = true;

  let assetSearchResultCursor = assetLink.searchAssets(currSearchReq, "local");

  if (assetLink.connectionStatus.isOnline) {
    assetSearchResultCursor = new RacingLocalRemoteAsyncIterator(
      assetSearchResultCursor,
      assetLink.searchAssets(currSearchReq, "remote")
    );
  }

  if (currSearchReq.id !== searchRequest.value.id) {
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

    if (currSearchReq.id !== searchRequest.value.id) {
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
    <div class="text-h5 grey lighten-2 q-mb-md">
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

    <div
      class="col"
      style="
        height: auto;
        min-height: 0;
        max-height: 100%;
        position: relative;
        contain: strict;
        overflow: auto;
      "
    >
      <q-tree
        node-key="id"
        :nodes="nodes"
        :tick-strategy="props.selectMultiple ? 'leaf' : 'none'"
        v-model:ticked="tickedKeys"
        v-model:selected="selectedKey"
        no-nodes-label="No assets found"
        class="q-mx-lg q-mb-md"
      >
        <template v-slot:default-body="prop">
          <div v-if="prop.node.weightText" class="q-ml-xl">
            {{ prop.node.weightText }}
          </div>
        </template>
      </q-tree>
    </div>

    <q-separator />

    <div class="q-pa-sm q-gutter-sm row justify-end">
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
