<script setup>
import { computed } from 'vue';

const userSymbol = computed(() => {
  return '\u{1F464}';
});
</script>

<template alink-widget-decorator[net.symbioquine.farmos_asset_link.widget_decorator.v0.user_name_with_icon]
    ="user-name(weight: 25)">
  <span>{{ userSymbol }} <slot></slot></span>
</template>
