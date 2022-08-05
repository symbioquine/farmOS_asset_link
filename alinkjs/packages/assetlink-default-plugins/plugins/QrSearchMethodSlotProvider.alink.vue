<script setup>
const qrCodeErr = (err) => {
  console.log('Error: ' + err.message + " - " + JSON.stringify(err));
};

const qrCodeScanned = async (qrCodeText) => {
  console.log(`qrCodeScanned: ${qrCodeText}`);
};

</script>

<template alink-slot[net.symbioquine.farmos_asset_link.asset_search.v0.qr_code]="asset-search-method">
  <search-method
    name="scan-qr-code"
    icon="mdi-qrcode-scan">

    <template #search-interface>
      <div class="q-pa-md">
        <qr-code-scanner @qr-code-scanned="qrCodeScanned($event)" @qr-code-err="qrCodeErr"></qr-code-scanner>
      </div>
    </template>

  </search-method>

</template>

