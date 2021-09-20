<template>
  <synchronizer :data-provider="self" :store="store" #default="{ synchronizer }">

    <b-navbar toggleable="false" type="dark" variant="dark">
      <b-navbar-brand to="/info">Asset Link</b-navbar-brand>

      <synchronizer-tray
          :is-online="isOnline"
          :data-age="dataAge"
          :synchronizer="synchronizer"
        ></synchronizer-tray>

      <b-navbar-nav class="ml-auto">
        <b-nav-item to="/go" aria-label="Go to another page">Go <QrcodeScanIcon title="Go to another page"></QrcodeScanIcon></b-nav-item>
      </b-navbar-nav>

    </b-navbar>

    <router-view></router-view>
  </synchronizer>
</template>

<script>
import QrcodeScanIcon from 'vue-material-design-icons/QrcodeScan.vue';

function currentEpochSecond() {
  return new Date().getTime() / 1000;
}

export default {
  components: {
    QrcodeScanIcon,
  },
  provide() {
    return {
      'dataProvider': this,
      'assetLink': window.assetLink,
    };
  },
  data: function () {
    console.log(`drupalSettings.path.baseUrl=${drupalSettings.path.baseUrl}`);

    const store = this.$vlf.createInstance({
      storeName: 'asset-link'
    });

    return {
      self: this,
      currentTimestamp: null,
      desiredEarliestDataTimestamp: parseInt((currentEpochSecond()) / 3600) * 3600,
      isOnline: navigator.onLine,
      store,
    };
  },
}
</script>

<style scoped>
.asset-link-page .toolbar {
  display: none;
}
body {
  margin: 0;
}
p {
  font-size: 2em;
  text-align: center;
}
</style>