(function(){"use strict";var e={379:function(){try{self["workbox:core:6.5.2"]&&_()}catch(e){}},113:function(){try{self["workbox:precaching:6.5.2"]&&_()}catch(e){}},234:function(){try{self["workbox:routing:6.5.2"]&&_()}catch(e){}},976:function(){try{self["workbox:strategies:6.5.2"]&&_()}catch(e){}}},t={};function s(n){var r=t[n];if(void 0!==r)return r.exports;var a=t[n]={exports:{}};return e[n](a,a.exports,s),a.exports}!function(){s(379);const e=(e,...t)=>{let s=e;return t.length>0&&(s+=` :: ${JSON.stringify(t)}`),s},t=e;class n extends Error{constructor(e,s){const n=t(e,s);super(n),this.name=e,this.details=s}}const r=new Set;const a={googleAnalytics:"googleAnalytics",precache:"precache-v2",prefix:"workbox",runtime:"runtime",suffix:"undefined"!==typeof registration?registration.scope:""},i=e=>[a.prefix,e,a.suffix].filter((e=>e&&e.length>0)).join("-"),o=e=>{for(const t of Object.keys(a))e(t)},c={updateDetails:e=>{o((t=>{"string"===typeof e[t]&&(a[t]=e[t])}))},getGoogleAnalyticsName:e=>e||i(a.googleAnalytics),getPrecacheName:e=>e||i(a.precache),getPrefix:()=>a.prefix,getRuntimeName:e=>e||i(a.runtime),getSuffix:()=>a.suffix};function h(e,t){const s=new URL(e);for(const n of t)s.searchParams.delete(n);return s.href}async function l(e,t,s,n){const r=h(t.url,s);if(t.url===r)return e.match(t,n);const a=Object.assign(Object.assign({},n),{ignoreSearch:!0}),i=await e.keys(t,a);for(const o of i){const t=h(o.url,s);if(r===t)return e.match(o,n)}}let u;function d(){if(void 0===u){const t=new Response("");if("body"in t)try{new Response(t.body),u=!0}catch(e){u=!1}u=!1}return u}class f{constructor(){this.promise=new Promise(((e,t)=>{this.resolve=e,this.reject=t}))}}async function p(){for(const e of r)await e()}const g=e=>{const t=new URL(String(e),location.href);return t.href.replace(new RegExp(`^${location.origin}`),"")};function w(e){return new Promise((t=>setTimeout(t,e)))}function y(e,t){const s=t();return e.waitUntil(s),s}async function _(e,t){let s=null;if(e.url){const t=new URL(e.url);s=t.origin}if(s!==self.location.origin)throw new n("cross-origin-copy-response",{origin:s});const r=e.clone(),a={headers:new Headers(r.headers),status:r.status,statusText:r.statusText},i=t?t(a):a,o=d()?r.body:await r.blob();return new Response(o,i)}function m(e){c.updateDetails(e)}s(113);const R="__WB_REVISION__";function C(e){if(!e)throw new n("add-to-cache-list-unexpected-type",{entry:e});if("string"===typeof e){const t=new URL(e,location.href);return{cacheKey:t.href,url:t.href}}const{revision:t,url:s}=e;if(!s)throw new n("add-to-cache-list-unexpected-type",{entry:e});if(!t){const e=new URL(s,location.href);return{cacheKey:e.href,url:e.href}}const r=new URL(s,location.href),a=new URL(s,location.href);return r.searchParams.set(R,t),{cacheKey:r.href,url:a.href}}class T{constructor(){this.updatedURLs=[],this.notUpdatedURLs=[],this.handlerWillStart=async({request:e,state:t})=>{t&&(t.originalRequest=e)},this.cachedResponseWillBeUsed=async({event:e,state:t,cachedResponse:s})=>{if("install"===e.type&&t&&t.originalRequest&&t.originalRequest instanceof Request){const e=t.originalRequest.url;s?this.notUpdatedURLs.push(e):this.updatedURLs.push(e)}return s}}}class v{constructor({precacheController:e}){this.cacheKeyWillBeUsed=async({request:e,params:t})=>{const s=(null===t||void 0===t?void 0:t.cacheKey)||this._precacheController.getCacheKeyForURL(e.url);return s?new Request(s,{headers:e.headers}):e},this._precacheController=e}}s(976);function L(e){return"string"===typeof e?new Request(e):e}class b{constructor(e,t){this._cacheKeys={},Object.assign(this,t),this.event=t.event,this._strategy=e,this._handlerDeferred=new f,this._extendLifetimePromises=[],this._plugins=[...e.plugins],this._pluginStateMap=new Map;for(const s of this._plugins)this._pluginStateMap.set(s,{});this.event.waitUntil(this._handlerDeferred.promise)}async fetch(e){const{event:t}=this;let s=L(e);if("navigate"===s.mode&&t instanceof FetchEvent&&t.preloadResponse){const e=await t.preloadResponse;if(e)return e}const r=this.hasCallback("fetchDidFail")?s.clone():null;try{for(const e of this.iterateCallbacks("requestWillFetch"))s=await e({request:s.clone(),event:t})}catch(i){if(i instanceof Error)throw new n("plugin-error-request-will-fetch",{thrownErrorMessage:i.message})}const a=s.clone();try{let e;e=await fetch(s,"navigate"===s.mode?void 0:this._strategy.fetchOptions);for(const s of this.iterateCallbacks("fetchDidSucceed"))e=await s({event:t,request:a,response:e});return e}catch(o){throw r&&await this.runCallbacks("fetchDidFail",{error:o,event:t,originalRequest:r.clone(),request:a.clone()}),o}}async fetchAndCachePut(e){const t=await this.fetch(e),s=t.clone();return this.waitUntil(this.cachePut(e,s)),t}async cacheMatch(e){const t=L(e);let s;const{cacheName:n,matchOptions:r}=this._strategy,a=await this.getCacheKey(t,"read"),i=Object.assign(Object.assign({},r),{cacheName:n});s=await caches.match(a,i);for(const o of this.iterateCallbacks("cachedResponseWillBeUsed"))s=await o({cacheName:n,matchOptions:r,cachedResponse:s,request:a,event:this.event})||void 0;return s}async cachePut(e,t){const s=L(e);await w(0);const r=await this.getCacheKey(s,"write");if(!t)throw new n("cache-put-with-no-response",{url:g(r.url)});const a=await this._ensureResponseSafeToCache(t);if(!a)return!1;const{cacheName:i,matchOptions:o}=this._strategy,c=await self.caches.open(i),h=this.hasCallback("cacheDidUpdate"),u=h?await l(c,r.clone(),["__WB_REVISION__"],o):null;try{await c.put(r,h?a.clone():a)}catch(d){if(d instanceof Error)throw"QuotaExceededError"===d.name&&await p(),d}for(const n of this.iterateCallbacks("cacheDidUpdate"))await n({cacheName:i,oldResponse:u,newResponse:a.clone(),request:r,event:this.event});return!0}async getCacheKey(e,t){const s=`${e.url} | ${t}`;if(!this._cacheKeys[s]){let n=e;for(const e of this.iterateCallbacks("cacheKeyWillBeUsed"))n=L(await e({mode:t,request:n,event:this.event,params:this.params}));this._cacheKeys[s]=n}return this._cacheKeys[s]}hasCallback(e){for(const t of this._strategy.plugins)if(e in t)return!0;return!1}async runCallbacks(e,t){for(const s of this.iterateCallbacks(e))await s(t)}*iterateCallbacks(e){for(const t of this._strategy.plugins)if("function"===typeof t[e]){const s=this._pluginStateMap.get(t),n=n=>{const r=Object.assign(Object.assign({},n),{state:s});return t[e](r)};yield n}}waitUntil(e){return this._extendLifetimePromises.push(e),e}async doneWaiting(){let e;while(e=this._extendLifetimePromises.shift())await e}destroy(){this._handlerDeferred.resolve(null)}async _ensureResponseSafeToCache(e){let t=e,s=!1;for(const n of this.iterateCallbacks("cacheWillUpdate"))if(t=await n({request:this.request,response:t,event:this.event})||void 0,s=!0,!t)break;return s||t&&200!==t.status&&(t=void 0),t}}class U{constructor(e={}){this.cacheName=c.getRuntimeName(e.cacheName),this.plugins=e.plugins||[],this.fetchOptions=e.fetchOptions,this.matchOptions=e.matchOptions}handle(e){const[t]=this.handleAll(e);return t}handleAll(e){e instanceof FetchEvent&&(e={event:e,request:e.request});const t=e.event,s="string"===typeof e.request?new Request(e.request):e.request,n="params"in e?e.params:void 0,r=new b(this,{event:t,request:s,params:n}),a=this._getResponse(r,s,t),i=this._awaitComplete(a,r,s,t);return[a,i]}async _getResponse(e,t,s){let r;await e.runCallbacks("handlerWillStart",{event:s,request:t});try{if(r=await this._handle(t,e),!r||"error"===r.type)throw new n("no-response",{url:t.url})}catch(a){if(a instanceof Error)for(const n of e.iterateCallbacks("handlerDidError"))if(r=await n({error:a,event:s,request:t}),r)break;if(!r)throw a}for(const n of e.iterateCallbacks("handlerWillRespond"))r=await n({event:s,request:t,response:r});return r}async _awaitComplete(e,t,s,n){let r,a;try{r=await e}catch(a){}try{await t.runCallbacks("handlerDidRespond",{event:n,request:s,response:r}),await t.doneWaiting()}catch(i){i instanceof Error&&(a=i)}if(await t.runCallbacks("handlerDidComplete",{event:n,request:s,response:r,error:a}),t.destroy(),a)throw a}}class k extends U{constructor(e={}){e.cacheName=c.getPrecacheName(e.cacheName),super(e),this._fallbackToNetwork=!1!==e.fallbackToNetwork,this.plugins.push(k.copyRedirectedCacheableResponsesPlugin)}async _handle(e,t){const s=await t.cacheMatch(e);return s||(t.event&&"install"===t.event.type?await this._handleInstall(e,t):await this._handleFetch(e,t))}async _handleFetch(e,t){let s;const r=t.params||{};if(!this._fallbackToNetwork)throw new n("missing-precache-entry",{cacheName:this.cacheName,url:e.url});{0;const n=r.integrity,a=e.integrity,i=!a||a===n;if(s=await t.fetch(new Request(e,{integrity:a||n})),n&&i){this._useDefaultCacheabilityPluginIfNeeded();await t.cachePut(e,s.clone());0}}return s}async _handleInstall(e,t){this._useDefaultCacheabilityPluginIfNeeded();const s=await t.fetch(e),r=await t.cachePut(e,s.clone());if(!r)throw new n("bad-precaching-response",{url:e.url,status:s.status});return s}_useDefaultCacheabilityPluginIfNeeded(){let e=null,t=0;for(const[s,n]of this.plugins.entries())n!==k.copyRedirectedCacheableResponsesPlugin&&(n===k.defaultPrecacheCacheabilityPlugin&&(e=s),n.cacheWillUpdate&&t++);0===t?this.plugins.push(k.defaultPrecacheCacheabilityPlugin):t>1&&null!==e&&this.plugins.splice(e,1)}}k.defaultPrecacheCacheabilityPlugin={async cacheWillUpdate({response:e}){return!e||e.status>=400?null:e}},k.copyRedirectedCacheableResponsesPlugin={async cacheWillUpdate({response:e}){return e.redirected?await _(e):e}};class q{constructor({cacheName:e,plugins:t=[],fallbackToNetwork:s=!0}={}){this._urlsToCacheKeys=new Map,this._urlsToCacheModes=new Map,this._cacheKeysToIntegrities=new Map,this._strategy=new k({cacheName:c.getPrecacheName(e),plugins:[...t,new v({precacheController:this})],fallbackToNetwork:s}),this.install=this.install.bind(this),this.activate=this.activate.bind(this)}get strategy(){return this._strategy}precache(e){this.addToCacheList(e),this._installAndActiveListenersAdded||(self.addEventListener("install",this.install),self.addEventListener("activate",this.activate),this._installAndActiveListenersAdded=!0)}addToCacheList(e){const t=[];for(const s of e){"string"===typeof s?t.push(s):s&&void 0===s.revision&&t.push(s.url);const{cacheKey:e,url:r}=C(s),a="string"!==typeof s&&s.revision?"reload":"default";if(this._urlsToCacheKeys.has(r)&&this._urlsToCacheKeys.get(r)!==e)throw new n("add-to-cache-list-conflicting-entries",{firstEntry:this._urlsToCacheKeys.get(r),secondEntry:e});if("string"!==typeof s&&s.integrity){if(this._cacheKeysToIntegrities.has(e)&&this._cacheKeysToIntegrities.get(e)!==s.integrity)throw new n("add-to-cache-list-conflicting-integrities",{url:r});this._cacheKeysToIntegrities.set(e,s.integrity)}if(this._urlsToCacheKeys.set(r,e),this._urlsToCacheModes.set(r,a),t.length>0){const e=`Workbox is precaching URLs without revision info: ${t.join(", ")}\nThis is generally NOT safe. Learn more at https://bit.ly/wb-precache`;console.warn(e)}}}install(e){return y(e,(async()=>{const t=new T;this.strategy.plugins.push(t);for(const[r,a]of this._urlsToCacheKeys){const t=this._cacheKeysToIntegrities.get(a),s=this._urlsToCacheModes.get(r),n=new Request(r,{integrity:t,cache:s,credentials:"same-origin"});await Promise.all(this.strategy.handleAll({params:{cacheKey:a},request:n,event:e}))}const{updatedURLs:s,notUpdatedURLs:n}=t;return{updatedURLs:s,notUpdatedURLs:n}}))}activate(e){return y(e,(async()=>{const e=await self.caches.open(this.strategy.cacheName),t=await e.keys(),s=new Set(this._urlsToCacheKeys.values()),n=[];for(const r of t)s.has(r.url)||(await e.delete(r),n.push(r.url));return{deletedURLs:n}}))}getURLsToCacheKeys(){return this._urlsToCacheKeys}getCachedURLs(){return[...this._urlsToCacheKeys.keys()]}getCacheKeyForURL(e){const t=new URL(e,location.href);return this._urlsToCacheKeys.get(t.href)}getIntegrityForCacheKey(e){return this._cacheKeysToIntegrities.get(e)}async matchPrecache(e){const t=e instanceof Request?e.url:e,s=this.getCacheKeyForURL(t);if(s){const e=await self.caches.open(this.strategy.cacheName);return e.match(s)}}createHandlerBoundToURL(e){const t=this.getCacheKeyForURL(e);if(!t)throw new n("non-precached-url",{url:e});return s=>(s.request=new Request(e),s.params=Object.assign({cacheKey:t},s.params),this.strategy.handle(s))}}let E;const P=()=>(E||(E=new q),E);s(234);const N="GET",x=e=>e&&"object"===typeof e?e:{handle:e};class K{constructor(e,t,s=N){this.handler=x(t),this.match=e,this.method=s}setCatchHandler(e){this.catchHandler=x(e)}}class A extends K{constructor(e,t,s){const n=({url:t})=>{const s=e.exec(t.href);if(s&&(t.origin===location.origin||0===s.index))return s.slice(1)};super(n,t,s)}}class S{constructor(){this._routes=new Map,this._defaultHandlerMap=new Map}get routes(){return this._routes}addFetchListener(){self.addEventListener("fetch",(e=>{const{request:t}=e,s=this.handleRequest({request:t,event:e});s&&e.respondWith(s)}))}addCacheListener(){self.addEventListener("message",(e=>{if(e.data&&"CACHE_URLS"===e.data.type){const{payload:t}=e.data;0;const s=Promise.all(t.urlsToCache.map((t=>{"string"===typeof t&&(t=[t]);const s=new Request(...t);return this.handleRequest({request:s,event:e})})));e.waitUntil(s),e.ports&&e.ports[0]&&s.then((()=>e.ports[0].postMessage(!0)))}}))}handleRequest({request:e,event:t}){const s=new URL(e.url,location.href);if(!s.protocol.startsWith("http"))return void 0;const n=s.origin===location.origin,{params:r,route:a}=this.findMatchingRoute({event:t,request:e,sameOrigin:n,url:s});let i=a&&a.handler;const o=e.method;if(!i&&this._defaultHandlerMap.has(o)&&(i=this._defaultHandlerMap.get(o)),!i)return void 0;let c;try{c=i.handle({url:s,request:e,event:t,params:r})}catch(l){c=Promise.reject(l)}const h=a&&a.catchHandler;return c instanceof Promise&&(this._catchHandler||h)&&(c=c.catch((async n=>{if(h){0;try{return await h.handle({url:s,request:e,event:t,params:r})}catch(a){a instanceof Error&&(n=a)}}if(this._catchHandler)return this._catchHandler.handle({url:s,request:e,event:t});throw n}))),c}findMatchingRoute({url:e,sameOrigin:t,request:s,event:n}){const r=this._routes.get(s.method)||[];for(const a of r){let r;const i=a.match({url:e,sameOrigin:t,request:s,event:n});if(i)return r=i,(Array.isArray(r)&&0===r.length||i.constructor===Object&&0===Object.keys(i).length||"boolean"===typeof i)&&(r=void 0),{route:a,params:r}}return{}}setDefaultHandler(e,t=N){this._defaultHandlerMap.set(t,x(e))}setCatchHandler(e){this._catchHandler=x(e)}registerRoute(e){this._routes.has(e.method)||this._routes.set(e.method,[]),this._routes.get(e.method).push(e)}unregisterRoute(e){if(!this._routes.has(e.method))throw new n("unregister-route-but-not-found-with-method",{method:e.method});const t=this._routes.get(e.method).indexOf(e);if(!(t>-1))throw new n("unregister-route-route-not-registered");this._routes.get(e.method).splice(t,1)}}let O;const I=()=>(O||(O=new S,O.addFetchListener(),O.addCacheListener()),O);function M(e,t,s){let r;if("string"===typeof e){const n=new URL(e,location.href);0;const a=({url:e})=>e.href===n.href;r=new K(a,t,s)}else if(e instanceof RegExp)r=new A(e,t,s);else if("function"===typeof e)r=new K(e,t,s);else{if(!(e instanceof K))throw new n("unsupported-route-type",{moduleName:"workbox-routing",funcName:"registerRoute",paramName:"capture"});r=e}const a=I();return a.registerRoute(r),r}function H(e,t=[]){for(const s of[...e.searchParams.keys()])t.some((e=>e.test(s)))&&e.searchParams.delete(s);return e}function*W(e,{ignoreURLParametersMatching:t=[/^utm_/,/^fbclid$/],directoryIndex:s="index.html",cleanURLs:n=!0,urlManipulation:r}={}){const a=new URL(e,location.href);a.hash="",yield a.href;const i=H(a,t);if(yield i.href,s&&i.pathname.endsWith("/")){const e=new URL(i.href);e.pathname+=s,yield e.href}if(n){const e=new URL(i.href);e.pathname+=".html",yield e.href}if(r){const e=r({url:a});for(const t of e)yield t.href}}class D extends K{constructor(e,t){const s=({request:s})=>{const n=e.getURLsToCacheKeys();for(const r of W(s.url,t)){const t=n.get(r);if(t){const s=e.getIntegrityForCacheKey(t);return{cacheKey:t,integrity:s}}}};super(s,e.strategy)}}function F(e){const t=P(),s=new D(t,e);M(s)}function j(e){const t=P();return t.getCacheKeyForURL(e)}function B(e){const t=P();t.precache(e)}function G(e,t){B(e),F(t)}function $(e){const t=I();t.setCatchHandler(e)}function Y(e){const t=I();t.setDefaultHandler(e)}const J={cacheWillUpdate:async({response:e})=>200===e.status||0===e.status?e:null};class V extends U{constructor(e={}){super(e),this.plugins.some((e=>"cacheWillUpdate"in e))||this.plugins.unshift(J),this._networkTimeoutSeconds=e.networkTimeoutSeconds||0}async _handle(e,t){const s=[];const r=[];let a;if(this._networkTimeoutSeconds){const{id:n,promise:i}=this._getTimeoutPromise({request:e,logs:s,handler:t});a=n,r.push(i)}const i=this._getNetworkPromise({timeoutId:a,request:e,logs:s,handler:t});r.push(i);const o=await t.waitUntil((async()=>await t.waitUntil(Promise.race(r))||await i)());if(!o)throw new n("no-response",{url:e.url});return o}_getTimeoutPromise({request:e,logs:t,handler:s}){let n;const r=new Promise((t=>{const r=async()=>{t(await s.cacheMatch(e))};n=setTimeout(r,1e3*this._networkTimeoutSeconds)}));return{promise:r,id:n}}async _getNetworkPromise({timeoutId:e,request:t,logs:s,handler:n}){let r,a;try{a=await n.fetchAndCachePut(t)}catch(i){i instanceof Error&&(r=i)}return e&&clearTimeout(e),!r&&a||(a=await n.cacheMatch(t)),a}}class Q extends U{constructor(e={}){super(e),this._networkTimeoutSeconds=e.networkTimeoutSeconds||0}async _handle(e,t){let s,r;try{const s=[t.fetch(e)];if(this._networkTimeoutSeconds){const e=w(1e3*this._networkTimeoutSeconds);s.push(e)}if(r=await Promise.race(s),!r)throw new Error(`Timed out the network response after ${this._networkTimeoutSeconds} seconds.`)}catch(a){a instanceof Error&&(s=a)}if(!r)throw new n("no-response",{url:e.url,error:s});return r}}m({prefix:"asset-link"}),G([{'revision':null,'url':'/__THIS_GETS_REPLACED_AT_RUNTIME_BY_THE_DRUPAL_CONTROLLER__/css/193.c722f46a.css'},{'revision':null,'url':'/__THIS_GETS_REPLACED_AT_RUNTIME_BY_THE_DRUPAL_CONTROLLER__/css/304.28da6470.css'},{'revision':null,'url':'/__THIS_GETS_REPLACED_AT_RUNTIME_BY_THE_DRUPAL_CONTROLLER__/css/about.0575e92a.css'},{'revision':null,'url':'/__THIS_GETS_REPLACED_AT_RUNTIME_BY_THE_DRUPAL_CONTROLLER__/fonts/materialdesignicons-webfont.43f2dfd1.woff2'},{'revision':null,'url':'/__THIS_GETS_REPLACED_AT_RUNTIME_BY_THE_DRUPAL_CONTROLLER__/fonts/materialdesignicons-webfont.52fd8e4e.woff'},{'revision':'e75ff14f00df2b549364b238ef315955','url':'/__THIS_GETS_REPLACED_AT_RUNTIME_BY_THE_DRUPAL_CONTROLLER__/index.html'},{'revision':null,'url':'/__THIS_GETS_REPLACED_AT_RUNTIME_BY_THE_DRUPAL_CONTROLLER__/js/201.cf032f51.js'},{'revision':null,'url':'/__THIS_GETS_REPLACED_AT_RUNTIME_BY_THE_DRUPAL_CONTROLLER__/js/267.2d723854.js'},{'revision':null,'url':'/__THIS_GETS_REPLACED_AT_RUNTIME_BY_THE_DRUPAL_CONTROLLER__/js/291.4094b148.js'},{'revision':null,'url':'/__THIS_GETS_REPLACED_AT_RUNTIME_BY_THE_DRUPAL_CONTROLLER__/js/304.7aa72700.js'},{'revision':null,'url':'/__THIS_GETS_REPLACED_AT_RUNTIME_BY_THE_DRUPAL_CONTROLLER__/js/343.70731c70.js'},{'revision':null,'url':'/__THIS_GETS_REPLACED_AT_RUNTIME_BY_THE_DRUPAL_CONTROLLER__/js/419.e3e82576.js'},{'revision':null,'url':'/__THIS_GETS_REPLACED_AT_RUNTIME_BY_THE_DRUPAL_CONTROLLER__/js/449.d56f8bb1.js'},{'revision':null,'url':'/__THIS_GETS_REPLACED_AT_RUNTIME_BY_THE_DRUPAL_CONTROLLER__/js/470.61ec717c.js'},{'revision':null,'url':'/__THIS_GETS_REPLACED_AT_RUNTIME_BY_THE_DRUPAL_CONTROLLER__/js/61.a25be375.js'},{'revision':null,'url':'/__THIS_GETS_REPLACED_AT_RUNTIME_BY_THE_DRUPAL_CONTROLLER__/js/616.728858a0.js'},{'revision':null,'url':'/__THIS_GETS_REPLACED_AT_RUNTIME_BY_THE_DRUPAL_CONTROLLER__/js/634.38873e0f.js'},{'revision':null,'url':'/__THIS_GETS_REPLACED_AT_RUNTIME_BY_THE_DRUPAL_CONTROLLER__/js/886.e3c18043.js'},{'revision':null,'url':'/__THIS_GETS_REPLACED_AT_RUNTIME_BY_THE_DRUPAL_CONTROLLER__/js/935.30f2f5f1.js'},{'revision':null,'url':'/__THIS_GETS_REPLACED_AT_RUNTIME_BY_THE_DRUPAL_CONTROLLER__/js/978.485e4f7d.js'},{'revision':null,'url':'/__THIS_GETS_REPLACED_AT_RUNTIME_BY_THE_DRUPAL_CONTROLLER__/js/about.a3432dce.js'},{'revision':null,'url':'/__THIS_GETS_REPLACED_AT_RUNTIME_BY_THE_DRUPAL_CONTROLLER__/js/index.d4378f6b.js'},{'revision':'c3d1e37508cd4b0e22107bb50de78254','url':'/__THIS_GETS_REPLACED_AT_RUNTIME_BY_THE_DRUPAL_CONTROLLER__/manifest.json'},{'revision':'b6216d61c03e6ce0c9aea6ca7808f7ca','url':'/__THIS_GETS_REPLACED_AT_RUNTIME_BY_THE_DRUPAL_CONTROLLER__/robots.txt'}]);class X extends U{constructor(e){super(e),this.networkFirst=new V,this.networkOnly=new Q}handleAll(e){e instanceof FetchEvent&&(e={event:e,request:e.request});const t="string"===typeof e.request?new Request(e.request):e.request;return t.headers["X-Skip-Cache"]?this.networkOnly.handleAll(e):this.networkFirst.handleAll(e)}}M(/https:\/\/.*\.repo\.json/,new X),M(/https:\/\/.*\.alink\..*/,new X),M(/https:\/\/.*\/api\/?.*/,new Q),Y(new V),$((async({event:e})=>{const t=new URL(e.request.url);if(console.log("You should be able to see this message in the console if setCatchHandler is called",t,JSON.stringify(e)),t.pathname.startsWith("/__THIS_GETS_REPLACED_AT_RUNTIME_BY_THE_DRUPAL_CONTROLLER__/backend/"))return Response.error();if(t.pathname.startsWith("/__THIS_GETS_REPLACED_AT_RUNTIME_BY_THE_DRUPAL_CONTROLLER__/js/")||t.pathname.startsWith("/__THIS_GETS_REPLACED_AT_RUNTIME_BY_THE_DRUPAL_CONTROLLER__/css/")){const e=await caches.match(j(t.pathname));return console.log("returning js/css:",e),e||Response.error()}if(t.pathname.startsWith("/__THIS_GETS_REPLACED_AT_RUNTIME_BY_THE_DRUPAL_CONTROLLER__/")){const e=await caches.match(j("/__THIS_GETS_REPLACED_AT_RUNTIME_BY_THE_DRUPAL_CONTROLLER__/index.html"));return console.log("returning:",e),e}return Response.error()})),self.addEventListener("message",(async e=>{if(e.data&&"SKIP_WAITING"===e.data.type&&self.skipWaiting(),e.data&&"CLEAR_ALL_CACHES"===e.data.type){const e=await caches.keys();for(const t of e)caches.delete(t);await self.registration.unregister()}}))}()})();
//# sourceMappingURL=service-worker.js.map