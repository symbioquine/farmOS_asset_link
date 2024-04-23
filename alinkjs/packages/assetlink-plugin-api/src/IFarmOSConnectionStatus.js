/* eslint-disable no-unused-vars */

/**
 * An object which exposes the current connection status with farmOS and general information about the apps online/offline state.
 *
 * @interface
 * @property {Boolean} hasNetworkConnection Does a network connection exist?
 * @property {Boolean} canReachFarmOS Can the app reach farmOS?
 * @property {Boolean} isLoggedIn Is the app currently logged in as a farmOS user?
 * @property {Boolean} isOnline Is the app both logged in and able to reach farmOS?
 * @property {String} userId The UUID of the currently logged in farmOS user
 * @property {String} farmName The most recent observed farmOS instance name since Asset Link booted
 * @property {String} farmOSVersion The most recent observed farmOS version since Asset Link booted
 * @property {String} systemOfMeasurement The most recent observed farmOS system of measurement since Asset Link booted
 */
export default class IFarmOSConnectionStatus {}
