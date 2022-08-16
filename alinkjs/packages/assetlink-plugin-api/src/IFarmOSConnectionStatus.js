/* eslint-disable no-unused-vars */

/**
 * An object which exposes the current connection status with farmOS and general information about the apps online/offline state.
 *
 * @interface
 * @property {Boolean} hasNetworkConnection Does a network connection exist?
 * @property {Boolean} canReachFarmOS Can the app reach farmOS?
 * @property {Boolean} isLoggedIn Is the app currently logged in as a farmOS user?
 * @property {Boolean} isOnline Is the app both logged in and able to reach farmOS?
 */
export default class IFarmOSConnectionStatus {}
