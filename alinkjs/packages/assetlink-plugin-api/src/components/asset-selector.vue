<script setup>
import { inject, ref, computed, watch } from "vue";
import { useRoute } from "vue-router";

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

const emit = defineEmits(["searchMethodChanged"]);

watch(currentSearchMethod, () =>
  emit("searchMethodChanged", currentSearchMethod.value)
);
</script>

<template>
  <div class="text-h5 grey lighten-2">
    {{ title }}
  </div>

  <search-method-tile-tabber
    v-model:current-search-method="currentSearchMethod"
  >
    <component
      :is="slotDef.component"
      v-for="slotDef in searchMethodTileDefs"
      :key="slotDef.id"
    />
  </search-method-tile-tabber>
</template>
