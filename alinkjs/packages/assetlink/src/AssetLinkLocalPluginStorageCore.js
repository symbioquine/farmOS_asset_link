import { Buffer } from 'buffer/';

import { currentEpochSecond, EventBus } from "assetlink-plugin-api";

const OLD_PLUGIN_DATA_URL_PREFIX = "data:application/javascript;base64,";
const PLUGIN_DATA_URL_PREFIX = "data:application/octet-stream;base64,";

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

  async halt() {
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

    // Rewrite old data urls into new binary compatible format
    if (storeItem.value.startsWith(OLD_PLUGIN_DATA_URL_PREFIX)) {
      const rawPluginSource = Buffer.from(storeItem.value.substring(OLD_PLUGIN_DATA_URL_PREFIX.length), 'base64');

      const updatedPluginDataUrl = PLUGIN_DATA_URL_PREFIX + rawPluginSource.toString('base64');

      await this._store.setItem(storeKey, {key: storeKey, timestamp: storeItem.timestamp, value: updatedPluginDataUrl});

      return updatedPluginDataUrl;
    }

    return storeItem.value;
  }

  async writeLocalPlugin(url, pluginSrc, opts) {
    const options = opts || {};

    this._validateUrl(url);

    const storeKey = "asset-link-local-plugin-src:" + url.pathname.replace(/^(\/?\/asset-link)\/data\//,"");

    const timestamp = currentEpochSecond();

    const pluginDataUrl = PLUGIN_DATA_URL_PREFIX + Buffer.from(pluginSrc, 'utf8').toString('base64');

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
