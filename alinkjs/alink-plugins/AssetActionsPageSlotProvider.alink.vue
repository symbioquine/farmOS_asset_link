<template>
  <div>
    <h3 class="my-3">Actions:</h3>
    <v-row class="ml-2" v-for="actionDef in assetLink.getSlots({ type: 'asset-action', route: $route, asset })">
      <render-fn-wrapper class="mt-3" :key="actionDef.id" :render-fn="actionDef.componentFn"></render-fn-wrapper>
    </v-row>
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

      actionsSlot.componentFn((wrapper, h, context) => {
        return h(handle.thisPlugin, { props: { asset: context.asset } });
      });

    });

  }
}
</script>
