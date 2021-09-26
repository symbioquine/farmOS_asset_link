/**
 * 
 * @interface
 */
export default class IAssetLinkPlugin {

  /**
   * Called when a plugin is first loaded.
   */
  onLoad(handle, assetLink) {
    
  }

}

/**
 * 
 * @interface
 */
class IAssetLinkPluginHandle {

  defineRoute(routeName, routeDefiner) {}

  defineAction(actionId, actionDefiner) {}

  defineMetaAction(actionId, actionDefiner) {}

  defineConfigAction(actionId, actionDefiner) {}

}
