import { reactive } from 'vue';

import createDrupalUrl from '@/createDrupalUrl';
import currentEpochSecond from '@/util/currentEpochSecond';
import EventBus from '@/util/EventBus';
import HttpAccessDeniedException from '@/HttpAccessDeniedException';

export default class AssetLinkPluginListsCore {

  constructor(assetLink) {
    this._store = assetLink._store;

    this._vm = reactive({
      lists: [],
    });

    this._eventBus = new EventBus();

    this._pluginReferenceTracker = new PluginReferenceTracker(this._eventBus);

    this._defaultPluginList = new HttpPluginList(
        assetLink._store, 
        createDrupalUrl('/alink/backend/default-plugins.repo.json'),
        this._pluginReferenceTracker,
        true,
    );
    this._localPluginList = new LocalPluginList(
        assetLink._store,
        this._pluginReferenceTracker,
    );
    this._extraPluginLists = [];

    this._extraPluginListStoreKey = 'asset-link-extra-plugin-lists';
  }

  /**
   * A {Vue} instance used to expose some of this core's state to
   * the UI in a reactive way.
   */
  get vm() {
    return this._vm;
  }

  /**
   * An async event bus used to signal when plugins are added/removed.
   */
  get eventBus() {
    return this._eventBus;
  }

  async boot() {
    const extraPluginListUrls = await this._getExtraPluginListUrls();

    this._extraPluginLists = extraPluginListUrls.map(pluginListUrl =>
      new HttpPluginList(this._store, pluginListUrl, this._pluginReferenceTracker, false));

    for (let pluginList of [
          this._defaultPluginList,
          this._localPluginList,
          ...this._extraPluginLists,
        ]) {

      const pluginListView = await pluginList.load();

      this._updatePluginListViewInViewModel(pluginListView);
    }
  }

  async addPluginToLocalList(pluginUrl) {
    const pluginListView = await this._localPluginList.addPlugin(pluginUrl);

    this._updatePluginListViewInViewModel(pluginListView);
  }

  async removePluginFromLocalList(pluginUrl) {
    const pluginListView = await this._localPluginList.removePlugin(pluginUrl);

    this._updatePluginListViewInViewModel(pluginListView);
  }

  async addExtraPluginList(pluginListUrl) {
    this._modifyAndWriteStoredExtraPluginListUrls(extraPluginListUrls => {
      const idx = extraPluginListUrls.findIndex(plUrl => plUrl === pluginListUrl);
      if (idx >= 0) {
        return false;
      }
      extraPluginListUrls.push(pluginListUrl);
    });

    const pluginListIndex = this._extraPluginLists.findIndex(pl => pl._url === pluginListUrl);

    if (pluginListIndex >= 0) {
      return;
    }

    const pluginList = new HttpPluginList(this._store, pluginListUrl, this._pluginReferenceTracker, false);

    this._extraPluginLists.push(pluginList);

    const pluginListView = await pluginList.load();

    this._updatePluginListViewInViewModel(pluginListView);
  }

  async removeExtraPluginList(pluginListUrl) {
    this._modifyAndWriteStoredExtraPluginListUrls(extraPluginListUrls => {
      const idx = extraPluginListUrls.findIndex(plUrl => plUrl === pluginListUrl);
      if (idx < 0) {
        return false;
      }
      extraPluginListUrls.splice(idx, 1);
    });

    const pluginListIndex = this._extraPluginLists.findIndex(pl => pl._url === pluginListUrl);

    if (pluginListIndex < 0) {
      return;
    }

    const pluginList = this._extraPluginLists.splice(pluginListIndex, 1)[0];

    await pluginList.unload();

    this._removePluginListViewFromViewModel(pluginListUrl);
  }

  async reloadPluginList(pluginListUrl) {
    const pluginList = [
      this._defaultPluginList,
      this._localPluginList,
      ...this._extraPluginLists,
    ].find(pl => pl._url === pluginListUrl);

    if (!pluginList) {
      return;
    }

    const pluginListView = await pluginList.reload();

    this._updatePluginListViewInViewModel(pluginListView);
  }

  async _getExtraPluginListUrls() {
    const pluginListUrlsItem = await this._store.getItem(this._extraPluginListStoreKey);

    if (pluginListUrlsItem) {
      return pluginListUrlsItem.value.map(u => new URL(u));
    }

    return [];
  }

  async _modifyAndWriteStoredExtraPluginListUrls(mutatorFn) {
    const pluginListUrls = await this._getExtraPluginListUrls();
    const shouldWrite = mutatorFn(pluginListUrls) !== false;
    if (shouldWrite) {
      await this._store.setItem(this._extraPluginListStoreKey, {key: this._extraPluginListStoreKey, timestamp: currentEpochSecond(), value: pluginListUrls});
    }
    return pluginListUrls;
  }

  _updatePluginListViewInViewModel(pluginListView) {
    const vm = this.vm;

    const plVIndex = vm.lists.findIndex(plV => plV.sourceUrl === pluginListView.sourceUrl);

    if (plVIndex >= 0) {
      vm.lists.splice(plVIndex, 1, pluginListView);
    } else {
      vm.lists.push(pluginListView);
    }
  }

  _removePluginListViewFromViewModel(pluginListUrl) {
    const vm = this.vm;

    const plVIndex = vm.lists.findIndex(plV => plV.sourceUrl === pluginListUrl);

    if (plVIndex >= 0) {
      vm.lists.splice(plVIndex, 1);
    }
  }

}

class PluginReferenceTracker {
  constructor(eventBus) {
    this._eventBus = eventBus;

    // Track which lists reference a given plugin by keeping
    // a mapping between the plugin url and the list urls which
    // reference it.
    this._pluginReferences = {
        // 'https://example.com/alink-plugins/MyAwesomePlugin.alink.js': [ 'https://example.com/cool-alink-plugins.repo.json' ],
    };
  }

  async ackPluginReference(pluginUrl, listUrl) {
    const pluginExists = Object.hasOwn(this._pluginReferences, pluginUrl.toString());

    if (!pluginExists) {
      this._pluginReferences[pluginUrl.toString()] = [];
    }

    const pluginReferences = this._pluginReferences[pluginUrl.toString()];

    const listIdx = pluginReferences.indexOf(listUrl.toString());

    if (listIdx < 0) {
      pluginReferences.push(listUrl);
    }

    if (!pluginExists) {
      await this._eventBus.$emit('add-plugin', pluginUrl);
    }
  }

  /* eslint-disable no-console */
  async freePluginReference(pluginUrl, listUrl) {
    const pluginReferences = this._pluginReferences[pluginUrl.toString()];

    if (!pluginReferences) {
      console.log('freePluginReference unexpectedly found plugin missing from internal reference tracking', pluginUrl.toString(), listUrl.toString(), JSON.stringify(this._pluginReferences));
      return;
    }

    const listIdx = pluginReferences.indexOf(listUrl.toString());

    if (listIdx >= 0) {
      pluginReferences.splice(listIdx, 1);
    } else {
      console.log('freePluginReference unexpectedly found plugin without expected reference', pluginUrl.toString(), listUrl.toString(), JSON.stringify(pluginReferences));
    }

    if (pluginReferences.length > 0) {
      return;
    }

    await this._eventBus.$emit('remove-plugin', pluginUrl);
  }
}

class HttpPluginList {
  constructor(store, url, pluginReferenceTracker, isDefault) {
    this._store = store;
    this._storeKey = `asset-link-cached-plugin-list:${url}`;
    this._url = url;
    this._pluginReferenceTracker = pluginReferenceTracker;
    this._isDefault = isDefault;
    this._isLocal = false;

    this._latestPluginListView = undefined;
  }

  async load(skipCache) {
    this._latestPluginListView = postProcessPluginList(await this._getHttpPluginList(skipCache), this._isDefault, this._isLocal, this._url);

    await Promise.all(this._latestPluginListView.plugins.map(pRef => this._pluginReferenceTracker.ackPluginReference(pRef.url, this._url)));

    return this._latestPluginListView;
  }

  async unload() {
    if (!this._latestPluginListView) {
      return;
    }

    await Promise.all(this._latestPluginListView.plugins.map(pRef => this._pluginReferenceTracker.freePluginReference(pRef.url, this._url)));

    await this._store.removeItem(this._storeKey);
  }

  async reload() {
    return await this.load(true);
  }

  async _getHttpPluginList(skipCache) {
    const cacheItem = skipCache ? undefined : await this._store.getItem(this._storeKey);

    const timestamp = currentEpochSecond();

    if (cacheItem && (timestamp - cacheItem.timestamp) < 900) {
      return cacheItem.value;
    }

    const pluginListRes = await fetch(this._url);

    console.log(pluginListRes);
    if (pluginListRes.status === 403) {
      throw new HttpAccessDeniedException(`HTTP Error ${pluginListRes.status}: ${pluginListRes.statusText}`);
    } else if (!pluginListRes.ok) {
      throw new Error(`HTTP Error ${pluginListRes.status}: ${pluginListRes.statusText}`);
    }

    const pluginList = await pluginListRes.json();

    await this._store.setItem(this._storeKey, {key: this._storeKey, timestamp, value: pluginList});

    return pluginList;
  }

}

class LocalPluginList {
  constructor(store, pluginReferenceTracker) {
    this._store = store;
    this._storeKey = 'local-plugin-list.repo.json';
    this._url = new URL("indexeddb://asset-link/data/local-plugin-list.repo.json", window.location.origin);
    this._isDefault = false;
    this._isLocal = true;
    this._pluginReferenceTracker = pluginReferenceTracker;
  }

  async load() {
    const pluginListView = postProcessPluginList(await this._getLocalPluginList(), this._isDefault, this._isLocal, this._url);

    await Promise.all(pluginListView.plugins.map(pRef => this._pluginReferenceTracker.ackPluginReference(pRef.url, this._url)));

    return pluginListView;
  }

  async reload() {
    return await this.load();
  }

  async addPlugin(pluginUrl) {
    const pluginList = await this._modifyAndWriteStoredList(pl => {
      if (pl.plugins.find(pRef => pRef.url === pluginUrl.toString())) {
        return false;
      }
      pl.plugins.push({ url: pluginUrl.toString() });
    });

    await this._pluginReferenceTracker.ackPluginReference(pluginUrl, this._url);

    return postProcessPluginList(pluginList, this._isDefault, this._isLocal, this._url);
  }

  async removePlugin(pluginUrl) {
    const pluginList = await this._modifyAndWriteStoredList(pl => {
      const pluginIndex = pl.plugins.findIndex(pRef => pRef.url === pluginUrl.toString())

      if (pluginIndex < 0) {
        return false;
      }

      pl.plugins.splice(pluginIndex, 1);
    });

    await this._pluginReferenceTracker.freePluginReference(pluginUrl, this._url);

    return postProcessPluginList(pluginList, this._isDefault, this._isLocal, this._url);
  }

  async _getLocalPluginList() {
    const pluginListItem = await this._store.getItem(this._storeKey);

    if (!pluginListItem) {
      return { plugins: [] };
    }

    return pluginListItem.value;
  }

  async _modifyAndWriteStoredList(mutatorFn) {
    const pluginList = await this._getLocalPluginList();
    const shouldWrite = mutatorFn(pluginList) !== false;
    if (shouldWrite) {
      await this._store.setItem(this._storeKey, {key: this._storeKey, timestamp: currentEpochSecond(), value: pluginList});
    }
    return pluginList;
  }
}

const postProcessPluginList = (pluginList, isDefault, isLocal, sourceUrl) => {
  pluginList.isDefault = isDefault;
  pluginList.isLocal = isLocal;
  pluginList.sourceUrl = sourceUrl;

  if (!pluginList.error) {
    pluginList.error = undefined;
  }

  if (!pluginList.plugins) {
    pluginList.plugins = [];
  }

  pluginList.plugins = pluginList.plugins.map(pluginRef => {
    // Resolve relative paths on this server, but still allow for
    // arbitrary absolute/third-party urls
    const pluginUrl = new URL(pluginRef.url, isLocal ? window.location.origin : pluginList.sourceUrl);

    return {
      url: pluginUrl,
    };
  });

  return pluginList;
};
