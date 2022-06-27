<template>
  <div>
    <h5 class="q-my-sm">Actions:</h5>
    <div class="row q-mx-md" v-for="actionDef in assetLink.getSlots({ type: 'asset-action', route: $route, asset })">
      <component
            :key="actionDef.id"
            :is="actionDef.component"
            v-bind="actionDef.props"
            class="full-width q-mb-md"></component>
    </div>
  </div>
</template>

<script>
// TODO: Add "No actions text if there aren't any relevant actions
export default {
  props: {
    asset: {
      type: Object,
      required: true,
    }
  },
  inject: ['assetLink'],
  onLoad(handle) {
    handle.defineSlot('net.symbioquine.farmos_asset_link.slots.v0.actions', actionsSlot => {
      actionsSlot.type('page-slot');

      actionsSlot.showIf(context => context.pageName === 'asset-page');

      actionsSlot.component(handle.thisPlugin);
    });
  }
}
</script>
