<template>
  <span><slot></slot> <v-icon>mdi-archive-clock</v-icon></span>
</template>

<script>
export default {
  onLoad(handle) {

    handle.defineWidgetDecorator('net.symbioquine.farmos_asset_link.widget_decorator.v0.asset_name_with_archived', anwaWidgetDecorator => {
      anwaWidgetDecorator.targetWidgetName('asset-name');

      anwaWidgetDecorator.appliesIf(context => context.asset.attributes.status === 'archived');

      anwaWidgetDecorator.componentFn((wrapper, h, context, children) => {
        return h(handle.thisPlugin, { props: { asset: context.asset } }, children);
      });

    });

  }
}
</script>
