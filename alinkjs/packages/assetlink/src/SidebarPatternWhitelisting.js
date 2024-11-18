const WHITELIST_LOCALSTORAGE_KEY = 'alink-sidebar-local-whitelist-patterns';

/**
 * Keeps track of sidebar URL whitelist patterns by plugin and synchronizes
 * those patterns to local storage upon changes.
 */
export default class SidebarPatternWhitelisting {
  constructor(opts) {
    this._whitelist = SidebarPatternWhitelisting.readAllEntriesFromStorage();
  }

  clearEntriesForPlugin(pluginUrl) {
    this.updateEntriesForPlugin(pluginUrl, []);
  }

  updateEntriesForPlugin(pluginUrl, whitelistEntries) {
    if (!whitelistEntries || !whitelistEntries.length) {
      delete this._whitelist[pluginUrl.toString()];
    } else {
      this._whitelist[pluginUrl.toString()] = whitelistEntries.map(entry => [entry.source, entry.flags]);
    }
    this.writeAllEntriesToStorage();
  }

  writeAllEntriesToStorage() {
    localStorage.setItem(WHITELIST_LOCALSTORAGE_KEY, JSON.stringify(this._whitelist));
  }

  static readAllEntriesFromStorage() {
    const entriesJson = localStorage.getItem(WHITELIST_LOCALSTORAGE_KEY);

    if (!entriesJson) {
      return {};
    }

    return JSON.parse(entriesJson);
  }
}
