import { currentEpochSecond, EventBus } from "assetlink-plugin-api";

export default class AssetLinkLocalPluginStorageCore {

  constructor(assetLink) {
    this._store = assetLink._store;
    this._eventBus = new EventBus();
  }

  /**
   * An async event bus used to signal when routes are added/removed.
   */
  get eventBus() {
    return this._eventBus;
  }

  async boot() {
    // TODO: ?
  }

  async readLocalPlugin(url, opts) {
    const options = opts || {};

    this._validateUrl(url);

    const storeKey = "asset-link-local-plugin-src:" + url.pathname.replace(/^(\/?\/asset-link)\/data\//,"");

    const storeItem = await this._store.getItem(storeKey);

    if (!storeItem) {
      throw new Error(`Missing local plugin data for: ${url.toString()}`);
    }

    return storeItem.value;
  }

  async writeLocalPlugin(url, pluginSrc, opts) {
    const options = opts || {};

    this._validateUrl(url);

    const storeKey = "asset-link-local-plugin-src:" + url.pathname.replace(/^(\/?\/asset-link)\/data\//,"");

    const timestamp = currentEpochSecond();

    const pluginDataUrl = "data:application/javascript;base64," + btoa(pluginSrc);

    await this._store.setItem(storeKey, {key: storeKey, timestamp, value: pluginDataUrl});

    await this._eventBus.$emit('update-plugin', url);
  }

  _validateUrl(url) {
    if (/^indexeddb:\/\/asset-link\/data\/.*/.test(url.toString())) {
      return;
    }
    throw new Error(`Unsupported local plugin URL: ${url.toString()}`);
  }

}
