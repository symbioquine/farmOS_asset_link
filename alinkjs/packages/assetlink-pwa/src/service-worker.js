import { setCacheNameDetails } from "workbox-core";
import { precacheAndRoute, getCacheKeyForURL } from "workbox-precaching";
import {
  registerRoute,
  setDefaultHandler,
  setCatchHandler,
} from "workbox-routing";
import { Strategy, NetworkOnly, NetworkFirst } from "workbox-strategies";

// define a prefix for your cache names. It is recommended to use your project name
setCacheNameDetails({ prefix: "asset-link" });

// Start of Precaching##########################
precacheAndRoute(self.__WB_MANIFEST);
// End of Precaching############################

class SkipCacheAwareNetworkFirstStrategy extends Strategy {
  constructor(options) {
    super(options);
    this.networkFirst = new NetworkFirst();
    this.networkOnly = new NetworkOnly();
  }

  handleAll(options) {
    // Allow for flexible options to be passed.
    /* eslint-disable no-undef */
    if (options instanceof FetchEvent) {
      options = {
        event: options,
        request: options.request,
      };
    }

    const request =
      typeof options.request === "string"
        ? new Request(options.request)
        : options.request;

    if (request.headers["X-Skip-Cache"]) {
      return this.networkOnly.handleAll(options);
    }
    return this.networkFirst.handleAll(options);
  }
}

// Start of SkipCacheAwareNetworkFirstStrategy Strategy##################
// - Load alink plugin repos from the cache when offline
registerRoute(
  /https:\/\/.*\.repo\.json/,
  new SkipCacheAwareNetworkFirstStrategy()
);
// - Load alink plugins from the cache when offline
registerRoute(
  /https:\/\/.*\.alink\..*/,
  new SkipCacheAwareNetworkFirstStrategy()
);
// - Load farmOS-map from the cache when offline
registerRoute(
  /https:\/\/.*\/libraries\/farmOS-map\/?.*/,
  new SkipCacheAwareNetworkFirstStrategy()
);
// End of SkipCacheAwareNetworkFirstStrategy Strategy####################

// Start of NetworkOnly Strategy##################
//  - Never cache API responses
registerRoute(/https:\/\/.*\/api\/?.*/, new NetworkOnly());
// End of NetworkOnly Strategy####################

setDefaultHandler(new NetworkFirst());

setCatchHandler(async ({ event }) => {
  const url = new URL(event.request.url);

  console.log(
    "You should be able to see this message in the console if setCatchHandler is called",
    url,
    JSON.stringify(event)
  );

  // Don't handle alink backend urls
  if (
    url.pathname.startsWith(
      "/__THIS_GETS_REPLACED_AT_RUNTIME_BY_THE_DRUPAL_CONTROLLER__/backend/"
    )
  ) {
    return Response.error();
  }

  // Return alink js/css from our cache
  if (
    url.pathname.startsWith(
      "/__THIS_GETS_REPLACED_AT_RUNTIME_BY_THE_DRUPAL_CONTROLLER__/js/"
    ) ||
    url.pathname.startsWith(
      "/__THIS_GETS_REPLACED_AT_RUNTIME_BY_THE_DRUPAL_CONTROLLER__/css/"
    )
  ) {
    const resp = await caches.match(getCacheKeyForURL(url.pathname));
    console.log("returning js/css:", resp);
    if (!resp) {
      return Response.error();
    }
    return resp;
  }

  // Handle the SPA routing such that the index.html entry-point is served from the cache when offline - even for pages that haven't been navigated to.
  // This allows our application-layer asset/log pre-caching to work.
  if (
    url.pathname.startsWith(
      "/__THIS_GETS_REPLACED_AT_RUNTIME_BY_THE_DRUPAL_CONTROLLER__/"
    )
  ) {
    const resp = await caches.match(
      getCacheKeyForURL(
        "/__THIS_GETS_REPLACED_AT_RUNTIME_BY_THE_DRUPAL_CONTROLLER__/index.html"
      )
    );
    console.log("returning:", resp);
    return resp;
  }

  return Response.error();
});

// From https://dev.to/drbragg/handling-service-worker-updates-in-your-vue-pwa-1pip
self.addEventListener("message", async (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
  if (event.data && event.data.type === "CLEAR_ALL_CACHES") {
    const cacheKeys = await caches.keys();
    for (const key of cacheKeys) {
      caches.delete(key);
    }
    await self.registration.unregister();
  }
});
