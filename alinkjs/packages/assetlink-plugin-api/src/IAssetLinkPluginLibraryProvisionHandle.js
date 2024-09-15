/* eslint-disable no-unused-vars */

/**
 * An object which is passed into the method a plugin provides for providing a
 * plugin library via {@link IAssetLinkPluginHandle#provideLibrary}.
 *
 * @interface
 */
export default class IAssetLinkPluginLibraryProvisionHandle {}

/**
 * Specify the version for this plugin-provided library.
 *
 * ### Usage
 *
 * ```js
 * library.version('1.2.3');
 * ```
 *
 * @method IAssetLinkPluginLibraryProvisionHandle#version
 * @param {String} rawLibraryVersion the semantic version string of the library - defaults
 *   to '0.0.1-alpha.1' if this is not called.
 */
IAssetLinkPluginLibraryProvisionHandle.prototype.version = function (
  rawLibraryVersion
) {};

/**
 * Specify the object for this plugin-provided library.
 *
 * ### Usage
 *
 * ```js
 * library.provides(libraryA);
 * ```
 *
 * @method IAssetLinkPluginLibraryProvisionHandle#provides
 * @param {Object|external:Promise} libraryObject the library object to be exposed or a promise that resolves
 *   to it.
 */
IAssetLinkPluginLibraryProvisionHandle.prototype.provides = function (
  libraryObject
) {};
