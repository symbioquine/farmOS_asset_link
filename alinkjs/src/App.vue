<template>
  <q-layout view="lHh Lpr lFf">
    <q-header elevated>
      <q-toolbar class="bg-green text-white">

        <q-toolbar-title>
          Asset Link <test-component></test-component>
        </q-toolbar-title>

        <farmos-sync-icon @click.stop="$refs.syncTray.toggle()"></farmos-sync-icon>
      </q-toolbar>
    </q-header>

    <farmos-sync-tray ref="syncTray"></farmos-sync-tray>

    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script>
import { defineComponent, defineAsyncComponent } from 'vue'
import * as Vue from 'vue';

import {
    posix as Path
} from 'path';

import { loadModule } from 'vue3-sfc-loader/dist/vue3-sfc-loader.esm.js';

import * as Babel from '@babel/standalone/babel.js';

import {
    parse as babelParse,
} from '@babel/parser';

import {
    traverse as babelTraverse,
    types as babelTypes,
} from '@babel/core';

const TestComponent = defineAsyncComponent(async () => {
  const pluginPath = '/alink-plugins/Example2.alink.js';

  const pluginUrl = new URL(pluginPath, import.meta.url).href;

  const pluginSrcRes = await fetch(pluginUrl);

  const pluginSrc = await pluginSrcRes.text();

  const options = {
    moduleCache: {
        vue: Vue,
        'asset-link/utils': {
          color: () => 'yellow',
        },
    },
    getFile: () => ({ getContentData: () => pluginSrc, type: ".mjs" }),
    addStyle: () => {},
  }

  const m = await loadModule('/alink-plugins/Example.alink.vue', options);

  console.log("m:", m, );

  return m;
});

/**
 * @internal
 */
export function parseDeps(fileAst) {
    const requireList = [];

    babelTraverse(fileAst, {
        ImportDeclaration(path) {
            requireList.push(path.node.source.value);
        },
        CallExpression(path) {
            if (
                   // @ts-ignore (Property 'name' does not exist on type 'ArrayExpression')
                   path.node.callee.name === 'require'
                && path.node.arguments.length === 1
                && babelTypes.isStringLiteral(path.node.arguments[0])
            ) {
                requireList.push(path.node.arguments[0].value)
            }
        }
    });

    return requireList;
}

/**
 * Default resolve implementation
 * resolve() should handle 3 situations :
 *  - resolve a relative path ( eg. import './details.vue' )
 *  - resolve an absolute path ( eg. import '/components/card.vue' )
 *  - resolve a module name ( eg. import { format } from 'date-fns' )
 */
const defaultPathResolve = ({ refPath, relPath }) => {
    // initial resolution: refPath is not defined
    if ( refPath === undefined )
        return relPath;

    const relPathStr = relPath.toString();

    // is non-relative path ?
    if ( relPathStr[0] !== '.' ) {
        return relPath;
    }

    // note :
    //  normalize('./test') -> 'test'
    //  normalize('/test') -> '/test'

    return Path.normalize(Path.join(Path.dirname(refPath.toString()), relPathStr));
}

/**
 * Default getResource implementation
 * by default, getContent() use the file extension as file type.
 */
function defaultGetResource(pathCx, options) {
    const { pathResolve, getFile, log } = options;
    const path = pathResolve(pathCx);
    const pathStr = path.toString();
    return {
        id: pathStr,
        path: path,
        getContent: async () => {

            const res = await getFile(path);

            if ( typeof res === 'string' || res instanceof ArrayBuffer ) {

                return {
                    type: Path.extname(pathStr),
                    getContentData: async (asBinary) => {

                        if ( res instanceof ArrayBuffer !== asBinary )
                            log?.('warn', `unexpected data type. ${ asBinary ? 'binary' : 'string' } is expected for "${ path }"`);
                        
                        return res;
                    },
                }
            }

            return {
                type: res.type ?? Path.extname(pathStr),
                getContentData: res.getContentData,
            }
        }
    };
}

/**
 * @internal
 */
class Loading {
  constructor(promise) {
    this.promise = promise;
  }
}

async function loadModuleInternal(pathCx, options) {

    const { moduleCache, loadModule, handleModule } = options;

    const { id, path, getContent } = options.getResource(pathCx, options);

    if ( moduleCache[id] === undefined ) {
      if ( moduleCache[id].promise instanceof Promise ) {
        return await moduleCache[id].promise;
      } else {
        return moduleCache[id];
      }
    }

    moduleCache[id] = new Loading((async () => {
        if ( loadModule ) {
          const module = await loadModule(id, options);
          if ( module !== undefined ) {
            return moduleCache[id] = module;
          }
        }

        const { getContentData, type } = await getContent();

        // note: null module is accepted
        let module = undefined;

        if ( handleModule !== undefined ) {
          module = await handleModule(type, getContentData, path, options);
        }

        if ( module === undefined ) {
          module = await defaultHandleModule(type, getContentData, path, options);
        }

        if ( module === undefined ) {
          throw new TypeError(`Unable to handle ${ type } files (${ path })`);
        }

        return moduleCache[id] = module;
    })());

    return await moduleCache[id].promise;
}

/**
 * Create a cjs module
 * @internal
 */
function createCJSModule(refPath, source, options) {
    const { moduleCache, pathResolve, getResource } = options;

    const require = function(relPath) {
      const { id } = getResource({ refPath, relPath }, options);
      if (moduleCache[id]) {
        return moduleCache[id];
      }

      throw new Error(`require(${ JSON.stringify(id) }) failed. module not found in moduleCache`);
    };

    const importFunction = async function(relPath) {
      return await loadModuleInternal({ refPath, relPath }, options);
    };

    const module = {
        exports: {}
    };

    // see https://github.com/nodejs/node/blob/a46b21f556a83e43965897088778ddc7d46019ae/lib/internal/modules/cjs/loader.js#L195-L198
    // see https://github.com/nodejs/node/blob/a46b21f556a83e43965897088778ddc7d46019ae/lib/internal/modules/cjs/loader.js#L1102
    Function('exports', 'require', 'module', '__filename', '__dirname', 'import__', source)
        .call(module.exports, module.exports, require, module, refPath, pathResolve({ refPath, relPath: '.' }), importFunction);

    return module;
}

/**
 * import is a reserved keyword, then rename
 * @internal
 */
export function renameDynamicImport(fileAst) {
  babelTraverse(fileAst, {
    CallExpression(path) {
      if ( babelTypes.isImport(path.node.callee) ) {
        path.replaceWith(babelTypes.callExpression(babelTypes.identifier('import__'), path.node.arguments));
      }
    }
  });
}

/**
 * @internal
 */
function interopRequireDefault(obj) {
  return obj && obj.__esModule ? obj : { default: obj };
}

const loadJsPlugin = async () => {
  const pluginPath = '/alink-plugins/Example2.alink.js';

  const pluginUrl = new URL(pluginPath, import.meta.url).href;

  const pluginSrcRes = await fetch(pluginUrl);

  const pluginSrc = await pluginSrcRes.text();

  const pluginAst = babelParse(pluginSrc, { sourceType: 'module' });

  console.log("pluginAst:", pluginAst);

  renameDynamicImport(pluginAst);
  const depsList = parseDeps(pluginAst);
  console.log("depsList:", depsList);

  const transformedPluginSrc = Babel.transformFromAst(pluginAst, pluginSrc, { presets: ['env'] });

  console.log("transformedPluginSrc.code:", transformedPluginSrc.code);

  const options = {
    moduleCache: {
        vue: Vue,
        'asset-link/utils': {
          color: () => 'yellow',
        },
    },
    pathResolve: defaultPathResolve,
    getResource: defaultGetResource,
  };

  const pluginModule = interopRequireDefault(createCJSModule(pluginPath, transformedPluginSrc.code, options));

  console.log("pluginModule:", pluginModule);

  // const pluginDataUrl = "data:application/javascript;base64," + btoa(transformedPluginSrc.code);
  // 
  // const pluginDefaultExport = (await import(/* @vite-ignore */ pluginDataUrl)).default;
  // 
  // console.log("pluginDefaultExport:", pluginDefaultExport);
};

// loadJsPlugin();

if (import.meta.hot) {
  import.meta.hot.on('asset-link-plugin-changed', (data) => {
    const pluginChangedEvent = new CustomEvent('asset-link-plugin-changed', {
      detail: {
        pluginUrl: data.pluginUrl,
      },
    });

    window.dispatchEvent(pluginChangedEvent);
  })
}

export default defineComponent({
  name: 'App',
  components: {
    TestComponent,
  },
  setup () {
    return {
    }
  }
})
</script>
