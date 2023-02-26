import { buildQuery, buildTransform } from '@orbit/data';
import { RecordNotFoundException } from '@orbit/records';

import { Fraction } from 'fraction.js';

import combineWkt from './combineWkt';

import { currentEpochSecond, parseJSONDate, uuidv4, formatRFC3339 } from "assetlink-plugin-api";

const flattenResults = (r, e) => {
  if (r === undefined) {
    return [];
  }
  if (e.op === 'findRecord' || e.op === 'findRelatedRecord') {
    return [r];
  }
  return r;
};

const zip = (...rows) => [...rows[0]].map((_,c) => rows.map(row => row[c]));

const toResultsEntities = (query, results, opts) => {
  let multiQuery = true;
  let expressions = query?.expressions || [];
  if (!Array.isArray(expressions)) {
    multiQuery = false;
    expressions = [expressions];
  }

  let rawResults = results;
  if (opts.fullResponse) {
    rawResults = results?.data;
  }

  let resultEntities = [];
  if (multiQuery) {
    resultEntities = zip(rawResults, expressions).flatMap(([r, e]) => flattenResults(r, e));
  } else {
    resultEntities = flattenResults(rawResults, expressions[0]);
  }

  return resultEntities;
};

/**
 * Implements the core farmOS data model computed field logic for locations, geometry, quantities, and group membership
 * by using cache data. This produces a best effort view of assets which incorporates local changes, however it cannot
 * always produce the correct answer when offline because we may have a log that was created locally, but is actually superceded
 * by another log on the server that we don't have information about locally.
 * 
 * In this case, we produce a best effort answer, but flag the field on the results to indicate that it is non-authoritative.
 * That flag can then be used in the UI to provide a hint/tooltip showing that a more accurate answer requires going online.
 */
export default class FarmDataModelOrbitMemorySourceDecorator {
  constructor(delegate, settings) {
    this._delegate = delegate;
    this._schema = settings.schema;
    this._logTypeGetter = settings.logTypesGetter;
    this._remoteRequestQueue = settings.remoteRequestQueue;
  }

  get cache() {
    return this._delegate.cache;
  }

  get queryBuilder() {
    return this._delegate.queryBuilder;
  }

  async query(queryOrExpressions, options, id) {
    const opts = options || {};

    opts.timestamp = formatRFC3339(new Date());

    const query = buildQuery(
      queryOrExpressions,
      opts,
      id,
      this._delegate.queryBuilder
    );

    // TODO: Consider convenience mechanism to allow querying `asset--*` and `log--*`

    const results = await this._partiallyDelegateQuery(query, opts, id);

    const resultEntities = toResultsEntities(query, results, opts);

    await Promise.all(resultEntities.map(async (entity) => this._computeCurrentAssetGroups(entity, opts)));
    await Promise.all(resultEntities.map(async (entity) => this._computeCurrentAssetLocationAndGeometry(entity, opts)));
    await Promise.all(resultEntities.map(async (entity) => this._computeCurrentAssetInventory(entity, opts)));

    return results;
  }

  async update(transformOrOperations, options, id) {
    const opts = options || {};

    opts.timestamp = formatRFC3339(new Date());

    const transform = buildTransform(
      transformOrOperations,
      options,
      id,
      this._delegate.transformBuilder
    );

    let multiOp = true;
    let operations = transform?.operations || [];
    if (!Array.isArray(operations)) {
      multiOp = false;
      operations = [operations];
    }

    await Promise.all(operations.map(async (operation) => this._populateMissingNewRecordId(operation)));
    await Promise.all(operations.map(async (operation) => this._populateLogGeometry(operation)));

    return await this._delegate.update(transform, options, id);
  }

  async _partiallyDelegateQuery(query, opts, id) {
    let expressions = query?.expressions || [];
    if (!Array.isArray(expressions)) {
      expressions = [expressions];
    }

    const localExpressions = [];
    const delegateExpressions = [];
    const mergeSelectors = [];

    expressions.forEach(expr => {
      // Handle "computed" group/location relations locally
      if (['findRelatedRecords'].includes(expr.op) &&
          expr.record.type.startsWith('asset--') &&
          ['group', 'location'].includes(expr.relationship)
      ) {
        localExpressions.push(expr);
        mergeSelectors.push((localResultsItems, delegateResultsItems) => localResultsItems.shift());
        return;
      }

      delegateExpressions.push(expr);
      mergeSelectors.push((localResultsItems, delegateResultsItems) => delegateResultsItems.shift());
    });

    const localQuery = { ...query, expressions: localExpressions };
    const delegateQuery = { ...query, expressions: delegateExpressions };

    const [localResults, delegateResults] = await Promise.all([
      this._localQuery(localQuery, opts, id),
      this._delegateQuery(delegateQuery, opts, id)
    ]);

    const localResultsItems = localResults;
    let delegateResultsItems = delegateResults;
    if (query.options?.fullResponse) {
      delegateResultsItems = delegateResults.data || [];
    }

    let mergedResultsItems = mergeSelectors.map(ms => ms(localResultsItems, delegateResultsItems));

    if (!Array.isArray(query?.expressions)) {
      mergedResultsItems = mergedResultsItems[0];
    }

    if (!query.options?.fullResponse) {
      return mergedResultsItems;
    }

    if (!delegateExpressions.length || !delegateResults) {
      return {
        data: mergedResultsItems,
      };
    }

    return {
      ...delegateResults,
      data: mergedResultsItems,
    };
  }

  async _localQuery(query, opts, id) {
    if (!query.expressions.length) {
      return [];
    }
    return await Promise.all(query.expressions.map(async (expr) => {
      if (expr.relationship === 'group') {
        return await this._computeCurrentRelatedGroups(expr.record, opts);
      }
      else if (expr.relationship === 'location') {
        return await this._computeCurrentRelatedLocations(expr.record, opts);
      }
    }));
  }

  async _delegateQuery(query, opts, id) {
    if (!query.expressions.length) {
      return [];
    }

    if (opts.verifyCacheIntegrity) {
      // Execute the query against the cache without the `page` parameters
      // to get all the local cache data
      let cacheResults = this.cache.query({
        ...query,
        expressions: query.expressions.map(expr => {
          return {
            ...expr,
            page: undefined,
          };
        }),
      });

      const cacheResultEntities = toResultsEntities(query, cacheResults, opts);

      // Query each cached entity from the remote server (if online)
      await Promise.all(cacheResultEntities.map(async (localRecord) => {
        try {
          await this.query(q => q.findRecord({ type: localRecord.type, id: localRecord.id }), { forceRemote: true, raiseNotFoundExceptions: true });
        } catch (err) {
          // Remove the log from our local memory if it is missing from the server and not pending creation by ourselves
          if (err instanceof RecordNotFoundException && !this._isEntityCreatedByPendingRemoteUpdate({ type: localRecord.type, id: localRecord.id })) {
            this.update(q => q.removeRecord({ type: localRecord.type, id: localRecord.id }), { localOnly: true });
            return;
          }
          throw err;
        }
      }));
    }

    return await this._delegate.query(query, opts, id);
  }

  async _computeCurrentRelatedLocations(recordIdentity, opts) {
    const latestMovementLog = await this._getLatestMovementLog(recordIdentity, opts);

    if (!latestMovementLog) {
      return [];
    }

    // Query the cache here because _getLatestMovementLog includes the location from the remote source (if we're online)
    return await this.cache.query(q => q.findRelatedRecords({ type: latestMovementLog.type, id: latestMovementLog.id }, 'location'));
  }

  async _computeCurrentAssetGroups(entity, opts) {
    if (!entity.type.startsWith('asset--')) {
      return;
    }

    const isNewlyCreatedAsset = this._isEntityCreatedByPendingRemoteUpdate({ type: entity.type, id: entity.id });
    const hasRelevantPendingRemoteLogUpdates = this._hasPendingRemoteLogUpdatesForAssetWhere({ type: entity.type, id: entity.id }, { is_group_assignment: true, status: 'done' });

    // Only replace the computed groups field if at least one of:
    // - The asset is newly created
    // - We have relevant pending log updates
    if (!isNewlyCreatedAsset && !hasRelevantPendingRemoteLogUpdates) {
      return;
    }

    const groups = await this._computeCurrentRelatedGroups({ type: entity.type, id: entity.id }, opts);

    if (groups === undefined) {
      return;
    }

    entity.relationships = entity.relationships || {};
    entity.relationships.group = entity.relationships.group || {};
    entity.relationships.group.data = groups.map(g => ({ type: g.type, id: g.id }));
  }

  async _computeCurrentRelatedGroups(recordIdentity, opts) {
    const logTypes = (await this._logTypeGetter()).map(t => t.attributes.drupal_internal__id).map(logType => `log--${logType}`);

    const logTypesWithGroupAssignmentField = logTypes.filter(logType => this._schema.getModel(logType).attributes.is_group_assignment);

    // Only proceed if at least one log type has the `is_group_assignment` field
    if (!logTypesWithGroupAssignmentField.length) {
      return undefined;
    }

    const results = await this.query(q => logTypesWithGroupAssignmentField.map(logType => {
      return q.findRecords(logType)
        .filter({ attribute: 'is_group_assignment', op: 'equal', value: true })
        .filter({ attribute: 'status', op: 'equal', value: 'done' })
        .filter({ attribute: 'timestamp', op: '<=', value: currentEpochSecond() })
        .filter({
          relation: 'asset.id',
          op: 'some',
          records: [{ type: recordIdentity.type, id: recordIdentity.id }]
        })
        .sort('-timestamp')
        .page({ offset: 0, limit: 1 });
    }), {
      include: ['group'],
      forceRemote: !!opts.forceRemote,
      verifyCacheIntegrity: !!opts.forceRemote,
    });
  
    const logs = results.flatMap(l => l);
  
    const latestGroupMembershipLog = logs.length ? logs.reduce((logA, logB) => parseJSONDate(logA.attributes.timestamp) > parseJSONDate(logB.attributes.timestamp) ? logA : logB) : null;
  
    if (!latestGroupMembershipLog) {
      return [];
    }

    // Query the cache here because our query above already includes the group from the remote source (if we're online)
    return this.cache.query(q => q.findRelatedRecords({ type: latestGroupMembershipLog.type, id: latestGroupMembershipLog.id }, 'group')) || [];
  }

  // Roughly implements: https://github.com/farmOS/farmOS/blob/637843aabf86a4ccfe108d31a8435f80dd64fcf3/modules/core/location/src/AssetLocation.php
  async _computeCurrentAssetLocationAndGeometry(entity, opts) {
    if (!entity.type.startsWith('asset--')) {
      return;
    }

    const asset = entity;

    const isNewlyCreatedAsset = this._isEntityCreatedByPendingRemoteUpdate({ type: asset.type, id: asset.id });
    const hasRelevantPendingRemoteLogUpdates = this._hasPendingRemoteLogUpdatesForAssetWhere({ type: asset.type, id: asset.id }, { is_movement: true, status: 'done' });

    // Only replace the computed location/geometry fields if at least one of:
    // - The asset is newly created
    // - We have relevant pending log updates
    if (!isNewlyCreatedAsset && !hasRelevantPendingRemoteLogUpdates) {
      return;
    }

    const latestMovementLog = await this._getLatestMovementLog({ type: asset.type, id: asset.id }, opts);

    if (latestMovementLog) {
      // Query the cache here because _getLatestMovementLog includes the location from the remote source
      const locations = await this.cache.query(q => q.findRelatedRecords({ type: latestMovementLog.type, id: latestMovementLog.id }, 'location')) || [];

      asset.relationships.location.data = locations.map(l => ({ type: l.type, id: l.id }));
    }

    if (asset.attributes.is_fixed) {
      asset.attributes.geometry = asset.attributes.intrinsic_geometry;
      return;
    }

    if (!latestMovementLog) {
      return;
    }

    asset.attributes.geometry = latestMovementLog.attributes.geometry;
  }

  // Roughly implements https://github.com/farmOS/farmOS/blob/637843aabf86a4ccfe108d31a8435f80dd64fcf3/modules/core/inventory/src/AssetInventory.php#L54
  async _computeCurrentAssetInventory(entity, opts) {
    if (!entity.type.startsWith('asset--')) {
      return;
    }

    // Don't try and resolve inventory if the inventory module is not installed in farmOS
    if (!this._schema.getModel('quantity--standard').relationships.inventory_asset) {
      return;
    }

    const asset = entity;

    const isNewlyCreatedAsset = this._isEntityCreatedByPendingRemoteUpdate({ type: asset.type, id: asset.id });
    const hasRelevantPendingRemoteQuantityUpdates = this._hasPendingRemoteQuantityLogUpdatesForAssetWhere({ type: asset.type, id: asset.id }, { status: 'done' })

    // Only replace the computed inventory field if at least one of:
    // - The asset is newly created
    // - We have relevant pending log updates
    if (!isNewlyCreatedAsset && !hasRelevantPendingRemoteQuantityUpdates) {
      return;
    }

    const logTypes = (await this._logTypeGetter()).map(t => t.attributes.drupal_internal__id).map(logType => `log--${logType}`);

    // Paginate through all the pages of logs for each log type by keeping a mapping of log types to page offsets
    // and removing log types once we've reached the end of the pages
    let nextOffsetByLogType = logTypes.reduce((offsets, logType) => { offsets[logType] = 0; return offsets; }, {});

    while (Object.keys(nextOffsetByLogType).length) {
      // Orbit.js doesn't support this query fully https://github.com/orbitjs/orbit/issues/370
      // So for now, we'll execute it just to prime the cache (if online), then do all our calculations
      // from the cache.
      const primingResult = await this.query(q => Object.entries(nextOffsetByLogType).map(([logType, nextOffset]) => {
        return q.findRecords(logType)
          .filter({ attribute: 'status', op: 'equal', value: 'done' })
          .filter({ attribute: 'timestamp', op: '<=', value: currentEpochSecond() })
          .filter({
            attribute: 'quantity.inventory_asset.id',
            op: 'equal',
            value: asset.id
          })
          .sort('-timestamp')
          .options({
            page: { kind: 'offsetLimit', offset: nextOffset, limit: 50 },
          });
      }), {
        include: ['quantity', 'quantity.units'],
        forceRemote: !!opts.forceRemote,
        fullResponse: true,
      });

      const remoteDetails = primingResult?.sources?.remote?.details;

      if (!remoteDetails) {
        break;
      }

      remoteDetails.forEach(detail => {
        const selfRawUrl = detail.document?.links?.self?.href;
        const nextRawUrl = detail.document?.links?.next?.href;

        const selfUrl = new URL(selfRawUrl);

        const selfPathParts = selfUrl.pathname.split('/');

        const logType = selfPathParts[3];

        if (!nextRawUrl) {
          delete nextOffsetByLogType[logType];
          return;
        }

        const nextUrl = new URL(nextRawUrl);

        nextOffsetByLogType[logType] = nextUrl.searchParams.get('page[offset]');
      });
    }

    const relatedQuantities = this.query(q => {
      return q.findRecords('quantity--standard')
        .filter({
          relation: 'inventory_asset.id',
          op: 'equal',
          record: { type: asset.type, id: asset.id }
        })
        .sort('-timestamp');
    }, {
      verifyCacheIntegrity: !!opts.forceRemote,
    });

    const relatedLogResults = this.query(q => logTypes.map(logType => {
      return q.findRecords(logType)
        .filter({ attribute: 'status', op: 'equal', value: 'done' })
        .filter({ attribute: 'timestamp', op: '<=', value: currentEpochSecond() })
        .filter({
          relation: 'quantity.id',
          op: 'some',
          records: relatedQuantities.map(quantity => ({ id: quantity.id, type: quantity.type })),
        })
        .sort('-timestamp');
    }), {
      verifyCacheIntegrity: !!opts.forceRemote,
    });

    const logs = relatedLogResults.flatMap(l => l).sort((logA, logB) => parseJSONDate(logA.attributes.timestamp) - parseJSONDate(logB.attributes.timestamp));

    const inventoryLineItemsByMeasureAndUnits = {};

    const toFraction = (quantityValue) => {
      if (quantityValue.numerator && quantityValue.denominator) {
        return new Fraction(quantityValue.numerator, quantityValue.denominator);
      }
      return new Fraction(quantityValue.decimal);
    }

    logs.forEach(log => {
      log.relationships.quantity.data.forEach(quantity => {
        const quantityEntity = this.cache.query((q) => q.findRecord({ type: quantity.type, id: quantity.id }));

        const invAsset = quantityEntity.relationships.inventory_asset?.data;

        if (!invAsset || invAsset.type !== asset.type || invAsset.id !== asset.id) {
          return;
        }

        const relatedUnits = quantityEntity.relationships?.units?.data || {};

        const unitsEntity = relatedUnits && this.cache.query((q) => q.findRecord({ type: relatedUnits.type, id: relatedUnits.id })) || relatedUnits;

        const key = `${quantityEntity.attributes.measure}|${unitsEntity.type}|${unitsEntity.id}`;

        let operator = undefined;
        if (quantityEntity.attributes.inventory_adjustment === 'increment') {
          operator = (existing, value) => existing.add(value);
        } else if (quantityEntity.attributes.inventory_adjustment === 'decrement') {
          operator = (existing, value) => existing.sub(value);
        } else if (quantityEntity.attributes.inventory_adjustment === 'reset') {
          operator = (existing, value) => value;
        } else {
          throw new Error("Unsupported inventory adjustment type.");
        }

        if (!inventoryLineItemsByMeasureAndUnits[key]) {
          inventoryLineItemsByMeasureAndUnits[key] = { key, value: new Fraction(0), measure: quantityEntity.attributes.measure, units: unitsEntity };
        }

        inventoryLineItemsByMeasureAndUnits[key].value = operator(inventoryLineItemsByMeasureAndUnits[key].value, toFraction(quantityEntity.attributes.value));
      });
    });

    asset.attributes.inventory = Object.values(inventoryLineItemsByMeasureAndUnits).map(({ value, measure, units }) => ({
      measure,
      units: units.attributes?.name,
      value: '' + value.valueOf(),
    }));
  }

  _isEntityCreatedByPendingRemoteUpdate(recordIdentity) {
    const remoteUpdateOperations = this._remoteRequestQueue.entries
      .filter(r => r.type === 'update')
      .flatMap(queueItem => {
        const update = queueItem.data;
        let operations = update?.operations || [];
        if (!Array.isArray(operations)) {
          operations = [operations];
        }
        return operations;
      });

      return !!remoteUpdateOperations.find(operation => {
        if (operation.op !== 'addRecord') {
          return false;
        }

        if (operation.record.type !== recordIdentity.type) {
          return false;
        }

        return operation.record.id !== recordIdentity.id;
      });
  }

  _hasPendingRemoteLogUpdatesForAssetWhere(recordIdentity, attrsToMatch) {
    const remoteUpdateOperations = this._remoteRequestQueue.entries
      .filter(r => r.type === 'update')
      .flatMap(queueItem => {
        const update = queueItem.data;
        let operations = update?.operations || [];
        if (!Array.isArray(operations)) {
          operations = [operations];
        }
        return operations;
      });

    // Find if there are any update operations which concern the asset relationship matching `recordIdentity`
    // and the attrsToMatch
    return !!remoteUpdateOperations.find(operation => {
      if (!operation.record.type.startsWith('log--')) {
        return false;
      }

      const updatedLogRecord = this.cache.query((q) => q.findRecord(operation.record));

      if (!updatedLogRecord) {
        // TODO: Handle deleted logs that were relevant
        return false;
      }

      const hasCurrentRelevantAssetRelationship = updatedLogRecord.relationships?.asset?.data
        .find(assetRel => assetRel.type === recordIdentity.type && assetRel.id === recordIdentity.id);

      const removesRelevantAssetRelationship = operation.op === 'removeFromRelatedRecords' && operation.relationship === 'asset' &&
        operation.relatedRecord.type === recordIdentity.type && operation.relatedRecord.id === recordIdentity.id;

      // TODO: Handle `replaceRelatedRecords` operation

      if (!hasCurrentRelevantAssetRelationship && !removesRelevantAssetRelationship) {
          return false;
      }

      if (typeof attrsToMatch === 'function') {
        return attrsToMatch(updatedLogRecord);
      }

      return Object.keys(attrsToMatch).every(attrKey => {
        const expectedAttrValue = attrsToMatch[attrKey];

        return updatedLogRecord.attributes[attrKey] === expectedAttrValue;
      });
    });
  }

  _hasPendingRemoteQuantityLogUpdatesForAssetWhere(recordIdentity, attrsToMatch) {
    const remoteUpdateOperations = this._remoteRequestQueue.entries
      .filter(r => r.type === 'update')
      .flatMap(queueItem => {
        const update = queueItem.data;
        let operations = update?.operations || [];
        if (!Array.isArray(operations)) {
          operations = [operations];
        }
        return operations;
      });

    // Find if there are any relevant update operations which concern quantities with the `inventory_asset` relationship
    return !!remoteUpdateOperations.find(operation => {
      if (!operation.record.type.startsWith('log--')) {
        return false;
      }

      const updatedLogRecord = this.cache.query((q) => q.findRecord(operation.record));

      if (!updatedLogRecord) {
        // TODO: Handle deleted logs that were relevant
        return false;
      }

      const updateQuantityRecords = this.cache.query((q) => q.findRelatedRecords({ type: updatedLogRecord.type, id: updatedLogRecord.id }, 'quantity'));

      const hasCurrentRelevantQuantityRelationship = updateQuantityRecords.find(qr =>
        qr?.relationships?.inventory_asset?.data?.type === recordIdentity.type && qr?.relationships?.inventory_asset?.data?.id === recordIdentity.id);

      let removesRelevantQuantityRelationship = false;
      if (operation.op === 'removeFromRelatedRecords' && operation.relationship === 'quantity') {
        const removedQuantityRecordIdentity = operation.relatedRecord;

        const removedQuantityRecord = this.cache.query((q) => q.findRecord(removedQuantityIdentity));

        removesRelevantQuantityRelationship =
          removedQuantityRecord?.relationships?.inventory_asset?.data?.type === recordIdentity.type &&
          removedQuantityRecord?.relationships?.inventory_asset?.data?.id === recordIdentity.id;
      }

      // TODO: Handle `replaceRelatedRecords` operation

      if (!hasCurrentRelevantQuantityRelationship && !removesRelevantQuantityRelationship) {
          return false;
      }

      if (typeof attrsToMatch === 'function') {
        return attrsToMatch(updatedLogRecord);
      }

      return Object.keys(attrsToMatch).every(attrKey => {
        const expectedAttrValue = attrsToMatch[attrKey];

        return updatedLogRecord.attributes[attrKey] === expectedAttrValue;
      });
    });
  }

  async _getLatestMovementLog(recordIdentity, opts) {
    const logTypes = (await this._logTypeGetter()).map(t => t.attributes.drupal_internal__id);

    const results = await this.query(q => logTypes.map(logType => {
      return q.findRecords(`log--${logType}`)
        .filter({ attribute: 'is_movement', op: 'equal', value: true })
        .filter({ attribute: 'status', op: 'equal', value: 'done' })
        .filter({ attribute: 'timestamp', op: '<=', value: currentEpochSecond() })
        .filter({
          relation: 'asset.id',
          op: 'some',
          records: [{ type: recordIdentity.type, id: recordIdentity.id }]
        })
        .sort('-timestamp')
        .page({ offset: 0, limit: 1 });
    }), {
      include: ['location'],
      forceRemote: !!opts.forceRemote,
      verifyCacheIntegrity: !!opts.forceRemote,
    });

    const logs = results.flatMap(l => l);

    if (!logs.length) {
      return undefined;
    }
  
    return logs.reduce((logA, logB) => parseJSONDate(logA.attributes.timestamp) > parseJSONDate(logB.attributes.timestamp) ? logA : logB);
  }

  async _populateMissingNewRecordId(operation) {
    if (operation.op !== 'addRecord') {
      return;
    }

    if (operation.record.id) {
      return;
    }

    operation.record.id = uuidv4();
  }

  // Roughly implements https://github.com/farmOS/farmOS/blob/637843aabf86a4ccfe108d31a8435f80dd64fcf3/modules/core/location/src/EventSubscriber/LogEventSubscriber.php#L111
  async _populateLogGeometry(operation) {
    if (operation.op !== 'addRecord' && operation.op !== 'updateRecord') {
      return;
    }

    if (!operation.record.type.startsWith('log--')) {
      return;
    }

    const updatedLog = operation.record;

    const getReferencedRecordsFromUnsavedRelation = async (record, relation) => {
      const relatedRefs = record?.relationships?.[relation]?.data || [];

      const rawRelated = await Promise.all(relatedRefs.map(l => this.query(q => q.findRecord({ type: l.type, id: l.id }))));

      return rawRelated.filter(r => r !== undefined);
    };

    const getLocationAssets = async (log) => {
      // Load location assets referenced by the log.
      const locationAssets = await getReferencedRecordsFromUnsavedRelation(log, 'location');

      // If there are no assets in the location reference field, look for location
      // assets in the asset reference field. Only do this if the log is not a
      // movement, otherwise it would be impossible to clear the geometry of a
      // non-fixed location asset via movement Logs.
      if (!locationAssets.length && !log.attributes.is_movement) {
        const assets = await getReferencedRecordsFromUnsavedRelation(log, 'asset');

        assets.filter(a => a.attributes.is_location).forEach(a => locationAssets.push(a));
      }

      return locationAssets;
    };

    const getCombinedAssetGeometry = (assets) => {
      // Collect all the location geometries.
      const geoms = [];

      assets.forEach((asset) => {
        const assetGeom = asset.attributes.geometry?.value;
        if (assetGeom) {
          geoms.push(assetGeom);
        }
      });

      // Combine the geometries into a single WKT string.
      return combineWkt(geoms);
    };

    // Load location assets referenced by the log.
    const updatedLogAssets = await getLocationAssets(updatedLog);

    // If the log does not reference any location assets, we will have nothing
    // to copy from, so do nothing.
    if (!updatedLogAssets.length) {
      return;
    }

    const newGeometry = updatedLog.attributes.geometry?.value;

    // If this is a new log and it has a geometry, do nothing.
    if (operation.op === 'addRecord' && newGeometry) {
      return;
    }

    const logHasCustomGeometry = async (log) => {
      // If the log's geometry is empty, then it does not have a custom geometry.
      if (!log.attributes.geometry?.value) {
        return false;
      }
  
      // Load location assets referenced by the log.
      const assets = await getLocationAssets(log);
  
      // Get the combined location asset geometry.
      const locationGeometry = getCombinedAssetGeometry(assets);
  
      // Get the log geometry.
      const logGeometry = log.attributes.geometry?.value;
  
      // Compare the log and location geometries.
      return logGeometry !== locationGeometry;
    };

    // If this is an update to an existing log, and the new geometry is not
    // empty, perform some checks to see if we should proceed or not. We always
    // want to proceed if the updated log's geometry is empty because this is
    // an indication that it was cleared manually by the user in order to
    // re-populate it.
    if (operation.op === 'updateRecord' && newGeometry) {
      const originalLog = await this.query((q) => q.findRecord({ type: operation.record.type, id: operation.record.id }));

      // If the original log has a custom geometry, do nothing.
      if (await logHasCustomGeometry(originalLog)) {
        return;
      }

      // If the geometry has changed, do nothing.
      const oldGeometry = originalLog.attributes.geometry?.value;
      if (oldGeometry != newGeometry) {
        return;
      }
    }

    // Get the combined location asset geometry.
    const updatedWkt = getCombinedAssetGeometry(updatedLogAssets);

    const computeGeometryFieldFromWkt = (wktString) => {
      return {
        value: wktString,
        // TODO
      };
    };

    // If the WKT is not empty, set the log geometry.
    if (updatedWkt) {
      updatedLog.attributes.geometry = computeGeometryFieldFromWkt(updatedWkt);
    }
  }

}
