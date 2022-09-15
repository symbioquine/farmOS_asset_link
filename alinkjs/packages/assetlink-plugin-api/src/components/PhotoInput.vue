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
import { nextTick, ref, watch } from "vue";

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

const clipboardInputShown = ref(false);
const clipboardInputPopupEdit = ref(null);

watch(clipboardInputShown, () => {
  nextTick(() => {
    clipboardInputPopupEdit.value && clipboardInputPopupEdit.value.show();
  });
});

const onPasted = (e) => {
  if (!e?.clipboardData?.files?.length) {
    return;
  }
  model.value = e.clipboardData.files[0];
};
</script>

<template>
  <div class="row full-height items-center justify-evenly">
    <div class="col-4 add-photo-action-cell">
      <q-icon name="mdi-folder-image" size="6em" />
      <q-file accept=".jpg, image/*" filled v-model="model" label="Filled" />
    </div>
    <div class="col-4 add-photo-action-cell" v-if="captureSupported">
      <q-icon name="mdi-camera" size="6em" />
      <q-file
        capture="environment"
        accept=".jpg, image/*"
        filled
        v-model="model"
        label="Filled"
      />
    </div>

    <q-menu touch-position context-menu>
      <q-list dense style="min-width: 100px">
        <q-item clickable v-close-popup @click="clipboardInputShown = true">
          <q-item-section side>
            <q-icon name="mdi-content-paste" />
          </q-item-section>
          <q-item-section>Enable clipboard input</q-item-section>
        </q-item>
      </q-list>
    </q-menu>

    <q-popup-edit
      anchor="center middle"
      self="center middle"
      :cover="false"
      v-if="clipboardInputShown"
      ref="clipboardInputPopupEdit"
      modelValue=""
      @hide="clipboardInputShown = false"
    >
      <q-input
        dense
        autofocus
        @paste="onPasted"
        hint="Paste an image here..."
      />
    </q-popup-edit>
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
