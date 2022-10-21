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
 * @property {external:localForage} store A localForage instance that is used to store and retrieve data from IndexedDB.
 * @property {Object} devToolsApi A semi-private mechanism to interact with the browser dev tools.
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
 * A decorated version of the fetch API which has some tricks up its
 * sleeve.
 *
 * - Automatically gets CSRF tokens for certain HTTP methods that need them
 * - Automatically tracks farmOS connection status
 *
 * @method IAssetLink#fetch
 * @param {String|URL} resource the URL of the resource you want to fetch
 * @param {Object} options an object containing any custom settings that you want to apply to the request
 * @see https://developer.mozilla.org/en-US/docs/Web/API/fetch
 */
IAssetLink.prototype.fetch = async function (resource, options) {};

/**
 * Gets the model for an entity type given that the type name. e.g. `"asset--plant"`
 *
 * @method IAssetLink#getEntityModel
 * @param {String} typeName A farmOS JSON:API type - e.g. "asset--plant"
 */
IAssetLink.prototype.getEntityModel = async function (typeName) {};

/**
 * Get an entity by type and UUID or Drupal internal id.
 *
 * ##### Usage
 *
 * ```js
 * const log = await assetLink.resolveEntity('log', 42);
 *
 * console.log(log.attributes.name);
 * ```
 *
 * @method IAssetLink#resolveEntity
 * @param {String} entityType the type of the entity
 * @param {String|Number} entityRef the ID/UUID of the entity
 * @param {Object[]} additionalFilters additional resolution criteria in Orbit.js filter format
 *   e.g. `[{ attribute: 'is_location', op: 'equal', value: true }]`
 * @param {String[]} limitedEntityBundles Limit the entity bundles that will be resolved from
 *   e.g. `['activity', 'observation']`
 */
IAssetLink.prototype.resolveEntity = async function (
  entityType,
  entityRef,
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
 * Get a list of the taxonomy_vocabulary entities.
 *
 * @method IAssetLink#getTaxonomyVocabularies
 */
IAssetLink.prototype.getTaxonomyVocabularies = async function () {};

/**
 * Central entity searching entry-point. Responsible for delegating to entity searching plugins.
 *
 * *Note: It would be unusual to call this directly. Most use-cases should use the [EntitySearch](module-EntitySearch.html)
 * or [EntitySearch](module-EntitySelect.html) components which internally handles calling `searchEntities` and presenting
 * the results.*
 *
 * @method IAssetLink#searchEntities
 * @param {Object} searchRequest An object with varying structure produced by
 *   a search method plugin - passed through to {@link IAssetLinkPlugin.searchEntities}
 *   implementations.
 * @param {String} searchPhase One of "local" or "remote" to request
 *   offline or online entity search results respectively.
 */
IAssetLink.prototype.searchEntities = function (searchRequest, searchPhase) {};

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

/**
 * The localForage API.
 * @external localForage
 * @see https://localforage.github.io/localForage/
 */
