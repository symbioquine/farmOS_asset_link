import Vue from 'vue';

import { v4 as uuidv4 } from 'uuid';

import { loadModule } from 'vue3-sfc-loader/dist/vue2-sfc-loader.esm.js';

import currentEpochSecond from '@/util/currentEpochSecond';

export default class AssetLinkPluginLoaderCore {

  constructor(assetLink) {
    this._assetLink = assetLink;
    this._store = assetLink._store;

    this._vm = new Vue({
      data: {
        plugins: [],
      },
    });
  }

  /**
   * A {Vue} instance used to expose some of this core's state to
   * the UI in a reactive way.
   */
  get vm() {
    return this._vm;
  }

  async boot() {
    // TODO: ?
  }

  async loadPlugin(pluginUrl, opts) {
    const options = opts || {};

    const startTime = performance.now();

    let pluginInstance = undefined;

    try {
      let pluginDataUrl = await this._fetchPlugin(pluginUrl, options);

      if (pluginUrl.pathname.endsWith('alink.js')) {
        const pluginCls = (await import(/* webpackIgnore: true */ pluginDataUrl)).default;
        pluginInstance = new pluginCls();
      } else if (pluginUrl.pathname.endsWith('alink.vue')) {
        const pluginUrlWithoutParams = new URL(pluginUrl.toString());
        pluginUrlWithoutParams.search = '';

        const vuetify = await import('vuetify/lib');

        const vuetifyComponents = {};
        const vuetifyDirectives = {};

        Object.entries(vuetify).forEach(([entryName, entry]) => {
          if (Object.prototype.hasOwnProperty.call(entry, 'component')) {
            vuetifyComponents[entryName] = entry;
          } else if (['bind', 'inserted', 'update', 'componentUpdated', 'unbind'].find(directiveHook => Object.prototype.hasOwnProperty.call(entry, directiveHook))) {
            vuetifyDirectives[entryName] = entry;
          }
        });

        let rawPluginFileData = await fetch(pluginDataUrl).then(r => r.text());

        // Roughly based on https://harlanzw.com/blog/vue-automatic-component-imports/
        // and https://github.com/vuetifyjs/vuetify-loader/blob/9c828d72354d5c37ec97eb58badb9e164451e802/lib/loader.js#L110-L144
        const compiler = await import('vue-template-compiler');

        const tags = new Set()
        const attrs = new Set()
        const component = compiler.parseComponent(rawPluginFileData);

        if (component.errors.length > 0) {
          throw new Error(`Could not parse component plugin: ${component.errors.join('\n')}`);
        }

        if (component.template) {
          if (component.template.src) {
            throw new Error(`External component template content is not supported.`);
          }
          compiler.compile(component.template.content, {
            modules: [{
              postTransformNode: node => {
                if ("directives" in node) {
                  node.directives.forEach(({ name }) => attrs.add(name))
                }
                tags.add(node.tag)
              }
            }]
          });
        }

        /* eslint-disable no-unused-vars */
        const usedVuetifyTags = Array.from(tags).map(item => [hyphenate(item), capitalize(camelize(item))])
          .filter(([kebabTag, camelTag]) => kebabTag.startsWith('v-') && Object.prototype.hasOwnProperty.call(vuetifyComponents, camelTag))
          .map(([kebabTag, camelTag]) => [camelTag, vuetifyComponents[camelTag]]);

        const usedVuetifyDirectives = Array.from(attrs).map(item => capitalize(camelize(item)))
          .filter(camelAttr => Object.prototype.hasOwnProperty.call(vuetifyDirectives, camelAttr))
          .map(camelAttr => [camelAttr, vuetifyDirectives[camelAttr]]);

        if (!this.moduleCache) {
          this.moduleCache = Object.assign(Object.create(null), {
            vue: Vue,
            'vuetify/lib': vuetify,

            // TODO: Figure out how to make loading these cleaner/on-demand
            'vue-codemirror': import('vue-codemirror'),
            'codemirror/mode/javascript/javascript.js': import('codemirror/mode/javascript/javascript.js'),
            'codemirror/mode/vue/vue.js': import('codemirror/mode/vue/vue.js'),
            'codemirror/lib/codemirror.css': import('codemirror/lib/codemirror.css'),
            'codemirror/theme/base16-dark.css': import('codemirror/theme/base16-dark.css'),
          });
        }

        const options = {
          moduleCache: this.moduleCache,
          compiledCache: {
            set: (key, str) => this._store.setItem(`asset-link-cached-compiled-plugin:${key}`, str),
            get: (key) => this._store.getItem(`asset-link-cached-compiled-plugin:${key}`),
          },
          async getFile(url) {
            if ( url === pluginUrlWithoutParams ) {
              return rawPluginFileData;
            } else {
              throw new Error(`Secondary imports are not supported. url=${url}`);
            }
          },
          addStyle() { /* TODO */ },
        };

        pluginInstance = await loadModule(pluginUrlWithoutParams, options);

        if (!pluginInstance.name) {
          pluginInstance.name = `unnamed-sfc-plugin-${uuidv4()}`;
        }

        if (usedVuetifyTags.length && !pluginInstance.components) pluginInstance.components = {};
        usedVuetifyTags.filter(t => !pluginInstance.components[t[0]]).forEach(t => pluginInstance.components[t[0]] = t[1]);

        if (usedVuetifyDirectives.length && !pluginInstance.directives) pluginInstance.directives = {};
        usedVuetifyDirectives.filter(t => !pluginInstance.directives[t[0]]).forEach(t => pluginInstance.directives[t[0]] = t[1]);

        Vue.component(pluginInstance.name, pluginInstance);
      } else {
        throw new Error(`Cannot load plugin ${pluginUrl} with unsupported type. Path of url must end in '.alink.js' or '.alink.vue'`);
      }

      pluginInstance.pluginUrl = pluginUrl;

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

    this.vm.plugins.push(plugin);

    if (typeof plugin.onLoad === 'function') {
      const handle = new AssetLinkPluginHandle(plugin, this.vm);

      plugin.onLoad(handle, this._assetLink);
    }
  }

  async unloadPlugin(pluginUrl) {
    const pluginIdx = this.vm.plugins.findIndex(p => p.pluginUrl.toString() === pluginUrl.toString());

    if (pluginIdx !== -1) {
      this.vm.plugins.splice(pluginIdx, 1);
    }
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

    const pluginSrc = await fetch(url).then(r => r.text());

    const pluginSrcWithSourceInfo = `${pluginSrc}\n//# sourceURL=asset-link-plugin:./${encodeURIComponent(url)}\n`;

    const pluginDataUrl = "data:application/javascript;base64," + btoa(pluginSrcWithSourceInfo);

    await this._store.setItem(cacheKey, {key: cacheKey, timestamp, value: pluginDataUrl});

    return pluginDataUrl;
  }

}

class AssetLinkPluginHandle {

  constructor(pluginInstance, vm) {
    this._pluginInstance = pluginInstance;
    this._vm = vm;
  }

  get thisPlugin() {
    return this._pluginInstance;
  }

  defineRoute(routeName, routeDefiner) {
    const routeDef = {name: routeName};

    const routeHandle = {
        path(path) {
          routeDef.path = path;
        },
        componentFn(componentFn) {
          routeDef.componentFn = componentFn;
        },
    };

    routeDefiner(routeHandle);

    const missingFields = Object.entries({'path': 'string', 'componentFn': 'function'})
      .filter(([attr, expectedType]) => typeof routeDef[attr] !== expectedType);

    if (missingFields.length) {
      console.log(`Action '${routeName}' is invalid due to missing or mismatched types for fields: ${JSON.stringify(missingFields)}`, routeDef);
      return;
    }

    this._pluginInstance.definedRoutes[routeName] = routeDef;

    this._vm.$emit('add-route', routeDef);
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
        componentFn(componentFn) {
          slotDef.componentFn = componentFn;
        },
    };

    slotDefiner(slotHandle);

    const missingFields = Object.entries({'type': 'string', 'predicateFn': 'function', 'componentFn': 'function'})
      .filter(([attr, expectedType]) => typeof slotDef[attr] !== expectedType);

    if (missingFields.length) {
      console.log(`Slot '${slotName}' is invalid due to missing or mismatched types for fields: ${JSON.stringify(missingFields)}`, slotDef);
      return;
    }

    const providedPredicateFn = slotDef.predicateFn;

    // Decorate the predicate function to make the slots automatically filtered by type
    slotDef.predicateFn = (context) => context.type === slotDef.type && providedPredicateFn(context);

    this._pluginInstance.definedSlots[slotName] = slotDef;
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
        componentFn(componentFn) {
          widgetDecoratorDef.componentFn = componentFn;
        },
    };

    widgetDecoratorDefiner(widgetDecoratorHandle);

    const missingFields = Object.entries({'targetWidgetName': 'string', 'predicateFn': 'function', 'componentFn': 'function'})
      .filter(([attr, expectedType]) => typeof widgetDecoratorDef[attr] !== expectedType);

    if (missingFields.length) {
      console.log(`Widget decorator '${widgetDecoratorName}' is invalid due to missing or mismatched types for fields: ${JSON.stringify(missingFields)}`, widgetDecoratorDef);
      return;
    }

    const providedPredicateFn = widgetDecoratorDef.predicateFn;

    // Decorate the predicate function to make the widget decorators automatically filtered by targetWidgetName
    widgetDecoratorDef.predicateFn = (context) =>
      context.widgetName === widgetDecoratorDef.targetWidgetName && providedPredicateFn(context);

    this._pluginInstance.definedWidgetDecorators[widgetDecoratorName] = widgetDecoratorDef;
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
