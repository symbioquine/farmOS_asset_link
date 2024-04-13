<script>
/**
 * Provides a UI to search for and choose entities by name.
 *
 * ### Usage
 *
 * ```js
 * <entity-select
 *   label="Parent Asset"
 *   entity-type="asset"
 *   v-model="parent"
 * ></entity-select>
 * ```
 *
 * @category components
 * @vue-prop {String} [label=''] - the label to show in the select field
 * @vue-prop {String} [hint=''] - the hint to show in the select field
 * @vue-prop {String} entityType - the entity type to select from
 * @vue-prop {String[]} [entityBundles=null] - the entity bundles to select from - or all if null
 * @vue-prop {Boolean} [multiple=false] - allow selecting multiple entities
 * @vue-prop {Object[]} [additionalFilters=[]] - Additional [Orbit.js filters]{@link https://orbitjs.com/docs/querying-data#attribute-filtering} to apply to the searches
 * @vue-prop {Object} [modelValue=null] - The initially selected entity
 * @vue-event {String} update:modelValue - Emitted when an entity has been selected
 */
export default {};
</script>

<script setup>
import { inject, ref, watch } from "vue";
import { v4 as uuidv4 } from "uuid";
import RacingLocalRemoteAsyncIterator from "../RacingLocalRemoteAsyncIterator";

const props = defineProps({
  label: { type: String, default: "" },
  hint: { type: String, default: "" },
  entityType: { type: String, required: true },
  entityBundles: { type: Array, default: null },
  multiple: { type: Boolean, default: false },
  additionalFilters: { type: Array, default: () => [] },
  modelValue: { type: Object, default: null },
});
const emit = defineEmits(["update:modelValue"]);

const model = ref(props.modelValue);

watch(model, () => {
  console.log("model changed:", model.value);
  if (props.multiple) {
    emit(
      "update:modelValue",
      model.value ? model.value.map((item) => item.entity) : []
    );
  } else {
    emit("update:modelValue", model.value?.entity);
  }
});

const assetLink = inject("assetLink");

const options = ref([]);

const maxDesiredSearchEntries = 10;

const filterFn = async (val, update, abort) => {
  const searchRequest = {
    id: uuidv4(),
    type: "text-search",
    entityType: props.entityType,
    entityBundles: props.entityBundles,
    term: val,
  };

  searchRequest.additionalFilters = [
    ...(searchRequest.additionalFilters || []),
    ...props.additionalFilters,
  ];

  let entitySearchResultCursor = assetLink.searchEntities(
    searchRequest,
    "local"
  );

  if (assetLink.connectionStatus.isOnline.value) {
    entitySearchResultCursor = new RacingLocalRemoteAsyncIterator(
      entitySearchResultCursor,
      assetLink.searchEntities(searchRequest, "remote")
    );
  }

  update(() => {
    options.value = [];
  });

  const alreadyFoundEntityIds = new Set();

  let searchIterItem = {};
  while (
    options.value.length < maxDesiredSearchEntries &&
    !searchIterItem.done
  ) {
    searchIterItem = await entitySearchResultCursor.next();

    if (
      searchIterItem.value &&
      !alreadyFoundEntityIds.has(searchIterItem.value.entity.id)
    ) {
      alreadyFoundEntityIds.add(searchIterItem.value.entity.id);

      update(() => {
        options.value.push(searchIterItem.value);
      });
    }
  }
};

const abortFilterFn = () => {
  console.log("delayed filter aborted");
};
</script>

<template>
  <q-select
    filled
    dense
    clearable
    v-model="model"
    :multiple="props.multiple"
    :use-input="!model"
    input-debounce="0"
    :label="props.label"
    :hint="props.hint"
    :options="options"
    @filter="filterFn"
    @filter-abort="abortFilterFn"
  >
    <template v-slot:option="scope">
      <q-item v-bind="scope.itemProps">
        <q-item-section>
          <q-item-label
            ><entity-name :entity="scope.opt.entity"></entity-name
          ></q-item-label>
          <q-item-label caption>{{ scope.opt.weightText }}</q-item-label>
        </q-item-section>
      </q-item>
    </template>
    <template v-slot:selected-item="scope">
      <q-item>
        <q-item-section>
          <q-item-label
            ><entity-name :entity="scope.opt.entity"></entity-name
          ></q-item-label>
        </q-item-section>
      </q-item>
    </template>
    <template v-slot:no-option>
      <q-item>
        <q-item-section class="text-grey"> No results </q-item-section>
      </q-item>
    </template>
  </q-select>
</template>
