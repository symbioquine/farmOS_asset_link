import { createDrupalUrl } from "assetlink-plugin-api";

/**
 * A directive which can be embedded in a file--file relationship to upload a file as part of
 * pushing the updated entity/relationship to the server. This helps abstract file uploading
 * and make sure it gets tracked in the remote update queue along with the relationship change
 * which is key to allowing file uploads to work offline.
 */
export default {
  install(dataCore) {
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
      dataCore._memory.on('beforeUpdate', async (transform) => {
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
    
          await dataCore._memory.cache.update(
                (t) => t.addRecord(placeholderFileEntity),
                // Pass a flag so our coordinator knows not to sync these to the server
                { localOnly: true });
    
          await dataCore._backup.update(
                (t) => t.addRecord(placeholderFileEntity),
                // Pass a flag so our coordinator knows not to sync these to the server
                { localOnly: true });
    
        }));
  
      });

      // Handle file uploads before their relationship transforms get applied to the server
      dataCore._remote.on('beforeUpdate', async (transform) => {
        const relevantFileRecordsWithUploadDirectives = getRelevantFileRecordsWithUploadDirectivesFromTransform(transform);
  
        // Upload them all and modify the related records with the new 'file--file' entity ids
        await Promise.all(relevantFileRecordsWithUploadDirectives.map(async ({ relatedRecord, recordType, relationshipField }) => {
          const uploadDirective = relatedRecord['$upload'];
  
          const uploadUrl = createDrupalUrl(`/api/${recordType.split('--').join('/')}/${relationshipField}`);
  
          const { fileName, fileDataUrl } = uploadDirective;
  
          const fileBuffer = await fetch(fileDataUrl).then(r => r.arrayBuffer());
  
          const uploadResult = await dataCore._fetch(uploadUrl, {
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
  }
};