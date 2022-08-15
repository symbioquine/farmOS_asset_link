<script>
/**
 * Renders a camera preview and emits events when QR codes are scanned.
 *
 * ### Usage
 *
 * ```js
 * <qr-code-scanner
 *   &commat;qr-code-scanned="onQrCodeScanned"
 *   &commat;qr-code-err="onQrCodeErr"
 * ></qr-code-scanner>
 * ```
 *
 * @category components
 * @vue-event {String} qr-code-scanned - Emit scanned codes
 * @vue-event {String} qr-code-err - Emit error when scanner fails or can't initialize
 */
export default {};
</script>

<script setup>
import { onMounted, onUnmounted, ref } from "vue";
import QrScanner from "qr-scanner";

const emit = defineEmits(["qr-code-scanned", "qr-code-err"]);

let qrScanner = null;

const preview = ref(null);

onMounted(() => {
  qrScanner = new QrScanner(
    preview.value,
    (content) => {
      try {
        emit("qr-code-scanned", content.data);
      } catch (err) {
        emit("qr-code-err", err);
      }
    },
    {
      onDecodeError(err) {
        if (err === "No QR code found") {
          return;
        }
        emit("qr-code-err", err);
      },
    }
  );
  qrScanner.start().catch((err) => {
    emit("qr-code-err", err);
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
  <video ref="preview" style="max-width: 100%; max-height: 75%" />
</template>
