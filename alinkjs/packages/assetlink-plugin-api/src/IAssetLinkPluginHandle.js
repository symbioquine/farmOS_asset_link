/* eslint-disable no-unused-vars */

/**
 * An object which is passed into the method a plugin's {@link IAssetLinkPlugin.onLoad} method.
 *
 * @interface
 * @property {IAssetLinkPlugin} thisPlugin The current plugin. For JS plugins this is just the class itself, but for
 *   .vue plugins this is the only way to access the Vue component that results from loading the .vue file.
 */
export default class IAssetLinkPluginHandle {}

/**
 * @callback routeDefiner
 * @param  {IAssetLinkPluginRouteHandle} routeHandle - The handle used to define a route
 */

/**
 * Define a route provided by this plugin.
 *
 * ### Usage
 *
 * ```js
 * handle.defineRoute('com.example.farmos_asset_link.routes.v0.my_page', pageRoute => {
 *   // See https://router.vuejs.org/guide/essentials/dynamic-matching.html for route path format
 *   pageRoute.path("/my-page/:arg");
 *
 *   pageRoute.component(SomeVueComponent);
 * });
 * ```
 *
 * @method IAssetLinkPluginHandle#defineRoute
 * @param {String} routeName The name of this route. e.g. `com.example.farmos_asset_link.routes.v0.my_page`
 * @param {routeDefiner} routeDefiner A method which accepts a {@link IAssetLinkPluginRouteHandle}
 *   and defines the route
 */
IAssetLinkPluginHandle.prototype.defineRoute = function (
  routeName,
  routeDefiner
) {};

/**
 * @callback slotDefiner
 * @param  {IAssetLinkPluginSlotHandle} slotHandle - The handle used to define a route
 */

/**
 * Define a slot provided by this plugin.
 *
 * ### Usage
 *
 * ```js
 * handle.defineSlot('com.example.farmos_asset_link.slots.v0.my_slot', pageSlot => {
 *   pageSlot.type('page-slot');
 *
 *   pageSlot.showIf(context => context.pageName === 'asset-page');
 *
 *   pageSlot.component(SomeVueComponent);
 * });
 * ```
 *
 * @method IAssetLinkPluginHandle#defineSlot
 * @param {String} slotName The name of this slot. e.g. `com.example.farmos_asset_link.slots.v0.my_slot`
 * @param {slotDefiner} slotDefiner A method which accepts a {@link IAssetLinkPluginSlotHandle}
 *   and defines the slot
 */
IAssetLinkPluginHandle.prototype.defineSlot = function (
  slotName,
  slotDefiner
) {};

/**
 * @callback widgetDecoratorDefiner
 * @param  {IAssetLinkPluginWidgetDecoratorHandle} widgetDecoratorHandle - The handle used to define a route
 */

/**
 * Define a widget decorator provided by this plugin.
 *
 * ### Usage
 *
 * ```js
 * handle.defineWidgetDecorator('com.example.farmos_asset_link.widget_decorator.v0.asset_name_with_peace_sign', widgetDecorator => {
 *   widgetDecorator.targetWidgetName('asset-name');
 *
 *   widgetDecorator.appliesIf(context => context.asset.attributes.status !== 'archived');
 *
 *   widgetDecorator.component(handle.thisPlugin);
 * });
 * ```
 *
 * @method IAssetLinkPluginHandle#defineWidgetDecorator
 * @param {String} widgetDecoratorName The name of this widget decorator. e.g. `com.example.farmos_asset_link.widget_decorator.v0.asset_name_with_peace_sign`
 * @param {widgetDecoratorDefiner} widgetDecoratorDefiner A method which accepts a {@link IAssetLinkPluginWidgetDecoratorHandle}
 *   and defines the widget decorator
 */
IAssetLinkPluginHandle.prototype.defineWidgetDecorator = function (
  widgetDecoratorName,
  widgetDecoratorDefiner
) {};

/**
 * @callback pluginIngestorDefiner
 * @param  {IAssetLinkPluginIngestorHandle} pluginIngestorHandle - The handle used to define a route
 */

/**
 * Define a plugin ingestor for this plugin.
 *
 * ### Usage
 *
 * ```js
 * handle.definePluginIngestor(pluginIngestor => {
 *   pluginIngestor.onEveryPlugin(plugin => {
 *     // Do something with every other plugin regardless of loading order...
 *   });
 * });
 * ```
 *
 * @method IAssetLinkPluginHandle#definePluginIngestor
 * @param {pluginIngestorDefiner} pluginIngestorDefiner A method which accepts a {@link IAssetLinkPluginIngestorHandle}
 *   and defines the plugin ingestor.
 */
IAssetLinkPluginHandle.prototype.definePluginIngestor = function (
  pluginIngestorDefiner
) {};

/**
 * @callback attributedHandlerFn
 * @param  {IAssetLinkPluginHandle} attributedHandle - The handle used to define a route
 */

/**
 * Define functionality on behalf of another plugin.
 *
 * ### Usage
 *
 * ```js
 * handle.onBehalfOf(plugin, attributedHandle => {
 *   // Asset Link will manage the lifecycle of routes/slots/etc defined via `attributedHandle`
 * });
 * ```
 *
 * @method IAssetLinkPluginHandle#onBehalfOf
 * @param {IAssetLinkPlugin} otherPlugin the plugin on behalf of which this plugin will define functionality.
 * @param {attributedHandlerFn} attributedHandlerFn A method which accepts the attributed {@link IAssetLinkPluginHandle}
 *   and defines functionality on behalf of that other plugin.
 */
IAssetLinkPluginHandle.prototype.onBehalfOf = function (
  otherPlugin,
  attributedHandlerFn
) {};

/**
 * Provide a plugin library
 *
 * ### Usage
 *
 * ```js
 * handle.provideLibrary('com.example.farmos_asset_link.libraryA', library => {
 *   library.version('1.2.3');
 *   library.provides(libraryA);
 * });
 * ```
 *
 * @method IAssetLinkPluginHandle#provideLibrary
 * @param {String} libraryName the name of the library
 * @param {attributedHandlerFn} libraryProviderFn A method which accepts a {@link IAssetLinkPluginLibraryProvisionHandle}
 *   and defines the library.
 */
IAssetLinkPluginHandle.prototype.provideLibrary = function (
  libraryName,
  libraryProviderFn
) {};

/**
 * Record an error from the current plugin.
 *
 * ### Usage
 *
 * ```js
 * handle.recordError("The stars are out of alignment.");
 * ```
 *
 * @method IAssetLinkPluginHandle#recordError
 * @param {String} errorString the error message
 */
IAssetLinkPluginHandle.prototype.recordError = function (errorString) {};
