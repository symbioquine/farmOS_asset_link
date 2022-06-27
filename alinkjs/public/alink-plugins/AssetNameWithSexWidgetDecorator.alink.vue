<template>
  <span><slot></slot> {{ iconSuffix }}</span>
</template>

<script>
export default {
  props: {
    asset: {
      type: Object,
      required: true,
    }
  },
  computed: {
    iconSuffix() {
      if (this.asset.attributes.sex === 'F') return '\u{2640}';
      if (this.asset.attributes.sex === 'M') return '\u{2642}';
      return '';
    }
  },
  onLoad(handle) {
    handle.defineWidgetDecorator('net.symbioquine.farmos_asset_link.widget_decorator.v0.asset_name_with_sex', widgetDecorator => {
      widgetDecorator.targetWidgetName('asset-name');

      widgetDecorator.appliesIf(context => !!context.asset.attributes.sex);

      widgetDecorator.component(handle.thisPlugin);
    });
  }
}
</script>
