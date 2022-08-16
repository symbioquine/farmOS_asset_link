/* eslint-disable no-unused-vars */

/**
 *
 * @interface
 */
export default class IAssetLinkPlugin {}

/**
 * Called when a plugin is first loaded.
 *
 * @static
 * @method IAssetLinkPlugin.onLoad
 * @param {IAssetLinkPluginHandle} handle An object which is
 *   used to tell Asset Link what functionality this plugin
 *   provides.
 * @param {IAssetLink} assetLink The asset link instance.
 */
IAssetLinkPlugin.onLoad = function (handle, assetLink) {};

/**
 * Called (possibly twice) as part of each search request.
 *
 * @static
 * @method IAssetLinkPlugin.searchAssets
 * @param {IAssetLink} assetLink The asset link instance.
 * @param {Object} searchRequest An object with varying structure produced by
 *   a search method plugin.
 * @param {String} searchPhase One of "local" or "remote" to indicate
 *   whether the current search phase should use `assetLink.entitySource.cache`
 *   or `assetLink.entitySource` for a offline or and online asset search
 *   respectively.
 */
IAssetLinkPlugin.searchAssets = function (
  assetLink,
  searchRequest,
  searchPhase
) {};
