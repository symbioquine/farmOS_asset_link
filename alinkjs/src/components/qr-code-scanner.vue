<template>
  <video style="max-width: 100%; max-height: 75%;" ref="preview"></video>
</template>

<script>
import QrScanner from 'qr-scanner';

export default {
  mounted() {
    const vm = this;

    vm.qrScanner = new QrScanner(this.$refs.preview, function(content) {
      try {
        vm.$emit('qr-code-scanned', content);
      } catch (err) {
        vm.$emit('qr-code-err', err);
      }
    }, function(err) {
      if (err === "No QR code found") {
        return;
      }
      vm.$emit('qr-code-err', err);
    });
    vm.qrScanner.start().catch(function(err) {
      vm.$emit('qr-code-err', err);
    });
  },
  beforeUnmount() {
    this.qrScanner.stop();
    this.qrScanner.destroy();
    this.qrScanner = null;
  },
};
</script>
