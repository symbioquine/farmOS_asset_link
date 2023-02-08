import { watchEffect } from 'vue';

import { Coordinator, RequestStrategy, SyncStrategy } from '@orbit/coordinator';
import { Orbit, TaskQueue } from '@orbit/core';
import { IndexedDBBucket } from '@orbit/indexeddb-bucket';
import { IndexedDBSource } from '@orbit/indexeddb';
import { RecordSchema } from '@orbit/records';
import { MemorySource } from '@orbit/memory';

import Barrier from '@/Barrier';
import BarrierAwareOrbitSourceDecorator from '@/BarrierAwareOrbitSourceDecorator';

import FarmDataModelOrbitMemorySourceDecorator from '@/FarmDataModelOrbitMemorySourceDecorator';

import HttpEntityModelLoader from '@/HttpEntityModelLoader';

import PeekableAsyncIterator from '@/PeekableAsyncIterator';

import DrupalJSONAPISource from '@/DrupalJSONAPISource';
import DrupalSyncQueryOperators from '@/DrupalSyncQueryOperators';

import { createDrupalUrl } from "assetlink-plugin-api";

/**
 * Initializes/exposes Orbit.js to enable access to data in farmOS.
 */
export default class AssetLinkFarmDataCore {

  constructor(assetLink) {
    this._store = assetLink.store;
    this._fetch = assetLink.fetch;
    this._eventBus = assetLink.eventBus;
    this._connectionStatus = assetLink.connectionStatus;
    this._vm = assetLink.vm;
    this._booted = assetLink.booted;

    this._getPlugins = () => assetLink.plugins;

    this._entityModelLoader = new HttpEntityModelLoader({
      fetch: assetLink.fetch,
      store: assetLink.store,
      reportProgressFn: (bootText, bootProgress) => {
        assetLink.vm.bootText = bootText;
        assetLink.vm.bootProgress = bootProgress;
      },
    });

    this._memory = undefined;
    this._remote = undefined;

    this._updateDlq = undefined;

    this._entitySource = undefined;
    this._remoteEntitySource = undefined;
  }

  /**
   * The Orbit.js {MemorySource} which is used to access/modify farmOS assets/logs/etc.
   *
   * Will be {undefined} until Asset Link has booted.
   */
  get entitySource() {
    return this._entitySource;
  }

  /**
   * The Orbit.js {JSONAPISource} which is used to directly access/modify
   * farmOS assets/logs/etc - unless you know what you are doing, use {#entitySource}
   * instead.
   *
   * Will be {undefined} until Asset Link has booted.
   */
  get remoteEntitySource() {
    return this._remoteEntitySource;
  }

  /**
   * The Orbit.js {TaskQueue} which is used to hold failed updates once they have exceeded
   * their max retries.
   *
   * Will be {undefined} until Asset Link has booted.
   */
  get updateDlq() {
    return this._updateDlq;
  }

  /**
  * Stops this core.
  */
  async halt() {
    await this._coordinator.deactivate();
  }

  /**
  * Clear all local data/caches/etc. Asset Link will become non-functional after this until the page is reloaded.
  */
  async permanentlyDeleteLocalData() {
    await this._coordinator.deactivate();
    await this._backup.cache.deleteDB();
    await this._bucket.deleteDB();
  }


  /**
   * Gets the model for an entity type given that the type name. e.g. "asset--plant"
   */
  async getEntityModel(typeName) {
    await this._booted;

    return this._models[typeName];
  }

  /**
   * Synchronously gets the model for an entity type given that the type name. e.g. "asset--plant".
   * 
   * Will only return results if Asset Link is already booted.
   */
  getEntityModelSync(typeName) {
    return this._models[typeName];
  }

  /**
   * Get a list of the asset_type entities.
   */
  async getAssetTypes() {
    await this._booted;

    return await this.entitySource.query((q) => q
        .findRecords(`asset_type--asset_type`)
        .sort('drupal_internal__id'));
  }

  /**
   * Get a list of the log_type entities.
   */
  async getLogTypes() {
    await this._booted;

    return await this.entitySource.query((q) => q
        .findRecords(`log_type--log_type`)
        .sort('drupal_internal__id'));
  }

  /**
   * Get a list of the taxonomy_vocabulary entities.
   */
  async getTaxonomyVocabularies() {
    await this._booted;

    await this.entitySource.query((q) => q
          .findRecords(`taxonomy_vocabulary--taxonomy_vocabulary`)
          .sort('drupal_internal__vid'));
  }

  /**
   * Get an entity by UUID or Drupal internal (t|v)?id.
   */
  async resolveEntity(entityType, entityRef, additionalFilters, limitedEntityBundles) {
    await this._booted;

    let entityBundles = limitedEntityBundles;

    if (!entityBundles && entityType === 'asset') {
      entityBundles = (await this.getAssetTypes()).map(t => t.attributes.drupal_internal__id);
    }

    if (!entityBundles && entityType === 'log') {
      entityBundles = (await this.getLogTypes()).map(t => t.attributes.drupal_internal__id);
    }

    if (!entityBundles && entityType === 'taxonomy_term') {
      entityBundles = (await this.getTaxonomyVocabularies()).map(t => t.attributes.drupal_internal__vid);
    }

    if (!entityBundles || !entityBundles.length) {
      console.log(`No entity bundles for '${entityType}'. Returning...`);
      return;
    }

    const isRefNumeric = /^-?\d+$/.test(entityRef);

    const results = await this.entitySource.query(q => entityBundles.flatMap(entityBundle => {
      const typeName = `${entityType}--${entityBundle}`;

      const model = this.getEntityModelSync(typeName);

      const numericIdKey = Object.keys(model.attributes).find(k => /^drupal_internal__.?id$/.test(k));

      if (!numericIdKey && isRefNumeric) {
        return [];
      }

      let idFilter = { attribute: 'id', value: entityRef };
      if (isRefNumeric) {
        idFilter = { attribute: numericIdKey, value: parseInt(entityRef) };
      }

      let baseQuery = q
        .findRecords(typeName)
        .filter(idFilter);

      const include = Object.keys(model.relationships);

      return (additionalFilters || [])
        .reduce((query, f) => query.filter(f), baseQuery)
        .sort(numericIdKey || 'id')
        .options({ include });
    }));

    const entities = results.flatMap(l => l);

    return entities.find(e => e);
  }

  /**
   * Central asset searching entry-point. Responsible for delegating to entity searching plugins.
   */
  searchEntities(searchRequest, searchPhase) {
    const entitySearchPlugins = this._getPlugins().filter(p => typeof p.searchEntities === 'function');

    const searchResultCursors = entitySearchPlugins.flatMap(plugin => {
        const searchResultCursor = plugin.searchEntities(this, searchRequest, searchPhase);

        if (searchResultCursor !== undefined) {
          return [searchResultCursor];
        }

        return [];
    });

    async function* coiterateSearchCursors() {
      const peekableSearchResultCursors = searchResultCursors.map(c => new PeekableAsyncIterator(c));

      while(peekableSearchResultCursors.length > 0) {

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

  async boot() {
    this._vm.bootText = "Loading models...";
    this._models = await this._entityModelLoader.loadModels();

    const orbitCoordinatorActivationBarrier = new Barrier(true);

    Orbit.fetch = this._fetch;

    this._schema = new RecordSchema({ models: this._models });

    this._bucket = new IndexedDBBucket({ namespace: 'asset-link-orbitjs-bucket' });

    const updateDlq = new TaskQueue(null, {
      name: 'dlq-update-requests',
      bucket: this._bucket,
      autoActivate: false,
    });
    this._updateDlq = updateDlq;

    this._memory = new MemorySource({
      schema: this._schema,
      cacheSettings: {
        queryOperators: DrupalSyncQueryOperators,
      },
    });

    this._entitySource = new FarmDataModelOrbitMemorySourceDecorator(
      new BarrierAwareOrbitSourceDecorator(this._memory, orbitCoordinatorActivationBarrier, { schema: this._schema }),
      {
        schema: this._schema,
        logTypesGetter: async () => this.getLogTypes(),
      }
    );

    this._remote = new DrupalJSONAPISource({
      schema: this._schema,
      name: 'remote',
      host: createDrupalUrl('/api'),
      defaultFetchSettings: {
        timeout: 5000,
      },
      bucket: this._bucket,
      requestQueueSettings: {
        autoProcess: this._connectionStatus.isOnline.value || false,
      },
    });

    this._remoteEntitySource = new BarrierAwareOrbitSourceDecorator(this._remote, orbitCoordinatorActivationBarrier, { schema: this._schema });

    const onQueueChanged = (queue, fn) => {
      queue.reified.then(fn);
      queue.on('change', fn);
    };

    onQueueChanged(this._memory.requestQueue, () => {
      this._vm.pendingQueries = this._memory.requestQueue.entries.filter(r => r.type === 'query');
    });

    onQueueChanged(this._remote.requestQueue, () => {
      this._vm.pendingUpdates = this._remote.requestQueue.entries.filter(r => r.type === 'update');
    });

    onQueueChanged(this._updateDlq, () => {
      this._vm.failedUpdates = this._updateDlq.entries;
    });

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
    this._coordinator.addStrategy(new RequestStrategy({
      name: 'remoteRequestStrategy',

      source: 'memory',
      on: 'beforeQuery',

      target: 'remote',
      action: 'query',

      blocking: true,

      filter: (query) => {
        if (!this._connectionStatus.isOnline.value) {
          return false;
        }

        if (query.options?.forceRemote) {
          return true;
        }

        // TODO: Figure out whether we need to do this filtering on a expression-by-expression basis,
        // rather than for the query as a whole.
        let multiQuery = true;
        let expressions = query?.expressions || [];
        if (!Array.isArray(expressions)) {
          multiQuery = false;
          expressions = [expressions];
        }

        const dataInCache = this._memory.cache.query(query);

        const flattenResults = (r, e) => {
          if (r === undefined) {
            return [];
          }
          if (e.op === 'findRecord' || e.op === 'findRelatedRecord') {
            return [r];
          }
          return r;
        }

        const zip = (...rows) => [...rows[0]].map((_,c) => rows.map(row => row[c]))

        let cacheResultEntities = [];
        if (multiQuery) {
          cacheResultEntities = zip(dataInCache, expressions).flatMap(([r, e]) => flattenResults(r, e));
        } else {
          cacheResultEntities = flattenResults(dataInCache, expressions[0]);
        }

        if (cacheResultEntities.length) {
          return false;
        }

        return true;
      },

      // Discard failed queries
      catch (e, query) {
        // console.log('Error performing remote.query()', query, e);
        this.source.requestQueue.skip(e);
        this.target.requestQueue.skip(e);
        throw e;
      },
    }));

    // Update the remote server whenever the memory source is updated
    this._coordinator.addStrategy(
      new RequestStrategy({
        source: 'memory',
        on: 'beforeUpdate',

        target: 'remote',
        action: 'update',

        blocking: () => this._connectionStatus.isOnline.value,

        passHints: true,

        filter(query) {
          return !query.options?.localOnly;
        },
      })
    );

    // Retry and DLQ for remote source
    this._coordinator.addStrategy(
      new RequestStrategy({
        source: 'remote',
        on: 'updateFail',

        blocking: true,

        action(transform, e) {
          const remote = this.source;
          const store = this.coordinator.getSource('memory');

          const storableError = {
            message: e.message,
          };

          if (e.response?.status === 422 && e.data?.errors?.length > 0) {
            storableError.message = e.data.errors.map(error => `${error.title}: ${error.detail}`).join("|");
          }

          transform.options.failedRetryErrors = transform.options.failedRetryErrors || [];
          transform.options.failedRetryErrors.push(storableError);

          if (transform.options.failedRetryErrors.length >= 3) {
            updateDlq.push({
              type: 'update',
              data: transform,
            });

            // Roll back store to position before transform
            if (store.transformLog.contains(transform.id)) {
              console.log('Rolling back - transform:', transform.id); // eslint-disable-line
              store.rollback(transform.id, -1);
            }

            store.requestQueue.skip(e);
            remote.requestQueue.skip(e);
            return;
          }

          // TODO: Consider some sort of exponential back-off and maybe not blocking other requests in the interim
          setTimeout(async () => {
            const passedBarrier = await orbitCoordinatorActivationBarrier.arrive(500);
            if (!passedBarrier) {
              throw new Error("Could not retry update - barrier was closed for >500ms");
            }
            try {
              await remote.activated;
            } catch(err) {
              // This should mean our Orbit.js coordinator is deactivated and Asset Link was halted 
              return;
            }
            remote.requestQueue.retry();
          }, 1000);
        },
      })
    );

    // Sync all changes received from the remote server to the memory source
    this._coordinator.addStrategy(
      new SyncStrategy({
        source: 'remote',
        target: 'memory',
        blocking: true
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

    orbitCoordinatorActivationBarrier.lower();

    const getRelevantFileRecordsWithUploadDirectivesFromTransform = (transform) => {
        const relevantFileRecordsWithUploadDirectives = [];
  
        const appendIfRelevant = (relatedRecord, recordType, relationshipField) => {
          if (relatedRecord?.type === 'file--file' && relatedRecord?.['$upload'] && recordType && relationshipField) {
            relevantFileRecordsWithUploadDirectives.push({ relatedRecord, recordType, relationshipField });
          }
        };
  
        let operations = transform?.operations || [];
        if (!Array.isArray(operations)) {
          operations = [operations];
        }
  
        operations.forEach(operation => {
          if (['addRecord', 'updateRecord'].includes(operation.op)) {
            const record = operation.record || {};
  
            const recordType = record.type;
  
            const relationships = record.relationships || {};
  
            Object.keys(relationships).forEach(relationshipField => {
              let relatedRecords = relationships[relationshipField].data || [];
              if (!Array.isArray(relatedRecords)) {
                relatedRecords = [relatedRecords];
              }
  
              relatedRecords.forEach(relatedRecord => appendIfRelevant(relatedRecord, recordType, relationshipField));
            });
          }
  
          if (['addToRelatedRecords', 'replaceRelatedRecord'].includes(operation.op)) {
            const relatedRecord = operation.relatedRecord;
            const recordType = operation.record?.type;
            const relationshipField = operation.relationship;
  
            appendIfRelevant(relatedRecord, recordType, relationshipField);
          }
  
          if (['replaceRelatedRecords'].includes(operation.op)) {
            const recordType = operation.record?.type;
            const relationshipField = operation.relationship;
  
            const relatedRecords = operation.relatedRecords || [];
  
            relatedRecords.forEach(relatedRecord => appendIfRelevant(relatedRecord, recordType, relationshipField));
          }
        });
  
        return relevantFileRecordsWithUploadDirectives;
      };
  
      // Create a placeholder 'file--file' entry for pending file uploads
      // Might be able to be simplified once https://www.drupal.org/project/drupal/issues/3021155 is fixed
      this._memory.on('beforeUpdate', async (transform) => {
        const relevantFileRecordsWithUploadDirectives = getRelevantFileRecordsWithUploadDirectivesFromTransform(transform);
  
        await Promise.all(relevantFileRecordsWithUploadDirectives.map(async ({ relatedRecord, recordType, relationshipField }) => {
          const uploadDirective = relatedRecord['$upload'];
  
          const placeholderFileEntity = {
            type: 'file--file',
            id: relatedRecord.id,
            attributes: {
              filename: uploadDirective.fileName,
              uri: {
                url: uploadDirective.fileDataUrl,
              }
            },
          };
  
          await this._memory.cache.update(
                (t) => t.addRecord(placeholderFileEntity),
                // Pass a flag so our coordinator knows not to sync these to the server
                { localOnly: true });
  
          await this._backup.update(
                (t) => t.addRecord(placeholderFileEntity),
                // Pass a flag so our coordinator knows not to sync these to the server
                { localOnly: true });
  
        }));

      });
  
      // Emit events indicating that assets/logs have changed when the memory source gets updated
      this._memory.on('update', update => {
  
        let operations = update?.operations || [];
        if (!Array.isArray(operations)) {
          operations = [operations];
        }
  
        operations.forEach(operation => {

          if (['updateRecord', 'replaceAttribute', 'addToRelatedRecords', 'removeFromRelatedRecords', 'replaceRelatedRecords', 'replaceRelatedRecord']
              .includes(operation.op) && operation.record.type.startsWith('asset--')) {
            this._memory.requestQueue.currentProcessor.settle().then(() => {
              this._eventBus.$emit('changed:asset', { assetType: operation.record.type, assetId: operation.record.id});
            });
          }
  
          if (['addRecord', 'updateRecord'].includes(operation.op) && operation.record.type.startsWith('log--')) {
            operation.record.relationships.asset.data.forEach(assetRel => {
              this._memory.requestQueue.currentProcessor.settle().then(() => {
                this._eventBus.$emit('changed:assetLogs', { assetType: assetRel.type, assetId: assetRel.id});
              });
            });
          }
  
          if (['addRecord', 'updateRecord'].includes(operation.op) && operation.record.type.startsWith('quantity--')) {
            const assetRel = operation.record.relationships?.inventory_asset?.data;
  
            if (assetRel) {
              this._memory.requestQueue.currentProcessor.settle().then(() => {
                this._eventBus.$emit('changed:assetLogs', { assetType: assetRel.type, assetId: assetRel.id});
              });
            }
          }
  
        });
  
      });
  
      // Handle file uploads before their relationship transforms get applied to the server
      this._remote.on('beforeUpdate', async (transform) => {
        const relevantFileRecordsWithUploadDirectives = getRelevantFileRecordsWithUploadDirectivesFromTransform(transform);
  
        // Upload them all and modify the related records with the new 'file--file' entity ids
        await Promise.all(relevantFileRecordsWithUploadDirectives.map(async ({ relatedRecord, recordType, relationshipField }) => {
          const uploadDirective = relatedRecord['$upload'];
  
          const uploadUrl = createDrupalUrl(`/api/${recordType.split('--').join('/')}/${relationshipField}`);
  
          const { fileName, fileDataUrl } = uploadDirective;
  
          const fileBuffer = await fetch(fileDataUrl).then(r => r.arrayBuffer());
  
          const uploadResult = await this._fetch(uploadUrl, {
            method: 'POST',
            headers: {
              'Accept': 'application/vnd.api+json',
              'Content-Type': 'application/octet-stream',
              'Content-Disposition': `file; filename="${fileName}"`,
            },
            body: fileBuffer,
          });
  
          const uploadResultJson = await uploadResult.json();
  
          relatedRecord.id = uploadResultJson.data.id;
        }));
  
      });
  
      // Enable and disable the remote request queue when offline
      // In practice this means that `update` requests are queued up
      // until the connection to the server becomes available again.
      // On the other hand `query` requests shouldn't be reaching the
      // remote request queue - being fullfilled locally with the
      // information already available.
      watchEffect(async () => {
        const isOnline = this._connectionStatus.isOnline.value;

        this._remote.requestQueue.autoProcess = isOnline;
        if (isOnline && !this._remote.requestQueue.empty) {
          this._remote.requestQueue.process();
        }
      });
  }

}
