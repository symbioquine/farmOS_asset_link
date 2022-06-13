import {
  setCacheNameDetails,
} from 'workbox-core';
import {
  precacheAndRoute,
  getCacheKeyForURL,
} from 'workbox-precaching';
import {
  registerRoute,
  setDefaultHandler,
  setCatchHandler,
} from 'workbox-routing';
import {
  CacheFirst,
  NetworkOnly,
} from 'workbox-strategies';

// define a prefix for your cache names. It is recommended to use your project name
setCacheNameDetails({prefix:  "asset-link"});

// Start of Precaching##########################
precacheAndRoute(self.__WB_MANIFEST);
// End of Precaching############################

// Start of CacheFirst Strategy##################
// all the api request which matches the following pattern will use CacheFirst strategy for caching
registerRoute(/https:\/\/.*\.repo\.json/, new CacheFirst());
registerRoute(/https:\/\/.*\.alink\..*/, new CacheFirst());
registerRoute(/https:\/\/.*\/api\/?.*/, new NetworkOnly());
// End of CacheFirst Strategy####################

setDefaultHandler(new CacheFirst());

setCatchHandler( async ({event}) => {
  const url = new URL(event.request.url);

  console.log('You should be able to see this message in the console if setCatchHandler is called', url, JSON.stringify(event), "/__THIS_GETS_REPLACED_AT_RUNTIME_BY_THE_DRUPAL_CONTROLLER__/");

  // Don't handle alink backend urls
  if (url.pathname.startsWith("/__THIS_GETS_REPLACED_AT_RUNTIME_BY_THE_DRUPAL_CONTROLLER__/backend/")) {
    return Response.error();
  }

  // Return js/css from our cache
  if (url.pathname.startsWith("/__THIS_GETS_REPLACED_AT_RUNTIME_BY_THE_DRUPAL_CONTROLLER__/js/") ||
      url.pathname.startsWith("/__THIS_GETS_REPLACED_AT_RUNTIME_BY_THE_DRUPAL_CONTROLLER__/css/")) {
    const resp = await caches.match(getCacheKeyForURL(url.pathname));
    console.log("returning js/css:", resp);
    if (!resp) {
      return Response.error();
    }
    return resp;
  }

  // Handle the SPA routing such that the index.html entry-point is served from the cache when offline - even for pages that haven't been navigated to.
  // This allows our application-layer asset/log pre-caching to work.
  if (url.pathname.startsWith("/__THIS_GETS_REPLACED_AT_RUNTIME_BY_THE_DRUPAL_CONTROLLER__/")) {
    const resp = await caches.match(getCacheKeyForURL('/__THIS_GETS_REPLACED_AT_RUNTIME_BY_THE_DRUPAL_CONTROLLER__/index.html'));
    console.log("returning:", resp);
    return resp;
  }

  return Response.error();
});
