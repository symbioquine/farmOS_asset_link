<script>
/**
 * Provides a UI to search for and choose entities using
 * plugin-supplied search methods.
 *
 * ### Usage
 *
 * ```js
 * <entity-search
 *   title="Find Asset"
 *   &commat;submit="(assets) => onAssetSelected(assets)"
 * ></entity-search>
 * ```
 * 
 * With promoted results;
 *
 * ```js
 * <entity-search
 *   title="Find Asset"
 *   &commat;submit="(assets) => onAssetSelected(assets)"
 * >
 *  <template v-slot:promoted-results="{ searchRequest }">
 *    <div class="q-ml-lg q-mb-md">
 *      <q-item clickable to="/some-route-path">
 *        <q-item-section>
 *          <q-item-label>Shows above actual search results</q-item-label>
 *        </q-item-section>
 *      </q-item>
 *    </div>
 *  </template>
 * </entity-search>
 * ```
 *
 * @category components
 * @vue-prop {String} title - the title to show at the top of the selector
 * @vue-prop {String} entityType - the entity type to search
 * @vue-prop {String[]} [entityBundles=null] - the entity bundles to search from - or all if null
 * @vue-prop {String} [searchMethod=text-search] - the initially selected search method
 * @vue-prop {Boolean} [multiple=false] - allow selecting multiple entities
 * @vue-prop {String} [confirmLabel=Choose] - the text of the button which confirms the current entity selection
 * @vue-prop {String} [noResultsLabel=No results found] - the text shown when no results are found for a given search
 * @vue-prop {Object[]} [additionalFilters=[]] - Additional [Orbit.js filters]{@link https://orbitjs.com/docs/querying-data#attribute-filtering} to apply to the searches
 * @vue-event {String} searchMethodChanged - Emit currently selected search method
 * @vue-event {Entity[]} submit - Emit selected entities
 */
export default {};
</script>

<script setup>
import { inject, ref, computed, watch } from "vue";
import { useRoute } from "vue-router";
import { throttle } from "lodash";
import RacingLocalRemoteAsyncIterator from "../RacingLocalRemoteAsyncIterator";

const props = defineProps({
  title: { type: String, required: true },
  entityType: { type: String, required: true },
  entityBundles: { type: Array, default: null },
  searchMethod: { type: String, default: "text-search" },
  multiple: { type: Boolean, default: false },
  confirmLabel: { type: String, default: "Choose" },
  noResultsLabel: { type: String, default: "No results found" },
  additionalFilters: { type: Array, default: () => [] },
});

const route = useRoute();

const assetLink = inject("assetLink");

const searchMethodTileDefs = computed(() =>
  assetLink.getSlots({ type: `${props.entityType}-search-method`, route })
);

const currentSearchMethod = ref(props.searchMethod);

const emit = defineEmits([
  "changed:searchMethod",
  "update:searchRequest",
  "submit",
]);

watch(currentSearchMethod, () =>
  emit("changed:searchMethod", currentSearchMethod.value)
);

const searchResultEntries = ref([]);

const selectedKey = ref(null);
const tickedKeys = ref([]);

const selectedEntities = computed(() => {
  const searchResultEntities = searchResultEntries.value.map(
    (entry) => entry.entity
  );
  if (selectedKey.value) {
    return searchResultEntities.filter(
      (entity) => entity.id === selectedKey.value
    );
  }
  return searchResultEntities.filter((entity) =>
    tickedKeys.value.includes(entity.id)
  );
});

const hasEntitySelection = computed(() => {
  return selectedEntities.value.length > 0;
});

const searchRequest = ref(undefined);

const nodes = computed(() => {
  return searchResultEntries.value.map((entry) => {
    return {
      id: entry.entity.id,
      entity: entry.entity,
      weightText: entry.weightText,
      tickable: props.multiple ? true : false,
    };
  });
});

// TODO: Add a "show more" button at the bottom of the search to increase this
const maxDesiredSearchEntries = 10;

const searchEntities = throttle(async function searchEntities() {
  const currSearchReq = {
    entityType: props.entityType,
    entityBundles: props.entityBundles,
    ...searchRequest.value,
  };

  currSearchReq.additionalFilters = [
    ...(currSearchReq.additionalFilters || []),
    ...props.additionalFilters,
  ];

  let entitySearchResultCursor = assetLink.searchEntities(
    currSearchReq,
    "local"
  );

  if (assetLink.connectionStatus.isOnline) {
    entitySearchResultCursor = new RacingLocalRemoteAsyncIterator(
      entitySearchResultCursor,
      assetLink.searchEntities(currSearchReq, "remote")
    );
  }

  if (currSearchReq.id !== searchRequest.value.id) {
    return;
  }

  searchResultEntries.value = [];

  const alreadyFoundEntityIds = new Set();

  let searchIterItem = {};
  while (
    searchResultEntries.value.length < maxDesiredSearchEntries &&
    !searchIterItem.done
  ) {
    searchIterItem = await entitySearchResultCursor.next();

    if (currSearchReq.id !== searchRequest.value.id) {
      return;
    }

    if (
      searchIterItem.value &&
      !alreadyFoundEntityIds.has(searchIterItem.value.entity.id)
    ) {
      alreadyFoundEntityIds.add(searchIterItem.value.entity.id);
      searchResultEntries.value.push(searchIterItem.value);
    }
  }
}, 500);

watch(searchRequest, (val) => {
  searchEntities();
  emit("update:searchRequest", val);
});

const onAccept = () => {
  emit("submit", selectedEntities.value);
};

const onNodeDoubleClicked = (node) => {
  if (props.multiple) {
    return;
  }

  selectedKey.value = node.id;
  onAccept();
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
        min-height: 160px;
        max-height: 100%;
        position: relative;
        contain: strict;
        overflow: auto;
      "
    >
      <slot name="promoted-results" :search-request="searchRequest"></slot>
      <q-tree
        node-key="id"
        :nodes="nodes"
        :tick-strategy="props.multiple ? 'leaf' : 'none'"
        v-model:ticked="tickedKeys"
        v-model:selected="selectedKey"
        :no-nodes-label="props.noResultsLabel"
        class="q-mx-lg q-mb-md"
      >
        <template v-slot:default-header="prop">
          <entity-name
            :entity="prop.node.entity"
            @dblclick="() => onNodeDoubleClicked(prop.node)"
          ></entity-name>
        </template>

        <template v-slot:default-body="prop">
          <div
            v-if="prop.node.weightText"
            class="q-ml-xl"
            @dblclick="() => onNodeDoubleClicked(prop.node)"
          >
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
        :disabled="!hasEntitySelection"
      />
    </div>
  </div>
</template>
