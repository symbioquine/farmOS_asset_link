/**
 * Core of the larger Asset Link application and API entry-point for plugins.
 * 
 * TODO: Break out some of the responsibilities of this class into classes that can be
 * delegated to. e.g. plugin management, entities CRUD, etc.
 */
export default class AssetLink {

  constructor(rootComponent, devToolsApi) {
    this._rootComponent = rootComponent;
    this._devToolsApi = devToolsApi;
  }

  /* eslint-disable no-console,no-unused-vars */
  async boot() {
    console.log("This would boot Asset Link...");
  }

}
