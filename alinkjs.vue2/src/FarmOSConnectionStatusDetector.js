import Vue from 'vue';
import fetch from 'cross-fetch';
import throttle from '@jcoreio/async-throttle'
import createDrupalUrl from '@/createDrupalUrl';

/**
 * Responsible for detecting online/offline/login status
 * for our connection to the farmOS server both through
 * self-initiated polling and by observing the outcome of
 * decorated fetch requests.
 * 
 * @implements {IHttpFetcher}
 */
const FarmOSConnectionStatusDetector = Vue.extend({

  props: {
    fetcherDelegate: {
      type: Object,
      default: function () {
        return { fetch: fetch };
      }
    }
  },

  data() {
    return {
      $_running: false,
      $_barrier: new Barrier(),

      hasNetworkConnection: window.navigator.onLine,
      canReachFarmOS: undefined,
      isLoggedIn: undefined,
    };
  },

  created() {
    window.addEventListener('offline', () => {
      this.hasNetworkConnection = false;
      this.canReachFarmOS = false;
    });
    window.addEventListener('online', () => {
      this.hasNetworkConnection = true;
      this.$data.$_barrier.release();
    });
    if (window.navigator && window.navigator.connection) {
      window.navigator.connection.addEventListener('change', () => this.$data.$_barrier.release());
    }
    this.$_mainLoop();
  },

  computed: {
    isOnline() {
      return this.canReachFarmOS && this.isLoggedIn;
    },
  },

  beforeDestroy() {
    this.$data.$_running = false;
    this.$data.$_barrier.release();
  },

  methods: {

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
          this.$data.$_barrier.release();
        }
        return res;
      } catch (error) {
        if (isFarmOSRequest) {
          this.$data.$_barrier.release();
        }
        throw error;
      }
    },

    async $_mainLoop() {
      this.$data.$_running = true;

      const checkConnectionStatus = throttle(() => this.$_checkConnectionStatus(), 1000);

      while (this.$data.$_running) {
        await checkConnectionStatus();
        await this.$data.$_barrier.arrive(60 * 1000);
      }
    },

    async $_checkConnectionStatus() {
      if (!this.hasNetworkConnection) {
        return;
      }

      const apiUrl = createDrupalUrl(`api?cacheBust=${currentEpochSecond()}`);

      try {
        const res = await fetch(apiUrl, {credentials: 'same-origin', cache: 'no-cache'});

        if (res.status !== 200) {
          this.canReachFarmOS = false;
          return;
        }

        const apiData = await res.json();

        const farmOsVersion = apiData.meta?.farm?.version;

        if (farmOsVersion !== '2.x') {
          this.canReachFarmOS = false;
          return;
        }

        this.canReachFarmOS = true;

        const userRef = apiData.meta?.links?.me?.href;

        this.isLoggedIn = userRef !== undefined
      } catch (error) {
        this.canReachFarmOS = false;
      }
    },
  },

});

function sleep(millis) {
  return new Promise(resolve => setTimeout(resolve, millis));
}

function currentEpochSecond() {
  return parseInt(new Date().getTime() / 1000);
}

class Barrier {
  constructor() {
    this.waiting = [];
  }

  arrive(timeoutMillis) {
    return Promise.race([
      sleep(timeoutMillis),
      new Promise(resolve => this.waiting.push(resolve)),
    ]);
  }

  release() {
    const toBeReleased = this.waiting.splice(0);
    toBeReleased.forEach(p => p());
  }
}

export default FarmOSConnectionStatusDetector;
