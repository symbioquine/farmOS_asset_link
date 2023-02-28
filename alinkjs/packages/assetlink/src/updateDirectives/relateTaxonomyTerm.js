import { createDrupalUrl } from "assetlink-plugin-api";

/**
 * A directive which can be embedded in a taxonomy term relationship to get or create
 * a given term by name - instead of needing to look it up first. This allows the lookup
 * to be deferred until the new record/relationship is about to be pushed to the server
 * which reduces the likelihood of multiple users creating the same term while offline.
 */
export default {
  install(dataCore) {
      // Use our own implementation here instead of the one in dataCore because we can only
      // query the cache if we want to avoid possible deadlock where our current update is the
      // task on top of the queue, but we'd be blocking here waiting for a query that is behind
      // it.
      const getNonPlaceholderTermFromCache = (termType, termName) => {
        const results = dataCore.entitySource.cache.query(q => q
          .findRecords(termType)
          .filter({ attribute: 'name', op: 'equal', value: termName })
          // Filter out our placeholder taxonomy terms so they only ever get associated
          // with one entity and thus can be safely deleted as part of pushing that record
          .filter({ attribute: 'revision_log_message', op: '<>', value: "placeholder" })
        );
        return (results || []).find(a => a);
      }

      // Create placeholder terms in the local cache/backup
      dataCore._memory.on('beforeUpdate', async (transform) => {

        let operations = transform?.operations || [];
        if (!Array.isArray(operations)) {
          operations = [operations];
        }

        const resolveOrCreatePlaceholderTerm = (termType, termName, placeholderId) => {
          let term = getNonPlaceholderTermFromCache(termType, termName);

          if (term) {
            return term;
          }

          term = dataCore._memory.cache.update(
                (t) => t.addRecord({
                  type: termType,
                  id: placeholderId,
                  attributes: {
                    name: termName,
                    revision_log_message: 'placeholder',
                  },
                }),
                // Pass a flag so our coordinator knows not to sync these to the server
                { localOnly: true });

          dataCore._backup.update(
                (t) => t.addRecord(term),
                // Pass a flag so our coordinator knows not to sync these to the server
                { localOnly: true });

          return term;
        };

        await Promise.all(operations.map(async (operation) => {

          if (['addRecord', 'updateRecord'].includes(operation.op)) {
            const record = operation.record;
            const relationships = record.relationships || {};

            const model = dataCore.getEntityModelSync(record.type);

            await Promise.all(Object.keys(relationships).map(async (relationshipField) => {
              const relationshipModel = model.relationships[relationshipField];

              let relatedRecords = relationships[relationshipField].data || [];
              if (!Array.isArray(relatedRecords)) {
                relatedRecords = [relatedRecords];
              }

              await Promise.all(relatedRecords.map(async (relatedRecord) => {
                if (!relatedRecord?.type.startsWith('taxonomy_term--') || !relatedRecord?.['$relateByName']) {
                  return;
                }

                const term = resolveOrCreatePlaceholderTerm(relatedRecord.type, relatedRecord['$relateByName'].name, relatedRecord.id);

                if (relatedRecord.id !== term.id) {
                  relatedRecord.id = term.id;
                  delete relatedRecord['$relateByName'];
                }
              }));
            }));
          }

          if (['addToRelatedRecords', 'replaceRelatedRecord'].includes(operation.op)) {
            const record = operation.record;
            const relatedRecord = operation.relatedRecord;
            const relationshipField = operation.relationship;

            const model = dataCore.getEntityModelSync(record.type);

            const relationshipModel = model.relationships[relationshipField];

            if (!relatedRecord?.type.startsWith('taxonomy_term--') || !relatedRecord?.['$relateByName']) {
              return;
            }

            const term = resolveOrCreatePlaceholderTerm(relatedRecord.type, relatedRecord['$relateByName'].name, relatedRecord.id);

            if (relatedRecord.id !== term.id) {
              relatedRecord.id = term.id;
              delete relatedRecord['$relateByName'];
            }
          }

          if (['replaceRelatedRecords'].includes(operation.op)) {
            const relatedRecords = operation.relatedRecords || [];

            await Promise.all(relatedRecords.map(async (relatedRecord) => {
              if (!relatedRecord?.type.startsWith('taxonomy_term--') || !relatedRecord?.['$relateByName']) {
                return;
              }

              const term = resolveOrCreatePlaceholderTerm(relatedRecord.type, relatedRecord['$relateByName'].name, relatedRecord.id);

              if (relatedRecord.id !== term.id) {
                relatedRecord.id = term.id;
                delete relatedRecord['$relateByName'];
              }
            }));
          }

        }));

      });

      // Update related taxonomy terms before transforms get applied to the server
      dataCore._remote.on('beforeUpdate', async (transform) => {

        let operations = transform?.operations || [];
        if (!Array.isArray(operations)) {
          operations = [operations];
        }

        const resolveOrCreateTerm = async (termType, termName, placeholderId) => {
          let term = getNonPlaceholderTermFromCache(termType, termName);

          const termUrl = createDrupalUrl(`/api/${termType.split('--').join('/')}`);

          if (!term) {
            // Run this query directly via fetch to avoid deadlock where the update we're handling
            // becomes dependent on a query that is in the remote queue behind it.
            const findTermResult = await dataCore._fetch(`${termUrl}?filter[name]=${termName}`, {
              method: 'GET',
              headers: {
                'Accept': 'application/vnd.api+json',
                'Content-Type': 'application/vnd.api+json',
              },
            });

            const findTermResultJson = await findTermResult.json();

            term = findTermResultJson?.data[0];

            if (term) {
              dataCore.entitySource.cache.update(t => t.addRecord(term));
            }
          }

          if (!term) {
            // Run this update directly via fetch to avoid deadlock where the update we're handling
            // becomes dependent on a query that is in the remote queue behind it.
            const createTermResult = await dataCore._fetch(termUrl, {
              method: 'POST',
              headers: {
                'Accept': 'application/vnd.api+json',
                'Content-Type': 'application/vnd.api+json',
              },
              body: JSON.stringify({
                data: {
                  type: termType,
                  id: placeholderId,
                  attributes: {
                    name: termName,
                  }
                },
              }),
            });

            const createTermResultJson = await createTermResult.json();

            term = createTermResultJson.data;

            dataCore.entitySource.cache.update(t => t.addRecord(term));
          }

          return term;
        };

        await Promise.all(operations.map(async (operation) => {

          if (['addRecord', 'updateRecord'].includes(operation.op)) {
            const record = operation.record;
            const relationships = record.relationships || {};

            const model = dataCore.getEntityModelSync(record.type);

            await Promise.all(Object.keys(relationships).map(async (relationshipField) => {
              const relationshipModel = model.relationships[relationshipField];

              let relatedRecords = relationships[relationshipField].data || [];
              if (!Array.isArray(relatedRecords)) {
                relatedRecords = [relatedRecords];
              }

              await Promise.all(relatedRecords.map(async (relatedRecord) => {
                if (!relatedRecord?.type.startsWith('taxonomy_term--') || !relatedRecord?.['$relateByName']) {
                  return;
                }

                const term = await resolveOrCreateTerm(relatedRecord.type, relatedRecord['$relateByName'].name, relatedRecord.id);

                if (relatedRecord.id !== term.id) {
                  // TODO: Cleanup placeholder
                }

                relatedRecord.id = term.id;
                delete relatedRecord['$relateByName'];
              }));
            }));
          }

          if (['addToRelatedRecords', 'replaceRelatedRecord'].includes(operation.op)) {
            const record = operation.record;
            const relatedRecord = operation.relatedRecord;
            const relationshipField = operation.relationship;

            const model = dataCore.getEntityModelSync(record.type);

            const relationshipModel = model.relationships[relationshipField];

            if (!relatedRecord?.type.startsWith('taxonomy_term--') || !relatedRecord?.['$relateByName']) {
              return;
            }

            const term = await resolveOrCreateTerm(relatedRecord.type, relatedRecord['$relateByName'].name, relatedRecord.id);

            if (relatedRecord.id !== term.id) {
              if (relationshipModel.kind === 'hasOne' && operation.op === 'replaceRelatedRecord') {
                dataCore.entitySource.cache.update(t => t.replaceRelatedRecord(record, relationshipField, { type: term.type, id: term.id }));
              }
              if (relationshipModel.kind === 'hasMany' && operation.op === 'addToRelatedRecords') {
                const relatedRecordsInCache = dataCore.entitySource.cache.query(q => q.findRelatedRecords(record, relationshipField));

                const idxToReplace = relatedRecordsInCache.findIndex(t => t.id === relatedRecord.id);

                if (idxToReplace >= 0) {
                  relatedRecordsInCache.splice(idxToReplace, 1, { type: term.type, id: term.id });
                } else {
                  relatedRecordsInCache.push({ type: term.type, id: term.id });
                }

                dataCore.entitySource.cache.update(t => t.replaceRelatedRecords(record, relationshipField, relatedRecordsInCache));
              }

              // TODO: Cleanup placeholder
            }

            relatedRecord.id = term.id;
            delete relatedRecord['$relateByName'];
          }

          if (['replaceRelatedRecords'].includes(operation.op)) {
            const relatedRecords = operation.relatedRecords || [];

            await Promise.all(relatedRecords.map(async (relatedRecord) => {
              if (!relatedRecord?.type.startsWith('taxonomy_term--') || !relatedRecord?.['$relateByName']) {
                return;
              }

              const term = await resolveOrCreateTerm(relatedRecord.type, relatedRecord['$relateByName'].name, relatedRecord.id);

              if (relatedRecord.id !== term.id) {
                // TODO: Cleanup placeholder
              }

              relatedRecord.id = term.id;
              delete relatedRecord['$relateByName'];
            }));
          }

        }));

      });
  }
};
