import Vue from 'vue';

const RenderWidget = Vue.extend({
  props: {
    name: { type: String, required: true },
    context: { type: Object, required: true },
  },
  inject: ['assetLink'],
  render(h) {
    const widgetDecorators = this.assetLink.getWidgetDecorators({
      widgetName: this.name,
      route: this.$route,
      ...this.context
    });

    return widgetDecorators.reduce(
      (decoratedWidget, decorator) => decorator.componentFn(this, h, [decoratedWidget]),
      this.$slots.default
    );
  },
});

export default RenderWidget;
