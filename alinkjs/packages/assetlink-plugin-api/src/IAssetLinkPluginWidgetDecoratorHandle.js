/* eslint-disable no-unused-vars */

/**
 * An object which is passed into the method a plugin provides for declaring a
 * widget decorator via {@link IAssetLinkPluginHandle#defineWidgetDecorator}.
 *
 * @interface
 */
export default class IAssetLinkPluginWidgetDecoratorHandle {}

/**
 * Specify the name of the widget this decorator applies to.
 *
 * ### Usage
 *
 * ```js
 * widgetDecorator.targetWidgetName('asset-name');
 * ```
 *
 * @method IAssetLinkPluginWidgetDecoratorHandle#targetWidgetName
 * @param {String} targetWidgetName The name of the widget this decorator should apply to.
 */
IAssetLinkPluginWidgetDecoratorHandle.prototype.targetWidgetName = function (
  targetWidgetName
) {};

/**
 * Specify a function which determines whether this widget decorator should apply for a given context.
 *
 * ### Usage
 *
 * ```js
 * pageSlot.appliesIf(context => context.asset.attributes.status !== 'archived');
 * ```
 *
 * @method IAssetLinkPluginWidgetDecoratorHandle#appliesIf
 * @param {Function} predicateFn Determines whether this widget decorator should apply for a given
 *   context.
 */
IAssetLinkPluginWidgetDecoratorHandle.prototype.appliesIf = function (
  predicateFn
) {};

/**
 * Specify the weight for this widget decorator.
 *
 * ### Usage
 *
 * ```js
 * pageSlot.weight(50);
 * ```
 *
 * @method IAssetLinkPluginWidgetDecoratorHandle#weight
 * @param {Number|Function} weight The weight of this widget decorator - either a fixed number
 *   or a function that takes the context and returns a number.
 */
IAssetLinkPluginWidgetDecoratorHandle.prototype.weight = function (weight) {};

/**
 * Specify the component for this plugin-provided slot.
 *
 * ### Usage
 *
 * ```js
 * pageSlot.component(SomeVueComponent);
 * ```
 *
 * @method IAssetLinkPluginWidgetDecoratorHandle#component
 * @param {VueComponent} component The component for this plugin-provided slot.
 *   this can be anything that is valid as the first argument to Vue's [`h()` function](https://vuejs.org/api/render-function.html#h).
 *   See Vue's documentation on [render functions](https://vuejs.org/guide/extras/render-function.html).
 */
IAssetLinkPluginWidgetDecoratorHandle.prototype.component = function (
  component
) {};
