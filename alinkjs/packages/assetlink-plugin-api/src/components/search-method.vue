<script setup>
import { inject } from "vue";

const currentSearchMethod = inject("currentSearchMethod");

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
});
</script>

<template>
  <slot v-if="currentSearchMethod == props.name" name="search-interface" />
</template>
