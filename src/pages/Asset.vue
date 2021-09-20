<template>
  <div class="container">
    <asset-resolver :asset-ref="$route.params.assetRef" #default="{ asset }">
      <H3 class="mt-2">Asset: {{ asset.attributes.name }}</H3><b-badge class="header-badge" :href="'/asset/' + asset.attributes.drupal_internal__id" variant="success">View in farmOS</b-badge>
      <H4 class="mt-2">Actions:</H4>
      <span v-for="action in getRelevantActions(asset)" :key="action.key()">
        <component :is="action.component()" v-bind="action.componentArgs()"></component>
      </span>
    </asset-resolver>
  </div>
</template>

<script>
export default {
  routePath: '/asset/:assetRef',
  inject: ['assetLink'],
  methods: {
    getRelevantActions(asset) {
      const actions = this.assetLink.getRelevantActions(asset);
      console.log("Asset::getRelevantActions", actions);
      return actions;
    },
  },
}
</script>

<style scoped>
H3 {
  display: inline-block;
}
.header-badge {
  display: inline-block;
  vertical-align: middle;
  margin-top: -1em;
  margin-left: 1em;
}
</style>
