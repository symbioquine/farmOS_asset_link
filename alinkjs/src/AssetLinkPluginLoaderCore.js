import * as Vue from 'vue';
import * as Quasar from 'quasar';
import { reactive } from 'vue';

import { v4 as uuidv4 } from 'uuid';
import EventBus from '@/util/EventBus';

import { loadModule } from 'vue3-sfc-loader/dist/vue3-sfc-loader.esm.js';

import currentEpochSecond from '@/util/currentEpochSecond';

export default class AssetLinkPluginLoaderCore {

  constructor(assetLink) {
    this._assetLink = assetLink;
    this._store = assetLink._store;

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

  async loadPlugin(pluginUrl, opts) {
    const options = opts || {};

    const startTime = performance.now();

    let pluginInstance = undefined;

    try {
      const pluginDataUrl = await this._fetchPlugin(pluginUrl, options);

      const rawPluginSource = await fetch(pluginDataUrl).then(r => r.text());

      if (pluginUrl.pathname.endsWith('alink.js') || pluginUrl.pathname.endsWith('alink.vue')) {
        const pluginUrlWithoutParams = new URL(pluginUrl.toString());
        pluginUrlWithoutParams.search = '';

        // const vuetify = await import('vuetify/lib');

        const vuetifyComponents = {};
        const vuetifyDirectives = {};

        // Object.entries(vuetify).forEach(([entryName, entry]) => {
        //   if (Object.prototype.hasOwnProperty.call(entry, 'component')) {
        //     vuetifyComponents[entryName] = entry;
        //   } else if (['bind', 'inserted', 'update', 'componentUpdated', 'unbind'].find(directiveHook => Object.prototype.hasOwnProperty.call(entry, directiveHook))) {
        //     vuetifyDirectives[entryName] = entry;
        //   }
        // });

        let rawPluginFileData = await fetch(pluginDataUrl).then(r => r.text());

        // Roughly based on https://harlanzw.com/blog/vue-automatic-component-imports/
        // and https://github.com/vuetifyjs/vuetify-loader/blob/9c828d72354d5c37ec97eb58badb9e164451e802/lib/loader.js#L110-L144
        // const compiler = await import('vue-template-compiler');

        const tags = new Set()
        const attrs = new Set()
        // const component = compiler.parseComponent(rawPluginFileData);

        // if (component.errors.length > 0) {
        //   throw new Error(`Could not parse component plugin: ${component.errors.join('\n')}`);
        // }

        // if (component.template) {
        //   if (component.template.src) {
        //     throw new Error(`External component template content is not supported.`);
        //   }
        //   compiler.compile(component.template.content, {
        //     modules: [{
        //       postTransformNode: node => {
        //         if ("directives" in node) {
        //           node.directives.forEach(({ name }) => attrs.add(name))
        //         }
        //         tags.add(node.tag)
        //       }
        //     }]
        //   });
        // }

        /* eslint-disable no-unused-vars */
        // const usedVuetifyTags = Array.from(tags).map(item => [hyphenate(item), capitalize(camelize(item))])
        //   .filter(([kebabTag, camelTag]) => kebabTag.startsWith('v-') && Object.prototype.hasOwnProperty.call(vuetifyComponents, camelTag))
        //   .map(([kebabTag, camelTag]) => [camelTag, vuetifyComponents[camelTag]]);
        // 
        // const usedVuetifyDirectives = Array.from(attrs).map(item => capitalize(camelize(item)))
        //   .filter(camelAttr => Object.prototype.hasOwnProperty.call(vuetifyDirectives, camelAttr))
        //   .map(camelAttr => [camelAttr, vuetifyDirectives[camelAttr]]);

        if (!this.moduleCache) {
          this.moduleCache = Object.assign(Object.create(null), {
            vue: Vue,
            'quasar': Quasar,

            // TODO: Figure out how to make loading these cleaner/on-demand
            // 'vue-codemirror': import('vue-codemirror'),
            // 'codemirror/mode/javascript/javascript.js': import('codemirror/mode/javascript/javascript.js'),
            // 'codemirror/mode/vue/vue.js': import('codemirror/mode/vue/vue.js'),
            // 'codemirror/lib/codemirror.css': import('codemirror/lib/codemirror.css'),
            // 'codemirror/theme/base16-dark.css': import('codemirror/theme/base16-dark.css'),
          });
        }

        const options = {
          moduleCache: this.moduleCache,
          compiledCache: {
            set: (key, str) => this._store.setItem(`asset-link-cached-compiled-plugin:${key}`, str),
            get: (key) => this._store.getItem(`asset-link-cached-compiled-plugin:${key}`),
          },
          async getFile(url) {
            const fileUrl = new URL(url);

            const pluginSrcRes = await fetch(fileUrl);

            const pluginSrc = await pluginSrcRes.text();

            if (fileUrl.pathname.endsWith('alink.js')) {
              return { getContentData: () => pluginSrc, type: ".mjs" }
            } else if (fileUrl.pathname.endsWith('alink.vue')) {
              return { getContentData: () => pluginSrc, type: ".vue" }
            } else {
              throw new Error(`Secondary imports are not supported. url=${url}`);
            }
          },
          addStyle() {
            /* TODO: https://github.com/FranckFreiburger/vue3-sfc-loader/blob/80f10f9fd82d7dde6c8681d23d36e9ac3ab9a654/docs/examples.md?plain=1#L403-L453 */
          },
        };

        pluginInstance = await loadModule(pluginUrlWithoutParams, options);

        if (pluginUrl.pathname.endsWith('alink.js')) {
          pluginInstance = pluginInstance.default;
        }

        if (!pluginInstance.name) {
          //pluginInstance.name = `unnamed-sfc-plugin-${uuidv4()}`;
          const pluginFilename = pluginUrl.pathname.split('/').pop();
          const pluginBaseName = pluginFilename.split('.alink.')[0];
          pluginInstance.name = `${hyphenate(pluginBaseName)}-${uuidv4()}`;
        }

        // if (usedVuetifyTags.length && !pluginInstance.components) pluginInstance.components = {};
        // usedVuetifyTags.filter(t => !pluginInstance.components[t[0]]).forEach(t => pluginInstance.components[t[0]] = t[1]);
        // 
        // if (usedVuetifyDirectives.length && !pluginInstance.directives) pluginInstance.directives = {};
        // usedVuetifyDirectives.filter(t => !pluginInstance.directives[t[0]]).forEach(t => pluginInstance.directives[t[0]] = t[1]);

        // TODO: Determine if this is even necessary
        // this._assetLink.app.component(pluginInstance.name, pluginInstance);
      } else {
        pluginInstance = {};
      }

      pluginInstance.pluginUrl = pluginUrl;
      pluginInstance.rawSource = rawPluginSource;

      this.registerPlugin(pluginInstance);
    } catch (error) {
      console.log(error);
      pluginInstance = {};
      pluginInstance.pluginUrl = pluginUrl;
      pluginInstance.error = error;
      this.registerPlugin(pluginInstance);
    } finally {
      const endTime = performance.now();
      console.log(`Loading plugin ${pluginUrl} took ${endTime - startTime} milliseconds`);
    }
  }

  /**
   * Directly register a plugin with Asset Link. Note that plugins registered this way
   * will not persist between sessions/reloads.
   */
  registerPlugin(plugin) {
    plugin.definedRoutes = {};
    plugin.definedSlots = {};
    plugin.definedWidgetDecorators = {};
    plugin.definedPluginIngestor = undefined;
    plugin.attributedErrors = {};

    this.vm.plugins.push(plugin);

    // console.log(plugin);

    if (typeof plugin.onLoad === 'function') {
      const handle = new AssetLinkPluginHandle(plugin, this.vm, this._eventBus);

      plugin.onLoad(handle, this._assetLink);
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

    if (typeof plugin.onUnload === 'function') {
      plugin.onUnload(this._assetLink);
    }

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

    const skipCache = options.skipCache || (url.searchParams && url.searchParams.get('skipCache'));

    const cacheKey = `asset-link-cached-plugin-src:${url}`;

    const cacheItem = await this._store.getItem(cacheKey);

    const timestamp = currentEpochSecond();

    if (!skipCache && cacheItem && (timestamp - cacheItem.timestamp) < 900) {
      return cacheItem.value;
    }

    const pluginSrcRes = await fetch(url);

    if (!pluginSrcRes.ok) {
      throw new Error(`HTTP Error ${pluginSrcRes.status}: ${pluginSrcRes.statusText}`);
    }

    const pluginSrc = await pluginSrcRes.text();

    const pluginDataUrl = "data:application/javascript;base64," + btoa(pluginSrc);

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
          routeDef.component = component;
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
          slotDef.component = component;
        },
    };

    slotDefiner(slotHandle);

    let missingFields = Object.entries({'type': 'string', 'predicateFn': 'function'})
      .filter(([attr, expectedType]) => typeof slotDef[attr] !== expectedType);

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

    const providedPredicateFn = slotDef.predicateFn;

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
          widgetDecoratorDef.component = component;
        },
    };

    widgetDecoratorDefiner(widgetDecoratorHandle);

    const missingFields = Object.entries({'targetWidgetName': 'string', 'predicateFn': 'function'})
      .filter(([attr, expectedType]) => typeof widgetDecoratorDef[attr] !== expectedType);

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

    const providedPredicateFn = widgetDecoratorDef.predicateFn;

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
