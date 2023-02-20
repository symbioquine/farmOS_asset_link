<script setup>
import { inject, ref, watch } from "vue";

import { createDrupalUrl, uuidv4 } from "assetlink-plugin-api";

const assetLink = inject("assetLink");

const props = defineProps({
  log: {
    type: Object,
    required: true,
  },
});

const model = ref(null);

watch(model, async () => {
  const file = model.value;

  if (!file) {
    return;
  }

  const fileToArrayBuffer = data => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = error => reject(error);
    reader.readAsArrayBuffer(data);
  });

  const fileName = file.name;
  const fileType = file.type;
  const fileData = await fileToArrayBuffer(file);

  const fileStringData = new Uint8Array(fileData).reduce((data, byte) => {
    return data + String.fromCharCode(byte);
  }, '');

  const fileDataUrl = `data:${fileType};base64, ` + btoa(fileStringData);

  assetLink.entitySource.update((t) =>
    t.addToRelatedRecords({ type: props.log.type, id: props.log.id }, 'image', {
        type: "file--file",
        // Placeholder UUID gets replaced by '$upload' directive below so the resulting 'file--file'
        // entity will have a different ID once the file/relationship gets saved to the server
        // Until https://www.drupal.org/project/drupal/issues/3021155 gets fixed anyway
        id: uuidv4(),
        '$upload': {
          fileName,
          fileDataUrl,
        },
    })
  , {label: `Add photo to log: "${props.log.attributes.name}"`});
});
</script>

<template>
  <q-carousel-slide>
    <photo-input class="q-pb-xl" v-model="model"></photo-input>
  </q-carousel-slide>
</template>

<script>
export default {
  onLoad(handle, assetLink) {
    handle.defineSlot('net.symbioquine.farmos_asset_link.vcarousel_item.v0.log_photo_capture', vCarouselItem => {
      vCarouselItem.type('log-visual-carousel-item');

      vCarouselItem.weight(200);

      vCarouselItem.component(handle.thisPlugin);
    });
  }
}
</script>
