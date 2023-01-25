import { ref, computed } from 'vue';
import fetch from 'cross-fetch';
import throttle from '@jcoreio/async-throttle'
import { createDrupalUrl } from "assetlink-plugin-api";

import Barrier from '@/Barrier';

const DEFAULT_FETCHER_DELEGATE = { fetch };

/**
 * Responsible for detecting online/offline/login status
 * for our connection to the farmOS server both through
 * self-initiated polling and by observing the outcome of
 * decorated fetch requests.
 * 
 * @implements {IHttpFetcher}
 */
export default class FarmOSConnectionStatusDetector {

  constructor(opts) {
    const options = opts || {};
    this.fetcherDelegate = options.fetcherDelegate || DEFAULT_FETCHER_DELEGATE;

    this.$_running = false;
    this.$_barrier = new Barrier(true);

    this.hasNetworkConnection = ref(window.navigator.onLine);
    this.canReachFarmOS = ref(null);
    this.userRef = ref(null);
    this.isLoggedIn = computed(() => this.userRef.value !== undefined);
    this.userId = computed(() => {
      return this.userRef.value && this.userRef.value.split('/').pop();
    });
    this.isOnline = computed(() => {
      return this.canReachFarmOS.value && this.isLoggedIn.value;
    });
  }

  start() {
    window.addEventListener('offline', () => {
      this.hasNetworkConnection.value = false;
      this.canReachFarmOS.value = false;
    });
    window.addEventListener('online', () => {
      this.hasNetworkConnection.value = true;
      this.$_barrier.release();
    });
    if (window.navigator && window.navigator.connection) {
      window.navigator.connection.addEventListener('change', () => this.$_barrier.release());
    }
    this.$_mainLoop();
  }

  stop() {
    this.$_running = false;
    this.$_barrier.release();
  }

  /**
   * Decorate fetch requests to detect connection/authentication problems with
   * requests that are already being sent.
   */
  async fetch(url, opts) {
    const options = opts || {};

    if (!options.method) options.method = 'GET';

    const requestUrl = new URL(url, window.location.origin + window.assetLinkDrupalBasePath);

    const isFarmOSRequest = requestUrl.host === window.location.host && requestUrl.pathname.startsWith(window.assetLinkDrupalBasePath);

    try {
      const res = await this.fetcherDelegate.fetch(url, options);
      if (isFarmOSRequest && res.status === 403) {
        this.$_barrier.release();
      }
      return res;
    } catch (error) {
      if (isFarmOSRequest) {
        this.$_barrier.release();
      }
      throw error;
    }
  }

  async $_mainLoop() {
    this.$_running = true;

    const checkConnectionStatus = throttle(() => this.$_checkConnectionStatus(), 1000);

    while (this.$_running) {
      await checkConnectionStatus();
      await this.$_barrier.arrive(60 * 1000);
    }
  }

  async $_checkConnectionStatus() {
    if (!this.hasNetworkConnection.value) {
      return;
    }

    const apiUrl = createDrupalUrl(`api?cacheBust=${currentEpochSecond()}`);

    try {
      const res = await this.fetcherDelegate.fetch(apiUrl, { credentials: 'same-origin', cache: 'no-cache', 'X-Skip-Cache': "1" });

      if (res.status !== 200) {
        this.canReachFarmOS.value = false;
        return;
      }

      const apiData = await res.json();

      const farmOsVersion = apiData.meta?.farm?.version;

      if (typeof farmOsVersion !== 'string' || farmOsVersion.indexOf('2') !== 0) {
        this.canReachFarmOS.value = false;
        return;
      }

      this.canReachFarmOS.value = true;

      this.userRef.value = apiData.meta?.links?.me?.href;
    } catch (error) {
      this.canReachFarmOS.value = false;
    }
  }

}

function currentEpochSecond() {
  return parseInt(new Date().getTime() / 1000);
}
