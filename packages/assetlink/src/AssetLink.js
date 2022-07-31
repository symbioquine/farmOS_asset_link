import { reactive, watch } from 'vue';

import { Coordinator, RequestStrategy, SyncStrategy } from '@orbit/coordinator';
import { Orbit } from '@orbit/core';
import { IndexedDBBucket } from '@orbit/indexeddb-bucket';
import { IndexedDBSource } from '@orbit/indexeddb';
import { RecordSchema } from '@orbit/records';
import { MemorySource } from '@orbit/memory';

import DrupalJSONAPISource from 'assetlink/DrupalJSONAPISource';
import DrupalSyncQueryOperators from 'assetlink/DrupalSyncQueryOperators';

import localforage from 'localforage';

import fetch from 'cross-fetch';
import { v4 as uuidv4 } from 'uuid';

import AssetLinkUI from 'assetlink/AssetLinkUI';
import AssetLinkUtil from 'assetlink/AssetLinkUtil';
import FarmOSConnectionStatusDetector from 'assetlink/FarmOSConnectionStatusDetector';
import PeekableAsyncIterator from 'assetlink/PeekableAsyncIterator';
import AssetLinkPluginListsCore from 'assetlink/AssetLinkPluginListsCore';
import AssetLinkPluginLoaderCore from 'assetlink/AssetLinkPluginLoaderCore';
import HttpAccessDeniedException from 'assetlink/HttpAccessDeniedException';

import createDrupalUrl from 'assetlink/utils/createDrupalUrl';
import currentEpochSecond from 'assetlink/utils/currentEpochSecond';
import EventBus from 'assetlink/utils/EventBus';

const fetchJson = (url, args) => fetch(url, args).then(response => response.json());



/**
 * Core of the larger Asset Link application and API entry-point for plugins.
 * 
 * TODO: Break out some of the responsibilities of this class into classes that can be
 * delegated to. e.g. plugin management, entities CRUD, etc.
 */
export default class AssetLink {

  constructor(rootComponent, devToolsApi) {
    this._rootComponent = rootComponent;
    this._devToolsApi = devToolsApi;
    this._vm = reactive({
      booted: false,
      bootProgress: 0,
      bootText: "Starting",
      bootFailed: false,

      pendingUpdates: [],

      messages: [],
    });

    this._connectionStatus = new FarmOSConnectionStatusDetector();

    this._eventBus = new EventBus();

    this._booted = new Promise((resolve) => {
      this._eventBus.$once('booted', () => {
        this._vm.booted = true;
        resolve(true);
      });
    });

    this._store = localforage.createInstance({
      name: 'asset-link',
      storeName: 'data',
    });

    this._cores = {};
    this._cores.pluginLists = new AssetLinkPluginListsCore(this);
    this._cores.pluginLoader = new AssetLinkPluginLoaderCore(this);

    this._memory = undefined;
    this._remote = undefined;

    this._ui = new AssetLinkUI();
    this._util = new AssetLinkUtil();
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
   * Utility methods exposed for Asset Link plugins.
   */
  get util() {
    return this._util;
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
    return this._memory;
  }

  /**
   * The Orbit.js {JSONAPISource} which is used to directly access/modify
   * farmOS assets/logs/etc - unless you know what you are doing, use {#entitySource}
   * instead.
   *
   * Will be {undefined} until Asset Link has booted.
   */
  get remoteEntitySource() {
    return this._remote;
  }

  /**
   * The currently loaded plugins.
   */
  get plugins() {
    return this._cores.pluginLoader.vm.plugins;
  }

  /**
   * A {Promise} that is fulfilled once Asset Link has booted.
   */
  get booted() {
    return this._booted;
  }

  /* eslint-disable no-console,no-unused-vars */
  async boot() {
    const bootingEventGroup = this._devToolsApi.startTimelineEventGroup({
      data: {},
      title: `booting`,
      groupId: `booting-${uuidv4()}`,
    });

    this._connectionStatus.start();

    this.vm.bootText = "Initializing storage";

    await this._store.ready();

    this._cores.pluginLists.eventBus.$on('add-plugin', async pluginUrl => {
      await this._cores.pluginLoader.loadPlugin(pluginUrl);
    });

    this._cores.pluginLists.eventBus.$on('remove-plugin', async pluginUrl => {
      await this._cores.pluginLoader.unloadPlugin(pluginUrl);
    });

    this._cores.pluginLoader.eventBus.$on('add-route', routeDef => {
      if (typeof this.rootComponent.exposed?.addRoute === 'function') {
        this.rootComponent.exposed.addRoute(routeDef);
      }
    });

    this._cores.pluginLoader.eventBus.$on('remove-route', routeDef => {
      if (typeof this.rootComponent.exposed?.removeRoute === 'function') {
        this.rootComponent.exposed.removeRoute(routeDef);
      }
    });

    window.addEventListener('asset-link-plugin-changed', async e => {
      await this._cores.pluginLoader.reloadPlugin(new URL(e.detail.pluginUrl));
    });

    await this._cores.pluginLoader.boot();
    try {
      await this._cores.pluginLists.boot();
    } catch (e) {
      if (e.cause instanceof HttpAccessDeniedException) {
        // TODO: Help the user get logged in
      }
      this.vm.bootText = e.message;
      this.vm.bootFailed = true;
      return;
    }

    this.vm.bootText = "Loading models...";
    this._models = await this._loadModels();

    Orbit.fetch = this._csrfAwareFetch.bind(this);

    this._schema = new RecordSchema({ models: this._models });

    const bucket = new IndexedDBBucket({ namespace: 'asset-link-orbitjs-bucket' });

    this._memory = new MemorySource({
      schema: this._schema,
      cacheSettings: {
        queryOperators: DrupalSyncQueryOperators,
      },
    });

    this._remote = new DrupalJSONAPISource({
      schema: this._schema,
      name: 'remote',
      host: createDrupalUrl('/api'),
      defaultFetchSettings: {
        timeout: 10000,
      },
      bucket,
      requestQueueSettings: {
        autoProcess: this.connectionStatus.isOnline || false,
      },
    });

    const updateViewModelPendingUpdates = () => {
      this.vm.pendingUpdates = this._remote.requestQueue.entries.filter(r => r.type === 'update');
    };

    this._remote.requestQueue.reified.then(updateViewModelPendingUpdates);
    this._remote.requestQueue.on('change', updateViewModelPendingUpdates);

    this._backup = new IndexedDBSource({
      schema: this._schema,
      name: 'backup',
      namespace: 'asset-link-orbitjs-entities',
      defaultTransformOptions: {
        useBuffer: true,
      },
    });

    this._coordinator = new Coordinator({
      sources: [this._memory, this._remote, this._backup]
    });

    // Query the remote server when the memory source is queried (and online)
    this._remoteQueryStrategy = new RequestStrategy({
      name: 'remoteRequestStrategy',

      source: 'memory',
      on: 'beforeQuery',

      target: 'remote',
      action: 'query',

      blocking: true
    });
    // Only use the remote query strategy when online
    if (this.connectionStatus.isOnline) {
      this._coordinator.addStrategy(this._remoteQueryStrategy);
    }

    // Update the remote server whenever the memory source is updated
    this._coordinator.addStrategy(
      new RequestStrategy({
        source: 'memory',
        on: 'beforeUpdate',

        target: 'remote',
        action: 'update',

        blocking: false
      })
    );

    // Sync all changes received from the remote server to the memory source
    this._coordinator.addStrategy(
      new SyncStrategy({
        source: 'remote',
        target: 'memory',
        blocking: false
      })
    );

    // Sync all changes to the backup source
    this._coordinator.addStrategy(
      new SyncStrategy({
        source: 'memory',
        target: 'backup',
        blocking: true
      })
    );

    // Restore the backup source
    const allRecordsFromBackup = await this._backup.query((q) => q.findRecords());
    await this._memory.sync((t) => allRecordsFromBackup.map((r) => t.addRecord(r)));

    await this._coordinator.activate();

    this.vm.bootProgress = 100;

    this._memory.on('update', update => {
      console.log('_memory::update', update);

      if (update.operations.op === 'updateRecord' && update.operations.record.type.startsWith('asset--')) {
        this.eventBus.$emit('changed:asset', { assetType: update.operations.record.type, assetId: update.operations.record.id});
      }

    });

    watch(() => this.connectionStatus.isOnline, async (isOnline) => {
      this._remote.requestQueue.autoProcess = isOnline;
      if (isOnline && !this._remote.requestQueue.empty) {
        this._remote.requestQueue.process();
      }

      await this._coordinator.deactivate();
      if (isOnline) {
        if (!this._coordinator.strategies.includes(this._remoteQueryStrategy)) {
          this._coordinator.addStrategy(this._remoteQueryStrategy);
        }
      } else {
        if (this._coordinator.strategies.includes(this._remoteQueryStrategy)) {
          this._coordinator.removeStrategy(this._remoteQueryStrategy.name);
        }
      }
      await this._coordinator.activate();
    });

    this.eventBus.$emit('booted');

    if (this.connectionStatus.isOnline) {
      this._precache();
    }

    bootingEventGroup.end();

    return true;
  }

  /**
   * Gets the model for an entity type given that the type name. e.g. "asset--plant"
   */
  async getEntityModel(typeName) {
    await this._booted;

    return this._models[typeName];
  }

  async _precache() {
    const precachingEventGroup = this._devToolsApi.startTimelineEventGroup({
      data: {},
      title: `precaching`,
      groupId: `precaching-${uuidv4()}`,
    });

    try {

      // Precache the current page's asset
      const matches = window.location.href.match(/https?:\/\/.*\/asset\/(\d+)/);
      if (matches && matches.length >= 2) {
        await this.resolveAsset(matches[1]);
      }

      const timestamp = currentEpochSecond();

      const lastPrecacheTimeKey = `asset-link-last-precache-time`;

      const lastPrecacheTime = await this._store.getItem(lastPrecacheTimeKey);

      if (lastPrecacheTime && (timestamp - lastPrecacheTime) < 900) {
        console.log("Skipping Asset Link precaching because it was done recently...");
        return;
      }

      // Precache recently changed assets
      const assetTypes = (await this.getAssetTypes()).map(t => t.attributes.drupal_internal__id);

      await this._memory.query((q) => assetTypes.map(assetType => q.findRecords(`asset--${assetType}`)
          .sort('-changed')
          .page({ offset: 0, limit: 100 })));

      // TODO: Consider also precaching recently changed and recent/upcoming logs

      await this._store.setItem(lastPrecacheTimeKey, timestamp);

    } finally {
      precachingEventGroup.end();
    }
  }

  /**
   * Get a list of the asset_type entities.
   */
  async getAssetTypes() {
    const listAssetTypes = async (source) => {
      return await source.query((q) => q
          .findRecords(`asset_type--asset_type`)
          .sort('drupal_internal__id'));
    };

    const assetTypes = await listAssetTypes(this._memory.cache);

    if (assetTypes.length) {
      return assetTypes;
    }

    return await listAssetTypes(this._memory);
  }

  /**
   * Get an asset by UUID or Drupal internal id.
   */
  async resolveAsset(assetRef) {
    await this._booted;

    const assetTypes = (await this.getAssetTypes()).map(t => t.attributes.drupal_internal__id);

    const isRefNumeric = /^-?\d+$/.test(assetRef);

    let filter = { attribute: 'id', value: assetRef };
    if (isRefNumeric) {
      filter = { attribute: 'drupal_internal__id', value: parseInt(assetRef) };
    }

    const findAsset = async (source) => {
      const results = await source.query(q => assetTypes.map(assetType => q
          .findRecords(`asset--${assetType}`)
          .filter(filter)
          .sort('drupal_internal__id')));

      const assets = results.flatMap(l => l);

      return assets.find(a => a);
    };

    const asset = await findAsset(this._memory.cache);

    if (asset) {
      return asset;
    }

    return await findAsset(this._memory);
  }

  /**
   * Central asset searching entry-point. Responsible for delegating to asset searching plugins.
   */
  searchAssets(searchRequest, searchPhase) {
    console.log("searchAssets:", JSON.stringify(searchRequest), searchPhase);

    const assetSearchPlugins = this.plugins.filter(p => typeof p.searchAssets === 'function');

    const searchResultCursors = [];

    for (let i = 0; i < assetSearchPlugins.length; i += 1) {
      const plugin = assetSearchPlugins[i];

      /* eslint-disable no-await-in-loop */
      const searchResultCursor = plugin.searchAssets(this, searchRequest, searchPhase);

      if (searchResultCursor !== undefined) {
        searchResultCursors.push(searchResultCursor);
      }
    }

    async function* coiterateSearchCursors() {
      console.log("coiterateSearchCursors: searchResultCursors =", searchResultCursors);

      const peekableSearchResultCursors = searchResultCursors.map(c => new PeekableAsyncIterator(c));

      while(peekableSearchResultCursors.length > 0) {

        console.log("coiterateSearchCursors: peekableSearchResultCursors.length =", peekableSearchResultCursors.length, peekableSearchResultCursors);

        let bestNextCursor = undefined;
        let doneBestNextCursorIndex = undefined;
        for (let i = 0; i < peekableSearchResultCursors.length; i += 1) {
          const thisCursor = peekableSearchResultCursors[i];

          const thisCursorNextResult = await thisCursor.peek();

          if (thisCursorNextResult.value === undefined) {
            continue;
          }

          if (bestNextCursor === undefined || thisCursorNextResult.value.weight < (await bestNextCursor.peek()).value.weight) {
            bestNextCursor = thisCursor;
            doneBestNextCursorIndex = thisCursorNextResult.done ? i : undefined;
          }
        }

        if (bestNextCursor === undefined) {
          return;
        }

        const bestCursorNextResult = await bestNextCursor.next();

        if (bestCursorNextResult.value) {
          yield bestCursorNextResult.value;
        }

        if (doneBestNextCursorIndex !== undefined) {
          peekableSearchResultCursors.splice(doneBestNextCursorIndex, 1);
        }

      }
    }

    return coiterateSearchCursors();
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
          contexts = a.contextMultiplexerFn(context);
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
        const tokenResponse = await this.connectionStatus.fetch(createDrupalUrl('/session/token'));

        console.log("tokenResponse:", tokenResponse);

        const token = await tokenResponse.text();

        // TODO: Cache the token
        if (!options.headers) options.headers = {};
        options.headers['X-CSRF-Token'] = token;
      }
  
      return await this.connectionStatus.fetch(url, options);
    } catch (error) {
      console.log("Error in _csrfAwareFetch", typeof error, error);
      if (error.message === 'Network request failed') {
        return new Response(null, {
          status: 503,
          statusText: 'Service unavailable due to network error',
        });
      }
      throw error;
    }
  }

  async _loadModels() {
    const cacheKey = `asset-link-cached-entity-models`;

    const cacheItem = await this._store.getItem(cacheKey);

    if (cacheItem) {
      // TODO: If cache item is stale, schedule background refresh
      return cacheItem.value;
    }

    const models = await this._loadModelsFromServer();

    const timestamp = currentEpochSecond();

    await this._store.setItem(cacheKey, {key: cacheKey, timestamp, value: models});

    return models;
  }

  async _loadModelsFromServer() {
    this.vm.bootText = "Loading server schema";
    const serverSchema = await fetchJson(createDrupalUrl('/api/schema'));

    const serverRelatedSchemas = serverSchema.allOf.flatMap(schemaRef => schemaRef.links || []);

    const models = {};

    await Promise.all(serverRelatedSchemas.map(async (serverRelatedSchema) => {
      const relatedSchema = await fetchJson(serverRelatedSchema.targetSchema);

      const relatedItemSchema = await fetchJson(relatedSchema.definitions.data.items.$ref);

      const typeName = relatedItemSchema.definitions.type['const'];

      models[typeName] = {
        attributes: Object.fromEntries(
            Object.entries(relatedItemSchema.definitions.attributes.properties)
              .map(([attrName, attr]) => {
                // Orbit.js seems to only support 'number', not 'integer' but handles the former well enough
                if (attr.type === 'integer') {
                  attr.type = 'number';
                }

                // https://www.drupal.org/project/jsonapi_schema/issues/3058850
                if (attrName === 'third_party_settings') {
                  attr.type = 'object';
                }

                return [attrName, attr];
              })
        ),
        relationships: relatedItemSchema.definitions?.relationships?.properties || {},
      };

      this.vm.bootProgress = ((Object.keys(models).length / serverRelatedSchemas.length) * 100).toFixed(1);
    }));

    return models;
  }

}
