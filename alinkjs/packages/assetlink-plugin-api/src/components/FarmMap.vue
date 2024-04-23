<script>
/**
 * Render a farmOS map
 *
 * ### Usage
 *
 * ```js
 * <farm-map></farm-map>
 * ```
 *
 * @category components
 * @vue-data {Object} [mapDiv=null] - The element where the map is rendered
 * @vue-data {MapInstance} [map=null] - The farmOS-map instance object
 * @vue-event {MapInstance} mapInitialized - Emitted when the farmOS-map instance object has been initialized
 * @see {@link https://github.com/farmOS/farmOS-map/blob/2.x/README.md|farmOS-map README for documentation about the map instance object}
 */
export default {};
</script>

<script setup>
import { inject, onMounted, markRaw, ref } from "vue";
import createDrupalUrl from "../createDrupalUrl";

import fetchInject from "fetch-inject";

const emit = defineEmits(["mapInitialized"]);

window.farmosMapPublicPath = createDrupalUrl("/libraries/farmOS-map/");

const assetLink = inject("assetLink");

const mapDiv = ref(null);
const map = ref(null);

onMounted(async () => {
  await fetchInject([
    createDrupalUrl("/libraries/farmOS-map/farmOS-map.css"),
    createDrupalUrl("/libraries/farmOS-map/farmOS-map.js"),
  ]);

  map.value = markRaw(
    window.farmOS.map.create(mapDiv.value, {
      units: assetLink.vm.systemOfMeasurement || "metric",
    })
  );

  emit("mapInitialized", map.value);
});

defineExpose({ map, mapDiv });
</script>

<template>
  <div
    class="farm-map"
    style="width: 100%; height: 100%; position: fixed"
    ref="mapDiv"
  ></div>
</template>
