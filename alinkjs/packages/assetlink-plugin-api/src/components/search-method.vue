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
