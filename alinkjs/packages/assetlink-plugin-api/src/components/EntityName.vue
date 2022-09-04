<script>
/**
 * Renders an entity (e.g. asset/log) name that can be decorated by plugin widget decorators.
 *
 * ### Usage
 *
 * ```js
 * <entity-name :entity="myAsset"></entity-name>
 * ```
 *
 * @category components
 * @vue-prop {Object} entity - The entity data
 */
export default {};
</script>

<script setup>
import { computed, ref } from "vue";

const props = defineProps({
  entity: { type: Object, required: true },
});

const entityType = computed(() => props.entity.type.split("--")[0]);

const wrapper = ref(null);

defineExpose({
  wrapper,
});
</script>

<template>
  <span ref="wrapper"
    ><render-widget
      :name="entityType + '-name'"
      :context="{ [entityType]: props.entity }"
      >{{ props.entity.attributes.name }}</render-widget
    ></span
  >
</template>
