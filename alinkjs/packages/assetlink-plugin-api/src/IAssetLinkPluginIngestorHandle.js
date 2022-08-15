/* eslint-disable no-unused-vars */

/**
 * An object which is passed into the method a plugin provides for declaring a
 * plugin ingestor via {@link IAssetLinkPluginHandle#definePluginIngestor}.
 *
 * @interface
 */
export default class IAssetLinkPluginIngestorHandle {
}

/**
 * @callback pluginIngestorFn
 * @param  {IAssetLinkPlugin} plugin - The ingested plugin
 */

/**
 * Specify the component for this plugin-provided route.
 * 
 * ### Usage
 * 
 * ```js
 * pluginIngestor.onEveryPlugin(plugin => {
 *
 *   handle.onBehalfOf(plugin, attributedHandle => {
 *     // Asset Link will manage the lifecycle of routes/slots/etc defined via `attributedHandle`
 *   });
 *
 * });
 * ```
 *
 * @method IAssetLinkPluginIngestorHandle#onEveryPlugin
 * @param {pluginIngestorFn} ingestorFn The function which accepts each loaded plugin
 */
IAssetLinkPluginIngestorHandle.prototype.onEveryPlugin = function(ingestorFn) {
};