import { defineComponent, h } from 'vue';

const RenderWidget = defineComponent({
  props: {
    name: { type: String, required: true },
    context: { type: Object, required: true },
  },
  inject: ['assetLink'],
  render() {
    const widgetDecorators = this.assetLink.getWidgetDecorators({
      widgetName: this.name,
      route: this.$route,
      ...this.context
    });

    return widgetDecorators.reduce(
      (decoratedWidget, decorator) => h(decorator.component, decorator.props, [decoratedWidget]),
      this.$slots.default({})
    );
  },
});

export default RenderWidget;