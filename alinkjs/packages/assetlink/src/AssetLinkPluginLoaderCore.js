import { Buffer } from 'buffer/';

import semverParse from 'semver/functions/parse';
import semverValid from 'semver/functions/valid';
import Range from 'semver/classes/range';

import { markRaw, reactive, ref, watch } from 'vue';

import { loadModule } from 'vue3-sfc-loader/dist/vue3-sfc-loader.esm.js';
import { parse as parseComponent } from '@vue/compiler-sfc';

import fetch from 'cross-fetch';

import VuePluginShorthandDecorator from '@/VuePluginShorthandDecorator';
import { default as pluginModuleLibrary, pluginModuleLibraryNames } from '@/pluginModuleLibrary';

import { currentEpochSecond, EventBus, uuidv4 } from "assetlink-plugin-api";

const OLD_PLUGIN_DATA_URL_PREFIX = "data:application/javascript;base64,";
const PLUGIN_DATA_URL_PREFIX = "data:application/octet-stream;base64,";


export default class AssetLinkPluginLoaderCore {

  constructor(assetLink) {
    this._assetLink = assetLink;
    this._store = assetLink._store;
    this._connectionStatus = assetLink._connectionStatus;
    this._devToolsApi = assetLink._devToolsApi;

    this._vm = reactive({
      // Expose the plugin code/data here as soon as it has been retrieved.
      // This is useful because plugins that have asynchronous dependencies
      // are not available in the plugins array until they have finished loading.
      pluginRawSourceByUrl: {},
      plugins: [],
      unresolvedDependencies: {},
      resolvedDependencies: {},
    });

    this._eventBus = new EventBus();
  }

  /**
   * A {Vue} instance used to expose some of this core's state to
   * the UI in a reactive way.
   */
  get vm() {
    return this._vm;
  }

  /**
   * An async event bus used to signal when routes are added/removed.
   */
  get eventBus() {
    return this._eventBus;
  }

  async boot() {
    // TODO: ?
  }

  async halt() {
    // TODO: ?
  }

  async loadPlugin(pluginUrl, opts) {
    const options = opts || {};

    const vm = this.vm;

    const pluginFilename = pluginUrl.pathname.split('/').pop();
    const pluginBaseName = pluginFilename.split('.alink.')[0];
    const pluginLoadingOccurrenceId = uuidv4();
    const pluginOccurrenceId = `${hyphenate(pluginBaseName)}-${pluginLoadingOccurrenceId}`;

    const loadingEventGroup = this._devToolsApi.startTimelineEventGroup({
      data: {
        pluginUrl: pluginUrl.toString(),
      },
      title: `loading plugin ${pluginFilename}`,
      subtitle: pluginUrl.toString(),
      groupId: `loading-plugin-${pluginLoadingOccurrenceId}`,
    });

    let pluginInstance = undefined;
    let rawPluginSource = undefined;

    try {
      const pluginData = await this._fetchPlugin(pluginUrl, options);

      if (!pluginData.startsWith(PLUGIN_DATA_URL_PREFIX)) {
        throw new Error(`Fetched plugin data must start with: '${PLUGIN_DATA_URL_PREFIX}'`);
      }

      rawPluginSource = Buffer.from(pluginData.substring(PLUGIN_DATA_URL_PREFIX.length), 'base64').toString('utf8');

      vm.pluginRawSourceByUrl[pluginUrl.toString()] = rawPluginSource;

      let pluginDecorator = p => p;

      if (pluginUrl.pathname.endsWith('alink.js') || pluginUrl.pathname.endsWith('alink.vue')) {
        const pluginUrlWithoutParams = new URL(pluginUrl.toString());
        pluginUrlWithoutParams.search = '';

        if (pluginUrl.pathname.endsWith('alink.vue')) {
          const component = parseComponent(rawPluginSource);

          if (component.errors.length > 0) {
            throw new Error(`Could not parse component plugin: ${component.errors.join('\n')}`);
          }

          if (component.template) {
            if (component.template.src) {
              throw new Error(`External component template content is not supported.`);
            }
          }

          pluginDecorator = VuePluginShorthandDecorator.composeDecorator(pluginDecorator, component);
        }

        if (!this.moduleCache) {
          this.moduleCache = pluginModuleLibrary;
        }

        // Keep track of the dependencies during this instance of loading the plugin such
        // that subsequent requests for the same dependency resolve identically/immediately.
        const libraryDependencies = {};

        // Isolate regular module cache from plugin libraries portion of the cache
        const scopedModuleCacheData = {};
        const scopedModuleCache = new Proxy(this.moduleCache, {
          has(target, prop) {
            if (prop.startsWith('plugin-library:')) {
              return prop in scopedModuleCacheData;
            }
            return prop in target;
          },
          get(target, prop) {
            if (prop.startsWith('plugin-library:')) {
              return scopedModuleCacheData[prop];
            }
            return target[prop];
          },
          set(target, prop, value) {
            if (prop.startsWith('plugin-library:')) {
              return scopedModuleCacheData[prop] = value;
            }
            return Reflect.set(...arguments);
          }
        });

        const options = {
          // devMode: true,
          moduleCache: scopedModuleCache,
          compiledCache: {
            set: (key, str) => this._store.setItem(`asset-link-cached-compiled-plugin:${key}`, str),
            get: async (key) => (await this._store.getItem(`asset-link-cached-compiled-plugin:${key}`)) 
                    // Recent versions of vue3-sfc-loader are comparing strictly against `undefined`, but
                    // LocalForage returns `null`
                    || undefined,
          },
          pathResolve: ({ refPath, relPath }) => {
            // Seems to occur prior to loading of the plugin module file itself
            if (refPath === undefined) {
              return relPath;
            }

            // self
            if ( relPath === '.' ) {
              return refPath;
            }

            if (this.moduleCache[relPath] === undefined && !relPath.startsWith('plugin-library:')) {
              throw new Error(`Unsupported import '${relPath}'. Supported libraries:` + JSON.stringify(pluginModuleLibraryNames));
            }

            return relPath;
          },
          async loadModule(id, options) {
            // Fallback on the normal module loading unless the requested id is a plugin-library
            if (!id.startsWith('plugin-library:')) {
              return undefined;
            }

            const rawLibraryRequirement = id.slice(15, id.length);

            let libraryNameRequirement = rawLibraryRequirement;
            let rawLibraryVersionRequirement = undefined;
            if (rawLibraryRequirement.includes(':')) {
              [libraryNameRequirement, rawLibraryVersionRequirement] = rawLibraryRequirement.split(':', 2);
            }

            if (!Object.hasOwn(libraryDependencies, libraryNameRequirement)) {
              const libraryVersionRequirement = rawLibraryVersionRequirement ? new Range(rawLibraryVersionRequirement) : undefined;

              const resolveLibraryPromise = new Promise((resolve) => {
                // Keep track of unresolved library dependencies
                if (!vm.unresolvedDependencies[pluginUrl.toString()]) {
                  vm.unresolvedDependencies[pluginUrl.toString()] = {};
                }

                const checkIsSatisfiedBy = (library) => {
                  if (libraryNameRequirement !== library.libraryName) {
                    return false;
                  }

                  if (!libraryVersionRequirement) {
                    return true;
                  }

                  return libraryVersionRequirement.test(library.libraryVersion);
                };

                const satisfyWith = (sourcePluginUrls, library) => {
                  resolve(library.libraryObject);

                  delete vm.unresolvedDependencies[pluginUrl.toString()][rawLibraryRequirement];

                  // Keep track of dependency relationships between plugins to allow unloading/reloading plugins to correctly
                  // unload/reload dependent plugins
                  new Set(sourcePluginUrls).forEach(sourcePluginUrl =>
                    vm.resolvedDependencies[sourcePluginUrl].add(pluginUrl.toString())
                  );
                };

                const trySatisfy = (sourcePluginUrls, library) => {
                  // Don't try and satisfy this dependency once it has been removed from the unresolved dependencies
                  if (!Object.hasOwn(vm.unresolvedDependencies[pluginUrl.toString()], rawLibraryRequirement)) {
                    return;
                  }
                  if (checkIsSatisfiedBy(library)) {
                    satisfyWith(sourcePluginUrls, library);
                  }
                };

                const matchingLibrary = vm.plugins
                  .flatMap(providingPlugin => Object.entries(providingPlugin.providedLibraries).flatMap(([attributedPluginUrl, attributedLibraries]) =>
                    Object.values(attributedLibraries).map(library => ({
                      providingPlugin,
                      attributedPluginUrl,
                      library,
                    }))
                  ))
                  // Only consider libraries that match the requested name and satisfy the version requirement(s) - if any
                  .filter(({ library }) => checkIsSatisfiedBy(library))
                  // Choose the latest version available (right now)
                  .reduce((a, b) => {
                    if (a && a.library.libraryVersion > b.library.libraryVersion) {
                      return a;
                    }
                    return b;
                  }, undefined);

                if (matchingLibrary) {
                  satisfyWith([matchingLibrary.providingPlugin.pluginUrl.toString(), matchingLibrary.attributedPluginUrl], matchingLibrary.library);
                  return;
                }

                vm.unresolvedDependencies[pluginUrl.toString()][rawLibraryRequirement] = {
                  libraryNameRequirement,
                  libraryVersionRequirement,
                  trySatisfy,
                };

              });

              libraryDependencies[libraryNameRequirement] = {
                libraryNameRequirement,
                rawLibraryVersionRequirement,
                libraryVersionRequirement,
                resolveLibraryPromise,
              };
            }

            if (libraryDependencies[libraryNameRequirement].rawLibraryVersionRequirement !== rawLibraryVersionRequirement) {
              throw new Error(`Cannot depend on two different versions of ${libraryNameRequirement} from a single plugin.`);
            }

            return await libraryDependencies[libraryNameRequirement].resolveLibraryPromise;
          },
          async getFile(url) {
            const fileUrl = new URL(url);

            if (fileUrl.toString().startsWith('plugin-library:')) {
              throw new Error(`Plugin libraries shouldn't reach this code - instead being handled by loadModule above. url=${url}`);
            }

            const pluginSrc = (fileUrl.toString() === pluginUrlWithoutParams.toString()) ? rawPluginSource : await fetch(fileUrl).then(r => r.text());

            if (fileUrl.pathname.endsWith('alink.js')) {
              return { getContentData: () => pluginSrc, type: ".mjs" }
            } else if (fileUrl.pathname.endsWith('alink.vue')) {
              return { getContentData: () => pluginSrc, type: ".vue" }
            } else {
              throw new Error(`Secondary imports are not supported. url=${url}`);
            }
          },
          addStyle(textContent) {
            const style = Object.assign(document.createElement('style'), { textContent });
            style.setAttribute("data-alink-style-plugin-id", pluginOccurrenceId);
            const ref = document.head.getElementsByTagName('style')[0] || null;
            document.head.insertBefore(style, ref);
          },
        };

        const pluginInstancePromise = loadModule(pluginUrlWithoutParams, options);

        pluginInstance = await pluginInstancePromise;

        if (pluginUrl.pathname.endsWith('alink.js')) {
          pluginInstance = pluginInstance.default;
        }

        if (!pluginInstance.name) {
          pluginInstance.name = pluginOccurrenceId;
        }

        pluginDecorator(pluginInstance);

      } else {
        pluginInstance = {};
      }

      pluginInstance.occurrenceId = pluginOccurrenceId;
      pluginInstance.pluginUrl = pluginUrl;
      pluginInstance.rawSource = rawPluginSource;

      this.registerPlugin(pluginInstance);
    } catch (error) {
      console.log(error);
      pluginInstance = {};
      pluginInstance.occurrenceId = pluginOccurrenceId;
      pluginInstance.pluginUrl = pluginUrl;
      pluginInstance.rawSource = rawPluginSource;
      pluginInstance.error = error;
      this.registerPlugin(pluginInstance);
    } finally {
      loadingEventGroup.end();
    }
  }

  /**
   * Directly register a plugin with Asset Link. Note that plugins registered this way
   * will not persist between sessions/reloads.
   */
  registerPlugin(plugin) {
    plugin.onLoadDone = ref(false);
    plugin.definedRoutes = reactive({});
    plugin.definedSlots = reactive({});
    plugin.definedWidgetDecorators = reactive({});
    plugin.definedPluginIngestor = undefined;
    plugin.providedLibraries = reactive({});
    plugin.attributedErrors = reactive({});

    // Keep a set of the plugin urls which depend on libraries this plugin provides
    this.vm.resolvedDependencies[plugin.pluginUrl.toString()] = new Set();

    this.vm.plugins.push(plugin);

    if (typeof plugin.onLoad === 'function') {
      const handle = new AssetLinkPluginHandle(plugin, this.vm, this._eventBus);

      const onLoadRes = plugin.onLoad(handle, this._assetLink);

      const onLoadObserver = async () => {
        try {
          await Promise.resolve(onLoadRes);
        } catch (e) {
          handle.recordError(e.toString());
        }
        plugin.onLoadDone.value = true;
      };
      onLoadObserver();

      handle._onLoadDone = true;
    } else {
      plugin.onLoadDone.value = true;
    }

    const trySatisfyLibraryDependencies = p => {
      Object.entries(p.providedLibraries).forEach(([attributedPluginUrl, librariesByIdentifier]) => {
        Object.values(librariesByIdentifier).forEach(library => {
          Object.values(this.vm.unresolvedDependencies)
            .flatMap(pluginUnresolvedDeps => Object.values(pluginUnresolvedDeps))
            .forEach(unresolvedDependency => {
              unresolvedDependency.trySatisfy([p.pluginUrl.toString(), attributedPluginUrl], library);
            });
        });
      });
    };

    this.vm.plugins.forEach(p => {
      if (p !== plugin && p.definedPluginIngestor) {
        // TODO: Catch errors
        p.definedPluginIngestor.ingestorFn(plugin);

        // Look for attributed libraries that now satisfy an unsatisfied dependency
        // as a result of a (existing) plugin ingestor acting on the plugin we're registering
        // here.
        trySatisfyLibraryDependencies(p);
      }
      if (p !== plugin && plugin.definedPluginIngestor) {
        plugin.definedPluginIngestor.ingestorFn(p);
      }
    });

    trySatisfyLibraryDependencies(plugin);
  }

  async unloadPlugin(pluginUrl) {
    if (this.moduleCache && this.moduleCache[pluginUrl.toString()]) {
      delete this.moduleCache[pluginUrl.toString()];
    }

    const pluginIdx = this.vm.plugins.findIndex(p => p.pluginUrl.toString() === pluginUrl.toString());

    const plugin = this.vm.plugins[pluginIdx];

    if (plugin && typeof plugin.onUnload === 'function') {
      plugin.onUnload(this._assetLink);
    }

    if (plugin) {
      const pluginStyles = document.head.querySelectorAll(`style[data-alink-style-plugin-id="${plugin.occurrenceId}"]`) || [];
      pluginStyles.forEach(e => e.parentNode.removeChild(e));
    }

    if (pluginIdx !== -1) {
      this.vm.plugins.splice(pluginIdx, 1);
    }

    this.vm.plugins.forEach(otherPlugin => {
      ['definedRoutes', 'definedSlots', 'definedWidgetDecorators', 'attributedErrors', 'providedLibraries'].forEach(attributedKey => {
        if (otherPlugin[attributedKey]) {
          delete otherPlugin[attributedKey][pluginUrl.toString()];
        }
      });

      // Remove the records of the (now unloaded) plugin's dependencies on other plugins
      if (this.vm.resolvedDependencies[otherPlugin.pluginUrl.toString()]) {
        this.vm.resolvedDependencies[otherPlugin.pluginUrl.toString()].delete(pluginUrl.toString());
      }
    });

    const thisPluginResolvedDeps = Array.from(this.vm.resolvedDependencies[pluginUrl.toString()] || []);

    // Reload any plugins that depended on libraries provided by this plugin
    // 
    // Because we've already removed the plugin being unloaded from the this.vm.plugins list, the dependency
    // will either resolve to a different version provided by some other plugin or else they will be unresolved
    // until this plugin is loaded again.
    thisPluginResolvedDeps.forEach(otherPluginUrl => this.reloadPlugin(new URL(otherPluginUrl)));

    // Cleanup our resolved dependencies entry for this plugin
    delete this.vm.resolvedDependencies[pluginUrl.toString()];

    // Cleanup the raw source for this plugin
    delete this.vm.pluginRawSourceByUrl[pluginUrl.toString()];
  }

  async reloadPlugin(pluginUrl) {
    await this.unloadPlugin(pluginUrl);
    await this.loadPlugin(pluginUrl, { skipCache: true });
  }

  async _fetchPlugin(url, opts) {
    const options = opts || {};

    if (url.protocol === 'indexeddb:') {
      return await this._assetLink.cores.localPluginStorage.readLocalPlugin(url);
    }

    const skipCache = options.skipCache || (url.searchParams && url.searchParams.get('skipCache'));

    const cacheKey = `asset-link-cached-plugin-src:${url}`;

    const cacheItem = await this._store.getItem(cacheKey);

    const timestamp = currentEpochSecond();

    if (!skipCache && cacheItem
        // Cache for at least 15 minutes and until we have a network connection
        && ((timestamp - cacheItem.timestamp) < 900 || !this._connectionStatus.hasNetworkConnection.value)) {

      // Rewrite old data urls into new binary compatible format
      if (cacheItem.value.startsWith(OLD_PLUGIN_DATA_URL_PREFIX)) {
        const rawPluginSource = Buffer.from(cacheItem.value.substring(OLD_PLUGIN_DATA_URL_PREFIX.length), 'base64');

        const updatedPluginDataUrl = PLUGIN_DATA_URL_PREFIX + rawPluginSource.toString('base64');

        await this._store.setItem(cacheKey, {key: cacheKey, timestamp: cacheItem.timestamp, value: updatedPluginDataUrl});

        return updatedPluginDataUrl;
      }

      return cacheItem.value;
    }

    const headers = {};

    if (skipCache) {
      headers['X-Skip-Cache'] = "1";
    }

    const pluginSrcRes = await fetch(url, { headers });

    if (!pluginSrcRes.ok) {
      throw new Error(`HTTP Error ${pluginSrcRes.status}: ${pluginSrcRes.statusText}`);
    }

    const pluginSrc = await pluginSrcRes.blob();

    const pluginDataUrl = PLUGIN_DATA_URL_PREFIX + Buffer.from(await blobToArrayBuffer(pluginSrc)).toString('base64');

    await this._store.setItem(cacheKey, {key: cacheKey, timestamp, value: pluginDataUrl});

    return pluginDataUrl;
  }

}

class AssetLinkPluginHandle {

  constructor(pluginInstance, vm, eventBus, attributedTo) {
    this._pluginInstance = pluginInstance;
    this._vm = vm;
    this._eventBus = eventBus;
    this._attributedTo = attributedTo || pluginInstance;

    // Used to prevent certain calls occurring asynchronously after the plugin has already been registered
    this._onLoadDone = false;
  }

  get thisPlugin() {
    return this._pluginInstance;
  }

  defineRoute(routeName, routeDefiner) {
    const routeDef = {name: routeName, debounceId: uuidv4() };

    const routeHandle = {
        path(path) {
          routeDef.path = path;
        },
        component(component) {
          routeDef.component = markRaw(component);
        },
    };

    routeDefiner(routeHandle);

    const missingFields = Object.entries({'path': 'string'})
      .filter(([attr, expectedType]) => typeof routeDef[attr] !== expectedType);

    if (!['object', 'function'].includes(typeof routeDef.component)) {
      missingFields.push(['component', '(object|function)?']);
    }

    if (missingFields.length) {
      console.log(`Route '${routeName}' is invalid due to missing or mismatched types for fields: ${JSON.stringify(missingFields)}`, routeDef);
      return;
    }

    this._setAttributedDefinition('definedRoutes', routeName, routeDef);
    this._eventBus.$emit('add-route', routeDef);
  }

  defineSlot(slotName, slotDefiner) {
    const slotDef = {name: slotName};

    const slotHandle = {
        type(type) {
          slotDef.type = type;
        },
        showIf(predicateFn) {
          slotDef.predicateFn = predicateFn;
        },
        multiplexContext(contextMultiplexerFn) {
          slotDef.contextMultiplexerFn = contextMultiplexerFn;
        },
        weight(weightFn) {
          slotDef.weightFn = weightFn;
        },
        component(component) {
          slotDef.component = markRaw(component);
        },
    };

    slotDefiner(slotHandle);

    let missingFields = Object.entries({'type': 'string'})
      .filter(([attr, expectedType]) => typeof slotDef[attr] !== expectedType);

    if (!['undefined', 'function'].includes(typeof slotDef.predicateFn)) {
      missingFields.push(['predicateFn', 'function?']);
    }

    if (!['undefined', 'function'].includes(typeof slotDef.contextMultiplexerFn)) {
      missingFields.push(['contextMultiplexerFn', 'function?']);
    }

    if (!['undefined', 'function', 'number'].includes(typeof slotDef.weightFn)) {
      missingFields.push(['weightFn', '(function|number)?']);
    }

    if (!['object', 'function'].includes(typeof slotDef.component)) {
      missingFields.push(['component', '(object|function)?']);
    }

    if (missingFields.length) {
      console.log(`Slot '${slotName}' is invalid due to missing or mismatched types for fields: ${JSON.stringify(missingFields)}`, slotDef);
      return;
    }

    let providedPredicateFn = slotDef.predicateFn;
    if (!providedPredicateFn) {
      providedPredicateFn = () => true
    }

    // Decorate the predicate function to make the slots automatically filtered by type
    slotDef.predicateFn = (context) => context.type === slotDef.type && providedPredicateFn(context);

    const providedWeightFn = slotDef.weightFn;
    // If no weight was provided, use the default of 100
    if (providedWeightFn === undefined) {
      slotDef.weightFn = () => 100;
    }
    // If the weight is a constant number, wrap it in a function that returns that number
    else if (typeof providedWeightFn === 'number') {
      slotDef.weightFn = () => providedWeightFn;
    }

    this._setAttributedDefinition('definedSlots', slotName, slotDef);
  }

  defineWidgetDecorator(widgetDecoratorName, widgetDecoratorDefiner) {
    const widgetDecoratorDef = { name: widgetDecoratorName };

    const widgetDecoratorHandle = {
        targetWidgetName(targetWidgetName) {
          widgetDecoratorDef.targetWidgetName = targetWidgetName;
        },
        appliesIf(predicateFn) {
          widgetDecoratorDef.predicateFn = predicateFn;
        },
        weight(weightFn) {
          widgetDecoratorDef.weightFn = weightFn;
        },
        component(component) {
          widgetDecoratorDef.component = markRaw(component);
        },
    };

    widgetDecoratorDefiner(widgetDecoratorHandle);

    const missingFields = Object.entries({'targetWidgetName': 'string'})
      .filter(([attr, expectedType]) => typeof widgetDecoratorDef[attr] !== expectedType);

    if (!['undefined', 'function'].includes(typeof widgetDecoratorDef.predicateFn)) {
      missingFields.push(['predicateFn', 'function?']);
    }

    if (!['undefined', 'function', 'number'].includes(typeof widgetDecoratorDef.weightFn)) {
      missingFields.push(['weightFn', '(function|number)?']);
    }

    if (!['object', 'function'].includes(typeof widgetDecoratorDef.component)) {
      missingFields.push(['component', '(object|function)?']);
    }

    if (missingFields.length) {
      console.log(`Widget decorator '${widgetDecoratorName}' is invalid due to missing or mismatched types for fields: ${JSON.stringify(missingFields)}`, widgetDecoratorDef);
      return;
    }

    let providedPredicateFn = widgetDecoratorDef.predicateFn;
    if (!providedPredicateFn) {
      providedPredicateFn = () => true
    }

    // Decorate the predicate function to make the widget decorators automatically filtered by targetWidgetName
    widgetDecoratorDef.predicateFn = (context) =>
      context.widgetName === widgetDecoratorDef.targetWidgetName && providedPredicateFn(context);

    const providedWeightFn = widgetDecoratorDef.weightFn;
    // If no weight was provided, use the default of 100
    if (providedWeightFn === undefined) {
      widgetDecoratorDef.weightFn = () => 100;
    }
    // If the weight is a constant number, wrap it in a function that returns that number
    else if (typeof providedWeightFn === 'number') {
      widgetDecoratorDef.weightFn = () => providedWeightFn;
    }

    this._setAttributedDefinition('definedWidgetDecorators', widgetDecoratorName, widgetDecoratorDef);
  }

  definePluginIngestor(pluginIngestorDefiner) {
    if (this._onLoadDone) {
      throw new Error("Plugin ingestors must be defined synchronously.");
    }
    if (this._pluginInstance !== this._attributedTo) {
      throw new Error("Plugin ingestors cannot be attributed to other plugins.");
    }
    if (this._pluginInstance.definedPluginIngestor) {
      throw new Error("Plugin ingestor already defined. Plugins cannot define multiple plugin ingestors.");
    }

    const ingestorDef = {};

    const ingestorHandle = {
        onEveryPlugin(ingestorFn) {
          ingestorDef.ingestorFn = ingestorFn;
        },
        // TODO: Consider allowing ingestors to react to plugin unloading
    };

    pluginIngestorDefiner(ingestorHandle);

    const missingFields = Object.entries({'ingestorFn': 'function'})
      .filter(([attr, expectedType]) => typeof ingestorDef[attr] !== expectedType);

    if (missingFields.length) {
      console.log(`Plugin ingestor is invalid due to missing or mismatched types for fields: ${JSON.stringify(missingFields)}`, ingestorDef);
      return;
    }

    this._pluginInstance.definedPluginIngestor = ingestorDef;
  }

  onBehalfOf(otherPlugin, attributedHandlerFn) {
    if (this._pluginInstance !== this._attributedTo) {
      throw new Error("Plugins may only act on behalf of eachother directly - e.g. onBehalfOf blocks cannot be nested.");
    }

    const attributedHandle = new AssetLinkPluginHandle(this._pluginInstance, this._vm, this._eventBus, otherPlugin);

    attributedHandlerFn(attributedHandle);
  }

  recordError(errorString) {
    if (!this._pluginInstance.attributedErrors[this._attributedTo.pluginUrl.toString()]) {
      this._pluginInstance.attributedErrors[this._attributedTo.pluginUrl.toString()] = [];
    }

    this._pluginInstance.attributedErrors[this._attributedTo.pluginUrl.toString()].push(errorString);
  }

  provideLibrary(libraryName, libraryProviderFn) {
    if (this._onLoadDone) {
      throw new Error("Plugin provided libraries must be defined synchronously. Consider specifying a Promise as the libraryObject instead.");
    }

    const providedLibraryDef = { libraryName };

    const libraryProvisionHandle = {
        version(rawLibraryVersion) {
          providedLibraryDef.rawLibraryVersion = rawLibraryVersion;
        },
        provides(libraryObject) {
          providedLibraryDef.libraryObject = markRaw(libraryObject);
        },
    };

    libraryProviderFn(libraryProvisionHandle);

    const libraryVersionStr = providedLibraryDef.rawLibraryVersion || '0.0.1-alpha.1';

    const libraryIdentifier = `${libraryName}:${libraryVersionStr}`;

    if (!semverValid(libraryVersionStr)) {
      throw new Error(`Invalid semantic version: '${libraryIdentifier}'`);
    }

    const libraryVersion = semverParse(libraryVersionStr);

    if (!Object.hasOwn(providedLibraryDef, 'libraryObject')) {
      throw new Error("Plugin provided libraries must provide a libraryObject.");
    }

    const libraryObject = providedLibraryDef.libraryObject;

    this._setAttributedDefinition('providedLibraries', libraryIdentifier, {
      libraryIdentifier,
      libraryName,
      libraryVersion,
      libraryObject,
    });
  }

  _setAttributedDefinition(defType, defKey, defValue) {
    if (!this._pluginInstance[defType][this._attributedTo.pluginUrl.toString()]) {
      this._pluginInstance[defType][this._attributedTo.pluginUrl.toString()] = {};
    }

    this._pluginInstance[defType][this._attributedTo.pluginUrl.toString()][defKey] = defValue;
  }

}

// More backwards compatible alternative to `Blob::arrayBuffer()`
const blobToArrayBuffer = blob => {
  // Work-around 'fetch-blob' not being compatible with FileReader in NodeJS environment
  if (typeof blob.arrayBuffer === 'function') {
    return blob.arrayBuffer();
  }
  // TODO: Reject on failures? (possible?)
  return new Promise((resolve, reject) => {
    // Copied from https://stackoverflow.com/a/15981017/1864479
    const fileReader = new FileReader();
    fileReader.onload = function(event) {
        resolve(event.target.result);
    };
    fileReader.readAsArrayBuffer(blob);
  });
}

//Copied from https://github.com/vuetifyjs/vuetify-loader/blob/9c828d72354d5c37ec97eb58badb9e164451e802/lib/util.js#L6-L18
const hyphenateRE = /\B([A-Z])/g
const hyphenate = str => {
  return str.replace(hyphenateRE, '-$1').toLowerCase()
}
