/**
 * A decorator for the AssetLink class which exposes the same properties/methods, but
 * holds no state and thus can be frozen using `Object.freeze`. This prevents Vue
 * crawling/reacting on our whole in-memory entity storage - which would be expensive.
 */
export default class NonReactiveAssetLinkDecorator {

  constructor(getDelegateFn) {
    this.delegate = getDelegateFn;
  }

  get app() {
    return this.delegate().app;
  }

  get viewModel() {
    return this.delegate().viewModel;
  }

  get ui() {
    return this.delegate().ui;
  }

  get util() {
    return this.delegate().util;
  }

  get cores() {
    return this.delegate().cores;
  }

  get entitySource() {
    return this.delegate().memory;
  }

  get remoteEntitySource() {
    return this.delegate().remote;
  }

  get booted() {
    return this.delegate().booted;
  }

  get plugins() {
    return this.delegate().plugins;
  }

  async boot() {
    return await this.delegate().boot();
  }

  async getEntityModel(typeName) {
    return await this.delegate().getEntityModel(typeName);
  }

  registerPlugin(plugin) {
    return this.delegate().registerPlugin(plugin);
  }

  defineRoute(routeName, routeDefiner) {
    return this.delegate().defineRoute(routeName, routeDefiner);
  }

  defineAction(actionId, actionDefiner) {
    return this.delegate().defineAction(actionId, actionDefiner);
  }

  defineMetaAction(actionId, actionDefiner) {
    return this.delegate().defineMetaAction(actionId, actionDefiner);
  }

  defineConfigAction(actionId, actionDefiner) {
    return this.delegate().defineConfigAction(actionId, actionDefiner);
  }

  async getAssetTypes() {
    return await this.delegate().getAssetTypes();
  }

  async resolveAsset(assetRef) {
    return await this.delegate().resolveAsset(assetRef);
  }

  searchAssets(searchRequest, searchPhase) {
    return this.delegate().searchAssets(searchRequest, searchPhase);
  }

  getRelevantActions(asset) {
    return this.delegate().getRelevantActions(asset);
  }

  getRelevantMetaActions(asset) {
    return this.delegate().getRelevantMetaActions(asset);
  }

  getRelevantConfigActions(route) {
    return this.delegate().getRelevantConfigActions(route);
  }

}

NonReactiveAssetLinkDecorator.decorate = function(delegate) {
  return Object.freeze(new NonReactiveAssetLinkDecorator(() => delegate));
}
