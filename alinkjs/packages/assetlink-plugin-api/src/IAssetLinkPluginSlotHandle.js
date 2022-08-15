/* eslint-disable no-unused-vars */

/**
 * An object which is passed into the method a plugin provides for declaring a
 * slot via {@link IAssetLinkPluginHandle#defineSlot}.
 *
 * @interface
 */
export default class IAssetLinkPluginSlotHandle {
}

/**
 * Specify the type of this slot.
 * 
 * ### Usage
 * 
 * ```js
 * pageSlot.type("page-slot");
 * ```
 * 
 * @method IAssetLinkPluginSlotHandle#type
 * @param {String} type The path of this plugin-provided route. See
 *   https://router.vuejs.org/guide/essentials/dynamic-matching.html for route path format.
 */
IAssetLinkPluginSlotHandle.prototype.type = function(type) {
};

/**
 * Specify a function which determines whether this slot should apply for a given context.
 * 
 * ### Usage
 * 
 * ```js
 * pageSlot.showIf(context => context.asset.attributes.status !== 'archived');
 * ```
 * 
 * @method IAssetLinkPluginSlotHandle#showIf
 * @param {Function} predicateFn Determines whether this slot should apply for a given
 *   context.
 */
IAssetLinkPluginSlotHandle.prototype.showIf = function(predicateFn) {
};

/**
 * Specify a function that allows this slot to render multiple times with different inputs.
 * 
 * ### Usage
 * 
 * ```js
 * pageSlot.multiplexContext(context => context.asset.nickname);
 * ```
 * 
 * @method IAssetLinkPluginSlotHandle#multiplexContext
 * @param {Function} contextMultiplexerFn A function which allows a slot to "fan out" and
 *   render multiple times with different inputs.
 */
IAssetLinkPluginSlotHandle.prototype.multiplexContext = function(contextMultiplexerFn) {
};

/**
 * Specify the weight for this plugin-provided slot.
 * 
 * ### Usage
 * 
 * ```js
 * pageSlot.weight(50);
 * ```
 * 
 * @method IAssetLinkPluginSlotHandle#weight
 * @param {Number|Function} weight The weight of this slot - either a fixed number
 *   or a function that takes the context and returns a number.
 */
IAssetLinkPluginSlotHandle.prototype.weight = function(weight) {
};

/**
 * Specify the component for this plugin-provided slot.
 * 
 * ### Usage
 * 
 * ```js
 * pageSlot.component(SomeVueComponent);
 * ```
 *
 * @method IAssetLinkPluginSlotHandle#component
 * @param {VueComponent} component The component for this plugin-provided slot.
 *   this can be anything that is valid as the first argument to Vue's [`h()` function](https://vuejs.org/api/render-function.html#h).
 *   See Vue's documentation on [render functions](https://vuejs.org/guide/extras/render-function.html).
 */
IAssetLinkPluginSlotHandle.prototype.component = function(component) {
};