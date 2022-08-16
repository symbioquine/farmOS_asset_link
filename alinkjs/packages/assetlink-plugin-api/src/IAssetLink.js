/* eslint-disable no-unused-vars */

/**
 * The main API entry-point for accessing app/data state within Asset Link.
 *
 * @interface
 * @property {VueComponentInstance} rootComponent The root Vue component instance - sometimes needed for registering things like global dialogs.
 * @property {IFarmOSConnectionStatus} connectionStatus The current network/farmOS connection status information.
 * @property {EventBus} eventBus An async event bus used to signal certain key occurrences.
 * @property {IAssetLinkUI} ui UI components/methods exposed for Asset Link plugins.
 * @property {external:Promise} booted A Promise that is fulfilled once Asset Link has booted.
 * @property {IAssetLinkPlugin[]} plugins The currently loaded plugins.
 * @property {external:@orbit/memory.MemorySource} entitySource The Orbit.js MemorySource which is used to access/modify farmOS assets/logs/etc.
 *
 * Will be `undefined` until Asset Link has booted.
 * @property {external:@orbit/jsonapi.JSONAPISource} remoteEntitySource The Orbit.js JSONAPISource which is used to directly access/modify
 * farmOS assets/logs/etc - unless you know what you are doing, use `IAssetLink#entitySource` instead.
 *
 * Will be `undefined` until Asset Link has booted.
 */
export default class IAssetLink {}

/**
 * Gets the model for an entity type given that the type name. e.g. `"asset--plant"`
 *
 * @method IAssetLink#getEntityModel
 * @param {String} typeName A farmOS JSON:API type - e.g. "asset--plant"
 */
IAssetLink.prototype.getEntityModel = async function (typeName) {};

/**
 * Get an asset by UUID or Drupal internal id.
 *
 * ##### Usage
 *
 * ```js
 * const asset = await assetLink.resolveAsset(42);
 *
 * console.log(asset.attributes.name);
 * ```
 *
 * @method IAssetLink#resolveAsset
 * @param {String|Number} assetRef the ID/UUID of the asset
 * @param {Object[]} additionalFilters additional resolution criteria in Orbit.js filter format
 *   e.g. `[{ attribute: 'is_location', op: 'equal', value: true }]`
 */
IAssetLink.prototype.resolveAsset = async function (
  assetRef,
  additionalFilters
) {};

/**
 * Get a list of the asset_type entities.
 *
 * @method IAssetLink#getAssetTypes
 */
IAssetLink.prototype.getAssetTypes = async function () {};

/**
 * Get a list of the log_type entities.
 *
 * @method IAssetLink#getLogTypes
 */
IAssetLink.prototype.getLogTypes = async function () {};

/**
 * Central asset searching entry-point. Responsible for delegating to asset searching plugins.
 *
 * *Note: It would be unusual to call this directly. Most use-cases should use the [RenderWidget](module-AssetSelector.html) component which
 * internally handles `searchAssets` and presents the results.*
 *
 * @method IAssetLink#searchAssets
 * @param {Object} searchRequest An object with varying structure produced by
 *   a search method plugin - passed through to {@link IAssetLinkPlugin.searchAssets}
 *   implementations.
 * @param {String} searchPhase One of "local" or "remote" to request
 *   offline or online asset search results respectively.
 */
IAssetLink.prototype.searchAssets = function (searchRequest, searchPhase) {};

/**
 * @typedef RenderableDef
 * @description A combination of a Vue component plus the information needed to render it in
 *   the requested context - `id` and `props`.
 *
 * ##### Usage
 *
 * ```js
 * <component
 *     :key="renderableDef.id"
 *     :is="renderableDef.id.component"
 *     v-bind="renderableDef.id.props"></component>
 * ```
 *
 * @property {String} id The unique (for this context) id of the thing to render
 * @property {VueComponent} component The component to render
 * @property {Object} props The props to render the component with
 * @property {Number} weight The weight of this renderable
 */

/**
 * Get slots that match a given context.
 *
 * ##### Usage
 *
 * ```js
 * <component
 *     v-for="slotDef in assetLink.getSlots({ type: 'page-slot', route: $route, pageName: 'my-page', asset })"
 *     :key="slotDef.id"
 *     :is="slotDef.component"
 *     v-bind="slotDef.props"></component>
 * ```
 *
 * @method IAssetLink#getSlots
 * @param {Object} context The context used to filter/render the slots. Must at least have the key `type`.
 * @return {RenderableDef[]} The renderable slots already sorted by weight
 */
IAssetLink.prototype.getSlots = function (context) {};

/**
 * Get widget decorators that match a given context.
 *
 * *Note: It would be unusual to call this directly. Most use-cases should use the [RenderWidget](module-RenderWidget.html) component
 * which internally calls `getWidgetDecorators` and composes the resulting widget decorator renderable defs.*
 *
 * ```js
 * <render-widget
 *   name="asset-name"
 *   :context="{ asset }"
 * >{{ asset.attributes.name }}</render-widget>
 * ```
 *
 * @method IAssetLink#getWidgetDecorators
 * @param {Object} context The context object usually assembled by the RenderWidget component. Must at least have the key `widgetName`.
 * @return {RenderableDef[]} The renderable widget decorators already sorted by weight
 */
IAssetLink.prototype.getWidgetDecorators = function (context) {};

/**
 * The built-in class representing the eventual completion (or failure) of an
 * asynchronous operation and its resulting value.
 * @external Promise
 * @see https://developer.mozilla.org/en-US/docs/Web/API/Promise
 */

/**
 * An Orbit.js class that stores/provides access to in-memory data.
 * @class MemorySource
 * @memberof external:@orbit/memory
 * @see https://orbitjs.com/docs/api/memory/classes/MemorySource
 */

/**
 * The Orbit.js in-memory data source package.
 * @external @orbit/memory
 * @see https://orbitjs.com/docs/api/memory
 */

/**
 * An Orbit.js class that stores/provides access to in-memory data.
 * @class JSONAPISource
 * @memberof external:@orbit/jsonapi
 * @see https://orbitjs.com/docs/api/jsonapi/classes/JSONAPISource
 */

/**
 * The Orbit.js in-memory data source package.
 * @external @orbit/jsonapi
 * @see https://orbitjs.com/docs/api/jsonapi
 */
