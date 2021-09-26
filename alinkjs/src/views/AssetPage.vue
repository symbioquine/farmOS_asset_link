<template>
  <v-container>
    <v-container class="text-left">

      <asset-resolver :asset-ref="$route.params.assetRef" #default="{ asset }" @asset-resolved="onAssetResolved($event)">
        <h2>Asset: {{ asset.attributes.name }}</h2>
        <h3 class="my-3">Actions:</h3>
        <v-row class="ml-2" v-for="actionDef in getRelevantActions(asset)" :key="actionDef.id">
          <action-wrapper class="mt-3" :action-def="actionDef"></action-wrapper>
        </v-row>
      </asset-resolver>

    </v-container>
  </v-container>
</template>

<script>
import Vue from 'vue';

// TODO: Add "No actions text if there aren't any relevant actions

const ActionWrapper = Vue.component('action-wrapper', {
  props: {
    actionDef: { type: Object, required: true },
  },
  render(h) {
    return this.actionDef.componentFn(this, h);
  },
});

export default {
  routePath: '/asset/:assetRef',
  inject: ['assetLink'],
  components: {
    ActionWrapper,
  },
  methods: {
    /* eslint-disable no-console,no-unused-vars */
    onAssetResolved(asset) {
      const metaActionDefs = this.assetLink.getRelevantMetaActions(asset);
      this.$emit('expose-meta-actions', metaActionDefs);
    },
    getRelevantActions(asset) {
      const actionDefs = this.assetLink.getRelevantActions(asset);
      return actionDefs;
    },
  },
}
</script>
