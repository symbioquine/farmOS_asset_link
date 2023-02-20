import { markRaw, reactive } from 'vue';

import { loadModule } from 'vue3-sfc-loader/dist/vue3-sfc-loader.esm.js';
import { parseComponent } from 'vue-template-compiler';

import fetch from 'cross-fetch';

import VuePluginShorthandDecorator from '@/VuePluginShorthandDecorator';
import { default as pluginModuleLibrary, pluginModuleLibraryNames } from '@/pluginModuleLibrary';

import { createDrupalUrl, currentEpochSecond, EventBus, uuidv4 } from "assetlink-plugin-api";

const PLUGIN_DATA_URL_PREFIX = "data:application/javascript;base64,";

export default class AssetLinkPluginLoaderCore {

  constructor(assetLink) {
    this._assetLink = assetLink;
    this._store = assetLink._store;
    this._connectionStatus = assetLink._connectionStatus;
    this._devToolsApi = assetLink._devToolsApi;

    this._vm = reactive({
      plugins: [],
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

      rawPluginSource = atob(pluginData.substring(PLUGIN_DATA_URL_PREFIX.length));

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

        const options = {
          moduleCache: this.moduleCache,
          compiledCache: {
            set: (key, str) => this._store.setItem(`asset-link-cached-compiled-plugin:${key}`, str),
            get: (key) => this._store.getItem(`asset-link-cached-compiled-plugin:${key}`),
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

            if (this.moduleCache[relPath] === undefined) {
              throw new Error(`Unsupported import '${relPath}'. Supported libraries:` + JSON.stringify(pluginModuleLibraryNames));
            }

            return relPath;
          },
          async getFile(url) {
            const fileUrl = new URL(url);

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

        pluginInstance = await loadModule(pluginUrlWithoutParams, options);

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
    plugin.definedRoutes = reactive({});
    plugin.definedSlots = reactive({});
    plugin.definedWidgetDecorators = reactive({});
    plugin.definedPluginIngestor = undefined;
    plugin.attributedErrors = reactive({});

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
      };
      onLoadObserver();

      handle._onLoadDone = true;
    }

    this.vm.plugins.forEach(p => {
      if (p !== plugin && p.definedPluginIngestor) {
        // TODO: Catch errors
        p.definedPluginIngestor.ingestorFn(plugin);
      }
      if (p !== plugin && plugin.definedPluginIngestor) {
        plugin.definedPluginIngestor.ingestorFn(p);
      }
    });
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

    const pluginStyles = document.head.querySelectorAll(`style[data-alink-style-plugin-id="${plugin.occurrenceId}"]`) || [];
    pluginStyles.forEach(e => e.parentNode.removeChild(e));

    if (pluginIdx !== -1) {
      this.vm.plugins.splice(pluginIdx, 1);
    }

    this.vm.plugins.forEach(otherPlugin => {
      ['definedRoutes', 'definedSlots', 'definedWidgetDecorators', 'attributedErrors'].forEach(attributedKey => {
        if (otherPlugin[attributedKey]) {
          delete otherPlugin[attributedKey][pluginUrl.toString()];
        }
      });
    });
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

    const pluginSrc = await pluginSrcRes.text();

    const pluginDataUrl = PLUGIN_DATA_URL_PREFIX + btoa(pluginSrc);

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

  _setAttributedDefinition(defType, defKey, defValue) {
    if (!this._pluginInstance[defType][this._attributedTo.pluginUrl.toString()]) {
      this._pluginInstance[defType][this._attributedTo.pluginUrl.toString()] = {};
    }

    this._pluginInstance[defType][this._attributedTo.pluginUrl.toString()][defKey] = defValue;
  }

}

//Copied from https://github.com/vuetifyjs/vuetify-loader/blob/9c828d72354d5c37ec97eb58badb9e164451e802/lib/util.js#L6-L18
const camelizeRE = /-(\w)/g
const camelize = str => {
  return str.replace(camelizeRE, (_, c) => c ? c.toUpperCase() : '')
}

const capitalize = str => {
  return str.charAt(0).toUpperCase() + str.slice(1)
}

const hyphenateRE = /\B([A-Z])/g
const hyphenate = str => {
  return str.replace(hyphenateRE, '-$1').toLowerCase()
}
