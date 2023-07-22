import { createAlinkUrl, currentEpochSecond } from "assetlink-plugin-api";


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

    const models = await fetchJson(createAlinkUrl('/backend/models.json'));

    return models;
  }

}