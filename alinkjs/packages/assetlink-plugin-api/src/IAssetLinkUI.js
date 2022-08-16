/* eslint-disable no-unused-vars */

/**
 * UI components/methods exposed for Asset Link plugins.
 *
 * @interface
 * @property {IAssetLinkUIDialogs} dialog Convenience methods for creating various kinds of Dialogs
 */
export default class IAssetLinkUI {}

/**
 * Provides a thin promise wrapper around Quasar dialogs.
 *
 * @method IAssetLinkUI#createDialog
 * @param {Object} opts Options passed to the Quasar Dialog plugin `Dialog#create` method.
 *   See [https://quasar.dev/quasar-plugins/dialog](https://quasar.dev/quasar-plugins/dialog).
 * @return {external:Promise} a promise that is fullfilled when the dialog is confirmed or cancelled
 *   with the result of the dialog - if any.
 */
IAssetLinkUI.prototype.createDialog = async function (opts) {};

/**
 * Convenience methods for creating various kinds of Dialogs.
 *
 * @interface
 */
class IAssetLinkUIDialogs {}

/**
 * Create a confirmation dialog.
 *
 * @method IAssetLinkUIDialogs#confirm
 * @param {String} text The confirm message text
 */
IAssetLinkUIDialogs.prototype.confirm = async function (text) {};

/**
 * Create a text input prompt dialog.
 *
 * @method IAssetLinkUIDialogs#promptText
 * @param {String} text The prompt message text
 */
IAssetLinkUIDialogs.prototype.promptText = async function (text) {};

/**
 * Create a custom dialog.
 *
 * @method IAssetLinkUIDialogs#custom
 * @param {VueComponent} component The dialog component
 * @param {Object} componentProps The dialog component props
 */
IAssetLinkUIDialogs.prototype.custom = async function (
  component,
  componentProps
) {};
