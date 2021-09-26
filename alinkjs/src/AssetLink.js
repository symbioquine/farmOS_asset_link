import Vue from 'vue';

import { Coordinator, RequestStrategy, SyncStrategy } from '@orbit/coordinator';
import { Orbit } from '@orbit/core';
import { IndexedDBBucket } from '@orbit/indexeddb-bucket';
import { IndexedDBSource } from '@orbit/indexeddb';
import { RecordSchema } from '@orbit/records';
import { MemorySource } from '@orbit/memory';
import DrupalJSONAPISource from '@/DrupalJSONAPISource';
import DrupalSyncQueryOperators from '@/DrupalSyncQueryOperators';

import localforage from 'localforage';

import fetch from 'cross-fetch';

import AssetLinkUI from '@/AssetLinkUI';
import AssetLinkUtil from '@/AssetLinkUtil';
import createDrupalUrl from '@/createDrupalUrl';
import FarmOSConnectionStatusDetector from '@/FarmOSConnectionStatusDetector';
import PeekableAsyncIterator from '@/PeekableAsyncIterator';
import AssetLinkPluginListsCore from '@/AssetLinkPluginListsCore';
import AssetLinkPluginLoaderCore from '@/AssetLinkPluginLoaderCore';

import currentEpochSecond from '@/util/currentEpochSecond';

const fetchJson = (url, args) => fetch(url, args).then(response => response.json());



/**
 * Core of the larger Asset Link application and API entry-point for plugins.
 * 
 * TODO: Break out some of the responsibilities of this class into classes that can be
 * delegated to. e.g. plugin management, entities CRUD, etc.
 */
export default class AssetLink {

  constructor(app) {
    this._app = app;
    this._viewModel = new Vue({
      data: {
        booted: false,
        bootProgress: 0,
        bootText: "Starting",

        connectionStatus: new FarmOSConnectionStatusDetector(),

        pendingUpdates: [],

        messages: [],
      },
    });

    this._booted = new Promise((resolve) => {
      this._viewModel.$once('booted', () => {
        this._viewModel.booted = true;
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

    this._ui = new AssetLinkUI(app);
    this._util = new AssetLinkUtil();
  }

  /**
   * The top-level {Vue} app component.
   */
  get app() {
    return this._app;
  }

  /**
   * A {Vue} instance used to expose some of Asset Link's state to
   * its UI in a reactive way.
   */
  get viewModel() {
    return this._viewModel;
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
    this.viewModel.bootText = "Initializing storage";

    await this._store.ready();

    this._cores.pluginLists.eventBus.$on('add-plugin', async pluginUrl => {
      await this._cores.pluginLoader.loadPlugin(pluginUrl);
    });

    this._cores.pluginLists.eventBus.$on('remove-plugin', async pluginUrl => {
      await this._cores.pluginLoader.unloadPlugin(pluginUrl);
    });

    this._cores.pluginLoader.vm.$on('add-route', routeDef => {
      if (typeof this.app.addRoute === 'function') {
        this.app.addRoute(routeDef);
      }
    });

    this._cores.pluginLoader.vm.$on('remove-route', routeDef => {
      if (typeof this.app.removeRoute === 'function') {
        this.app.removeRoute(routeDef);
      }
    });

    await this._cores.pluginLoader.boot();
    await this._cores.pluginLists.boot();

    this.viewModel.bootText = "Loading models...";
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
        autoProcess: this.viewModel.connectionStatus.isOnline || false,
      },
    });

    const updateViewModelPendingUpdates = () => {
      this.viewModel.pendingUpdates = this._remote.requestQueue.entries.filter(r => r.type === 'update');
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
    if (this.viewModel.connectionStatus.isOnline) {
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

    this.viewModel.bootProgress = 100;

    this._memory.on('update', update => {
      console.log('_memory::update', update);

      if (update.operations.op === 'updateRecord' && update.operations.record.type.startsWith('asset--')) {
        this.viewModel.$emit('changed:asset', update.operations.record.type, update.operations.record.id);
      }

    });

    this.viewModel.connectionStatus.$watch('isOnline', async (isOnline) => {
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

    this.viewModel.$emit('booted');

    if (this.viewModel.connectionStatus.isOnline) {
      this._precache();
    }

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
    // Precache the current page's asset
    const matches = window.location.href.match(/https?:\/\/.*\/asset\/(\d+)/);
    if (matches && matches.length >= 2) {
      const thisAsset = await this.resolveAsset(matches[1]);
      console.log("thisAsset=", thisAsset);
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

  getRelevantActions(asset) {
    const actions = this.plugins.flatMap(plugin => Object.values(plugin.definedActions))
        .filter(a => a.predicateFn(asset))
        .map(a => ({
          id: a.id,
          componentFn: (wrapper, h) => a.componentFn(wrapper, h, asset),
        }));

    return actions;
  }

  getRelevantMetaActions(asset) {
    const actions = this.plugins.flatMap(plugin => Object.values(plugin.definedMetaActions))
        .filter(a => a.predicateFn(asset))
        .map(a => ({
          id: a.id,
          componentFn: (wrapper, h) => a.componentFn(wrapper, h, asset),
        }));

    return actions;
  }

  getRelevantConfigActions(route) {
    const actions = this.plugins.flatMap(plugin => Object.values(plugin.definedConfigActions))
        .filter(a => a.predicateFn(route))
        .map(a => ({
          id: a.id,
          componentFn: (wrapper, h) => a.componentFn(wrapper, h, route),
        }));

    return actions;
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
        const tokenResponse = await this.viewModel.connectionStatus.fetch(createDrupalUrl('/session/token'));

        console.log("tokenResponse:", tokenResponse);

        const token = await tokenResponse.text();

        // TODO: Cache the token
        if (!options.headers) options.headers = {};
        options.headers['X-CSRF-Token'] = token;
      }
  
      return await this.viewModel.connectionStatus.fetch(url, options);
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
    this.viewModel.bootText = "Loading server schema";
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

      this.viewModel.bootProgress = ((Object.keys(models).length / serverRelatedSchemas.length) * 100).toFixed(1);
    }));

    return models;
  }

}
