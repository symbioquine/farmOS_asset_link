import { reactive } from 'vue';

import localforage from 'localforage';

import AssetLinkUI from '@/AssetLinkUI';
import FarmOSConnectionStatusDetector from '@/FarmOSConnectionStatusDetector';
import SubrequestsGroupingRequestFetcher from '@/SubrequestsGroupingRequestFetcher';
import AssetLinkFarmDataCore from '@/AssetLinkFarmDataCore';
import AssetLinkPluginListsCore from '@/AssetLinkPluginListsCore';
import AssetLinkPluginLoaderCore from '@/AssetLinkPluginLoaderCore';
import AssetLinkLocalPluginStorageCore from '@/AssetLinkLocalPluginStorageCore';
import HttpAccessDeniedException from '@/HttpAccessDeniedException';

import { createDrupalUrl, EventBus, uuidv4 } from "assetlink-plugin-api";
import OnlineStructuralDataPreloader from './OnlineStructuralDataPreloader';


/**
 * Core of the larger Asset Link application and API entry-point for plugins.
 * 
 * TODO: Break out some of the responsibilities of this class into classes that can be
 * delegated to. e.g. plugin management, entities CRUD, etc.
 */
export default class AssetLink {

  constructor(rootComponent, devToolsApi, options) {
    this._rootComponent = rootComponent;
    this._devToolsApi = devToolsApi;

    const opts = options || {};

    this._vm = reactive({
      booted: false,
      bootProgress: 0,
      bootText: "Starting",
      bootFailed: false,

      pendingQueries: [],
      pendingUpdates: [],
      failedUpdates: [],

      messages: [],
    });

    this._liteMode = opts.liteMode || false;

    const connectionStatusOptions = { liteMode: this._liteMode };
    if (opts.fetch) {
      connectionStatusOptions.fetcherDelegate = { fetch: opts.fetch };
    }

    this._connectionStatus = new FarmOSConnectionStatusDetector(connectionStatusOptions);

    this._fetcherDelegate = opts.disableSubrequestGrouping ? this._connectionStatus : new SubrequestsGroupingRequestFetcher(this._connectionStatus);

    this._structuralDataPreloader = opts.structuralDataPreloader || new OnlineStructuralDataPreloader();

    this._eventBus = new EventBus();

    this._booted = new Promise((resolve) => {
      this._eventBus.$once('booted', () => {
        this._vm.booted = true;
        resolve(true);
      });
    });

    this._store = opts.store || localforage.createInstance({
      name: 'asset-link',
      storeName: 'data',
    });

    this._cores = {};
    this._cores.farmData = new AssetLinkFarmDataCore(this);
    this._cores.pluginLists = new AssetLinkPluginListsCore(this);
    this._cores.pluginLoader = new AssetLinkPluginLoaderCore(this);
    this._cores.localPluginStorage = new AssetLinkLocalPluginStorageCore(this);

    this._ui = new AssetLinkUI();
  }

  /**
   * The top-level {Vue} app component.
   */
  get rootComponent() {
    return this._rootComponent;
  }

  /**
   * A {Vue} instance used to expose some of Asset Link's state to
   * its UI in a reactive way.
   */
  get vm() {
    return this._vm;
  }

  /**
   * Get the connection status detector instance.
   */
  get connectionStatus() {
    return this._connectionStatus;
  }

  /**
   * An async event bus used to signal when booting is completed.
   */
  get eventBus() {
    return this._eventBus;
  }

  /**
   * UI components/methods exposed for Asset Link plugins.
   */
  get ui() {
    return this._ui;
  }

  /**
   * The map of AssetLink cores.
   */
  get cores() {
    return this._cores;
  }

  /**
   * The Orbit.js {MemorySource} which is used to access/modify farmOS assets/logs/etc.
   *
   * Will be {undefined} until Asset Link has booted.
   */
  get entitySource() {
    return this.cores.farmData.entitySource;
  }

  /**
   * The Orbit.js {JSONAPISource} which is used to directly access/modify
   * farmOS assets/logs/etc - unless you know what you are doing, use {#entitySource}
   * instead.
   *
   * Will be {undefined} until Asset Link has booted.
   */
  get remoteEntitySource() {
    return this.cores.farmData.remoteEntitySource;
  }

  /**
   * The Orbit.js {TaskQueue} which is used to hold failed updates once they have exceeded
   * their max retries.
   *
   * Will be {undefined} until Asset Link has booted.
   */
  get updateDlq() {
    return this.cores.farmData.updateDlq;
  }

  /**
   * The currently loaded plugins.
   */
  get plugins() {
    return this.cores.pluginLoader.vm.plugins;
  }

  /**
   * A {Promise} that is fulfilled once Asset Link has booted.
   */
  get booted() {
    return this._booted;
  }

  /**
   * A decorated version of the fetch API which has some tricks up its
   * sleeve.
   * 
   * - Automatically gets CSRF tokens for certain HTTP methods that need them
   * - Automatically tracks farmOS connection status
   * - Automatically uses subrequests to reduce the number of HTTP requests when practical
   */
  get fetch() {
    return this._csrfAwareFetch.bind(this);
  }

  /**
   * A localForage instance that is used to store and retrieve data from
   * IndexedDB.
   */
  get store() {
    return this._store;
  }

  /**
   * A semi-private mechanism to interact with the browser dev tools.
   */
  get devToolsApi() {
    return this._devToolsApi;
  }

  /* eslint-disable no-console,no-unused-vars */
  async boot() {
    const bootingEventGroup = this.devToolsApi.startTimelineEventGroup({
      data: {},
      title: `booting`,
      groupId: `booting-${uuidv4()}`,
    });

    this.connectionStatus.start();

    // Avoid the race condition where stuff tries to load before
    // we have up-to-date connection status information which
    // can lead to data being missing and unable to load under
    // the assumption that Asset Link is offline.
    await this.connectionStatus.mainLoopHasRunAtLeastOnce;

    this.vm.bootText = "Initializing storage";

    await this._store.ready();

    this.cores.pluginLists.eventBus.$on('add-plugin', async pluginUrl => {
      await this.cores.pluginLoader.loadPlugin(pluginUrl);
    });

    this.cores.pluginLists.eventBus.$on('remove-plugin', async pluginUrl => {
      await this.cores.pluginLoader.unloadPlugin(pluginUrl);
    });

    this.cores.localPluginStorage.eventBus.$on('update-plugin', async pluginUrl => {
      await this.cores.pluginLists.addPluginToLocalList(pluginUrl, { updated: true });
    });

    this.cores.pluginLists.eventBus.$on('update-plugin', async pluginUrl => {
      await this.cores.pluginLoader.reloadPlugin(pluginUrl);
    });

    this.cores.pluginLoader.eventBus.$on('add-route', routeDef => {
      if (typeof this.rootComponent.exposed?.addRoute === 'function') {
        this.rootComponent.exposed.addRoute(routeDef);
      }
    });

    this.cores.pluginLoader.eventBus.$on('remove-route', routeDef => {
      if (typeof this.rootComponent.exposed?.removeRoute === 'function') {
        this.rootComponent.exposed.removeRoute(routeDef);
      }
    });

    await this.cores.farmData.boot();

    this._structuralDataPreloader.load(this);

    await this.cores.localPluginStorage.boot();
    await this.cores.pluginLoader.boot();
    try {
      await this.cores.pluginLists.boot();
    } catch (e) {
      if (e.cause instanceof HttpAccessDeniedException) {
        // TODO: Help the user get logged in
      }
      this.vm.bootText = e.message;
      this.vm.bootFailed = true;
      return;
    }

    this.vm.bootProgress = 100;

    this.eventBus.$emit('booted');

    bootingEventGroup.end();

    return true;
  }

  async halt() {
    this._connectionStatus.stop();
    await this.cores.farmData.halt();
    await this.cores.localPluginStorage.halt();
    await this.cores.pluginLoader.halt();
    await this.cores.pluginLists.halt();
  }

  /**
   * Clear all local data/caches/etc. Asset Link will become non-functional after this until the page is reloaded.
   */
  async permanentlyDeleteLocalData() {
    await this.halt();
    await this._store.dropInstance();
    await this.cores.farmData.permanentlyDeleteLocalData();
  }

  /**
   * Gets the model for an entity type given that the type name. e.g. "asset--plant"
   */
  async getEntityModel(typeName) {
    return await this.cores.farmData.getEntityModel(typeName);
  }

  /**
   * Synchronously gets the model for an entity type given that the type name. e.g. "asset--plant".
   * 
   * Will only return results if Asset Link is already booted.
   */
  getEntityModelSync(typeName) {
    return this.cores.farmData.getEntityModelSync(typeName);
  }

  /**
   * Get a list of the asset_type entities.
   */
  async getAssetTypes() {
    return await this.cores.farmData.getAssetTypes();
  }

  /**
   * Get a list of the log_type entities.
   */
  async getLogTypes() {
    return await this.cores.farmData.getLogTypes();
  }

  /**
   * Get a list of the taxonomy_vocabulary entities.
   */
  async getTaxonomyVocabularies() {
    return await this.cores.farmData.getTaxonomyVocabularies();
  }

    /**
   * Get a taxonomy term by type and name.
   */
  async getTaxonomyTermByName(termType, termName) {
    return await this.cores.farmData.getTaxonomyTermByName(termType, termName);
  }

  /**
   * Get or create a taxonomy term by type and name.
   */
  async getOrCreateTaxonomyTermByName(termType, termName, options) {
    return await this.cores.farmData.getOrCreateTaxonomyTermByName(termType, termName, options);
  }

  /**
   * Get an entity by UUID or Drupal internal (t|v)?id.
   */
  async resolveEntity(entityType, entityRef, additionalFilters, limitedEntityBundles) {
    return await this.cores.farmData.resolveEntity(entityType, entityRef, additionalFilters, limitedEntityBundles);
  }

  /**
   * Central asset searching entry-point. Responsible for delegating to entity searching plugins.
   */
  searchEntities(searchRequest, searchPhase) {
    return this.cores.farmData.searchEntities(searchRequest, searchPhase);
  }

  getSlots(context) {
    return this.getPluginDefinedComponents('definedSlots', context);
  }

  getWidgetDecorators(context) {
    return this.getPluginDefinedComponents('definedWidgetDecorators', context);
  }

  getPluginDefinedComponents(componentDefKey, context) {
    const sortingFn = (a1, a2) => {
      if (a1.weight < a2.weight) {
        return -1;
      }
      if (a1.weight > a2.weight) {
        return 1;
      }
      if (a1.id < a2.id) {
        return -1;
      }
      if (a1.id > a2.id) {
        return 1;
      }
      return 0;
    };

    const componentDefs = plugin => Object.values(plugin[componentDefKey] || {})
      .flatMap(cDefsById => Object.values(cDefsById));

    return this.plugins.flatMap(plugin => componentDefs(plugin))
      .filter(a => a.predicateFn(context))
      .flatMap(a => {

        let contexts = [context];
        if (typeof a.contextMultiplexerFn === 'function') {
          contexts = a.contextMultiplexerFn(context) || [];
        }

        return contexts.map((c, idx) => ({
            id: contexts.length === 1 ? a.name : (a.name + '.' + idx),
            weight: a.weightFn(c),
            component: a.component,
            props: c,
        }));

      })
      .sort(sortingFn);
  }

  async _csrfAwareFetch(url, opts) {
    const options = opts || {};

    if (!options.method) options.method = 'GET';

    const requestUrl = new URL(url, window.location.origin + window.assetLinkDrupalBasePath);

    const isFarmOSRequest = requestUrl.host === window.location.host && requestUrl.pathname.startsWith(window.assetLinkDrupalBasePath);
    const isUnsafeMethod = !['HEAD', 'GET', 'OPTIONS', 'TRACE'].includes(options.method.toUpperCase());

    const addCsrfHeader = isFarmOSRequest && isUnsafeMethod;

    try {
      if (addCsrfHeader) {
        const tokenResponse = await this._fetcherDelegate.fetch(createDrupalUrl('/session/token'));

        const token = await tokenResponse.text();

        // TODO: Cache the token
        if (!options.headers) options.headers = {};
        options.headers['X-CSRF-Token'] = token;
      }

      return await this._fetcherDelegate.fetch(url, options);
    } catch (error) {
      if (error.message === 'Network request failed') {
        return new Response(null, {
          status: 503,
          statusText: 'Service unavailable due to network error',
        });
      }
      throw error;
    }
  }

}
