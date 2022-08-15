/* eslint-disable no-unused-vars */

/**
 * An object which is passed into the method a plugin provides for declaring a
 * route via {@link IAssetLinkPluginHandle#defineRoute}.
 *
 * @interface
 */
export default class IAssetLinkPluginRouteHandle {
}

/**
 * Specify the path for this plugin-provided route.
 * 
 * ### Usage
 * 
 * ```js
 * pageRoute.path("/my-page/:arg");
 * ```
 * 
 * @method IAssetLinkPluginRouteHandle#path
 * @param {String} path The path of this plugin-provided route. See
 *   https://router.vuejs.org/guide/essentials/dynamic-matching.html for route path format.
 */
IAssetLinkPluginRouteHandle.prototype.path = function(path) {
};

/**
 * Specify the component for this plugin-provided route.
 * 
 * ### Usage
 * 
 * ```js
 * pageRoute.component(SomeVueComponent);
 * ```
 *
 * @method IAssetLinkPluginRouteHandle#component
 * @param {VueComponent} component The component for this plugin-provided route.
 *   this can be anything that is valid as the first argument to Vue's [`h()` function](https://vuejs.org/api/render-function.html#h).
 *   See Vue's documentation on [render functions](https://vuejs.org/guide/extras/render-function.html).
 */
IAssetLinkPluginRouteHandle.prototype.component = function(component) {
};