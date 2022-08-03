<script setup>
import { onMounted, onUnmounted, ref } from 'vue';
import QrScanner from 'qr-scanner';

const emit = defineEmits([
  'qr-code-scanned',
  'qr-code-err',
]);

let qrScanner = null;

const preview = ref(null);

onMounted(() => {
  qrScanner = new QrScanner(preview.value, function(content) {
    try {
      emit('qr-code-scanned', content);
    } catch (err) {
      emit('qr-code-err', err);
    }
  }, {
    onDecodeError(err) {
      if (err === "No QR code found") {
        return;
      }
      emit('qr-code-err', err);
    },
  });
  qrScanner.start().catch(function(err) {
    emit('qr-code-err', err);
  });
});
onUnmounted(() => {
  if (!qrScanner) {
    return;
  }
  qrScanner.stop();
  qrScanner.destroy();
  qrScanner = null;
});
</script>

<template>
  <video style="max-width: 100%; max-height: 75%;" ref="preview"></video>
</template>
