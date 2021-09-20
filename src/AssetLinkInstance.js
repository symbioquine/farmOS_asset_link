export default class AssetLinkInstance {

  constructor() {
    this.plugins = [];
  }

  registerPlugin(plugin) {
    this.plugins.push(plugin);
  }

  async resolveAsset(assetRef) {
    if (!assetRef) {
      return undefined;
    }

    const assetResolvingPlugins = this.plugins.filter(p => typeof p.tryResolveAsset === 'function');

    for (let i = 0; i < assetResolvingPlugins.length; i += 1) {
      const plugin = assetResolvingPlugins[i];

      /* eslint-disable no-await-in-loop */
      const asset = await plugin.tryResolveAsset(assetRef);

      if (asset) {
        return asset;
      }
    }

    return undefined;
  }

  getRelevantActions(asset) {
    const actionProvidingPlugins = this.plugins.filter(p => typeof p.getRelevantActions === 'function');

    const actions = actionProvidingPlugins.flatMap(p => p.getRelevantActions(asset));

    return actions;
  }

  /* eslint-disable class-methods-use-this */
  enqueueAction({ label, requests }) {
    /* eslint-disable no-console */
    console.log('AssetLinkInstance::enqueueAction() called');
  }

}
