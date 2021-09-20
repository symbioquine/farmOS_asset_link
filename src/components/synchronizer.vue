<template>
  <span>
    <slot :synchronizer="self"></slot>
  </span>
</template>

<script>

export default {
  props: {
    dataProvider: {
      type: Object,
      required: true
    },
    store: {
      type: Object,
      required: true
    },
  },
  data: function() {
    return {
      self: this,
      pendingItems: [],
      // Holds this tab's progress on the identified items
      pendingItemsLocalProgressById: {},
    };
  },
  provide() {
    return {
      'synchronizer': this,
    };
  },
  created() {
    this._checkSynchronize();
    this.checkSynchronizeTimer = setInterval(this._checkSynchronize, 1000);
  },
  destroyed () {
    clearInterval(this.checkSynchronizeTimer);
  },
  methods: {
    progress(pendingItem) {
      return this.pendingItemsLocalProgressById[pendingItem.id] || {};
    },

    async _checkSynchronize() {

    },

  },
};
</script>
