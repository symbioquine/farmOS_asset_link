<script>
/**
 * Resolves a farmOS entity given its type and ID. e.g. '1' or a UUID.
 *
 * ### Usage
 *
 * ```js
 * <entity-resolver entity-type="asset" :entity-ref="42" #default="{ entity }">
 *   <h1>Asset: {{ entity.attributes.name }}</h1>
 * </entity-resolver>
 * ```
 *
 * @category components
 * @vue-prop {String} entityType - the entity type
 * @vue-prop {Number|String} entityRef - the entity ID
 * @vue-event {Entity} entity-resolved - Emit resolved entity
 */
export default {};
</script>

<template>
  <span>
    <template v-if="!initialLoading">
      <i v-if="!resolvedEntity"
        >Unknown {{ entityType }} '{{ entityRef }}'...</i
      >
      <slot v-else :entity="resolvedEntity" />
    </template>
    <q-inner-loading :showing="loadingEntity"></q-inner-loading>
  </span>
</template>

<script setup>
import { inject, ref, onMounted, onUnmounted } from "vue";

const props = defineProps({
  entityType: {
    type: String,
    required: true,
  },
  entityRef: {
    type: String,
    required: true,
  },
});

const emit = defineEmits(["entity-resolved"]);

const assetLink = inject("assetLink");

const initialLoading = ref(true);
const loadingEntity = ref(false);

const resolvedEntity = ref(null);

const resolveEntity = async () => {
  loadingEntity.value = true;
  try {
    const entity = await assetLink.resolveEntity(
      props.entityType,
      props.entityRef
    );
    emit("entity-resolved", entity);
    resolvedEntity.value = entity;
  } catch (e) {
    assetLink.vm.messages.push({
      text: `Failed to load entity: ${e.message}`,
      type: "error",
    });
    console.log(e);
  } finally {
    loadingEntity.value = false;
    initialLoading.value = false;
  }
};

const onEntityChanged = (changedEvent) => {
  const type = changedEvent[`${props.entityType}Type`];
  const id = changedEvent[`${props.entityType}Id`];

  if (
    resolvedEntity.value &&
    resolvedEntity.value.type === type &&
    resolvedEntity.value.id === id
  ) {
    resolveEntity();
  }
};

let unsubber;
onMounted(() => {
  resolveEntity();
  unsubber = assetLink.eventBus.$on(
    `changed:${props.entityType}`,
    onEntityChanged
  );
});
onUnmounted(() => unsubber && unsubber.$off());
</script>
