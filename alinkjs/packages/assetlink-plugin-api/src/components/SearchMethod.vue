<script>
/**
 * Defines the name, icon, and UI for a search method. Handles hiding/showing
 * the UI elements depending on whether this search method is selected in the
 * [SearchMethodTileTabber](./SearchMethodTileTabber.html).
 *
 * ### Usage
 *
 * ```js
 * <search-method
 *   name="text-search"
 *   icon="mdi-keyboard">
 *
 *   <template #search-interface>
 *     <q-input v-model="searchText" @update:model-value="(evt) => onSearchTextUpdated(evt)" label="Search" />
 *   </template>
 *
 * </search-method>
 * ```
 *
 * See [TODO]() for more details about implementing new search methods.
 *
 * @category components
 * @vue-prop {String} name - the name of this search method
 * @vue-prop {String} icon - the icon of this search method
 * @vue-event {undefined} tile-clicked - Emitted when this search method tile is clicked
 */
export default {};
</script>

<script setup>
import { inject } from "vue";

const currentSearchMethod = inject("currentSearchMethod");

const emit = defineEmits(["tile-clicked"]);

const props = defineProps({
  name: {
    type: String,
    required: true,
  },
  icon: {
    type: String,
    required: true,
  },
});

defineExpose({
  isSearchMethod: true,
  tileClicked: () => emit("tile-clicked"),
});
</script>

<template>
  <slot v-if="currentSearchMethod == props.name" name="search-interface" />
</template>
