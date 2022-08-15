import { defineComponent, h } from "vue";

/**
 * Renders a "widget" which plugins can decorate.
 *
 * ### Usage
 *
 * ```js
 * <render-widget
 *   name="asset-name"
 *   :context="{ asset }"
 * >{{ asset.attributes.name }}</render-widget>
 * ```
 *
 * @module RenderWidget
 * @category components
 * @vue-prop {String} name - the name of the widget
 * @vue-prop {Object} context - the context to be passed to any widget decorate plugins
 */
const RenderWidget = defineComponent({
  inject: ["assetLink"],
  props: {
    name: { type: String, required: true },
    context: { type: Object, required: true },
  },
  render() {
    const widgetDecorators = this.assetLink.getWidgetDecorators({
      widgetName: this.name,
      route: this.$route,
      ...this.context,
    });

    return widgetDecorators.reduce(
      (decoratedWidget, decorator) =>
        h(decorator.component, decorator.props, [decoratedWidget]),
      this.$slots.default({})
    );
  },
});

export default RenderWidget;
