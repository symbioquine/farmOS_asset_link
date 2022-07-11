<template>
  <span>
    <i v-if="!resolvedAsset">Unknown asset '{{ assetRef }}'...</i>
    <slot v-else :asset="resolvedAsset"></slot>
  </span>
</template>

<script setup>
import { inject, ref, onMounted, onUnmounted } from 'vue';
import { useQuasar } from 'quasar';

const props = defineProps({
  assetRef: {
    type: String,
    required: true,
  },
});

const emit = defineEmits(['asset-resolved']);

const assetLink = inject('assetLink');

const $q = useQuasar();

const isLoadingAsset = ref(false);
const resolvedAsset = ref(null);

const resolveAsset = async () => {
  isLoadingAsset.value = true;
  $q.loading.show();
  try {
    const asset = await assetLink.resolveAsset(props.assetRef);
    emit('asset-resolved', asset);
    resolvedAsset.value = asset;
  } catch (e) {
    assetLink.vm.messages.push({text: `Failed to load asset: ${e.message}`, type: "error"});
    console.log(e);
  } finally {
    isLoadingAsset.value = false;
    $q.loading.hide();
  }
};

const onAssetChanged = (assetType, assetId) => {
  const resolvedAsset = this.resolvedAsset;
  if (resolvedAsset.value && resolvedAsset.value.type === assetType && resolvedAsset.value.id === assetId) {
    resolveAsset();
  }
};

let unsubber;
onMounted(() => {
  resolveAsset();
  unsubber = assetLink.eventBus.$on('changed:asset', onAssetChanged);
});
onUnmounted(() => unsubber && unsubber.$off());
</script>


