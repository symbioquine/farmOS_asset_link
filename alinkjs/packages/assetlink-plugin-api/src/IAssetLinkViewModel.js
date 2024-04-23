/* eslint-disable no-unused-vars */

/**
 * A [Vue reactive object](https://vuejs.org/guide/essentials/reactivity-fundamentals.html#reactive)
 * containing some key state - including booting status of Asset Link and meta information about the instance of farmOS.
 *
 * @interface
 * @property {Boolean} booted Whether Asset Link is done booting
 * @property {Number} bootProgress A number between 0 and 100 indicating how close to booted Asset Link is
 * @property {String} bootText A status text indicating the current booting step
 * @property {Boolean} bootFailed Whether Asset Link failed to boot
 * @property {Object[]} pendingQueries The current list of pending Orbit.js queries
 * @property {Object[]} pendingUpdates The current list of pending Orbit.js data updates
 * @property {Object[]} failedUpdates The list of failed Orbit.js data updates
 * @property {Object[]} messages A list of status messages to be surfaced in Asset Link
 * @property {String} farmName The most recent observed farmOS instance name when Asset Link was last connected to the server
 * @property {String} farmOSVersion The most recent observed farmOS version when Asset Link was last connected to the server
 * @property {String} systemOfMeasurement The most recent observed farmOS system of measurement when Asset Link was last connected to the server
 */
export default class IAssetLinkViewModel {}