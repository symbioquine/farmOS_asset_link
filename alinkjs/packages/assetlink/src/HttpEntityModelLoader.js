import { createDrupalUrl, currentEpochSecond } from "assetlink-plugin-api";


export default class HttpEntityModelLoader {

  constructor( { fetch, store, reportProgressFn }) {
    this.fetch = fetch;
    this.store = store;
    this.reportProgressFn = reportProgressFn;
  }

  async loadModels() {
    const cacheKey = `asset-link-cached-entity-models`;

    const cacheItem = await this.store.getItem(cacheKey);

    if (cacheItem) {
      // TODO: If cache item is stale, schedule background refresh
      return cacheItem.value;
    }

    const models = await this._loadModelsFromServer();

    const timestamp = currentEpochSecond();

    await this.store.setItem(cacheKey, {key: cacheKey, timestamp, value: models});

    return models;
  }

  async _loadModelsFromServer() {
    const fetchJson = (url, args) => this.fetch(url, args).then(response => response.json());

    const serverSchema = await fetchJson(createDrupalUrl('/api/schema'));

    const serverRelatedSchemas = serverSchema.allOf.flatMap(schemaRef => schemaRef.links || []);

    const models = {};

    await Promise.all(serverRelatedSchemas.map(async (serverRelatedSchema) => {
      const schemaUrl = typeof serverRelatedSchema.targetSchema === 'object' ? serverRelatedSchema.targetSchema.$ref : serverRelatedSchema.targetSchema;

      const relatedSchema = await fetchJson(schemaUrl);

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
        relationships: Object.fromEntries(
            Object.entries(relatedItemSchema.definitions?.relationships?.properties || {})
              .map(([attrName, propSchema]) => {

                // https://github.com/bradjones1/orbit-schema-from-openapi/blob/cde8d885152b3d88b9352669c97099ca1c13a2ff/index.js#L160-L172
                if (propSchema.properties?.data?.type === 'array') {
                  return [attrName, {
                    kind: 'hasMany',
                    type: propSchema.properties?.data?.items?.properties?.type?.enum,
                  }];
                } else {
                  return [attrName, {
                    kind: 'hasOne',
                    type: propSchema.properties?.data?.properties?.type?.enum,
                  }];
                }

              })
        ),
      };

      this.reportProgressFn("Loading server schema", (Object.keys(models).length / serverRelatedSchemas.length) * 100);
    }));

    return models;
  }

}