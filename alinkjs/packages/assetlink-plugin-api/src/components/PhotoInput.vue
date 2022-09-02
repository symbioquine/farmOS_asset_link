<script>
/**
 * Renders buttons used to capture/select photo file inputs.
 *
 * ### Usage
 *
 * ```js
 * <photo-input v-model="photoFile"></photo-input>
 * ```
 *
 * @category components
 * @vue-prop {Object} [modelValue=null] - The initially selected photo file
 * @vue-event {String} update:modelValue - Emitted when a photo has been captured/selected
 */
export default {};
</script>

<script setup>
import { ref, watch } from "vue";

const props = defineProps({
  modelValue: { type: Object, default: null },
});
const emit = defineEmits(["update:modelValue"]);

const model = ref(props.modelValue);

watch(model, () => {
  emit("update:modelValue", model.value);
});

let captureSupported = false;
try {
  captureSupported = document.createElement("input").capture !== undefined;
} catch (
  e
  /* eslint-disable no-empty */
) {}
</script>

<template>
  <div class="row full-height items-center justify-evenly">
    <div class="col-4 add-photo-action-cell">
      <q-icon name="mdi-folder-image" size="6em" />
      <q-file accept=".jpg, image/*" filled v-model="model" label="Filled" />
    </div>
    <div class="col-4 add-photo-action-cell">
      <q-icon name="mdi-camera" size="6em" />
      <q-file
        v-if="captureSupported"
        capture="environment"
        accept=".jpg, image/*"
        filled
        v-model="model"
        label="Filled"
      />
    </div>
  </div>
</template>

<style scoped>
label.q-file {
  -webkit-appearance: none;
  position: absolute;
  top: 0px;
  left: 0px;
  opacity: 0;
  width: 100%;
  height: 100%;
}

.add-photo-action-cell {
  width: 20vh;
  aspect-ratio: 1 / 1;
  max-height: 160px;
  border-radius: 8px;
  background: #eee;
}

.add-photo-action-cell i.q-icon {
  width: 100%;
  height: 100%;
  padding: 4px;
  color: #888;
}
</style>
