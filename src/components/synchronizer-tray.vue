<template>
  <b-navbar-nav class="ml-auto">

    <b-nav-item class="uploads-button" v-b-toggle.sync-status-sidebar>
      <span class="badged-icon">
        <b-iconstack class="icon">
          <b-icon-cloud v-if="isOnline" stacked scale="2"></b-icon-cloud>
          <b-icon-arrow-up v-if="isOnline" stacked scale="1.1" shift-v="1" shift-h="2.5"></b-icon-arrow-up>
          <b-icon-arrow-down v-if="isOnline" stacked scale="1.1" shift-v="1" shift-h="-4"></b-icon-arrow-down>
          <b-icon-cloud-slash v-else stacked scale="1.5"></b-icon-cloud-slash>
        </b-iconstack>
        <b-badge v-if="false || synchronizer.pendingItems.length > 0" pill variant="danger">{{ synchronizer.pendingItems.length }}</b-badge>
      </span>
      <span class="label">{{ dataAge }}</span>
    </b-nav-item>

  </b-navbar-nav>
</template>

<script>
export default {
  props: {
    dataAge: { type: String, default: '' },
    isOnline: { type: Boolean, default: false },
    synchronizer: { type: Object },
  },
};
</script>

<style scoped>
.badged-icon {
  position: relative;
  display: inline-block;
  height: 16px;
  width: 32px;
}
.badged-icon .icon {
  position: relative;
  float: left;
}
.badged-icon .badge {
  display: inline-block;
  font-size: 7pt;
  position: absolute;
  top: -6px;
  right: 0px;
}
.label {
  display: inline-block;
  vertical-align: middle;
}
</style>
