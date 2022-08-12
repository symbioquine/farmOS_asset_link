<script setup>
import { ref } from 'vue';
import { uuidv4 } from 'assetlink-plugin-api';

const emit = defineEmits(["update:searchRequest"]);

const searchText = ref('');

const qrCodeErr = (err) => {
  console.log('Error: ' + err.message + " - " + JSON.stringify(err));
};

const qrCodeScanned = async (qrCodeResult) => {
  console.log('qrCodeScanned', qrCodeResult);
  searchText.value = qrCodeResult.data;
  emit('update:searchRequest', {
    id: uuidv4(),
    type: 'text-search',
    term: qrCodeResult.data,
  });
};

</script>

<template alink-slot[net.symbioquine.farmos_asset_link.asset_search.v0.qr_code]="asset-search-method">
  <search-method
    name="scan-qr-code"
    icon="mdi-qrcode-scan">

    <template #search-interface>
      <div class="q-pa-md">
        <qr-code-scanner @qr-code-scanned="qrCodeScanned($event)" @qr-code-err="qrCodeErr"></qr-code-scanner>
        <q-input v-model="searchText" dense disabled />
      </div>
    </template>

  </search-method>

</template>

